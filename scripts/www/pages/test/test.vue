<template>
  <view style="padding: 30px; background: #fff; min-height: 100vh;">
    <view style="font-size: 20px; font-weight: bold; margin-bottom: 20px;">输入框测试</view>
    
    <input 
      style="border: 1px solid #ccc; border-radius: 10px; padding: 15px; font-size: 18px; background: #f9f9f9;"
      v-model="text" 
      placeholder="点击这里输入文字"
      @focus="onFocus"
    />
    
    <view style="margin-top: 30px; background: #e3f2fd; padding: 20px; border-radius: 10px;">
      <text>你输入的内容是：{{ text || '（未输入）' }}</text>
    </view>
    
    <button 
      style="margin-top: 30px; background: #1565C0; color: #fff; padding: 15px; border-radius: 10px;"
      @click="showToast"
    >
      显示输入内容
    </button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      text: ''
    }
  },
  methods: {
    onFocus() {
      console.log('输入框获得焦点')
      uni.showToast({ title: '输入框已激活', icon: 'none' })
    },
    showToast() {
      uni.showToast({ title: this.text || '暂无内容', icon: 'none' })
    }
  }
}
</script>