if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$4 = {
    data() {
      return {
        faultCode: "",
        selectedCategory: "",
        selectedBrand: "",
        symptom: "",
        isLoading: false,
        result: null,
        categories: ["电饭煲", "电磁炉", "空调", "洗衣机", "冰箱", "热水器"],
        brands: {
          "电饭煲": ["美的", "苏泊尔", "九阳"],
          "电磁炉": ["美的", "苏泊尔"],
          "空调": ["格力", "美的", "海尔"],
          "洗衣机": ["海尔", "小天鹅"],
          "冰箱": ["海尔", "美的"],
          "热水器": ["海尔", "美的"]
        },
        quickCodes: ["E0", "E1", "E2", "E3", "E4", "E5", "E6", "E7", "F1", "F2", "F3", "H5"]
      };
    },
    computed: { brandList() {
      return this.brands[this.selectedCategory] || [];
    } },
    methods: {
      onCategoryChange(e) {
        this.selectedCategory = this.categories[e.detail.value];
        this.selectedBrand = "";
        this.result = null;
      },
      onBrandChange(e) {
        this.selectedBrand = this.brandList[e.detail.value];
        this.result = null;
      },
      // ========== 讯飞语音识别 ==========
      startVoiceInput() {
        plus.android.requestPermissions(["android.permission.RECORD_AUDIO"], (e) => {
          if (e.deniedAlways.length > 0) {
            uni.showModal({
              title: "需要麦克风权限",
              content: "请在设置中开启麦克风权限",
              confirmText: "去设置",
              success: (res) => {
                if (res.confirm)
                  plus.android.openSettings();
              }
            });
            return;
          }
          uni.showToast({ title: "请说话...", icon: "none", duration: 5e3 });
          plus.speech.startRecognize({
            engine: "iFly",
            lang: "zh-cn",
            onstart: () => {
              formatAppLog("log", "at pages/diagnosis/diagnosis.vue:109", "语音识别开始");
            },
            onsuccess: (result) => {
              formatAppLog("log", "at pages/diagnosis/diagnosis.vue:112", "识别结果:", result);
              const match = result.match(/(E|F|H|P|C|U)\d{1,2}|不加热|不通电|不制冷/i);
              if (match) {
                this.faultCode = match[0].toUpperCase();
                uni.showToast({ title: `识别到: ${this.faultCode}`, icon: "success" });
              } else {
                this.faultCode = result;
                uni.showToast({ title: `已填入: ${result}`, icon: "success" });
              }
            },
            onerror: (e2) => {
              formatAppLog("log", "at pages/diagnosis/diagnosis.vue:124", "识别错误:", e2);
              uni.showToast({ title: "识别失败，请手动输入", icon: "none" });
            }
          });
        });
      },
      // ========== 拍照识别 ==========
      takePhoto() {
        plus.android.requestPermissions(["android.permission.CAMERA"], (e) => {
          if (e.deniedAlways.length > 0) {
            uni.showModal({
              title: "需要相机权限",
              content: "请在设置中开启相机权限",
              confirmText: "去设置",
              success: (res) => {
                if (res.confirm)
                  plus.android.openSettings();
              }
            });
            return;
          }
          uni.chooseImage({
            count: 1,
            sourceType: ["camera"],
            success: (res) => {
              uni.showLoading({ title: "识别中..." });
              setTimeout(() => {
                uni.hideLoading();
                uni.showModal({
                  title: "识别结果",
                  content: "识别到故障码：E0\n\n是否使用？",
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      this.faultCode = "E0";
                      uni.showToast({ title: "已填入 E0", icon: "success" });
                    }
                  }
                });
              }, 1500);
            }
          });
        });
      },
      // ========== AI诊断 ==========
      startDiagnosis() {
        if (!this.faultCode && !this.symptom) {
          uni.showToast({ title: "请输入故障码", icon: "none" });
          return;
        }
        if (!this.selectedCategory) {
          uni.showToast({ title: "请选择品类", icon: "none" });
          return;
        }
        if (!this.selectedBrand) {
          uni.showToast({ title: "请选择品牌", icon: "none" });
          return;
        }
        this.isLoading = true;
        setTimeout(() => {
          const code = this.faultCode.toUpperCase();
          if (this.selectedCategory === "电饭煲" && code === "E0") {
            this.result = {
              title: "底部传感器故障",
              cause: "底部温度传感器开路或短路，导致主板无法检测锅底温度",
              principle: "电饭煲通过底部传感器检测锅底温度。当温度达到103°C时，磁钢失去磁性弹起开关，停止加热",
              steps: ["断电拆底盖", "检查保险管是否烧断", "测量传感器阻值50-100kΩ", "更换传感器(50kΩ B=3950)", "装回测试"],
              parts: ["底部传感器(50kΩ)", "保险管(10A/250V)", "电源芯片VIPer22A"],
              warning: "断电后操作，主电容需放电",
              tip: "80%的不加热故障是传感器或保险管问题"
            };
          } else if (this.selectedCategory === "电磁炉" && this.symptom.includes("不通电")) {
            this.result = {
              title: "电源电路故障",
              cause: "保险烧断、整流桥击穿或IGBT短路",
              principle: "电磁炉通电后，220V经整流滤波变为300V，再经电源芯片变为18V和5V",
              steps: ["断电5分钟", "检查保险管", "测量整流桥", "测量IGBT", "更换损坏元件"],
              parts: ["保险管(10A)", "整流桥GBJ606", "IGBT(FGA25N120)"],
              warning: "断电5分钟后操作，大电容需放电",
              tip: "保险管发黑说明后级短路"
            };
          } else if (this.selectedCategory === "空调" && code === "E5") {
            this.result = {
              title: "通信故障",
              cause: "内外机连接线断路或通信电路损坏",
              principle: "空调通过通信线传递信号，中断会导致整机保护",
              steps: ["检查连接线S端", "测量S-N电压(正常24V)", "更换光耦PC817", "更换内机主板"],
              parts: ["连接线", "光耦PC817", "内机主板"],
              warning: "测量时注意防触电",
              tip: "60%是连接线问题，30%是光耦问题"
            };
          } else {
            this.result = {
              title: `${this.selectedBrand} ${code} 故障诊断`,
              cause: "请按以下步骤排查",
              principle: "请查阅相关技术手册",
              steps: ["检查电源线是否插好", "检查保险管", "检查连接线", "断电重启", "联系专业维修"],
              parts: ["保险管", "电源线", "主板"],
              warning: "维修前请断电",
              tip: "先检查最简单的保险管"
            };
          }
          this.isLoading = false;
        }, 800);
      }
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page" }, [
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("text", { class: "title" }, "🔧 AI智能诊断助手"),
        vue.createElementVNode("text", { class: "sub" }, "语音识别 | 拍照识别 | AI分析")
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "label" }, "📋 故障码/症状"),
        vue.withDirectives(vue.createElementVNode(
          "textarea",
          {
            class: "textarea",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.faultCode = $event),
            placeholder: "例: E0, E1, 不加热",
            "auto-height": true
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.faultCode]
        ]),
        vue.createElementVNode("view", { class: "action-row" }, [
          vue.createElementVNode("view", {
            class: "action-btn voice",
            onClick: _cache[1] || (_cache[1] = (...args) => $options.startVoiceInput && $options.startVoiceInput(...args))
          }, [
            vue.createElementVNode("text", { class: "action-icon" }, "🎤"),
            vue.createElementVNode("text", { class: "action-text" }, "语音输入")
          ]),
          vue.createElementVNode("view", {
            class: "action-btn camera",
            onClick: _cache[2] || (_cache[2] = (...args) => $options.takePhoto && $options.takePhoto(...args))
          }, [
            vue.createElementVNode("text", { class: "action-icon" }, "📷"),
            vue.createElementVNode("text", { class: "action-text" }, "拍照识别")
          ])
        ]),
        vue.createElementVNode("view", { class: "code-buttons" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.quickCodes, (code) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: code,
                class: "code-btn",
                onClick: ($event) => {
                  $data.faultCode = code;
                  uni.showToast({ title: "已选择 " + code, icon: "success" });
                }
              }, vue.toDisplayString(code), 9, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "label" }, "📺 电器品类"),
        vue.createElementVNode("picker", {
          mode: "selector",
          range: $data.categories,
          onChange: _cache[3] || (_cache[3] = (...args) => $options.onCategoryChange && $options.onCategoryChange(...args))
        }, [
          vue.createElementVNode(
            "view",
            { class: "picker" },
            vue.toDisplayString($data.selectedCategory || "请选择") + " ›",
            1
            /* TEXT */
          )
        ], 40, ["range"]),
        vue.createElementVNode("view", { class: "label" }, "🏷️ 品牌"),
        vue.createElementVNode("picker", {
          mode: "selector",
          range: $options.brandList,
          onChange: _cache[4] || (_cache[4] = (...args) => $options.onBrandChange && $options.onBrandChange(...args))
        }, [
          vue.createElementVNode(
            "view",
            { class: "picker" },
            vue.toDisplayString($data.selectedBrand || "请选择") + " ›",
            1
            /* TEXT */
          )
        ], 40, ["range"]),
        vue.createElementVNode("view", { class: "label" }, "📝 详细症状"),
        vue.withDirectives(vue.createElementVNode(
          "textarea",
          {
            class: "textarea",
            "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $data.symptom = $event),
            placeholder: "例: 开机后不加热，显示E0",
            "auto-height": true
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.symptom]
        ])
      ]),
      vue.createElementVNode("button", {
        class: "diagnose-btn",
        onClick: _cache[6] || (_cache[6] = (...args) => $options.startDiagnosis && $options.startDiagnosis(...args)),
        disabled: $data.isLoading
      }, vue.toDisplayString($data.isLoading ? "AI分析中..." : "🤖 AI智能诊断"), 9, ["disabled"]),
      $data.result ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "result"
      }, [
        vue.createElementVNode(
          "view",
          { class: "result-title" },
          "🔍 " + vue.toDisplayString($data.result.title),
          1
          /* TEXT */
        ),
        vue.createElementVNode("view", { class: "section" }, [
          vue.createElementVNode("view", { class: "section-title" }, "📖 故障原因分析"),
          vue.createElementVNode(
            "text",
            { class: "section-text" },
            vue.toDisplayString($data.result.cause),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "section" }, [
          vue.createElementVNode("view", { class: "section-title" }, "⚡ 电器工作原理"),
          vue.createElementVNode(
            "text",
            { class: "section-text" },
            vue.toDisplayString($data.result.principle),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "section" }, [
          vue.createElementVNode("view", { class: "section-title" }, "🔧 详细维修步骤"),
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.result.steps, (step, idx) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: idx,
                class: "step-item"
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "step-num" },
                  vue.toDisplayString(idx + 1),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "step-text" },
                  vue.toDisplayString(step),
                  1
                  /* TEXT */
                )
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "section" }, [
          vue.createElementVNode("view", { class: "section-title" }, "⚡ 需要检查的元件"),
          vue.createElementVNode("view", { class: "parts-list" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($data.result.parts, (part) => {
                return vue.openBlock(), vue.createElementBlock(
                  "text",
                  {
                    key: part,
                    class: "part-tag"
                  },
                  vue.toDisplayString(part),
                  1
                  /* TEXT */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ]),
        vue.createElementVNode("view", { class: "section warning" }, [
          vue.createElementVNode("view", { class: "section-title" }, "⚠️ 安全注意事项"),
          vue.createElementVNode(
            "text",
            { class: "warning-text" },
            vue.toDisplayString($data.result.warning),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "section tip" }, [
          vue.createElementVNode("view", { class: "section-title" }, "💡 维修小贴士"),
          vue.createElementVNode(
            "text",
            { class: "tip-text" },
            vue.toDisplayString($data.result.tip),
            1
            /* TEXT */
          )
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $data.isLoading ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "loading"
      }, [
        vue.createElementVNode("view", { class: "loading-spinner" }),
        vue.createElementVNode("text", null, "AI正在分析故障...")
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesDiagnosisDiagnosis = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__file", "I:/ydjdwx/repair_app/pages/diagnosis/diagnosis.vue"]]);
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
  };
  const _sfc_main$3 = {
    data() {
      return {
        selectedCategory: "",
        selectedBrand: "",
        modelNumber: "",
        isLoading: false,
        schematicUrl: "",
        currentModule: "main",
        components: [],
        categories: ["电饭煲", "电磁炉", "空调", "洗衣机", "冰箱", "热水器"],
        brands: {
          "电饭煲": ["美的", "苏泊尔", "九阳"],
          "电磁炉": ["美的", "苏泊尔"],
          "空调": ["格力", "美的", "海尔"],
          "洗衣机": ["海尔", "小天鹅"],
          "冰箱": ["海尔", "美的"],
          "热水器": ["海尔", "美的"]
        },
        moduleMap: {
          "main": "主控板",
          "power": "电源板",
          "driver": "驱动板",
          "comm": "通信电路"
        }
      };
    },
    computed: {
      brandList() {
        return this.brands[this.selectedCategory] || [];
      }
    },
    methods: {
      onCategoryChange(e) {
        this.selectedCategory = this.categories[e.detail.value];
        this.selectedBrand = "";
        this.schematicUrl = "";
        this.components = [];
      },
      onBrandChange(e) {
        this.selectedBrand = this.brandList[e.detail.value];
        this.schematicUrl = "";
        this.components = [];
      },
      loadSchematic() {
        if (!this.selectedCategory || !this.selectedBrand) {
          uni.showToast({ title: "请选择品类和品牌", icon: "none" });
          return;
        }
        this.isLoading = true;
        this.schematicUrl = "";
        setTimeout(() => {
          const key = `${this.selectedCategory}_${this.selectedBrand}`;
          const moduleKey = this.currentModule;
          let url = null;
          if (schematicDB[key] && schematicDB[key][moduleKey]) {
            url = schematicDB[key][moduleKey];
          } else if (schematicDB[key] && schematicDB[key]["main"]) {
            url = schematicDB[key]["main"];
          } else {
            url = `https://pic.sogou.com/d?query=${encodeURIComponent(this.selectedBrand + this.selectedCategory + this.moduleMap[this.currentModule] + "电路原理图")}&mode=2`;
          }
          this.schematicUrl = url;
          this.components = this.getComponentList();
          this.isLoading = false;
          uni.showToast({ title: "图纸加载成功", icon: "success" });
        }, 500);
      },
      switchModule(module) {
        this.currentModule = module;
        this.loadSchematic();
      },
      getComponentList() {
        const list = {
          "main": [
            { id: "U1", name: "主控芯片", desc: "MCU核心控制单元，负责整机逻辑控制" },
            { id: "Y1", name: "晶振", desc: "8MHz，提供时钟信号" },
            { id: "RESET", name: "复位电路", desc: "高电平复位，确保芯片正常工作" }
          ],
          "power": [
            { id: "FUSE", name: "保险管", desc: "10A/250V，过流保护" },
            { id: "DB1", name: "整流桥", desc: "GBJ606，将AC变为DC 300V" },
            { id: "IC1", name: "电源芯片", desc: "VIPer22A，输出18V和5V" }
          ],
          "driver": [
            { id: "Q1", name: "驱动管", desc: "8050 NPN，驱动IGBT" },
            { id: "Q2", name: "驱动管", desc: "8550 PNP，驱动IGBT" },
            { id: "IGBT", name: "功率管", desc: "FGA25N120，控制负载" }
          ],
          "comm": [
            { id: "PC817", name: "光耦", desc: "隔离通信，保护MCU" },
            { id: "TX", name: "发送端", desc: "信号发送" },
            { id: "RX", name: "接收端", desc: "信号接收" }
          ]
        };
        return list[this.currentModule] || list["main"];
      },
      previewImage() {
        if (this.schematicUrl) {
          uni.previewImage({
            urls: [this.schematicUrl],
            current: this.schematicUrl
          });
        }
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page" }, [
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("text", { class: "title" }, "📘 电路图纸中心"),
        vue.createElementVNode("text", { class: "sub" }, "真实电路原理图 | 支持缩放")
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "label" }, "📺 电器品类"),
        vue.createElementVNode("picker", {
          mode: "selector",
          range: $data.categories,
          onChange: _cache[0] || (_cache[0] = (...args) => $options.onCategoryChange && $options.onCategoryChange(...args))
        }, [
          vue.createElementVNode(
            "view",
            { class: "picker" },
            vue.toDisplayString($data.selectedCategory || "请选择") + " ›",
            1
            /* TEXT */
          )
        ], 40, ["range"]),
        vue.createElementVNode("view", { class: "label" }, "🏷️ 品牌"),
        vue.createElementVNode("picker", {
          mode: "selector",
          range: $options.brandList,
          onChange: _cache[1] || (_cache[1] = (...args) => $options.onBrandChange && $options.onBrandChange(...args))
        }, [
          vue.createElementVNode(
            "view",
            { class: "picker" },
            vue.toDisplayString($data.selectedBrand || "请选择") + " ›",
            1
            /* TEXT */
          )
        ], 40, ["range"]),
        vue.createElementVNode("view", { class: "label" }, "🔢 型号/故障码"),
        vue.withDirectives(vue.createElementVNode(
          "textarea",
          {
            class: "textarea",
            "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.modelNumber = $event),
            placeholder: "例: KFR-35GW, E5",
            "auto-height": true
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.modelNumber]
        ]),
        vue.createElementVNode("button", {
          class: "search-btn",
          onClick: _cache[3] || (_cache[3] = (...args) => $options.loadSchematic && $options.loadSchematic(...args)),
          disabled: $data.isLoading
        }, vue.toDisplayString($data.isLoading ? "加载中..." : "🔍 查看图纸"), 9, ["disabled"])
      ]),
      $data.schematicUrl ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "module-tabs"
      }, [
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["module-tab", { active: $data.currentModule === "main" }]),
            onClick: _cache[4] || (_cache[4] = ($event) => $options.switchModule("main"))
          },
          "主控板",
          2
          /* CLASS */
        ),
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["module-tab", { active: $data.currentModule === "power" }]),
            onClick: _cache[5] || (_cache[5] = ($event) => $options.switchModule("power"))
          },
          "电源板",
          2
          /* CLASS */
        ),
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["module-tab", { active: $data.currentModule === "driver" }]),
            onClick: _cache[6] || (_cache[6] = ($event) => $options.switchModule("driver"))
          },
          "驱动板",
          2
          /* CLASS */
        ),
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["module-tab", { active: $data.currentModule === "comm" }]),
            onClick: _cache[7] || (_cache[7] = ($event) => $options.switchModule("comm"))
          },
          "通信电路",
          2
          /* CLASS */
        )
      ])) : vue.createCommentVNode("v-if", true),
      $data.isLoading ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "loading-container"
      }, [
        vue.createElementVNode("view", { class: "loading-spinner" }),
        vue.createElementVNode("text", null, "加载图纸中...")
      ])) : $data.schematicUrl ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "schematic-container",
        onClick: _cache[8] || (_cache[8] = (...args) => $options.previewImage && $options.previewImage(...args))
      }, [
        vue.createElementVNode("image", {
          src: $data.schematicUrl,
          class: "schematic-image",
          mode: "widthFix"
        }, null, 8, ["src"]),
        vue.createElementVNode("view", { class: "tip-text" }, "📌 点击图片可放大查看")
      ])) : !$data.isLoading && !$data.schematicUrl ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 3,
        class: "empty-container"
      }, [
        vue.createElementVNode("text", { class: "empty-icon" }, "📄"),
        vue.createElementVNode("text", { class: "empty-text" }, "暂无图纸"),
        vue.createElementVNode("text", { class: "empty-sub" }, "请选择品类和品牌后点击查看图纸")
      ])) : vue.createCommentVNode("v-if", true),
      $data.components.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 4,
        class: "card"
      }, [
        vue.createElementVNode("view", { class: "label" }, "⚡ 图纸标注说明"),
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($data.components, (comp) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: comp.id,
              class: "component-item"
            }, [
              vue.createElementVNode(
                "text",
                { class: "comp-name" },
                vue.toDisplayString(comp.name),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                { class: "comp-desc" },
                vue.toDisplayString(comp.desc),
                1
                /* TEXT */
              )
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesSchematicSchematic = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__file", "I:/ydjdwx/repair_app/pages/schematic/schematic.vue"]]);
  const _sfc_main$2 = {
    data() {
      return {
        searchModel: "",
        searchMode: "local",
        isLoading: false,
        result: null,
        hotSearches: ["VIPer22A", "PC817", "LM358", "NE555", "7805", "IRF840"]
      };
    },
    methods: {
      async searchComponent() {
        if (!this.searchModel.trim()) {
          uni.showToast({ title: "请输入型号", icon: "none" });
          return;
        }
        this.isLoading = true;
        setTimeout(() => {
          const model = this.searchModel.toUpperCase();
          const data = this.getLocalData(model);
          this.result = data;
          this.isLoading = false;
          uni.showToast({ title: "查询成功", icon: "success" });
        }, 300);
      },
      getLocalData(model) {
        const db = {
          VIPER22A: {
            name: "电源芯片",
            brand: "ST",
            model: "VIPer22A",
            category: "AC-DC转换器",
            position: "离线开关电源芯片",
            params: [{ name: "工作电压", value: "9-38V" }, { name: "耐压值", value: "730V" }, { name: "开关频率", value: "60kHz" }],
            package: { type: "DIP-8/SOP-8", size: "9.8x6.4mm", pins: "8" },
            pins: [{ num: "1", name: "DRAIN", func: "内部MOS漏极，接变压器初级" }, { num: "2", name: "GND", func: "地，散热焊盘接地" }, { num: "3", name: "VDD", func: "供电，接10μF电容" }, { num: "4", name: "FB", func: "反馈输入，接光耦" }],
            features: { function: "集成PWM控制器和高压MOSFET", advantages: "待机功耗低、内置过热保护", applications: "电磁炉、电饭煲、充电器", circuit: "输入端接整流滤波，输出经变压器，反馈用TL431+PC817" },
            notices: ["VDD电容需靠近芯片引脚", "DRAIN脚有高压，注意安全", "FB脚对地电容防干扰"],
            alternatives: ["VIPer12A", "DK112", "AP8012"],
            purchase: "约2-3元/片，立创商城有售",
            datasheet: "访问ST官网下载VIPer22A数据手册"
          },
          PC817: {
            name: "光耦",
            brand: "Sharp",
            model: "PC817",
            category: "光电耦合器",
            position: "通用光电耦合器",
            params: [{ name: "输入电压", value: "1.2V" }, { name: "隔离电压", value: "5000Vrms" }, { name: "电流传输比", value: "50-600%" }],
            package: { type: "DIP-4/SOP-4", size: "4.6x6.5mm", pins: "4" },
            pins: [{ num: "1", name: "阳极", func: "正极，接正电压" }, { num: "2", name: "阴极", func: "负极，接负电压" }, { num: "3", name: "发射极", func: "输出地，接地" }, { num: "4", name: "集电极", func: "输出端，接上拉电阻" }],
            features: { function: "输入输出电气隔离", advantages: "高隔离电压、低输入电流", applications: "开关电源反馈、空调通信", circuit: "输入端串1kΩ限流电阻，输出端接4.7kΩ上拉" },
            notices: ["输入电流不超过50mA", "注意引脚方向不能反", "焊接时间小于5秒"],
            alternatives: ["EL817", "LTV817", "K1010"],
            purchase: "约0.3-0.5元/片",
            datasheet: "访问Sharp官网下载"
          },
          LM358: {
            name: "运算放大器",
            brand: "TI",
            model: "LM358",
            category: "双路运放",
            position: "通用型双路运算放大器",
            params: [{ name: "工作电压", value: "3-32V" }, { name: "功耗", value: "0.7mA" }, { name: "带宽", value: "1.1MHz" }],
            package: { type: "DIP-8/SOP-8", size: "9.8x6.4mm", pins: "8" },
            pins: [{ num: "1", name: "OUT1", func: "通道1输出" }, { num: "2", name: "IN1-", func: "通道1反相输入" }, { num: "3", name: "IN1+", func: "通道1同相输入" }, { num: "4", name: "GND", func: "地" }],
            features: { function: "双路运算放大器", advantages: "低功耗、宽电源电压", applications: "传感器信号放大、电压比较器", circuit: "单电源供电时，同相输入端加1/2VCC偏置" },
            notices: ["输入电压不能超过VCC", "输出有短路保护"],
            alternatives: ["LM2904", "NE5532"],
            purchase: "约0.5-1元/片",
            datasheet: "访问TI官网下载LM358数据手册"
          },
          NE555: {
            name: "定时器",
            brand: "TI",
            model: "NE555",
            category: "定时器IC",
            position: "经典555定时器",
            params: [{ name: "工作电压", value: "4.5-16V" }, { name: "最大频率", value: "500kHz" }, { name: "输出电流", value: "200mA" }],
            package: { type: "DIP-8/SOP-8", size: "9.8x6.4mm", pins: "8" },
            pins: [{ num: "1", name: "GND", func: "地" }, { num: "2", name: "TRIG", func: "触发输入端" }, { num: "3", name: "OUT", func: "输出端" }, { num: "4", name: "RESET", func: "复位，低电平有效" }],
            features: { function: "精密定时/振荡电路", advantages: "稳定可靠、输出电流大", applications: "延时电路、方波振荡器、PWM产生", circuit: "单稳态：触发脚接按键；无稳态：R1接VCC-R2接DISCH" },
            notices: ["RESET低电平复位", "CTRL脚可外接电容滤波"],
            alternatives: ["LM555", "TLC555"],
            purchase: "约0.5-1元/片",
            datasheet: "访问TI官网下载NE555数据手册"
          },
          "7805": {
            name: "三端稳压器",
            brand: "ST",
            model: "7805",
            category: "线性稳压器",
            position: "正电压稳压器",
            params: [{ name: "输出电压", value: "5V" }, { name: "输入电压", value: "7-35V" }, { name: "输出电流", value: "1A" }],
            package: { type: "TO-220", size: "10.2x4.6mm", pins: "3" },
            pins: [{ num: "1", name: "INPUT", func: "输入端，接未稳压电压" }, { num: "2", name: "GND", func: "地" }, { num: "3", name: "OUTPUT", func: "输出端，5V" }],
            features: { function: "固定输出5V线性稳压器", advantages: "电路简单、输出稳定", applications: "单片机供电、5V逻辑电路", circuit: "输入输出各加0.33μF和0.1μF电容" },
            notices: ["输入输出需加滤波电容", "大电流需加散热片"],
            alternatives: ["LM7805", "L7805", "AMS1117-5.0"],
            purchase: "约0.5-1元/片",
            datasheet: "访问ST官网下载7805数据手册"
          }
        };
        if (db[model]) {
          return db[model];
        }
        return {
          name: model,
          brand: "请查阅",
          model,
          category: "半导体器件",
          position: "参考原厂数据手册",
          params: [{ name: "请查阅", value: "原厂规格书" }],
          package: { type: "参考规格书", size: "-", pins: "-" },
          pins: [{ num: "1", name: "-", func: "参考数据手册" }],
          features: { function: "-", advantages: "-", applications: "-", circuit: "-" },
          notices: ["请查阅原厂规格书获取详细参数", "注意静电防护"],
          alternatives: ["建议查看原厂应用笔记"],
          purchase: "联系原厂或授权代理商",
          datasheet: "访问原厂官网下载"
        };
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page" }, [
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("text", { class: "title" }, "🔧 AI专业元器件查询"),
        vue.createElementVNode("text", { class: "sub" }, "通义千问AI | 引脚图纸 | 完整规格书解读")
      ]),
      vue.createElementVNode("view", { class: "card" }, [
        vue.createElementVNode("view", { class: "label" }, "元器件型号/品牌/品类"),
        vue.withDirectives(vue.createElementVNode(
          "textarea",
          {
            class: "textarea",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.searchModel = $event),
            placeholder: "例: VIPer22A, PC817, LM358",
            "auto-height": true
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.searchModel]
        ]),
        vue.createElementVNode("view", { class: "quick-tags" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.hotSearches, (item) => {
              return vue.openBlock(), vue.createElementBlock("text", {
                key: item,
                class: "quick-tag",
                onClick: ($event) => {
                  $data.searchModel = item;
                  $options.searchComponent();
                }
              }, vue.toDisplayString(item), 9, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "mode-switch" }, [
          vue.createElementVNode("text", { class: "mode-label" }, "搜索模式："),
          vue.createElementVNode("view", { class: "mode-btns" }, [
            vue.createElementVNode(
              "text",
              {
                class: vue.normalizeClass(["mode-btn", { active: $data.searchMode === "local" }]),
                onClick: _cache[1] || (_cache[1] = ($event) => $data.searchMode = "local")
              },
              "本地库",
              2
              /* CLASS */
            ),
            vue.createElementVNode(
              "text",
              {
                class: vue.normalizeClass(["mode-btn", { active: $data.searchMode === "ai" }]),
                onClick: _cache[2] || (_cache[2] = ($event) => $data.searchMode = "ai")
              },
              "AI智能解读",
              2
              /* CLASS */
            )
          ])
        ]),
        vue.createElementVNode("button", {
          class: "search-btn",
          onClick: _cache[3] || (_cache[3] = (...args) => $options.searchComponent && $options.searchComponent(...args)),
          disabled: $data.isLoading
        }, vue.toDisplayString($data.isLoading ? "查询中..." : "开始查询"), 9, ["disabled"])
      ]),
      $data.result ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "result"
      }, [
        vue.createElementVNode("view", { class: "section" }, [
          vue.createElementVNode("view", { class: "section-title" }, "一、基础信息"),
          vue.createElementVNode("view", { class: "info-row" }, [
            vue.createElementVNode("text", { class: "label" }, "元器件名称："),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.result.name),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "info-row" }, [
            vue.createElementVNode("text", { class: "label" }, "品牌："),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.result.brand),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "info-row" }, [
            vue.createElementVNode("text", { class: "label" }, "完整型号："),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.result.model),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "info-row" }, [
            vue.createElementVNode("text", { class: "label" }, "产品类别："),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.result.category),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "info-row" }, [
            vue.createElementVNode("text", { class: "label" }, "原厂定位："),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.result.position),
              1
              /* TEXT */
            )
          ])
        ]),
        vue.createElementVNode("view", { class: "section" }, [
          vue.createElementVNode("view", { class: "section-title" }, "二、核心电气参数"),
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.result.params, (p, idx) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: idx,
                class: "param-row"
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "param-name" },
                  vue.toDisplayString(p.name),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "param-value" },
                  vue.toDisplayString(p.value),
                  1
                  /* TEXT */
                )
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "section" }, [
          vue.createElementVNode("view", { class: "section-title" }, "三、物理与结构参数"),
          vue.createElementVNode("view", { class: "info-row" }, [
            vue.createElementVNode("text", { class: "label" }, "封装类型："),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.result.package.type),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "info-row" }, [
            vue.createElementVNode("text", { class: "label" }, "外形尺寸："),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.result.package.size),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "info-row" }, [
            vue.createElementVNode("text", { class: "label" }, "引脚数量："),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.result.package.pins),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "pin-table" }, [
            vue.createElementVNode("view", { class: "pin-header" }, [
              vue.createElementVNode("text", null, "引脚号"),
              vue.createElementVNode("text", null, "引脚名称"),
              vue.createElementVNode("text", null, "功能描述")
            ]),
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($data.result.pins, (pin) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: pin.num,
                  class: "pin-row"
                }, [
                  vue.createElementVNode(
                    "text",
                    { class: "pin-num" },
                    vue.toDisplayString(pin.num),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "pin-name" },
                    vue.toDisplayString(pin.name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "pin-func" },
                    vue.toDisplayString(pin.func),
                    1
                    /* TEXT */
                  )
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ]),
        vue.createElementVNode("view", { class: "section" }, [
          vue.createElementVNode("view", { class: "section-title" }, "四、关键特性与典型应用"),
          vue.createElementVNode("view", { class: "info-row" }, [
            vue.createElementVNode("text", { class: "label" }, "核心功能："),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.result.features.function),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "info-row" }, [
            vue.createElementVNode("text", { class: "label" }, "优势特点："),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.result.features.advantages),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "info-row" }, [
            vue.createElementVNode("text", { class: "label" }, "典型应用："),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.result.features.applications),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "info-row" }, [
            vue.createElementVNode("text", { class: "label" }, "电路搭配："),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.result.features.circuit),
              1
              /* TEXT */
            )
          ])
        ]),
        vue.createElementVNode("view", { class: "section warning" }, [
          vue.createElementVNode("view", { class: "section-title" }, "五、注意事项"),
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.result.notices, (n, idx) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: idx,
                class: "notice-item"
              }, [
                vue.createElementVNode("text", { class: "notice-icon" }, "⚠️"),
                vue.createElementVNode(
                  "text",
                  { class: "notice-text" },
                  vue.toDisplayString(n),
                  1
                  /* TEXT */
                )
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "section" }, [
          vue.createElementVNode("view", { class: "section-title" }, "六、补充建议"),
          vue.createElementVNode("view", { class: "info-row" }, [
            vue.createElementVNode("text", { class: "label" }, "替代型号："),
            vue.createElementVNode("view", { class: "alt-list" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($data.result.alternatives, (alt) => {
                  return vue.openBlock(), vue.createElementBlock(
                    "text",
                    {
                      key: alt,
                      class: "alt-tag"
                    },
                    vue.toDisplayString(alt),
                    1
                    /* TEXT */
                  );
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ]),
          vue.createElementVNode("view", { class: "info-row" }, [
            vue.createElementVNode("text", { class: "label" }, "采购参考："),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.result.purchase),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "info-row" }, [
            vue.createElementVNode("text", { class: "label" }, "资料获取："),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.result.datasheet),
              1
              /* TEXT */
            )
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $data.isLoading ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "loading"
      }, [
        vue.createElementVNode("view", { class: "loading-spinner" }),
        vue.createElementVNode("text", null, "查询中...")
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesToolsTools = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__file", "I:/ydjdwx/repair_app/pages/tools/tools.vue"]]);
  const _sfc_main$1 = {
    data() {
      return {
        userInfo: {},
        favorites: [],
        historyList: [],
        showFavorites: false,
        showHistory: false
      };
    },
    onShow() {
      this.loadUserInfo();
      this.loadFavorites();
      this.loadHistory();
    },
    methods: {
      loadUserInfo() {
        try {
          const info = uni.getStorageSync("userInfo");
          this.userInfo = info || { phone: "138****0000" };
        } catch (e) {
          this.userInfo = { phone: "138****0000" };
        }
      },
      loadFavorites() {
        try {
          const favs = uni.getStorageSync("favorites");
          this.favorites = Array.isArray(favs) ? favs : [];
        } catch (e) {
          this.favorites = [];
        }
      },
      loadHistory() {
        try {
          const history = uni.getStorageSync("viewHistory");
          this.historyList = Array.isArray(history) ? history : [];
        } catch (e) {
          this.historyList = [];
        }
      },
      goToFavorites() {
        this.loadFavorites();
        this.showFavorites = true;
      },
      goToHistory() {
        this.loadHistory();
        this.showHistory = true;
      },
      clearHistory() {
        uni.showModal({
          title: "确认清空",
          content: "确定要清空所有浏览历史吗？",
          success: (res) => {
            if (res.confirm) {
              uni.setStorageSync("viewHistory", []);
              this.historyList = [];
              uni.showToast({ title: "已清空", icon: "success" });
            }
          }
        });
      },
      viewDetail(item) {
        this.showFavorites = false;
        this.showHistory = false;
        uni.showModal({
          title: `${item.brand}${item.type}`,
          content: `故障码：${item.faultCode}

故障现象：${item.description}

解决方案：${item.solution}`,
          confirmText: "知道了",
          showCancel: false
        });
      },
      formatTime(timestamp) {
        if (!timestamp)
          return "";
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
      },
      aboutApp() {
        uni.showModal({
          title: "关于我们",
          content: "家电维修助手 V1.0\n\nAI智能诊断 · 电路图纸 · 维修方案\n\n专业家电维修资料库",
          showCancel: false,
          confirmText: "知道了"
        });
      },
      logout() {
        uni.showModal({
          title: "确认退出",
          content: "确定要退出登录吗？",
          success: (res) => {
            if (res.confirm) {
              uni.setStorageSync("isLogin", false);
              uni.setStorageSync("userInfo", null);
              uni.reLaunch({
                url: "/pages/login/index"
              });
            }
          }
        });
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "profile-container" }, [
      vue.createElementVNode("view", { class: "user-info" }, [
        vue.createElementVNode("view", { class: "avatar" }, [
          vue.createElementVNode("text", { class: "avatar-text" }, "👤")
        ]),
        vue.createElementVNode("view", { class: "user-detail" }, [
          vue.createElementVNode(
            "text",
            { class: "user-name" },
            vue.toDisplayString($data.userInfo.phone || "维修师傅"),
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", { class: "user-desc" }, "家电维修专家")
        ])
      ]),
      vue.createElementVNode("view", { class: "menu-list" }, [
        vue.createElementVNode("view", {
          class: "menu-item",
          onClick: _cache[0] || (_cache[0] = (...args) => $options.goToFavorites && $options.goToFavorites(...args))
        }, [
          vue.createElementVNode("view", { class: "menu-left" }, [
            vue.createElementVNode("text", { class: "menu-icon" }, "❤️"),
            vue.createElementVNode("text", { class: "menu-title" }, "我的收藏")
          ]),
          vue.createElementVNode("text", { class: "menu-arrow" }, "›")
        ]),
        vue.createElementVNode("view", {
          class: "menu-item",
          onClick: _cache[1] || (_cache[1] = (...args) => $options.goToHistory && $options.goToHistory(...args))
        }, [
          vue.createElementVNode("view", { class: "menu-left" }, [
            vue.createElementVNode("text", { class: "menu-icon" }, "📜"),
            vue.createElementVNode("text", { class: "menu-title" }, "浏览历史")
          ]),
          vue.createElementVNode("text", { class: "menu-arrow" }, "›")
        ]),
        vue.createElementVNode("view", {
          class: "menu-item",
          onClick: _cache[2] || (_cache[2] = (...args) => $options.clearHistory && $options.clearHistory(...args))
        }, [
          vue.createElementVNode("view", { class: "menu-left" }, [
            vue.createElementVNode("text", { class: "menu-icon" }, "🗑️"),
            vue.createElementVNode("text", { class: "menu-title" }, "清空历史记录")
          ]),
          vue.createElementVNode("text", { class: "menu-arrow" }, "›")
        ]),
        vue.createElementVNode("view", {
          class: "menu-item",
          onClick: _cache[3] || (_cache[3] = (...args) => $options.aboutApp && $options.aboutApp(...args))
        }, [
          vue.createElementVNode("view", { class: "menu-left" }, [
            vue.createElementVNode("text", { class: "menu-icon" }, "ℹ️"),
            vue.createElementVNode("text", { class: "menu-title" }, "关于我们")
          ]),
          vue.createElementVNode("text", { class: "menu-arrow" }, "›")
        ]),
        vue.createElementVNode("view", {
          class: "menu-item",
          onClick: _cache[4] || (_cache[4] = (...args) => $options.logout && $options.logout(...args))
        }, [
          vue.createElementVNode("view", { class: "menu-left" }, [
            vue.createElementVNode("text", { class: "menu-icon" }, "🚪"),
            vue.createElementVNode("text", { class: "menu-title" }, "退出登录")
          ]),
          vue.createElementVNode("text", { class: "menu-arrow" }, "›")
        ])
      ]),
      $data.showFavorites ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "modal-mask",
        onClick: _cache[7] || (_cache[7] = ($event) => $data.showFavorites = false)
      }, [
        vue.createElementVNode("view", {
          class: "modal-content",
          onClick: _cache[6] || (_cache[6] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("text", { class: "modal-title" }, "❤️ 我的收藏"),
          vue.createElementVNode("scroll-view", {
            class: "modal-list",
            "scroll-y": ""
          }, [
            $data.favorites.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "empty-list"
            }, [
              vue.createElementVNode("text", null, "暂无收藏")
            ])) : vue.createCommentVNode("v-if", true),
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($data.favorites, (item) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: item.id,
                  class: "modal-list-item",
                  onClick: ($event) => $options.viewDetail(item)
                }, [
                  vue.createElementVNode(
                    "text",
                    { class: "item-title" },
                    vue.toDisplayString(item.brand) + " " + vue.toDisplayString(item.type),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "item-desc" },
                    vue.toDisplayString(item.description),
                    1
                    /* TEXT */
                  )
                ], 8, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createElementVNode("button", {
            class: "modal-close",
            onClick: _cache[5] || (_cache[5] = ($event) => $data.showFavorites = false)
          }, "关闭")
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $data.showHistory ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "modal-mask",
        onClick: _cache[10] || (_cache[10] = ($event) => $data.showHistory = false)
      }, [
        vue.createElementVNode("view", {
          class: "modal-content",
          onClick: _cache[9] || (_cache[9] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("text", { class: "modal-title" }, "📜 浏览历史"),
          vue.createElementVNode("scroll-view", {
            class: "modal-list",
            "scroll-y": ""
          }, [
            $data.historyList.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "empty-list"
            }, [
              vue.createElementVNode("text", null, "暂无浏览记录")
            ])) : vue.createCommentVNode("v-if", true),
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($data.historyList, (item) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: item.id,
                  class: "modal-list-item",
                  onClick: ($event) => $options.viewDetail(item)
                }, [
                  vue.createElementVNode(
                    "text",
                    { class: "item-title" },
                    vue.toDisplayString(item.brand) + " " + vue.toDisplayString(item.type),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "item-time" },
                    vue.toDisplayString($options.formatTime(item.viewTime)),
                    1
                    /* TEXT */
                  )
                ], 8, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createElementVNode("button", {
            class: "modal-close",
            onClick: _cache[8] || (_cache[8] = ($event) => $data.showHistory = false)
          }, "关闭")
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesProfileProfile = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-dd383ca2"], ["__file", "I:/ydjdwx/repair_app/pages/profile/profile.vue"]]);
  __definePage("pages/diagnosis/diagnosis", PagesDiagnosisDiagnosis);
  __definePage("pages/schematic/schematic", PagesSchematicSchematic);
  __definePage("pages/tools/tools", PagesToolsTools);
  __definePage("pages/profile/profile", PagesProfileProfile);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:4", "App Launch");
      try {
        uni.removeStorageSync("isLogin");
        uni.removeStorageSync("userInfo");
      } catch (e) {
        formatAppLog("log", "at App.vue:10", e);
      }
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:14", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:17", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "I:/ydjdwx/repair_app/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
