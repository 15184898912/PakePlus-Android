<template>
  <view class="container">
    <view class="image-container">
      <image src="/static/demo.png" mode="widthFix" class="schematic-image" @tap="onImageTap" />
    </view>
    <view class="action-bar">
      <view class="action-item" @click="download"><text class="action-icon">📥</text><text class="action-text">缓存</text></view>
      <view class="action-item" @click="share"><text class="action-icon">📤</text><text class="action-text">分享</text></view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return { modelId: '', modelName: '' }
  },
  onLoad(options) {
    this.modelId = options.modelId
    this.modelName = decodeURIComponent(options.modelName || '')
    uni.setNavigationBarTitle({ title: this.modelName })
  },
  methods: {
    onImageTap() { uni.previewImage({ urls: ['/static/demo.png'] }) },
    download() { uni.showToast({ title: '已缓存', icon: 'success' }) },
    share() { uni.showShareMenu({ title: this.modelName }) }
  }
}
</script>

<style scoped>
.container { min-height: 100vh; background-color: #e0e0e0; }
.image-container { background: #fff; min-height: 60vh; display: flex; justify-content: center; }
.schematic-image { width: 100%; }
.action-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; background: #fff; border-top: 2rpx solid #eee; padding: 16rpx 0 30rpx; }
.action-item { flex: 1; text-align: center; }
.action-icon { font-size: 44rpx; display: block; }
.action-text { font-size: 22rpx; color: #666; margin-top: 8rpx; display: block; }
</style>