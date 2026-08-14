package com.zhengshang.zhuge

import android.content.ContentResolver
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
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.OutputStream
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * AndroidMediaStore - JavaScript 原生桥接
 *
 * 功能：将 WebView 中的视频 Blob 保存到 Android 系统相册
 *
 * JavaScript 调用方式：
 *   window.AndroidMediaStore.saveVideo(base64Data, fileName)
 *   window.AndroidMediaStore.startChunkedSave(fileName, mimeType)
 *   window.AndroidMediaStore.appendChunk(sessionId, base64Chunk)
 *   window.AndroidMediaStore.finalizeChunkedSave(sessionId)
 *   window.AndroidMediaStore.cancelChunkedSave(sessionId)
 *
 * 集成方式（在 Activity 的 WebView 设置代码中添加）：
 *   webView.addJavascriptInterface(AndroidMediaStore(this), "AndroidMediaStore")
 */
class AndroidMediaStore(private val context: Context) {

    companion object {
        private const val TAG = "AndroidMediaStore"
        // 分块保存的临时文件目录名
        private const val TEMP_DIR = "zhuge_temp"
        // 每个分块的最大大小（2MB，与 JS 端 CHUNK_SIZE 一致）
        private const val CHUNK_BUFFER_SIZE = 2 * 1024 * 1024
    }

    // ===== 分块保存会话管理 =====
    // sessionId -> 临时文件
    private val chunkSessions = ConcurrentHashMap<String, ChunkSession>()

    private data class ChunkSession(
        val sessionId: String,
        val fileName: String,
        val mimeType: String,
        val tempFile: File,
        val outputStream: FileOutputStream
    )

    /**
     * 方法1：直接保存小视频（< 1MB）
     * JS 端传入完整的 base64 字符串，一次性写入相册
     *
     * @param base64Data 视频的 base64 编码数据（不含 data: 前缀）
     * @param fileName 文件名，如 "AI智能成片_1080P_20260814.webm"
     * @return true=成功, false=失败
     */
    @JavascriptInterface
    fun saveVideo(base64Data: String, fileName: String): Boolean {
        return try {
            android.util.Log.i(TAG, "saveVideo: fileName=$fileName, base64Length=${base64Data.length}")

            val videoBytes = Base64.decode(base64Data, Base64.DEFAULT)
            android.util.Log.i(TAG, "saveVideo: decoded ${videoBytes.size} bytes")

            val mimeType = getMimeType(fileName)
            saveBytesToGallery(videoBytes, fileName, mimeType)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "saveVideo error", e)
            false
        }
    }

    /**
     * 方法2：启动分块保存会话（用于 > 1MB 的视频）
     * JS 端调用后获得 sessionId，然后多次调用 appendChunk 传入分块数据
     *
     * @param fileName 文件名
     * @param mimeType MIME 类型，如 "video/webm" 或 "video/mp4"
     * @return sessionId 会话ID，失败返回空字符串
     */
    @JavascriptInterface
    fun startChunkedSave(fileName: String, mimeType: String): String {
        return try {
            val sessionId = UUID.randomUUID().toString()
            val tempDir = File(context.cacheDir, TEMP_DIR)
            if (!tempDir.exists()) tempDir.mkdirs()

            val tempFile = File(tempDir, "${sessionId}_${fileName}")
            val outputStream = FileOutputStream(tempFile)

            val session = ChunkSession(
                sessionId = sessionId,
                fileName = fileName,
                mimeType = mimeType,
                tempFile = tempFile,
                outputStream = outputStream
            )
            chunkSessions[sessionId] = session

            android.util.Log.i(TAG, "startChunkedSave: sessionId=$sessionId, fileName=$fileName, mimeType=$mimeType")
            sessionId
        } catch (e: Exception) {
            android.util.Log.e(TAG, "startChunkedSave error", e)
            ""
        }
    }

    /**
     * 方法3：追加分块数据
     * JS 端将 blob 切成 2MB 的块，每块转成 base64 后传入
     *
     * @param sessionId startChunkedSave 返回的会话ID
     * @param base64Chunk 当前分块的 base64 数据
     * @return true=成功, false=失败
     */
    @JavascriptInterface
    fun appendChunk(sessionId: String, base64Chunk: String): Boolean {
        val session = chunkSessions[sessionId] ?: run {
            android.util.Log.e(TAG, "appendChunk: session not found: $sessionId")
            return false
        }

        return try {
            val chunkBytes = Base64.decode(base64Chunk, Base64.DEFAULT)
            session.outputStream.write(chunkBytes)
            session.outputStream.flush()
            true
        } catch (e: Exception) {
            android.util.Log.e(TAG, "appendChunk error", e)
            false
        }
    }

    /**
     * 方法4：完成分块保存，将临时文件写入系统相册
     *
     * @param sessionId startChunkedSave 返回的会话ID
     * @return true=成功, false=失败
     */
    @JavascriptInterface
    fun finalizeChunkedSave(sessionId: String): Boolean {
        val session = chunkSessions[sessionId] ?: run {
            android.util.Log.e(TAG, "finalizeChunkedSave: session not found: $sessionId")
            return false
        }

        return try {
            // 关闭输出流
            session.outputStream.flush()
            session.outputStream.close()

            val fileSize = session.tempFile.length()
            android.util.Log.i(TAG, "finalizeChunkedSave: sessionId=$sessionId, tempFile=${session.tempFile.name}, size=$fileSize bytes")

            // 读取临时文件并写入相册
            val fileBytes = FileInputStream(session.tempFile).use { it.readBytes() }
            val success = saveBytesToGallery(fileBytes, session.fileName, session.mimeType)

            // 清理临时文件
            session.tempFile.delete()

            success
        } catch (e: Exception) {
            android.util.Log.e(TAG, "finalizeChunkedSave error", e)
            // 清理临时文件
            try {
                session.outputStream.close()
                session.tempFile.delete()
            } catch (_: Exception) {}
            false
        } finally {
            chunkSessions.remove(sessionId)
        }
    }

    /**
     * 方法5：取消分块保存，清理临时文件
     *
     * @param sessionId startChunkedSave 返回的会话ID
     */
    @JavascriptInterface
    fun cancelChunkedSave(sessionId: String) {
        val session = chunkSessions.remove(sessionId)
        if (session != null) {
            try {
                session.outputStream.close()
                session.tempFile.delete()
                android.util.Log.i(TAG, "cancelChunkedSave: cleaned up session $sessionId")
            } catch (e: Exception) {
                android.util.Log.e(TAG, "cancelChunkedSave error", e)
            }
        }
    }

    // ===== 核心保存逻辑 =====

    /**
     * 将字节数组保存到 Android 系统相册
     * - Android 10+ (API 29+)：使用 MediaStore API（分区存储）
     * - Android 9 及以下：使用传统 File API
     *
     * @param bytes 视频字节数组
     * @param fileName 文件名
     * @param mimeType MIME 类型
     * @return true=成功, false=失败
     */
    private fun saveBytesToGallery(bytes: ByteArray, fileName: String, mimeType: String): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Android 10+ : 使用 MediaStore API
            saveViaMediaStore(bytes, fileName, mimeType)
        } else {
            // Android 9 及以下：使用传统 File API
            saveViaLegacyFile(bytes, fileName)
        }
    }

    /**
     * Android 10+ 使用 MediaStore API 保存
     */
    private fun saveViaMediaStore(bytes: ByteArray, fileName: String, mimeType: String): Boolean {
        var outputUri: Uri? = null
        return try {
            val resolver: ContentResolver = context.contentResolver

            val values = ContentValues().apply {
                put(MediaStore.Video.Media.DISPLAY_NAME, fileName)
                put(MediaStore.Video.Media.MIME_TYPE, mimeType)
                put(MediaStore.Video.Media.RELATIVE_PATH, "${Environment.DIRECTORY_MOVIES}/正商诸葛AI")
                put(MediaStore.Video.Media.IS_PENDING, 1)
            }

            val collection = MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
            outputUri = resolver.insert(collection, values)
                ?: throw Exception("MediaStore.insert returned null")

            resolver.openOutputStream(outputUri)?.use { outputStream: OutputStream ->
                outputStream.write(bytes)
                outputStream.flush()
            } ?: throw Exception("Cannot open output stream for URI: $outputUri")

            // 标记为已完成
            values.clear()
            values.put(MediaStore.Video.Media.IS_PENDING, 0)
            resolver.update(outputUri, values, null, null)

            android.util.Log.i(TAG, "saveViaMediaStore: SUCCESS, uri=$outputUri, size=${bytes.size}")

            // 在主线程显示 Toast
            showToast("视频已保存到相册")

            true
        } catch (e: Exception) {
            android.util.Log.e(TAG, "saveViaMediaStore error", e)
            // 如果失败，尝试删除半成品
            outputUri?.let { uri ->
                try {
                    context.contentResolver.delete(uri, null, null)
                } catch (_: Exception) {}
            }
            false
        }
    }

    /**
     * Android 9 及以下使用传统 File API 保存
     */
    private fun saveViaLegacyFile(bytes: ByteArray, fileName: String): Boolean {
        return try {
            val moviesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVICS)
            val appDir = File(moviesDir, "正商诸葛AI")
            if (!appDir.exists()) appDir.mkdirs()

            val destFile = File(appDir, fileName)
            FileOutputStream(destFile).use { fos ->
                fos.write(bytes)
                fos.flush()
            }

            // 通知媒体扫描器
            val intent = android.content.Intent(android.content.Intent.ACTION_MEDIA_SCANNER_SCAN_FILE)
            intent.data = Uri.fromFile(destFile)
            context.sendBroadcast(intent)

            android.util.Log.i(TAG, "saveViaLegacyFile: SUCCESS, path=${destFile.absolutePath}")

            showToast("视频已保存到相册")

            true
        } catch (e: Exception) {
            android.util.Log.e(TAG, "saveViaLegacyFile error", e)
            false
        }
    }

    // ===== 辅助方法 =====

    private fun getMimeType(fileName: String): String {
        val lowerName = fileName.lowercase()
        return when {
            lowerName.endsWith(".mp4") -> "video/mp4"
            lowerName.endsWith(".webm") -> "video/webm"
            lowerName.endsWith(".mov") -> "video/quicktime"
            lowerName.endsWith(".avi") -> "video/x-msvideo"
            else -> "video/mp4"
        }
    }

    private fun showToast(message: String) {
        try {
            (context as? android.app.Activity)?.runOnUiThread {
                Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            android.util.Log.w(TAG, "showToast failed", e)
        }
    }
}
