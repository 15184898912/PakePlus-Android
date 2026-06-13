<template>
  <view class="page">
    <view class="header">
      <text class="title">🔧 AI专业元器件查询</text>
      <text class="sub">通义千问AI | 引脚图纸 | 完整规格书解读</text>
    </view>

    <view class="card">
      <view class="label">元器件型号/品牌/品类</view>
      <textarea class="textarea" v-model="searchModel" placeholder="例: VIPer22A, PC817, LM358" :auto-height="true" />
      
      <view class="quick-tags">
        <text v-for="item in hotSearches" :key="item" class="quick-tag" @click="searchModel = item; searchComponent()">{{ item }}</text>
      </view>
      
      <view class="mode-switch">
        <text class="mode-label">搜索模式：</text>
        <view class="mode-btns">
          <text class="mode-btn" :class="{ active: searchMode === 'local' }" @click="searchMode = 'local'">本地库</text>
          <text class="mode-btn" :class="{ active: searchMode === 'ai' }" @click="searchMode = 'ai'">AI智能解读</text>
        </view>
      </view>
      
      <button class="search-btn" @click="searchComponent" :disabled="isLoading">
        {{ isLoading ? '查询中...' : '开始查询' }}
      </button>
    </view>

    <view v-if="result" class="result">
      <!-- 一、基础信息 -->
      <view class="section">
        <view class="section-title">一、基础信息</view>
        <view class="info-row"><text class="label">元器件名称：</text><text>{{ result.name }}</text></view>
        <view class="info-row"><text class="label">品牌：</text><text>{{ result.brand }}</text></view>
        <view class="info-row"><text class="label">完整型号：</text><text>{{ result.model }}</text></view>
        <view class="info-row"><text class="label">产品类别：</text><text>{{ result.category }}</text></view>
        <view class="info-row"><text class="label">原厂定位：</text><text>{{ result.position }}</text></view>
      </view>

      <!-- 二、核心电气参数 -->
      <view class="section">
        <view class="section-title">二、核心电气参数</view>
        <view v-for="(p, idx) in result.params" :key="idx" class="param-row">
          <text class="param-name">{{ p.name }}</text>
          <text class="param-value">{{ p.value }}</text>
        </view>
      </view>

      <!-- 三、物理与结构参数 + 引脚图纸 -->
      <view class="section">
        <view class="section-title">三、物理与结构参数</view>
        <view class="info-row"><text class="label">封装类型：</text><text>{{ result.package.type }}</text></view>
        <view class="info-row"><text class="label">外形尺寸：</text><text>{{ result.package.size }}</text></view>
        <view class="info-row"><text class="label">引脚数量：</text><text>{{ result.package.pins }}</text></view>
        
        <view class="pin-table">
          <view class="pin-header">
            <text>引脚号</text>
            <text>引脚名称</text>
            <text>功能描述</text>
          </view>
          <view v-for="pin in result.pins" :key="pin.num" class="pin-row">
            <text class="pin-num">{{ pin.num }}</text>
            <text class="pin-name">{{ pin.name }}</text>
            <text class="pin-func">{{ pin.func }}</text>
          </view>
        </view>
      </view>

      <!-- 四、关键特性与典型应用 -->
      <view class="section">
        <view class="section-title">四、关键特性与典型应用</view>
        <view class="info-row"><text class="label">核心功能：</text><text>{{ result.features.function }}</text></view>
        <view class="info-row"><text class="label">优势特点：</text><text>{{ result.features.advantages }}</text></view>
        <view class="info-row"><text class="label">典型应用：</text><text>{{ result.features.applications }}</text></view>
        <view class="info-row"><text class="label">电路搭配：</text><text>{{ result.features.circuit }}</text></view>
      </view>

      <!-- 五、注意事项 -->
      <view class="section warning">
        <view class="section-title">五、注意事项</view>
        <view v-for="(n, idx) in result.notices" :key="idx" class="notice-item">
          <text class="notice-icon">⚠️</text>
          <text class="notice-text">{{ n }}</text>
        </view>
      </view>

      <!-- 六、补充建议 -->
      <view class="section">
        <view class="section-title">六、补充建议</view>
        <view class="info-row"><text class="label">替代型号：</text>
          <view class="alt-list">
            <text v-for="alt in result.alternatives" :key="alt" class="alt-tag">{{ alt }}</text>
          </view>
        </view>
        <view class="info-row"><text class="label">采购参考：</text><text>{{ result.purchase }}</text></view>
        <view class="info-row"><text class="label">资料获取：</text><text>{{ result.datasheet }}</text></view>
      </view>
    </view>

    <view v-if="isLoading" class="loading">
      <view class="loading-spinner"></view>
      <text>查询中...</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      searchModel: '',
      searchMode: 'local',
      isLoading: false,
      result: null,
      hotSearches: ['VIPer22A', 'PC817', 'LM358', 'NE555', '7805', 'IRF840']
    }
  },
  methods: {
    async searchComponent() {
      if (!this.searchModel.trim()) {
        uni.showToast({ title: '请输入型号', icon: 'none' })
        return
      }
      
      this.isLoading = true
      
      setTimeout(() => {
        const model = this.searchModel.toUpperCase()
        const data = this.getLocalData(model)
        this.result = data
        this.isLoading = false
        uni.showToast({ title: '查询成功', icon: 'success' })
      }, 300)
    },
    
    getLocalData(model) {
      const db = {
        VIPER22A: {
          name: '电源芯片', brand: 'ST', model: 'VIPer22A', category: 'AC-DC转换器', position: '离线开关电源芯片',
          params: [{ name: '工作电压', value: '9-38V' }, { name: '耐压值', value: '730V' }, { name: '开关频率', value: '60kHz' }],
          package: { type: 'DIP-8/SOP-8', size: '9.8x6.4mm', pins: '8' },
          pins: [{ num: '1', name: 'DRAIN', func: '内部MOS漏极，接变压器初级' }, { num: '2', name: 'GND', func: '地，散热焊盘接地' }, { num: '3', name: 'VDD', func: '供电，接10μF电容' }, { num: '4', name: 'FB', func: '反馈输入，接光耦' }],
          features: { function: '集成PWM控制器和高压MOSFET', advantages: '待机功耗低、内置过热保护', applications: '电磁炉、电饭煲、充电器', circuit: '输入端接整流滤波，输出经变压器，反馈用TL431+PC817' },
          notices: ['VDD电容需靠近芯片引脚', 'DRAIN脚有高压，注意安全', 'FB脚对地电容防干扰'], alternatives: ['VIPer12A', 'DK112', 'AP8012'], purchase: '约2-3元/片，立创商城有售', datasheet: '访问ST官网下载VIPer22A数据手册'
        },
        PC817: {
          name: '光耦', brand: 'Sharp', model: 'PC817', category: '光电耦合器', position: '通用光电耦合器',
          params: [{ name: '输入电压', value: '1.2V' }, { name: '隔离电压', value: '5000Vrms' }, { name: '电流传输比', value: '50-600%' }],
          package: { type: 'DIP-4/SOP-4', size: '4.6x6.5mm', pins: '4' },
          pins: [{ num: '1', name: '阳极', func: '正极，接正电压' }, { num: '2', name: '阴极', func: '负极，接负电压' }, { num: '3', name: '发射极', func: '输出地，接地' }, { num: '4', name: '集电极', func: '输出端，接上拉电阻' }],
          features: { function: '输入输出电气隔离', advantages: '高隔离电压、低输入电流', applications: '开关电源反馈、空调通信', circuit: '输入端串1kΩ限流电阻，输出端接4.7kΩ上拉' },
          notices: ['输入电流不超过50mA', '注意引脚方向不能反', '焊接时间小于5秒'], alternatives: ['EL817', 'LTV817', 'K1010'], purchase: '约0.3-0.5元/片', datasheet: '访问Sharp官网下载'
        },
        LM358: {
          name: '运算放大器', brand: 'TI', model: 'LM358', category: '双路运放', position: '通用型双路运算放大器',
          params: [{ name: '工作电压', value: '3-32V' }, { name: '功耗', value: '0.7mA' }, { name: '带宽', value: '1.1MHz' }],
          package: { type: 'DIP-8/SOP-8', size: '9.8x6.4mm', pins: '8' },
          pins: [{ num: '1', name: 'OUT1', func: '通道1输出' }, { num: '2', name: 'IN1-', func: '通道1反相输入' }, { num: '3', name: 'IN1+', func: '通道1同相输入' }, { num: '4', name: 'GND', func: '地' }],
          features: { function: '双路运算放大器', advantages: '低功耗、宽电源电压', applications: '传感器信号放大、电压比较器', circuit: '单电源供电时，同相输入端加1/2VCC偏置' },
          notices: ['输入电压不能超过VCC', '输出有短路保护'], alternatives: ['LM2904', 'NE5532'], purchase: '约0.5-1元/片', datasheet: '访问TI官网下载LM358数据手册'
        },
        NE555: {
          name: '定时器', brand: 'TI', model: 'NE555', category: '定时器IC', position: '经典555定时器',
          params: [{ name: '工作电压', value: '4.5-16V' }, { name: '最大频率', value: '500kHz' }, { name: '输出电流', value: '200mA' }],
          package: { type: 'DIP-8/SOP-8', size: '9.8x6.4mm', pins: '8' },
          pins: [{ num: '1', name: 'GND', func: '地' }, { num: '2', name: 'TRIG', func: '触发输入端' }, { num: '3', name: 'OUT', func: '输出端' }, { num: '4', name: 'RESET', func: '复位，低电平有效' }],
          features: { function: '精密定时/振荡电路', advantages: '稳定可靠、输出电流大', applications: '延时电路、方波振荡器、PWM产生', circuit: '单稳态：触发脚接按键；无稳态：R1接VCC-R2接DISCH' },
          notices: ['RESET低电平复位', 'CTRL脚可外接电容滤波'], alternatives: ['LM555', 'TLC555'], purchase: '约0.5-1元/片', datasheet: '访问TI官网下载NE555数据手册'
        },
        '7805': {
          name: '三端稳压器', brand: 'ST', model: '7805', category: '线性稳压器', position: '正电压稳压器',
          params: [{ name: '输出电压', value: '5V' }, { name: '输入电压', value: '7-35V' }, { name: '输出电流', value: '1A' }],
          package: { type: 'TO-220', size: '10.2x4.6mm', pins: '3' },
          pins: [{ num: '1', name: 'INPUT', func: '输入端，接未稳压电压' }, { num: '2', name: 'GND', func: '地' }, { num: '3', name: 'OUTPUT', func: '输出端，5V' }],
          features: { function: '固定输出5V线性稳压器', advantages: '电路简单、输出稳定', applications: '单片机供电、5V逻辑电路', circuit: '输入输出各加0.33μF和0.1μF电容' },
          notices: ['输入输出需加滤波电容', '大电流需加散热片'], alternatives: ['LM7805', 'L7805', 'AMS1117-5.0'], purchase: '约0.5-1元/片', datasheet: '访问ST官网下载7805数据手册'
        }
      }
      
      if (db[model]) {
        return db[model]
      }
      
      return {
        name: model, brand: '请查阅', model: model, category: '半导体器件', position: '参考原厂数据手册',
        params: [{ name: '请查阅', value: '原厂规格书' }],
        package: { type: '参考规格书', size: '-', pins: '-' },
        pins: [{ num: '1', name: '-', func: '参考数据手册' }],
        features: { function: '-', advantages: '-', applications: '-', circuit: '-' },
        notices: ['请查阅原厂规格书获取详细参数', '注意静电防护'], alternatives: ['建议查看原厂应用笔记'], purchase: '联系原厂或授权代理商', datasheet: '访问原厂官网下载'
      }
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
.textarea { border: 1px solid #ddd; border-radius: 12px; padding: 14px; background: #fafafa; width: 100%; box-sizing: border-box; min-height: 50px; margin-bottom: 15px; }
.quick-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; }
.quick-tag { background: #e3f2fd; color: #1565C0; padding: 6px 12px; border-radius: 20px; font-size: 12px; }
.mode-switch { display: flex; align-items: center; margin-bottom: 15px; }
.mode-label { font-size: 14px; color: #666; margin-right: 10px; }
.mode-btns { display: flex; gap: 10px; }
.mode-btn { padding: 6px 16px; border-radius: 20px; background: #f0f0f0; color: #666; }
.mode-btn.active { background: #1565C0; color: #fff; }
.search-btn { background: #1565C0; color: #fff; border-radius: 30px; padding: 14px; width: 100%; border: none; }
.result { margin-top: 20px; }
.section { background: #fff; border-radius: 16px; padding: 20px; margin-bottom: 15px; }
.section-title { font-size: 18px; font-weight: bold; color: #1565C0; margin-bottom: 15px; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }
.info-row { display: flex; margin-bottom: 8px; flex-wrap: wrap; }
.info-row .label { font-weight: bold; color: #666; width: 100px; }
.param-row { display: flex; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
.param-name { font-weight: bold; color: #666; width: 100px; }
.param-value { color: #333; }
.pin-table { width: 100%; margin-top: 10px; }
.pin-header, .pin-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
.pin-header { background: #f5f5f5; font-weight: bold; }
.pin-header text, .pin-num, .pin-name { width: 80px; }
.pin-func { flex: 1; }
.alt-list { display: flex; flex-wrap: wrap; gap: 8px; }
.alt-tag { background: #e3f2fd; color: #1565C0; padding: 4px 10px; border-radius: 20px; font-size: 12px; }
.notice-item { display: flex; gap: 8px; margin-bottom: 8px; }
.notice-icon { color: #f44336; }
.notice-text { flex: 1; color: #666; }
.warning { background: #ffebee; }
.loading { text-align: center; padding: 60px; background: #fff; border-radius: 16px; margin-top: 20px; }
.loading-spinner { width: 50px; height: 50px; border: 4px solid #e0e0e0; border-top-color: #1565C0; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>