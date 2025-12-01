# UDP 解析器 (UDP Parser)

UDP Parser 是一款功能强大的跨平台桌面应用程序，专为 UDP 网络调试、协议分析和数据包解析而设计。该应用基于 Electron、React 和 TypeScript 构建，为网络工程师和开发人员提供了现代化且直观的操作界面。

## 🚀 功能特性

- **UDP 通信**
  - 集成 UDP 服务端和客户端。
  - 轻松发送和接收 UDP 数据包。
  - 实时监控网络流量。

- **高级协议解析**
  - **模板系统**：为您特定的协议定义自定义解析规则。
  - **数据类型**：支持十六进制、字符串、整数（小端/大端）、数组等多种类型。
  - **智能匹配**：基于可配置的字节偏移量和数值，自动将传入的数据包与模板进行匹配。
  - **可视化检查**：以结构化的表格形式查看解析后的数据。

- **自动化与工具**
  - **自动回复管理器**：设置由特定传入消息触发的自动响应，并支持配置延迟时间。
  - **样本生成器**：基于您的模板生成随机或特定的样本数据包用于测试。
  - **模板管理**：导入、导出和管理您的协议模板。

- **用户体验**
  - **现代化 UI**：基于 Tailwind CSS 构建的整洁且响应式的界面。
  - **多主题支持**：支持在浅色、深色、护眼和海洋主题之间切换。
  - **便携版**：提供 Windows 便携版应用程序（无需安装）。

## 🛠️ 技术栈

- **核心**：[Electron](https://www.electronjs.org/)
- **前端**：[React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **样式**：[Tailwind CSS](https://tailwindcss.com/)
- **状态管理**：React Context API
- **打包**：[electron-builder](https://www.electron.build/)

## 📦 安装与使用

### 前置要求

- Node.js (建议 v16 或更高版本)
- npm 或 yarn

### 开发环境

1.  **克隆仓库**
    ```bash
    git clone <repository-url>
    cd parser
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **启动开发模式**
    同时运行 Vite 开发服务器和 Electron 应用。
    ```bash
    npm run dev
    ```

### 构建

构建生产环境应用（Windows）：

```bash
npm run build
```

构建产物（包括便携版可执行文件）将生成在 `release` 目录（或 `package.json` 中配置的任何目录）中。

## 📂 项目结构

```
d:\AI\parser/
├── dist/                   # Vite 构建输出 (前端)
├── dist-electron/          # Electron 主进程构建输出
├── electron/               # Electron 主进程源代码
│   ├── common/             # 共享工具类
│   ├── services/           # 后端服务 (UDP, Store)
│   └── main.ts             # 应用程序入口点
├── src/                    # React 前端源代码
│   ├── components/         # UI 组件 (Parser, Debugger, Managers)
│   ├── context/            # 状态管理
│   ├── hooks/              # 自定义 React Hooks
│   ├── types/              # TypeScript 类型定义
│   └── utils/              # 辅助函数 (Parsers, Generators)
├── public/                 # 静态资源
└── release/    # 生产环境构建产物
```

## 📝 许可证

[MIT](LICENSE)
