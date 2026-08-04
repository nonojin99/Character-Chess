/* logic/pgn.js — SAN 표기와 PGN 입출력. DOM 참조 0.
   서버 없이 기보를 남기려면 파일로 내보내는 수밖에 없다. localStorage는 쓰지 않는다. */
(function (root) {
  'use strict';
  var C = root.Chess;
  var FILES = 'abcdefgh';

  function san(st, mv) {
    if (mv.castle === 'K') return decorate(st, mv, 'O-O');
    if (mv.castle === 'Q') return decorate(st, mv, 'O-O-O');
    var t = mv.piece[1], s = '';
    if (t === 'P') {
      if (mv.captured) s += FILES[mv.from & 7] + 'x';
      s += C.sqName(mv.to);
      if (mv.promo) s += '=' + mv.promo;
    } else {
      s += t;
      var all = C.legalMoves(st), same = [], i;
      for (i = 0; i < all.length; i++) {
        var m = all[i];
        if (m.piece === mv.piece && m.to === mv.to && m.from !== mv.from) same.push(m);
      }
      if (same.length) {
        var fileClash = false, rankClash = false;
        for (i = 0; i < same.length; i++) {
          if ((same[i].from & 7) === (mv.from & 7)) fileClash = true;
          if ((same[i].from >> 3) === (mv.from >> 3)) rankClash = true;
        }
        if (!fileClash) s += FILES[mv.from & 7];
        else if (!rankClash) s += String(8 - (mv.from >> 3));
        else s += C.sqName(mv.from);
      }
      if (mv.captured) s += 'x';
      s += C.sqName(mv.to);
    }
    return decorate(st, mv, s);
  }

  function decorate(st, mv, s) {
    var ns = C.makeMove(st, mv);
    if (!C.inCheck(ns)) return s;
    return s + (C.legalMoves(ns).length ? '+' : '#');
  }

  function resultOf(st) {
    var t = C.status(st);
    if (!t.over) return '*';
    if (t.result === 'draw') return '1/2-1/2';
    return t.result === 'w' ? '1-0' : '0-1';
  }

  function toPGN(moves, meta) {
    meta = meta || {};
    var st = C.newGame(), body = [], i;
    for (i = 0; i < moves.length; i++) {
      if (i % 2 === 0) body.push(st.full + '.');
      body.push(san(st, moves[i]));
      st = C.makeMove(st, moves[i]);
    }
    var res = resultOf(st);
    body.push(res);
    var d = meta.date || '????.??.??';
    var head = [
      '[Event "' + (meta.event || '캐릭터 체스') + '"]',
      '[Site "' + (meta.site || 'local') + '"]',
      '[Date "' + d + '"]',
      '[Round "-"]',
      '[White "' + (meta.white || 'White') + '"]',
      '[Black "' + (meta.black || 'Black') + '"]',
      '[Result "' + res + '"]'
    ].join('\n');
    var line = '', out = [];
    for (i = 0; i < body.length; i++) {
      if (line.length + body[i].length + 1 > 78) { out.push(line); line = ''; }
      line += (line ? ' ' : '') + body[i];
    }
    if (line) out.push(line);
    return head + '\n\n' + out.join('\n') + '\n';
  }

  function fromPGN(text) {
    var body = String(text)
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\{[^}]*\}/g, ' ')
      .replace(/;[^\n]*/g, ' ')
      .replace(/\$\d+/g, ' ')
      .replace(/\([^()]*\)/g, ' ');
    var toks = body.split(/\s+/).filter(Boolean);
    var st = C.newGame(), moves = [], i, j;
    for (i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (/^\d+\.*$/.test(t)) continue;
      if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t)) break;
      var want = t.replace(/[!?]+$/, '');
      var legal = C.legalMoves(st), found = null;
      for (j = 0; j < legal.length; j++) if (san(st, legal[j]) === want) { found = legal[j]; break; }
      if (!found) {
        var bare = want.replace(/[+#]/g, '');
        for (j = 0; j < legal.length; j++) {
          if (san(st, legal[j]).replace(/[+#]/g, '') === bare) { found = legal[j]; break; }
        }
      }
      if (!found) throw new Error((moves.length + 1) + '번째 수 "' + t + '"를 해석하지 못했습니다');
      moves.push(found);
      st = C.makeMove(st, found);
    }
    return moves;
  }

  root.PGN = { san: san, toPGN: toPGN, fromPGN: fromPGN, resultOf: resultOf };
})(typeof globalThis !== 'undefined' ? globalThis : this);
