<template>
  <view></view>
</template>

<script>
export default {
  name: 'SafetyDialog'
}

export function showSafetyDialog() {
  uni.showModal({
    title: '⚠️ 高压危险！',
    content: '即将查看的电路包含300V以上区域，请务必遵守：\n\n1. 拔掉电源插头或断开空气开关\n2. 大电容放电（等待5分钟以上）\n3. 穿戴绝缘鞋/手套\n4. 万用表笔先测零地电压确认断电\n\n非专业电工请勿触碰高压电路！',
    confirmText: '已断电，继续',
    cancelText: '取消',
    confirmColor: '#f44336'
  })
}

export function showGeneralSafety() {
  uni.showModal({
    title: '安全操作提醒',
    content: '维修通用安全规范：\n\n• 维修前务必断开电源\n• 使用绝缘工具\n• 单手操作减少触电风险\n• 潮湿环境禁止带电作业',
    confirmText: '我知道了',
    showCancel: false
  })
}
</script>

<style scoped>
</style>