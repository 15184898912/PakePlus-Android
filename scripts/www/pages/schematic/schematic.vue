<template>
  <view class="page">
    <view class="header">
      <text class="title">📘 电路图纸中心</text>
      <text class="sub">真实电路原理图 | 支持缩放</text>
    </view>

    <!-- 搜索栏 -->
    <view class="card">
      <view class="label">📺 电器品类</view>
      <picker mode="selector" :range="categories" @change="onCategoryChange">
        <view class="picker">{{ selectedCategory || '请选择' }} ›</view>
      </picker>
      
      <view class="label">🏷️ 品牌</view>
      <picker mode="selector" :range="brandList" @change="onBrandChange">
        <view class="picker">{{ selectedBrand || '请选择' }} ›</view>
      </picker>
      
      <view class="label">🔢 型号/故障码</view>
      <textarea class="textarea" v-model="modelNumber" placeholder="例: KFR-35GW, E5" :auto-height="true" />
      
      <button class="search-btn" @click="loadSchematic" :disabled="isLoading">
        {{ isLoading ? '加载中...' : '🔍 查看图纸' }}
      </button>
    </view>

    <!-- 模块切换 -->
    <view class="module-tabs" v-if="schematicUrl">
      <view class="module-tab" :class="{ active: currentModule === 'main' }" @click="switchModule('main')">主控板</view>
      <view class="module-tab" :class="{ active: currentModule === 'power' }" @click="switchModule('power')">电源板</view>
      <view class="module-tab" :class="{ active: currentModule === 'driver' }" @click="switchModule('driver')">驱动板</view>
      <view class="module-tab" :class="{ active: currentModule === 'comm' }" @click="switchModule('comm')">通信电路</view>
    </view>

    <!-- 图纸显示 -->
    <view v-if="isLoading" class="loading-container">
      <view class="loading-spinner"></view>
      <text>加载图纸中...</text>
    </view>

    <view v-else-if="schematicUrl" class="schematic-container" @click="previewImage">
      <image :src="schematicUrl" class="schematic-image" mode="widthFix" />
      <view class="tip-text">📌 点击图片可放大查看</view>
    </view>

    <view v-else-if="!isLoading && !schematicUrl" class="empty-container">
      <text class="empty-icon">📄</text>
      <text class="empty-text">暂无图纸</text>
      <text class="empty-sub">请选择品类和品牌后点击查看图纸</text>
    </view>

    <!-- 元件标注信息 -->
    <view v-if="components.length > 0" class="card">
      <view class="label">⚡ 图纸标注说明</view>
      <view v-for="comp in components" :key="comp.id" class="component-item">
        <text class="comp-name">{{ comp.name }}</text>
        <text class="comp-desc">{{ comp.desc }}</text>
      </view>
    </view>
  </view>
</template>

<script>
// ========== 真实图纸数据库（请替换为您的图片URL）==========
// 说明：将您的电路图上传到云端，然后把URL填到下面
const schematicDB = {
  // 电饭煲 - 美的
  "电饭煲_美的": {
    main: "https://pic.sogou.com/d?query=%E7%BE%8E%E7%9A%84%E7%94%B5%E9%A5%AD%E7%85%B2%E7%94%B5%E8%B7%AF%E5%9B%BE&mode=2",
    power: "https://pic.sogou.com/d?query=%E7%BE%8E%E7%9A%84%E7%94%B5%E9%A5%AD%E7%85%B2%E7%94%B5%E6%BA%90%E6%9D%BF%E7%94%B5%E8%B7%AF%E5%9B%BE&mode=2",
    driver: "https://pic.sogou.com/d?query=%E7%94%B5%E9%A5%AD%E7%85%B2%E9%A9%B1%E5%8A%A8%E7%94%B5%E8%B7%AF&mode=2"
  },
  // 电饭煲 - 苏泊尔
  "电饭煲_苏泊尔": {
    main: "https://pic.sogou.com/d?query=%E8%8B%8F%E6%B3%8A%E5%B0%94%E7%94%B5%E9%A5%AD%E7%85%B2%E7%94%B5%E8%B7%AF%E5%9B%BE&mode=2",
    power: "https://pic.sogou.com/d?query=%E8%8B%8F%E6%B3%8A%E5%B0%94%E7%94%B5%E9%A5%AD%E7%85%B2%E7%94%B5%E6%BA%90%E6%9D%BF&mode=2"
  },
  // 电磁炉 - 美的
  "电磁炉_美的": {
    main: "https://pic.sogou.com/d?query=%E7%BE%8E%E7%9A%84%E7%94%B5%E7%A3%81%E7%82%89%E7%94%B5%E8%B7%AF%E5%9B%BE&mode=2",
    power: "https://pic.sogou.com/d?query=%E7%94%B5%E7%A3%81%E7%82%89%E7%94%B5%E6%BA%90%E7%94%B5%E8%B7%AF&mode=2"
  },
  // 空调 - 格力
  "空调_格力": {
    main: "https://pic.sogou.com/d?query=%E6%A0%BC%E5%8A%9B%E7%A9%BA%E8%B0%83%E7%94%B5%E8%B7%AF%E5%9B%BE&mode=2",
    power: "https://pic.sogou.com/d?query=%E7%A9%BA%E8%B0%83%E7%94%B5%E6%BA%90%E6%9D%BF%E7%94%B5%E8%B7%AF%E5%9B%BE&mode=2",
    comm: "https://pic.sogou.com/d?query=%E7%A9%BA%E8%B0%83%E9%80%9A%E4%BF%A1%E7%94%B5%E8%B7%AF&mode=2"
  },
  // 空调 - 美的
  "空调_美的": {
    main: "https://pic.sogou.com/d?query=%E7%BE%8E%E7%9A%84%E7%A9%BA%E8%B0%83%E7%94%B5%E8%B7%AF%E5%9B%BE&mode=2",
    power: "https://pic.sogou.com/d?query=%E7%BE%8E%E7%9A%84%E7%A9%BA%E8%B0%83%E7%94%B5%E6%BA%90%E6%9D%BF&mode=2"
  },
  // 洗衣机 - 海尔
  "洗衣机_海尔": {
    main: "https://pic.sogou.com/d?query=%E6%B5%B7%E5%B0%94%E6%B4%97%E8%A1%A3%E6%9C%BA%E7%94%B5%E8%B7%AF%E5%9B%BE&mode=2",
    power: "https://pic.sogou.com/d?query=%E6%B4%97%E8%A1%A3%E6%9C%BA%E7%94%B5%E6%BA%90%E6%9D%BF&mode=2"
  }
}

export default {
  data() {
    return {
      selectedCategory: '',
      selectedBrand: '',
      modelNumber: '',
      isLoading: false,
      schematicUrl: '',
      currentModule: 'main',
      components: [],
      categories: ['电饭煲', '电磁炉', '空调', '洗衣机', '冰箱', '热水器'],
      brands: {
        '电饭煲': ['美的', '苏泊尔', '九阳'],
        '电磁炉': ['美的', '苏泊尔'],
        '空调': ['格力', '美的', '海尔'],
        '洗衣机': ['海尔', '小天鹅'],
        '冰箱': ['海尔', '美的'],
        '热水器': ['海尔', '美的']
      },
      moduleMap: {
        'main': '主控板',
        'power': '电源板',
        'driver': '驱动板',
        'comm': '通信电路'
      }
    }
  },
  computed: {
    brandList() {
      return this.brands[this.selectedCategory] || []
    }
  },
  methods: {
    onCategoryChange(e) {
      this.selectedCategory = this.categories[e.detail.value]
      this.selectedBrand = ''
      this.schematicUrl = ''
      this.components = []
    },
    onBrandChange(e) {
      this.selectedBrand = this.brandList[e.detail.value]
      this.schematicUrl = ''
      this.components = []
    },
    
    loadSchematic() {
      if (!this.selectedCategory || !this.selectedBrand) {
        uni.showToast({ title: '请选择品类和品牌', icon: 'none' })
        return
      }
      
      this.isLoading = true
      this.schematicUrl = ''
      
      setTimeout(() => {
        const key = `${this.selectedCategory}_${this.selectedBrand}`
        const moduleKey = this.currentModule
        let url = null
        
        if (schematicDB[key] && schematicDB[key][moduleKey]) {
          url = schematicDB[key][moduleKey]
        } else if (schematicDB[key] && schematicDB[key]['main']) {
          url = schematicDB[key]['main']
        } else {
          // 默认使用搜图链接
          url = `https://pic.sogou.com/d?query=${encodeURIComponent(this.selectedBrand + this.selectedCategory + this.moduleMap[this.currentModule] + '电路原理图')}&mode=2`
        }
        
        this.schematicUrl = url
        this.components = this.getComponentList()
        this.isLoading = false
        uni.showToast({ title: '图纸加载成功', icon: 'success' })
      }, 500)
    },
    
    switchModule(module) {
      this.currentModule = module
      this.loadSchematic()
    },
    
    getComponentList() {
      const list = {
        'main': [
          { id: 'U1', name: '主控芯片', desc: 'MCU核心控制单元，负责整机逻辑控制' },
          { id: 'Y1', name: '晶振', desc: '8MHz，提供时钟信号' },
          { id: 'RESET', name: '复位电路', desc: '高电平复位，确保芯片正常工作' }
        ],
        'power': [
          { id: 'FUSE', name: '保险管', desc: '10A/250V，过流保护' },
          { id: 'DB1', name: '整流桥', desc: 'GBJ606，将AC变为DC 300V' },
          { id: 'IC1', name: '电源芯片', desc: 'VIPer22A，输出18V和5V' }
        ],
        'driver': [
          { id: 'Q1', name: '驱动管', desc: '8050 NPN，驱动IGBT' },
          { id: 'Q2', name: '驱动管', desc: '8550 PNP，驱动IGBT' },
          { id: 'IGBT', name: '功率管', desc: 'FGA25N120，控制负载' }
        ],
        'comm': [
          { id: 'PC817', name: '光耦', desc: '隔离通信，保护MCU' },
          { id: 'TX', name: '发送端', desc: '信号发送' },
          { id: 'RX', name: '接收端', desc: '信号接收' }
        ]
      }
      return list[this.currentModule] || list['main']
    },
    
    previewImage() {
      if (this.schematicUrl) {
        uni.previewImage({
          urls: [this.schematicUrl],
          current: this.schematicUrl
        })
      }
    }
  }
}
</script>

<style>
page { background: #f0f0f0; padding: 20px; }
.page { background: #f0f0f0; min-height: 100vh; padding: 20px; }
.header { text-align: center; margin-bottom: 20px; }
.title { font-size: 28px; font-weight: bold; color: #1565C0; display: block; }
.sub { font-size: 12px; color: #999; display: block; margin-top: 5px; }
.card { background: #fff; border-radius: 16px; padding: 20px; margin-bottom: 15px; }
.label { font-size: 16px; font-weight: bold; margin-bottom: 10px; display: block; }
.picker { border: 1px solid #ddd; border-radius: 12px; padding: 14px; background: #fafafa; margin-bottom: 15px; }
.textarea { border: 1px solid #ddd; border-radius: 12px; padding: 14px; font-size: 16px; background: #fafafa; width: 100%; box-sizing: border-box; min-height: 50px; margin-bottom: 15px; }
.search-btn { background: #1565C0; color: #fff; border-radius: 30px; padding: 14px; width: 100%; border: none; font-size: 16px; }
.module-tabs { display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; }
.module-tab { background: #fff; padding: 10px 20px; border-radius: 30px; font-size: 14px; }
.module-tab.active { background: #1565C0; color: #fff; }
.schematic-container { background: #fff; border-radius: 16px; padding: 20px; margin-bottom: 15px; text-align: center; }
.schematic-image { width: 100%; border-radius: 12px; }
.tip-text { font-size: 12px; color: #999; text-align: center; margin-top: 10px; }
.loading-container { background: #fff; border-radius: 16px; padding: 60px; text-align: center; margin-bottom: 15px; }
.loading-spinner { width: 50px; height: 50px; border: 4px solid #e0e0e0; border-top-color: #1565C0; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-container { background: #fff; border-radius: 16px; padding: 80px; text-align: center; margin-bottom: 15px; }
.empty-icon { font-size: 60px; display: block; margin-bottom: 20px; }
.empty-text { font-size: 16px; color: #333; display: block; margin-bottom: 8px; }
.empty-sub { font-size: 12px; color: #999; display: block; }
.component-item { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.comp-name { font-weight: bold; color: #1565C0; width: 100px; }
.comp-desc { flex: 1; color: #666; font-size: 13px; }
</style>