# AI数字人视频工坊 - Android APK

一个AI数字人视频生成工具，用户可通过简单步骤创建自己的数字分身并生成说话视频。

## 功能特性

1. **人物形象生成**：上传照片或选择3个内置系统形象（商务男士、优雅女士、时尚青年）
2. **语音合成与口型驱动**：文本输入生成语音或上传音频，嘴型根据音频振幅同步
3. **动作表情生成**：自动眨眼、微表情根据情绪关键词调整、呼吸式身体晃动
4. **背景与视频合成**：纯色背景（灰/蓝/绿）和虚拟场景（办公室/自然风景），模拟视频合成

## 项目结构

```
AIAvatarStudio/
├── app/
│   ├── build.gradle              # 模块级构建配置
│   ├── proguard-rules.pro        # ProGuard规则
│   └── src/main/
│       ├── AndroidManifest.xml   # 应用清单
│       ├── java/com/ai/avatarstudio/
│       │   └── MainActivity.kt   # 主Activity
│       └── res/
│           ├── drawable/         # 图标和图形资源
│           ├── layout/           # XML布局
│           ├── mipmap-*/         # 应用图标
│           └── values/           # 颜色、字符串、主题、样式
├── build.gradle                  # 项目级构建配置
├── settings.gradle               # Gradle设置
├── gradle.properties             # Gradle属性
├── gradle/wrapper/               # Gradle Wrapper
├── pakeplus.config.json          # PakePlus配置文件
└── README.md                     # 本文件
```

## 使用PakePlus打包APK

### 前提条件
- 已安装 PakePlus CLI 工具
- 已配置 Android SDK 环境（或使用PakePlus云端构建）

### 方法一：使用PakePlus CLI本地构建

```bash
# 1. 进入项目目录
cd AIAvatarStudio

# 2. 使用PakePlus初始化构建
pakeplus build --config pakeplus.config.json

# 3. 指定构建类型
pakeplus build --type release
# 或 debug版本
pakeplus build --type debug

# 4. 指定输出目录
pakeplus build --output ./output
```

### 方法二：使用PakePlus云端打包

```bash
# 上传项目并云端构建
pakeplus cloud-build --project . --config pakeplus.config.json

# 等待构建完成后下载APK
pakeplus download --task-id <任务ID>
```

### 方法三：使用Android Studio + Gradle（标准Android构建）

```bash
# 1. 赋予gradlew执行权限
chmod +x gradlew

# 2. 构建Debug APK
./gradlew assembleDebug

# 3. 构建Release APK
./gradlew assembleRelease

# APK输出路径：app/build/outputs/apk/
```

## 构建命令快速参考

| 命令 | 说明 |
|------|------|
| `pakeplus build` | 使用默认配置构建 |
| `pakeplus build --type release` | 构建Release版本 |
| `pakeplus doctor` | 检查构建环境 |
| `pakeplus clean` | 清理构建缓存 |
| `./gradlew assembleDebug` | Gradle直接构建Debug |
| `./gradlew installDebug` | 构建并安装到连接的设备 |

## 技术规格

- **包名**：com.ai.avatarstudio
- **最低SDK**：Android 7.0 (API 24)
- **目标SDK**：Android 13 (API 33)
- **编程语言**：Kotlin
- **UI框架**：Android XML布局 + Material Components
- **主题**：深色科技风（深蓝+亮青色）

## 权限说明

- `INTERNET`：网络访问（预留AI接口调用）
- `CAMERA`：相机权限（预留拍照功能）
- `READ_EXTERNAL_STORAGE` / `READ_MEDIA_*`：读取照片/音频/视频
- `WRITE_EXTERNAL_STORAGE`：保存视频到相册
- `RECORD_AUDIO`：录音权限（预留）

## 注意事项

1. 本项目当前为UI模拟版本，AI生成功能为模拟动画
2. 嘴型同步通过View缩放动画模拟，未接入真实音频分析
3. 视频合成通过进度条动画模拟，未生成真实视频文件
4. 如需接入真实AI服务，请在MainActivity.kt中对应方法处替换为真实API调用
