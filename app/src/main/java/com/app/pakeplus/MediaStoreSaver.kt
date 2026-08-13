package com.app.pakeplus

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.webkit.JavascriptInterface
import android.widget.Toast
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * MediaStoreSaver — Native JavaScript Bridge for saving videos to Android system gallery.
 *
 * Registered in MainActivity.kt via:
 *   webView.addJavascriptInterface(MediaStoreSaver(this), "AndroidMediaStore")
 *
 * JavaScript calls:
 *   - window.AndroidMediaStore.saveVideo(base64Data, fileName)          // small files < 20MB
 *   - window.AndroidMediaStore.startChunkedSave(fileName, mimeType)      // returns sessionId
 *   - window.AndroidMediaStore.appendChunk(sessionId, base64Chunk)       // returns boolean
 *   - window.AndroidMediaStore.finalizeChunkedSave(sessionId)            // returns boolean
 *   - window.AndroidMediaStore.cancelChunkedSave(sessionId)
 *
 * Uses Android MediaStore API — NO WRITE_EXTERNAL_STORAGE needed on Android 10+.
 * Chunked transfer avoids OOM by splitting large blobs into 2MB pieces.
 */
class MediaStoreSaver(private val context: Context) {

    companion object {
        private const val TAG = "MediaStoreSaver"
        private const val CHUNK_SIZE = 2 * 1024 * 1024 // 2MB — matches JavaScript CHUNK_SIZE
    }

    // ===== Chunked save session management =====
    private data class ChunkSession(
        val fileName: String,
        val mimeType: String,
        val tempFile: File,
        val outputStream: FileOutputStream
    )

    private val sessions = ConcurrentHashMap<String, ChunkSession>()

    // ===== Simple save (for blobs < 20MB) =====

    /**
     * Saves a base64-encoded video directly to the system gallery via MediaStore.
     * Called by JavaScript for small files (< 20MB).
     *
     * @param base64Data Base64-encoded video data (with or without data URI prefix)
     * @param fileName   Target file name, e.g. "AI_video_12345.mp4"
     * @return true if saved successfully, false otherwise
     */
    @JavascriptInterface
    fun saveVideo(base64Data: String, fileName: String): Boolean {
        try {
            // Strip data URI prefix if present (e.g. "data:video/mp4;base64,AAAA...")
            val cleanBase64 = if (base64Data.contains(",")) {
                base64Data.substring(base64Data.indexOf(",") + 1)
            } else {
                base64Data
            }

            val videoBytes = Base64.decode(cleanBase64, Base64.NO_WRAP or Base64.URL_SAFE)
            val sizeMB = videoBytes.size / (1024.0 * 1024.0)

            android.util.Log.i(TAG, "saveVideo: $fileName, ${String.format("%.1f", sizeMB)}MB, ${videoBytes.size} bytes")

            return writeToMediaStore(videoBytes, fileName, getMimeType(fileName))
        } catch (e: Exception) {
            android.util.Log.e(TAG, "saveVideo error: ${e.message}", e)
            showToast("保存失败: ${e.message}")
            return false
        }
    }

    // ===== Chunked save (for blobs >= 20MB) =====

    /**
     * Starts a chunked save session. Creates a temp file to accumulate chunks.
     *
     * @param fileName Target file name, e.g. "AI_video_12345.mp4"
     * @param mimeType MIME type, e.g. "video/mp4"
     * @return Session ID string, or empty string on failure
     */
    @JavascriptInterface
    fun startChunkedSave(fileName: String, mimeType: String): String {
        try {
            val sessionId = UUID.randomUUID().toString()
            val tempFile = File(context.cacheDir, "chunked_save_${sessionId}.tmp")
            val outputStream = FileOutputStream(tempFile)

            sessions[sessionId] = ChunkSession(
                fileName = fileName,
                mimeType = mimeType.ifEmpty { getMimeType(fileName) },
                tempFile = tempFile,
                outputStream = outputStream
            )

            android.util.Log.i(TAG, "startChunkedSave: session=$sessionId, file=$fileName, mime=$mimeType")
            return sessionId
        } catch (e: Exception) {
            android.util.Log.e(TAG, "startChunkedSave error: ${e.message}", e)
            return ""
        }
    }

    /**
     * Appends a base64-encoded chunk to the session's temp file.
     *
     * @param sessionId   Session ID from startChunkedSave()
     * @param base64Chunk Base64-encoded chunk data (with or without data URI prefix)
     * @return true if chunk was written successfully, false on error
     */
    @JavascriptInterface
    fun appendChunk(sessionId: String, base64Chunk: String): Boolean {
        val session = sessions[sessionId] ?: run {
            android.util.Log.e(TAG, "appendChunk: session not found: $sessionId")
            return false
        }

        try {
            // Strip data URI prefix if present
            val cleanBase64 = if (base64Chunk.contains(",")) {
                base64Chunk.substring(base64Chunk.indexOf(",") + 1)
            } else {
                base64Chunk
            }

            val chunkBytes = Base64.decode(cleanBase64, Base64.NO_WRAP or Base64.URL_SAFE)
            session.outputStream.write(chunkBytes)
            session.outputStream.flush()

            android.util.Log.d(TAG, "appendChunk: session=$sessionId, ${chunkBytes.size} bytes")
            return true
        } catch (e: Exception) {
            android.util.Log.e(TAG, "appendChunk error: ${e.message}", e)
            return false
        }
    }

    /**
     * Finalizes the chunked save: closes the temp file and writes it to MediaStore.
     *
     * @param sessionId Session ID from startChunkedSave()
     * @return true if saved to gallery successfully, false on error
     */
    @JavascriptInterface
    fun finalizeChunkedSave(sessionId: String): Boolean {
        val session = sessions[sessionId] ?: run {
            android.util.Log.e(TAG, "finalizeChunkedSave: session not found: $sessionId")
            return false
        }

        try {
            // Close the output stream
            session.outputStream.flush()
            session.outputStream.close()

            val tempFile = session.tempFile
            val sizeMB = tempFile.length() / (1024.0 * 1024.0)

            android.util.Log.i(TAG, "finalizeChunkedSave: session=$sessionId, ${String.format("%.1f", sizeMB)}MB, file=${session.fileName}")

            if (!tempFile.exists() || tempFile.length() == 0L) {
                android.util.Log.e(TAG, "finalizeChunkedSave: temp file is empty or missing")
                cleanupSession(sessionId)
                return false
            }

            // Read temp file bytes and write to MediaStore
            val videoBytes = tempFile.readBytes()
            val success = writeToMediaStore(videoBytes, session.fileName, session.mimeType)

            // Cleanup
            cleanupSession(sessionId)

            if (success) {
                android.util.Log.i(TAG, "finalizeChunkedSave: ✅ SUCCESS — ${session.fileName}")
            } else {
                android.util.Log.e(TAG, "finalizeChunkedSave: ❌ FAILED — ${session.fileName}")
            }

            return success
        } catch (e: Exception) {
            android.util.Log.e(TAG, "finalizeChunkedSave error: ${e.message}", e)
            cleanupSession(sessionId)
            return false
        }
    }

    /**
     * Cancels a chunked save session and cleans up the temp file.
     *
     * @param sessionId Session ID from startChunkedSave()
     */
    @JavascriptInterface
    fun cancelChunkedSave(sessionId: String) {
        android.util.Log.i(TAG, "cancelChunkedSave: session=$sessionId")
        cleanupSession(sessionId)
    }

    // ===== Core MediaStore write logic =====

    /**
     * Writes video bytes to the Android system gallery using MediaStore API.
     * Works on Android 10+ (scoped storage) and older versions.
     *
     * @param videoBytes Raw video byte array
     * @param fileName   Target file name
     * @param mimeType   MIME type (e.g. "video/mp4")
     * @return true on success, false on failure
     */
    private fun writeToMediaStore(videoBytes: ByteArray, fileName: String, mimeType: String): Boolean {
        var outputStream: OutputStream? = null

        try {
            val resolver = context.contentResolver
            val values = ContentValues().apply {
                put(MediaStore.Video.Media.DISPLAY_NAME, fileName)
                put(MediaStore.Video.Media.MIME_TYPE, mimeType)
                put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/AI成片")
                put(MediaStore.Video.Media.IS_PENDING, 1)
            }

            // Use MediaStore.Video.Media.EXTERNAL_CONTENT_URI for Android 10+
            val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
            } else {
                MediaStore.Video.Media.EXTERNAL_CONTENT_URI
            }

            val uri: Uri = resolver.insert(collection, values)
                ?: run {
                    android.util.Log.e(TAG, "writeToMediaStore: ContentResolver.insert returned null")
                    return false
                }

            outputStream = resolver.openOutputStream(uri)
            if (outputStream == null) {
                android.util.Log.e(TAG, "writeToMediaStore: openOutputStream returned null")
                resolver.delete(uri, null, null)
                return false
            }

            outputStream.write(videoBytes)
            outputStream.flush()

            // Mark as completed
            values.clear()
            values.put(MediaStore.Video.Media.IS_PENDING, 0)
            resolver.update(uri, values, null, null)

            android.util.Log.i(TAG, "writeToMediaStore: ✅ Saved ${videoBytes.size} bytes to $uri")
            showToast("✅ 视频已保存到相册: Movies/AI成片/$fileName")
            return true

        } catch (e: SecurityException) {
            android.util.Log.e(TAG, "writeToMediaStore: SecurityException — ${e.message}", e)
            showToast("保存失败: 需要存储权限")
            return false
        } catch (e: Exception) {
            android.util.Log.e(TAG, "writeToMediaStore error: ${e.message}", e)
            showToast("保存失败: ${e.message}")
            return false
        } finally {
            outputStream?.tryClose()
        }
    }

    // ===== Utility methods =====

    /**
     * Extracts MIME type from file extension.
     */
    private fun getMimeType(fileName: String): String {
        val ext = fileName.substringAfterLast('.', "").lowercase()
        return when (ext) {
            "mp4" -> "video/mp4"
            "webm" -> "video/webm"
            "mov" -> "video/quicktime"
            "avi" -> "video/x-msvideo"
            "mkv" -> "video/x-matroska"
            "3gp" -> "video/3gpp"
            else -> "video/mp4"
        }
    }

    /**
     * Cleans up a chunked save session: closes stream, deletes temp file, removes from map.
     */
    private fun cleanupSession(sessionId: String) {
        val session = sessions.remove(sessionId) ?: return
        try {
            session.outputStream.tryClose()
        } catch (_: Exception) {
        }
        try {
            if (session.tempFile.exists()) {
                session.tempFile.delete()
            }
        } catch (_: Exception) {
        }
    }

    /**
     * Shows a toast message on the UI thread.
     */
    private fun showToast(message: String) {
        try {
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
            }
        } catch (_: Exception) {
        }
    }

    /**
     * Extension to safely close an OutputStream.
     */
    private fun OutputStream.tryClose() {
        try {
            this.close()
        } catch (_: Exception) {
        }
    }
}
