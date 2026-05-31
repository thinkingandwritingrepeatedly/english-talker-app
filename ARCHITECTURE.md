# English Talker — 技术架构文档

## 1. 项目概述

English Talker 是一个基于 React Native (Expo) 的 AI 语音对话 App，支持语音识别输入、流式 AI 对话和语音朗读回复。采用 OpenAI 兼容的 API 协议，默认对接 DeepSeek 大模型。

## 2. 技术栈

| 层 | 技术选型 | 版本 |
|---|---|---|
| 框架 | React Native (Expo) | SDK 56 |
| 语言 | JavaScript (ES2020+) | — |
| 状态管理 | React Context + useReducer | 内置 |
| 持久化 | @react-native-async-storage/async-storage | 2.2.0 |
| 语音识别 | expo-speech-recognition | ^56.0.0 |
| 语音合成 | expo-speech | ~56.0.3 |
| 动画 | React Native Animated API | 内置 |
| 矢量图 | react-native-svg | 15.15.4 |
| AI API | OpenAI 兼容协议 (fetch + SSE 流式) | — |

## 3. 项目结构

```
english-talker-app/
├── App.js                          # 应用入口：挂载 ConversationProvider + HomeScreen
├── app.json                        # Expo 配置（权限、插件、图标）
├── index.js                        # 注册入口
├── package.json
├── assets/                         # 图标、字体等静态资源
│
├── src/
│   ├── constants/
│   │   ├── config.js               # 默认参数、存储 Key、系统提示词
│   │   └── theme.js                # 颜色主题、状态机定义、动画参数
│   │
│   ├── storage/
│   │   └── SettingsStorage.js      # AsyncStorage 封装（读写 API 配置、偏好）
│   │
│   ├── services/
│   │   ├── AIService.js            # AI 流式对话服务（SSE 流式解析）
│   │   └── VoiceService.js         # 语音服务（STT 识别 + TTS 合成）
│   │
│   ├── context/
│   │   └── ConversationContext.js   # 全局会话状态管理（核心状态机）
│   │
│   ├── screens/
│   │   └── HomeScreen.js           # 主界面布局（Voice → Input → Chat）
│   │
│   └── components/
│       ├── Avatar.js               # 动画头像（SVG + Animated API）
│       ├── ControlButton.js        # 开始对话 / 停止按钮
│       ├── PreviewBar.js           # 语音识别预览栏
│       ├── ChatBubble.js           # 聊天气泡（用户 / Luna）
│       ├── VoiceToggle.js          # 语音朗读开关
│       └── SettingsModal.js        # 设置弹窗
│
└── android/                        # Expo prebuild 生成的 Android 原生项目
```

## 4. 核心架构：状态机驱动

### 4.1 会话状态机

App 的整个业务流程由一个有限状态机控制，定义在 `ConversationContext.js` 中。

```
                  ┌──────────┐
                  │   idle   │ ◄─────────────────────────┐
                  └────┬─────┘                           │
                       │ 点击"开始对话"                    │
                       ▼                                 │
               ┌──────────────┐                         │
               │  preparing   │                         │
               └──────┬───────┘                         │
                      │ 检测语音服务 + 请求权限            │
                      ▼                                 │
              ┌──────────────┐                          │
         ┌───►│  listening   │ ◄──── 静音超时 ────┐    │
         │    └──────┬───────┘     回复朗读完成      │    │
         │           │ 静音超时（2s）                 │    │
         │           ▼                              │    │
         │   ┌──────────────┐                      │    │
         │   │  processing  │                      │    │
         │   └──────┬───────┘                      │    │
         │          │ AI 流式回复完成                │    │
         │          ▼                              │    │
         │   ┌──────────────┐                      │    │
         │   │  speaking    ├────────────┬─────────┘    │
         │   └──────────────┘            │              │
         │          │                    │              │
         │          ▼                    ▼              │
         │   ┌──────────────┐    ┌──────────────┐      │
         │   │  no-service  │    │    idle      │      │
         │   └──────────────┘    └──────────────┘      │
         │                                              │
         └──────────────────────────────────────────────┘
                      按停止键                 按重置键
```

**状态说明：**

| 状态 | 含义 | 用户可操作 |
|---|---|---|
| `idle` | 待机状态，显示"开始对话"按钮 | 点击开始、输入文字 |
| `preparing` | 正在初始化语音引擎、请求权限 | — |
| `listening` | 麦克风已开启，正在聆听 | 说话、输入文字 |
| `processing` | AI 正在生成回复（流式接收中） | — |
| `speaking` | TTS 正在朗读 AI 回复 | — |
| `no-service` | 设备不支持语音识别，仅文字模式 | 输入文字 |

**关键机制：**

- **静音超时自动触发**：在 `listening` 状态，2 秒无语音输入自动将积累文本发送给 AI
- **连续聆听**：每次识别结束后自动重启麦克风（通过 `onEnd` 回调）
- **互斥锁 (`turnLockRef`)**：防止同一时刻多次触发 AI 请求
- **`stateRef` 引用**：用 `useRef` 保持回调中访问最新状态，避免闭包过期

### 4.2 数据流

```
用户语音 ──► STT (expo-speech-recognition)
                │
                ├── interimText → PreviewBar 实时显示
                └── finalText  → accumText 累积
                                  │
                   静音超时(2s) ──┤
                                  ▼
                   用户消息 → useReducer → messages[]
                                  │
                                  ▼
                    AIService.streamChat()
                                  │
                    流式 delta → UPDATE_LAST_MESSAGE
                                  │
                    TTS? ──是──► speak() → 朗读
                    │
                    否
                    ▼
                  listening (等待下一轮)

 用户文字输入 ──► sendMessage()
                    │
                    ▼
                   dispatch APPEND_MESSAGE
                    │
                    ▼
                   AIService.streamChat()
                    │
                    ▼
                   流式更新 → dispatch UPDATE_LAST_MESSAGE
```

## 5. 模块详解

### 5.1 语音服务 (`src/services/VoiceService.js`)

封装了语音识别 (STT) 和语音合成 (TTS) 两个子系统：

**STT 模块：**
- 使用 `expo-speech-recognition` 原生模块
- 支持三种识别模式：默认、设备端、指定服务
- `initSTT(handlers)` — 注册 `start/end/result/error` 四个事件监听
- `startListening(locale)` — 启动识别（支持设置语言）
- 自动处理 `no-speech` 和 `aborted` 错误（忽略不报错）

**TTS 模块：**
- 使用 `expo-speech` 原生模块
- `speak(text, { onDone, onError })` — 语音朗读，支持完成回调
- `stopSpeaking()` — 立即停止朗读
- 语速 (`SPEECH_RATE: 0.90`) 和音调 (`SPEECH_PITCH: 1.05`) 在 `config.js` 配置

### 5.2 AI 服务 (`src/services/AIService.js`)

`createAIService({ baseURL, apiKey, model })` 工厂函数：

- **流式请求**：使用 `fetch` + `ReadableStream` 的 `getReader()` 逐行读取 SSE
- **SSE 解析**：按 `\n` 分割缓冲区，解析 `data: {...}` 行，提取 `delta.content`
- **中止机制**：`AbortController` 支持取消正在进行的请求
- **自动截断**：`messages.slice(-20)` 只保留最近 10 轮对话（由 `MAX_HISTORY` 控制）
- **系统提示词**：Luna 角色设定，要求 200 字以内回复、自动匹配用户语言

### 5.3 动画头像 (`src/components/Avatar.js`)

纯 SVG 头像 + React Native `Animated` API：

- **尺寸**：基准 140×140，外层通过 transform scale 缩放
- **面部**：Circle + Ellipse + Path 绘制的 SVG 人脸
- **三种动画模式**：
  - 呼吸脉冲：`Animated.loop` 配合 `Easing.inOut` 缩放 glow 边框
  - 旋转光环：`processing` 状态时显示旋转圆环（`borderLeftColor: 'transparent'`）
  - 嘴巴动画：`speaking` 状态时嘴巴弧度增大

**状态对应动画：**

| 状态 | 辉光颜色 | 脉冲周期 | 眼睛 | 特殊效果 |
|---|---|---|---|---|
| idle | primary | 4s | 睁眼 | — |
| preparing | primary | 2s | 睁眼 | — |
| listening | accent (绿) | 1.2s | 睁眼 | — |
| processing | warning (金) | — | 闭眼 | 旋转光环 |
| speaking | primary | 0.8s | 睁眼 | 嘴巴张大 |

### 5.4 状态管理 (`src/context/ConversationContext.js`)

采用 `useReducer` 模式：

```javascript
const initialState = {
  mode: 'idle',           // 当前状态
  messages: [],           // 消息历史 [{role, content}]
  interimText: '',        // 语音识别中间结果
  accumText: '',          // 语音识别最终累积文本
  isVoiceEnabled: true,   // TTS 开关
  apiKey: '',             // API 密钥
  baseURL: '...',         // API 地址
  model: 'deepseek-chat', // 模型名称
  lang: 'en-US',          // 识别语言
  showSettings: false,    // 设置弹窗
  settingsReady: false,   // 初始化完成
};
```

**Action 类型：** `SET_MODE`, `SET_INTERIM`, `SET_ACCUM`, `APPEND_MESSAGE`, `UPDATE_LAST_MESSAGE`, `SET_VOICE_ENABLED`, `SET_SETTINGS`, `SET_SHOW_SETTINGS`, `SET_SETTINGS_READY`, `RESET`

**对外暴露的接口：** `startConversation()`, `stopConversation()`, `toggleVoice()`, `updateSettings()`, `resetConversation()`, `sendMessage()`, `dispatch()`

### 5.5 持久化存储 (`src/storage/SettingsStorage.js`)

基于 `@react-native-async-storage/async-storage`：

| Key | 存储值 | 默认行为 |
|---|---|---|
| `et_key_ds` | API Key | 为空则跳过 |
| `et_base` | Base URL | 等于默认值时删除（不存储） |
| `et_model` | 模型名 | 同上 |
| `et_lang` | 识别语言 | 同上 |
| `et_voice_enabled` | 语音开关 | 读取为布尔值，默认 `true` |

## 6. 配置项

见 `src/constants/config.js`：

| 参数 | 默认值 | 说明 |
|---|---|---|
| `BASE_URL` | `https://api.deepseek.com/v1` | OpenAI 兼容 API 地址 |
| `MODEL` | `deepseek-chat` | 模型名称 |
| `MAX_TOKENS` | 1024 | 每次回复最大 Token 数 |
| `MAX_HISTORY` | 10 | 保留最近 N 轮对话 |
| `SILENCE_TIMEOUT` | 2000ms | 静音超时时间 |
| `SPEECH_RATE` | 0.90 | TTS 语速 |
| `SPEECH_PITCH` | 1.05 | TTS 音调 |

## 7. 主题系统

见 `src/constants/theme.js`：

- **暗色主题**：背景 `#0B1121`，卡片 `#1A233A`，主色 `#6C5CE7`（紫）
- **强调色**：`#00E676`（绿，用于聆听状态）
- **文字**：白色主文字 `#FFFFFF`，灰色副文字 `#8892B0`
- **边框**：`#2A3A5C`

## 8. Android 权限

在 `app.json` 中声明：

| 权限 | 用途 |
|---|---|
| `RECORD_AUDIO` | 麦克风录音（语音识别） |
| `INTERNET` | 网络请求（AI API） |

运行时还会动态请求麦克风权限。

## 9. 构建与部署

```bash
# 安装依赖
npm install

# 预构建 Android 原生项目
npx expo prebuild --platform android

# 构建 Release APK
cd android
./gradlew assembleRelease

# 产物路径
# android/app/build/outputs/apk/release/app-release.apk
```

## 10. 扩展指南

### 切换 AI 提供商

English Talker 使用 OpenAI 兼容的 API 协议。在设置中修改 Base URL 和 Model 即可切换：

| 提供商 | Base URL | Model |
|---|---|---|
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-turbo` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |

### 修改头像动画

编辑 `src/constants/theme.js` 中的 `AVATAR_STATES` 对象，调整每个状态的 `pulse` 周期（毫秒）和 `glow` 颜色。
