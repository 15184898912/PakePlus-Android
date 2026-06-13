<template>
  <view class="fault-card">
    <view class="fault-header">
      <view class="fault-icon"><text>🔴</text></view>
      <text class="fault-meaning">{{ data.meaning || '未知故障' }}</text>
    </view>
    <view class="fault-section">
      <text class="section-title">📖 故障机理</text>
      <text class="section-content">{{ data.mechanism || '暂无说明' }}</text>
    </view>
    <view v-if="data.measure_points && data.measure_points.length" class="fault-section">
      <text class="section-title">🔧 测量点位</text>
      <view v-for="(point, idx) in data.measure_points" :key="idx" class="measure-point">
        <text class="point-pin">{{ point.pin }}</text>
        <text class="point-value">正常: {{ point.normal_value }}</text>
        <text class="point-tool">工具: {{ point.tool }}</text>
      </view>
    </view>
    <view v-if="data.safety_warning" class="safety-warning">
      <text class="warning-icon">⚠️</text>
      <text class="warning-text">{{ data.safety_warning }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'FaultCard',
  props: { data: { type: Object, default: () => ({}) } }
}
</script>

<style scoped>
.fault-card { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.fault-header { display: flex; align-items: center; gap: 20rpx; padding-bottom: 24rpx; border-bottom: 2rpx solid #f0f0f0; margin-bottom: 24rpx; }
.fault-icon { width: 60rpx; height: 60rpx; background: #ffebee; border-radius: 30rpx; display: flex; align-items: center; justify-content: center; font-size: 32rpx; }
.fault-meaning { flex: 1; font-size: 32rpx; font-weight: bold; color: #333; }
.fault-section { margin-bottom: 24rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #666; display: block; margin-bottom: 12rpx; }
.section-content { font-size: 26rpx; color: #333; line-height: 1.6; }
.measure-point { background: #f9f9f9; border-radius: 12rpx; padding: 16rpx; margin-bottom: 12rpx; display: flex; flex-wrap: wrap; gap: 16rpx; }
.point-pin { background: #1565C0; color: #fff; padding: 4rpx 16rpx; border-radius: 20rpx; font-size: 24rpx; }
.point-value, .point-tool { font-size: 24rpx; color: #666; }
.safety-warning { background: #ffebee; border-left: 8rpx solid #f44336; padding: 20rpx; border-radius: 12rpx; margin-top: 16rpx; display: flex; align-items: center; gap: 12rpx; }
.warning-icon { font-size: 32rpx; }
.warning-text { flex: 1; font-size: 24rpx; color: #c62828; }
</style>