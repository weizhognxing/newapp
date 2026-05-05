# GitHub 打包环境兼容修改说明

本次只针对 GitHub Actions 打包环境兼容性做修改，没有再尝试本地打包，也没有改动业务逻辑。你之前看到的提示是 GitHub Actions JavaScript Action 运行时从 Node.js 20 迁移到 Node.js 24 的弃用警告，因此我对项目工作流做了显式兼容配置。

## 已修改内容

| 文件 | 修改内容 |
|---|---|
| `.github/workflows/android-build.yml` | 增加 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'`，让 GitHub Actions 提前使用 Node 24 运行 JavaScript Actions；将项目构建 Node 版本从 `20` 调整为 `22`；保留 Java 17；增加 Gradle 缓存；增加环境版本输出；构建命令改为 `./gradlew assembleRelease --no-daemon`；构建前自动修复 `gradlew` 的 Windows 换行。 |
| `.github/workflows/android-build-fallback.yml` | 同步上述兼容配置，确保备用工作流也不会继续引用 `node-version: 20`。 |
| `.nvmrc` | 新增 `22`，方便本地或 CI 统一 Node 版本。 |
| `package.json` | 新增 `engines`：`node >=20 <25`、`npm >=10`，避免使用过旧 Node 环境。 |

## 校验结果

| 校验项 | 结果 |
|---|---|
| 工作流中 `node-version: 20` 引用 | 已清除。 |
| 工作流中 Node 24 Actions 运行时开关 | 已加入。 |
| YAML 解析 | 已通过。 |
| `package.json` 解析 | 已通过。 |
| `npm run typecheck` | 已通过。 |

## 使用说明

你把这份源码上传到 GitHub 后，可以直接运行 `Android Build` 工作流。该工作流仍然使用 Expo/React Native 项目更稳妥的 Node 22 来执行 `npm ci` 与 Gradle 构建，同时通过 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` 让 GitHub 官方 Actions 提前适配 Node 24 运行时，规避你之前看到的 Node 20 弃用警告。
