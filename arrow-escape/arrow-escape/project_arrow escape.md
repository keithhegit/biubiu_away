# Project Arrow Escape - Design & Development Document

## 1. 项目概况 (Project Overview)
**项目名称**: Arrow Escape (箭头消除 / 箭头逃逸)
**类型**: 益智解谜 / 逻辑类 H5 小游戏
**核心玩法**: 类似“拆积木”或“停车大师”。玩家需要按照正确的顺序点击“贪吃蛇”形状的箭头，使其沿着指向飞出屏幕。如果路径被阻挡，则扣除 HP。
**平台**: 移动端 H5 (PWA), 托管于 Cloudflare Pages。
**视觉风格**: 科技蓝图风格 (Technical Blueprint)，深蓝色系 (Deep Navy/Indigo)，点阵网格背景。

---

## 2. 产品需求 (Product Requirements)

### 2.1 核心机制
*   **Framework**: React 19
*   **Language**: TypeScript

### 状态机
*   `idle`: 静止，可交互。
*   `moving`: 正在飞出，不可交互，不视为障碍物。
*   `stuck`: 刚被点击但受阻，播放震动动画，不可交互。

### 颜色规范 (Dark Navy Theme)
*   Main: `#1a237e` (Indigo 900)
*   Accent: `#3b82f6` (Blue 500)
*   Danger: `#ef4444` (Red 500)