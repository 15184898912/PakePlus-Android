package com.ai.avatarstudio

import android.Manifest
import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.Animation
import android.view.animation.ScaleAnimation
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.android.material.button.MaterialButton
import com.google.android.material.progressindicator.LinearProgressIndicator
import com.google.android.material.textfield.TextInputEditText
import kotlin.random.Random

class MainActivity : AppCompatActivity() {

    // Views
    private lateinit var ivAvatar: ImageView
    private lateinit var avatarContainer: LinearLayout
    private lateinit var previewBackground: View
    private lateinit var eyeOverlay: View
    private lateinit var loadingOverlay: LinearLayout
    private lateinit var progressOverlay: LinearLayout
    private lateinit var tvLoadingStatus: TextView
    private lateinit var tvProgressText: TextView
    private lateinit var tvStatus: TextView
    private lateinit var tvBgName: TextView
    private lateinit var tvPlayingStatus: TextView
    private lateinit var progressBarVideo: LinearProgressIndicator
    private lateinit var etTextInput: TextInputEditText
    private lateinit var playbackControls: LinearLayout
    private lateinit var btnPlay: MaterialButton
    private lateinit var btnStop: MaterialButton
    private lateinit var btnComposeVideo: MaterialButton
    private lateinit var btnSaveGallery: MaterialButton
    private lateinit var btnGenerateVoice: MaterialButton
    private lateinit var btnUploadAudio: MaterialButton

    // Avatar selection buttons
    private lateinit var btnUploadPhoto: LinearLayout
    private lateinit var btnAvatar1: LinearLayout
    private lateinit var btnAvatar2: LinearLayout
    private lateinit var btnAvatar3: LinearLayout

    // Background selection buttons
    private lateinit var btnBgGray: LinearLayout
    private lateinit var btnBgBlue: LinearLayout
    private lateinit var btnBgGreen: LinearLayout
    private lateinit var btnBgOffice: LinearLayout
    private lateinit var btnBgNature: LinearLayout

    // State
    private var selectedAvatarRes: Int = R.drawable.avatar_placeholder
    private var selectedBackgroundColor: Int = R.color.avatar_bg_gray
    private var isAvatarReady: Boolean = false
    private var isVoiceReady: Boolean = false
    private var isVideoComposed: Boolean = false
    private var isPlaying: Boolean = false

    // Animations
    private var mouthAnimator: ValueAnimator? = null
    private var blinkAnimator: ObjectAnimator? = null
    private var breatheAnimator: ObjectAnimator? = null
    private val handler = Handler(Looper.getMainLooper())
    private var blinkRunnable: Runnable? = null
    private var audioAmplitude = 0f

    // Permission launcher
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.entries.all { it.value }
        if (!allGranted) {
            showPermissionSettingsDialog()
        }
    }

    // Image picker launcher
    private val pickImageLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            // Simulate AI generation with uploaded photo
            simulateAvatarGeneration(R.drawable.avatar_placeholder)
            tvStatus.text = "照片上传成功，AI正在生成数字分身..."
        }
    }

    // Audio picker launcher
    private val pickAudioLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            simulateVoiceGeneration(isUpload = true)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        setupClickListeners()
        requestPermissions()
        startBreatheAnimation()
        scheduleBlinkAnimation()
    }

    private fun initViews() {
        ivAvatar = findViewById(R.id.ivAvatar)
        avatarContainer = findViewById(R.id.avatarContainer)
        previewBackground = findViewById(R.id.previewBackground)
        eyeOverlay = findViewById(R.id.eyeOverlay)
        loadingOverlay = findViewById(R.id.loadingOverlay)
        progressOverlay = findViewById(R.id.progressOverlay)
        tvLoadingStatus = findViewById(R.id.tvLoadingStatus)
        tvProgressText = findViewById(R.id.tvProgressText)
        tvStatus = findViewById(R.id.tvStatus)
        tvBgName = findViewById(R.id.tvBgName)
        tvPlayingStatus = findViewById(R.id.tvPlayingStatus)
        progressBarVideo = findViewById(R.id.progressBarVideo)
        etTextInput = findViewById(R.id.etTextInput)
        playbackControls = findViewById(R.id.playbackControls)
        btnPlay = findViewById(R.id.btnPlay)
        btnStop = findViewById(R.id.btnStop)
        btnComposeVideo = findViewById(R.id.btnComposeVideo)
        btnSaveGallery = findViewById(R.id.btnSaveGallery)
        btnGenerateVoice = findViewById(R.id.btnGenerateVoice)
        btnUploadAudio = findViewById(R.id.btnUploadAudio)

        btnUploadPhoto = findViewById(R.id.btnUploadPhoto)
        btnAvatar1 = findViewById(R.id.btnAvatar1)
        btnAvatar2 = findViewById(R.id.btnAvatar2)
        btnAvatar3 = findViewById(R.id.btnAvatar3)

        btnBgGray = findViewById(R.id.btnBgGray)
        btnBgBlue = findViewById(R.id.btnBgBlue)
        btnBgGreen = findViewById(R.id.btnBgGreen)
        btnBgOffice = findViewById(R.id.btnBgOffice)
        btnBgNature = findViewById(R.id.btnBgNature)

        // Set default text
        etTextInput.setText(getString(R.string.default_welcome_text))
    }

    private fun setupClickListeners() {
        // Avatar selection
        btnUploadPhoto.setOnClickListener {
            if (checkStoragePermission()) {
                pickImageLauncher.launch("image/*")
            } else {
                requestPermissions()
            }
        }

        btnAvatar1.setOnClickListener {
            selectAvatar(R.drawable.avatar_business_man, btnAvatar1)
        }

        btnAvatar2.setOnClickListener {
            selectAvatar(R.drawable.avatar_elegant_lady, btnAvatar2)
        }

        btnAvatar3.setOnClickListener {
            selectAvatar(R.drawable.avatar_fashion_youth, btnAvatar3)
        }

        // Voice buttons
        btnGenerateVoice.setOnClickListener {
            val text = etTextInput.text.toString().trim()
            if (text.isEmpty()) {
                Toast.makeText(this, "请先输入要说的话", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            if (!isAvatarReady) {
                Toast.makeText(this, "请先选择数字人形象", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            simulateVoiceGeneration(isUpload = false)
        }

        btnUploadAudio.setOnClickListener {
            if (!isAvatarReady) {
                Toast.makeText(this, "请先选择数字人形象", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            if (checkStoragePermission()) {
                pickAudioLauncher.launch("audio/*")
            } else {
                requestPermissions()
            }
        }

        // Playback controls
        btnPlay.setOnClickListener {
            startSpeakingAnimation()
        }

        btnStop.setOnClickListener {
            stopSpeakingAnimation()
        }

        // Background selection
        btnBgGray.setOnClickListener {
            selectBackground(R.color.avatar_bg_gray, getString(R.string.bg_gray), btnBgGray)
        }

        btnBgBlue.setOnClickListener {
            selectBackground(R.color.avatar_bg_blue, getString(R.string.bg_blue), btnBgBlue)
        }

        btnBgGreen.setOnClickListener {
            selectBackground(R.color.avatar_bg_green, getString(R.string.bg_green), btnBgGreen)
        }

        btnBgOffice.setOnClickListener {
            selectBackground(R.color.office_bg, getString(R.string.bg_office), btnBgOffice)
        }

        btnBgNature.setOnClickListener {
            selectBackground(R.color.nature_bg, getString(R.string.bg_nature), btnBgNature)
        }

        // Video composition
        btnComposeVideo.setOnClickListener {
            if (!isAvatarReady) {
                Toast.makeText(this, "请先选择数字人形象", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            if (!isVoiceReady) {
                Toast.makeText(this, "请先生成语音或上传音频", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            simulateVideoComposition()
        }

        btnSaveGallery.setOnClickListener {
            if (isVideoComposed) {
                simulateSaveToGallery()
            }
        }
    }

    private fun selectAvatar(avatarRes: Int, selectedButton: LinearLayout) {
        selectedAvatarRes = avatarRes
        
        // Reset all button backgrounds
        resetAvatarButtons()
        selectedButton.setBackgroundResource(R.drawable.bg_option_selected)
        
        // Simulate AI generation
        simulateAvatarGeneration(avatarRes)
    }

    private fun resetAvatarButtons() {
        btnUploadPhoto.setBackgroundResource(R.drawable.bg_option_unselected)
        btnAvatar1.setBackgroundResource(R.drawable.bg_option_unselected)
        btnAvatar2.setBackgroundResource(R.drawable.bg_option_unselected)
        btnAvatar3.setBackgroundResource(R.drawable.bg_option_unselected)
    }

    private fun simulateAvatarGeneration(avatarRes: Int) {
        showLoading(getString(R.string.status_generating_avatar))
        
        handler.postDelayed({
            hideLoading()
            ivAvatar.setImageResource(avatarRes)
            isAvatarReady = true
            tvStatus.text = getString(R.string.status_avatar_ready)
            isVideoComposed = false
            btnSaveGallery.isEnabled = false
        }, 2000)
    }

    private fun selectBackground(colorRes: Int, bgName: String, selectedButton: LinearLayout) {
        selectedBackgroundColor = colorRes
        previewBackground.setBackgroundResource(colorRes)
        tvBgName.text = bgName
        
        // Add visual feedback - scale animation
        val scaleAnim = ScaleAnimation(
            1f, 0.9f, 1f, 0.9f,
            Animation.RELATIVE_TO_SELF, 0.5f,
            Animation.RELATIVE_TO_SELF, 0.5f
        )
        scaleAnim.duration = 100
        scaleAnim.repeatMode = Animation.REVERSE
        scaleAnim.repeatCount = 1
        selectedButton.startAnimation(scaleAnim)
    }

    private fun simulateVoiceGeneration(isUpload: Boolean) {
        showLoading(if (isUpload) "正在处理音频..." else getString(R.string.status_generating_voice))
        
        handler.postDelayed({
            hideLoading()
            isVoiceReady = true
            playbackControls.visibility = View.VISIBLE
            tvStatus.text = getString(R.string.status_voice_ready)
            
            // Auto start speaking
            startSpeakingAnimation()
        }, 1500)
    }

    private fun startSpeakingAnimation() {
        if (isPlaying) return
        isPlaying = true
        tvPlayingStatus.visibility = View.VISIBLE
        btnPlay.text = getString(R.string.btn_play)
        
        // Start mouth animation - simulating lip sync with random amplitude
        mouthAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 200
            repeatCount = ValueAnimator.INFINITE
            repeatMode = ValueAnimator.REVERSE
            interpolator = AccelerateDecelerateInterpolator()
            addUpdateListener { animator ->
                val value = animator.animatedValue as Float
                // Simulate audio amplitude variation
                audioAmplitude = (Math.sin((System.currentTimeMillis() / 100).toDouble()) * 0.5 + 0.5).toFloat() * value
                updateMouthShape(audioAmplitude)
                // Check emotion keywords and apply microexpressions
                checkEmotionAndApplyExpression()
            }
            start()
        }

        // Auto stop after some time (simulating audio length)
        val textLength = etTextInput.text?.length ?: 10
        val duration = (textLength * 150).toLong().coerceAtLeast(3000)
        handler.postDelayed({
            stopSpeakingAnimation()
        }, duration)
    }

    private fun stopSpeakingAnimation() {
        isPlaying = false
        tvPlayingStatus.visibility = View.GONE
        mouthAnimator?.cancel()
        mouthAnimator = null
        resetMouthShape()
    }

    private fun updateMouthShape(amplitude: Float) {
        // Scale the avatar vertically to simulate mouth movement
        val scaleY = 1f + amplitude * 0.02f
        val scaleX = 1f + amplitude * 0.005f
        ivAvatar.scaleX = scaleX
        ivAvatar.scaleY = scaleY
    }

    private fun resetMouthShape() {
        ivAvatar.scaleX = 1f
        ivAvatar.scaleY = 1f
    }

    private fun checkEmotionAndApplyExpression() {
        val text = etTextInput.text?.toString()?.lowercase() ?: return
        
        when {
            text.contains("开心") || text.contains("快乐") || text.contains("高兴") || 
            text.contains("哈哈") || text.contains(":)") || text.contains("happy") -> {
                // Smile - slight upward tilt
                ivAvatar.rotation = 1f
            }
            text.contains("难过") || text.contains("悲伤") || text.contains("伤心") -> {
                // Sad - slight downward tilt
                ivAvatar.rotation = -1f
            }
            text.contains("严肃") || text.contains("正式") || text.contains("重要") -> {
                // Serious - neutral, no rotation
                ivAvatar.rotation = 0f
            }
            else -> {
                ivAvatar.rotation = 0f
            }
        }
    }

    private fun scheduleBlinkAnimation() {
        blinkRunnable = Runnable {
            if (!isDestroyed && !isFinishing) {
                blink()
                // Schedule next blink (3-5 seconds random)
                val nextBlinkDelay = 3000L + Random.nextLong(2000)
                handler.postDelayed(blinkRunnable!!, nextBlinkDelay)
            }
        }
        // First blink after 2 seconds
        handler.postDelayed(blinkRunnable!!, 2000)
    }

    private fun blink() {
        // Create blink effect by showing the eye overlay briefly
        eyeOverlay.setBackgroundColor(Color.parseColor("#0D1B2A"))
        eyeOverlay.alpha = 1f
        
        eyeOverlay.animate()
            .alpha(0f)
            .setDuration(150)
            .setStartDelay(100)
            .setListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    eyeOverlay.setBackgroundColor(android.graphics.Color.TRANSPARENT)
                }
            })
            .start()
    }

    private fun startBreatheAnimation() {
        // Subtle breathing animation - slight scale and translation
        breatheAnimator = ObjectAnimator.ofFloat(avatarContainer, "translationY", 0f, -5f, 0f).apply {
            duration = 4000
            repeatCount = ObjectAnimator.INFINITE
            repeatMode = ObjectAnimator.REVERSE
            interpolator = AccelerateDecelerateInterpolator()
            start()
        }
        
        ObjectAnimator.ofFloat(avatarContainer, "scaleX", 1f, 1.01f, 1f).apply {
            duration = 4000
            repeatCount = ObjectAnimator.INFINITE
            repeatMode = ObjectAnimator.REVERSE
            interpolator = AccelerateDecelerateInterpolator()
            start()
        }
        
        ObjectAnimator.ofFloat(avatarContainer, "scaleY", 1f, 1.01f, 1f).apply {
            duration = 4000
            repeatCount = ObjectAnimator.INFINITE
            repeatMode = ObjectAnimator.REVERSE
            interpolator = AccelerateDecelerateInterpolator()
            start()
        }
    }

    private fun simulateVideoComposition() {
        isVideoComposed = false
        btnSaveGallery.isEnabled = false
        btnComposeVideo.isEnabled = false
        progressOverlay.visibility = View.VISIBLE
        progressBarVideo.progress = 0
        
        // Start speaking animation during composition
        startSpeakingAnimation()
        
        val progressAnimator = ValueAnimator.ofInt(0, 100).apply {
            duration = 5000
            interpolator = AccelerateDecelerateInterpolator()
            addUpdateListener { animator ->
                val progress = animator.animatedValue as Int
                progressBarVideo.progress = progress
                tvProgressText.text = getString(R.string.status_composing_video, progress)
            }
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    progressOverlay.visibility = View.GONE
                    isVideoComposed = true
                    btnSaveGallery.isEnabled = true
                    btnComposeVideo.isEnabled = true
                    tvStatus.text = getString(R.string.status_video_ready)
                    stopSpeakingAnimation()
                    
                    // Brief success animation
                    ivAvatar.animate()
                        .scaleX(1.05f)
                        .scaleY(1.05f)
                        .setDuration(200)
                        .withEndAction {
                            ivAvatar.animate()
                                .scaleX(1f)
                                .scaleY(1f)
                                .setDuration(200)
                                .start()
                        }
                        .start()
                    
                    Toast.makeText(this@MainActivity, R.string.status_video_ready, Toast.LENGTH_SHORT).show()
                }
            })
            start()
        }
    }

    private fun simulateSaveToGallery() {
        Toast.makeText(this, R.string.status_saved_success, Toast.LENGTH_SHORT).show()
        tvStatus.text = getString(R.string.status_saved_success)
    }

    private fun showLoading(message: String) {
        tvLoadingStatus.text = message
        loadingOverlay.visibility = View.VISIBLE
    }

    private fun hideLoading() {
        loadingOverlay.visibility = View.GONE
    }

    private fun checkStoragePermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) == PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_AUDIO) == PackageManager.PERMISSION_GRANTED
        } else {
            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun requestPermissions() {
        val permissions = mutableListOf<String>()
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_MEDIA_IMAGES)
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_MEDIA_AUDIO)
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_VIDEO) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_MEDIA_VIDEO)
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            }
        }
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.CAMERA)
        }
        
        if (permissions.isNotEmpty()) {
            requestPermissionLauncher.launch(permissions.toTypedArray())
        }
    }

    private fun showPermissionSettingsDialog() {
        AlertDialog.Builder(this)
            .setTitle(getString(R.string.permission_storage_title))
            .setMessage(getString(R.string.permission_storage_message))
            .setPositiveButton(getString(R.string.dialog_settings)) { _, _ ->
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                val uri = Uri.fromParts("package", packageName, null)
                intent.data = uri
                startActivity(intent)
            }
            .setNegativeButton(getString(R.string.dialog_cancel), null)
            .show()
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null)
        mouthAnimator?.cancel()
        blinkAnimator?.cancel()
        breatheAnimator?.cancel()
    }

    override fun onPause() {
        super.onPause()
        stopSpeakingAnimation()
    }
}
