'use strict';
const fs=require('fs');const crypto=require('crypto');
// The compiler is used only to regenerate the committed browser artifact.
const ts=require(process.env.TYPESCRIPT_MODULE_PATH||'typescript');
const source=fs.readFileSync('static/design-system/vendor/toast/useToastQueue.ts','utf8');
const ast=ts.createSourceFile('useToastQueue.ts',source,ts.ScriptTarget.Latest,true);
const names=new Set(['TOAST_MIN_DURATION_MS','TOAST_MAX_VISIBLE','createToastStore']);
const printer=ts.createPrinter();
const statements=ast.statements.filter(node=>ts.isVariableStatement(node)&&node.declarationList.declarations.some(decl=>names.has(decl.name.text))).map(node=>ts.factory.updateVariableStatement(node,undefined,node.declarationList));
if(statements.length!==3)throw new Error('DDS Toast source shape changed; review before regenerating.');
const typed=statements.map(node=>printer.printNode(ts.EmitHint.Unspecified,node,ast)).join('\n');
const js=ts.transpileModule(typed,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None}}).outputText;
const sha=crypto.createHash('sha256').update(source).digest('hex');
fs.writeFileSync('static/design-system/toast-store.js','/* Derived without logic changes from DDS useToastQueue.ts; SHA-256 '+sha+'. */\nwindow.KettouToastStore = (()=>{\n'+js+'\nreturn { createToastStore, TOAST_MIN_DURATION_MS, TOAST_MAX_VISIBLE };\n})();\n');
console.log('Generated original DDS Toast queue for the HTML adapter.');
