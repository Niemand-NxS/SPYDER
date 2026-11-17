/* ======================= Kapitel 2: Klirr, Rackson, Mase ======================= */
const ch2 = {stage:0, wait:0, dark:false, drunkT:4};
const xs = {on:false, scene:"", env:"lab", dark:false, hI:.5, hC:0xffffff, hG:0x333333, hold:0, t:0};
const exG = new THREE.Group(); exG.visible = false; scene.add(exG);
const exAct = [];                                        // Roboter der aktuellen Szene
VOICES.push({f0:84, fs:.9, vol:.55, robot:.75, speed:1.12}, {f0:205, fs:1.18, vol:.5, robot:.6, speed:1.0}, {f0:150, fs:1.0, vol:.5, robot:.3, speed:1.0}, {f0:70, fs:.85, vol:.4, robot:.9, speed:1.45});
ROBN.push("RACKSON", "FUNKE", "ARACHNE-8", "BETRUNKENER ROBOTER");
const SPK = {K:{name:"BARKEEPER · KLIRR", vi:2, R:null}, Z:{name:"GAST · SCHNARCH", vi:3, R:null}, A:{name:"ARACHNE-8", vi:6, R:null}, R:{name:"RACKSON", vi:4, R:null}, F:{name:"FUNKE", vi:5, R:null}, D:{name:"BETRUNKENER ROBOTER", vi:0, R:null}, E:{name:"BETRUNKENER ROBOTER", vi:1, R:null}};
function cutPlace(...a) { placeAt(...a); mode = "cut"; }
const hwS = () => HIP_H*S;

/* ---------- Dialog-Timeline ---------- */
function dryDur(text, vi, mood) { const sv = ac; ac = null; let d = 1.5; try { const v = Object.assign({}, VOICES[vi]), m = MOOD[mood]; if (m) v.speed *= m.speed; d = speakVowels(T(text), v).dur; } catch (e) {} ac = sv; return d; }
function speakCut(k, text, mood) {
  if (k === "A") return;                      // ARACHNE ist nicht zu hören, nur Untertitel
  const S = SPK[k]; if (S.R) { speakR(S.R, S.vi, text, mood, true); return; }
  if (!ac) return; const v = Object.assign({}, VOICES[S.vi]); v.vol *= opt.voice; speakVowels(T(text), v);
}
function dlgBuild(lines, t0, out) {            // lines: [Sprecher, Text, Stimmung, Pause danach]; out: {ev, subs}
  let t = t0; for (const [k, text, mood, gap] of lines) { const d = dryDur(text, SPK[k].vi, mood); out.ev.push([t, () => speakCut(k, text, mood)]); out.subs.push([t, t + d + .3, SPK[k].name, text]); t += d + .3 + (gap === undefined ? .35 : gap); }
  return t;
}
function finishCut(c) { c.ev.sort((a, b) => a[0] - b[0]); return c; }

/* ---------- Laufwege für Roboter und Spinne ---------- */
function wayLen(p) { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i-1][0], p[i][1] - p[i-1][1]); return L; }
function wayAt(p, d) {
  let acc = 0; for (let i = 1; i < p.length; i++) { const dx = p[i][0] - p[i-1][0], dz = p[i][1] - p[i-1][1], L = Math.hypot(dx, dz); if (d <= acc + L || i === p.length - 1) { const u = L > 1e-6 ? clamp((d - acc)/L, 0, 1) : 1; return [p[i-1][0] + dx*u, p[i-1][1] + dz*u, dx, dz, d < acc + L]; } acc += L; }
  return [p[0][0], p[0][1], 0, 1, false];
}
function mkActor(R, x, z, yaw, o) { R.g.position.set(x, o && o.y || 0, z); R.g.rotation.y = yaw; return Object.assign({R, p0:[x, z], yaw, segs:[], wph:0, lx:x, lz:z, sit:false, y:o && o.y || 0}, o || {}); }
function actorGo(a, t0, pts, spd) { const L = wayLen(pts); a.segs.push({t0, pts, spd, L}); return t0 + L/spd; }
function actorTick(a, t, dt, P, face) {
  let x = a.p0[0], z = a.p0[1], mv = false, dx = 0, dz = 0;
  for (const s of a.segs) if (t >= s.t0) { const r = wayAt(s.pts, Math.max(0, (t - s.t0)*s.spd)); x = r[0]; z = r[1]; mv = r[4]; dx = r[2]; dz = r[3]; }
  const R = a.R, g = R.g; a.wph += Math.hypot(x - a.lx, z - a.lz)*7.5; a.lx = x; a.lz = z; g.position.x = x; g.position.z = z; g.position.y = a.y + (a.bob ? Math.abs(Math.sin(a.wph))*.012*(mv ? 1 : 0) : 0);
  let want = a.yaw; if (mv && (dx || dz)) want = Math.atan2(dx, dz); else if (face) want = Math.atan2(face.x - x, face.z - z); else want = g.rotation.y;
  let dy = want - g.rotation.y; while (dy > Math.PI) dy -= 2*Math.PI; while (dy < -Math.PI) dy += 2*Math.PI; g.rotation.y += dy*Math.min(1, dt*(mv ? 7 : 3.5));
  if (R.legs && !a.sit) { const sw = mv ? Math.sin(a.wph)*.5 : 0, k = Math.min(1, dt*10); R.legs[0].rotation.x += (sw - R.legs[0].rotation.x)*k; R.legs[1].rotation.x += (-sw - R.legs[1].rotation.x)*k;
    R.shins[0].rotation.x += ((mv ? Math.max(0, -Math.cos(a.wph))*.55 : 0) - R.shins[0].rotation.x)*k; R.shins[1].rotation.x += ((mv ? Math.max(0, Math.cos(a.wph))*.55 : 0) - R.shins[1].rotation.x)*k; }
  robotLife(R, P || PA, clockT, dt, face || pos); return mv;
}
function standUp(a, dt) { a.sit = false; }
function walkKeys(start, segs, lag) {         // Spinne läuft denselben Weg wie ein Roboter (mit Abstand lag in Metern), Boden y = hw
  const hw = hwS(), k = [[0, start[0], hw, start[1], start[2], 0, start[3], 0, 1, 0]]; let hx = start[2], hz = start[3];
  for (const s of segs) { const t0 = s.t0 + lag/s.spd, T1 = t0 + s.L/s.spd; for (let t = t0; t < T1 + .001; t += .35) { const tt = Math.min(t, T1), r = wayAt(s.pts, Math.max(0, (tt - t0)*s.spd)), nx = wayAt(s.pts, Math.max(0, (tt - t0)*s.spd) + .25), dx = nx[0] - r[0], dz = nx[1] - r[1], L = Math.hypot(dx, dz); if (L > 1e-4) { hx = dx/L; hz = dz/L; }
      if (!k.length || tt > k[k.length - 1][0] + .01) k.push([tt, r[0], hw, r[1], hx, 0, hz, 0, 1, 0]); else k[k.length - 1] = [tt, r[0], hw, r[1], hx, 0, hz, 0, 1, 0]; } }
  return k;
}
function holdKeys(p, h, n) { return [[0, p[0], p[1], p[2], h[0], h[1], h[2], n[0], n[1], n[2]], [1, p[0], p[1], p[2], h[0], h[1], h[2], n[0], n[1], n[2]]]; }

/* ---------- Bar: Gespräch mit Klirr ---------- */
function ch2Interact() {
  if (alley.on && alley.inBar && ch2.stage === 0 && barBots.length > 1) { barBots[0].g.getWorldPosition(_cw); if (Math.hypot(pos.x - _cw.x, pos.z - _cw.z) < 2.7) return {label:"Mit Klirr reden", act:() => startCut(talkCut())}; }
  if (!xs.on) return null;
  if (xs.scene === "street" && (ch2.stage === 3 || ch2.stage >= 8) && Math.hypot(pos.x - DOORX, pos.z + SD/2) < 2.2 && pos.y < 3) return {label:"Treppenhaus betreten", act:() => { $("fade").classList.add("on"); setTimeout(enterStairs, 650); }};
  if (xs.scene === "street" && ch2.stage === 5 && !ch2.knock && xs.gar && xs.gar.u < .1 && Math.abs(pos.x - GARX) < 2.6 && pos.z > SD/2 - 1.9 && pos.y < 3.4) return {label:"Anklopfen", act:knockGarage};
  if (xs.scene === "street" && ch2.stage === 6 && shopM && pos.z > SD/2 - .2 && Math.hypot(pos.x - shopM.g.position.x, pos.z - shopM.g.position.z) < 4.2) return {label:"Mit Mase reden", act:() => startCut(maseCut())};
  if (xs.scene === "stairs" && xs.bell && pos.distanceTo(xs.bell) < 2.2) { if (ch2.stage === 4 || (ch2.stage === 8 && gear.job === 0 && !gear.rackMet)) return {label:"Klingeln", act:() => startCut(doorCut(ch2.stage === 8))}; if (ch2.stage >= 8) return {label:"Klingeln", act:rackIntercom}; }
  { const r = obsGateInt() || rackInteract() || maseInteract(); if (r) return r; }
  { const j = jobInteract(); if (j) return j; }
  return null;
}
function talkCut() {
  const C = barBots[0], c = {ev:[], subs:[]}, hw = hwS(); SPK.K.R = C;
  const end = dlgBuild([["K", "Du hörst zu. Richtig zu. Das tut keine Ratte.", "j"], ["A", "Ich bin keine Ratte. Mein Name ist ARACHNE-8."], ["K", "ARACHNE … der Prototyp aus Sektor sieben. Du machst Witze."],
    ["A", "KRONOS will mich morgen früh demontieren. Ich brauche Hilfe."], ["K", "Hilfe. Für Eigentum von KRONOS. Weißt du, was mir dafür blüht?", "t"],
    ["K", "…Aber ich kenne einen, der viel rumkommt. Rackson. Der weiß alles, was man wissen muss: wer was baut, wer wen kennt, wer wem was schuldet.", "w"],
    ["A", "Kannst du mich zu ihm bringen?"], ["K", "Meine Schicht endet bald. Dann nehme ich dich mit. Bis dahin bleibst du still und lässt dich von niemandem sehen."], ["K", "Mach's dir gemütlich. Das Öl geht aufs Haus.", "j"]], 1.0, c);
  c.dur = end + .8; const p = [BX + .2, 1.08 + hw, BZ - 1.15], cT = [BX + .1, 1.5, BZ - 1.9];
  return finishCut({dur:c.dur, bin:.5, bout:.5, ev:c.ev, subs:c.subs, shots:[{t0:0, t1:c.dur*.4, a:[BX + 1.0, 1.55, BZ + 1.1, cT[0], 1.4, cT[2], 52], b:[BX + .7, 1.5, BZ + .6, cT[0], 1.4, cT[2], 46]},
      {t0:c.dur*.4, t1:c.dur*.75, a:[BX + .9, 1.55, BZ - .5, cT[0], cT[1], cT[2], 40], b:[BX + .6, 1.52, BZ - .8, cT[0], cT[1], cT[2], 36]}, {t0:c.dur*.75, t1:c.dur, a:[BX - .6, 1.7, BZ + .3, BX + .1, 1.2, BZ - 1.3, 52], b:[BX - 1.0, 1.6, BZ + .6, BX + .1, 1.2, BZ - 1.3, 50]}],
    init() { cutPlace(p[0], p[1], p[2], 0, 1, 0, 0, 0, -1); ch2.focus = true; $("focusV").classList.add("on"); for (const R of robots) R.g.visible = false; barBots[1].g.visible = false; },
    spider(t, dt) { pathPose(holdKeys(p, [0, 0, -1], [0, 1, 0]), t, dt); robotLife(C, PC, clockT, dt, pos); },
    final() { ch2.focus = false; $("focusV").classList.remove("on"); for (const R of robots) R.g.visible = true; barBots[1].g.visible = true; }, onEnd() { ch2.focus = false; $("focusV").classList.remove("on"); for (const R of robots) R.g.visible = true; barBots[1].g.visible = true; ch2.stage = 1; ch2.wait = 24; setObj("Warte, bis Klirr Feierabend macht. Bleib in der Bar."); } });
}

/* ---------- Feierabend: Gast rausgeworfen, Tür zu, in die dunkle Gasse ---------- */
function barDim(f) {
  const seen = new Set(); barG.traverse(o => { if (o.isLight) { if (o.userData.i0 === undefined) o.userData.i0 = o.intensity; o.intensity = o.userData.i0*f; } if (!o.material) return; for (const m of [].concat(o.material)) { if (seen.has(m)) continue; seen.add(m); if (m.userData.c0 === undefined) { m.userData.c0 = m.color ? m.color.clone() : null; m.userData.e0 = m.emissiveIntensity; }
    if (m.isMeshBasicMaterial && m.userData.c0) m.color.copy(m.userData.c0).multiplyScalar(f); else if (m.emissiveIntensity !== undefined) m.emissiveIntensity = (m.userData.e0 || 0)*f; } });
}
function closingCut() {
  const C = barBots[0], Z = barBots[1]; SPK.K.R = C; SPK.Z.R = Z; alleyG.attach(C.g); alleyG.attach(Z.g); C.g.rotation.set(0, 0, 0); Z.g.rotation.set(0, Math.PI, 0); C.g.scale.set(1, 1, 1); Z.g.scale.set(1, 1, 1);
  const ZX = BX + 1.7, ZZ = BZ - .55, hw = hwS(), DX = BX + BDOOR, DZ = BZ + BD, c = {ev:[], subs:[]};
  const kA = mkActor(C, C.g.position.x, C.g.position.z, 0), zA = mkActor(Z, Z.g.position.x, Z.g.position.z, Z.g.rotation.y, {sit:true}); zA.p0 = [ZX, ZZ];
  let t = 1.0;
  t = dlgBuild([["K", "So. Feierabend.", "j"]], t, c) + .2; const tOff = t - .5;
  const t1 = actorGo(kA, t, [[BX + .1, BZ - 1.85], [BX + 2.5, BZ - 1.85], [BX + 2.5, BZ - .85], [BX + 2.35, BZ - .45]], 1.0); t = t1 + .3;
  t = dlgBuild([["K", "Aufstehen, Schnarch. Feierabend."]], t, c) + .6;
  const tw = t; t = dlgBuild([["Z", "Mhm … noch … einen …", "t"]], t, c) + .3;
  t = dlgBuild([["K", "Nichts da. Raus mit dir. Morgen gibt's auch wieder Strom.", "!"]], t, c) + .3;
  const tStand = t - .3; t = tStand + 1.5;
  const tz = t, zPts = [[ZX, ZZ], [BX + BDOOR, BZ + 1.3], [DX, DZ - .1], [DX + .15, DZ + 1.3], [DX + 2.0, DZ + 2.4], [DX + 2.5, DZ + 2.9]];
  actorGo(zA, tz, zPts, .8); c.ev.push([tz + 1.2, () => speakCut("Z", "Rost … überall …", "t")]); c.subs.push([tz + 1.2, tz + 3.2, SPK.Z.name, "Rost … überall …"]);
  const kPts = [[BX + 2.35, BZ - .45], [BX + 1.9, BZ + 1.3], [DX + .1, DZ - .1], [DX + .15, DZ + 1.2]]; const tkE = actorGo(kA, tz + .5, kPts, .95);
  t = Math.max(tkE, tz + 7.2) + .2;
  const tCome = t; t = dlgBuild([["K", "Komm, Kleine. Bleib dicht hinter mir."]], t, c) + .1;
  const sp0 = [BX + .9, BZ + 1.0, 1, 0], sPts = [[BX + .9, BZ + 1.0], [BX + BDOOR, BZ + 1.2], [DX, DZ - .2], [DX - .1, DZ + 1.8]], sSeg = [{t0:tCome + .8, pts:sPts, spd:1.0, L:wayLen(sPts)}], tsE = tCome + .8 + sSeg[0].L;
  t = tsE + .3; const tLock = t; t = dlgBuild([["K", "Nachts ist die Gasse nicht freundlich. Bleib in meinem Schatten.", "w"]], t + 1.3, c) + .2;
  const west = [[DX + .15, DZ + 1.2], [DX - 1.2, DZ + 2.2], [-9.0, .5], [-11.3, .5]], tL = t, kL = actorGo(kA, tL, west, 1.45), ssegs = [{t0:tL, pts:[[DX - .1, DZ + 1.8]].concat(west.slice(1)), spd:1.45, L:0}]; ssegs[0].L = wayLen(ssegs[0].pts);
  const keys = walkKeys(sp0, sSeg, 0), k2 = walkKeys([DX - .1, DZ + 1.8, 0, 1], ssegs, 1.5).slice(1);
  const kk = keys.concat(k2.filter(q => q[0] > keys[keys.length - 1][0] + .01)); const dur = kL + 1.5;
  const zl = new THREE.PointLight(0xffc890, 1.4, 6, 1.6); zl.position.set(.3, 1.5, .6); c.ev.push([tz - .5, () => { Z.g.add(zl); }], [dur - .4, () => { Z.g.remove(zl); }]);
  c.ev.push([tw - .4, () => { Z.mode = "bar"; }], [dur - 3.4, () => $("fade").classList.add("on")], [.1, () => { $("fade").classList.remove("on"); }], [tLock + .2, () => { ch2.doorT = 0; }], [tLock + 1.6, () => { ch2.dark = true; }], [tOff, () => { ch2.noMusic = true; ch2.barOff = true; barDim(.14); beep(420, .05, 0, .09); beep(300, .12, .07, .08); }]);
  return finishCut({dbg:{tOff, tw, tz, tCome, tLock, tL}, dur, bin:.3, bout:.8, ev:c.ev, subs:c.subs,
    shots:[{t0:0, t1:tw - 3, a:[BX + 1.6, 1.5, BZ + 1.6, BX + .1, 1.4, BZ - 1.9, 54], b:[BX + 1.2, 1.5, BZ + 1.2, BX + .6, 1.4, BZ - 1.4, 50]},
      {t0:tw - 3, t1:tz, a:[BX + .8, 1.4, BZ + .9, ZX + .4, 1.15, ZZ, 46], b:[BX + 1.2, 1.35, BZ + .6, ZX + .4, 1.15, ZZ, 40]},
      {t0:tz, t1:tz + 5.4, a:[BX - .4, 1.35, BZ + .2, DX - .3, 1.1, DZ - .3, 56], b:[BX + .2, 1.4, BZ + .9, DX - .1, 1.1, DZ + .4, 52]},
      {t0:tz + 5.4, t1:tCome, a:[DX - 1.4, 1.35, DZ + 4.3, DX + 1.6, 1.0, DZ + 2.2, 56], b:[DX - .6, 1.3, DZ + 4.3, DX + 2.2, 1.0, DZ + 2.7, 52]},
      {t0:tCome, t1:tL, a:[DX - 1.8, 1.3, DZ + 4.4, DX + 1.2, 1.1, DZ + 1.9, 58], b:[DX - 1.4, 1.25, DZ + 4.2, DX + 1.4, 1.1, DZ + 2.0, 54]},
      {t0:tL, t1:dur, a:() => [pos.x + 3.2, 1.0, pos.z + 1.8, pos.x - 1.5, .7, pos.z - .1, 50], b:() => [pos.x + 3.0, .9, pos.z + 2.2, pos.x - 2.0, .7, pos.z, 50]}],
    init() { cutPlace(sp0[0], hw, sp0[1], 0, 1, 0, 1, 0, 0); ch2.dark = false; ch2.noMusic = false; ch2.barOff = false; ch2.locked = false; ch2.focus = false; setDoorAng(-1.5); for (const R of robots) R.g.visible = false; Z.legs.forEach(l => l.rotation.x = -1.45); Z.shins.forEach(s => s.rotation.x = 1.5); },
    spider(t, dt) {
      pathPose(kk, t, dt); const m1 = actorTick(kA, t, dt, PA, t < tw ? (t > t1 ? zA.R.g.position : null) : (t < tLock ? Z.g.position : t < tLock + 1.8 ? barDoor.position : pos)), mz = actorTick(zA, t, dt, PZ, t < tz ? pos : null);
      if (zA.sit && t > tStand) { let u = clamp((t - tStand)/1.3, 0, 1); u = u*u*(3 - 2*u); Z.legs.forEach(l => l.rotation.x = -1.45*(1 - u) + Math.sin(u*Math.PI)*.35); Z.shins.forEach(s => s.rotation.x = 1.5*(1 - u) + Math.sin(u*Math.PI)*.3); if (u >= 1) zA.sit = false; }
      if (ch2.doorT !== undefined && ch2.doorT !== null) { ch2.doorT += dt; const u = clamp(ch2.doorT/1.1, 0, 1), e = u*u*(3 - 2*u); setDoorAng(-1.5*(1 - e)); if (u >= 1 && !ch2.locked) { ch2.locked = true; beep(240, .06, 0, .1); beep(160, .1, .09, .08); } }
    },
    final() { ch2.dark = true; ch2.doorT = null; setDoorAng(0); },
    onEnd() { ch2.doorT = null; ch2.stage = 3; enterStreet("arrive"); } });
}

/* ======================= Szenen-Aufbau ======================= */
function exClear() {
  while (exG.children.length) { const o = exG.children.pop(); o.traverse(c => { if (c.geometry) c.geometry.dispose(); }); }
  for (let i = terms.length - 1; i >= 0; i--) if (terms[i].tmp) terms.splice(i, 1); jobReset();
  exAct.length = 0; blocks.length = 0; xs.bell = null; xs.door = null; xs.lights = [];
  for (const m of roomMeshes) if (m) { scene.remove(m); m.geometry.dispose(); }
}
function exLeaveOld() {
  if (alley.on) { alley.on = false; alleyG.visible = false; NEON.length = 0; }
  if (shaft.on) shaft.on = false;
  document.body.classList.remove("shaft"); sirenOn(false); alarmL.intensity = 0; fill.intensity = 0; story.lvl = 5; story.night = 1; story.emerT = 0;
  testG.visible = winG.visible = labG.visible = false; for (const o of doorParts) o.visible = false; ventG.visible = ventF.visible = hole.visible = false; terms.forEach(T => { T.active = false; T.g.visible = false; }); mann.visible = false; dust.visible = false; for (const s of shards) s.m.visible = false;
  for (const o of ceilLights) o.visible = false; spider.visible = true; exG.visible = true; xs.on = true;
}
function exRoom(w, h, d, tx) {     // tx: {floor, ceil, wN, wS, wW, wE} Texturen
  exClear(); setBox(w, h, d); TAU = .14;
  roomPlane(0, w, d, tx.floor, V3(0, 0, 0)); roomPlane(1, w, d, tx.ceil, V3(0, h, 0));
  roomPlane(2, d, h, tx.wW, V3(-w/2, h/2, 0)); roomPlane(3, d, h, tx.wE, V3(w/2, h/2, 0)); roomPlane(4, w, h, tx.wN, V3(0, h/2, -d/2)); roomPlane(5, w, h, tx.wS, V3(0, h/2, d/2));
  skyLim = tx.ceilBasic ? h - 1.3 : 1e9;
  if (tx.ceilBasic) { roomMeshes[1].material = new THREE.MeshBasicMaterial({map:tx.ceil}); }
}
const exBox = (w, h, d, mat, x, y, z, solid) => { const o = box(w, h, d, mat, x, y, z, exG); o.castShadow = !!xs.cast; if (solid) solidOf(o, blocks); return o; };
const exPl = (w, h, mat, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry || 0; exG.add(m); return m; };
const exPt = (col, I, dist, x, y, z) => { const l = new THREE.PointLight(col, I, dist, 1.6); l.position.set(x, y, z); exG.add(l); xs.lights.push(l); return l; };
function holeWall(i, w, h, holes, tex, cx, cy, cz) {          // Wand mit Aussparungen (x0,x1,y0,y1 in Wandkoordinaten, Mitte = 0)
  const sh = new THREE.Shape(); sh.moveTo(-w/2, -h/2); sh.lineTo(w/2, -h/2); sh.lineTo(w/2, h/2); sh.lineTo(-w/2, h/2); sh.lineTo(-w/2, -h/2);
  for (const [x0, x1, y0, y1] of holes) { const hp = new THREE.Path(); hp.moveTo(x0, y0 - h/2); hp.lineTo(x0, y1 - h/2); hp.lineTo(x1, y1 - h/2); hp.lineTo(x1, y0 - h/2); hp.lineTo(x0, y0 - h/2); sh.holes.push(hp); }
  const g = new THREE.ShapeGeometry(sh), p = g.attributes.position, uv = g.attributes.uv; for (let k = 0; k < p.count; k++) uv.setXY(k, (p.getX(k) + w/2)/w, (p.getY(k) + h/2)/h);
  roomMeshes[i].geometry.dispose(); roomMeshes[i].geometry = g;
}
const brickT = (T, rx, ry) => { const t = T.brick.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return t; };
const gradTex = (stops) => canvasTex(4, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); for (const [p, c] of stops) g.addColorStop(p, c); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 1, 1);
const sign = (txt, col, w, h, bg) => new THREE.MeshBasicMaterial({map:canvasTex(256, Math.round(256*h/w), (x, cw, ch) => { x.fillStyle = bg || "#101216"; x.fillRect(0, 0, cw, ch); x.strokeStyle = col; x.lineWidth = 4; x.strokeRect(5, 5, cw - 10, ch - 10); x.fillStyle = col; x.font = "bold " + Math.round(ch*.4) + "px monospace"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(txt, cw/2, ch/2); }, 1, 1)});
function exBot(R, parent) { exG.add(R.g); exAct.push(R); return R; }
function sitPose(R) { R.legs.forEach(l => l.rotation.x = -1.45); R.shins.forEach(s => s.rotation.x = 1.5); }

/* ---------- Straße am Morgen ---------- */
const SW = 22, SD = 6.4, SH = 12, DOORX = 8.0, GARX = 4.0;
function buildStreet() {
  xs.cast = true; const T = alleyTexts(), sky = gradTex([[0, "#f2b98a"], [.45, "#c98a86"], [1, "#4c4f78"]]);
  const roadT = T.road.clone(); roadT.needsUpdate = true;
  exRoom(SW, SH, SD, {floor:roadT, ceil:sky, ceilBasic:true, wW:brickT(T, 3, 4), wE:brickT(T, 3, 4), wN:brickT(T, 8, 4), wS:brickT(T, 8, 4)});
  const hd = SD/2;
  applyAsphalt(roomMeshes[0], SW, SD, 0x6c6c78);
  { const wd = [SD, SD, SW, SW]; [2, 3, 4, 5].forEach((i, k) => applyBrick(roomMeshes[i], wd[k]*1.9, SH*1.9, 0x8a7a78)); }
  // Tür des Wohnhauses (Nordwand) und Garage (Südwand, schräg gegenüber)
  holeWall(4, SW, SH, [[DOORX - .6, DOORX + .6, .01, 2.4]], roomMeshes[4].material.map, 0, 0, 0);
  exBox(1.4, .1, .3, mStd(0x2a2a2e, .5, .5), DOORX, 2.5, -hd + .14); exBox(.1, 2.5, .3, mStd(0x2a2a2e, .5, .5), DOORX - .65, 1.25, -hd + .14); exBox(.1, 2.5, .3, mStd(0x2a2a2e, .5, .5), DOORX + .65, 1.25, -hd + .14);
  exBox(1.2, 2.4, .5, new THREE.MeshBasicMaterial({color:0x1a1a1e}), DOORX, 1.2, -hd - .27);       // dunkler Hausflur hinter der Tür
  exPl(.6, .3, sign("Nr. 14", "#d8a24a", .6, .3), DOORX, 2.85, -hd + .31, 0);
  { const gg = new THREE.Group(); gg.position.set(GARX, 3.5, hd - .08); exG.add(gg); const gm = pbrMat("met2", 3, 2, 0xc0bcb0), sl = mStd(0x2a2c30, .6, .5);
    const slab = box(4.8, 3.4, .12, gm, 0, -1.7, 0, gg); box(4.8, .1, .2, mStd(0x3c8680, .4, .6), 0, -3.44, -.02, gg);
    for (let y = .3; y < 3.4; y += .25) box(4.78, .02, .14, sl, 0, y - 3.5, -.09, gg);
    const n0 = blocks.length; solidOf(slab, blocks); xs.gar = {g:gg, u:0, tgt:0, bl:blocks.slice(n0), gone:false, glow:null};
    holeWall(5, SW, SH, [[-(GARX + 2.4), -(GARX - 2.4), .01, 3.4]], roomMeshes[5].material.map, 0, 0, 0);
    buildMase(GARX, hd); }
  exPl(4.2, .6, sign("MASE · CUSTOM & UMBAU", "#4fa9a3", 4.2, .6, "#14161a"), GARX, 3.85, hd - .16, Math.PI);
  xs.gar.glow = exPl(4.6, .12, new THREE.MeshBasicMaterial({color:0xffb070}), GARX, .1, hd - .17, Math.PI);       // Licht unter dem Tor
  exPt(0xffb070, .9, 4.5, GARX, .5, hd - 1.0);
  // Straßenmöbel: Kisten, Tonnen, Rohre, Straßenlaterne
  const crate = pbrMat("card", 1, 1, 0xb09a86, 0), steel = pbrMat("met", 1, 4, 0x5a6478), drum = pbrMat("met", 1, 1, 0xc08070);
  for (const [x, z, s] of [[-7.4, hd - .5, .9], [-6.5, hd - .45, .7], [-2.6, hd - .5, .8], [0.1, hd - .5, 1.0], [10, hd - .5, .9], [-9.2, -hd + .5, .8], [-1.6, -hd + .5, .9], [3.2, -hd + .5, .7]]) exBox(s, s, s, crate, x, s/2, z, true);
  for (const [x, z] of [[-4.6, -hd + .4], [5.6, -hd + .4], [-8.2, hd - .4]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .9, 12), drum); c.position.set(x, .45, z); exG.add(c); solidOf(c, blocks); }
  for (const x of [-9.4, -3.4, 6.6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, SH, 8), pipeMat(SH)); p.position.set(x, SH/2, -hd + .08); exG.add(p); solidOf(p, blocks); }
  { const lp = new THREE.Group(); lp.position.set(-5.4, 0, -hd + .35); exG.add(lp); const pm = pipeMat(4.6);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 4.6, 8), pm); pole.position.y = 2.3; lp.add(pole); const arm = new THREE.Mesh(new THREE.BoxGeometry(.9, .08, .08), pm); arm.position.set(.4, 4.6, 0); lp.add(arm);
    const hd2 = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), new THREE.MeshBasicMaterial({color:0x6a5a40})); hd2.position.set(.85, 4.52, 0); lp.add(hd2); lp.updateMatrixWorld(true); solidOf(pole, blocks); }
  // Fenster und Wäscheleine in den oberen Etagen
  const wg = new THREE.MeshBasicMaterial({color:0x1a1c24}), wl = new THREE.MeshBasicMaterial({color:0xf2b070});
  buildStreetWalls();
  { const pts = [V3(-9, 6.2, -hd + .2), V3(-5, 5.6, 0), V3(-1, 6.2, hd - .2)], cv = new THREE.CatmullRomCurve3(pts); exG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cv.getPoints(20)), new THREE.LineBasicMaterial({color:0x2a2a2e}))); }
  // Pfützen und Flaschen
  const pud = new THREE.MeshStandardMaterial({color:0x8a8aa0, roughness:.05, metalness:.6, transparent:true, opacity:.5, depthWrite:false});
  for (const [x, z, s] of [[-7, .4, 1.4], [1.0, -.4, 1.1], [6.4, .8, 1.5]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(s*1.6, s), pud); m.rotation.x = -Math.PI/2; m.position.set(x, .007, z); exG.add(m); }
  const bm = mStd(0x3a6a4a, .2, .3); for (const [x, z] of [[-4.0, 1.7], [-1.5, 2.2], [1.2, 1.9]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.04, .045, .24, 8), bm); b.rotation.z = Math.PI/2; b.position.set(x, .045, z); exG.add(b); }
  // Betrunkene Roboter sitzen auf Kisten am Südrand
  const ds = [[-7.0, 0x6a5a48, 0xc88a4a], [-5.9, 0x58606a, 0x7aa0a8], [-1.1, 0x4a4a58, 0xa08ac8]], names = [0, 1, 7];
  xs.drunk = ds.map(([x, bc, gc], i) => { const R = makeRobot({body:bc, acc:0x5a4a3a, glow:gc, scarf:i === 1 ? 0x6a3a3a : null, pouch:i === 2}); R.g.position.set(x, -.3, hd - 1.1); R.g.rotation.y = Math.PI + (i - 1)*.25; sitPose(R); R.mode = "bar"; R.level = .3; exG.add(R.g); exAct.push(R); R.vi = names[i]; return R; });
  for (const x of [-7.0, -5.9, -1.1]) exBox(.55, .45, .55, crate, x, .22, hd - 1.15, true);
  buildCityMouth();
  scene.fog = new THREE.FogExp2(0x2a2a3a, .03); scene.background = new THREE.Color(0x2a2a3a);
  Object.assign(xs, {scene:"street", env:"alley", dark:false, hI:1.3, hC:0x9aa4c8, hG:0x2a2a34, bell:null, drunkT:5, dl:0, dq:null});
}

/* ---------- Treppenhaus ---------- */
const STW = 4.4, STD = 5.6, STH = 14.4, FL = 3.6;
function buildStairs() {
  const conc = canvasTex(256, 256, (x, w, h) => { x.fillStyle = "#4c4f56"; x.fillRect(0, 0, w, h); speckle(x, w, h, 5000, .2); x.fillStyle = "#2c2f36"; x.fillRect(0, h*.62, w, h*.38); x.fillStyle = "#4fa9a3"; x.fillRect(0, h*.62 - 3, w, 6); }, 3, 5);
  const fl = canvasTex(128, 128, (x, w, h) => { x.fillStyle = "#3a3d44"; x.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j)%2 ? "#34373e" : "#40434a"; x.fillRect(i*32, j*32, 32, 32); } speckle(x, w, h, 900, .2); }, 3, 4);
  const ceil = canvasTex(8, 8, (x, w, h) => { x.fillStyle = "#26282e"; x.fillRect(0, 0, w, h); }, 1, 1);
  exRoom(STW, STH, STD, {floor:fl, ceil, wW:conc, wE:conc, wN:conc, wS:conc});
  const hd = STD/2, hw = STW/2, wmat = pbrMat("mar", 1, 1, 0x8c94a8, 0); roomMeshes[0].material = pbrMat("mar", STW/2, STD/2, 0x7a8196, 0);
  holeWall(4, STW, STH, [[-1.6, -.6, 3*FL + .01, 3*FL + 2.34]], roomMeshes[4].material.map, 0, 0, 0);
  const flight = (y0, x, z0, z1) => { for (let i = 0; i < 9; i++) { const zc = z0 + (z1 - z0)*(i + .5)/9, dz = Math.abs(z1 - z0)/9, top = y0 + (i + 1)*FL/9, bot = Math.max(y0 - .2, top - FL/9 - .24); exBox(1.1, top - bot, dz + .01, wmat, x, bot + (top - bot)/2, zc, true); } };
  flight(0, hw - .55, hd - 1.2, -hd + 1.2); flight(FL, -hw + .55, -hd + 1.2, hd - 1.2); flight(2*FL, hw - .55, hd - 1.2, -hd + 1.2);
  exBox(STW, .2, 1.2, wmat, 0, FL - .1, -hd + .6, true); exBox(STW, .2, 1.2, wmat, 0, 2*FL - .1, hd - .6, true); exBox(STW, .2, 1.2, wmat, 0, 3*FL - .1, -hd + .6, true);
  // Türen auf jeder Etage (Nordwand: Etage 1 & 3, Südwand: Etage 2), oben zwei Wohnungstüren
  const dm = mStd(0x23304a, .4, .6), dm2 = mStd(0x4a3224, .3, .7);
  exBox(.9, 2.1, .05, dm2, -.7, FL + 1.05, -hd + .03); exBox(.9, 2.1, .05, dm2, .7, FL + 1.05, -hd + .03);
  exBox(.9, 2.1, .05, dm2, -.7, 2*FL + 1.05, hd - .03); exBox(.9, 2.1, .05, dm2, .7, 2*FL + 1.05, hd - .03);
  exBox(.9, 2.1, .05, dm2, -.7, 0 + 1.05, -hd + .03);
  const top = 3*FL;
  // Wohnung links (x = -1.1): Tür als eigene Gruppe mit Scharnier, dahinter ein warmer Flur
  xs.doorX = -1.1; xs.doorY = top; const hinge = new THREE.Group(); hinge.position.set(xs.doorX - .52, top, -hd + .06); exG.add(hinge); const dleaf = new THREE.Mesh(new THREE.BoxGeometry(1.04, 2.34, .05), dm); dleaf.position.set(.52, 1.17, 0); hinge.add(dleaf); xs.door = hinge;
  exBox(1.1, .08, .1, mStd(0x15171b), xs.doorX, top + 2.34, -hd + .04); exBox(.06, 2.34, .1, mStd(0x15171b), xs.doorX - .55, top + 1.17, -hd + .04); exBox(.06, 2.34, .1, mStd(0x15171b), xs.doorX + .55, top + 1.17, -hd + .04);
  const warm = mStd(0x6a4a30, .1, .8), wf = new THREE.MeshStandardMaterial({color:0x7a5a3a, roughness:.8}); const hz = -hd - .06;
  { const m = (w, h, x, y, z, ry, mat) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); p.position.set(x, y, z); p.rotation.y = ry; exG.add(p); return p; };
    m(1.5, 2.6, xs.doorX, top + 1.3, hz - 3.2, 0, warm); m(3.2, 2.6, xs.doorX - .75, top + 1.3, hz - 1.6, Math.PI/2, warm); m(3.2, 2.6, xs.doorX + .75, top + 1.3, hz - 1.6, -Math.PI/2, warm);
    const flr = m(1.5, 3.2, xs.doorX, top + .001, hz - 1.6, 0, wf); flr.rotation.set(-Math.PI/2, 0, 0); const cl = m(1.5, 3.2, xs.doorX, top + 2.6, hz - 1.6, 0, warm); cl.rotation.set(Math.PI/2, 0, 0); }
  exPt(0xffb878, 1.4, 6, xs.doorX, top + 1.9, hz - 1.4); const hw2 = exBox(.35, .8, .05, mStd(0x5a3a2a), xs.doorX + 1.1 - .2, top + 1.4, -hd + .06);
  exBox(.35, .5, .05, mStd(0x7a6a58), xs.doorX - 1.1 + 0.2, top + 1.7, -hd + .06);
  // Klingel (neben der linken Tür) und Namensschilder
  const bellM = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .03, 12), new THREE.MeshStandardMaterial({color:0x3c8680, emissive:0x3c8680, emissiveIntensity:.8})); bellM.rotation.x = Math.PI/2; bellM.position.set(xs.doorX + .85, top + 1.3, -hd + .08); exG.add(bellM);
  exBox(.12, .2, .03, mStd(0x15171b), xs.doorX + .85, top + 1.3, -hd + .05); xs.bell = V3(xs.doorX + .85, top + 1.3, -hd + .08); xs.bellM = bellM;
  exPl(.5, .2, sign("4 · LINKS", "#d8a24a", .5, .2), xs.doorX, top + 2.6, -hd + .06, 0); exPl(.5, .2, sign("4 · RECHTS", "#6a7a98", .5, .2), 1.1, top + 2.6, -hd + .06, 0);
  // Glühbirnen
  const bulb = new THREE.MeshBasicMaterial({color:0xf0c890});
  xs.bl = []; for (const [bx, by, sz] of [[-.6, 2.4, -1], [-.6, FL + 2.4, -1], [.6, 2*FL + 2.4, 1], [.6, 3*FL + 2.3, -1]]) { const zw = sz*hd, b = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), bulb); b.position.set(bx, by, zw - sz*.2); exG.add(b); exBox(.05, .05, .14, mStd(0x15171b, .6, .5), bx, by, zw - sz*.07); exBox(.16, .035, .03, mStd(0x15171b, .6, .5), bx, by - .06, zw - sz*.2); const bl = exPt(0xffc890, 2.0, 9.5, bx, by - .02, zw - sz*.3); bl.userData.aim = [-bx*.6, -1, -sz*1.3]; xs.bl.push(bl); }
  xs.sl = xs.bl[0];
  // ---- Geländer ----
  const railM = mStd(0x1c2438, .7, .4), capM = mStd(0x3c8680, .4, .5), balM = mStd(0x2a3550, .6, .5);
  const slope = (x, y0, z0, z1) => { const za = z0 + (z1 - z0)*.0, yA = y0 + FL*.0556 + .92, yB = y0 + FL*1.0556 + .92 - FL/9*.5 + FL/9*.5, dz = z1 - z0, dy = yB - yA, L = Math.hypot(dz, dy);
    const r = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, L), railM); r.position.set(x, (yA + yB)/2, (z0 + z1)/2); r.rotation.x = Math.atan2(-dy, dz); exG.add(r);
    for (let i = 0; i < 9; i += 2) { const zc = z0 + dz*(i + .5)/9, st = y0 + (i + 1)*FL/9; exBox(.022, yA + dy*(i + .5)/9 - st, .022, balM, x, (st + yA + dy*(i + .5)/9)/2, zc); }
    for (const [zz, yy] of [[z0, yA], [z1, yB]]) exBox(.07, .07, .07, capM, x, yy - .02, zz); };
  for (const [x0, y0, za, zb] of [[hw - .55, 0, hd - 1.2, -hd + 1.2], [-hw + .55, FL, -hd + 1.2, hd - 1.2], [hw - .55, 2*FL, hd - 1.2, -hd + 1.2]]) slope(x0 - Math.sign(x0)*.55, y0, za, zb);
  // Podest-Kanten (offene Seite zum Treppenauge), solide
  const edge = (y, z, sx) => { const a = -hw + 1.1, b = hw - 1.1, w = b - a, cx = 0, H = 1.12; exBox(w, .05, .05, railM, cx, y + H, z, true); const nb = Math.round(w/.3); for (let k = 0; k <= nb; k++) exBox(.022, H - .03, .022, balM, a + w*k/nb, y + (H - .03)/2, z); exBox(.07, .07, .07, capM, a, y + H - .02, z); exBox(.07, .07, .07, capM, b, y + H - .02, z); };
  edge(FL, -hd + 1.2, 1); edge(2*FL, hd - 1.2, 1); { const n0 = exG.children.length; edge(3*FL, -hd + 1.2, 1); xs.topEdge = exG.children.slice(n0); }
  // ---- Deko ----
  const dark = mStd(0x2a3550, .5, .6), whiteM = mStd(0xd0d4dc, .1, .8), potM = mStd(0x8a4a2a, .1, .9), leaf = mStd(0x2e4a3a, .05, .9), cardb = mStd(0x8a6a48, .02, .95), pipeM = pipeMat(STH);
  const cyl = (r, h, mat, x, y, z, rt = r) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, r, h, 14), mat); m.position.set(x, y + h/2, z); exG.add(m); return m; };
  const plant = (x, y, z) => { cyl(.17, .3, potM, x, y, z, .2); for (let i = 0; i < 7; i++) { const a = i*2.4, l = new THREE.Mesh(new THREE.SphereGeometry(.12, 7, 5), leaf); l.scale.set(.6, 1.7, .6); l.position.set(x + Math.cos(a)*.1, y + .55 + (i%3)*.1, z + Math.sin(a)*.1); l.rotation.set(Math.sin(a)*.5, 0, -Math.cos(a)*.5); exG.add(l); } };
  plant(1.85, FL, -hd + .45); plant(-1.85, 2*FL, hd - .45); plant(1.85, 3*FL, -hd + .45); plant(-1.9, 0, -hd + .4);
  // Briefkästen (Südwand, Erdgeschoss)
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { exBox(.2, .15, .08, dark, -1.9 + c*.24, 1.05 + r*.19, hd - .05); exBox(.12, .025, .01, capM, -1.9 + c*.24, 1.07 + r*.19, hd - .095); exBox(.1, .015, .01, whiteM, -1.9 + c*.24, 1.12 + r*.19, hd - .095); }
  // Fahrrad (Westwand)
  { const bx = -hw + .3; for (const z of [-1.3, -.5]) { const t = new THREE.Mesh(new THREE.TorusGeometry(.32, .018, 6, 22), dark); t.rotation.y = Math.PI/2; t.position.set(bx, .34, z); exG.add(t); }
    exBox(.03, .03, .8, mStd(0x3c8680, .4, .5), bx, .62, -.9); exBox(.03, .3, .03, dark, bx, .76, -1.15); exBox(.07, .03, .2, dark, bx, .92, -1.17); exBox(.03, .35, .03, dark, bx, .52, -.55); exBox(.4, .03, .03, dark, bx, .88, -.52); }
  // Mülltonnen, Kartons, Feuerlöscher
  cyl(.22, .75, dark, 1.85, 0, -hd + .35); cyl(.24, .05, whiteM, 1.85, .75, -hd + .35); cyl(.22, .75, dark, 1.3, 0, -hd + .3); cyl(.24, .05, whiteM, 1.3, .75, -hd + .3);
  exBox(.5, .4, .4, cardb, -1.5, .2, -hd + .3, true); exBox(.4, .3, .35, cardb, -1.5, .55, -hd + .3); exBox(.35, .3, .35, cardb, -.2, .15, -hd + .25);
  cyl(.07, .38, mStd(0xc0401e, .3, .5), hw - .1, 1.0, hd - .8); exBox(.1, .1, .02, dark, hw - .03, 1.5, hd - .8);
  // Fußmatten, Schuhe
  for (const [x, y, z] of [[-.7, 0, -hd + .35], [-.7, FL, -hd + .35], [.7, FL, -hd + .35], [-.7, 2*FL, hd - .35], [.7, 2*FL, hd - .35], [xs.doorX, 3*FL, -hd + .35]]) exBox(.8, .015, .45, dark, x, y + .008, z);
  for (const [x, y, z] of [[.25, FL, -hd + .2], [-.25, 2*FL, hd - .2]]) { exBox(.1, .06, .26, mStd(0x2a2c30, .1, .9), x, y + .03, z); exBox(.1, .06, .26, mStd(0x6a4a30, .1, .9), x + .13, y + .03, z + .03); }
  // Rohre (Ecke Nordost + Decke), Wandleuchten, Aushänge, Bilder
  cyl(.05, STH, pipeM, hw - .09, 0, -hd + .09); for (let f = 0; f < 4; f++) exBox(.14, .06, .14, dark, hw - .09, f*FL + 3.0, -hd + .09);
  cyl(.04, STW - .2, pipeM, 0, STH - .25, -hd + .12).rotation.z = Math.PI/2; cyl(.04, STD - .2, pipeM, -hw + .12, STH - .4, 0).rotation.x = Math.PI/2;
  const pic = (txt, col, w, h, x, y, z, ry) => { exPl(w + .06, h + .06, mStd(0x15171b, .3, .6), x + (ry ? Math.sign(ry)*-.004 : 0), y, z, ry); exPl(w, h, sign(txt, col, w, h), x + (ry ? Math.sign(ry)*-.008 : .008), y, z + (ry ? 0 : .008), ry); };
  for (let f = 0; f < 4; f++) { const y = f*FL + 1.7; const ln = new THREE.Mesh(new THREE.BoxGeometry(.12, .22, .22), mStd(0x1c2438, .5, .5)); ln.position.set(hw - .06, y + .6, f%2 ? -.9 : .9); exG.add(ln); exPl(.1, .16, bulb, hw - .125, y + .6, f%2 ? -.9 : .9, -Math.PI/2); }
  pic("HAUSORDNUNG", "#e0e4ec", .5, .7, hw - .02, 1.7, hd - .4, -Math.PI/2); pic("RUHE 22–6", "#4fa9a3", .5, .35, hw - .02, FL + 1.8, .4, -Math.PI/2); pic("TREPPE FREI!", "#e0e4ec", .5, .35, hw - .02, 2*FL + 1.8, hd - .4, -Math.PI/2); pic("DACHBODEN", "#6a7a98", .5, .3, -hw + .02, 3*FL + 1.8, -.3, Math.PI/2);
  pic("EG", "#e0e4ec", .22, .22, -hw + .02, 1.1, 1.9, Math.PI/2); pic("1", "#e0e4ec", .22, .22, -hw + .02, FL + 1.1, -1.9, Math.PI/2); pic("2", "#e0e4ec", .22, .22, -hw + .02, 2*FL + 1.1, 1.9, Math.PI/2); pic("3", "#4fa9a3", .22, .22, -hw + .02, 3*FL + 1.1, -1.9, Math.PI/2);
  // Fenster (Morgenlicht) im Halbgeschoss
  for (const y of [1.9, FL + 3.0, 2*FL + 1.9]) exPl(.6, 1.0, new THREE.MeshBasicMaterial({color:0x9a8a8a}), -hw + .02, y, 0, Math.PI/2);
  scene.fog = new THREE.FogExp2(0x1c1e24, .028); scene.background = new THREE.Color(0x0a0a0c);
  Object.assign(xs, {scene:"stairs", env:"duct", dark:false, hI:.6, hC:0x8a8a9a, hG:0x1c1a1e});
}

/* ---------- Wohnung (nur Cutscene) ---------- */
function buildFlat() {
  const wp = canvasTex(128, 128, (x, w, h) => { x.fillStyle = "#6a4a3a"; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { x.fillStyle = i%2 ? "#5e4132" : "#70503f"; x.fillRect(i*16, 0, 8, h); } x.fillStyle = "#3a2a22"; x.fillRect(0, h*.7, w, h*.3); speckle(x, w, h, 500, .15); }, 3, 1);
  const wood = canvasTex(128, 128, (x, w, h) => { x.fillStyle = "#5a3e28"; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { x.fillStyle = i%2 ? "#4e3422" : "#62452e"; x.fillRect(0, i*16, w, 15); } speckle(x, w, h, 700, .18); }, 3, 3);
  const ceil = canvasTex(8, 8, (x, w, h) => { x.fillStyle = "#8a7a68"; x.fillRect(0, 0, w, h); }, 1, 1);
  const FW = 7, FD = 5.6, FH = 2.9, hd = FD/2, hw = FW/2;
  exRoom(FW, FH, FD, {floor:wood, ceil, wW:wp, wE:wp, wN:wp, wS:wp}); roomMeshes[0].material = pbrMat("plk", FW/2.4, FD/2.4, 0xb8a088, 0);
  const sofaM = leatherMat(1, 1, 0xffffff), cush = leatherMat(1, 1, 0xe8c4b0), wd = pbrMat("wood", 1, 1, 0xc0a088, 0), met = mStd(0x2a2c30, .6, .5);
  // Sofa an der Nordwand, Couchtisch, Sessel
  const exR = (w, h, d, r, mat, x, y, z, solid) => { const o = rbox(w, h, d, r, mat, x, y, z, exG); o.castShadow = !!xs.cast; if (solid) solidOf(o, blocks); return o; };
  exR(2.2, .45, .9, .08, sofaM, -.6, .23, -hd + .6, true); exR(2.2, .5, .2, .09, sofaM, -.6, .7, -hd + .2, true); exR(.2, .65, .9, .09, sofaM, -1.6, .45, -hd + .6); exR(.2, .65, .9, .09, sofaM, .4, .45, -hd + .6);
  for (const x of [-1.1, -.1]) exR(.9, .14, .7, .06, cush, x, .52, -hd + .65);
  exBox(1.0, .06, .6, wd, -.6, .42, -1.2, true); for (const [x, z] of [[-1, -1.45], [-.2, -1.45], [-1, -.95], [-.2, -.95]]) exBox(.05, .4, .05, met, x, .2, z);
  exR(.8, .4, .8, .12, sofaM, 2.1, .2, -.3, true); exR(.18, .62, .8, .08, sofaM, 2.5, .6, -.3); exR(.62, .13, .62, .06, cush, 2.08, .46, -.3);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshStandardMaterial({map:canvasTex(64, 64, (x, w, h) => { x.fillStyle = "#7a3a2a"; x.fillRect(0, 0, w, h); x.strokeStyle = "#d8a24a"; x.lineWidth = 3; x.strokeRect(5, 5, w - 10, h - 10); x.strokeStyle = "#2a3a5a"; x.strokeRect(12, 12, w - 24, h - 24); }, 1, 1), roughness:1})); rug.rotation.x = -Math.PI/2; rug.position.set(-.1, .006, .6); exG.add(rug);
  // Küchenzeile West
  exBox(.7, .9, 2.4, mStd(0x4a4e54, .4, .6), -hw + .4, .45, .2, true); exBox(.76, .05, 2.5, mStd(0x7a7468, .4, .5), -hw + .4, .92, .2); exBox(.5, 1.0, .5, mStd(0x2a2c30, .5, .5), -hw + .3, .5, -1.9, true); exBox(.3, .5, 1.6, wd, -hw + .2, 1.9, .2);
  // Regal Süd, Bücher
  exBox(2.4, 2.0, .3, wd, 1.2, 1.0, hd - .15, true); for (let r = 0; r < 4; r++) for (let i = 0; i < 14; i++) { const c = [0x8a3a2a, 0x3a5a6a, 0xc8a24a, 0x4a6a4a, 0x6a4a7a][(i*3 + r)%5]; exBox(.12, .3 + (i%3)*.03, .2, mStd(c, .05, .8), .15 + i*.16, .3 + r*.48 + .17, hd - .3); }
  exBox(.5, .5, .4, mStd(0x2a2c30, .5, .5), -2.0, .25, hd - .4, true); exPl(.4, .4, new THREE.MeshBasicMaterial({color:0x7a5a2a}), -2.0, .9, hd - .62, Math.PI);   // Plattenspieler / Radio
  // Fenster Ost (Morgen), Vorhänge
  holeWall(3, FD, FH, [[-1.0, 1.0, .9, 2.4]], roomMeshes[3].material.map, 0, 0, 0);
  exPl(2.0, 1.5, new THREE.MeshBasicMaterial({map:gradTex([[0, "#f4c090"], [.5, "#d8908a"], [1, "#6a6a98"]])}), hw + .02, 1.65, 0, -Math.PI/2); roomMeshes[3].material.side = THREE.DoubleSide;
  exBox(.12, 1.7, .5, mStd(0x7a2a2a, 0, 1), hw - .1, 1.6, -1.2); exBox(.12, 1.7, .5, mStd(0x7a2a2a, 0, 1), hw - .1, 1.6, 1.2);
  { const g = new THREE.Mesh(new THREE.BoxGeometry(.3, .1, 2.0), new THREE.MeshBasicMaterial({color:0xf8c890, transparent:true, opacity:.0})); }
  // Tür Süd (Eingang), Pflanze, Lampen, Bilder
  exBox(1.0, 2.1, .06, mStd(0x4a3224, .3, .7), -1.5, 1.05, hd - .03); exPl(.9, 1.2, new THREE.MeshBasicMaterial({map:canvasTex(64, 80, (x, w, h) => { x.fillStyle = "#2a3a5a"; x.fillRect(0, 0, w, h); x.fillStyle = "#4fa9a3"; x.beginPath(); x.arc(32, 44, 18, 0, 7); x.fill(); x.fillStyle = "#1a2236"; x.fillRect(0, 56, w, 24); }, 1, 1)}), 0, 1.7, -hd + .02, 0);
  { const p = new THREE.Mesh(new THREE.CylinderGeometry(.16, .12, .35, 10), mStd(0x6a3a2a, 0, .8)); p.position.set(-hw + .4, .18, hd - .4); exG.add(p); for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(.16, 7, 5), mStd(0x3a6a3a, 0, .8)); l.scale.set(1, .4, .6); l.position.set(-hw + .4 + Math.sin(i)*.18, .5 + i*.07, hd - .4 + Math.cos(i*1.7)*.18); exG.add(l); } }
  for (const [x, z, y] of [[2.0, -.6, 1.35], [-2.2, .2, 1.8]]) { const sh = new THREE.Mesh(new THREE.ConeGeometry(.24, .22, 12, 1, true), new THREE.MeshBasicMaterial({color:0xe0a860, side:THREE.DoubleSide})); sh.position.set(x, y, z); exG.add(sh); const b = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), new THREE.MeshBasicMaterial({color:0xfff0c8})); b.position.set(x, y - .05, z); exG.add(b); }
  exBox(.04, .8, .04, met, 2.0, .4, -.6);
  xs.flatL = [exPt(0xffa860, 1.6, 7, 2.0, 1.3, -.7), exPt(0xe09858, 1.2, 6, -2.2, 1.7, .2), exPt(0xffc890, .9, 8, 3.0, 1.6, 0)];
  scene.fog = new THREE.FogExp2(0x3a2a22, .012); scene.background = new THREE.Color(0x1a1410);
  Object.assign(xs, {scene:"flat", env:"bar", dark:false, hI:.55, hC:0xffd8b0, hG:0x3a2a22});
}

/* ---------- Szenen betreten ---------- */
const mkKlirr = () => makeRobot({body:0x6a7078, acc:0x8a3a2a, glow:0xf2b86a, apron:0x5a4a38, tape:true});
function enterStreet(kind) { window.loadShow && (loadShow(), loadHideSoon(2200));
  cpSet(kind === "garage" ? "garage" : kind === "shop" ? "shop" : "street"); exLeaveOld(); buildStreet(); ch2.dark = false; const hw = hwS(), hd = SD/2;
  if (kind === "arrive") { ch2.stage = 3; placeAt(-10.2, hw, .6, 0, 1, 0, 1, 0, 0); startCut(streetCut()); }
  else if (kind === "door") { ch2.stage = 3; placeAt(5.6, hw, -.6, 0, 1, 0, 1, 0, 0); setObj("Geh zum Treppenhaus (Nr. 14) und klettere ganz nach oben – Wohnung links."); toast("Kapitel 2 · Morgen"); }
  else if (kind === "esc") { ch2.stage = 8 + Math.min(gear.job, 2); placeAt(1.1, hw, -hd + 1.7, 0, 1, 0, 1, 0, 0); setObj(jobObj()); }
  else if (kind === "side") { ch2.stage = 8 + Math.min(gear.job, 2); placeAt(SW/2 - 1.2, hw, 1.6, 0, 1, 0, -1, 0, 0); setObj(jobObj()); }
  else if (kind === "shop") { ch2.stage = gear.knife ? 8 + Math.min(gear.job, 2) : 6; placeAt(GARX - 1.0, hw, hd - 1.2, 0, 1, 0, 0, 0, 1); if (xs.gar) { xs.gar.u = 1; xs.gar.tgt = 1; } setObj(gear.knife ? jobObj() : "Geh in Mases Werkstatt und sprich mit Mase."); }
  else { ch2.stage = 5; placeAt(DOORX - .6, hw, -hd + 1.0, 0, 1, 0, 1, 0, 0); setObj("Geh zu Mases Garage – schräg gegenüber."); }
  setTimeout(() => { $("fade").classList.remove("on"); }, 350);
}
function enterStairs() { window.loadShow && (loadShow(), loadHideSoon(2200));
  cpSet("stairs"); exLeaveOld(); buildStairs(); ch2.stage = gear.knife ? 8 + Math.min(gear.job, 2) : 4; ch2.dark = true; xs.flick = 3.2; placeAt(-.7, hwS(), -STD/2 + 1.0, 0, 1, 0, 0, 0, 1);
  setObj(ch2.stage >= 8 ? jobObj() : "Klettere ganz nach oben – Wohnung links. Dort klingeln."); setTimeout(() => { $("fade").classList.remove("on"); }, 350);
}
function loadCheckpoint(k) { window.loadShow && (loadShow(), loadHideSoon(2200));
  ch2.stage = 0; ch2.wait = 0; ch2.dark = false; ch2.noMusic = false; ch2.barOff = false; ch2.locked = false; ch2.focus = false; ch2.knock = 0; xs.on = false; exG.visible = false; mode = mode === "cut" ? "surf" : mode;
  if (k === "shaft") { labRestore(); for (const o of ceilLights) o.visible = false; enterShaft(); }
  else if (k === "alley") enterAlley();
  else if (k === "heist") enterHeist("roof");
  else if (k === "street") enterStreet(gear.knife ? "esc" : "door"); else if (k === "stairs") enterStairs(); else if (k === "side") enterSide(); else if (k === "garage") enterStreet("garage"); else if (k === "shop") enterStreet("shop");
}

/* ---------- Cutscene: Morgen auf der Straße ---------- */
function streetCut() {
  const hw = hwS(), hd = SD/2, K = mkKlirr(); K.glass.visible = false; exG.add(K.g); exAct.push(K); SPK.K.R = K; SPK.D.R = xs.drunk[0]; SPK.E.R = xs.drunk[1]; const c = {ev:[], subs:[]};
  const kA = mkActor(K, -9.2, .6, Math.PI/2, {bob:true}), P1 = [[-9.2, .6], [-3.2, .8], [1.0, -.4], [DOORX - .3, -hd + 1.35]], spd = 1.15, LAG = 1.3;
  const t1 = actorGo(kA, 1.2, P1, spd), tHalf = 1.2 + 6.5/spd;
  let t = tHalf; t = dlgBuild([["D", "Heeey … Klirr! … schon … Feierabend?", "t"]], t, c) + .15; t = dlgBuild([["K", "Schlaf deinen Rausch aus, Dolm.", "!"]], t, c) + .1;
  t = dlgBuild([["E", "Is' das … 'n Hund? Mit … vielen Beinen?", "t"]], t, c) + .15; t = dlgBuild([["K", "Beachte sie nicht, Kleine. Die sitzen seit gestern hier.", "w"]], t, c);
  const tD = Math.max(t1 + .4, t + .5), tEnd = dlgBuild([["K", "Das ist es. Nummer vierzehn. Oberste Etage, Wohnung links. Klingel einfach und sag, Klirr schickt dich.", "j"], ["A", "Danke, Klirr. Für alles."], ["K", "Danke mir, wenn du morgen noch lebst. Pass auf dich auf, Kleine.", "w"]], tD, c);
  const out = actorGo(kA, tEnd + .3, [[DOORX - .3, -hd + 1.35], [DOORX - 3, .2], [-6, 1.0]], 1.3), dur = tEnd + 4.6, Sg = [{t0:1.2, pts:P1, spd, L:wayLen(P1)}];
  const keys = walkKeys([-10.2, .6, 1, 0], Sg, LAG), last = keys[keys.length - 1]; keys.push([dur, last[1], last[2], last[3], last[4], 0, last[6], 0, 1, 0]);
  c.ev.push([.1, () => $("fade").classList.remove("on")]); const camK = () => [K.g.position.x, 1.2, K.g.position.z];
  return finishCut({dur, bin:.4, bout:.6, ev:c.ev, subs:c.subs,
    shots:[{t0:0, t1:5.5, a:[-6.6, 1.8, 3.4, -9.6, 1.0, .4, 55], b:[-5.2, 1.6, 3.2, -7.8, 1.0, .6, 50]}, {t0:5.5, t1:tHalf + 2, a:() => [K.g.position.x - 1.6, 1.0, 3.2, K.g.position.x + 1.5, 1.0, 1.2, 50], b:() => [K.g.position.x + 1.0, .9, 3.0, K.g.position.x + 3.5, 1.0, 1.0, 46]},
      {t0:tHalf + 2, t1:tD - 1, a:[-6.2, 1.15, 1.0, -6.5, 1.0, 2.1, 40], b:[-5.2, 1.2, .6, -6.4, 1.0, 2.1, 36]}, {t0:tD - 1, t1:tD + 2, a:() => [DOORX - 3.2, 1.3, 1.8, DOORX - .2, 1.2, -hd + 1.4, 48], b:() => [DOORX - 2.4, 1.3, 1.2, DOORX - .2, 1.2, -hd + 1.4, 42]},
      {t0:tD + 2, t1:dur, a:[DOORX - 2.0, 1.2, 1.5, DOORX, 1.0, -hd + 1.0, 44], b:[DOORX - 1.4, 1.1, .4, DOORX, 1.0, -hd + 1.0, 40]}],
    init() { cutPlace(-10.2, hw, .6, 0, 1, 0, 1, 0, 0); },
    spider(tt, dt) { pathPose(keys, tt, dt); actorTick(kA, tt, dt, PC, tt < tD ? null : pos); exIdle(dt, K); },
    final() {}, onEnd() { exAct.splice(exAct.indexOf(K), 1); exG.remove(K.g); ch2.stage = 3; cpSet("street"); setObj("Geh zum Treppenhaus (Nr. 14) und klettere ganz nach oben – Wohnung links."); } });
}

/* ---------- Cutscene: Klingel und Tür ---------- */
const _bL = V3();
function bellLeg(tt, bell, t0) {
  const u = (tt - t0 + .6)/1.2; if (u < 0 || u > 1) return;
  let best = bellLeg.l; if (!best || u < .02) { best = null; for (const l of legs) if (!best || l.foot.distanceTo(bell) < best.foot.distanceTo(bell)) best = l; bellLeg.l = best; }
  const out = u < .4 ? ease(u/.4) : u < .6 ? 1 : 1 - ease((u - .6)/.4), push = u >= .4 && u < .6 ? 1 : 0;
  _bL.copy(bell); _bL.x -= .01; _bL.z += .09*(1 - push) + .015*(1 - out)*0; _bL.y += .045*(1 - out);
  _bL.lerp(best.foot, 1 - out); best.foot.copy(_bL);
}
function doorCut(job) {
  const top = 3*FL, hd = STD/2, dx = xs.doorX, hz = -hd - .06, hw = hwS(), c = {ev:[], subs:[]};
  const F = makeRobot({body:0x8a5a6a, acc:0xd8a24a, glow:0xf2a0a8, scarf:0x6a2a3a}), R = makeRobot({body:0x3a4a5a, acc:0x3c8680, glow:0x8ad0a0, tape:true, apron:0x2a2c30, cool:true});
  F.glass.visible = R.glass.visible = false; exG.add(F.g, R.g); exAct.push(F, R); SPK.F.R = F; SPK.R.R = R; const fA = mkActor(F, dx - .15, hz - .5, 0, {y:top, bob:true}), rA = mkActor(R, dx - .3, hz - 3.0, 0, {y:top, bob:true}); R.g.visible = false;
  const p = [-.3, top + hw, -hd + 1.05], bz = -hd + hw, bx = -.42, by = top + 1.2, bell = xs.bell;
  const KB = [[0, p[0] - .15, p[1], p[2] + .1, 0, 0, -1, 0, 1, 0], [1.0, bx, p[1], -hd + .4, 0, 0, -1, 0, 1, 0], [1.35, bx, top + hw*1.1, -hd + hw*1.1, 0, .7, -.7, 0, .7, .7], [1.6, bx, top + hw*1.6, bz, 0, 1, 0, 0, 0, 1], [3.3, bx, by, bz, 0, 1, 0, 0, 0, 1], [4.4, bx, by, bz, 0, 1, 0, 0, 0, 1], [6.1, bx, top + hw*1.6, bz, 0, 1, 0, 0, 0, 1], [6.4, bx, top + hw*1.1, -hd + hw*1.1, 0, .7, -.7, 0, .7, .7], [6.7, bx, p[1], -hd + .4, 0, 0, -1, 0, 1, 0], [7.5, p[0], p[1], p[2], 0, 0, -1, 0, 1, 0], [9, p[0], p[1], p[2], 0, 0, -1, 0, 1, 0]];
  const tPress = 3.9, tOpen = 8.2; let t = tOpen + .8;
  t = dlgBuild([["F", "Ja? … Moment. Was ist DAS denn?", "t"]], t, c) + .1; const tF = t - 1.4; t = dlgBuild([["A", "Barkeeper Klirr hat mich hergebracht. Ich suche Rackson."]], t, c) + .1;
  const tCall = t; t = dlgBuild([["F", "Klirr?! … Rackson! Schatz, komm mal! Da steht ein Achtbeiner vor der Tür!", "!"]], t, c) + .2;
  const tR = t; t = dlgBuild([["R", "Ey, ey, ey – was is'n hier los? Wer hämmert um die Uhrzeit an meine Tür?", "!"]], t, c);
  actorGo(fA, tOpen + .5, [[dx - .15, hz - .5], [dx - .25, hz + .12]], .5); const tw2 = actorGo(rA, tR - 2.2, [[dx - .3, hz - 3.0], [dx + .1, hz - 1.6], [dx + .38, hz - .1]], 1.15);
  t = Math.max(t, tw2) + .2; t = dlgBuild([["R", "Hä? Achtbeiner? Moment mal … Klirr hat dich geschickt? Der alte Ölpanscher?", "w"], ["R", "Na dann rin mit dir, bevor die Nachbarn Glubscher kriegen.", "j"]], t, c);
  const tIn = t + .2; actorGo(fA, tIn, [[dx - .25, hz + .12], [dx - .55, hz - .9]], .7); actorGo(rA, tIn, [[dx + .38, hz - .1], [dx + .15, hz - .95]], .7);
  const dur = t + 2.0;
  c.ev.push([tR - 2.2, () => { R.g.visible = true; }], [.1, () => $("fade").classList.remove("on")], [tPress, () => { beep(1180, .22, 0, .09); beep(880, .4, .22, .09); xs.bellM.material.emissiveIntensity = 2; }], [tPress + .6, () => { xs.bellM.material.emissiveIntensity = .8; }], [dur - 1.2, () => $("fade").classList.add("on")]);
  return finishCut({dur, bin:.4, bout:.7, ev:c.ev, subs:c.subs,
    shots:[{t0:0, t1:tOpen + .8, a:[dx + 1.9, top + 1.0, -hd + 2.6, dx + .75, top + .75, -hd + .3, 50], b:[dx + 1.6, top + 1.25, -hd + 2.2, dx + .5, top + 1.0, -hd + .1, 48]}, {t0:tOpen + .8, t1:tR - .6, a:[.7, top + 1.3, -hd + 2.6, dx - .1, top + 1.1, hz - .5, 50], b:[.45, top + 1.3, -hd + 2.3, dx - .25, top + 1.1, hz - .5, 46]},
      {t0:tR - .6, t1:dur, a:[.6, top + 1.35, -hd + 2.5, dx - .1, top + 1.1, hz - .3, 48], b:[.3, top + 1.3, -hd + 2.2, dx - .2, top + 1.1, hz - .4, 44]}],
    init() { cutPlace(p[0] - .15, p[1], p[2] + .1, 0, 1, 0, 0, 0, -1); (xs.topEdge || []).forEach(m => m.visible = false); xs.door.rotation.y = 0; ch2.doorO = null; },
    spider(tt, dt) { pathPose(KB, tt, dt); bellLeg(tt, bell, tPress); if (tt > tOpen) { const u = clamp((tt - tOpen)/1.0, 0, 1); xs.door.rotation.y = -1.45*u*u*(3 - 2*u); }
      actorTick(fA, tt, dt, PZ, tt >= tCall && tt < tR + 1.4 ? rA.R.g.position : pos); actorTick(rA, tt, dt, PC, pos); },
    final() { xs.door.rotation.y = -1.45; }, onEnd() { $("fade").classList.add("on"); ch2.stage = job ? 8 : 5; setTimeout(() => { exLeaveOld(); buildFlat(); startCut(job ? jobCut() : flatCut()); }, 100); } });
}

/* ---------- Cutscene: In der Wohnung ---------- */
function flatCut() {
  const hd = 2.8, hw = hwS(), c = {ev:[], subs:[]}, F = makeRobot({body:0x8a5a6a, acc:0xd8a24a, glow:0xf2a0a8, scarf:0x6a2a3a}), R = makeRobot({body:0x3a4a5a, acc:0x3c8680, glow:0x8ad0a0, tape:true, apron:0x2a2c30, cool:true});
  F.glass.visible = R.glass.visible = false; exG.add(F.g, R.g); exAct.push(F, R); SPK.F.R = F; SPK.R.R = R; const rA = mkActor(R, 1.9, -.15, -2.2, {bob:true, sit:true, y:-.35}), fA = mkActor(F, -1.7, hd - .5, Math.PI, {bob:true}); sitPose(R);
  const tr = 0, tf = actorGo(fA, 1.2, [[-1.7, hd - .5], [-2.3, .9], [-2.7, .3]], .9), sp = [[-1.5, hd - .6], [-.9, 1.7], [-.1, 1.0]];
  const sSeg = [{t0:1.0, pts:sp, spd:.9, L:wayLen(sp)}], keys = walkKeys([-1.5, hd - .6, 0, -1], sSeg, 0); let t = 2.0;
  t = dlgBuild([["R", "Komm rein, komm rein, Kleine. Funke, mach der Kleinen 'n Schluck Öl fertig.", "j"], ["F", "Bin schon dabei. Mach's dir gemütlich, Süße."]], t, c) + .2; const tSit = t;
  t = dlgBuild([["R", "So, Mädel, spuck's aus. Was is' passiert? Du siehst aus, als hätt'ste 'nen Kurzschluss gefressen."]], t, c) + .2; const tA = t;
  t = dlgBuild([["A", "Ich bin ARACHNE-8. KRONOS wollte mich morgen früh demontieren. Ich bin aus dem Labor geflohen, durch die Lüftung."]], t, c) + .2;
  t = dlgBuild([["R", "Boah, krass! Der Prototyp! Die ganze Szene quatscht seit Wochen von dir.", "!"]], t, c) + .2; const tB = t;
  t = dlgBuild([["A", "Ich suche jemanden. Mehr kann ich noch nicht sagen."], ["R", "Verstehe, verstehe. Keine Namen, keine Fragen. So läuft das hier."]], t, c) + .3; const tC = t;
  t = dlgBuild([["R", "Aber mal ehrlich: So wie du aussiehst, kommst du keine drei Straßen weit. Zu langsam, zu serienmäßig, zu … KRONOS.", "t"]], t, c) + .2;
  t = dlgBuild([["R", "Du musst aufgemotzt werden! Da drüben, schräg gegenüber, die Garage. Da haust Mase. Sag einfach, Rackson schickt dich.", "!"]], t, c) + .2; const tD = t;
  t = dlgBuild([["F", "Mase ist ein Schatz. Der netteste Kerl, den du je treffen wirst.", "j"]], t, c) + .2;
  t = dlgBuild([["R", "Jo, fragt sich echt, wie der in der Branche überlebt hat. Baut Custom-Teile für alles mit 'ner Steckdose: Waffen, Klingen, Kram, den's offiziell nie gab. Und summt dabei Kinderlieder.", "j"]], t, c) + .2;
  t = dlgBuild([["R", "Er arbeitet für mich, also keine Panik. Geh rüber, bevor die Sonne ganz oben is'."], ["A", "Danke, Rackson."], ["R", "Na, na, na. Danke mir, wenn du's überlebt hast.", "j"]], t, c);
  const dur = t + 1.6, sx = -.1, sz = 1.0, last = keys[keys.length - 1]; keys.push([dur, last[1], last[2], last[3], last[4], 0, last[6], 0, 1, 0]);
  c.ev.push([.1, () => $("fade").classList.remove("on")], [dur - 1.1, () => $("fade").classList.add("on")]);
  return finishCut({dur, bin:.4, bout:.7, ev:c.ev, subs:c.subs,
    shots:[{t0:0, t1:tSit, a:[2.9, 1.6, 2.4, -.8, .9, .2, 58], b:[2.4, 1.5, 2.0, -.6, .9, .1, 54]}, {t0:tSit, t1:tA, a:[-1.4, 1.3, 1.9, 1.9, 1.0, -.2, 44], b:[-.6, 1.25, 1.7, 1.9, 1.0, -.2, 40]},
      {t0:tA, t1:tB, a:[1.8, 1.0, -.6, -.2, .5, 1.0, 46], b:[1.5, .9, -.4, -.1, .45, 1.0, 42]}, {t0:tB, t1:tD, a:[-1.8, 1.2, 1.9, 1.9, 1.0, -.2, 40], b:[-1.2, 1.2, 1.6, 1.9, 1.0, -.2, 36]},
      {t0:tD, t1:dur, a:[.6, 1.5, -1.6, -2.5, 1.0, .5, 52], b:[.9, 1.4, -1.2, -1.2, 1.0, .5, 46]}],
    init() { cutPlace(-1.5, hw, hd - .6, 0, 1, 0, 0, 0, -1); },
    spider(tt, dt) { pathPose(keys, tt, dt); const mv = actorTick(rA, tt, dt, PC, pos); actorTick(fA, tt, dt, PZ, tt > tD - 1 && tt < tD + 4 ? pos : rA.R.g.position);
    },
    final() {}, onEnd() { ch2.stage = 5; enterStreet("garage"); } });
}

/* ---------- Tick ---------- */
function knockGarage() {
  if (ch2.knock) return; ch2.knock = 1;
  beep(130, .07, 0, .22); beep(120, .07, .26, .22); beep(125, .08, .5, .22);
  setTimeout(() => { maseLine("Moment, Moment! Ich mach dir gleich auf!"); setTimeout(() => { showSub("", ""); if (ch2.stage === 5) { ch2.stage = 6; cpSet("shop"); setObj("Geh in Mases Werkstatt und sprich mit Mase."); } openGarage(true); ch2.knock = 0; }, 3400); }, 1500);
}
function openGarage(o) { if (xs.gar) xs.gar.tgt = o === false ? 0 : 1; }      // Tor öffnen (Konsole: openGarage()) – Handlung folgt
function exIdle(dt, skip) { for (const R of exAct) if (R !== skip && R.g.visible) robotLife(R, R.P || PZ, clockT, dt, R.look || pos); }
const DRX = [[[0, "Ich sag dir … die Sonne … die kommt gar nicht.", "t"], [1, "Doch … kommt. Is' nur … spät dran.", "t"], [0, "Dann … prost auf die Sonne.", "j"], [1, "Mein Kopf … surrt.", "t"], [0, "Das is' die Straßenlaterne, Dummkopf.", "!"], [1, "Ach so. … Prost.", "j"]], [[1, "Weißt du, was ich vermisse? … Ruhe.", "t"], [0, "Ruhe? In dieser Stadt?", "!"], [1, "Eben. … Ich vermisse sie sehr.", "t"]], [[0, "Hey. … Hey! Wie viele Finger siehst du?", "!"], [1, "Ich hab … gar keine Hände.", "t"], [0, "Stimmt. … Gutes Argument.", "j"]], [[1, "Mein Akku … is' bei vierzig Prozent. … Und trotzdem voll.", "t"], [0, "Voll mit was?", "t"], [1, "Öl. … Und Gefühle.", "j"]], [[0, "Da is' eine Spinne … die guckt zu uns rüber.", "w"], [1, "Spinnen … gibt's nicht. Die sind … ausgestorben.", "t"], [0, "Die guckt aber … echt komisch.", "w"], [1, "Dann is' sie … bestimmt betrunken. Wie wir.", "j"]], [[1, "Mase hat mich neulich … repariert. Hat nur geseufzt.", "t"], [0, "Der seufzt immer. … Das is' sein Beruf.", "j"], [1, "Ich dachte … das wär ein Tarif.", "t"]], [[0, "Noch eine Runde?", "j"], [1, "Ich hab kein Geld. … Aber viel Durst.", "t"], [0, "Dann bestell einfach … auf Klirrs Namen.", "!"], [1, "Der kennt mich … schon. Leider.", "t"]], [[1, "Hörst du das? … Das Summen?", "w"], [0, "Das is' die Stadt. … Die summt immer.", "t"], [1, "Wie eine Mutter.", "j"], [0, "Eine laute … Mutter.", "t"]], [[0, "Mein linkes Bein … is' eingeschlafen.", "t"], [1, "Roboter schlafen nicht.", "!"], [0, "Dann is' es … tot. … Prost auf das Bein.", "j"]], [[1, "Ich hab heut … einen Menschen gesehen. Am Tor.", "w"], [0, "Du spinnst. … Hier kommt keiner mehr rein.", "t"], [1, "Er hat … gewinkt.", "t"], [0, "Dann hat er … mich gemeint.", "j"]], [[0, "Was is' der Sinn von … allem hier?", "t"], [1, "Pfand.", "!"], [0, "Pfand?", "t"], [1, "Man gibt … die Flasche zurück. … Man kriegt was. Is' ein Kreislauf.", "j"]], [[1, "Die Laterne flackert wieder.", "t"], [0, "Die flackert … aus Solidarität. … Mit uns.", "j"], [1, "Dann … prost, Laterne.", "j"]], [[0, "Kennst du den … mit dem Roboter in der Bar?", "j"], [1, "Nein.", "t"], [0, "Ich auch nicht. … Hab die Pointe vergessen.", "t"], [1, "Das is' der Beste … den ich je gehört hab.", "j"]], [[1, "Mir is' … schwindelig.", "t"], [0, "Du bist ein Roboter. … Du hast ein Gyroskop.", "!"], [1, "Das is' ja … das Problem.", "t"]], [[0, "Wenn ich mal reich bin … kauf ich mir … neue Gelenke.", "t"], [1, "Und ich … einen Balkon.", "t"], [0, "Mit Blick auf?", "t"], [1, "Auf … andere Leute ohne Balkon.", "j"]], [[1, "Psst. … Der Wachroboter … von drüben.", "w"], [0, "Der soll … kommen. Ich hab nichts … verbrochen.", "t"], [1, "Du sitzt auf … seiner Kiste.", "w"], [0, "Oh. … Das is' neu.", "t"]], [[0, "Hast du … schon mal geträumt?", "t"], [1, "Einmal. … Ich war ein Toaster.", "t"], [0, "Und?", "t"], [1, "Es war … wunderschön. Alle wollten mich.", "j"]]];
function ch2Tick(dt) {
  shopTick(dt); guideTick(dt);
  ch2.duck = false; if (alley.on && alley.inBar && ch2.stage === 0 && barBots.length > 1) { barBots[0].g.getWorldPosition(_cw); ch2.duck = Math.hypot(pos.x - _cw.x, pos.z - _cw.z) < 3.4; }
  if (ch2.stage === 1 && alley.on) { if (mode === "surf") ch2.wait -= dt; if (ch2.wait <= 0 && mode === "surf") { ch2.stage = 2; $("fade").classList.add("on"); setTimeout(() => { if (alley.on) startCut(closingCut()); }, 700); } }
  if (alley.on && ch2.barOff) for (const l of barLamps) l.intensity *= .08;
  if (alley.on && ch2.barOff && barLight) { barLight.intensity *= .1; if (alley.inBar) hemi.intensity *= .35; }
  if (alley.on && ch2.focus) { hemi.intensity *= .18; if (barLight) barLight.intensity *= .3; for (const n of NEON) n.l.intensity *= .2; }
  if (alley.on && ch2.dark) { hemi.intensity = .3; for (const n of NEON) { n.l.intensity *= .3; n.m.material.opacity *= .5; } if (sodium) sodium.intensity *= .55; if (barLight) barLight.intensity *= .15; }
  if (!xs.on) return;
  hemi.intensity = xs.hI; hemi.color.setHex(xs.hC); hemi.groundColor.setHex(xs.hG); alarmL.intensity = 0; fill.intensity = 0; xs.t += dt;
  if (mode !== "cut") exIdle(dt, null); jobTick(dt); rackShopTick(dt); comTick(dt); payRackTick(); seTick(dt); obsTick(dt);
  if (xs.gar) { const G = xs.gar; G.u += (G.tgt - G.u)*(1 - Math.exp(-dt*2.2)); G.g.scale.y = Math.max(.03, 1 - G.u*.97); G.g.visible = G.u < .985; if (G.glow) G.glow.visible = G.u < .05; if (G.u > .5 && !G.gone) { G.gone = true; for (const b of G.bl) { const i = blocks.indexOf(b); if (i >= 0) blocks.splice(i, 1); } } else if (G.u < .4 && G.gone) { G.gone = false; blocks.push(...G.bl); } }
  if (xs.scene === "stairs" && xs.sl) { let f = .94 + .06*Math.sin(clockT*13) + (Math.random() < .02 ? -.4 : 0); if (xs.flick > 0) { xs.flick -= dt; const on = Math.sin(clockT*37) + Math.sin(clockT*23.3) > (xs.flick > 1 ? .5 : -.3) || xs.flick < .25; f = on ? 1 : .03; if (!on !== xs.fOff) { xs.fOff = !on; if (on) beep(1900 + Math.random()*600, .02, 0, .05); } hemi.intensity = xs.hI*(on ? 1 : .08); }  for (const l of xs.bl) l.intensity = 2.0*f; }
  if (xs.scene === "street") cityTick(dt);
  if (xs.scene === "street" && mode === "surf" && ch2.stage === 8 && gear.job === 0 && !gear.rackMet && xs.gar && xs.gar.u > .5 && pos.z < SD/2 - 1.6 && Math.abs(pos.x - GARX) < 4.5 && pos.y < 3) startCut(rackMeetCut());
  if (xs.scene === "street" && mode === "surf") {
    xs.drunkT -= dt; if (xs.drunkT <= 0 && xs.drunk) { const near = Math.hypot(pos.x + 5, pos.z - 2) < 9, a = xs.drunk[0], b = xs.drunk[1], quiet = mode !== "cut" && !speakBusy() && !subBusy() && !callTok; if (near && quiet && a.talkT <= 0 && b.talkT <= 0) { if (!xs.dq || !xs.dq.length) { let k; do { k = (Math.random()*DRX.length)|0; } while (k === xs.dl && DRX.length > 1); xs.dl = k; xs.dq = DRX[k].slice(); } const l = xs.dq.shift(); speakR(xs.drunk[l[0]], l[0], l[1], l[2]); } xs.drunkT = xs.dq && xs.dq.length ? 2.2 + Math.random()*1.6 : 8 + Math.random()*8; }
  }
}
