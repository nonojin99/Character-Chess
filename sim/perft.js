/* sim/perft.js — 규칙 정확성 회귀. 초기 배치 perft는 정답이 공개되어 있다. */
require('../logic/chess.js');
var C = globalThis.Chess;

function perft(st, d) {
  var mv = C.legalMoves(st);
  if (d === 1) return mv.length;
  var n = 0;
  for (var i = 0; i < mv.length; i++) n += perft(C.makeMove(st, mv[i]), d - 1);
  return n;
}

var EXPECT = [20, 400, 8902, 197281];
var pass = true;
for (var d = 1; d <= 4; d++) {
  var t = Date.now();
  var got = perft(C.newGame(), d);
  var ok = got === EXPECT[d - 1];
  if (!ok) pass = false;
  console.log('depth ' + d + '  got ' + got + '  expect ' + EXPECT[d - 1] + '  ' + (ok ? 'PASS' : 'FAIL') + '  ' + (Date.now() - t) + 'ms');
}
process.exit(pass ? 0 : 1);
