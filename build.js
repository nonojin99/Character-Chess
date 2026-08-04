/* build.js — logic + render를 shell.html에 인라인해 index.html 생성.
   로직을 HTML에 직접 복붙하면 검증 스크립트와 실제 화면이 갈라진다. 반드시 이 경로만 쓴다. */
var fs = require('fs'), path = require('path');
var ROOT = __dirname;

var FILES = [
  'logic/chess.js',
  'logic/ai.js',
  'logic/pgn.js',
  'logic/match.js',
  'render/shapes.js',
  'render/themes.js',
  'render/material.js',
  'render/physics.js',
  'render/effects.js',
  'render/fx.js',
  'render/board.js',
  'render/piece3d.js',
  'render/app.js'
];

var bundle = FILES.map(function (f) {
  return '/* ===== ' + f + ' ===== */\n' + fs.readFileSync(path.join(ROOT, f), 'utf8');
}).join('\n');

var shell = fs.readFileSync(path.join(ROOT, 'shell.html'), 'utf8');
var out = shell.replace('<!--SCRIPTS-->', '<script>\n' + bundle + '\n</script>');

fs.writeFileSync(path.join(ROOT, 'index.html'), out);
fs.writeFileSync(path.join(ROOT, 'bundle.js'), bundle);
console.log('index.html  ' + (out.length / 1024).toFixed(1) + ' KB');
