/*
 * @Author: junyang.le@hand-china.com
 * @Date: 2021-12-03 10:31:09
 * @LastEditTime: 2022-01-24 16:11:56
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\electron\utils\processImport.ts
 */
// import * as vscode from 'vscode';
// import traverse from '@babel/traverse';
// import { NodePath } from '@babel/core';
// import { ImportDeclaration } from '@babel/types';
// import { parseCode, getEditor } from './utils';

// export function insertIntlAndFormatImport(uri?: string) {
// 	const editor = getEditor(uri);
// 	const code = editor?.document.getText() ?? '';
// 	const ast = parseCode(code);
// 	if (ast.errorString) return;
// 	let lastModuleImportLine = 0; // 最后可以放置导入模块的行，它应该在相对导入之前，在其他的模块导入之后
// 	let intlImport = false,
// 		formatImport = false;
// 	traverse(ast, {
// 		ImportDeclaration(path: NodePath<ImportDeclaration>) {
// 			// 用于确定lastModuleImportLine
// 			if (!path.node.source.value.startsWith('.')) {
// 				lastModuleImportLine = path.node.source.loc?.start.line ?? 0;
// 			}
// 			const { specifiers } = path.node;
// 			// 用于确定intl Import
// 			if (
// 				!intlImport &&
// 				specifiers.length === 1 &&
// 				specifiers[0].type === 'ImportDefaultSpecifier' &&
// 				specifiers[0].local.name === 'intl'
// 			) {
// 				intlImport = true;
// 			}
// 			// 用于确定formatterCollection Import
// 			if (
// 				!formatImport &&
// 				specifiers.length === 1 &&
// 				specifiers[0].type === 'ImportDefaultSpecifier' &&
// 				specifiers[0].local.name === 'formatterCollections'
// 			) {
// 				formatImport = true;
// 			}
// 		},
// 	});
// 	const position = new vscode.Position(lastModuleImportLine, 0); // 这个插入的位置是在当前行的后面
// 	const insertString =
// 		(!intlImport ? "import intl from 'utils/intl';\n" : '') +
// 		(!formatImport ? "import formatterCollections from 'utils/intl/formatterCollections';\n" : '');
// 	if (editor && insertString) {
// 		// 编辑传入的是callback，在其中调用builder进行修改
// 		editor.edit((editbuilder) => {
// 			editbuilder.insert(position, insertString);
// 		});
// 	} else {
// 		vscode.window.showInformationMessage('已存在这两个导入');
// 	}
// }
