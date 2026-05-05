# 智能营销平台 - Android APP

基于 Expo + React Native 开发的 Android 移动端应用，完整对接 PC 端前端的所有功能模块和后端 API 接口。

## 项目概述

本项目是 PC 端智能营销平台的 Android 移动端版本，采用 Expo SDK 52 + React Native 0.76 + TypeScript 技术栈开发，完整复刻了 PC 端的所有功能页面，并针对移动端进行了 UI 适配。

## 功能模块

### 内容管理
| 页面 | 说明 | 对应PC端 |
|------|------|----------|
| 选题中心 | 热点话题浏览、AI发散生成选题 | TopicCenter |
| AI发散结果 | 查看AI发散生成的选题结果 | DivergenceResult |
| 生成列表 | 查看AI生成的内容列表 | GenerationList |
| 审核列表 | 审核待发布内容，支持通过/拒绝 | AuditList |
| 发布列表 | 查看已发布和待发布内容 | PublishList |

### 系统配置
| 页面 | 说明 | 对应PC端 |
|------|------|----------|
| 公司信息 | 查看和编辑公司基本信息 | CompanyInfo |
| 人员管理 | 管理公司成员、角色分配 | StaffManage |
| 账号管理 | 管理各平台发布账号 | AccountManage |
| 素材管理 | 管理图片、视频等素材资源 | MaterialManage |
| 设备管理 | 管理绑定的发布设备 | DeviceManage |

### 平台管理（管理员专属）
| 页面 | 说明 | 对应PC端 |
|------|------|----------|
| 控制台 | 平台数据概览仪表盘 | ConsoleDashboard |
| 公司管理 | 管理平台下所有公司 | CompanyManage |
| 平台配置 | 平台级别参数配置 | PlatformConfig |
| 设备维护 | 平台设备统一维护 | DeviceMaintenance |

## 后端API对接

所有 API 接口均已按照 PC 端前端的配置完整对接，接口前缀为 `/api/v1`。

### API配置文件
- **配置位置**: `src/constants/config.ts`
- **请求封装**: `src/api/request.ts`
- **认证头**: 自动注入 `X-Tenant-Id` 和 `Authorization` 头

### API模块清单
| API文件 | 对应接口 | 说明 |
|---------|---------|------|
| `api/auth.ts` | `/auth/login`, `/auth/me` | 登录认证 |
| `api/topics.ts` | `/hot_topics`, `/xuanti/*` | 热点话题、选题管理 |
| `api/divergence.ts` | `/divergence/*` | AI发散 |
| `api/threads.ts` | `/threads/*` | 内容线程管理 |
| `api/account.ts` | `/accounts/*` | 平台账号管理 |
| `api/device.ts` | `/devices/*` | 设备管理 |
| `api/company.ts` | `/companies/*` | 公司管理 |
| `api/tenants.ts` | `/tenants/*`, `/members/*` | 租户和人员管理 |

### 修改后端地址

编辑 `src/constants/config.ts` 文件：

```typescript
// 修改为你的实际后端服务器地址
export const API_TARGET = 'http://你的服务器IP:8000';
```

## 项目结构

```
SmartMarketApp/
├── App.tsx                          # 应用入口
├── app.json                         # Expo配置
├── package.json                     # 依赖配置
├── tsconfig.json                    # TypeScript配置
├── babel.config.js                  # Babel配置
├── assets/                          # 图标和启动图
├── android/                         # Android原生项目（prebuild生成）
├── src/
│   ├── api/                         # API接口层
│   │   ├── request.ts               # Axios请求封装
│   │   ├── auth.ts                  # 认证接口
│   │   ├── topics.ts                # 热点话题接口
│   │   ├── divergence.ts            # AI发散接口
│   │   ├── threads.ts               # 内容线程接口
│   │   ├── account.ts               # 账号管理接口
│   │   ├── device.ts                # 设备管理接口
│   │   ├── company.ts               # 公司管理接口
│   │   └── tenants.ts               # 租户/人员接口
│   ├── components/                  # 通用组件
│   │   ├── PageHeader.tsx           # 页面头部
│   │   ├── EmptyState.tsx           # 空状态
│   │   └── ThreadList.tsx           # 线程列表
│   ├── constants/                   # 常量配置
│   │   ├── config.ts                # API和业务常量
│   │   └── theme.ts                 # 主题样式
│   ├── navigation/                  # 导航系统
│   │   └── AppNavigator.tsx         # 抽屉+底部Tab导航
│   ├── screens/                     # 页面
│   │   ├── Login/                   # 登录
│   │   ├── TopicCenter/             # 选题中心
│   │   ├── DivergenceResult/        # AI发散结果
│   │   ├── GenerationList/          # 生成列表
│   │   ├── AuditList/               # 审核列表
│   │   ├── PublishList/             # 发布列表
│   │   ├── CompanyInfo/             # 公司信息
│   │   ├── StaffManage/             # 人员管理
│   │   ├── AccountManage/           # 账号管理
│   │   ├── MaterialManage/          # 素材管理
│   │   ├── DeviceManage/            # 设备管理
│   │   ├── ConsoleDashboard/        # 控制台
│   │   ├── CompanyManage/           # 公司管理
│   │   ├── PlatformConfig/          # 平台配置
│   │   └── DeviceMaintenance/       # 设备维护
│   └── store/                       # 状态管理
│       └── auth.ts                  # 认证状态
└── SmartMarket-v1.0.0-release.apk   # 构建好的APK
```

## 安装和使用

### 直接安装APK

项目根目录下的 `SmartMarket-v1.0.0-release.apk` 可直接安装到 Android 手机上使用。

### 从源码构建

**环境要求：**
- Node.js >= 18
- Java JDK 17
- Android SDK (API 34/35)
- Android NDK 26.1.10909125

**构建步骤：**

```bash
# 1. 安装依赖
npm install

# 2. 生成Android原生项目
npx expo prebuild --platform android

# 3. 修复已知的Gradle兼容性问题（如果遇到 components.release 错误）
sed -i 's/from components.release/if (components.findByName("release")) { from components.release }/' \
  node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle

# 4. 构建Release APK
cd android && ./gradlew assembleRelease

# APK输出位置: android/app/build/outputs/apk/release/app-release.apk
```

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Expo | 52.0.x | 开发框架 |
| React Native | 0.76.x | 跨平台UI |
| TypeScript | 5.3.x | 类型安全 |
| React Navigation | 7.x | 导航系统 |
| Axios | 1.x | HTTP请求 |
| AsyncStorage | 1.23.x | 本地存储 |
| Expo SecureStore | 14.x | 安全存储（Token） |

## 权限说明

- 应用根据用户角色（`is_platform_admin`）自动显示/隐藏平台管理模块
- 普通用户只能看到内容管理和系统配置模块
- 平台管理员可以看到所有模块，包括控制台、公司管理、平台配置、设备维护
