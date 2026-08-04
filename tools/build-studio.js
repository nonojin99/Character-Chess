/* tools/build-studio.js — sheetlib.js를 셸에 인라인해 단일 파일 도구를 만든다.
   두 파일로 두면 같은 폴더에 없을 때 조용히 죽는다(실제로 당했다). */
var fs = require('fs'), path = require('path');
var lib = fs.readFileSync(path.join(__dirname, 'sheetlib.js'), 'utf8');
var shell = fs.readFileSync(path.join(__dirname, 'studio-shell.html'), 'utf8');
var out = shell.replace('/*SHEETLIB*/', '\n' + lib + '\n');
if (out.indexOf('SheetLib') < 0) throw new Error('인라인 실패');
fs.writeFileSync(path.join(__dirname, 'sheet-studio.html'), out);
console.log('sheet-studio.html  ' + (out.length / 1024).toFixed(1) + ' KB (단일 파일)');
