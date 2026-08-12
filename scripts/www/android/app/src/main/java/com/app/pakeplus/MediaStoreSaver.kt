package com.app.pakeplus

import android.content.ContentResolver
import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.util.Log
import android.webkit.JavascriptInterface
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream
import java.util.UUID

/**
 * MediaStoreSaver — 使用 Android MediaStore API 将视频/图片保存到系统相册。
 *
 * 这是 Android 13+ (API 33+) 上保存媒体文件到相册的唯一稳定方案，
 * 因为 WRITE_EXTERNAL_STORAGE 在 Android 13+ 已被废弃。
 *
 * JavaScript 调用方式：
 *
 * 方式一（小文件 < 20MB，直接 base64）：
 *   window.AndroidMediaStore.saveVideo(base64Data, "video_001.mp4")
 *
 * 方式二（大文件 >= 20MB，分块传输，避免 OOM）：
 *   var sessionId = window.AndroidMediaStore.startChunkedSave("video_001.mp4", "video/mp4")
 *   window.AndroidMediaStore.appendChunk(sessionId, base64Chunk1)
 *   window.AndroidMediaStore.appendChunk(sessionId, base64Chunk2)
 *   ...
 *   var success = window.AndroidMediaStore.finalizeChunkedSave(sessionId)
 *
 * base64Data 不应包含 "data:...;base64," 前缀。
 */
class MediaStoreSaver(private val context: Context) {

    companion object {
        private const val TAG = "MediaStoreSaver"
        private const val CHUNK_SIZE = 2 * 1024 * 1024 // 2MB per chunk
    }

    // 分块传输会话
    data class ChunkSession(
        val tempFile: File,
        val fileName: String,
        val mimeType: String,
        val isImage: Boolean
    )

    private val sessions = mutableMapOf<String, ChunkSession>()

    /**
     * 保存视频到系统相册（小文件方式，直接传 base64）。
     * @param base64Data Base64 编码的视频数据（不含 data: 前缀）
     * @param fileName 文件名（含扩展名，如 "video_001.mp4"）
     * @return true 成功，false 失败
     */
    @JavascriptInterface
    fun saveVideo(base64Data: String, fileName: String): Boolean {
        return try {
            saveMedia(base64Data, fileName, "video/mp4", false)
        } catch (e: Exception) {
            Log.e(TAG, "saveVideo error", e)
            false
        }
    }

    /**
     * 保存图片到系统相册（小文件方式，直接传 base64）。
     * @param base64Data Base64 编码的图片数据（不含 data: 前缀）
     * @param fileName 文件名（含扩展名，如 "image_001.jpg"）
     * @return true 成功，false 失败
     */
    @JavascriptInterface
    fun saveImage(base64Data: String, fileName: String): Boolean {
        return try {
            var mimeType = "image/jpeg"
            val lower = fileName.lowercase()
            when {
                lower.endsWith(".png") -> mimeType = "image/png"
                lower.endsWith(".webp") -> mimeType = "image/webp"
            }
            saveMedia(base64Data, fileName, mimeType, true)
        } catch (e: Exception) {
            Log.e(TAG, "saveImage error", e)
            false
        }
    }

    /**
     * 开始分块保存会话（用于大文件）。
     * 在 JS 端将 blob 分成 2MB 的 chunk，逐个调用 appendChunk。
     * @param fileName 文件名（含扩展名）
     * @param mimeType MIME 类型（如 "video/mp4"）
     * @return sessionId 会话 ID，失败返回空字符串
     */
    @JavascriptInterface
    fun startChunkedSave(fileName: String, mimeType: String): String {
        return try {
            val isImage = mimeType.startsWith("image/")
            val sessionId = UUID.randomUUID().toString()
            val tempFile = File(context.cacheDir, "chunked_save_${sessionId}.tmp")
            sessions[sessionId] = ChunkSession(tempFile, fileName, mimeType, isImage)
            Log.i(TAG, "startChunkedSave: sessionId=$sessionId, file=$fileName, type=$mimeType")
            sessionId
        } catch (e: Exception) {
            Log.e(TAG, "startChunkedSave error", e)
            ""
        }
    }

    /**
     * 追加分块数据到临时文件。
     * @param sessionId startChunkedSave 返回的会话 ID
     * @param base64Chunk Base64 编码的数据块（不含 data: 前缀）
     * @return true 成功，false 失败
     */
    @JavascriptInterface
    fun appendChunk(sessionId: String, base64Chunk: String): Boolean {
        return try {
            val session = sessions[sessionId] ?: run {
                Log.e(TAG, "appendChunk: session not found: $sessionId")
                return false
            }
            val data = Base64.decode(base64Chunk, Base64.NO_WRAP)
            FileOutputStream(session.tempFile, true).use { fos ->
                fos.write(data)
            }
            Log.d(TAG, "appendChunk: +${data.size} bytes, total=${session.tempFile.length()}")
            true
        } catch (e: Exception) {
            Log.e(TAG, "appendChunk error", e)
            false
        }
    }

    /**
     * 完成分块保存：将临时文件写入 MediaStore 系统相册，然后删除临时文件。
     * @param sessionId startChunkedSave 返回的会话 ID
     * @return true 成功，false 失败
     */
    @JavascriptInterface
    fun finalizeChunkedSave(sessionId: String): Boolean {
        return try {
            val session = sessions.remove(sessionId) ?: run {
                Log.e(TAG, "finalizeChunkedSave: session not found: $sessionId")
                return false
            }
            if (!session.tempFile.exists() || session.tempFile.length() == 0L) {
                Log.e(TAG, "finalizeChunkedSave: temp file is empty or missing")
                session.tempFile.delete()
                return false
            }

            Log.i(TAG, "finalizeChunkedSave: ${session.fileName}, size=${session.tempFile.length()}")
            val success = saveFileToMediaStore(
                session.tempFile,
                session.fileName,
                session.mimeType,
                session.isImage
            )

            // 清理临时文件
            session.tempFile.delete()

            if (success) {
                Log.i(TAG, "✅ Chunked save success: ${session.fileName}")
            } else {
                Log.e(TAG, "❌ Chunked save failed: ${session.fileName}")
            }
            success
        } catch (e: Exception) {
            Log.e(TAG, "finalizeChunkedSave error", e)
            false
        }
    }

    /**
     * 取消分块保存会话，删除临时文件。
     * @param sessionId startChunkedSave 返回的会话 ID
     */
    @JavascriptInterface
    fun cancelChunkedSave(sessionId: String) {
        try {
            val session = sessions.remove(sessionId)
            session?.tempFile?.delete()
            Log.i(TAG, "cancelChunkedSave: $sessionId")
        } catch (e: Exception) {
            Log.e(TAG, "cancelChunkedSave error", e)
        }
    }

    /**
     * 检查是否有所需权限。
     * Android 13+: 检查 READ_MEDIA_VIDEO / READ_MEDIA_IMAGES
     * Android 6-12: 检查 WRITE_EXTERNAL_STORAGE
     */
    @JavascriptInterface
    fun hasPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+ (API 33+)
            val videoPerm = context.checkSelfPermission(android.Manifest.permission.READ_MEDIA_VIDEO)
            val imagePerm = context.checkSelfPermission(android.Manifest.permission.READ_MEDIA_IMAGES)
            videoPerm == android.content.pm.PackageManager.PERMISSION_GRANTED ||
            imagePerm == android.content.pm.PackageManager.PERMISSION_GRANTED
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // Android 6-12
            val writePerm = context.checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE)
            writePerm == android.content.pm.PackageManager.PERMISSION_GRANTED
        } else {
            // Android 5 及以下，安装时授权
            true
        }
    }

    // ===== 内部方法 =====

    /**
     * 核心方法：将 base64 数据保存到系统相册。
     */
    private fun saveMedia(base64Data: String, fileName: String, mimeType: String, isImage: Boolean): Boolean {
        val data = Base64.decode(base64Data, Base64.NO_WRAP)
        if (data.isEmpty()) {
            Log.e(TAG, "Base64 decode failed or empty data")
            return false
        }
        Log.i(TAG, "Saving media: $fileName, size=${data.size} bytes, type=$mimeType")

        val resolver = context.contentResolver
        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val relativePath = if (isImage) {
                    Environment.DIRECTORY_DCIM + "/Camera"
                } else {
                    Environment.DIRECTORY_DCIM + "/Camera"
                }
                put(MediaStore.Video.Media.RELATIVE_PATH, relativePath)
                put(MediaStore.Video.Media.IS_PENDING, 1)
            }
        }

        val uri = if (isImage) {
            resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
        } else {
            resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values)
        } ?: run {
            Log.e(TAG, "MediaStore.insert() returned null")
            return false
        }

        Log.i(TAG, "MediaStore URI created: $uri")

        resolver.openOutputStream(uri)?.use { os ->
            // 分块写入，避免 OOM
            var offset = 0
            val chunkSize = 8192
            while (offset < data.size) {
                val len = minOf(chunkSize, data.size - offset)
                os.write(data, offset, len)
                offset += len
            }
            os.flush()
        } ?: run {
            Log.e(TAG, "openOutputStream returned null")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.clear()
                values.put(MediaStore.Video.Media.IS_PENDING, 0)
                resolver.update(uri, values, null, null)
            }
            return false
        }

        // 标记为已完成，使文件在相册中可见
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            values.clear()
            values.put(MediaStore.Video.Media.IS_PENDING, 0)
            resolver.update(uri, values, null, null)
        }

        Log.i(TAG, "✅ Media saved: $fileName (${data.size} bytes)")
        return true
    }

    /**
     * 将临时文件保存到 MediaStore 系统相册。
     * 使用文件流复制，避免将整个文件读入内存。
     */
    private fun saveFileToMediaStore(
        tempFile: File,
        fileName: String,
        mimeType: String,
        isImage: Boolean
    ): Boolean {
        val resolver = context.contentResolver
        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_DCIM + "/Camera")
                put(MediaStore.Video.Media.IS_PENDING, 1)
            }
        }

        val uri = if (isImage) {
            resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
        } else {
            resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values)
        } ?: run {
            Log.e(TAG, "MediaStore.insert() returned null for chunked save")
            return false
        }

        Log.i(TAG, "MediaStore URI created (chunked): $uri")

        resolver.openOutputStream(uri)?.use { os ->
            tempFile.inputStream().use { fis ->
                val buffer = ByteArray(CHUNK_SIZE)
                var bytesRead: Int
                while (fis.read(buffer).also { bytesRead = it } > 0) {
                    os.write(buffer, 0, bytesRead)
                }
                os.flush()
            }
        } ?: run {
            Log.e(TAG, "openOutputStream returned null for chunked save")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.clear()
                values.put(MediaStore.Video.Media.IS_PENDING, 0)
                resolver.update(uri, values, null, null)
            }
            return false
        }

        // 标记为已完成
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            values.clear()
            values.put(MediaStore.Video.Media.IS_PENDING, 0)
            resolver.update(uri, values, null, null)
        }

        Log.i(TAG, "✅ Media saved (chunked): $fileName (${tempFile.length()} bytes)")
        return true
    }
}
