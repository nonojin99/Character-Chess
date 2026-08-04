/* logic/match.js — 1 vs 1 매치 프로토콜. DOM 참조 0, 전송 수단에 의존하지 않는다.
   전송체는 {send(obj), close(), onMessage} 만 만족하면 된다 → Supabase든 WebSocket이든 갈아끼운다.

   원칙: 상대가 보낸 수를 그대로 믿지 않는다. 항상 내 쪽 legalMoves 안에서 다시 찾고,
   적용 후 국면 키까지 대조한다. 하나라도 어긋나면 진행을 멈춘다. */
(function (root) {
  'use strict';
  var C = root.Chess;
  var PROTO = 1;

  function pick(list, mv) {
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (m.from === mv.from && m.to === mv.to && (m.promo || null) === (mv.promo || null)) return m;
    }
    return null;
  }

  function create(cfg) {
    var tr = cfg.transport;
    var emit = cfg.onEvent || function () {};
    var M = {
      role: cfg.role,
      code: cfg.code || '',
      side: cfg.role === 'host' ? 'w' : 'b',
      deck: cfg.deck || 'oath',
      peerDeck: null,
      peerSeen: false,
      ply: 0,
      state: C.newGame(),
      error: null,
      over: false
    };

    function fail(why) {
      if (M.error) return;
      M.error = why; M.over = true;
      emit({ t: 'error', why: why });
    }

    function onMessage(msg) {
      if (M.over || !msg || typeof msg !== 'object') return;
      if (msg.t === 'hello') {
        if (msg.v !== PROTO) return fail('프로토콜 버전이 다릅니다 (' + msg.v + ' \u2260 ' + PROTO + ')');
        if (msg.side === M.side) return fail('같은 진영끼리는 붙을 수 없습니다');
        M.peerDeck = msg.deck;
        M.peerSeen = true;
        emit({ t: 'ready', peerDeck: msg.deck, side: M.side });
        return;
      }
      if (msg.t === 'move') {
        if (msg.ply !== M.ply + 1) return fail('수 번호가 어긋났습니다 (' + msg.ply + ' \u2260 ' + (M.ply + 1) + ')');
        if (M.state.turn === M.side) return fail('내 차례에 상대 수가 도착했습니다');
        var found = pick(C.legalMoves(M.state), msg);
        if (!found) return fail('받은 수가 규칙에 맞지 않습니다');
        M.state = C.makeMove(M.state, found);
        M.ply++;
        if (msg.key && msg.key !== C.key(M.state)) return fail('국면이 갈렸습니다 (동기화 실패)');
        emit({ t: 'move', move: found, ply: M.ply });
        return;
      }
      if (msg.t === 'resign') { M.over = true; emit({ t: 'resign', side: msg.side }); return; }
    }

    tr.onMessage = onMessage;

    M.start = function () { tr.send({ t: 'hello', v: PROTO, side: M.side, deck: M.deck }); };

    M.localMove = function (mv) {
      if (M.over) return { ok: false, why: 'over' };
      if (M.state.turn !== M.side) return { ok: false, why: 'not-my-turn' };
      var found = pick(C.legalMoves(M.state), mv);
      if (!found) return { ok: false, why: 'illegal' };
      M.state = C.makeMove(M.state, found);
      M.ply++;
      tr.send({ t: 'move', ply: M.ply, from: found.from, to: found.to, promo: found.promo || null, key: C.key(M.state) });
      return { ok: true, move: found };
    };

    M.resign = function () { M.over = true; tr.send({ t: 'resign', side: M.side }); };
    M.close = function () { if (tr.close) tr.close(); };
    M._deliver = onMessage;
    return M;
  }

  function loopback(drop) {
    var qa = [], qb = [];
    var a = { onMessage: null, send: function (o) { qb.push(JSON.parse(JSON.stringify(o))); }, close: function () {} };
    var b = { onMessage: null, send: function (o) { qa.push(JSON.parse(JSON.stringify(o))); }, close: function () {} };
    return {
      a: a, b: b,
      inject: function (to, obj) { (to === 'a' ? qa : qb).push(obj); },
      flush: function () {
        var guard = 0;
        while ((qa.length || qb.length) && ++guard < 500) {
          if (qa.length) a.onMessage(qa.shift());
          if (qb.length) b.onMessage(qb.shift());
        }
        return guard;
      }
    };
  }

  root.Match = { create: create, loopback: loopback, PROTO: PROTO };
})(typeof globalThis !== 'undefined' ? globalThis : this);
