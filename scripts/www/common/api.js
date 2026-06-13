// 模拟API请求
const BASE_URL = 'https://api.repair-assistant.com/v1'

export function recognizeModel(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        matched_model: 'KFR-35GW/BDN8Y',
        confidence: 0.96,
        brand: data.brand || '格力',
        category: data.category || '壁挂式空调',
        series: '冷静王+',
        schematics_available: true
      })
    }, 800)
  })
}

export function diagnoseFault(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const faultCode = data.faultCode || 'E5'
      const faultDatabase = {
        'E1': {
          meaning: '室温传感器故障',
          mechanism: '室内环境温度传感器开路或短路，主板检测到异常阻值',
          common_components: [
            { component: '室温传感器(10kΩ)', probability: '80%', location: '室内机蒸发器右侧' },
            { component: '主板分压电阻R12', probability: '15%', location: '主控板CN1插头旁' }
          ],
          measure_points: [
            { pin: '传感器两端', normal_value: '10kΩ@25°C', tool: '电阻档' }
          ],
          repair_steps: [
            { step: 1, action: '拔掉传感器插头，测量阻值', tool: '万用表电阻档', value_range: '25°C时约10kΩ' },
            { step: 2, action: '若阻值异常，更换同规格传感器', tool: '烙铁', value_range: '10kΩ B=3435' }
          ],
          safety_warning: '低压电路，注意防静电'
        },
        'E5': {
          meaning: '室内外机通信故障',
          mechanism: '通信线路中断或主板损坏，内外机无法交换数据',
          common_components: [
            { component: '通信光耦PC817', probability: '60%', location: '内机主控板CN6端子附近' },
            { component: '连接线S端', probability: '25%', location: '内外机连接线' }
          ],
          measure_points: [
            { pin: 'S-N电压', normal_value: '24V±5V', tool: '直流档' }
          ],
          repair_steps: [
            { step: 1, action: '断电重启，排除程序死机', tool: '无', value_range: null },
            { step: 2, action: '测量外机接线端子S与N直流电压', tool: '万用表直流档', value_range: '正常24V±5V' }
          ],
          safety_warning: '⚠️ 测量通信线电压时，禁止断开接地线！'
        }
      }
      resolve(faultDatabase[faultCode] || {
        meaning: `未知故障码: ${faultCode}`,
        mechanism: '请检查用户手册或联系厂家技术支持',
        common_components: [],
        measure_points: [],
        repair_steps: [{ step: 1, action: '确认故障码是否正确显示', tool: '观察', value_range: null }],
        safety_warning: '维修前请断电'
      })
    }, 600)
  })
}

export function getSchematic(modelId, module) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        image_url: '/static/demo.png',
        thumbnail_url: '/static/demo.png',
        has_high_voltage: module === 'power',
        annotations: [
          { component_id: 'C101', type: '电容', params: '450V 100μF', x: 15, y: 30, pin_def: '正负极标识+' },
          { component_id: 'Q101', type: 'IGBT', params: '40A 600V', x: 45, y: 55, pin_def: 'G-C-E' },
          { component_id: 'U101', type: '光耦PC817', params: '输入1.2V 输出30V', x: 70, y: 20, pin_def: '1-2阳极 3-4集电极' }
        ],
        high_voltage_zones: [[10, 60, 40, 80], [70, 10, 95, 35]]
      })
    }, 500)
  })
}

export function getAvailableModules(modelId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { module: 'main', name: '主控板', available: true },
        { module: 'power', name: '电源板', available: true },
        { module: 'driver', name: '驱动板', available: true },
        { module: 'display', name: '显示面板', available: true },
        { module: 'sensor', name: '传感器回路', available: true }
      ])
    }, 300)
  })
}

export function searchModels(keyword) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: '1', full_model: 'KFR-35GW/BDN8Y', brand: '美的', series: '冷静星', confidence: 0.98 },
        { id: '2', full_model: 'KFR-35GW/(35592)FNhAa-A3', brand: '格力', series: '冷静王', confidence: 0.95 },
        { id: '3', full_model: 'KFR-35GW/01KBB22', brand: '海尔', series: '劲铂', confidence: 0.92 }
      ])
    }, 500)
  })
}