import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('XCStrings Manager extension is now active');

    // 注册拆分命令
    let splitCommand = vscode.commands.registerCommand('xcstrings.split', async (uri: vscode.Uri) => {
        await splitXCStrings(uri);
    });

    // 注册合并命令
    let mergeCommand = vscode.commands.registerCommand('xcstrings.merge', async (uri: vscode.Uri) => {
        await mergeXCStrings(uri);
    });

    // 注册对比命令
    let compareCommand = vscode.commands.registerCommand('xcstrings.compare', async () => {
        await compareXCStrings();
    });

    context.subscriptions.push(splitCommand, mergeCommand, compareCommand);
}

export function deactivate() {}

/**
 * 拆分 xcstrings 文件
 */
async function splitXCStrings(uri: vscode.Uri) {
    try {
        // 如果没有提供 URI，尝试从当前编辑器获取
        if (!uri && vscode.window.activeTextEditor) {
            uri = vscode.window.activeTextEditor.document.uri;
        }

        if (!uri) {
            vscode.window.showErrorMessage('请先打开或选择一个 .xcstrings 文件');
            return;
        }

        const filePath = uri.fsPath;
        
        if (!filePath.endsWith('.xcstrings')) {
            vscode.window.showErrorMessage('请选择一个 .xcstrings 文件');
            return;
        }

        // 询问输出目录
        const defaultOutputDir = path.join(path.dirname(filePath), 'locales');
        const outputDir = await vscode.window.showInputBox({
            prompt: '输入输出目录路径',
            value: defaultOutputDir,
            placeHolder: '例如: ./locales'
        });

        if (!outputDir) {
            return;
        }

        // 显示进度
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "拆分 XCStrings 文件",
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: "读取文件..." });

            // 读取文件
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);

            progress.report({ increment: 20, message: "解析数据..." });

            // 获取所有字符串
            const strings = data.strings || {};
            
            // 保存根级别的元数据
            const rootMetadata: any = {};
            for (const key in data) {
                if (key !== 'strings') {
                    rootMetadata[key] = data[key];
                }
            }

            // 用于存储每个语言的翻译
            const languageTranslations: { [lang: string]: any } = {};

            progress.report({ increment: 20, message: "提取翻译..." });

            // 遍历所有字符串
            for (const [key, value] of Object.entries(strings)) {
                const stringData = value as any;
                const localizations = stringData.localizations || {};
                
                // 提取额外的字段
                const extraFields: any = {};
                for (const k in stringData) {
                    if (k !== 'localizations') {
                        extraFields[k] = stringData[k];
                    }
                }

                // 遍历每个语言的本地化
                for (const [lang, localizationData] of Object.entries(localizations)) {
                    if (!languageTranslations[lang]) {
                        languageTranslations[lang] = {};
                    }

                    const entry: any = typeof localizationData === 'object' && localizationData !== null
                        ? { ...(localizationData as object) }
                        : localizationData;

                    // 添加额外的字段
                    if (Object.keys(extraFields).length > 0 && typeof entry === 'object') {
                        entry._extra_fields = extraFields;
                    }

                    languageTranslations[lang][key] = entry;
                }
            }

            progress.report({ increment: 20, message: "创建输出目录..." });

            // 创建输出目录
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            progress.report({ increment: 20, message: "写入文件..." });

            // 为每个语言生成 JSON 文件
            let fileCount = 0;
            for (const [lang, translations] of Object.entries(languageTranslations)) {
                // 添加根级别的元数据
                if (Object.keys(rootMetadata).length > 0) {
                    (translations as any)._root_metadata = rootMetadata;
                }

                const outputFile = path.join(outputDir, `${lang}.json`);
                fs.writeFileSync(outputFile, JSON.stringify(translations, null, 2), 'utf-8');
                fileCount++;
            }

            progress.report({ increment: 20, message: "完成！" });

            vscode.window.showInformationMessage(
                `✓ 成功拆分为 ${fileCount} 个语言文件到 ${outputDir}`
            );

            // 询问是否打开输出目录
            const openFolder = await vscode.window.showInformationMessage(
                '是否在资源管理器中打开输出目录？',
                '是', '否'
            );

            if (openFolder === '是') {
                vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(outputDir));
            }
        });

    } catch (error) {
        vscode.window.showErrorMessage(`拆分失败: ${error}`);
        console.error(error);
    }
}

/**
 * 合并 JSON 文件到 xcstrings
 */
async function mergeXCStrings(uri: vscode.Uri) {
    try {
        // 如果没有提供 URI，让用户选择目录
        let dirPath: string;

        if (uri && fs.statSync(uri.fsPath).isDirectory()) {
            dirPath = uri.fsPath;
        } else {
            const selectedFolder = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: '选择包含语言 JSON 文件的目录'
            });

            if (!selectedFolder || selectedFolder.length === 0) {
                return;
            }

            dirPath = selectedFolder[0].fsPath;
        }

        // 询问源语言
        const sourceLanguage = await vscode.window.showInputBox({
            prompt: '输入源语言代码',
            value: 'en',
            placeHolder: '例如: en, zh-Hans'
        });

        if (!sourceLanguage) {
            return;
        }

        // 显示进度
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "合并 JSON 文件",
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: "扫描文件..." });

            // 扫描目录中的所有 JSON 文件
            const files = fs.readdirSync(dirPath).filter((f: string) => f.endsWith('.json'));

            if (files.length === 0) {
                vscode.window.showErrorMessage('在目录中没有找到 JSON 文件');
                return;
            }

            progress.report({ increment: 20, message: `找到 ${files.length} 个文件...` });

            // 存储合并后的数据
            const mergedStrings: { [key: string]: any } = {};
            let rootMetadata: any = null;

            // 读取每个语言文件
            for (const file of files) {
                const langCode = path.basename(file, '.json');
                const filePath = path.join(dirPath, file);

                progress.report({ message: `读取 ${file}...` });

                const content = fs.readFileSync(filePath, 'utf-8');
                const translations = JSON.parse(content);

                // 提取根级别的元数据
                if (translations._root_metadata && !rootMetadata) {
                    rootMetadata = translations._root_metadata;
                }

                // 遍历该语言的所有翻译条目
                for (const [stringKey, localizationData] of Object.entries(translations)) {
                    // 跳过元数据键
                    if (stringKey === '_root_metadata') {
                        continue;
                    }

                    if (!mergedStrings[stringKey]) {
                        mergedStrings[stringKey] = { localizations: {} };
                    }

                    const data = localizationData as any;

                    // 提取额外字段
                    let extraFields: any = null;
                    let cleanData = { ...data };

                    if (data._extra_fields) {
                        extraFields = data._extra_fields;
                        delete cleanData._extra_fields;
                    }

                    // 添加到合并的数据中
                    mergedStrings[stringKey].localizations[langCode] = cleanData;

                    // 保存额外字段
                    if (extraFields && !mergedStrings[stringKey].extra_fields) {
                        mergedStrings[stringKey].extra_fields = extraFields;
                    }
                }
            }

            progress.report({ increment: 40, message: "构建 xcstrings 结构..." });

            // 构建最终的 xcstrings 结构
            const xcstringsData: any = rootMetadata || { sourceLanguage };

            if (!xcstringsData.sourceLanguage) {
                xcstringsData.sourceLanguage = sourceLanguage;
            }

            xcstringsData.strings = {};

            // 转换合并的数据为 xcstrings 格式
            for (const [stringKey, data] of Object.entries(mergedStrings)) {
                const entry: any = {
                    localizations: data.localizations
                };

                // 添加额外字段
                if (data.extra_fields) {
                    Object.assign(entry, data.extra_fields);
                }

                xcstringsData.strings[stringKey] = entry;
            }

            progress.report({ increment: 20, message: "写入文件..." });

            // 输出文件路径
            const outputFile = path.join(dirPath, 'Localizable.xcstrings');
            fs.writeFileSync(outputFile, JSON.stringify(xcstringsData, null, 2), 'utf-8');

            progress.report({ increment: 20, message: "完成！" });

            vscode.window.showInformationMessage(
                `✓ 成功合并 ${files.length} 个语言文件到 ${outputFile}`
            );

            // 询问是否打开生成的文件
            const openFile = await vscode.window.showInformationMessage(
                '是否打开生成的文件？',
                '是', '否'
            );

            if (openFile === '是') {
                const doc = await vscode.workspace.openTextDocument(outputFile);
                await vscode.window.showTextDocument(doc);
            }
        });

    } catch (error) {
        vscode.window.showErrorMessage(`合并失败: ${error}`);
    }
}

/**
 * 对比两个 xcstrings 文件
 */
async function compareXCStrings() {
    try {
        // 选择第一个文件
        const file1 = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            openLabel: '选择第一个 .xcstrings 文件',
            filters: {
                'XCStrings': ['xcstrings']
            }
        });

        if (!file1 || file1.length === 0) {
            return;
        }

        // 选择第二个文件
        const file2 = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            openLabel: '选择第二个 .xcstrings 文件',
            filters: {
                'XCStrings': ['xcstrings']
            }
        });

        if (!file2 || file2.length === 0) {
            return;
        }

        // 显示进度
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "对比 XCStrings 文件",
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: "读取文件..." });

            // 读取两个文件
            const content1 = fs.readFileSync(file1[0].fsPath, 'utf-8');
            const content2 = fs.readFileSync(file2[0].fsPath, 'utf-8');

            const data1 = JSON.parse(content1);
            const data2 = JSON.parse(content2);

            progress.report({ increment: 30, message: "收集统计信息..." });

            // 收集统计信息
            const stats1 = collectStats(data1);
            const stats2 = collectStats(data2);

            progress.report({ increment: 30, message: "深度对比..." });

            // 深度对比
            const differences: string[] = [];
            deepCompare(data1, data2, 'root', differences);

            progress.report({ increment: 40, message: "生成报告..." });

            // 生成对比报告
            const report = generateCompareReport(stats1, stats2, differences);

            // 创建新的文档显示报告
            const doc = await vscode.workspace.openTextDocument({
                content: report,
                language: 'markdown'
            });

            await vscode.window.showTextDocument(doc);

            if (differences.length === 0) {
                vscode.window.showInformationMessage('✅ 两个文件在语义上完全一致！');
            } else {
                vscode.window.showWarningMessage(`❌ 发现 ${differences.length} 处差异`);
            }
        });

    } catch (error) {
        vscode.window.showErrorMessage(`对比失败: ${error}`);
    }
}

/**
 * 收集统计信息
 */
function collectStats(data: any) {
    const stats = {
        sourceLanguage: data.sourceLanguage || 'N/A',
        version: data.version || 'N/A',
        totalStrings: Object.keys(data.strings || {}).length,
        languages: new Set<string>(),
        stringsWithComment: 0,
        stringsWithShouldTranslate: 0,
        stringsWithVariations: 0
    };

    const strings = data.strings || {};
    for (const [, value] of Object.entries(strings)) {
        const stringData = value as any;

        if (stringData.comment) {
            stats.stringsWithComment++;
        }

        if (stringData.shouldTranslate !== undefined) {
            stats.stringsWithShouldTranslate++;
        }

        const localizations = stringData.localizations || {};
        for (const lang of Object.keys(localizations)) {
            stats.languages.add(lang);
        }

        for (const locData of Object.values(localizations)) {
            if ((locData as any).variations) {
                stats.stringsWithVariations++;
                break;
            }
        }
    }

    return stats;
}

/**
 * 深度对比两个对象
 */
function deepCompare(obj1: any, obj2: any, path: string, differences: string[]): boolean {
    if (typeof obj1 !== typeof obj2) {
        differences.push(`类型不匹配 at ${path}: ${typeof obj1} vs ${typeof obj2}`);
        return false;
    }

    if (obj1 === null || obj2 === null) {
        if (obj1 !== obj2) {
            differences.push(`值不匹配 at ${path}: ${obj1} vs ${obj2}`);
            return false;
        }
        return true;
    }

    if (typeof obj1 === 'object') {
        if (Array.isArray(obj1)) {
            if (!Array.isArray(obj2)) {
                differences.push(`类型不匹配 at ${path}: array vs object`);
                return false;
            }
            if (obj1.length !== obj2.length) {
                differences.push(`数组长度不匹配 at ${path}: ${obj1.length} vs ${obj2.length}`);
                return false;
            }
            let allMatch = true;
            for (let i = 0; i < obj1.length; i++) {
                if (!deepCompare(obj1[i], obj2[i], `${path}[${i}]`, differences)) {
                    allMatch = false;
                }
            }
            return allMatch;
        } else {
            const keys1 = Object.keys(obj1);
            const keys2 = Object.keys(obj2);
            const allKeys = new Set([...keys1, ...keys2]);

            let allMatch = true;
            for (const key of allKeys) {
                if (!(key in obj1)) {
                    differences.push(`键缺失 in file1 at ${path}: '${key}'`);
                    allMatch = false;
                } else if (!(key in obj2)) {
                    differences.push(`键缺失 in file2 at ${path}: '${key}'`);
                    allMatch = false;
                } else {
                    const newPath = path ? `${path}.${key}` : key;
                    if (!deepCompare(obj1[key], obj2[key], newPath, differences)) {
                        allMatch = false;
                    }
                }
            }
            return allMatch;
        }
    } else {
        if (obj1 !== obj2) {
            differences.push(`值不匹配 at ${path}: '${obj1}' vs '${obj2}'`);
            return false;
        }
        return true;
    }
}

/**
 * 生成对比报告
 */
function generateCompareReport(stats1: any, stats2: any, differences: string[]): string {
    const langs1 = Array.from(stats1.languages).sort().join(', ');
    const langs2 = Array.from(stats2.languages).sort().join(', ');

    let report = `# XCStrings 文件对比报告\n\n`;
    report += `## 统计信息对比\n\n`;
    report += `| 项目 | 文件1 | 文件2 |\n`;
    report += `|------|-------|-------|\n`;
    report += `| 源语言 | ${stats1.sourceLanguage} | ${stats2.sourceLanguage} |\n`;
    report += `| 版本 | ${stats1.version} | ${stats2.version} |\n`;
    report += `| 字符串总数 | ${stats1.totalStrings} | ${stats2.totalStrings} |\n`;
    report += `| 语言数量 | ${stats1.languages.size} | ${stats2.languages.size} |\n`;
    report += `| 带 comment 的字符串 | ${stats1.stringsWithComment} | ${stats2.stringsWithComment} |\n`;
    report += `| 带 shouldTranslate 的字符串 | ${stats1.stringsWithShouldTranslate} | ${stats2.stringsWithShouldTranslate} |\n`;
    report += `| 带 variations 的字符串 | ${stats1.stringsWithVariations} | ${stats2.stringsWithVariations} |\n\n`;

    report += `**文件1 的语言:** ${langs1}\n\n`;
    report += `**文件2 的语言:** ${langs2}\n\n`;

    report += `## 对比结果\n\n`;

    if (differences.length === 0) {
        report += `✅ **两个文件在语义上完全一致！**\n\n`;
        report += `所有内容都匹配：\n`;
        report += `- ✓ sourceLanguage 字段\n`;
        report += `- ✓ 所有字符串键\n`;
        report += `- ✓ 所有语言的翻译内容\n`;
        report += `- ✓ stringUnit、state、value 等字段\n`;
        report += `- ✓ variations（复数形式）\n`;
        report += `- ✓ comment、shouldTranslate 等额外字段\n`;
    } else {
        report += `❌ **发现 ${differences.length} 处差异**\n\n`;
        report += `### 差异列表\n\n`;

        const maxDisplay = 100;
        for (let i = 0; i < Math.min(differences.length, maxDisplay); i++) {
            report += `${i + 1}. ${differences[i]}\n`;
        }

        if (differences.length > maxDisplay) {
            report += `\n... 还有 ${differences.length - maxDisplay} 处差异未显示\n`;
        }
    }

    return report;
}

