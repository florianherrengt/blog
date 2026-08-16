'use strict';

const TAU = Math.PI * 2;

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const tcv = document.createElement('canvas');
const tctx = tcv.getContext('2d');
const bcv = document.createElement('canvas');
const bctx = bcv.getContext('2d');

const DPR = Math.min(window.devicePixelRatio || 1, 1.75);
let W = 0, H = 0, U = 100, CX = 0, CY = 0, F = 1;

const steel = (a) => 'rgba(152,173,202,' + a + ')';
const brass = (a) => 'rgba(221,172,92,' + a + ')';
const ccy = (a) => 'rgba(96,228,255,' + a + ')';
const cgo = (a) => 'rgba(255,198,108,' + a + ')';
const cma = (a) => 'rgba(255,110,182,' + a + ')';

function sprite(size, stops) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const s of stops) gr.addColorStop(s[0], s[1]);
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}

const SP = {
  cyan: sprite(64, [[0, 'rgba(214,250,255,0.9)'], [0.22, 'rgba(120,233,255,0.55)'], [0.55, 'rgba(52,172,255,0.14)'], [1, 'rgba(52,172,255,0)']]),
  gold: sprite(64, [[0, 'rgba(255,242,214,0.95)'], [0.22, 'rgba(255,204,116,0.55)'], [0.55, 'rgba(255,168,58,0.14)'], [1, 'rgba(255,168,58,0)']]),
  mag: sprite(64, [[0, 'rgba(255,226,242,0.9)'], [0.26, 'rgba(255,112,186,0.45)'], [1, 'rgba(255,60,160,0)']]),
  dim: sprite(64, [[0, 'rgba(164,188,218,0.45)'], [0.5, 'rgba(120,150,190,0.08)'], [1, 'rgba(120,150,190,0)']]),
};

function glow(g, img, x, y, s, a) {
  if (a <= 0.004 || s <= 0.03) return;
  g.globalAlpha = a > 1 ? 1 : a;
  g.drawImage(img, x - s * 0.5, y - s * 0.5, s, s);
  g.globalAlpha = 1;
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rnd = (a, b) => a + Math.random() * (b - a);
function nAng(a) {
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  return a;
}

let t = 0, last = 0, theta = 0;
const BEAT = 4.6;
let beatT = BEAT - 0.35, beatCount = 0;
let flame = 0.5, ingest = 0, flare = 0, wash = 0, shake = 0, rotR = 0;
let grandCd = 0;

const ptr = { x: -9999, y: -9999, down: false, vx: 0, vy: 0, sx: 0, sy: 0, st: 0, seen: false, wake: 0 };

const lamp = document.getElementById('lamp');
let lampAcc = 0;

let pulses = [];
let pkts = [];
let parts = [];
let ripples = [];
let shocks = [];
let pending = [];
const PMAX = 430;

function fireArrivalFx(m, col) {
  ripples.push({ x: m.x, y: m.y, r: m.rm * 0.1, vr: 120 * F, life: 0.9, col, lw: 1.5 });
}

function pushRipple(x, y, col, vr, life) {
  ripples.push({ x, y, r: 3 * F, vr: vr * F, life, col, lw: 1.5 });
}

function coreSuck(p) {
  ingest = Math.min(1, ingest + 0.05);
  flame = Math.min(1.4, flame + 0.014);
  rotR += 0.03;
  if (Math.random() < 0.2) {
    const a = Math.random() * TAU;
    spawnSpark(CX + Math.cos(a) * RC * U * 0.9, CY + Math.sin(a) * RC * U * 0.9, a + Math.PI, rnd(30, 80) * F, 'gold', 0.7);
  }
}

function spawnMote(x, y, ang, sp, col, s) {
  if (parts.length >= PMAX) return;
  parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: rnd(6, 11), col, s: s * rnd(0.7, 1.3), ball: false });
}

function spawnSpark(x, y, ang, sp, col, s) {
  if (parts.length >= PMAX) return;
  parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: rnd(0.5, 1.3), col, s: s * rnd(0.6, 1.2), ball: true });
}

const RC = 0.3;
const TYPES = ['gear', 'pend', 'piston', 'orbit', 'wave', 'arm', 'caliper', 'dynamo'];
const NRN = [0.705, 0.755, 0.72, 0.76, 0.705, 0.755, 0.72, 0.76];
let mods = [];

function initSt(ty) {
  switch (ty) {
    case 'gear': return { ra: rnd(0, TAU), rb: rnd(0, TAU) };
    case 'pend': return { ph: rnd(0, TAU), trail: [] };
    case 'piston': return { w: rnd(0, TAU) };
    case 'orbit': return { w1: 0, w2: rnd(0, TAU), w3: 0, o3: 0 };
    case 'wave': return {};
    case 'arm': return { trail: [] };
    case 'caliper': return { w: rnd(0, TAU) };
    case 'dynamo': return { w: rnd(0, TAU), bolts: [], bt: rnd(0, 0.2) };
  }
}

function makeMods() {
  mods = TYPES.map((ty, i) => ({
    i, ty, a0: i * (TAU / 8), rn: NRN[i], ph: i * 0.83,
    e: 0, flash: 0, acc: Math.random() * 0.5, hrot: rnd(0, TAU),
    x: 0, y: 0, a: 0, rm: 0, path: null, pull: { x: 0, y: 0 }, st: initSt(ty),
  }));
}

function scheduleAt(delay, fn) {
  pending.push({ at: t + delay, fn });
}

let ringR = 0;

function updateConduit(m) {
  const a = theta + m.a0;
  const rm = m.rn * U * (1 + 0.016 * Math.sin((t / BEAT) * TAU + m.ph));
  const c = Math.cos(a), s = Math.sin(a);
  const mx = CX + c * rm, my = CY + s * rm;
  const R = 0.155 * U;
  const s0 = RC * U * 0.985;
  const x0 = CX + c * s0, y0 = CY + s * s0;
  const x1 = mx - c * R * 0.95, y1 = my - s * R * 0.95;
  const bx = (x0 + x1) / 2, by = (y0 + y1) / 2;
  const na = a + 0.55;
  const bow = 0.1 * U;
  const bx2 = bx + Math.cos(na) * bow;
  const by2 = by + Math.sin(na) * bow;
  const pcx = bx2 + m.pull.x;
  const pcy = by2 + m.pull.y;
  m.path = { x0, y0, pcx, pcy, x1, y1, bx: bx2, by: by2 };
  m.x = mx; m.y = my; m.a = a; m.rm = rm;
}

function pathAt(p, tt) {
  const u = 1 - tt;
  return {
    x: u * u * p.x0 + 2 * u * tt * p.pcx + tt * tt * p.x1,
    y: u * u * p.y0 + 2 * u * tt * p.pcy + tt * tt * p.y1,
  };
}

function emit(mi, str, col) {
  flame = Math.min(1.35, flame + 0.22 * str);
  pulses.push({ mi, tt: 0, dir: 1, col, s: 0.8 + 0.5 * str });
  pulses.push({ mi, tt: -0.17, dir: 1, col, s: 0.5 + 0.4 * str });
  if (str > 0.85) pulses.push({ mi, tt: -0.34, dir: 1, col, s: 0.42 });
}

function launchPacket(from, to) {
  if (from === to || pkts.length > 26) return;
  const fa = mods[from].a, ta = mods[to].a;
  const d = nAng(ta - fa);
  if (Math.abs(d) < 0.18) return;
  const dir = d > 0 ? 1 : -1;
  pkts.push({ ang: fa + dir * 0.1, stop: ta, dir, sp: Math.abs(d) / 1.25 });
}

function mFire(m, v, col) {
  m.e = Math.min(1, m.e + v);
  m.flash = 1;
  const n = Math.floor(5 + 15 * v * rnd(0.5, 1.2));
  for (let i = 0; i < n; i++) {
    spawnSpark(m.x, m.y, rnd(0, TAU), rnd(28, 130) * F * (0.5 + m.e), col === 'gold' && Math.random() < 0.7 ? 'gold' : col === 'gold' ? 'cyan' : col, 0.8 + 1.3 * m.e);
  }
  pushRipple(m.x, m.y, col, 110, 0.8);
  if (v >= 0.85) {
    pulses.push({ mi: m.i, tt: 0.99, dir: -1, col: 'gold', s: 1.2 });
    for (let k = 0; k < 2; k++) {
      const delta = (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2));
      launchPacket(m.i, (m.i + delta + 8) % 8);
    }
  } else if (Math.random() < m.e * 0.55) {
    const delta = (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 3));
    launchPacket(m.i, (m.i + delta + 8) % 8);
  }
}

function grand(big) {
  flare = 1;
  wash = 1;
  shake = big ? 5.5 : 3;
  shocks.push({ r: RC * U * 0.9, vr: 1.5 * U, life: 1, w: 1 });
  shocks.push({ r: RC * U * 0.55, vr: 2.0 * U, life: 1, w: 0.55 });
  for (let i = 0; i < 8; i++) {
    const mi = (Math.floor(beatCount) + i) % 8;
    scheduleAt(0.12 + i * 0.07, () => mFire(mods[mi], 0.8, 'gold'));
    pulses.push({ mi, tt: -0.06 - i * 0.05, dir: 1, col: 'gold', s: 1.35 });
  }
  for (let i = 0; i < 64; i++) {
    const a = rnd(0, TAU);
    spawnSpark(CX, CY, a, rnd(60, 260) * F, Math.random() < 0.6 ? 'gold' : 'cyan', rnd(0.7, 1.6));
  }
}

function onBeat(b) {
  const c = b % 16;
  if (c === 0) grand(true);
  const mi = c < 8 ? c : 15 - c;
  if (c !== 0) emit(mi, 1, 'cyan');
}

let dust = [];
function makeDust() {
  dust = [];
  for (let i = 0; i < 56; i++) {
    dust.push({ x: rnd(0, W), y: rnd(0, H), vx: rnd(-7, 7), vy: rnd(-7, 7), a: rnd(0.04, 0.13), s: rnd(0.7, 1.8) });
  }
}

function clickCharge(x, y) {
  shake = Math.max(shake, 1.6);
  pushRipple(x, y, 'mag', 170, 0.7);
  for (let i = 0; i < 8; i++) spawnSpark(x, y, rnd(0, TAU), rnd(40, 150) * F, 'mag', 1);
  let best = null, bd = 0.32 * U;
  for (const m of mods) {
    const d = Math.hypot(m.x - x, m.y - y);
    if (d < bd) { bd = d; best = m; }
  }
  if (best) {
    mFire(best, 1, 'gold');
    pulses.push({ mi: best.i, tt: 0.97, dir: -1, col: 'gold', s: 1.3 });
    pulses.push({ mi: best.i, tt: 0.9, dir: -1, col: 'gold', s: 0.8 });
    ripples.push({ x: best.x, y: best.y, r: 8 * F, vr: 240 * F, life: 1, col: 'gold', lw: 2 });
    return;
  }
  if (Math.hypot(CX - x, CY - y) < U) {
    flame = 1.4;
    ingest = Math.min(1, ingest + 0.4);
    shocks.push({ r: RC * U * 0.8, vr: 1.3 * U, life: 0.8, w: 0.8 });
    for (let i = 0; i < 24; i++) spawnSpark(CX, CY, rnd(0, TAU), rnd(80, 300) * F, Math.random() < 0.5 ? 'gold' : 'cyan', rnd(0.8, 1.8));
    for (const m of mods) m.e = Math.min(1, m.e + 0.22);
    return;
  }
  for (const p of parts) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < 0.3 * U && d > 1) {
      const k = (1 - d / (0.3 * U)) * 260 * F * 0.02;
      p.vx += ((p.x - x) / d) * k / 0.016;
      p.vy += ((p.y - y) / d) * k / 0.016;
    }
  }
}

function update(dt) {
  theta += dt * 0.04;
  flame *= Math.exp(-0.85 * dt);
  ingest *= Math.exp(-1.5 * dt);
  flare *= Math.exp(-1.1 * dt);
  wash *= Math.exp(-1.2 * dt);
  shake *= Math.exp(-3.4 * dt);
  grandCd = Math.max(0, grandCd - dt);
  rotR += dt * (1.1 + 5 * flame + 3 * flare);

  if (pending.length) {
    pending.sort((a, b) => a.at - b.at);
    while (pending.length && pending[0].at <= t) pending.shift().fn();
  }

  beatT += dt;
  while (beatT >= BEAT) {
    beatT -= BEAT;
    beatCount++;
    onBeat(beatCount);
  }

  let ringSum = 0;
  for (const m of mods) {
    updateConduit(m);
    ringSum += m.rm;
  }
  ringR = ringSum / mods.length;

  for (const m of mods) {
    m.e = Math.max(0, m.e * Math.exp(-0.55 * dt));
    m.flash *= Math.exp(-2.6 * dt);
    m.hrot += dt * (0.1 + 0.7 * m.e);
    const sp = 1 + 2.4 * m.e;
    const s = m.st;
    if (m.ty === 'gear') { s.ra += dt * 0.55 * sp; s.rb -= dt * 0.55 * sp * 1.48; }
    else if (m.ty === 'pend') {
      s.ph += dt * 2.25 * (1 + 0.3 * m.e);
      const amp = 0.3 + 0.62 * m.e;
      const ang = amp * Math.sin(s.ph);
      const L = 0.98 * U * 0.155;
      s.trail.unshift({ x: Math.sin(ang) * L, y: Math.cos(ang) * L });
      if (s.trail.length > 16) s.trail.length = 16;
    } else if (m.ty === 'piston') s.w += dt * 1.05 * sp;
    else if (m.ty === 'orbit') { s.w1 += dt * 0.5 * sp; s.w2 -= dt * 0.85 * (1 + 1.7 * m.e); if (m.e > 0.45) s.w3 -= dt * 1.4; s.o3 += dt * (m.e > 0.45 ? 1.1 : 0.15); }
    else if (m.ty === 'arm') {
      const tip = armTip(m, U * 0.155);
      s.trail.unshift(tip);
      if (s.trail.length > 18) s.trail.length = 18;
    } else if (m.ty === 'caliper') s.w += dt * 0.65 * sp;
    else if (m.ty === 'dynamo') {
      s.w += dt * 0.9 * sp;
      s.bt -= dt;
      if (s.bt <= 0 && m.e > 0.42) {
        s.bt = rnd(0.1, 0.3);
        const pts = [];
        let a = rnd(0, TAU), r = 0;
        pts.push({ x: 0, y: 0 });
        for (let k = 0; k < 6; k++) {
          r = (U * 0.155) * 0.62 * ((k + 1) / 6);
          a += rnd(-0.5, 0.5);
          pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
        }
        s.bolts.push({ pts, age: 0 });
        if (s.bolts.length > 3) s.bolts.shift();
      }
      for (const b of s.bolts) b.age += dt;
      s.bolts = s.bolts.filter((b) => b.age < 0.16);
    }
    if (m.e > 0.05) {
      m.acc += dt * 3.0 * m.e;
      while (m.acc > 1) {
        m.acc -= 1;
        const a = m.a + Math.PI + rnd(-1.3, 1.3);
        spawnMote(m.x - Math.cos(m.a) * 0.1 * U * rnd(0, 0.7), m.y - Math.sin(m.a) * 0.1 * U * rnd(0, 0.7), a, rnd(25, 85) * F, m.e > 0.7 && Math.random() < 0.45 ? 'gold' : 'cyan', 0.9 + 1.1 * m.e);
      }
    }
    if (ptr.down && ptr.seen) {
      const dx = ptr.x - m.path.bx, dy = ptr.y - m.path.by;
      const d = Math.hypot(dx, dy);
      const tr = 0.45 * U;
      if (d < tr) {
        const k = (1 - d / tr) * 0.5;
        const tx = (dx / (d || 1)) * Math.min(d, tr) * k;
        const ty2 = (dy / (d || 1)) * Math.min(d, tr) * k;
        m.pull.x += (tx - m.pull.x) * Math.min(1, dt * 7);
        m.pull.y += (ty2 - m.pull.y) * Math.min(1, dt * 7);
      } else {
        m.pull.x *= Math.exp(-2.8 * dt);
        m.pull.y *= Math.exp(-2.8 * dt);
      }
    } else {
      m.pull.x *= Math.exp(-2.8 * dt);
      m.pull.y *= Math.exp(-2.8 * dt);
    }
    if (s.trail && m.ty !== 'pend' && m.ty !== 'arm') s.trail.length = 0;
  }

  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = pulses[i];
    if (p.tt < 0) { p.tt += dt / 1.15 * p.dir; if (p.tt >= -0.02) p.tt = 0; continue; }
    p.tt += (dt / 1.15) * p.dir;
    const m = mods[p.mi];
    if (p.dir === 1 && p.tt >= 1) {
      pulses.splice(i, 1);
      mFire(m, 0.8, p.col);
      fireArrivalFx(m, p.col);
    } else if (p.dir === -1 && p.tt <= 0) {
      pulses.splice(i, 1);
      flame = Math.min(1.5, flame + 0.5 * (0.6 + p.s * 0.4));
      ingest = Math.min(1, ingest + 0.25);
      pushRipple(CX, CY, p.col, 190, 0.8);
      ripples.push({ x: CX, y: CY, r: RC * U, vr: 160 * F, life: 0.7, col: 'gold', lw: 2 });
    }
  }

  for (let i = pkts.length - 1; i >= 0; i--) {
    const p = pkts[i];
    const prev = p.ang;
    p.ang += p.dir * p.sp * dt;
    const crossed = p.dir > 0 ? prev < p.stop && p.ang >= p.stop : prev > p.stop && p.ang <= p.stop;
    if (crossed || dt > 4) {
      pkts.splice(i, 1);
      let target = null;
      for (const m of mods) {
        const d = Math.abs(nAng(m.a - p.stop));
        if (d < 0.28) { target = m; break; }
      }
      if (target) {
        mFire(target, 0.45, 'cyan');
        fireArrivalFx(target, 'cyan');
      }
    }
  }

  const wdep = Math.exp(-1.15 * dt);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    const dx = p.x - CX, dy = p.y - CY;
    const d = Math.hypot(dx, dy) || 1;
    if (!p.ball) {
      if (d < RC * U * 0.9) {
        coreSuck(p);
        parts.splice(i, 1);
        continue;
      }
      const am = (44 * F) / (0.3 + d / U);
      p.vx += (-dx / d) * am * dt;
      p.vy += (-dy / d) * am * dt;
      const w0 = 0.5 / (0.45 + d / U);
      const ta = w0 * U * 0.22;
      p.vx += (-dy / d) * ta * dt;
      p.vy += (dx / d) * ta * dt;
    } else {
      p.vx *= Math.exp(-2.4 * dt);
      p.vy *= Math.exp(-2.4 * dt);
    }
    if (ptr.down && ptr.seen) {
      const px = p.x - ptr.x, py = p.y - ptr.y;
      const pd = Math.hypot(px, py);
      if (pd < 0.24 * U && pd > 1) {
        const k = 1 - pd / (0.24 * U);
        const A = 240 * F * k * dt;
        p.vx += (-px / pd) * A + (-py / pd) * A * 1.9;
        p.vy += (-py / pd) * A + (px / pd) * A * 1.9;
      }
    }
    p.vx *= wdep;
    p.vy *= wdep;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life <= 0 || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) parts.splice(i, 1);
  }

  const coreAcc = dt * (1.2 * Math.max(0, flame - 0.15) + 0.8 * flare);
  if (coreAcc > 0) {
    const n = Math.floor(coreAcc);
    for (let k = 0; k < n; k++) {
      const a = rnd(0, TAU);
      spawnMote(CX + Math.cos(a) * RC * U * 0.9, CY + Math.sin(a) * RC * U * 0.9, a + rnd(-0.6, 0.6) + Math.PI, rnd(20, 60) * F, Math.random() < 0.5 ? 'gold' : 'cyan', 0.8);
    }
  }

  for (const d of dust) {
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.vx += rnd(-8, 8) * dt;
    d.vy += rnd(-8, 8) * dt;
    d.vx = clamp(d.vx, -10, 10);
    d.vy = clamp(d.vy, -10, 10);
    if (ptr.seen) {
      const dx = d.x - ptr.x, dy = d.y - ptr.y;
      const dd = Math.hypot(dx, dy);
      if (dd < 130 && dd > 1) {
        const k = (1 - dd / 130) * 26 * dt;
        d.vx += (dx / dd) * k;
        d.vy += (dy / dd) * k;
      }
    }
    if (d.x < -30) d.x = W + 30;
    if (d.x > W + 30) d.x = -30;
    if (d.y < -30) d.y = H + 30;
    if (d.y > H + 30) d.y = -30;
  }

  if (ptr.seen) {
    const spd = Math.hypot(ptr.vx, ptr.vy);
    ptr.wake += dt * (ptr.down ? 3 : 0) + (spd > 320 ? dt * Math.min(8, spd * 0.006) : 0);
    while (ptr.wake > 1) {
      ptr.wake -= 1;
      spawnSpark(ptr.x + rnd(-5, 5), ptr.y + rnd(-5, 5), rnd(0, TAU), rnd(10, 45) * F, ptr.down ? 'mag' : 'dim', 0.7);
    }
    ptr.vx *= Math.exp(-6 * dt);
    ptr.vy *= Math.exp(-6 * dt);
  }

  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.r += r.vr * dt;
    r.life -= dt * 1.5;
    if (r.life <= 0) ripples.splice(i, 1);
  }
  for (let i = shocks.length - 1; i >= 0; i--) {
    const s = shocks[i];
    s.r += s.vr * dt;
    s.life -= dt * 1.1;
    if (s.life <= 0) shocks.splice(i, 1);
  }
}

function armTip(m, R) {
  const e = m.e;
  const sh = { x: 0, y: 0.5 * R };
  const a1 = -2.2 + (0.55 + 0.5 * e) * Math.sin(t * 0.83 + m.ph);
  const el = { x: sh.x + Math.cos(a1) * 0.58 * R, y: sh.y + Math.sin(a1) * 0.58 * R };
  const a2 = -0.6 + (0.35 + 0.95 * e) * Math.sin(t * 1.31 + m.ph * 2);
  return { x: el.x + Math.cos(a2) * 0.46 * R, y: el.y + Math.sin(a2) * 0.46 * R, el, a1, a2, sh };
}

function drawGear(g, x, y, r, teeth, rot, ah, al) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.beginPath();
  const step = TAU / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const a1 = a, a2 = a + step * 0.3, a3 = a + step * 0.5, a4 = a + step * 0.8;
    const r2 = r * (1 + ah);
    g.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    g.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
    g.lineTo(Math.cos(a3) * r2, Math.sin(a3) * r2);
    g.lineTo(Math.cos(a4) * r, Math.sin(a4) * r);
  }
  g.closePath();
  g.lineWidth = 1.3;
  g.strokeStyle = al;
  g.stroke();
  g.beginPath();
  g.arc(0, 0, r * 0.8, 0, TAU);
  g.stroke();
  g.beginPath();
  g.arc(0, 0, r * 0.14, 0, TAU);
  g.fillStyle = al;
  g.fill();
  g.restore();
}

const MECHS = {
  gear(g, R, m) {
    const s = m.st;
    const al = steel(0.5 + 0.4 * m.e);
    drawGear(g, -0.2 * R, 0, 0.4 * R, 11, s.ra, 0.16, al);
    drawGear(g, 0.143 * R, 0.185 * R, 0.27 * R, 8, s.rb, 0.2, al);
    if (m.e > 0.55) glow(g, SP.gold, -0.03 * R, 0.03 * R, 14 * F, (m.e - 0.55) * 1.4 * (0.6 + 0.4 * m.flash));
    glow(g, SP.cyan, 0, 0, 16 * F, 0.12 * m.e + 0.05 * m.flash);
  },
  pend(g, R, m) {
    const s = m.st;
    const amp = 0.3 + 0.62 * m.e;
    const ang = amp * Math.sin(s.ph);
    const L = 0.98 * R;
    const pv = { x: 0, y: -0.62 * R };
    g.strokeStyle = steel(0.16);
    g.lineWidth = 1;
    g.beginPath();
    g.arc(pv.x, pv.y, L * 1.08, -Math.PI / 2 - 1.5, -Math.PI / 2 + 1.5);
    g.stroke();
    const bx = pv.x + Math.sin(ang) * L, by = pv.y + Math.cos(ang) * L;
    g.beginPath();
    for (let i = s.trail.length - 1; i > 0; i--) {
      const p0 = s.trail[i], q = s.trail[i - 1];
      const a = (1 - i / s.trail.length) * (0.15 + 0.45 * m.e);
      g.strokeStyle = m.e > 0.5 ? cgo(a) : ccy(a);
      g.lineWidth = 1.4 * (1 - i / s.trail.length) + 0.3;
      g.beginPath();
      g.moveTo(pv.x + p0.x, pv.y + p0.y);
      g.lineTo(pv.x + q.x, pv.y + q.y);
      g.stroke();
    }
    g.strokeStyle = steel(0.7);
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(pv.x, pv.y);
    g.lineTo(bx, by);
    g.stroke();
    g.fillStyle = steel(0.75);
    g.beginPath();
    g.arc(pv.x, pv.y, 2.2 * F, 0, TAU);
    g.fill();
    glow(g, m.e > 0.5 ? SP.gold : SP.cyan, bx, by, (10 + 10 * m.e) * F, 0.35 + 0.5 * m.e);
    g.fillStyle = m.e > 0.5 ? cgo(0.8) : ccy(0.6);
    g.beginPath();
    g.arc(bx, by, R * 0.12, 0, TAU);
    g.fill();
    g.beginPath();
    g.arc(bx, by, R * 0.05, 0, TAU);
    g.fillStyle = steel(0.9);
    g.fill();
  },
  piston(g, R, m) {
    const s = m.st;
    const cx0 = 0, cy0 = 0.55 * R;
    g.strokeStyle = steel(0.35);
    g.lineWidth = 1.2;
    g.beginPath();
    g.arc(cx0, cy0, 0.16 * R, 0, TAU);
    g.stroke();
    const cols = [-0.5 * R, 0, 0.5 * R];
    for (let k = 0; k < 3; k++) {
      const xk = cols[k];
      const wA = s.w + (k * TAU) / 3;
      const pin = { x: cx0 + Math.cos(wA) * 0.1 * R, y: cy0 + Math.sin(wA) * 0.1 * R };
      const yk = -0.56 * R + 0.4 * R * 0.5 * (1 + Math.sin(wA));
      g.strokeStyle = steel(0.4);
      g.lineWidth = 1.1;
      g.strokeRect(xk - 0.13 * R, -0.66 * R, 0.26 * R, 0.58 * R);
      g.strokeStyle = steel(0.75);
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(xk, yk);
      g.lineTo(pin.x, pin.y);
      g.stroke();
      g.fillStyle = m.e > 0.5 ? cgo(0.85) : ccy(0.7);
      g.fillRect(xk - 0.11 * R, yk - 0.05 * R, 0.22 * R, 0.1 * R);
      g.fillStyle = steel(0.8);
      g.beginPath();
      g.arc(pin.x, pin.y, 1.8 * F, 0, TAU);
      g.fill();
    }
    g.strokeStyle = steel(0.8);
    g.lineWidth = 1.6 * F;
    g.beginPath();
    g.arc(cx0, cy0, 0.1 * R, s.w, s.w + 0.9);
    g.stroke();
    glow(g, SP.cyan, cx0, cy0, 14 * F, 0.1 + 0.3 * m.e);
  },
  orbit(g, R, m) {
    const s = m.st;
    g.strokeStyle = steel(0.35);
    g.lineWidth = 1.2;
    for (let k = 0; k < 5; k++) {
      const a0 = s.w1 + (k * TAU) / 5;
      g.beginPath();
      g.arc(0, 0, 0.6 * R, a0, a0 + 0.9);
      g.stroke();
    }
    const orbs = [s.w2, s.w2 + TAU / 3, s.w2 + (TAU * 2) / 3];
    for (const a of orbs) {
      const ox = Math.cos(a) * 0.6 * R, oy = Math.sin(a) * 0.6 * R;
      glow(g, m.e > 0.5 ? SP.gold : SP.cyan, ox, oy, (8 + 8 * m.e) * F, 0.3 + 0.5 * m.e);
      g.fillStyle = m.e > 0.5 ? cgo(0.85) : ccy(0.7);
      g.beginPath();
      g.arc(ox, oy, R * 0.075, 0, TAU);
      g.fill();
    }
    if (m.e > 0.4) {
      const a3 = s.o3;
      const ox = Math.cos(a3) * 0.36 * R, oy = Math.sin(a3) * 0.36 * R;
      const k = Math.min(1, (m.e - 0.4) / 0.4);
      glow(g, SP.mag, ox, oy, 8 * F * k, 0.3 * k);
      g.fillStyle = cma(0.85 * k);
      g.beginPath();
      g.arc(ox, oy, R * 0.05, 0, TAU);
      g.fill();
    }
    g.fillStyle = steel(0.8);
    g.beginPath();
    g.arc(0, 0, 2 * F, 0, TAU);
    g.fill();
    glow(g, SP.dim, 0, 0, 12 * F, 0.1 + 0.25 * m.e);
  },
  wave(g, R, m) {
    const sp = R * 0.26;
    for (let j = 0; j < 5; j++) {
      for (let i = 0; i < 5; i++) {
        const z = Math.sin(t * 2.1 + i * 1.9 + j * 1.1);
        const x = (i - 2) * sp;
        const y = (j - 2) * sp + z * R * 0.075 * (0.35 + 1.1 * m.e);
        const a = (0.2 + 0.8 * Math.abs(z)) * (0.35 + 0.65 * m.e);
        const r = (1.1 + 2.4 * Math.abs(z)) * F * (0.55 + 0.7 * m.e);
        g.fillStyle = m.e > 0.55 ? cgo(a) : ccy(a * 0.9);
        g.beginPath();
        g.arc(x, y, r, 0, TAU);
        g.fill();
      }
    }
    if (m.e > 0.5) glow(g, m.e > 0.7 ? SP.gold : SP.cyan, 0, 0, 30 * F, (m.e - 0.5) * 0.5);
  },
  arm(g, R, m) {
    const s = m.st;
    const tip = armTip(m, R);
    g.lineWidth = 1.2;
    for (let i = s.trail.length - 1; i > 0; i--) {
      const p0 = s.trail[i], q = s.trail[i - 1];
      const a = (1 - i / s.trail.length) * (0.12 + 0.4 * m.e);
      g.strokeStyle = m.e > 0.5 ? cgo(a) : ccy(a);
      g.beginPath();
      g.moveTo(p0.x, p0.y);
      g.lineTo(q.x, q.y);
      g.stroke();
    }
    g.strokeStyle = steel(0.75);
    g.lineWidth = 2 * F;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(tip.sh.x, tip.sh.y);
    g.lineTo(tip.el.x, tip.el.y);
    g.lineTo(tip.x, tip.y);
    g.stroke();
    g.fillStyle = steel(0.8);
    g.beginPath();
    g.arc(tip.sh.x, tip.sh.y, 2.4 * F, 0, TAU);
    g.fill();
    g.beginPath();
    g.arc(tip.el.x, tip.el.y, 1.8 * F, 0, TAU);
    g.fill();
    glow(g, m.e > 0.5 ? SP.gold : SP.cyan, tip.x, tip.y, (9 + 9 * m.e) * F, 0.35 + 0.5 * m.e);
    g.fillStyle = m.e > 0.5 ? cgo(0.85) : ccy(0.75);
    g.beginPath();
    g.arc(tip.x, tip.y, R * 0.06, 0, TAU);
    g.fill();
  },
  caliper(g, R, m) {
    const s = m.st;
    g.save();
    g.rotate(-s.w * 0.6);
    g.strokeStyle = steel(0.32);
    g.lineWidth = 1.2;
    g.beginPath();
    for (let k = 0; k <= 6; k++) {
      const a = (k * TAU) / 6;
      const x = Math.cos(a) * 0.66 * R, y = Math.sin(a) * 0.66 * R;
      if (k === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
    g.restore();
    g.save();
    g.setLineDash([4 * F, 8 * F]);
    g.lineDashOffset = -t * 18 * F;
    g.strokeStyle = ccy(0.14 + 0.2 * m.e);
    g.lineWidth = 1;
    g.beginPath();
    g.arc(0, 0, 0.6 * R, 0, TAU);
    g.stroke();
    g.restore();
    const L = 0.48 * R * (1 + 0.24 * m.e * Math.sin(3 * s.w));
    for (let k = 0; k < 4; k++) {
      const a = s.w + (k * TAU) / 4;
      const c1 = Math.cos(a), s1 = Math.sin(a);
      g.strokeStyle = steel(0.65);
      g.lineWidth = 1.6 * F;
      g.beginPath();
      g.moveTo(c1 * 0.1 * R, s1 * 0.1 * R);
      g.lineTo(c1 * L, s1 * L);
      g.stroke();
      glow(g, m.e > 0.5 ? SP.gold : SP.cyan, c1 * L, s1 * L, (7 + 7 * m.e) * F, 0.3 + 0.6 * m.e);
      g.fillStyle = m.e > 0.5 ? cgo(0.8) : ccy(0.65);
      g.beginPath();
      g.arc(c1 * L, s1 * L, R * 0.045, 0, TAU);
      g.fill();
    }
    g.fillStyle = steel(0.85);
    g.beginPath();
    g.arc(0, 0, 2.2 * F, 0, TAU);
    g.fill();
  },
  dynamo(g, R, m) {
    const s = m.st;
    const radii = [0.22, 0.4, 0.58];
    for (let k = 0; k < 3; k++) {
      const dr = k * s.w * (k % 2 === 0 ? 1 : -1);
      g.strokeStyle = m.e > 0.5 ? cgo(0.5) : steel(0.45);
      g.lineWidth = 1.3;
      g.beginPath();
      g.arc(0, 0, radii[k] * R, dr, dr + 5.1);
      g.stroke();
    }
    for (const b of s.bolts) {
      const a = (1 - b.age / 0.16) * (0.4 + 0.5 * m.e);
      g.strokeStyle = cgo(a);
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(b.pts[0].x, b.pts[0].y);
      for (const p of b.pts) g.lineTo(p.x, p.y);
      g.stroke();
      const lp = b.pts[b.pts.length - 1];
      glow(g, SP.gold, lp.x, lp.y, 10 * F, a);
    }
    glow(g, SP.cyan, 0, 0, (10 + 16 * m.e) * F, 0.2 + 0.4 * m.e);
    g.fillStyle = cgo(0.4 + 0.5 * m.e);
    g.beginPath();
    g.arc(0, 0, 1.8 * F, 0, TAU);
    g.fill();
  },
};

function drawHousing(g, R, m) {
  g.lineWidth = 1.4;
  g.strokeStyle = steel(0.38);
  g.beginPath();
  g.arc(0, 0, R, 0, TAU);
  g.stroke();
  g.lineWidth = 1;
  g.strokeStyle = steel(0.16);
  g.beginPath();
  g.arc(0, 0, R * 0.88, 0, TAU);
  g.stroke();
  g.strokeStyle = steel(0.26);
  g.beginPath();
  for (let k = 0; k < 24; k++) {
    const a = (k * TAU) / 24 + m.hrot;
    const c1 = Math.cos(a), s1 = Math.sin(a);
    g.moveTo(c1 * R * 0.875, s1 * R * 0.875);
    g.lineTo(c1 * R * 0.965, s1 * R * 0.965);
  }
  g.stroke();
  const pa = Math.PI + theta;
  const px = Math.cos(pa) * R * 0.955, py = Math.sin(pa) * R * 0.955;
  g.strokeStyle = steel(0.5);
  g.lineWidth = 1.1;
  g.beginPath();
  g.arc(px, py, R * 0.1, 0, TAU);
  g.stroke();
  g.fillStyle = m.e > 0.5 ? cgo(0.85) : ccy(0.4 + 0.5 * m.e);
  g.beginPath();
  g.arc(px, py, 1.8 * F, 0, TAU);
  g.fill();
  glow(g, SP.dim, 0, -R * 0.78, 11 * F, 0.1 + 0.4 * m.e);
  g.fillStyle = ccy(0.2 + 0.75 * Math.min(1, m.e + m.flash));
  g.beginPath();
  g.arc(0, -R * 0.72, 1.9 * F, 0, TAU);
  g.fill();
}

function drawCore(g, ap, gm) {
  g.save();
  g.translate(CX, CY);
  const r0 = RC * U;
  g.lineWidth = 1;
  g.strokeStyle = steel(0.3);
  g.beginPath();
  for (let k = 0; k < 32; k++) {
    const a = (k * TAU) / 32 + theta * 2;
    g.moveTo(Math.cos(a) * r0 * 0.985, Math.sin(a) * r0 * 0.985);
    g.lineTo(Math.cos(a) * r0 * 1.06, Math.sin(a) * r0 * 1.06);
  }
  g.stroke();
  g.lineWidth = 2 * F;
  g.strokeStyle = steel(0.45 + 0.25 * ap);
  for (let k = 0; k < 4; k++) {
    const a0 = theta * -3 + (k * TAU) / 4;
    g.beginPath();
    g.arc(0, 0, 0.235 * U, a0, a0 + 1.9);
    g.stroke();
  }
  g.save();
  g.setLineDash([6 * F, 10 * F]);
  g.lineDashOffset = -t * 26 * F;
  g.strokeStyle = ccy(0.22 + 0.3 * ap * (1 - gm));
  g.lineWidth = 1;
  g.beginPath();
  g.arc(0, 0, 0.17 * U, 0, TAU);
  g.stroke();
  g.restore();
  g.save();
  g.rotate(rotR);
  g.lineWidth = 1.6 * F;
  g.strokeStyle = steel(0.6 + 0.3 * (1 - gm / 1.5));
  for (let k = 0; k < 3; k++) {
    const a = (k * TAU) / 3;
    g.beginPath();
    g.moveTo(Math.cos(a) * 0.02 * U, Math.sin(a) * 0.02 * U);
    g.bezierCurveTo(
      Math.cos(a + 0.4) * 0.07 * U, Math.sin(a + 0.4) * 0.07 * U,
      Math.cos(a + 0.7) * 0.12 * U, Math.sin(a + 0.7) * 0.12 * U,
      Math.cos(a + 1.1) * 0.115 * U, Math.sin(a + 1.1) * 0.115 * U
    );
    g.stroke();
  }
  g.restore();
  g.lineWidth = 1;
  g.strokeStyle = steel(0.55);
  for (let k = 0; k < 2; k++) {
    const a = theta * 2.2 + (k * TAU) / 2;
    const ox = Math.cos(a) * 0.345 * U, oy = Math.sin(a) * 0.345 * U;
    g.fillStyle = steel(0.5);
    g.beginPath();
    g.arc(ox, oy, 0.045 * U, 0, TAU);
    g.fill();
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const ta = a * (0.345 / 0.045) + (i * TAU) / 6;
      const r2 = 0.045 * U * 1.18;
      const x = ox + Math.cos(ta) * r2, y = oy + Math.sin(ta) * r2;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.stroke();
  }
  g.restore();
}

function render() {
  const shx = (Math.random() * 2 - 1) * shake;
  const shy = (Math.random() * 2 - 1) * shake;
  ctx.setTransform(DPR, 0, 0, DPR, shx * DPR, shy * DPR);
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(bcv, 0, 0, W, H);

  tctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  tctx.globalCompositeOperation = 'destination-out';
  tctx.fillStyle = 'rgba(0,0,0,0.16)';
  tctx.fillRect(0, 0, W, H);
  tctx.globalCompositeOperation = 'lighter';
  tctx.globalCompositeOperation = 'lighter';
  for (const p of pulses) {
    if (p.tt < 0) continue;
    const m = mods[p.mi];
    if (!m.path) continue;
    const pt = pathAt(m.path, clamp(p.tt, 0, 1));
    glow(tctx, SP[p.col], pt.x, pt.y, (10 + 9 * p.s) * F, 0.7);
  }
  for (const p of pkts) {
    glow(tctx, SP.gold, CX + Math.cos(p.ang) * ringR, CY + Math.sin(p.ang) * ringR, 12 * F, 0.6);
  }
  for (const p of parts) {
    glow(tctx, SP[p.col] || SP.cyan, p.x, p.y, (4.5 * p.s) * F, p.ball ? 0.3 : 0.28);
  }
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(tcv, 0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';

  for (const m of mods) {
    const p = m.path;
    if (!p) continue;
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = steel(0.13);
    ctx.beginPath();
    ctx.moveTo(p.x0, p.y0);
    ctx.quadraticCurveTo(p.pcx, p.pcy, p.x1, p.y1);
    ctx.stroke();
    ctx.save();
    ctx.setLineDash([1.5, 12 * F]);
    ctx.lineDashOffset = -t * 24 * F;
    ctx.strokeStyle = ccy(0.16 + 0.4 * m.e);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(p.x0, p.y0);
    ctx.quadraticCurveTo(p.pcx, p.pcy, p.x1, p.y1);
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = steel(0.16);
  ctx.lineWidth = 1;
  ctx.save();
  ctx.setLineDash([2, 16 * F]);
  ctx.lineDashOffset = t * 14 * F;
  ctx.beginPath();
  ctx.arc(CX, CY, ringR, 0, TAU);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = steel(0.05);
  ctx.lineWidth = 5 * F;
  ctx.beginPath();
  ctx.arc(CX, CY, ringR, 0, TAU);
  ctx.stroke();

  for (const m of mods) {
    const R = 0.155 * U;
    glow(ctx, SP.dim, m.x, m.y, R * 1.9, 0.05 + 0.1 * m.e);
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.a);
    ctx.rotate(-theta);
    drawHousing(ctx, R, m);
    MECHS[m.ty](ctx, R, m);
    ctx.restore();
  }

  drawCore(ctx, Math.min(1.3, 0.3 + 0.55 * Math.exp(-2.4 * beatT) + 0.55 * flame + 0.5 * ingest + 0.9 * flare), clamp((flare + wash * 0.6), 0, 1));

  ctx.globalCompositeOperation = 'lighter';
  const ap = Math.min(1.4, 0.3 + 0.55 * Math.exp(-2.4 * beatT) + 0.55 * flame + 0.5 * ingest + 0.9 * flare);
  const gm = clamp(flare * 1.3, 0, 1);
  glow(ctx, SP.cyan, CX, CY, U * (0.16 + 0.2 * ap), (1 - gm) * (0.35 + 0.4 * ap));
  glow(ctx, SP.gold, CX, CY, U * (0.18 + 0.24 * ap), gm * (0.3 + 0.5 * ap));
  for (const p of pulses) {
    if (p.tt < 0) continue;
    const m = mods[p.mi];
    const pt = pathAt(m.path, clamp(p.tt, 0, 1));
    glow(ctx, SP[p.col], pt.x, pt.y, (15 + 11 * p.s) * F, 0.85);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 1.6 * F, 0, TAU);
    ctx.fill();
  }
  for (const p of pkts) {
    const x = CX + Math.cos(p.ang) * ringR, y = CY + Math.sin(p.ang) * ringR;
    glow(ctx, SP.gold, x, y, 16 * F, 0.8);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(x, y, 1.5 * F, 0, TAU);
    ctx.fill();
  }
  const batches = {};
  for (const p of parts) {
    const key = (p.ball ? 's:' : 'm:') + p.col;
    (batches[key] || (batches[key] = [])).push(p);
  }
  ctx.lineCap = 'round';
  const SPCOL = { cyan: ccy, gold: cgo, mag: cma, dim: steel };
  for (const key in batches) {
    const arr = batches[key];
    const col = key.slice(2);
    if (!SPCOL[col]) continue;
    if (key[0] === 's') {
      ctx.strokeStyle = SPCOL[col](0.8);
      ctx.lineWidth = 1.4 * F;
      ctx.beginPath();
      for (const p of arr) {
        const k = 0.045;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * k, p.y - p.vy * k);
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = SPCOL[col](0.5);
      ctx.beginPath();
      for (const p of arr) {
        ctx.moveTo(p.x + 1.1 * F, p.y);
        ctx.arc(p.x, p.y, 1.1 * F, 0, TAU);
      }
      ctx.fill();
    }
  }
  for (const s of shocks) {
    ctx.strokeStyle = cgo(0.5 * s.life * s.w);
    ctx.lineWidth = (9 * F * s.life + 1) * s.w;
    ctx.beginPath();
    ctx.arc(CX, CY, s.r, 0, TAU);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  for (const r of ripples) {
    ctx.strokeStyle = r.col === 'gold' ? cgo(0.4 * r.life) : r.col === 'mag' ? cma(0.4 * r.life) : ccy(0.4 * r.life);
    ctx.lineWidth = r.lw * F;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, TAU);
    ctx.stroke();
  }
  if (wash > 0.01) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = cgo(0.05 * wash);
    ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (t < 1.3) {
    ctx.fillStyle = 'rgba(4,5,8,' + (1 - t / 1.3).toFixed(3) + ')';
    ctx.fillRect(-20, -20, W + 40, H + 40);
  }

  if (ptr.seen) {
    if (ptr.down) {
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, SP.mag, ptr.x, ptr.y, 130 * F * (1 + 0.12 * Math.sin(t * 6)), 0.12);
      ctx.strokeStyle = cma(0.35);
      ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        const a = t * 2.2 + (k * TAU) / 3;
        ctx.beginPath();
        ctx.arc(ptr.x, ptr.y, 52 * F, a, a + 0.9);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    let near = null;
    for (const m of mods) {
      if (Math.hypot(m.x - ptr.x, m.y - ptr.y) < 0.16 * U) { near = m; break; }
    }
    if (Math.hypot(CX - ptr.x, CY - ptr.y) < RC * U * 1.1) near = 'core';
    const rr = near ? 13 * F : 9 * F;
    ctx.strokeStyle = near ? cgo(0.75) : ccy(0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(ptr.x, ptr.y, rr, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = t * 0.6 + (k * TAU) / 4;
      ctx.moveTo(ptr.x + Math.cos(a) * rr, ptr.y + Math.sin(a) * rr);
      ctx.lineTo(ptr.x + Math.cos(a) * (rr + 5 * F), ptr.y + Math.sin(a) * (rr + 5 * F));
    }
    ctx.stroke();
    if (near) {
      ctx.fillStyle = cgo(0.7);
      ctx.beginPath();
      ctx.arc(ptr.x, ptr.y, 1.6 * F, 0, TAU);
      ctx.fill();
    }
  }

  lampAcc += 1;
  if (lampAcc >= 4) {
    lampAcc = 0;
    const ap2 = Math.min(1.4, 0.3 + 0.55 * Math.exp(-2.4 * beatT) + 0.55 * flame + 0.5 * ingest + 0.9 * flare);
    lamp.style.opacity = (0.2 + 0.8 * clamp(ap2 / (0.3 + 0.55 + 0.6), 0, 1)).toFixed(3);
    lamp.style.background = flare > 0.4 ? '#ffc76a' : '#52e0ff';
  }
}

function renderBg() {
  bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  bctx.globalCompositeOperation = 'source-over';
  bctx.fillStyle = '#06070b';
  bctx.fillRect(0, 0, W, H);
  let gr = bctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(W, H) * 0.72);
  gr.addColorStop(0, 'rgba(21,27,41,0.5)');
  gr.addColorStop(0.55, 'rgba(9,12,19,0.22)');
  gr.addColorStop(1, 'rgba(2,3,5,0.0)');
  bctx.fillStyle = gr;
  bctx.fillRect(0, 0, W, H);
  bctx.fillStyle = 'rgba(150,175,210,0.05)';
  const step = 46;
  for (let x = (CX % step); x < W; x += step) {
    for (let y = (CY % step); y < H; y += step) {
      bctx.fillRect(x, y, 1, 1);
    }
  }
  bctx.strokeStyle = 'rgba(150,175,210,0.05)';
  bctx.lineWidth = 1;
  for (const r of [0.55, 0.86, 1.12]) {
    bctx.beginPath();
    bctx.arc(CX, CY, r * U, 0, TAU);
    bctx.stroke();
  }
  gr = bctx.createRadialGradient(CX, CY, Math.min(W, H) * 0.42, CX, CY, Math.max(W, H) * 0.75);
  gr.addColorStop(0, 'rgba(3,4,7,0)');
  gr.addColorStop(1, 'rgba(2,3,6,0.8)');
  bctx.fillStyle = gr;
  bctx.fillRect(0, 0, W, H);
}

function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  cv.width = Math.round(W * DPR);
  cv.height = Math.round(H * DPR);
  cv.style.width = W + 'px';
  cv.style.height = H + 'px';
  tcv.width = cv.width;
  tcv.height = cv.height;
  bcv.width = cv.width;
  bcv.height = cv.height;
  CX = W / 2;
  CY = H / 2;
  U = Math.min(W, H) * 0.5;
  F = U / 430;
  tctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  tctx.clearRect(0, 0, W, H);
  renderBg();
  if (!dust.length) makeDust();
}

cv.addEventListener('pointerdown', (e) => {
  ptr.down = true;
  ptr.x = e.clientX;
  ptr.y = e.clientY;
  ptr.sx = e.clientX;
  ptr.sy = e.clientY;
  ptr.st = t;
  ptr.seen = true;
  try { cv.setPointerCapture(e.pointerId); } catch (err) { }
});
cv.addEventListener('pointermove', (e) => {
  const nx = e.clientX, ny = e.clientY;
  if (ptr.seen) {
    const dtm = Math.max(0.008, 1 / 60);
    ptr.vx = clamp((nx - ptr.x) / dtm, -2400, 2400) * 0.6 + ptr.vx * 0.4;
    ptr.vy = clamp((ny - ptr.y) / dtm, -2400, 2400) * 0.6 + ptr.vy * 0.4;
  }
  ptr.x = nx;
  ptr.y = ny;
  ptr.seen = true;
});
cv.addEventListener('pointerup', (e) => {
  if (ptr.down && Math.hypot(ptr.x - ptr.sx, ptr.y - ptr.sy) < 7 && t - ptr.st < 0.4) {
    clickCharge(e.clientX, e.clientY);
  }
  ptr.down = false;
});
cv.addEventListener('pointerleave', () => {
  ptr.down = false;
  ptr.seen = false;
  ptr.wake = 0;
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.repeat && grandCd <= 0) {
    grandCd = 1.4;
    grand(false);
  }
});
window.addEventListener('resize', resize);

function frame(now) {
  now /= 1000;
  let dt = now - last;
  last = now;
  if (dt > 0.05) dt = 0.05;
  if (dt < 0) dt = 0;
  t += dt;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

resize();
makeMods();
grand(false);
scheduleAt(1.1, () => {
  for (let i = 0; i < 8; i++) mFire(mods[i % 8], 0.5, 'cyan');
});
last = performance.now() / 1000;
requestAnimationFrame(frame);

console.info('%c IMPOSSIBLE MACHINE %c perpetual mechanism · online ', 'background:#52e0ff;color:#04121a;font-weight:bold;padding:2px 6px;border-radius:3px 0 0 3px', 'background:#0b1018;color:#8fa3bf;padding:2px 6px;border-radius:0 3px 3px 0');
