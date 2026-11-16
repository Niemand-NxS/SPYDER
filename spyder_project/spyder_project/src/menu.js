
/* ======================= Kopfbewegung, Startbildschirm, Einstellungen ======================= */
const hs = {yaw:0, pitch:0, ty:0, tp:0, timer:0};
function headAnim(dt, amp) {
  hs.timer -= dt;
  if (hs.man) { hs.ty = hs.my; hs.tp = hs.mp; hs.timer = 1; amp = 1; }
  if (hs.man) {}
  else if (amp === 0) { hs.ty = hs.tp = 0; }
  else if (hs.timer <= 0) { hs.timer = .8 + Math.random()*1.8; hs.ty = (Math.random()*2 - 1)*.75*amp; hs.tp = (Math.random()*2 - 1)*.32*amp; }
  const k = 1 - Math.exp(-dt*(amp > .9 ? 5 : 3));
  hs.yaw += (hs.ty - hs.yaw)*k; hs.pitch += (hs.tp - hs.pitch)*k; headLook(hs.yaw, hs.pitch);
}
let gameStarted = false, settingsOpen = false, paused = false, menuT = 0;
const MENU_ANCHOR = V3(0, H, .4);
function stepMenu(dt) {
  menuT += dt; menuDust(dt);
  const ang = .55*Math.sin(menuT*.35) + .12*Math.sin(menuT*1.1);                     // Körper dreht sich leicht
  _nn.set(0,0,1).applyAxisAngle(UP, ang);                                            // Rücken zeigt zur Kamera
  _h.set(.06*Math.sin(menuT*.7), -1, .04*Math.sin(menuT*.5)).normalize();            // Kopf nach unten, pendelt leicht
  _p.set(MENU_ANCHOR.x, H - 1.7 + .035*Math.sin(menuT*.9), MENU_ANCHOR.z);
  poseSet(_p, _h, _nn); ropePose(dt > 0 ? dt : 10);
  _t1.set(0,.08,-1.87); spider.localToWorld(_t1);
  const pa = ropeLine.geometry.attributes.position; pa.setXYZ(0, MENU_ANCHOR.x, H, MENU_ANCHOR.z); pa.setXYZ(1, _t1.x, _t1.y, _t1.z); pa.needsUpdate = true;
}
const mDust = Array.from({length:70}, () => ({x:Math.random(), y:Math.random(), s:.4 + Math.random()*1.6, v:.004 + Math.random()*.012, p:Math.random()*6.3}));
function menuDust(dt) {
  const c = $("mdust"); if (!c || !document.body.classList.contains("menu")) return; const w = c.width = innerWidth, h = c.height = innerHeight, x = c.getContext("2d"); x.clearRect(0, 0, w, h);
  for (const d of mDust) { d.y += d.v*dt*6; d.x += Math.sin(menuT*.4 + d.p)*.0004; if (d.y > 1) { d.y = 0; d.x = Math.random(); }
    const px = (.08 + d.x*.86)*w, py = d.y*h*.86, a = Math.min(1, d.y*5)*(1 - d.y)*(.25 + .25*Math.sin(menuT + d.p)); x.fillStyle = "rgba(255,236,206," + (a*.9).toFixed(3) + ")"; x.beginPath(); x.arc(px, py, d.s, 0, 6.3); x.fill(); }
}
function menuCamera() {
  const sx = innerWidth/innerHeight > 1.1 ? .7 : 0;
  camera.up.set(0,1,0); camera.position.set(.2 + .08*Math.sin(menuT*.15), pos.y + .12 + .03*Math.sin(menuT*.2), 1.55);
  camera.lookAt(pos.x - sx*.6, pos.y - .02, pos.z);
}
let menuHid = [], menuBg = null;
function menuDark(on) {
  if (on) { menuHid = scene.children.filter(c => c.visible && !c.isLight && c !== spider && c !== ropeLine); menuHid.forEach(c => c.visible = false); menuBg = scene.background; scene.background = new THREE.Color(0x03050a); hemi.intensity = .22; hemi.color.setHex(0x8fa4d8); lamp.intensity = .9; }
  else { menuHid.forEach(c => c.visible = true); menuHid = []; if (menuBg) scene.background = menuBg; menuBg = null; }
}
let menuProps = null;
function buildMenuProps() {
  const g = new THREE.Group(), m = c => new THREE.MeshStandardMaterial({color:c, roughness:.75, metalness:.3}), add = (geo, mat, x, y, z, p) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); (p || g).add(o); return o; };
  add(new THREE.PlaneGeometry(14, 9), pbrMat("rust", 14/2.4, 9/2.4, 0x3a4668, .45), 0, 1.6, -3.4);                                         // Rückwand
  for (const [x, h] of [[-1.9, 4.5], [-.2, 4.5], [3.3, 4.5]]) { add(new THREE.CylinderGeometry(.09, .09, h, 10), pbrMat("pip", .5, h/1.4, 0xe0e0ea, .45), x, h/2 - .3, -3.2); }
  add(new THREE.CylinderGeometry(.07, .07, 14, 8).rotateZ(Math.PI/2), pbrMat("pip", .5, 6, 0xe0e0ea, .45), 0, 3.15, -2.6);        // Deckenrohr
  for (const x of [2.2, 2.5, 1.95]) add(new THREE.CylinderGeometry(.008, .008, 1.2 + x*.3, 5), m(0x05070c), x, 3.2 - (.6 + x*.15), -1.8);    // Kabel
  const scr = add(new THREE.PlaneGeometry(.9, .5), new THREE.MeshBasicMaterial({color:0x1b2c4a}), -2.9, 1.3, -3.3);             // ferner, matter Bildschirm
  add(new THREE.BoxGeometry(1.0, .6, .04), m(0x0b1020), -2.9, 1.3, -3.34);
  g.userData.scr = scr; menuProps = g; scene.add(g);
  const rim = new THREE.PointLight(0x6c88c8, .9, 7, 1.5); rim.position.set(-1.6, 2.3, -1.2); g.add(rim);
}
function enterMenu() {
  menuDark(true); if (!menuProps) buildMenuProps(); menuProps.visible = true; mode = "menu"; mann.visible = false; ropeLine.visible = true; camera.fov = 45; camera.updateProjectionMatrix();
  for (const l of legs) { l.type = false; l.stepping = false; }
  stepMenu(0); stepMenu(0);
}
let cp = "lab", loadCp = null;
function cpSet(k) { cp = k; }
let slot = 1; try { slot = Math.min(3, Math.max(1, +localStorage.getItem("spyderSlot") || 1)); } catch (e) {}
const slotKey = n => n === 1 ? "spyderSave" : "spyderSave" + n;
function readSave(n) { try { const o = JSON.parse(localStorage.getItem(slotKey(n || slot)) || "null"); return o && o.cp ? o : null; } catch (e) { return null; } }
function writeSave() { try { localStorage.setItem(slotKey(slot), JSON.stringify({v:1, cp, gear, t:Date.now()})); return true; } catch (e) { return false; } }
function refreshStartBtns() { const any = [1, 2, 3].some(n => readSave(n)); $("startBtn").querySelector("b").textContent = T(any ? "FORTSETZEN" : "START"); $("startNew").style.display = "none"; }
const CPN = {lab:"Kapitel 1 · Labor", shaft:"Kapitel 1 · Lüftungsschacht", alley:"Kapitel 2 · Gasse", street:"Kapitel 2 · CJ-City", shop:"Kapitel 2 · Werkstatt", garage:"Kapitel 2 · Werkstatt", stairs:"Kapitel 2 · Haus Nr. 14", heist:"Kapitel 2 · Kreditkontor"};
function openSlots() {
  const el = $("slots"); setPanel(el, true); const box = $("slotList"); box.innerHTML = "";
  for (let n = 1; n <= 3; n++) { const sv = readSave(n), c = document.createElement("div"); c.className = "slot" + (sv ? "" : " empty");
    const g = sv && sv.gear ? sv.gear : {}, d = sv ? new Date(sv.t || 0) : null;
    c.innerHTML = '<div class="sn">' + n + '</div><div class="si"><b></b><span></span></div><div class="sb"></div>';
    c.querySelector("b").textContent = sv ? T(CPN[sv.cp] || "Kapitel 1") : T("LEER");
    c.querySelector("span").textContent = sv ? ((g.se ? Math.round(g.se).toLocaleString("de-DE") + " SE  ·  " : "") + (d && sv.t ? d.toLocaleDateString("de-DE") + " " + d.toLocaleTimeString("de-DE", {hour:"2-digit", minute:"2-digit"}) : "")) : T("Neues Spiel beginnen");
    const sb = c.querySelector(".sb"), go = document.createElement("button"); go.className = "btn"; go.textContent = T(sv ? "WEITER" : "NEU"); go.onclick = () => { slot = n; try { localStorage.setItem("spyderSlot", n); } catch (e) {} el.classList.remove("show"); startGame(!sv); }; sb.appendChild(go);
    if (sv) { const del = document.createElement("button"); del.className = "btn ghost"; del.textContent = "✕"; del.title = T("Löschen"); let arm = 0; del.onclick = e => { e.stopPropagation(); if (!arm) { arm = 1; del.textContent = T("SICHER?"); setTimeout(() => { arm = 0; del.textContent = "✕"; }, 2500); return; } try { localStorage.removeItem(slotKey(n)); } catch (e2) {} refreshStartBtns(); openSlots(); }; sb.appendChild(del); }
    box.appendChild(c); }
}
function closeSlots() { setPanel($("slots"), false); }
function startGame(fresh) {
  if (gameStarted) return; gameStarted = true; initAudio(); lock(); const sv = fresh === true ? null : readSave(slot); loadCp = sv && sv.cp !== "lab" ? sv.cp : null; if (sv && sv.gear) Object.assign(gear, sv.gear); fixUpg(); if (fresh === true) { try { localStorage.removeItem(slotKey(slot)); } catch (e) {} }
  $("fade").classList.add("on");
  setTimeout(() => {
    menuDark(false); if (menuProps) menuProps.visible = false; reset(); mann.visible = true; ropeLine.visible = false; headLook(0, 0); hs.yaw = hs.pitch = hs.ty = hs.tp = 0;
    applyOpt(); camera.up.set(0,1,0);
    document.body.classList.remove("menu"); beginStory(); $("fade").classList.remove("on"); if (sv || loadCp) { skipCut(); tut.on = false; try { $("tut").classList.remove("on"); document.body.classList.remove("prolog"); showSub("", ""); hideCard(); } catch (e) {} } if (loadCp) { loadCheckpoint(loadCp); loadCp = null; } if (devPending) { const dp = devPending; devPending = null; skipCut(); setTimeout(() => devGo(dp), 100); }
  }, 420);
}

const OPTD = [   // [Schlüssel, Bezeichnung, min, max, Teiler, Standard, Format, Tab, Hinweis]
  ["vol","Gesamtlautstärke",0,100,100,.7,v => Math.round(v*100) + "%","TON"],
  ["music","Musik & Umgebung",0,100,100,.7,v => Math.round(v*100) + "%","TON","Stadt, Bar, Labor-Brummen"],
  ["voice","Stimmen",0,100,100,1,v => Math.round(v*100) + "%","TON","Roboter, Wissenschaftler, Lautsprecher"],
  ["reverb","Raumhall",0,150,100,1,v => Math.round(v*100) + "%","TON","Echo & Klang passen sich der Umgebung an"],
  ["alarm","Alarm",0,100,100,.6,v => Math.round(v*100) + "%","TON"],
  ["sens","Blick-Empfindlichkeit",40,250,100,1,v => v.toFixed(1) + "×","STEUERUNG"],
  ["sprint","Sprint-Tempo",60,130,100,1,v => Math.round(v*100) + "%","STEUERUNG"],
  ["dash","Automatisch zum Gegner stürmen",0,0,0,true,null,"STEUERUNG","Angriff aus der Ferne: erst heranstürmen, dann zuschlagen"],
  ["lockP","Mauszeiger sperren (Pointer Lock)",0,0,0,true,null,"STEUERUNG","Maus wird beim Klick gefangen, Vollbild wird versucht und die Knöpfe oben rechts verschwinden. Aus: Blick nur mit gedrückter Maustaste"],
  ["inv","Blick-Neigung umkehren",0,0,0,false,null,"STEUERUNG","Maus/Touch nach oben = nach unten schauen"],
  ["joyF","Joystick nur bei Berührung",0,0,0,false,null,"STEUERUNG","Versteckt; erscheint dort, wo du die linke Bildschirmhälfte berührst"],
  ["joyS","Joystick-Größe",70,160,100,1,v => Math.round(v*100) + "%","STEUERUNG"],
  ["joyO","Joystick-Deckkraft",20,100,100,1,v => Math.round(v*100) + "%","STEUERUNG"],
  ["joyDz","Joystick-Totzone",0,40,100,.12,v => Math.round(v*100) + "%","STEUERUNG","Größer = weniger Abdriften im Ruhezustand"],
  ["tbS","Größe der Touch-Tasten",70,150,100,1,v => Math.round(v*100) + "%","STEUERUNG"],
  ["vib","Vibration bei Treffern",0,0,0,true,null,"STEUERUNG","Nur auf Geräten, die das unterstützen"],
  ["steps","Schritt-Geräusche",0,150,100,1,v => Math.round(v*100) + "%","TON"],
  ["cap","Akkusparmodus (30 FPS)",0,0,0,false,null,"GRAFIK","Begrenzt die Bildrate – schont Akku und Wärme"],
  ["fov","Sichtfeld",50,95,1,60,v => Math.round(v) + "°","KAMERA","3. Person"],
  ["dist","Abstand",14,40,10,2.2,v => v.toFixed(1) + " m","KAMERA","3. Person"],
  ["shake","Kamera-Wackeln",0,150,100,1,v => Math.round(v*100) + "%","KAMERA","Beben, Aufschläge"],
  ["anim","Menü-Animationen",0,0,0,true,null,"ANZEIGE","Weiches Ein- und Ausblenden von Menüs"],
  ["subs","Untertitel",0,0,0,true,null,"ANZEIGE"],
  ["tut","Einführungs-Hinweise",0,0,0,true,null,"ANZEIGE","Kurze Tipps zu Beginn des Spiels"],
  ["subsz","Untertitel-Größe",80,160,100,1,v => Math.round(v*100) + "%","ANZEIGE"],
  ["objv","Ziel-Anzeige",0,0,0,true,null,"ANZEIGE","Aufgabenfenster oben links"],
  ["fps","FPS-Anzeige",0,0,0,false,null,"ANZEIGE"],
  ["hit","Hitboxen zeigen",0,0,0,false,null,"ANZEIGE","Auch mit Taste H"],
  ["res","Render-Auflösung",25,150,100,1,v => { const k = Math.min(devicePixelRatio, 2)*v; return Math.round(v*100) + "% · " + Math.round(innerWidth*k) + "×" + Math.round(innerHeight*k); },"GRAFIK","Pixel, die tatsächlich gerendert werden. Niedriger = flüssiger, über 100 % = schärfer"],
  ["shadows","Schatten",0,0,0,true,null,"GRAFIK"],
  ["real","Realistische Beleuchtung",0,0,0,false,null,"GRAFIK","Umgebungsreflexionen, mehr und weichere Schatten (kostet Leistung)"],
  ["refl","Reflexionen",0,0,0,false,null,"GRAFIK","Live-Reflexionen auf glänzenden Flächen und der Spinne (kostet Leistung, nur im WebGL-Modus)"],
  ["gpu","WebGPU (experimentell)",0,0,0,false,null,"GRAFIK","Gilt nach Neuladen. Bei Problemen wechselt das Spiel automatisch zurück auf WebGL"]];
const opt = {}; OPTD.forEach(d => opt[d[0]] = d[5]);
try { const o = JSON.parse(localStorage.getItem("spyderOpt") || "{}"); OPTD.forEach(d => { const k = d[0]; if (typeof d[5] === "boolean") { if (typeof o[k] === "boolean") opt[k] = o[k]; } else if (typeof o[k] === "number") opt[k] = clamp(o[k], d[2]/d[4], d[3]/d[4]); }); } catch (e) {}
function saveOpt() { try { localStorage.setItem("spyderOpt", JSON.stringify(opt)); } catch (e) {} }
let fpsN = 0, fpsT = performance.now();
(function fpsLoop() { fpsN++; const n = performance.now(); if (n - fpsT > 500) { if (opt.fps) $("fpsC").textContent = Math.round(fpsN*1000/(n - fpsT)) + " FPS"; fpsN = 0; fpsT = n; } requestAnimationFrame(fpsLoop); })();
function applyOpt() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)*opt.res); renderer.setSize(innerWidth, innerHeight); lamp.castShadow = opt.shadows; camDist = opt.dist; sndVol();
  if (!fp) { lastFov = opt.fov; camera.fov = opt.fov; camera.updateProjectionMatrix(); }
  $("sub").style.setProperty("--ss", opt.subsz); document.body.classList.toggle("noobj", !opt.objv); $("fpsC").style.display = opt.fps ? "block" : "none";
  { const st = document.documentElement.style; st.setProperty("--joyS", opt.joyS); st.setProperty("--joyO", opt.joyO); st.setProperty("--tbS", opt.tbS); document.body.classList.toggle("joyF", !!opt.joyF); document.body.classList.toggle("noAnim", !opt.anim); if (!opt.joyF) { $("joy").style.left = ""; $("joy").style.top = ""; } }
  if (!opt.lockP && document.pointerLockElement) unlockPtr();
  if (typeof hitOn !== "undefined" && hitOn !== !!opt.hit) toggleHit();
  applyReal(); try { if (applyOpt.first) { if (sessionStorage.getItem("spyderGpuFail") === "1") { opt.gpu = false; saveOpt(); setTimeout(() => toast(T("WebGPU nicht nutzbar – WebGL aktiv")), 2500); } else if (opt.gpu && !navigator.gpu) { opt.gpu = false; saveOpt(); } else if (opt.gpu !== (localStorage.getItem("spyderGpu") === "1")) localStorage.setItem("spyderGpu", opt.gpu ? "1" : "0"); }
  const w = localStorage.getItem("spyderGpu") === "1"; if (w !== !!opt.gpu) { localStorage.setItem("spyderGpu", opt.gpu ? "1" : "0"); sessionStorage.removeItem("spyderGpuFail"); if (!applyOpt.first) toast(T(opt.gpu ? (navigator.gpu ? "WebGPU wird nach dem Neuladen aktiv" : "Dieser Browser unterstützt kein WebGPU") : "WebGL wird nach dem Neuladen aktiv")); } } catch (e) {} applyOpt.first = 0;
}
applyOpt.first = 1;
let reflRT = null, reflCam = null, reflN = 0, reflT = 0, reflOn = false;
function reflApply(o) {
  if (!o.isMesh || !o.material) return; for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
    if (!m.isMeshStandardMaterial || m.userData.reO) continue; if (m.envMap && m.envMap !== envTex) continue;
    m.userData.reO = {e:m.envMap, i:m.envMapIntensity}; m.envMap = reflRT.texture; m.envMapIntensity = m === matLight ? (gear.black ? .05 : .2) : m.userData.reO.e ? m.envMapIntensity : .15 + .85*(1 - m.roughness); m.needsUpdate = true; }
}
function reflOff() { reflOn = false; scene.traverse(o => { if (!o.isMesh || !o.material) return; for (const m of (Array.isArray(o.material) ? o.material : [o.material])) { const r = m.userData.reO; if (r && reflRT && m.envMap === reflRT.texture) { m.envMap = r.e; m.envMapIntensity = r.i; m.needsUpdate = true; } delete m.userData.reO; } }); }
function reflTick(dt) {
  if (!opt.refl || window.__gpu) { if (reflOn) reflOff(); return; }
  if (!reflRT) { reflRT = new THREE.WebGLCubeRenderTarget(128, {generateMipmaps:true, minFilter:THREE.LinearMipmapLinearFilter}); reflCam = new THREE.CubeCamera(.1, 60, reflRT); scene.add(reflCam); }
  reflOn = true; reflT -= dt; if (reflT <= 0) { reflT = 1; scene.traverse(reflApply); }
  if (++reflN % 10 === 0) { reflCam.position.set(pos.x, pos.y + .5, pos.z); const sv = spider.visible; spider.visible = false; reflCam.update(renderer, scene); spider.visible = sv; renderer.setRenderTarget(null); }
}
function applyReal() {
  const on = !!opt.real; if (applyReal.on === on) return; applyReal.on = on;
  scene.environment = on ? envTex : null;
  const sz = on ? 2048 : 1024; for (const L of [torch, ...spool]) { if (L.shadow && L.shadow.mapSize.x !== sz) { L.shadow.mapSize.set(sz, sz); if (L.shadow.map) { L.shadow.map.dispose(); L.shadow.map = null; } } }
  scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (!m.envMap && m.isMeshStandardMaterial && m !== matLight) m.envMapIntensity = on ? .3 : 1; m.needsUpdate = true; }); });
}
const TABS = OPTD.map(d => d[7]).filter((t, i, a) => a.indexOf(t) === i).concat("TASTEN", "DEV"); let curTab = TABS[0];
function buildOpts() {
  const tb = $("sTabs"), box = $("optRows"); tb.innerHTML = ""; box.innerHTML = "";
  TABS.forEach(t => { const b = document.createElement("button"); b.textContent = T(t); if (t === curTab) b.className = "on"; b.onclick = () => { curTab = t; buildOpts(); }; tb.appendChild(b); });
  if (curTab === "DEV") { buildDev(box); return; }
  if (curTab === "TASTEN") { box.innerHTML = $("keysTpl").innerHTML; kmRender(box); applyLang(); return; }
  if (curTab === "ANZEIGE") { const r = document.createElement("div"); r.className = "srow sw"; r.innerHTML = '<div><label>' + T("Sprache") + '</label><small>' + T("Deutsch oder English") + '</small></div><div class="seg"><button data-l="de">DE</button><button data-l="en">EN</button></div>';
    r.querySelectorAll("button").forEach(b => { b.classList.toggle("on", b.dataset.l === LANG); b.onclick = () => setLang(b.dataset.l); }); box.appendChild(r); }
  OPTD.filter(d => d[7] === curTab).forEach(d => { const [k, lbl, mn, mx, dv, df, fmt, , hint] = d, r = document.createElement("div"), l = '<div><label for="opt_' + k + '">' + T(lbl) + '</label>' + (hint ? '<small>' + T(hint) + '</small>' : '') + '</div>';
    if (typeof df === "boolean") { r.className = "srow sw"; r.innerHTML = l + '<button class="tg' + (opt[k] ? ' on' : '') + '" id="opt_' + k + '" role="switch"></button>'; const c = r.querySelector("button"); c.onclick = () => { opt[k] = !opt[k]; c.classList.toggle("on", opt[k]); saveOpt(); applyOpt(); }; }
    else { r.className = "srow"; r.innerHTML = l + '<input type="range" id="opt_' + k + '" min="' + mn + '" max="' + mx + '"><output></output>'; const s = r.querySelector("input"), o = r.querySelector("output"); s.value = Math.round(opt[k]*dv); o.textContent = fmt(opt[k]); const pc = () => s.style.setProperty('--p', ((s.value - mn)/(mx - mn)*100) + '%'); pc();
      s.addEventListener("input", () => { pc(); opt[k] = s.value/dv; o.textContent = fmt(opt[k]); saveOpt(); applyOpt(); }); }
    box.appendChild(r); });
}
buildOpts();
$("sReset").addEventListener("click", () => { OPTD.forEach(d => opt[d[0]] = d[5]); saveOpt(); applyOpt(); buildOpts(); });
let pauseOpen = false;
function openPause() { if (pauseOpen || !gameStarted || mode === "menu") return; pauseOpen = true; paused = true; if (ac) pq(ac.suspend()); $("pNote").textContent = ""; setPanel($("pause"), true); for (const k in keys) keys[k] = false; joy.x = joy.y = 0; if (document.pointerLockElement) unlockPtr(); }
function closePause() { pauseOpen = false; paused = false; if (ac) pq(ac.resume()); setPanel($("pause"), false); lock(); }
$("pContinue").addEventListener("click", closePause);
$("pSettings").addEventListener("click", () => openSettings());
$("pSave").addEventListener("click", () => { $("pNote").textContent = T(writeSave() ? "Gespeichert …" : "Speichern nicht möglich"); setTimeout(() => location.reload(), 650); });
function openSettings() {
  if (settingsOpen) return; settingsOpen = true; setPanel($("settings"), true); if (gameStarted) { paused = true; if (ac) pq(ac.suspend()); }
  for (const k in keys) keys[k] = false; joy.x = joy.y = 0;
  if (document.pointerLockElement) unlockPtr();
}
function closeSettings() { settingsOpen = false; paused = pauseOpen; if (!paused && ac) pq(ac.resume()); setPanel($("settings"), false); }
$("setBtn").addEventListener("click", () => pauseOpen ? closePause() : openPause());
$("setClose").addEventListener("click", closeSettings);
$("settings").addEventListener("click", e => { if (e.target === $("settings")) closeSettings(); });
document.addEventListener("pointerlockchange", () => { if (!document.pointerLockElement && gameStarted && !settingsOpen && !pauseOpen && !invOpen && !comOpen && !cmapOpen && mode !== "menu") openPause(); });
refreshStartBtns();

function pq(p) { try { if (p && p.catch) p.catch(() => {}); } catch (e) {} return p; }
document.addEventListener("pointerlockchange", () => document.body.classList.toggle("plk", !!document.pointerLockElement));
function unlockPtr() { try { if (document.exitPointerLock) pq(document.exitPointerLock()); } catch (e) {} }

/* Startscreen: erste Eingabe bestimmt Eingabegerät, schaltet den Ton frei und zoomt ins X – das Weiß des Logos wird durchsichtig und enthüllt das Menü */
{ const sp = $("splash"); let done = false; window.inputMode = document.body.classList.contains("touch") ? "touch" : "keyboard"; $("spTxt").textContent = T("DRÜCKE EINE TASTE");
  const zoomReveal = () => {
    const img = sp.querySelector(".nxs"), r = img.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight, cv = document.createElement("canvas"), st = $("start");
    cv.width = W*dpr; cv.height = H*dpr; cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%"; sp.insertBefore(cv, sp.firstChild); sp.style.background = "transparent"; img.style.visibility = "hidden"; $("spTxt").style.transition = "opacity .3s"; $("spTxt").style.animation = "none"; $("spTxt").style.opacity = 0;
    const x = cv.getContext("2d"), cx = r.left + r.width/2, cy = r.top + r.height/2, w = r.width, h = r.height, T0 = performance.now(), DUR = 2600, ZM = Math.log(46), sm = (a, b, v) => { const u = Math.min(1, Math.max(0, (v - a)/(b - a))); return u*u*(3 - 2*u); };
    const frame = () => { const e = Math.min(1, (performance.now() - T0)/DUR), z = e*e*(3 - 2*e)*.55 + e*e*e*.45, s = Math.exp(ZM*z), p = sm(.12, .6, e), fo = 1 - sm(.78, 1, e);
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.clearRect(0, 0, W, H); x.fillStyle = "#03050c"; x.fillRect(0, 0, W, H);
      x.save(); x.translate(cx, cy); x.scale(s, s); x.drawImage(img, -w/2, -h/2, w, h); x.globalCompositeOperation = "destination-out"; x.globalAlpha = p; x.drawImage(img, -w/2, -h/2, w, h); x.restore();
      cv.style.opacity = fo; st.style.transform = "scale(" + (1 + .1*(1 - e)) + ")"; st.style.transformOrigin = "50% 50%";
      if (e < 1) requestAnimationFrame(frame); else { st.style.transform = ""; sp.remove(); } };
    requestAnimationFrame(frame); };
  const go = mode_ => { if (done) return; done = true; window.inputMode = mode_; if (mode_ === "touch") document.body.classList.add("touch"); else document.body.classList.remove("touch"); try { initAudio(); } catch (e) {} try { beep(70, 1.4, 0, .06); beep(140, 1.2, .1, .04); } catch (e) {} zoomReveal(); removeEventListener("keydown", kd, true); clearInterval(gpI); };
  const kd = e => { if (done) return; e.preventDefault(); e.stopImmediatePropagation(); go("keyboard"); };
  addEventListener("keydown", kd, true); sp.addEventListener("pointerdown", e => go(e.pointerType === "touch" || e.pointerType === "pen" ? "touch" : "keyboard"));
  const gpI = setInterval(() => { try { for (const g of (navigator.getGamepads ? navigator.getGamepads() : [])) if (g && (g.buttons.some(b => b.pressed) || g.axes.some(a => Math.abs(a) > .6))) go("pad"); } catch (e) {} }, 120); }


/* ======================= Tasten neu belegen ======================= */
const KB = [["fwd","Vorwärts","KeyW"],["back","Rückwärts","KeyS"],["left","Links","KeyA"],["right","Rechts","KeyD"],["jump","Sprung","Space"],["sneak","Schleichen","ShiftLeft"],["crouch","Ducken / Abseilen","ArrowDown"],["interact","Interagieren","KeyE"],["melee","Nahkampf","KeyG"],["shield","Schild (halten)","KeyF"],["map","Karte","KeyM"],["cam","Kamera wechseln","KeyV"],["pack","Backpack","KeyI"],["radio","Funk","KeyJ"],["torch","Taschenlampe","KeyT"],["photo","Foto (First Person)","Enter"]];
let KMc = {}; try { KMc = JSON.parse(localStorage.getItem("spyderKeys") || "{}") || {}; } catch (e) {}
const KMinv = {}, KMblk = new Set();
function kmBuild() { for (const k in KMinv) delete KMinv[k]; KMblk.clear(); for (const [id, , def] of KB) { const c = KMc[id] || def; if (c !== def) { KMinv[c] = def; KMblk.add(def); } } }
function kmap(c) { if (KMinv[c]) return KMinv[c]; return KMblk.has(c) ? "None" : c; }
kmBuild();
const kName = c => ({Space:"Space", ShiftLeft:"Shift", ShiftRight:"Shift", ControlLeft:"Strg", AltLeft:"Alt", ArrowUp:"↑", ArrowDown:"↓", ArrowLeft:"←", ArrowRight:"→", Enter:"Enter", Tab:"Tab", Backquote:"^"})[c] || c.replace(/^Key|^Digit/, "").replace("Numpad", "Num ");
let kmWait = null;
function kmRender(box) {
  const wrap = document.createElement("div"); wrap.className = "kmWrap";
  wrap.innerHTML = '<div class="devh">' + T("TASTEN NEU BELEGEN") + '</div>';
  for (const [id, label, def] of KB) { const r = document.createElement("div"); r.className = "srow sw"; const c = KMc[id] || def;
    r.innerHTML = '<span>' + T(label) + '</span>'; const b = document.createElement("button"); b.className = "kmBtn" + (c !== def ? " mod" : ""); b.textContent = kName(c);
    b.onclick = () => { if (kmWait) kmWait.b.textContent = kmWait.t; kmWait = {id, b, t:kName(KMc[id] || def)}; b.textContent = T("Taste drücken …"); b.classList.add("wait"); };
    r.appendChild(b); wrap.appendChild(r); }
  const rs = document.createElement("button"); rs.className = "devb"; rs.style.marginTop = "14px"; rs.textContent = T("Tasten zurücksetzen"); rs.onclick = () => { KMc = {}; try { localStorage.removeItem("spyderKeys"); } catch (e) {} kmBuild(); kmWait = null; wrap.remove(); kmRender(box); };
  wrap.appendChild(rs); box.appendChild(wrap);
}
addEventListener("keydown", e => {
  if (!kmWait) return; e.preventDefault(); e.stopImmediatePropagation(); const w = kmWait; kmWait = null;
  if (e.code === "Escape") { w.b.textContent = w.t; w.b.classList.remove("wait"); return; }
  const dflt = KB.find(a => a[0] === w.id)[2], cur = KMc[w.id] || dflt, other = KB.find(a => a[0] !== w.id && (KMc[a[0]] || a[2]) === e.code);
  if (other) KMc[other[0]] = cur;                // Konflikt: die beiden Aktionen tauschen ihre Tasten
  KMc[w.id] = e.code; for (const [id, , def] of KB) if (KMc[id] === def) delete KMc[id];
  try { localStorage.setItem("spyderKeys", JSON.stringify(KMc)); } catch (e2) {} kmBuild(); const wrap = w.b.closest(".kmWrap"), box = wrap.parentNode; wrap.remove(); kmRender(box); applyLang();
}, true);

/* ======================= Todes-Übergang ======================= */
let deathT = 0;
function showDeath(cause, fn, ms) {
  ms = ms || 2600; const el = $("dead"); clearTimeout(deathT); const bar = $("dBarI"); bar.style.transition = "none"; bar.style.width = "0";
  el.classList.add("show"); void el.offsetWidth; el.classList.add("on");
  setTimeout(() => { bar.style.transition = "width " + ((ms - 600)/1000) + "s cubic-bezier(.3,.1,.3,1)"; bar.style.width = "100%"; }, 120);
  deathT = setTimeout(() => { try { fn(); } finally { el.classList.remove("on"); setTimeout(() => el.classList.remove("show"), 480); } }, ms);
}
function buzz(ms) { if (opt.vib && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} } }
