# 正商诸葛AI - PakePlus 打包指南

## 项目结构

```
pakeplus-app/
├── index.html          # 主应用文件 (539KB)
├── zhuge-icon.png      # 应用图标
├── bgm/                # 背景音乐文件 (14首MP3)
├── static/logo/        # logo资源
├── pake-config.json    # Pake CLI 配置文件
├── start-server.bat    # 本地服务器启动脚本
└── README.md           # 本指南
```

## 方案一：PakePlus GUI 打包（推荐）

### 步骤 1：下载安装 PakePlus

- 官网：https://ppofficial.netlify.app
- GitHub：https://github.com/gaord/pakeplus
- 支持 Windows / macOS / Linux

### 步骤 2：启动本地服务器

双击 `start-server.bat`，看到以下输出后保持窗口打开：

```
正商诸葛AI - 本地服务器
打包地址: http://localhost:8888
```

### 步骤 3：在 PakePlus 中创建项目

1. 打开 PakePlus，点击 **"+"** 创建新项目
2. 项目名称：`ZhugeAI`（英文，不能以数字开头）

### 步骤 4：配置应用信息

| 配置项 | 值 |
|--------|------|
| APP名称 | 正商诸葛AI |
| 网站地址 | `http://localhost:8888` |
| APP标识 | `com.zhengshang.zhuge.ai` |
| APP版本 | `1.2.0` |
| 应用图标 | 选择 `zhuge-icon.png` |

### 步骤 5：选择窗口模式

- **桌面模式**：标准窗口，可调整大小（推荐桌面使用）
- **Android模式**：固定手机尺寸（推荐移动端打包）
- **iPhone模式**：固定iPhone尺寸
- **自定义**：宽420 × 高900（推荐）

### 步骤 6：发布打包

1. 点击 **"预览"** 确认效果
2. 点击 **"发布"** 开始云打包
3. 等待打包完成（通常5-10分钟）
4. 下载对应平台的安装包

---

## 方案二：Pake CLI 命令行打包

### 环境要求

- Node.js >= 22（已安装）
- Rust >= 1.85（需要安装）
- pnpm（已安装）

### 安装 Rust

```powershell
# 访问 https://rustup.rs 下载安装
# 或使用 winget：
winget install Rustlang.Rustup
```

### 安装 Pake CLI

```powershell
pnpm install -g pake-cli
```

### 使用配置文件打包

```powershell
cd pakeplus-app
pake --config pake-config.json
```

### 或使用命令行参数打包

```powershell
pake http://localhost:8888 --name ZhugeAI --icon zhuge-icon.png --width 420 --height 900 --use-local-file
```

---

## 方案三：GitHub Actions 在线打包（无需本地环境）

1. Fork 项目 https://github.com/tw93/Pake
2. 在仓库中创建 `.github/workflows/build.yml`
3. 使用 `pake-config.json` 配置
4. 参考：https://github.com/tw93/Pake/blob/main/docs/github-actions-usage.md

---

## 功能兼容性说明

### 在 PakePlus (Tauri WebView) 中可用的功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 视频渲染 | 可用 | Canvas + MediaRecorder |
| 背景音乐播放 | 可用 | HTML5 Audio |
| 自定义音乐添加 | 可用 | IndexedDB + Blob URL |
| 模板改写 | 可用 | API 调用 |
| 字幕样式 | 可用 | Canvas 渲染 |
| 配音预览 | 部分可用 | 使用 speechSynthesis（浏览器TTS） |
| 视频导出 | 可用 | 生成 WebM 视频 |
| 水印解析 | 可用 | 模拟功能 |
| 对标分析 | 可用 | 模拟功能 |

### HBuilderX 专属功能（不可用，有 Web 降级）

| 功能 | HBuilderX | PakePlus 降级方案 |
|------|-----------|-------------------|
| Android原生TTS | plus.android | speechSynthesis 浏览器TTS |
| 保存到相册 | plus.io + plus.gallery | 下载到本地文件 |
| 自定义调试基座 | plus.android API | 不适用 |

### 注意事项

1. **视频保存**：PakePlus 中通过浏览器下载方式保存视频，不是保存到相册
2. **TTS配音**：使用浏览器内置的 speechSynthesis，音质可能不如 Android 原生 TTS
3. **本地文件**：`useLocalFile: true` 确保所有资源文件被打包进应用
4. **跨域请求**：Tauri WebView 默认允许跨域，API 调用不受限制

---

## 打包后测试

1. 安装生成的应用
2. 测试核心流程：选模板 → 改写 → 选配音 → 选BGM → 生成视频
3. 测试自定义BGM：添加 → 试听 → 选中 → 生成
4. 测试视频导出：渲染 → 下载

## 版本信息

- 应用版本：v1.2.0
- 打包工具：PakePlus / Pake CLI
- 目标平台：Windows / macOS / Linux / Android / iOS
