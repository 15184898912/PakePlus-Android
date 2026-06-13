// 完整故障码数据库
export const faultDatabase = {
  "格力": {
    "E1": {
      meaning: "高压保护",
      mechanism: "系统压力过高或冷凝器散热不良",
      check_points: ["冷凝器是否脏堵", "风机是否运转", "系统是否缺氟"],
      repair_steps: ["清洗冷凝器翅片", "检查风机电机和电容", "测量系统压力", "更换高压开关"],
      components: ["高压开关", "风机电容", "冷凝器"],
      safety: "⚠️ 制冷剂压力高，注意安全"
    },
    "E2": {
      meaning: "防冻结保护",
      mechanism: "蒸发器温度过低",
      check_points: ["过滤网是否脏堵", "风机转速是否正常"],
      repair_steps: ["清洗过滤网", "检查风机电容", "补充制冷剂"],
      components: ["过滤网", "风机电容"],
      safety: "检查蒸发器是否结冰"
    },
    "E3": {
      meaning: "低压保护",
      mechanism: "系统压力过低，缺氟",
      check_points: ["制冷剂是否泄漏", "管路是否有油渍"],
      repair_steps: ["检漏仪检查管路", "补充制冷剂", "查找漏点并焊接"],
      components: ["制冷剂", "管路接头"],
      safety: "⚠️ 注意防火"
    },
    "E4": {
      meaning: "排气温度过高",
      mechanism: "压缩机排气温度超过130℃",
      check_points: ["系统是否缺氟", "管路是否堵塞"],
      repair_steps: ["检查制冷剂压力", "清洗系统", "更换压缩机"],
      components: ["压缩机", "排气温控器"],
      safety: "⚠️ 高温烫伤风险"
    },
    "E5": {
      meaning: "过电流保护",
      mechanism: "压缩机电流过大",
      check_points: ["压缩机是否卡缸", "电容是否失效"],
      repair_steps: ["测量压缩机阻值", "检查启动电容", "测量电源电压"],
      components: ["压缩机", "启动电容"],
      safety: "⚠️ 断电后操作"
    },
    "E6": {
      meaning: "通信故障",
      mechanism: "内外机通信中断",
      check_points: ["连接线是否断路", "通信光耦是否损坏"],
      repair_steps: ["检查连接线S端", "测量通信电压24V", "更换光耦PC817"],
      components: ["连接线", "光耦PC817"],
      safety: "测量时注意防触电"
    }
  },
  "美的": {
    "E1": {
      meaning: "温度传感器故障",
      mechanism: "室温传感器开路或短路",
      check_points: ["传感器阻值是否正常", "连接线是否松动"],
      repair_steps: ["测量传感器阻值", "检查插头", "更换传感器"],
      components: ["室温传感器"],
      safety: "低压电路"
    },
    "E3": {
      meaning: "风机速度失控",
      mechanism: "风机反馈信号异常",
      check_points: ["风机是否卡死", "霍尔元件是否损坏"],
      repair_steps: ["手动转动风轮", "测量霍尔信号", "更换风机电机"],
      components: ["风机电机", "霍尔元件"],
      safety: "断电操作"
    },
    "E5": {
      meaning: "室外机故障保护",
      mechanism: "室外机主板或压缩机故障",
      check_points: ["外机主板指示灯", "压缩机是否启动"],
      repair_steps: ["检查外机电源", "测量压缩机绕组", "更换外机主板"],
      components: ["外机主板", "压缩机"],
      safety: "⚠️ 高压危险"
    }
  },
  "海尔": {
    "E1": {
      meaning: "室温传感器故障",
      mechanism: "传感器开路或短路",
      check_points: ["传感器阻值", "连接线"],
      repair_steps: ["测量传感器阻值", "更换传感器"],
      components: ["室温传感器"],
      safety: "低压电路"
    },
    "E7": {
      meaning: "通信故障",
      mechanism: "内外机通信异常",
      check_points: ["连接线", "通信电路"],
      repair_steps: ["检查S-N线电压", "更换主板"],
      components: ["连接线", "主板"],
      safety: "注意防触电"
    }
  },
  "通用": {
    "F1": {
      meaning: "模块保护（IPM）",
      mechanism: "智能功率模块过流或过热",
      check_points: ["压缩机是否卡死", "模块是否烧坏"],
      repair_steps: ["断电5分钟后测量", "更换IPM模块"],
      components: ["IPM模块", "压缩机"],
      safety: "⚠️ 断电5分钟后操作"
    },
    "H5": {
      meaning: "电压过高/过低保护",
      mechanism: "电源电压异常",
      check_points: ["输入电压", "压敏电阻"],
      repair_steps: ["测量输入电压", "检查压敏电阻"],
      components: ["压敏电阻", "整流桥"],
      safety: "⚠️ 注意用电安全"
    }
  }
}

// 获取故障诊断
export function getFaultDiagnosis(brand, faultCode) {
  const brandFaults = faultDatabase[brand] || faultDatabase["通用"]
  const fault = brandFaults[faultCode]
  
  if (fault) {
    return {
      meaning: fault.meaning,
      mechanism: fault.mechanism,
      check_points: fault.check_points,
      repair_steps: fault.repair_steps.map((step, index) => ({
        step: index + 1,
        action: step
      })),
      components: fault.components,
      safety_warning: fault.safety
    }
  }
  
  return {
    meaning: `故障码 ${faultCode}`,
    mechanism: "请查阅厂家技术手册",
    check_points: ["确认故障码", "检查连接线", "断电重启"],
    repair_steps: [
      { step: 1, action: "确认故障码是否正确显示" },
      { step: 2, action: "检查所有连接线" },
      { step: 3, action: "断电5分钟后重启" }
    ],
    components: [],
    safety_warning: "维修前请务必断电"
  }
}