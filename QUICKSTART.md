# 快速开始指南

## 🚀 5分钟上手 XCStrings Manager

### 第一步：安装扩展

#### 开发模式（推荐用于测试）

```bash
cd xcstrings-vscode-extension
npm install
npm run compile
code .
```

然后按 `F5` 启动扩展开发主机。

#### 打包安装（推荐用于日常使用）

```bash
cd xcstrings-vscode-extension
npm install
npm run compile
npm install -g @vscode/vsce
vsce package
code --install-extension xcstrings-manager-1.0.0.vsix
```

### 第二步：测试扩展

#### 测试拆分功能

1. 在 VS Code 中打开你的项目（包含 `.xcstrings` 文件）
2. 在资源管理器中找到 `Localizable.xcstrings` 文件
3. 右键点击 → 选择 "XCStrings: Split File"
4. 输入输出目录（例如：`./locales`）
5. 等待完成，查看生成的 JSON 文件

**预期结果：**
```
locales/
  ├── en.json
  ├── zh-Hans.json
  ├── zh-Hant.json
  └── zh-HK.json
```

#### 测试合并功能

1. 编辑 `locales/` 目录中的某个 JSON 文件（例如修改一个翻译）
2. 右键点击 `locales/` 目录
3. 选择 "XCStrings: Merge Files"
4. 输入源语言（例如：`en`）
5. 等待完成，查看生成的 `Localizable.xcstrings` 文件

**预期结果：**
```
locales/
  ├── en.json
  ├── zh-Hans.json
  ├── zh-Hant.json
  ├── zh-HK.json
  └── Localizable.xcstrings  ← 新生成
```

#### 测试对比功能

1. 按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
2. 输入 "XCStrings: Compare Files"
3. 选择原始的 `Localizable.xcstrings` 文件
4. 选择 `locales/Localizable.xcstrings` 文件
5. 查看对比报告

**预期结果：**
- 如果没有修改，应该显示 "✅ 两个文件在语义上完全一致！"
- 如果有修改，会显示具体的差异

### 第三步：集成到工作流程

#### 推荐的工作流程

```
1. 开发阶段
   ├── 在 Xcode 中添加新的本地化字符串
   └── Xcode 自动更新 Localizable.xcstrings

2. 翻译阶段
   ├── 使用扩展拆分 xcstrings 文件
   ├── 将 JSON 文件发送给翻译人员
   ├── 翻译人员编辑各自语言的 JSON 文件
   └── 收到翻译后的 JSON 文件

3. 集成阶段
   ├── 使用扩展合并 JSON 文件
   ├── 使用对比功能验证结果
   └── 将生成的 xcstrings 文件复制回项目

4. 版本控制
   ├── 提交 JSON 文件到 Git（更容易查看变更）
   └── 或者提交 xcstrings 文件（Xcode 原生格式）
```

### 常用命令

| 命令 | 快捷方式 | 说明 |
|------|---------|------|
| XCStrings: Split File | 右键菜单 | 拆分 xcstrings 文件 |
| XCStrings: Merge Files | 右键菜单 | 合并 JSON 文件 |
| XCStrings: Compare Files | Cmd+Shift+P | 对比两个文件 |

### 故障排除

#### 问题：找不到命令

**解决方案：**
1. 确保扩展已正确安装
2. 重启 VS Code
3. 按 `Cmd+Shift+P` → "Developer: Reload Window"

#### 问题：编译失败

**解决方案：**
```bash
rm -rf node_modules out
npm install
npm run compile
```

#### 问题：扩展不工作

**解决方案：**
1. 检查 VS Code 版本（需要 1.80.0 或更高）
2. 查看输出面板（View → Output → XCStrings Manager）
3. 查看开发者工具（Help → Toggle Developer Tools）

### 下一步

- 阅读 [README.md](README.md) 了解更多功能
- 阅读 [INSTALL.md](INSTALL.md) 了解详细安装步骤
- 查看示例项目中的 `.xcstrings` 文件

### 需要帮助？

如果遇到问题：
1. 查看文档
2. 检查 GitHub Issues
3. 提交新的 Issue

---

**祝你使用愉快！** 🎉

