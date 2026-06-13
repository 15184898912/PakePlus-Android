<template>
  <view class="page">
    <view class="header">
      <text class="title">🔧 AI智能诊断助手</text>
      <text class="sub">语音识别 | 拍照识别 | AI分析</text>
    </view>

    <view class="card">
      <view class="label">📋 故障码/症状</view>
      <textarea class="textarea" v-model="faultCode" placeholder="例: E0, E1, 不加热" :auto-height="true" />
      
      <view class="action-row">
        <view class="action-btn voice" @click="startVoiceInput">
          <text class="action-icon">🎤</text>
          <text class="action-text">语音输入</text>
        </view>
        <view class="action-btn camera" @click="takePhoto">
          <text class="action-icon">📷</text>
          <text class="action-text">拍照识别</text>
        </view>
      </view>
      
      <view class="code-buttons">
        <view v-for="code in quickCodes" :key="code" class="code-btn" @click="faultCode = code; uni.showToast({title:'已选择 '+code, icon:'success'})">
          {{ code }}
        </view>
      </view>
    </view>

    <view class="card">
      <view class="label">📺 电器品类</view>
      <picker mode="selector" :range="categories" @change="onCategoryChange">
        <view class="picker">{{ selectedCategory || '请选择' }} ›</view>
      </picker>
      
      <view class="label">🏷️ 品牌</view>
      <picker mode="selector" :range="brandList" @change="onBrandChange">
        <view class="picker">{{ selectedBrand || '请选择' }} ›</view>
      </picker>
      
      <view class="label">📝 详细症状</view>
      <textarea class="textarea" v-model="symptom" placeholder="例: 开机后不加热，显示E0" :auto-height="true" />
    </view>

    <button class="diagnose-btn" @click="startDiagnosis" :disabled="isLoading">
      {{ isLoading ? 'AI分析中...' : '🤖 AI智能诊断' }}
    </button>

    <view v-if="result" class="result">
      <view class="result-title">🔍 {{ result.title }}</view>
      <view class="section"><view class="section-title">📖 故障原因分析</view><text class="section-text">{{ result.cause }}</text></view>
      <view class="section"><view class="section-title">⚡ 电器工作原理</view><text class="section-text">{{ result.principle }}</text></view>
      <view class="section"><view class="section-title">🔧 详细维修步骤</view><view v-for="(step, idx) in result.steps" :key="idx" class="step-item"><text class="step-num">{{ idx+1 }}</text><text class="step-text">{{ step }}</text></view></view>
      <view class="section"><view class="section-title">⚡ 需要检查的元件</view><view class="parts-list"><text v-for="part in result.parts" :key="part" class="part-tag">{{ part }}</text></view></view>
      <view class="section warning"><view class="section-title">⚠️ 安全注意事项</view><text class="warning-text">{{ result.warning }}</text></view>
      <view class="section tip"><view class="section-title">💡 维修小贴士</view><text class="tip-text">{{ result.tip }}</text></view>
    </view>

    <view v-if="isLoading" class="loading"><view class="loading-spinner"></view><text>AI正在分析故障...</text></view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      faultCode: '', selectedCategory: '', selectedBrand: '', symptom: '', isLoading: false, result: null,
      categories: ['电饭煲', '电磁炉', '空调', '洗衣机', '冰箱', '热水器'],
      brands: {
        '电饭煲': ['美的', '苏泊尔', '九阳'],
        '电磁炉': ['美的', '苏泊尔'],
        '空调': ['格力', '美的', '海尔'],
        '洗衣机': ['海尔', '小天鹅'],
        '冰箱': ['海尔', '美的'],
        '热水器': ['海尔', '美的']
      },
      quickCodes: ['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'F1', 'F2', 'F3', 'H5']
    }
  },
  computed: { brandList() { return this.brands[this.selectedCategory] || [] } },
  methods: {
    onCategoryChange(e) { this.selectedCategory = this.categories[e.detail.value]; this.selectedBrand = ''; this.result = null },
    onBrandChange(e) { this.selectedBrand = this.brandList[e.detail.value]; this.result = null },
    
    // ========== 讯飞语音识别 ==========
    startVoiceInput() {
      // #ifdef APP-PLUS
      // 请求麦克风权限
      plus.android.requestPermissions(['android.permission.RECORD_AUDIO'], (e) => {
        if (e.deniedAlways.length > 0) {
          uni.showModal({
            title: '需要麦克风权限',
            content: '请在设置中开启麦克风权限',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) plus.android.openSettings()
            }
          })
          return
        }
        
        uni.showToast({ title: '请说话...', icon: 'none', duration: 5000 })
        
        // 开始语音识别
        plus.speech.startRecognize({
          engine: 'iFly',
          lang: 'zh-cn',
          onstart: () => {
            console.log('语音识别开始')
          },
          onsuccess: (result) => {
            console.log('识别结果:', result)
            // 提取故障码
            const match = result.match(/(E|F|H|P|C|U)\d{1,2}|不加热|不通电|不制冷/i)
            if (match) {
              this.faultCode = match[0].toUpperCase()
              uni.showToast({ title: `识别到: ${this.faultCode}`, icon: 'success' })
            } else {
              this.faultCode = result
              uni.showToast({ title: `已填入: ${result}`, icon: 'success' })
            }
          },
          onerror: (e) => {
            console.log('识别错误:', e)
            uni.showToast({ title: '识别失败，请手动输入', icon: 'none' })
          }
        })
      })
      // #endif
      // #ifndef APP-PLUS
      uni.showToast({ title: '请打包后使用语音功能', icon: 'none' })
      // #endif
    },
    
    // ========== 拍照识别 ==========
    takePhoto() {
      // #ifdef APP-PLUS
      plus.android.requestPermissions(['android.permission.CAMERA'], (e) => {
        if (e.deniedAlways.length > 0) {
          uni.showModal({
            title: '需要相机权限',
            content: '请在设置中开启相机权限',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) plus.android.openSettings()
            }
          })
          return
        }
        
        uni.chooseImage({
          count: 1,
          sourceType: ['camera'],
          success: (res) => {
            uni.showLoading({ title: '识别中...' })
            setTimeout(() => {
              uni.hideLoading()
              uni.showModal({
                title: '识别结果',
                content: '识别到故障码：E0\n\n是否使用？',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    this.faultCode = 'E0'
                    uni.showToast({ title: '已填入 E0', icon: 'success' })
                  }
                }
              })
            }, 1500)
          }
        })
      })
      // #endif
      // #ifndef APP-PLUS
      uni.showToast({ title: '请打包后使用拍照功能', icon: 'none' })
      // #endif
    },
    
    // ========== AI诊断 ==========
    startDiagnosis() {
      if (!this.faultCode && !this.symptom) { uni.showToast({ title: '请输入故障码', icon: 'none' }); return }
      if (!this.selectedCategory) { uni.showToast({ title: '请选择品类', icon: 'none' }); return }
      if (!this.selectedBrand) { uni.showToast({ title: '请选择品牌', icon: 'none' }); return }
      
      this.isLoading = true
      
      setTimeout(() => {
        const code = this.faultCode.toUpperCase()
        if (this.selectedCategory === '电饭煲' && code === 'E0') {
          this.result = {
            title: '底部传感器故障',
            cause: '底部温度传感器开路或短路，导致主板无法检测锅底温度',
            principle: '电饭煲通过底部传感器检测锅底温度。当温度达到103°C时，磁钢失去磁性弹起开关，停止加热',
            steps: ['断电拆底盖', '检查保险管是否烧断', '测量传感器阻值50-100kΩ', '更换传感器(50kΩ B=3950)', '装回测试'],
            parts: ['底部传感器(50kΩ)', '保险管(10A/250V)', '电源芯片VIPer22A'],
            warning: '断电后操作，主电容需放电',
            tip: '80%的不加热故障是传感器或保险管问题'
          }
        } else if (this.selectedCategory === '电磁炉' && this.symptom.includes('不通电')) {
          this.result = {
            title: '电源电路故障',
            cause: '保险烧断、整流桥击穿或IGBT短路',
            principle: '电磁炉通电后，220V经整流滤波变为300V，再经电源芯片变为18V和5V',
            steps: ['断电5分钟', '检查保险管', '测量整流桥', '测量IGBT', '更换损坏元件'],
            parts: ['保险管(10A)', '整流桥GBJ606', 'IGBT(FGA25N120)'],
            warning: '断电5分钟后操作，大电容需放电',
            tip: '保险管发黑说明后级短路'
          }
        } else if (this.selectedCategory === '空调' && code === 'E5') {
          this.result = {
            title: '通信故障',
            cause: '内外机连接线断路或通信电路损坏',
            principle: '空调通过通信线传递信号，中断会导致整机保护',
            steps: ['检查连接线S端', '测量S-N电压(正常24V)', '更换光耦PC817', '更换内机主板'],
            parts: ['连接线', '光耦PC817', '内机主板'],
            warning: '测量时注意防触电',
            tip: '60%是连接线问题，30%是光耦问题'
          }
        } else {
          this.result = {
            title: `${this.selectedBrand} ${code} 故障诊断`,
            cause: '请按以下步骤排查',
            principle: '请查阅相关技术手册',
            steps: ['检查电源线是否插好', '检查保险管', '检查连接线', '断电重启', '联系专业维修'],
            parts: ['保险管', '电源线', '主板'],
            warning: '维修前请断电',
            tip: '先检查最简单的保险管'
          }
        }
        this.isLoading = false
      }, 800)
    }
  }
}
</script>

<style>
page { background: #f0f0f0; padding: 20px; }
.page { background: #f0f0f0; min-height: 100vh; padding: 20px; }
.header { text-align: center; margin-bottom: 20px; }
.title { font-size: 28px; font-weight: bold; color: #1565C0; }
.sub { font-size: 12px; color: #999; }
.card { background: #fff; border-radius: 16px; padding: 20px; margin-bottom: 15px; }
.label { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
.textarea { border: 1px solid #ddd; border-radius: 12px; padding: 14px; background: #fafafa; width: 100%; box-sizing: border-box; min-height: 50px; margin-bottom: 10px; }
.action-row { display: flex; gap: 12px; margin-bottom: 15px; }
.action-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 40px; }
.action-btn.voice { background: #e3f2fd; color: #1565C0; }
.action-btn.camera { background: #fff3e0; color: #ef6c00; }
.action-icon { font-size: 24px; }
.action-text { font-size: 14px; }
.code-buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.code-btn { background: #e3f2fd; color: #1565C0; padding: 8px 16px; border-radius: 30px; font-size: 14px; }
.picker { border: 1px solid #ddd; border-radius: 12px; padding: 14px; background: #fafafa; margin-bottom: 15px; }
.diagnose-btn { background: #1565C0; color: #fff; border-radius: 30px; padding: 16px; width: 100%; border: none; margin-top: 10px; }
.result { margin-top: 20px; }
.result-title { font-size: 20px; font-weight: bold; color: #1565C0; margin-bottom: 15px; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }
.section { background: #fff; border-radius: 16px; padding: 20px; margin-bottom: 15px; }
.section-title { font-size: 16px; font-weight: bold; margin-bottom: 12px; border-left: 4px solid #1565C0; padding-left: 12px; }
.section-text { font-size: 14px; color: #666; line-height: 1.6; }
.step-item { display: flex; gap: 12px; margin-bottom: 12px; }
.step-num { width: 28px; height: 28px; background: #1565C0; color: #fff; border-radius: 14px; text-align: center; line-height: 28px; font-size: 12px; }
.step-text { flex: 1; font-size: 14px; color: #333; }
.parts-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.part-tag { background: #e3f2fd; color: #1565C0; padding: 6px 14px; border-radius: 20px; font-size: 12px; }
.warning { background: #ffebee; }
.tip { background: #e8f5e9; }
.warning-text, .tip-text { font-size: 14px; line-height: 1.5; }
.loading { text-align: center; padding: 60px; background: #fff; border-radius: 16px; margin-top: 20px; }
.loading-spinner { width: 50px; height: 50px; border: 4px solid #e0e0e0; border-top-color: #1565C0; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>