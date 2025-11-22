# XCStrings Manager - 安装和使用指南

## 📦 安装步骤

### 方法 1: 开发模式运行（推荐用于测试）

1. **进入扩展目录**
   ```bash
   cd xcstrings-vscode-extension
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **编译 TypeScript**
   ```bash
   npm run compile
   ```

4. **在 VS Code 中打开扩展目录**
   ```bash
   code .
   ```

5. **运行扩展**
   - 按 `F5` 键
   - 或者点击 "Run" → "Start Debugging"
   - 这会打开一个新的 VS Code 窗口（扩展开发主机）

6. **在新窗口中测试扩展**
   - 打开你的项目（包含 `.xcstrings` 文件）
   - 使用扩展的功能

### 方法 2: 打包安装（推荐用于日常使用）

1. **安装 vsce（VS Code 扩展打包工具）**
   ```bash
   npm install -g @vscode/vsce
   ```

2. **进入扩展目录并打包**
   ```bash
   cd xcstrings-vscode-extension
   npm install
   npm run compile
   vsce package
   ```

3. **安装生成的 .vsix 文件**
   ```bash
   code --install-extension xcstrings-manager-1.0.0.vsix
   ```

   或者在 VS Code 中：
   - 打开扩展视图（`Cmd+Shift+X` 或 `Ctrl+Shift+X`）
   - 点击右上角的 `...` 菜单
   - 选择 "Install from VSIX..."
   - 选择生成的 `.vsix` 文件

4. **重启 VS Code**

## 🚀 使用指南

### 1. 拆分 XCStrings 文件

#### 方法 A: 右键菜单
1. 在资源管理器中找到 `.xcstrings` 文件
2. 右键点击文件
3. 选择 "XCStrings: Split File"
4. 输入输出目录（默认为 `./locales`）
5. 等待拆分完成

#### 方法 B: 命令面板
1. 打开 `.xcstrings` 文件
2. 按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
3. 输入 "XCStrings: Split File"
4. 按回车执行

#### 输出结果
```
locales/
  ├── en.json
  ├── zh-Hans.json
  ├── zh-Hant.json
  └── zh-HK.json
```

### 2. 合并 JSON 文件

#### 方法 A: 右键菜单
1. 在资源管理器中找到包含语言 JSON 文件的目录（如 `locales`）
2. 右键点击目录
3. 选择 "XCStrings: Merge Files"
4. 输入源语言代码（默认为 `en`）
5. 等待合并完成

#### 方法 B: 命令面板
1. 按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
2. 输入 "XCStrings: Merge Files"
3. 选择包含 JSON 文件的目录
4. 输入源语言代码

#### 输出结果
```
locales/
  ├── en.json
  ├── zh-Hans.json
  ├── zh-Hant.json
  ├── zh-HK.json
  └── Localizable.xcstrings  ← 新生成的文件
```

### 3. 对比 XCStrings 文件

1. 按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
2. 输入 "XCStrings: Compare Files"
3. 选择第一个 `.xcstrings` 文件
4. 选择第二个 `.xcstrings` 文件
5. 查看对比报告（会在新标签页中打开）

#### 对比报告示例
```markdown
# XCStrings 文件对比报告

## 统计信息对比

| 项目 | 文件1 | 文件2 |
|------|-------|-------|
| 源语言 | en | en |
| 版本 | 1.0 | 1.0 |
| 字符串总数 | 444 | 444 |
...

## 对比结果

✅ 两个文件在语义上完全一致！
```

## 💡 使用技巧

### 完整的本地化工作流程

```bash
# 1. 拆分原始文件
右键点击 Localizable.xcstrings → "XCStrings: Split File"

# 2. 编辑翻译
# 在 locales/ 目录中编辑各个语言的 JSON 文件
# 可以使用任何文本编辑器或翻译工具

# 3. 合并回 xcstrings
右键点击 locales/ 目录 → "XCStrings: Merge Files"

# 4. 验证结果
命令面板 → "XCStrings: Compare Files"
# 选择原始文件和生成文件进行对比
```

### 版本控制建议

如果你使用 Git 等版本控制系统：

1. **提交拆分后的 JSON 文件**
   - 更容易查看翻译的变更
   - 更容易解决合并冲突
   - 翻译人员可以只关注自己语言的文件

2. **添加到 .gitignore（可选）**
   ```
   # 如果你只想提交 JSON 文件
   *.xcstrings
   
   # 或者如果你只想提交 xcstrings 文件
   locales/*.json
   ```

## 🔧 故障排除

### 问题：扩展命令不显示

**解决方案：**
1. 确保已正确安装扩展
2. 重启 VS Code
3. 检查是否打开了包含 `.xcstrings` 文件的项目

### 问题：编译错误

**解决方案：**
```bash
# 清理并重新安装
rm -rf node_modules out
npm install
npm run compile
```

### 问题：找不到命令

**解决方案：**
1. 按 `Cmd+Shift+P` 打开命令面板
2. 输入 "Developer: Reload Window"
3. 重新加载窗口

## 📝 注意事项

1. **备份重要文件**：在第一次使用时，建议备份原始的 `.xcstrings` 文件

2. **编码问题**：所有文件都使用 UTF-8 编码，确保你的编辑器也使用 UTF-8

3. **特殊字段**：
   - `_root_metadata`: 存储根级别的元数据（version, sourceLanguage 等）
   - `_extra_fields`: 存储额外的字段（comment, shouldTranslate 等）
   - 这些是内部使用的字段，不要手动修改

4. **文件命名**：语言 JSON 文件必须以语言代码命名（如 `en.json`, `zh-Hans.json`）

## 🎉 开始使用

现在你已经准备好使用 XCStrings Manager 了！

如果遇到任何问题，请查看 [README.md](README.md) 或提交 issue。

