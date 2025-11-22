# XCStrings Manager - 架构说明

## 📁 项目结构

```
xcstrings-vscode-extension/
├── .vscode/                    # VS Code 配置
│   ├── launch.json            # 调试配置
│   └── tasks.json             # 构建任务
├── src/                       # 源代码
│   └── extension.ts           # 主扩展逻辑
├── out/                       # 编译输出（自动生成）
│   └── extension.js
├── node_modules/              # 依赖包（自动生成）
├── package.json               # 扩展配置和依赖
├── tsconfig.json              # TypeScript 配置
├── .vscodeignore              # 打包时忽略的文件
├── .gitignore                 # Git 忽略的文件
├── README.md                  # 用户文档
├── INSTALL.md                 # 安装指南
├── QUICKSTART.md              # 快速开始
└── ARCHITECTURE.md            # 本文件
```

## 🏗️ 核心组件

### 1. Extension Entry Point (`extension.ts`)

#### `activate(context)`
扩展激活时调用，注册所有命令：
- `xcstrings.split` - 拆分命令
- `xcstrings.merge` - 合并命令
- `xcstrings.compare` - 对比命令

#### `deactivate()`
扩展停用时调用（当前为空实现）

### 2. 核心功能函数

#### `splitXCStrings(uri: vscode.Uri)`
**功能：** 将 `.xcstrings` 文件拆分成多个语言 JSON 文件

**流程：**
1. 验证输入文件（必须是 `.xcstrings`）
2. 询问输出目录
3. 读取并解析 JSON
4. 提取根级别元数据（version, sourceLanguage 等）
5. 遍历所有字符串和本地化
6. 为每个语言创建独立的 JSON 对象
7. 保存额外字段（comment, shouldTranslate 等）
8. 写入文件到输出目录

**数据结构：**
```typescript
languageTranslations = {
  "en": {
    "string_key": {
      "stringUnit": { "state": "...", "value": "..." },
      "_extra_fields": { "comment": "...", ... }
    },
    "_root_metadata": { "version": "1.0", ... }
  },
  "zh-Hans": { ... }
}
```

#### `mergeXCStrings(uri: vscode.Uri)`
**功能：** 将多个语言 JSON 文件合并成 `.xcstrings` 文件

**流程：**
1. 选择包含 JSON 文件的目录
2. 询问源语言代码
3. 扫描目录中的所有 `.json` 文件
4. 从文件名提取语言代码（`en.json` → `en`）
5. 读取每个文件并提取翻译
6. 提取根级别元数据（从第一个文件）
7. 合并所有语言的翻译
8. 恢复额外字段
9. 构建完整的 xcstrings 结构
10. 写入 `Localizable.xcstrings`

**数据结构：**
```typescript
mergedStrings = {
  "string_key": {
    "localizations": {
      "en": { "stringUnit": { ... } },
      "zh-Hans": { "stringUnit": { ... } }
    },
    "extra_fields": { "comment": "...", ... }
  }
}
```

#### `compareXCStrings()`
**功能：** 深度对比两个 `.xcstrings` 文件

**流程：**
1. 选择两个文件
2. 读取并解析 JSON
3. 收集统计信息（字符串数量、语言数量等）
4. 深度递归对比
5. 生成 Markdown 格式的对比报告
6. 在新标签页中显示报告

**对比算法：**
- 递归遍历所有对象和数组
- 忽略键的顺序
- 记录所有差异的路径和值

### 3. 辅助函数

#### `collectStats(data: any)`
收集 xcstrings 文件的统计信息：
- 源语言
- 版本号
- 字符串总数
- 语言列表
- 带 comment 的字符串数量
- 带 shouldTranslate 的字符串数量
- 带 variations 的字符串数量

#### `deepCompare(obj1, obj2, path, differences)`
深度递归对比两个对象：
- 比较类型
- 比较数组长度
- 比较对象键
- 比较值
- 记录差异路径

#### `generateCompareReport(stats1, stats2, differences)`
生成 Markdown 格式的对比报告：
- 统计信息表格
- 语言列表
- 差异列表（最多显示 100 条）

## 🔧 配置文件

### `package.json`

#### 关键字段：
- `activationEvents`: 扩展激活时机（当打开 JSON 文件时）
- `contributes.commands`: 注册的命令
- `contributes.menus`: 右键菜单配置
  - `explorer/context`: 资源管理器右键菜单
  - `editor/context`: 编辑器右键菜单

#### 菜单条件：
- `resourceExtname == .xcstrings`: 只在 `.xcstrings` 文件上显示
- `explorerResourceIsFolder`: 只在文件夹上显示

### `tsconfig.json`

#### 编译选项：
- `target: ES2020`: 编译目标
- `module: commonjs`: 模块系统
- `strict: true`: 严格模式
- `outDir: out`: 输出目录

## 🎨 用户体验设计

### 进度提示
所有长时间操作都使用 `vscode.window.withProgress` 显示进度：
- 拆分文件
- 合并文件
- 对比文件

### 用户交互
- `showInputBox`: 输入目录路径、源语言等
- `showOpenDialog`: 选择文件或目录
- `showInformationMessage`: 成功提示
- `showErrorMessage`: 错误提示
- `showWarningMessage`: 警告提示

### 后续操作
完成操作后询问用户：
- 是否打开输出目录
- 是否打开生成的文件

## 🔄 数据流

### 拆分流程
```
Localizable.xcstrings
    ↓ (读取)
JSON 对象
    ↓ (解析)
提取 strings 和 metadata
    ↓ (遍历)
按语言分组
    ↓ (添加元数据)
语言 JSON 对象
    ↓ (写入)
en.json, zh-Hans.json, ...
```

### 合并流程
```
en.json, zh-Hans.json, ...
    ↓ (读取)
语言 JSON 对象
    ↓ (提取)
翻译和元数据
    ↓ (合并)
完整的 strings 对象
    ↓ (构建)
xcstrings 结构
    ↓ (写入)
Localizable.xcstrings
```

## 🧪 测试建议

### 单元测试（未实现）
可以添加以下测试：
- 拆分功能测试
- 合并功能测试
- 对比功能测试
- 边界情况测试

### 集成测试
手动测试流程：
1. 拆分 → 合并 → 对比（应该一致）
2. 拆分 → 修改 → 合并 → 对比（应该显示差异）
3. 测试各种特殊情况（复数、comment、shouldTranslate 等）

## 📦 打包和发布

### 本地打包
```bash
npm install -g @vscode/vsce
vsce package
```

### 发布到市场（可选）
```bash
vsce publish
```

需要先创建 Azure DevOps 账号和 Personal Access Token。

## 🚀 未来改进

### 功能增强
- [ ] 支持批量拆分/合并
- [ ] 支持自定义输出格式
- [ ] 支持翻译进度统计
- [ ] 支持翻译质量检查
- [ ] 支持自动检测缺失的翻译

### 性能优化
- [ ] 大文件处理优化
- [ ] 异步文件操作
- [ ] 缓存机制

### 用户体验
- [ ] 更详细的错误提示
- [ ] 撤销/重做功能
- [ ] 配置选项（默认输出目录等）
- [ ] 快捷键支持

---

**维护者注意：** 修改代码时请更新此文档。

