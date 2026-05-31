# English Talker 🗣️

AI 语音对话助手 — 通过语音或文字与 AI 伙伴 "Luna" 自然交流。

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2056-000020)](https://docs.expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.85-61DAFB)](https://reactnative.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 功能

- 🎤 **语音对话** — 语音识别输入，AI 智能回复
- 🔊 **语音朗读** — AI 回复自动朗读（TTS）
- 💬 **文字对话** — 支持打字输入
- ⚡ **流式回复** — AI 回复实时逐字显示
- 🌙 **暗色主题** — 夜间友好
- 🎨 **动画头像** — 不同状态对应不同动画
- 🔧 **多模型** — 支持 DeepSeek / OpenAI / 通义千问等

## 截图

| 待机状态 | 聆听状态 | 对话中 |
|---|---|---|
| (待补充) | (待补充) | (待补充) |

## 快速开始

### 安装

下载 [Releases](https://github.com/thinkingandwritingrepeatedly/english-talker-app/releases) 中的 APK 安装到 Android 设备。

> 需要 Android 7.0+ 和麦克风权限。

### 首次使用

1. 打开 App，点击 ⚙ 进入设置
2. 输入你的 API Key（[DeepSeek](https://platform.deepseek.com) 或 OpenAI 等）
3. 点击 **「▶ 开始对话」** 开始语音交流
4. 或在输入框中打字发送文字消息

## 自行构建

```bash
# 克隆
git clone https://github.com/thinkingandwritingrepeatedly/english-talker-app.git
cd english-talker-app

# 安装依赖
npm install

# 预构建安卓原生项目
npx expo prebuild --platform android

# 构建 Release APK
cd android
./gradlew assembleRelease

# 产物在 android/app/build/outputs/apk/release/app-release.apk
```

## 技术架构

详见 [ARCHITECTURE.md](ARCHITECTURE.md) — 包含状态机设计、数据流、模块详解、扩展指南。

## 使用说明

详见 [USAGE.md](USAGE.md) — 包含功能操作、状态说明、常见问题。

## 配置

可以在 App 设置中修改：

| 参数 | 默认值 | 说明 |
|---|---|---|
| API Key | — | 必填。AI 服务认证 |
| Base URL | `https://api.deepseek.com/v1` | API 服务地址 |
| Model | `deepseek-chat` | 模型名称 |
| 语言 | en-US | 语音识别语言 |

## 开源协议

[MIT](LICENSE)
