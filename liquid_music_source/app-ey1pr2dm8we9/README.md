# 液态音乐播放器（Liquid Music Player）

一款采用 **iOS 26 液态玻璃（Liquid Glass）视觉主题**的移动端音乐播放器，基于 Expo / React Native 构建。支持精选歌单在线试听、**多本地音乐文件夹递归扫描导入**、**同名 `.lrc` 歌词同步滚动高亮**，以及底部悬浮播放栏与全屏沉浸式播放页（旋转黑胶唱片效果）。

> 源码由秒哒（Miaoda）平台导出，包内附完整 git 仓库。

---

## 功能特性

- 🎵 **精选歌单**：内置多首歌曲（封面、歌名、歌手、时长），点击即播（示例音频来自 SoundHelix 公开样本）
- 📁 **多本地音乐文件夹**：系统文件夹选择器同时添加多个文件夹，递归扫描子目录中的 `mp3 / wav / flac / m4a / aac / ogg` 音频加入播放列表；支持查看 / 移除已选文件夹
- 🎤 **歌词同步显示**：播放时自动在歌曲同目录查找同名 `.lrc` 文件并解析，随播放进度毫秒级同步滚动、高亮当前句；无歌词文件时降级为内置歌词
- 🎛️ **完整播放控制**：播放 / 暂停、上一首 / 下一首、进度条拖动跳转、当前时间 / 总时长
- 💎 **液态玻璃视觉**：深色渐变动态背景、半透明玻璃卡片与内高光描边、液态玻璃圆形控制键、全屏旋转唱片页

## 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | Expo SDK 55 · React Native 0.83.2 · React 19.2 |
| 路由 | expo-router 55（`src/app` 文件路由） |
| 样式 | NativeWind 4（Tailwind CSS for RN）+ 液态玻璃自定义组件 |
| 音频 | expo-audio |
| 文件访问 | expo-document-picker + expo-file-system |
| 语言 | TypeScript ~5.9 |

## 环境要求

| 工具 | 建议版本 | 用途 |
|---|---|---|
| Node.js | ≥ 20（推荐 22 LTS） | 运行 Expo 工具链 |
| pnpm | 9–11 | 包管理（工程为 pnpm workspace，勿改用 npm/yarn） |
| JDK | 17 | 仅本地编译 APK 时需要 |
| Android Studio | 最新 | Android SDK 与模拟器（真机 + Expo Go 可跳过） |
| 手机端 App | Expo Go | 真机调试 |

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2a. 启动开发服务器，手机安装 Expo Go 后扫码预览（推荐）
pnpm start

# 2b. 或直接拉起安卓模拟器
pnpm android

# 2c. 或 Web 端快速预览（文件夹扫描等原生能力会受限）
pnpm web
```

首次启动时 Expo 会询问端口与开发模式，回车即可；端口冲突时使用 `pnpm start --port 8081`。

## 本地编译 APK

Expo 工程需先生成原生安卓工程：

```bash
# 生成 android/ 原生目录（首次执行）
npx expo prebuild --platform android

# 编译 Debug 包（可直接安装调试）
cd android && ./gradlew assembleDebug
# 产物：android/app/build/outputs/apk/debug/app-debug.apk

# 编译 Release 包（需先配置 keystore 签名）
cd android && ./gradlew assembleRelease
```

> 云打包推荐 [EAS Build](https://docs.expo.dev/build/introduction/)：`npx eas-cli build -p android`，免本地 JDK / Android SDK 配置（需 Expo 账号）。
> 注意：未签名的 Release 包无法直接安装，调试请使用 Debug 包或配置签名。

## 项目结构

```
├── app.json                  # Expo 配置（包名、权限、插件）
├── package.json              # 依赖与脚本
├── pnpm-workspace.yaml       # pnpm workspace / catalog 版本管理
├── tsconfig.json             # TypeScript 配置（@/* → ./src/*）
├── tailwind.config.js        # Tailwind / NativeWind 主题
└── src/
    ├── app/                  # expo-router 页面
    │   ├── _layout.tsx       #   根布局（主题、播放状态提供）
    │   ├── index.tsx         #   主页：精选歌单
    │   ├── folders.tsx       #   本地文件夹：多文件夹管理与扫描
    │   └── player.tsx        #   全屏播放页（旋转唱片 + 歌词）
    ├── components/           # UI 组件
    │   ├── FloatingPlayerBar.tsx     # 底部悬浮播放栏
    │   ├── LiquidGlassBackground.tsx # 液态玻璃动态背景
    │   ├── LiquidGlassCard.tsx       # 液态玻璃卡片
    │   ├── SongListItem.tsx          # 歌单项
    │   └── ui/               # shadcn 风格基础组件（@rn-primitives）
    ├── context/
    │   └── PlayerContext.tsx # 全局播放器状态（播放/进度/歌词联动）
    ├── data/
    │   └── featuredSongs.ts  # 内置精选歌单数据
    ├── lib/                  # 主题与工具（theme.ts / utils.ts）
    ├── types/
    │   └── music.ts          # 歌曲 / 播放列表类型
    └── utils/
        ├── fileScanner.ts    # 文件夹递归扫描、音频过滤、去重
        └── lrcParser.ts      # LRC 歌词解析与时间戳定位
```

## 配置说明

- **环境变量**：`.env` 中仅 `EXPO_PUBLIC_APP_ID=app-ey1pr2dm8we9`，本地调试可直接沿用；修改后需重启 `expo start` 生效
- **包名 / 应用 ID**：`com.miaoda.liquidmusic`（见 `app.json`，iOS / Android 双侧配置）
- **Android 权限**（已预置）：`READ_MEDIA_AUDIO`（Android 13+ 读音频）、`READ_EXTERNAL_STORAGE`（旧版本兼容）、`MODIFY_AUDIO_SETTINGS`
- **iOS 后台音频**：`infoPlist.UIBackgroundModes: ["audio"]` 已开启

## 常见问题

| 现象 | 处理 |
|---|---|
| `pnpm start` 端口被占用 | 换端口：`pnpm start --port 8081` |
| 模拟器连不上 Metro | 确保手机 / 模拟器与电脑同一局域网，或使用 USB 反向转发 |
| `gradlew` 首次构建很慢 | 需下载 Gradle 与依赖，属正常现象 |
| 文件夹扫描在 Web 端不可用 | `expo-document-picker` 目录选择仅安卓 / iOS 生效，请在真机或模拟器验证 |
| 本地改动不同步到秒哒 | 本地与秒哒平台工程相互独立，平台版本以秒哒控制台为准 |

## 相关链接

- 秒哒平台在线版本：https://app-ey1pr2dm8we9.miaoda.online
- Expo 文档：https://docs.expo.dev
- EAS Build：https://docs.expo.dev/build/introduction/