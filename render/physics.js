/* render/physics.js — 체스말 경량 물리.
   턴제라 전 칸 강체 시뮬레이션은 하지 않는다.
   이동 관성·타격 충격량·잔해 질량만 말 종류별로 다르게 준다. */
(function (root) {
  'use strict';

  /* 상대 질량 (폰=1). 스타운턴 체감 + 마법사 체스 연출용 과장. */
  var MASS = { P: 1.0, N: 2.2, B: 2.0, R: 3.5, Q: 4.2, K: 5.0 };

  /* 공기저항 계수 — 클수록 빠리 감속 (가벼운 말일수록 큼) */
  var DRAG = { P: 1.4, N: 1.0, B: 1.1, R: 0.7, Q: 0.65, K: 0.55 };

  /* 탄성 계수 (0=완전비탄성, 1=완전탄성) */
  var REST = { P: 0.22, N: 0.35, B: 0.28, R: 0.18, Q: 0.25, K: 0.12 };

  /* 접지 마찰 */
  var FRIC = { P: 0.62, N: 0.50, B: 0.55, R: 0.72, Q: 0.58, K: 0.80 };

  var G = 2400;           // px/s^2
  var CELL_REF = 80;

  function massOf(code) {
    var t = (code && code[1]) || 'P';
    return MASS[t] || 1;
  }
  function dragOf(code) { return DRAG[(code && code[1]) || 'P'] || 1; }
  function restOf(code) { return REST[(code && code[1]) || 'P'] || 0.25; }
  function fricOf(code) { return FRIC[(code && code[1]) || 'P'] || 0.55; }

  function moveDuration(baseDur, code, motionKey) {
    var m = massOf(code);
    var inertia = 0.85 + Math.sqrt(m) * 0.12;
    if (motionKey === 'dash') inertia = 0.90 + Math.sqrt(m) * 0.05;
    if (motionKey === 'hop') inertia = 0.88 + Math.sqrt(m) * 0.08;
    if (motionKey === 'glide') inertia = 0.92 + Math.sqrt(m) * 0.04;
    return baseDur * inertia;
  }

  function moveArc(baseArc, code) {
    var m = massOf(code);
    return baseArc * (1.15 / Math.sqrt(m));
  }

  function impactImpulse(attackerCode, defenderCode, cell, distCells) {
    var ma = massOf(attackerCode);
    var md = massOf(defenderCode);
    var v = (distCells || 1) * cell * 2.8;
    var j = ma * v * 0.018;
    var kick = j / Math.max(0.6, md);
    return {
      push: Math.min(2.4, 0.35 + kick * 0.08),
      hitstop: Math.min(0.16, 0.04 + ma * 0.018),
      shake: Math.min(0.22, cell * 0.0015 * (ma + md * 0.4)),
      energy: 0.5 * ma * v * v
    };
  }

  function landDust(code, cell, arc) {
    var m = massOf(code);
    var vLand = Math.sqrt(2 * G * Math.max(0, arc * cell));
    return Math.min(1.4, 0.25 + m * 0.12 + vLand * 0.0004);
  }

  function fragmentVelocity(rng, size, push, code, ox, oy) {
    var m = massOf(code);
    var inv = 1 / Math.sqrt(m);
    var a = rng() * Math.PI * 2;
    var speed = size * (0.45 + rng() * 1.6) * inv;
    return {
      vx: Math.cos(a) * speed + push * size * (0.7 + inv * 0.5),
      vy: -Math.abs(Math.sin(a)) * size * (0.7 + rng() * 1.3) * inv - size * 0.35 * inv,
      vrot: (rng() - 0.5) * (7 + 4 * inv),
      mass: m * (0.04 + rng() * 0.08),
      rest: restOf(code) * (0.7 + rng() * 0.5),
      fric: fricOf(code) * (0.85 + rng() * 0.3)
    };
  }

  function stepFragment(d, dt) {
    d.vy += G * dt;
    var drag = 0.15 / Math.max(0.05, d.mass);
    d.vx *= Math.max(0, 1 - drag * dt);
    d.vy *= Math.max(0, 1 - drag * dt * 0.5);
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.rot += d.vrot * dt;
    if (d.y >= d.ground && d.vy > 0) {
      d.y = d.ground;
      d.vy = -d.vy * d.rest;
      d.vx *= d.fric;
      d.vrot *= d.fric;
      return Math.abs(d.vy) < 35;
    }
    return false;
  }

  root.Physics = {
    MASS: MASS, G: G,
    massOf: massOf, dragOf: dragOf, restOf: restOf, fricOf: fricOf,
    moveDuration: moveDuration, moveArc: moveArc,
    impactImpulse: impactImpulse, landDust: landDust,
    fragmentVelocity: fragmentVelocity, stepFragment: stepFragment
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
