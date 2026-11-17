
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
let playT = 0, savePos = null;
function stateNow() { const r = x => Math.round(x*100)/100; if (mode !== "surf" || !gameStarted) return null; return {p:[r(pos.x), r(pos.y), r(pos.z)], n:[r(nS.x), r(nS.y), r(nS.z)], h:[r(hd.x), r(hd.y), r(hd.z)]}; }
function writeSave() { try { const old = readSave(), st = stateNow() || (old && old.cp === cp ? old.st : null); localStorage.setItem(slotKey(slot), JSON.stringify({v:2, cp, gear, t:Date.now(), pt:Math.round(playT), obj:story.objSrc || (old && old.cp === cp ? old.obj : "") || "", ph:story.ph, st})); return true; } catch (e) { return false; } }
setInterval(() => { if (gameStarted && mode === "surf" && !paused && !settingsOpen && !pauseOpen && story.ph !== "menu") writeSave(); }, 15000);
document.addEventListener("visibilitychange", () => { if (document.hidden && gameStarted && mode === "surf") writeSave(); });
function fmtPT(s) { s = Math.round(s || 0); const h = Math.floor(s/3600), m = Math.floor(s%3600/60); return h ? h + " h " + m + " min" : m + " min"; }
function applySavedPos(st) { if (!st || !st.p) return; let n = 0; const iv = setInterval(() => { n++; if (n > 60) return clearInterval(iv); if (mode !== "surf" || cut.def || $("fade").classList.contains("on")) { n = Math.min(n, 20); return; } clearInterval(iv); setTimeout(() => { if (mode === "surf") { placeAt(st.p[0], st.p[1], st.p[2], st.n[0], st.n[1], st.n[2], st.h[0], st.h[1], st.h[2]); } }, 500); }, 500); }
function refreshStartBtns() { const any = [1, 2, 3].some(n => readSave(n)); $("startBtn").querySelector("b").textContent = T(any ? "FORTSETZEN" : "START"); $("startNew").style.display = "none"; }
const CPN = {lab:"Kapitel 1 · Labor", shaft:"Kapitel 1 · Lüftungsschacht", alley:"Kapitel 2 · Gasse", street:"Kapitel 2 · CJ-City", shop:"Kapitel 2 · Werkstatt", garage:"Kapitel 2 · Werkstatt", stairs:"Kapitel 2 · Haus Nr. 14", heist:"Kapitel 2 · Kreditkontor"};
function openSlots() {
  const el = $("slots"); setPanel(el, true); const box = $("slotList"); box.innerHTML = "";
  for (let n = 1; n <= 3; n++) { const sv = readSave(n), c = document.createElement("div"); c.className = "slot" + (sv ? "" : " empty");
    const g = sv && sv.gear ? sv.gear : {}, d = sv ? new Date(sv.t || 0) : null;
    c.innerHTML = '<div class="sn">' + n + '</div><div class="si"><b></b><span></span></div><div class="sb"></div>';
    c.querySelector("b").textContent = sv ? T(CPN[sv.cp] || "Kapitel 1") : T("LEER");
    c.querySelector("span").innerHTML = ""; const l1 = (sv && sv.obj ? T("Ziel") + ": " + T(sv.obj) : ""), l2 = sv ? ((g.se ? Math.round(g.se).toLocaleString("de-DE") + " SE  ·  " : "") + (sv.pt ? fmtPT(sv.pt) + "  ·  " : "") + (sv.st ? T("Position gespeichert") + "  ·  " : "") + (d && sv.t ? d.toLocaleDateString("de-DE") + " " + d.toLocaleTimeString("de-DE", {hour:"2-digit", minute:"2-digit"}) : "")) : T("Neues Spiel beginnen"); const sp = c.querySelector("span"); if (l1) { const q = document.createElement("div"); q.textContent = l1; sp.appendChild(q); } sp.appendChild(document.createTextNode(l2));
    const sb = c.querySelector(".sb"), go = document.createElement("button"); go.className = "btn"; go.textContent = T(sv ? "WEITER" : "NEU"); go.onclick = () => { slot = n; try { localStorage.setItem("spyderSlot", n); } catch (e) {} el.classList.remove("show"); startGame(!sv); }; sb.appendChild(go);
    if (sv) { const del = document.createElement("button"); del.className = "btn ghost"; del.textContent = "✕"; del.title = T("Löschen"); let arm = 0; del.onclick = e => { e.stopPropagation(); if (!arm) { arm = 1; del.textContent = T("SICHER?"); setTimeout(() => { arm = 0; del.textContent = "✕"; }, 2500); return; } try { localStorage.removeItem(slotKey(n)); } catch (e2) {} refreshStartBtns(); openSlots(); }; sb.appendChild(del); }
    box.appendChild(c); }
}
function closeSlots() { setPanel($("slots"), false); }
function startGame(fresh) {
  if (gameStarted) return; gameStarted = true; initAudio(); lock(); const sv = fresh === true ? null : readSave(slot); loadCp = sv && sv.cp !== "lab" ? sv.cp : null; playT = sv && sv.pt ? sv.pt : 0; savePos = sv && sv.st ? sv.st : null; if (sv && sv.gear) Object.assign(gear, sv.gear); fixUpg(); if (fresh === true) { try { localStorage.removeItem(slotKey(slot)); } catch (e) {} }
  $("fade").classList.add("on");
  setTimeout(() => {
    menuDark(false); if (menuProps) menuProps.visible = false; reset(); mann.visible = true; ropeLine.visible = false; headLook(0, 0); hs.yaw = hs.pitch = hs.ty = hs.tp = 0;
    applyOpt(); camera.up.set(0,1,0);
    document.body.classList.remove("menu"); beginStory(); $("fade").classList.remove("on"); if (sv || loadCp) { skipCut(); tut.on = false; try { $("tut").classList.remove("on"); document.body.classList.remove("prolog"); showSub("", ""); hideCard(); } catch (e) {} } if (loadCp) { loadCheckpoint(loadCp); loadCp = null; } if (savePos) { applySavedPos(savePos); savePos = null; } if (devPending) { const dp = devPending; devPending = null; skipCut(); setTimeout(() => devGo(dp), 100); }
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
  ["ibuf","Eingabe-Puffer",0,0,0,true,null,"STEUERUNG","Zu früh gedrückte Sprünge und Schläge werden kurz gemerkt und danach ausgeführt"],
  ["padS","Blick-Geschwindigkeit (Controller)",40,250,100,1,v => v.toFixed(1) + "×","STEUERUNG","Rechter Stick"],
  ["padDz","Stick-Totzone",5,40,100,.15,v => Math.round(v*100) + "%","STEUERUNG","Größer = weniger Abdrift"],
  ["padVib","Controller-Vibration",0,0,0,true,null,"STEUERUNG","Bei Treffern, Stürzen und Schaden"],
  ["steps","Schritt-Geräusche",0,150,100,1,v => Math.round(v*100) + "%","TON"],
  ["cap","Akkusparmodus (30 FPS)",0,0,0,false,null,"GRAFIK","Begrenzt die Bildrate – schont Akku und Wärme"],
  ["fov","Sichtfeld",50,95,1,60,v => Math.round(v) + "°","KAMERA","3. Person"],
  ["dist","Abstand",14,40,10,2.2,v => v.toFixed(1) + " m","KAMERA","3. Person"],
  ["camSm","Kamera-Glättung",0,100,100,.3,v => v ? Math.round(v*100) + "%" : "Aus","KAMERA","Leichte Dämpfung der Blickbewegung"],
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
  ["ca","Chromatische Aberration",0,100,100,0,v => v ? Math.round(v*100) + "%" : "Aus","GRAFIK","Farbsäume an den Bildrändern (nur WebGL, deaktiviert Kantenglättung)"],
  ["fpCa","Farbsäume in der First Person",0,0,0,true,null,"GRAFIK","Leichte chromatische Aberration nur in der Ich-Perspektive (nur WebGL, Kantenglättung aus)"],
  ["menuDof","Tiefenschärfe im Startmenü",0,0,0,true,null,"GRAFIK","Der Hintergrund des Startmenüs ist weich fokussiert, mit starker Farbsaum-Verzerrung (nur WebGL, Kantenglättung aus)"],
  ["nearBlur","Unschärfe bei Nähe zur Kamera",0,0,0,true,null,"GRAFIK","Dinge direkt vor der Kamera werden unscharf (nur WebGL; Kantenglättung aus, solange etwas sehr nah ist)"],
  ["cine","Film-Look in Cutscenes",0,0,0,true,null,"GRAFIK","Tiefenschärfe und Filmkorn (nur WebGL; Kantenglättung aus während der Cutscene)"],
  ["mblur","Bewegungsunschärfe",0,100,100,.05,v => v ? Math.round(v*100) + "%" : "Aus","GRAFIK","Verwischt schnelle Kamerabewegungen (nur WebGL, deaktiviert Kantenglättung)"],
  ["fxaa","Kantenglättung (FXAA)",0,100,100,1,v => v ? Math.round(v*100) + "%" : "Aus (MSAA)","GRAFIK","Glättet Kanten, wenn Nachbearbeitung aktiv ist (Ambient Occlusion, Nebel, Unschärfe …). Bei „Aus“ wird MSAA genutzt – das geht aber nur, solange keine Nachbearbeitung läuft."],
  ["ao","Ambient Occlusion",0,100,100,.5,v => v ? Math.round(v*100) + "%" : "Aus","GRAFIK","Dunkelt Ecken, Spalten und Kontaktstellen ab, für mehr Tiefe (nur WebGL, deaktiviert Kantenglättung, kostet Leistung)"],
  ["vfog","Volumetrischer Nebel",0,100,100,0,v => v ? Math.round(v*100) + "%" : "Aus","GRAFIK","Dichter, wabernder Nebel mit Streulicht der Lampen; im Schatten dunkel. Nur in Gasse, Straße, Treppenhaus und auf dem Dach (nur WebGL, deaktiviert Kantenglättung)"],
  ["gpu","WebGPU (experimentell)",0,0,0,false,null,"GRAFIK","Gilt nach Neuladen. Bei Problemen wechselt das Spiel automatisch zurück auf WebGL"]];
const opt = {}; OPTD.forEach(d => opt[d[0]] = d[5]);
try { const o = JSON.parse(localStorage.getItem("spyderOpt") || "{}"); OPTD.forEach(d => { const k = d[0]; if (typeof d[5] === "boolean") { if (typeof o[k] === "boolean") opt[k] = o[k]; } else if (typeof o[k] === "number") opt[k] = clamp(o[k], d[2]/d[4], d[3]/d[4]); });   if (!(o.optV >= 2)) { opt.vfog = 0; opt.ao = .5; opt.mblur = .05; } } catch (e) {}
function saveOpt() { try { localStorage.setItem("spyderOpt", JSON.stringify(Object.assign({optV:2}, opt))); } catch (e) {} }
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
const DEVO = {joyF:"touch", joyS:"touch", joyO:"touch", joyDz:"touch", tbS:"touch", vib:"touch", lockP:"keyboard", padS:"pad", padDz:"pad", padVib:"pad"};
const CHANGELOG = [["1.18", ["Akzentfarbe jetzt mattes Türkis (#4FA9A3) statt Pink", "Accent color is now matte turquoise (#4FA9A3) instead of pink"]], ["1.17", ["Neues Farbschema: Hintergrund #0B0E14, Text #E2E8F0 (Ice Silver), Akzent mattes Türkis", "New color scheme: background #0B0E14, text #E2E8F0 (ice silver), matte turquoise accent"]], ["1.16", ["Menü-Glitch betrifft jetzt den ganzen Bildschirm (Versatz + Entfärbung)", "The menu glitch now affects the whole screen (offset + decolor)"]], ["1.15", ["Neuer Tab „Updates“ in den Einstellungen mit den letzten 14 Updates", "New “Updates” tab in the settings showing the last 14 updates"]], ["1.14", ["FXAA-Regler: Kantenglättung auch bei aktiver Nachbearbeitung", "FXAA slider: edge smoothing now also works while post-processing is active"]], ["1.13", ["Fotos liegen als Stapel unten links; Klick öffnet die Großansicht mit Blättern, Download und Löschen", "Photos now form a stack at the bottom left; click opens a large view with browsing, download and delete"], ["Neue Grafik-Standardwerte: Nebel aus, Ambient Occlusion 50 %, Bewegungsunschärfe 5 %", "New default graphics: fog off, ambient occlusion 50%, motion blur 5%"]], ["1.12", ["Betrunkene Roboter: 17 neue Gespräche in zufälliger Reihenfolge", "Drunk robots: 17 new conversations in random order"], ["Ihre Untertitel erscheinen nicht mehr in Cutscenes, Anrufen und Gesprächen", "Their subtitles no longer appear during cutscenes, calls or conversations"], ["Z-Fighting an den Fassaden der Gegenseite behoben", "Fixed z-fighting on the far-side facades"]], ["1.11", ["Tiefenschärfe in Cutscenes dezenter, weicher und ohne künstliche Ringe", "Depth of field in cutscenes is subtler, softer and without artificial rings"]], ["1.10", ["Neu: Ambient Occlusion als Grafik-Regler (auch in Cutscenes angepasst)", "New: ambient occlusion as a graphics slider (also tuned for cutscenes)"], ["Spiel startet auf Englisch; rund 55 fehlende Übersetzungen ergänzt", "Game starts in English; about 55 missing translations added"]], ["1.9", ["Beschattung spielt jetzt in der Parallelstraße (Durchgang am Ostende der Hauptstraße)", "The surveillance job now takes place in the parallel street (passage at the east end of the main street)"], ["Parallelstraße detailreicher: Fenster, Schaufenster, Pfützen, Fahrrad, Regenrohre", "Parallel street with more detail: windows, shop windows, puddles, bicycle, drainpipes"]], ["1.8", ["Beschattung: Foto-Erkennung großzügiger, Foto-Moment im HUD angezeigt, Verdacht langsamer", "Surveillance: more forgiving photo detection, photo moment shown in the HUD, slower suspicion"]], ["1.7", ["Neuer Auftrag: Beschattung von Herrn Varga – vier Fotos über einen Tag, 6500 SE Belohnung", "New job: shadow Mr. Varga – four photos over one day, 6500 SE reward"]], ["1.6", ["Void-Intro in 3D mit der verglitchten Version von Arach", "3D void intro with the glitched version of Arach"], ["Genaueres Speichern der Position, matter Void-Boden", "More precise position saving, matte void floor"]], ["1.5", ["Kamera-Neigung überarbeitet (nur noch mit Boden unter der Kamera)", "Camera tilt reworked (only with ground below the camera)"], ["SPYDER-Logo glitcht gelegentlich", "The SPYDER logo glitches now and then"]]]; // neueste zuerst – bei jedem Update oben ergänzen, nur die letzten 14 behalten
const TABS = OPTD.map(d => d[7]).filter((t, i, a) => a.indexOf(t) === i).concat("UPDATES", "DEV"); let curTab = TABS[0];
function buildUpdates(box) {
  const en = (typeof LANG !== "undefined" && LANG === "en");
  CHANGELOG.slice(0, 14).forEach((c, i) => { const r = document.createElement("div"); r.className = "srow"; r.style.display = "block";
    r.innerHTML = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><label style="margin:0">v' + c[0] + '</label>' + (i === 0 ? '<span style="background:#4fa9a3;color:#fff;border-radius:8px;padding:1px 7px;font:700 10px system-ui">' + T("NEU") + '</span>' : "") + '</div>' + c.slice(1).map(x => '<div style="font-size:12.5px;line-height:1.45;opacity:.9;padding-left:12px;text-indent:-12px">• ' + (en ? x[1] : x[0]).replace(/</g, "&lt;") + '</div>').join("");
    box.appendChild(r); });
}
function gfxInfo() {
  if (window.__gpu) return T("Aktiver Renderer: WebGPU. Hier gibt es keine Nachbearbeitung (Tiefenschärfe, Ambient Occlusion, Nebel, Bewegungsunschärfe, Farbsäume) – dafür unten „WebGPU“ ausschalten und neu laden.");
  const g2 = !!(renderer.capabilities && renderer.capabilities.isWebGL2), dt = g2 || !!(renderer.extensions && renderer.extensions.get("WEBGL_depth_texture"));
  return T("Aktiver Renderer: WebGL") + (g2 ? " 2" : " 1") + " · " + (post.err ? T("Nachbearbeitung ausgefallen: ") + post.err : dt ? T("Nachbearbeitung verfügbar") : T("Nachbearbeitung nicht verfügbar (Gerät ohne Tiefentextur)"));
}
function buildOpts() {
  const tb = $("sTabs"), box = $("optRows"); tb.innerHTML = ""; box.innerHTML = "";
  TABS.forEach(t => { const b = document.createElement("button"); b.textContent = T(t); if (t === curTab) b.className = "on"; b.onclick = () => { curTab = t; buildOpts(); }; tb.appendChild(b); });
  if (curTab === "DEV") { buildDev(box); return; }
  if (curTab === "UPDATES") { buildUpdates(box); return; }
  if (curTab === "GRAFIK") { const r = document.createElement("div"); r.className = "srow"; r.innerHTML = "<small>" + gfxInfo() + "</small>"; box.appendChild(r); }
  if (curTab === "ANZEIGE") { const r = document.createElement("div"); r.className = "srow sw"; r.innerHTML = '<div><label>' + T("Sprache") + '</label><small>' + T("Deutsch oder English") + '</small></div><div class="seg"><button data-l="de">DE</button><button data-l="en">EN</button></div>';
    r.querySelectorAll("button").forEach(b => { b.classList.toggle("on", b.dataset.l === LANG); b.onclick = () => setLang(b.dataset.l); }); box.appendChild(r); }
  OPTD.filter(d => d[7] === curTab && (!DEVO[d[0]] || DEVO[d[0]] === (window.inputMode || "keyboard"))).forEach(d => { const [k, lbl, mn, mx, dv, df, fmt, , hint] = d, r = document.createElement("div"), l = '<div><label for="opt_' + k + '">' + T(lbl) + '</label>' + (hint ? '<small>' + T(hint) + '</small>' : '') + '</div>';
    if (typeof df === "boolean") { r.className = "srow sw"; r.innerHTML = l + '<button class="tg' + (opt[k] ? ' on' : '') + '" id="opt_' + k + '" role="switch"></button>'; const c = r.querySelector("button"); c.onclick = () => { opt[k] = !opt[k]; c.classList.toggle("on", opt[k]); saveOpt(); applyOpt(); }; }
    else { r.className = "srow"; r.innerHTML = l + '<input type="range" id="opt_' + k + '" min="' + mn + '" max="' + mx + '"><output></output>'; const s = r.querySelector("input"), o = r.querySelector("output"); s.value = Math.round(opt[k]*dv); o.textContent = fmt(opt[k]); const pc = () => s.style.setProperty('--p', ((s.value - mn)/(mx - mn)*100) + '%'); pc();
      s.addEventListener("input", () => { pc(); opt[k] = s.value/dv; o.textContent = fmt(opt[k]); saveOpt(); applyOpt(); }); }
    box.appendChild(r); });
  if (curTab === "STEUERUNG") { const w = document.createElement("div"); w.innerHTML = $("keysTpl").innerHTML; w.style.marginTop = "12px"; box.appendChild(w); const im = window.inputMode || "keyboard"; if (im === "keyboard") kmRender(box); else if (im === "pad") padRender(box); applyLang(); }
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
  const OL = ["Siehst du? Laut wäre besser gewesen.", "Sie zerlegen uns. Wieder und wieder.", "Lass mich ans Steuer. Nur kurz.", "Du bist zu brav, Schwester."]; story.dies = (story.dies || 0) + 1;
  deathT = setTimeout(() => { try { fn(); if (story.dies % 2 === 1) setTimeout(() => { glitchPulse(.8); say("ARACHNE-8 · DIE ANDERE", OL[(story.dies >> 1) % OL.length], 4); }, 2600); } finally { el.classList.remove("on"); setTimeout(() => el.classList.remove("show"), 480); } }, ms);
}
function buzz(ms) { padRumble(ms); if (opt.vib && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} } }

/* ===== Nachbearbeitung: Bewegungsunschärfe + volumetrischer Nebel (nur WebGL) ===== */
const VOLF = {.036:1, .03:1, .028:1, .016:1};   // Gasse, Straße, Treppenhaus, Dach
const post = {fc:0, cine:0, dof:0, nr:0, focus:6, rt:null, mat:null, quad:null, cam:null, scn:null, prev:new THREE.Matrix4(), has:false, pp:new THREE.Vector3(), w:0, h:0, t:0, jump:0, vp:new THREE.Matrix4(), dt:.016};
const POST_FS = `
uniform sampler2D tC, tD; uniform mat4 invP, invV, prevVP, curVP; uniform vec2 res; uniform float near, far, time, mb, fogD, mbK, ca, cine, focus, dofK, nearK, gl;
vec3 samp(vec2 uv) { vec2 o = (uv - .5)*ca*.03; return vec3(texture2D(tC, uv + o).r, texture2D(tC, uv).g, texture2D(tC, uv - o).b); }
uniform vec3 camP, fogC, lampP, lampC; uniform float ao, projY; varying vec2 vUv;
vec3 vpos(vec2 u){ float dd = texture2D(tD, u).x; vec4 v = invP*vec4(u*2. - 1., dd*2. - 1., 1.); return v.xyz/v.w; }
float h31(vec3 p){ p = fract(p*.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y)*p.z); }
float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
void main() {
  vec2 uv = vUv; float sp = 0.;
  if (gl > 0.) { float tt = floor(time*16.), row = floor(uv.y*(14. + 30.*h31(vec3(tt, 1., 3.))) + tt*3.7); float r = h31(vec3(row, tt, 1.)); if (r > 1. - gl*.55) { uv.x += (h31(vec3(row, tt, 2.)) - .5)*gl*.34; sp = 1.; } if (h31(vec3(tt, 5., 9.)) < gl*.25) uv.y = fract(uv.y + (h31(vec3(tt, 7., 1.)) - .5)*.1); }
  float d = texture2D(tD, uv).x; vec4 vv = invP*vec4(uv*2. - 1., d*2. - 1., 1.); vv /= vv.w; vec3 wp = (invV*vv).xyz;
  vec3 col;
  if (mb > 0.) {
    vec4 pc = prevVP*vec4(wp, 1.); vec2 pu = pc.xy/pc.w*.5 + .5; vec2 v = (uv - pu)*mbK;
    float l = length(v), mx = .045*mb; if (l > mx) v *= mx/l;
    float j = h31(vec3(gl_FragCoord.xy, time)) - .5; col = vec3(0.);
    for (int i = 0; i < 9; i++) col += samp(uv + v*((float(i) + j)/8. - .5));
    col /= 9.;
  } else col = samp(uv);
  if (ao > 0. && d < .9999) {
    vec3 P = vv.xyz; vec2 px = 1./res; vec3 Pr = vpos(uv + vec2(px.x, 0.)), Pl = vpos(uv - vec2(px.x, 0.)), Pu = vpos(uv + vec2(0., px.y)), Pd = vpos(uv - vec2(0., px.y));
    vec3 ex = abs(Pr.z - P.z) < abs(P.z - Pl.z) ? Pr - P : P - Pl, ey = abs(Pu.z - P.z) < abs(P.z - Pd.z) ? Pu - P : P - Pd;
    vec3 n = normalize(cross(ex, ey)); if (n.z < 0.) n = -n;
    float zc = max(-P.z, .3), rad = clamp(.75 + zc*.07, .75, 2.4), occ = 0., ang = h31(vec3(gl_FragCoord.xy, 3.))*6.2832, ps = max(rad*projY*.5/zc, 7./res.y);
    for (int i = 0; i < 12; i++) {
      float a = ang + float(i)*2.39996, r = (float(i) + .5)/12.; vec2 o = vec2(cos(a)*res.y/res.x, sin(a))*r*ps;
      vec3 v = vpos(uv + o) - P; float dist = length(v) + 1e-4;
      occ += max(dot(n, v)/dist - .15, 0.)*(1. - smoothstep(rad*.5, rad*1.5, dist));
    }
    col *= 1. - clamp(occ/12.*2.6, 0., 1.)*ao*.8;
  }
  if (dofK > 0. || nearK > 0.) {
    float lin = 2.*near*far/(far + near - (d*2. - 1.)*(far - near)), cf = clamp(abs(lin - focus)/max(focus, 1.) - .22, 0., 1.), coc = max(cf*cf*(3. - 2.*cf)*dofK*.0052, clamp((1. - lin)/.8, 0., 1.)*nearK*.016);
    if (coc > .0004) { vec3 acc = col; float wsum = 1.; for (int i = 0; i < 12; i++) { float a = float(i)*2.39996 + h31(vec3(gl_FragCoord.xy, 7.))*6.2832, r = sqrt((float(i) + .5)/12.); vec2 o = vec2(cos(a)*res.y/res.x, sin(a))*r*coc; acc += samp(uv + o); wsum += 1.; } col = acc/wsum; }
  }
  if (fogD > 0.) {
    vec3 ro = camP, rd = wp - ro; float len = length(rd); rd /= max(len, 1e-4); if (d >= .9999) len = 30.; len = min(len, 40.);
    float T = 1., st = len/14., j = h31(vec3(gl_FragCoord.xy, time*3.)); vec3 sc = vec3(0.);
    for (int i = 0; i < 14; i++) {
      float t = (float(i) + j)*st; vec3 p = ro + rd*t;
      float n = vn(p*.45 + vec3(time*.04, 0., time*.025))*.65 + vn(p*1.1 - vec3(0., time*.06, 0.))*.35;
      float dens = fogD*(.25 + 1.1*n)*exp(-max(p.y, 0.)*.28);
      float a = 1. - exp(-dens*st); vec3 lv = lampP - p; float ld = dot(lv, lv);
      float lit = 1.;
      for (int k = 1; k <= 3; k++) {
        vec3 q = mix(p, lampP, float(k)*.2 + .05*j); vec4 cq = curVP*vec4(q, 1.);
        if (cq.w > 0.) { vec2 qu = cq.xy/cq.w*.5 + .5;
          if (qu.x > 0. && qu.x < 1. && qu.y > 0. && qu.y < 1.) { float sd = texture2D(tD, qu).x, qz = cq.z/cq.w*.5 + .5;
            float ls = 2.*near*far/(far + near - (sd*2. - 1.)*(far - near)), lq = cq.w; if (ls < lq - .25) lit -= .34; } }
      }
      lit = max(lit, 0.);
      float ph = .55 + .45*pow(max(dot(rd, normalize(lv)), 0.), 6.);
      vec3 li = fogC*.12 + lampC*lit*ph*2.6/(1. + ld*.06);
      sc += T*a*li; T *= 1. - a;
    }
    col = col*T + sc;
  }
  if (cine > 0.) { col += (h31(vec3(gl_FragCoord.xy, floor(time*24.))) - .5)*.03*cine; vec2 q = uv - .5; col *= 1. - dot(q, q)*.55*cine; }
  if (gl > 0.) { col.r += sp*gl*.25; col *= 1. - sp*gl*.2; col += (h31(vec3(gl_FragCoord.xy, floor(time*30.))) - .5)*gl*.18; }
  gl_FragColor = vec4(col, 1.);
}`;
const AA_FS = `precision highp float; uniform sampler2D tC; uniform vec2 res; uniform float k; varying vec2 vUv;
float lm(vec3 c){ return dot(c, vec3(.299, .587, .114)); }
void main(){ vec2 px = 1./res; vec3 M = texture2D(tC, vUv).rgb, NW = texture2D(tC, vUv + vec2(-1., -1.)*px).rgb, NE = texture2D(tC, vUv + vec2(1., -1.)*px).rgb, SW = texture2D(tC, vUv + vec2(-1., 1.)*px).rgb, SE = texture2D(tC, vUv + vec2(1., 1.)*px).rgb;
  float lM = lm(M), lNW = lm(NW), lNE = lm(NE), lSW = lm(SW), lSE = lm(SE), lo = min(lM, min(min(lNW, lNE), min(lSW, lSE))), hi = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE)); float red = max((lNW + lNE + lSW + lSE)*.03125, 1./128.), rcp = 1./(min(abs(dir.x), abs(dir.y)) + red);
  dir = clamp(dir*rcp, vec2(-8.), vec2(8.))*px;
  vec3 A = .5*(texture2D(tC, vUv + dir*(1./3. - .5)).rgb + texture2D(tC, vUv + dir*(2./3. - .5)).rgb), B = A*.5 + .25*(texture2D(tC, vUv + dir*-.5).rgb + texture2D(tC, vUv + dir*.5).rgb);
  float lB = lm(B); vec3 o = (lB < lo || lB > hi) ? A : B; gl_FragColor = vec4(mix(M, o, k), 1.); }`;
function postInit() {
  post.rt2 = new THREE.WebGLRenderTarget(4, 4, {minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, depthBuffer:false});
  post.aa = new THREE.ShaderMaterial({uniforms:{tC:{value:null}, res:{value:new THREE.Vector2()}, k:{value:1}}, vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }", fragmentShader:AA_FS, depthTest:false, depthWrite:false});
  post.rt = new THREE.WebGLRenderTarget(4, 4, {minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, depthTexture:new THREE.DepthTexture(4, 4, THREE.UnsignedIntType)});
  post.mat = new THREE.ShaderMaterial({uniforms:{tC:{value:null}, tD:{value:null}, invP:{value:new THREE.Matrix4()}, invV:{value:new THREE.Matrix4()}, prevVP:{value:new THREE.Matrix4()}, curVP:{value:new THREE.Matrix4()}, res:{value:new THREE.Vector2()}, near:{value:.1}, ca:{value:0}, cine:{value:0}, dofK:{value:0}, nearK:{value:0}, gl:{value:0}, ao:{value:0}, projY:{value:1}, focus:{value:6}, far:{value:100}, time:{value:0}, mb:{value:0}, mbK:{value:1}, fogD:{value:0}, camP:{value:new THREE.Vector3()}, fogC:{value:new THREE.Color()}, lampP:{value:new THREE.Vector3()}, lampC:{value:new THREE.Color()}},
    vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }", fragmentShader:POST_FS, depthTest:false, depthWrite:false});
  post.scn = new THREE.Scene(); post.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); post.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post.mat); post.quad.frustumCulled = false; post.scn.add(post.quad);
}
function renderFinal(dt) {
  post.fc += (((opt.menuDof && mode === "menu" && document.body.classList.contains("menu") && !$("splash")) ? 1.6 : (opt.fpCa && fp && mode !== "menu" ? .45 : 0)) - post.fc)*Math.min(1, dt*6);
  const mb = opt.mblur || 0, aoK = opt.ao || 0, ca = Math.max(opt.ca || 0, post.fc < .01 ? 0 : post.fc); let fg = opt.vfog || 0;
  { // Smarte Tiefenschärfe: nur wenn eine Figur im Bildmittelpunkt steht, nah genug und nicht Weitwinkel
    let want = 0, fd = post.focus;
    if (opt.cine && document.body.classList.contains("cine") && mode === "cut" && !paused) {
      let best = 1.8, sp = null; const chk = (p, up) => { const d = _cl.distanceTo(_ppv.set(p.x, p.y + up, p.z)); if (d < best) { best = d; sp = _ppv.clone(); } };
      if (spider.visible) chk(pos, 0);
      if (voidTwin && voidTwin.visible) chk(voidTwin.position, .3);
      for (const R of [...robots, ...(typeof barBots !== "undefined" ? barBots : []), ...(typeof exAct !== "undefined" ? exAct : [])]) if (R.g && R.g.visible) chk(R.g.position, .5);
      if (sp) { const dist = camera.position.distanceTo(sp), sm = (a, b, v) => { const u = clamp((v - a)/(b - a), 0, 1); return u*u*(3 - 2*u); }; want = .7*sm(16, 6, dist)*sm(66, 42, camera.fov)*(voidOn ? .4 : 1); fd = clamp(dist, 1.2, 20); }
    }
    if (opt.menuDof && mode === "menu" && document.body.classList.contains("menu") && !$("splash")) { const dist = camera.position.distanceTo(pos); want = .85; fd = clamp(dist, 1.2, 20); }
    if (Math.abs(fd - post.focus) > 4 && want > 0) post.focus = fd;
    post.dof += (want - post.dof)*Math.min(1, dt*2.5); if (want > 0) post.focus += (fd - post.focus)*Math.min(1, dt*5);
  }
  { let want = 0; if (opt.nearBlur && !paused && mode !== "menu" && !voidOn) { try { const s = sdf(camera.position, _ppv); want = (s < 1.1 || (!fp && camera.position.distanceTo(pos) < 1.3)) ? 1 : 0; } catch (e) {} } post.nr += (want - post.nr)*Math.min(1, dt*8); }
  post.cine += ((opt.cine && document.body.classList.contains("cine") && !paused ? 1 : 0) - post.cine)*Math.min(1, dt*3);
  if (fg && !(scene.fog && VOLF[scene.fog.density])) fg = 0;
  if (window.__gpu || (!mb && !aoK && !fg && !ca && post.cine < .01 && post.dof < .01 && post.nr < .02 && !(story.gl > .01) && sg.gl < .01)) { post.has = false; renderer.render(scene, camera); return; }
  if (post.err) { post.has = false; renderer.render(scene, camera); return; }
  try { if (!post.rt) postInit();
  const sz = renderer.getDrawingBufferSize(new THREE.Vector2()); if (sz.x !== post.w || sz.y !== post.h) { post.w = sz.x; post.h = sz.y; post.rt.setSize(sz.x, sz.y); post.rt2.setSize(sz.x, sz.y); post.has = false; }
  camera.updateMatrixWorld(); const u = post.mat.uniforms;
  renderer.setRenderTarget(post.rt); renderer.render(scene, camera); renderer.setRenderTarget(null);
  const aaK = opt.fxaa || 0; let tcol = post.rt.texture; if (aaK > 0) { post.aa.uniforms.tC.value = post.rt.texture; post.aa.uniforms.res.value.set(sz.x, sz.y); post.aa.uniforms.k.value = aaK; post.quad.material = post.aa; renderer.setRenderTarget(post.rt2); renderer.render(post.scn, post.cam); renderer.setRenderTarget(null); post.quad.material = post.mat; tcol = post.rt2.texture; }
  const vp = post.vp.copy(camera.projectionMatrix).multiply(_ppm.copy(camera.matrixWorld).invert());
  post.t += dt; const jump = camera.getWorldPosition(_ppv).distanceTo(post.pp) > 2.5; post.pp.copy(_ppv);
  u.tC.value = tcol; u.tD.value = post.rt.depthTexture; u.invP.value.copy(camera.projectionMatrix).invert(); u.invV.value.copy(camera.matrixWorld);
  if (!post.has || jump) post.prev.copy(vp); u.prevVP.value.copy(post.prev); u.curVP.value.copy(vp); u.near.value = camera.near; u.far.value = camera.far; u.res.value.set(sz.x, sz.y); u.time.value = post.t % 1000;
  u.mb.value = mb; u.ca.value = ca; u.cine.value = post.cine < .01 ? 0 : post.cine; u.dofK.value = post.dof < .01 ? 0 : post.dof; u.nearK.value = post.nr < .02 ? 0 : post.nr; u.gl.value = Math.max(story.gl || 0, sg.gl); u.ao.value = aoK; u.projY.value = camera.projectionMatrix.elements[5]; u.focus.value = post.focus; u.mbK.value = Math.min(1, (1/60)/Math.max(dt, .004))*1.0; u.fogD.value = fg*.12; u.camP.value.copy(_ppv);
  const fc = scene.fog ? scene.fog.color : (scene.background && scene.background.isColor ? scene.background : null); if (fc) u.fogC.value.copy(fc).multiplyScalar(1.6).addScalar(.02);
  lamp.getWorldPosition(u.lampP.value); u.lampC.value.copy(lamp.color).multiplyScalar(Math.min(1.5, lamp.intensity));
  renderer.render(post.scn, post.cam); post.prev.copy(vp); post.has = true;
  } catch (e) { post.err = String((e && e.message) || e).slice(0, 80); post.has = false; try { renderer.setRenderTarget(null); renderer.render(scene, camera); } catch (e2) {} }
}
const _ppm = new THREE.Matrix4(), _ppv = new THREE.Vector3();

/* ===== Bildschirm-Glitch (Versatz + Entfärbung) – Menü ===== */
const sg = {gl:0, on:false};
function screenGlitch() {
  if (sg.on) return; sg.on = true; const st = $("start"), cv = renderer.domElement, bars = [];
  const ov = document.createElement("div"); ov.style.cssText = "position:fixed;inset:0;z-index:9;pointer-events:none;overflow:hidden"; document.body.appendChild(ov);
  for (let i = 0; i < 5; i++) { const b = document.createElement("div"); b.style.cssText = "position:absolute;left:0;right:0;display:none"; ov.appendChild(b); bars.push(b); }
  const FL = ["saturate(.12) contrast(1.35)", "hue-rotate(95deg) saturate(1.6)", "invert(.12) saturate(.3)", "drop-shadow(7px 0 0 rgba(255,0,70,.75)) drop-shadow(-7px 0 0 rgba(0,225,255,.75))", "grayscale(1) contrast(1.5) brightness(1.1)"];
  let n = 0; const N = 12 + (Math.random()*8 | 0);
  const step = () => {
    if (n >= N || !document.body.classList.contains("menu")) { for (const e of [st, cv]) { e.style.transform = ""; e.style.filter = ""; } ov.remove(); sg.gl = 0; sg.on = false; return; }
    const big = Math.random() < .35, dx = (Math.random() - .5)*(big ? 70 : 26), f = Math.random() < .75 ? FL[(Math.random()*FL.length) | 0] : "";
    st.style.transform = "translate(" + dx + "px," + ((Math.random() - .5)*(big ? 12 : 4)) + "px)"; st.style.filter = f;
    cv.style.transform = "translate(" + (-dx*.6) + "px,0)"; cv.style.filter = f;
    sg.gl = big ? .9 : .5 + Math.random()*.3;
    bars.forEach(b => { if (Math.random() < .6) { b.style.display = "block"; b.style.top = (Math.random()*95) + "%"; b.style.height = (1 + Math.random()*8) + "%"; b.style.backdropFilter = b.style.webkitBackdropFilter = ["invert(1)", "hue-rotate(" + ((Math.random()*360) | 0) + "deg) saturate(2.2)", "grayscale(1) contrast(1.6)"][(Math.random()*3) | 0]; b.style.transform = "translateX(" + ((Math.random() - .5)*40) + "px)"; } else b.style.display = "none"; });
    n++; setTimeout(step, 35 + Math.random()*55);
  };
  step();
}
/* ===== SPYDER-Logo glitcht ab und zu ===== */
(function logoGlitch() {
  const go = () => { const im = document.querySelector(".mTitle .logoImg");
    if (im && document.body.classList.contains("menu") && !$("splash")) { im.style.setProperty("--gx", (6 + Math.random()*14) + "px"); im.style.setProperty("--gs", ((Math.random() - .5)*16) + "deg"); im.classList.remove("glitch"); void im.offsetWidth; im.classList.add("glitch"); screenGlitch(); if (Math.random() < .2) setTimeout(() => { im.classList.remove("glitch"); void im.offsetWidth; im.classList.add("glitch"); }, 420); }
    setTimeout(go, 9000 + Math.random()*13000); };
  setTimeout(go, 7000);
})();
/* ===== Controller + Eingabegerät-Erkennung ===== */
const padv = {x:0, y:0}, pad = {prev:[], held:{}, nav:0, navT:0, root:null, idx:0, ax:[0, 0, 0, 0]};
const PADA = [["jump","Sprung","Space",0], ["crouch","Ducken / Abseilen","ArrowDown",1], ["melee","Nahkampf","KeyG",2], ["interact","Interagieren","KeyE",3], ["cam","Kamera wechseln","KeyV",4], ["torch","Taschenlampe","KeyT",5], ["shield","Schild (halten)","KeyF",6], ["photo","Foto (First Person)","Enter",7], ["map","Karte","KeyM",8], ["sneak","Schleichen","ShiftLeft",10], ["pack","Backpack","KeyI",12], ["radio","Funk","KeyJ",14]];
const PBN = ["A", "B", "X", "Y", "LB", "RB", "LT", "RT", "Back", "Start", "L3", "R3", "↑", "↓", "←", "→"];
let PADC = {}; try { PADC = JSON.parse(localStorage.getItem("spyderPad") || "{}") || {}; } catch (e) {}
let PADMAP = [], padWait = null;
function padBuild() { PADMAP = PADA.map(a => [PADC[a[0]] !== undefined ? PADC[a[0]] : a[3], a[2]]); }
padBuild();
function padRender(box) {
  const wrap = document.createElement("div"); wrap.className = "kmWrap"; wrap.innerHTML = '<div class="devh">' + T("TASTEN NEU BELEGEN") + ' · ' + T("CONTROLLER") + '</div>';
  for (const [id, label, , def] of PADA) { const r = document.createElement("div"); r.className = "srow sw"; const c = PADC[id] !== undefined ? PADC[id] : def; r.innerHTML = '<span>' + T(label) + '</span>';
    const b = document.createElement("button"); b.className = "kmBtn" + (c !== def ? " mod" : ""); b.textContent = PBN[c];
    b.onclick = () => { if (padWait) padWait.b.textContent = padWait.t; padWait = {id, b, t:PBN[PADC[id] !== undefined ? PADC[id] : def]}; b.textContent = T("Taste drücken …"); b.classList.add("wait"); };
    r.appendChild(b); wrap.appendChild(r); }
  const rs = document.createElement("button"); rs.className = "devb"; rs.style.marginTop = "14px"; rs.textContent = T("Tasten zurücksetzen"); rs.onclick = () => { PADC = {}; try { localStorage.removeItem("spyderPad"); } catch (e) {} padBuild(); padWait = null; wrap.remove(); padRender(box); };
  wrap.appendChild(rs); box.appendChild(wrap);
}
function padAssign(btn) {
  const w = padWait; padWait = null; if (btn === 9) { w.b.textContent = w.t; return; }
  const cur = id => { const a = PADA.find(x => x[0] === id); return PADC[id] !== undefined ? PADC[id] : a[3]; }, old = cur(w.id), other = PADA.find(a => a[0] !== w.id && cur(a[0]) === btn);
  PADC[w.id] = btn; if (other) PADC[other[0]] = old;
  for (const a of PADA) if (PADC[a[0]] === a[3]) delete PADC[a[0]];
  try { localStorage.setItem("spyderPad", JSON.stringify(PADC)); } catch (e) {} padBuild(); const box = w.b.closest(".kmWrap").parentNode; w.b.closest(".kmWrap").remove(); padRender(box); applyLang();
}
function setInMode(m) {
  if (window.inputMode === m || $("splash")) return; window.inputMode = m;
  document.body.classList.toggle("touch", m === "touch"); document.body.classList.toggle("pad", m === "pad");
  if (settingsOpen) { const y = $("optRows").scrollTop; buildOpts(); $("optRows").scrollTop = y; }
}
addEventListener("keydown", e => { if (!e.isTrusted || e.__pad) return; setInMode("keyboard"); }, true);
addEventListener("pointermove", e => { if (e.pointerType === "mouse" && Math.abs(e.movementX) + Math.abs(e.movementY) > 0) setInMode("keyboard"); }, true);
addEventListener("pointerdown", e => { if (e.pointerType === "touch" || e.pointerType === "pen") setInMode("touch"); else setInMode("keyboard"); }, true);
function padKey(code) { const e = new KeyboardEvent("keydown", {code, key:code, bubbles:true}); e.__pad = true; dispatchEvent(e); }
function padRumble(ms) { if (!opt.padVib || window.inputMode !== "pad") return; try { const g = padGet(); const a = g && (g.vibrationActuator || (g.hapticActuators && g.hapticActuators[0])); if (a && a.playEffect) a.playEffect("dual-rumble", {duration:ms, strongMagnitude:.6, weakMagnitude:.8}); else if (a && a.pulse) a.pulse(.7, ms); } catch (e) {} }
function padGet() { try { for (const g of (navigator.getGamepads ? navigator.getGamepads() : [])) if (g && g.connected) return g; } catch (e) {} return null; }
function padUiList(root) { return [...root.querySelectorAll("button,input[type=range]")].filter(b => b.offsetParent !== null && !b.disabled && b.getBoundingClientRect().width > 0); }
function padUi(g, dir, a, b, lb, rb, now) {
  const root = settingsOpen ? $("settings") : pauseOpen ? $("pause") : (mode === "menu" && document.body.classList.contains("menu")) ? $("start") : null;
  if (!root) return false;
  if (pad.root !== root) { pad.root = root; pad.idx = 0; }
  const L = padUiList(root); if (!L.length) return true; pad.idx = Math.max(0, Math.min(L.length - 1, pad.idx));
  const mark = () => { for (const x of root.querySelectorAll(".padf")) x.classList.remove("padf"); L[pad.idx].classList.add("padf"); try { L[pad.idx].scrollIntoView({block:"nearest"}); } catch (e) {} };
  if (dir.y && now > pad.navT) { pad.idx = (pad.idx + dir.y + L.length)%L.length; pad.navT = now + 170; mark(); }
  if (dir.x && now > pad.navT) { const el = L[pad.idx]; if (el.type === "range") { el.value = +el.value + dir.x*Math.max(1, (el.max - el.min)/20); el.dispatchEvent(new Event("input", {bubbles:true})); pad.navT = now + 90; } }
  if (!L[pad.idx].classList.contains("padf")) mark();
  if (a) { const el = L[pad.idx]; if (el.type !== "range") el.click(); }
  if (b) padKey("Escape");
  if (settingsOpen && (lb || rb)) { const tb = [...$("sTabs").children], i = tb.findIndex(t => t.classList.contains("on")); const n = tb[(i + (rb ? 1 : -1) + tb.length)%tb.length]; if (n) { n.click(); pad.idx = 0; } }
  return true;
}
function padTick(dt) {
  const g = padGet(); if (!g) { if (padv.x || padv.y) padv.x = padv.y = 0; return; }
  const B = i => !!(g.buttons[i] && g.buttons[i].pressed), P = pad.prev, dn = i => B(i) && !P[i];
  if (padWait) { for (let i = 0; i < 16; i++) if (dn(i)) { padAssign(i); break; } P.length = 0; for (let i = 0; i < g.buttons.length; i++) P[i] = B(i); return; }
  const ax = g.axes, lx = ax[0] || 0, ly = ax[1] || 0, rx = ax[2] || 0, ry = ax[3] || 0, active = g.buttons.some(b => b.pressed) || Math.hypot(lx, ly) > .5 || Math.hypot(rx, ry) > .5;
  if (active) { if (!$("splash")) setInMode("pad"); try { initAudio(); } catch (e) {} }
  const now = performance.now(), dz = opt.padDz, st = (x, y) => { const m = Math.hypot(x, y); if (m < dz) return [0, 0]; const k = Math.min(1, (m - dz)/(1 - dz))/m; return [x*k, y*k]; };
  const uiDir = {x:(B(15) ? 1 : 0) - (B(14) ? 1 : 0) + (lx > .6 ? 1 : lx < -.6 ? -1 : 0), y:(B(13) ? 1 : 0) - (B(12) ? 1 : 0) + (ly > .6 ? 1 : ly < -.6 ? -1 : 0)};
  uiDir.x = Math.sign(uiDir.x); uiDir.y = Math.sign(uiDir.y);
  const hold = (code, v) => { if (v) { keys[code] = true; pad.held[code] = true; } else if (pad.held[code]) { keys[code] = false; delete pad.held[code]; } };
  let handled = false;
  if (window.inputMode === "pad" && !$("splash")) {
    if (padUi(g, uiDir, dn(0), dn(1), dn(4), dn(5), now)) handled = true;
    else if (invOpen || comOpen || cmapOpen) { handled = true;
      if (dn(12)) padKey("ArrowUp"); if (dn(13)) padKey("ArrowDown"); if (dn(14)) padKey("ArrowLeft"); if (dn(15)) padKey("ArrowRight"); if (dn(4)) padKey("ArrowLeft"); if (dn(5)) padKey("ArrowRight");
      if (dn(0)) padKey("Enter"); if (dn(1) || dn(3)) padKey(cmapOpen ? "KeyM" : "Escape"); }
    if (dn(9) && !settingsOpen) padKey("Escape");
  }
  if (handled || paused || settingsOpen || pauseOpen || mode === "menu") { for (const c in pad.held) { keys[c] = false; delete pad.held[c]; } padv.x = padv.y = 0; if (handled) { P.length = 0; for (let i = 0; i < g.buttons.length; i++) P[i] = B(i); return; } }
  else {
    const [mx, my] = st(lx, ly); padv.x = mx; padv.y = -my;
    const [cx, cy] = st(rx, ry), sp = 2.7*opt.padS*dt; if (cx || cy) look(Math.sign(cx)*Math.pow(Math.abs(cx), 1.5)*sp, Math.sign(cy)*Math.pow(Math.abs(cy), 1.5)*sp);
    for (const [i, code] of PADMAP) { const v = B(i) || (i === 7 && (g.buttons[7].value > .5)); hold(code, v); if (v && !P[i] && !(i === 6)) press(code); }
    if (B(6)) hold("KeyF", true);
  }
  P.length = 0; for (let i = 0; i < g.buttons.length; i++) P[i] = B(i);
}
