/* ======================= Erster Auftrag · Virtual Backpack · Kreditkontor ======================= */
const ITEMS = {
  gold: {n:"Goldbarren", d:"Schwer, glänzend und kaum nachzuverfolgen. Rackson tauscht sie gegen SuperEuro (SE).", c:"#e8b84a"},
  kit:  {n:"Reparatur-Kit", d:"Stellt alle Bauteile zu 50 % wieder her.", c:"#e8eefc", use:1},
  cell: {n:"Energiezelle", d:"Lädt die Energie sofort vollständig auf.", c:"#4fa9a3", use:1},
  card: {n:"Mases Visitenkarte", d:"„Custom & Mods – wir bauen alles, was eine Steckdose hat.“", c:"#a7adb4"},
  map:  {n:"Karte von CJ-City", d:"Von Mase übertragen. Öffnen mit M.", c:"#9499a0"}
};
const UPG = [
  {k:"laser", n:"Laserklinge", d:"Mehr Schaden mit Klinge und Strahl.", fx:l => "Schaden +" + (l*35) + " %", cost:[4500, 9000, 15000], req:() => gear.knife, need:"Erst bei Mase einbauen lassen"},
  {k:"akku", n:"Hauptakku", d:"Klinge, Strahl und Schild verbrauchen weniger Energie.", fx:l => "Verbrauch −" + (l*20) + " %", cost:[4500, 9000, 15000], req:() => gear.knife, need:"Erst bei Mase einbauen lassen"},
  {k:"panzer", n:"Rückenpanzer", d:"Weniger Schaden durch Treffer und Stürze.", fx:l => "Schaden −" + (l*20) + " %", cost:[6000, 12000, 18000]},
  {k:"repair", n:"Selbstreparatur", d:"Bauteile heilen schneller.", fx:l => "Heilung +" + (l*100) + " %", cost:[3000, 7500, 13500]},
  {k:"servo", n:"Servo-Antrieb", d:"Stärkere Gelenkmotoren machen ARACHNE-8 schneller.", fx:l => "Tempo +" + (l*8) + " %", cost:[3500, 7000, 12000]},
  {k:"muskel", n:"Sprungmuskeln", d:"Hydraulikkolben an den Hüften geben mehr Schwung.", fx:l => "Sprungkraft +" + (l*12) + " %", cost:[3500, 7000, 12000]},
  {k:"solar", n:"Solarmodul", d:"Panels auf dem Hinterleib laden die Energie schneller nach.", fx:l => "Laden +" + (l*40) + " %", cost:[4000, 8000, 13500]},
  {k:"tarn", n:"Tarnmodul", d:"Dämpfer am Kopf verkleinern die Sichtweite der Wachroboter.", fx:l => "Entdeckung −" + (l*15) + " %", cost:[5000, 10000, 16500]},
  {k:"hack", n:"Hack-Modul", d:"Ein Zusatzchip mit Antenne knackt Terminals schneller.", fx:l => "Hackzeit −" + (l*20) + " %", cost:[4500, 9000, 15000]},
  {k:"feder", n:"Landefedern", d:"Federspiralen an den Hüften fangen Stürze ab.", fx:l => "Sturzschaden −" + (l*25) + " %", cost:[4000, 8000, 13500]}
];
function fixUpg() { for (const U of UPG) gear.upg[U.k] = gear.upg[U.k] | 0; if (!gear.obs || !gear.obs.shots) gear.obs = {st:0, slot:0, shots:[0, 0, 0, 0]}; }
const uSv = () => 1 + .08*gear.upg.servo, uMu = () => 1 + .12*gear.upg.muskel, uSo = () => 1 + .4*gear.upg.solar, uTn = () => 1 - .15*gear.upg.tarn, uHk = () => 1 + .25*gear.upg.hack, uFd = () => 1 - .25*gear.upg.feder;
const uLs = () => 1 + .35*gear.upg.laser, uAk = () => 1 - .2*gear.upg.akku, uPz = () => 1 - .2*gear.upg.panzer;
function jobObj() {
  if (gear.job >= 2 && gear.obs && gear.obs.st === 1) return (xs.scene === "side" ? "Beschattung: Herr Varga kommt gleich aus Haus Nr. 31. Such dir einen Beobachtungsplatz – am besten erhöht." : "Auftrag: Beschattung. Nimm den Durchgang am Ostende der Straße in die Parallelstraße – dort wohnt Varga (Nr. 31).");
  if (gear.job >= 2 && gear.obs && gear.obs.st === 2 && xs.scene !== "side") return "Beschattung läuft: Geh zurück durch den Durchgang am Ostende der Straße in die Parallelstraße.";
  if (gear.job >= 2 && gear.obs && gear.obs.st === 2) return "Beschattung: Fotografiere Herr Varga (V = Ich-Perspektive, Enter/RT = Foto). Bleib unentdeckt – Wände und Decken sind dein Freund.";
  return gear.job === 0 ? (gear.rackMet ? (gear.rackReady ? "Sprich mit Rackson in Mases Werkstatt." : "Warte in Mases Werkstatt, bis Rackson mit Mase fertig ist.") : "Verlasse Mases Werkstatt – Rackson wartet draußen auf dich.")
    : gear.job === 1 ? "Auftrag: Kreditkontor. Klettere in der Gasse die Feuerleiter aufs Dach und dring von oben ein."
    : gear.gold > 0 ? "Bring Rackson die Goldbarren – er wartet in der Gasse." : "Erster Auftrag erledigt. Geh zu Mase in die Werkstatt, um Upgrades zu kaufen.";
}
function givePack() { if (gear.pack) return; gear.pack = true; if (!gear.items.kit && !gear.items.cell) { gear.items.kit = 2; gear.items.cell = 2; } }
function packDl() {
  let n = 0; const iv = setInterval(() => { n++; toast(T("Virtual Backpack: Installation") + " " + Math.min(100, n*25) + " %"); beep(700 + n*260, .06, 0, .035);
    if (n >= 4) { clearInterval(iv); givePack(); clang(.25); beep(2200, .12, 0, .04); setTimeout(() => toast("Backpack installiert – Taste I"), 500); } }, 650);
}

/* ---------- Backpack-Oberfläche ---------- */
let maseShop = false, invOpen = false, invTab = 0, invSel = 0;
{
  const st = document.createElement("style");
  st.textContent = `#inv{position:fixed;inset:0;z-index:45;display:none;align-items:center;justify-content:center;background:rgba(4,10,24,.78);font-family:inherit;color:#e8eefc}#inv.show{display:flex}
#inv .ivP{width:min(96vw,860px);max-height:94vh;display:flex;flex-direction:column;background:#1d2026;border:2px solid rgba(79,169,163,.7);border-radius:12px;overflow:hidden}
#inv .ivH{display:flex;align-items:baseline;gap:14px;padding:12px 18px;border-bottom:1px solid rgba(210,224,250,.18)}#inv .ivH b{letter-spacing:.22em;font-size:15px}#inv .ivH span{color:#a7adb4;font-size:11px;letter-spacing:.18em;flex:1}#inv .ivH em{font-style:normal;color:#e8b84a;font-weight:700;font-size:14px}
#inv .ivT{display:flex;border-bottom:1px solid rgba(210,224,250,.18)}#inv .ivT button{flex:1;background:none;border:0;border-bottom:3px solid transparent;color:#a7adb4;padding:10px 4px;font:inherit;font-size:12px;letter-spacing:.16em;cursor:pointer}#inv .ivT button.on{color:#e8eefc;border-bottom-color:#4fa9a3;background:rgba(79,169,163,.08)}#inv .ivT button:hover{color:#e8eefc}
#inv .ivB{padding:16px 18px;overflow:auto;min-height:310px;display:flex;gap:18px;flex-wrap:wrap}#inv .ivF{padding:8px 18px;border-top:1px solid rgba(210,224,250,.18);color:#a7adb4;font-size:11px;letter-spacing:.14em;text-align:center}
#inv .grid{display:grid;grid-template-columns:repeat(6,58px);gap:8px;align-content:start}#inv .slot{width:58px;height:58px;border:1px solid rgba(210,224,250,.22);background:#282b32;border-radius:8px;position:relative;cursor:pointer}#inv .slot.on{border-color:#4fa9a3;box-shadow:0 0 0 1px #4fa9a3 inset}#inv .slot.empty{opacity:.35;cursor:default}#inv .slot i{position:absolute;right:4px;bottom:2px;font-style:normal;font-size:11px;color:#e8eefc}
#inv .det{flex:1;min-width:200px}#inv .det h3{margin:0 0 6px;font-size:15px;letter-spacing:.12em}#inv .det p{margin:0 0 12px;color:#c7cdd4;font-size:13px;line-height:1.5}
#inv .btn{background:#4fa9a3;color:#1d2026;border:0;border-radius:6px;padding:8px 14px;font:inherit;font-size:12px;font-weight:700;letter-spacing:.12em;cursor:pointer}#inv .btn:disabled{background:#3f4249;color:#81858c;cursor:default}
#inv .card{width:100%;display:flex;gap:14px;align-items:center;border:1px solid rgba(210,224,250,.2);background:#282b32;border-radius:8px;padding:10px 14px}#inv .card b{display:block;font-size:13px;letter-spacing:.1em}#inv .card span{color:#a7adb4;font-size:12px}#inv .card .m{flex:1}#inv .card u{text-decoration:none;color:#4fa9a3;font-size:11px;letter-spacing:.14em}
#inv .pip{display:inline-block;width:18px;height:6px;border-radius:2px;background:#3f4249;margin-right:4px}#inv .pip.on{background:#4fa9a3}
#inv .pb{height:6px;background:#3f4249;border-radius:3px;overflow:hidden;margin-top:4px}#inv .pb div{height:100%;background:#e8eefc}
#inv .pl{flex:1;min-width:230px}#inv .pl div.r{margin-bottom:9px;font-size:12px;display:flex;justify-content:space-between}

#inv{background:radial-gradient(ellipse at 50% 40%,rgba(37,40,46,.62),rgba(3,8,20,.86));backdrop-filter:blur(14px) saturate(1.15);-webkit-backdrop-filter:blur(14px) saturate(1.15)}
#inv .ivP{background:linear-gradient(180deg,rgba(41,44,50,.58),rgba(22,25,32,.7));border:1px solid rgba(255,255,255,.14);border-radius:22px;box-shadow:0 24px 70px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.08);width:min(94vw,880px)}
#inv .ivH{flex:none;border-bottom:none;padding:18px 24px 6px;align-items:center}#inv .ivH b{font-size:13px;letter-spacing:.34em;font-weight:600;color:#fff}#inv .ivH span{margin-right:auto;font-size:10px;letter-spacing:.24em;color:rgba(255,255,255,.45)}
#inv .ivH em{font-style:normal;font-size:12px;letter-spacing:.08em;padding:5px 14px 5px 12px;border-radius:999px;background:rgba(79,169,163,.14);border:1px solid rgba(79,169,163,.4);color:#9bd6d0}
#inv .ivT{flex:none;border-bottom:none;gap:6px;padding:10px 20px 4px;overflow-x:auto}#inv .ivT button{flex:none;line-height:1.2;border:1px solid transparent;border-radius:999px;padding:8px 18px;font-size:11px;letter-spacing:.16em;color:rgba(255,255,255,.55);background:transparent;transition:background .15s,color .15s}
#inv .ivT button:hover{background:rgba(255,255,255,.07);color:#fff}#inv .ivT button.on{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.18);color:#fff;box-shadow:inset 0 -2px 0 #4fa9a3}
#inv .ivB{padding:16px 24px 18px;gap:20px;min-height:320px}
#inv .ivF{border-top:1px solid rgba(255,255,255,.08);padding:10px 24px;color:rgba(255,255,255,.4);font-size:10px;letter-spacing:.14em}
#inv .grid{gap:9px;grid-template-columns:repeat(6,60px)}
#inv .slot{width:60px;height:60px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);transition:transform .12s,border-color .12s,background .12s}
#inv .slot.empty{background:rgba(255,255,255,.025);border-style:dashed;border-color:rgba(255,255,255,.07)}
#inv .slot:not(.empty):hover{transform:translateY(-2px);background:rgba(255,255,255,.1)}#inv .slot.on{border-color:#4fa9a3;background:rgba(79,169,163,.14);box-shadow:0 0 0 1px rgba(79,169,163,.5)}
#inv .det{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px 18px;align-self:flex-start}#inv .det h3{font-size:13px;letter-spacing:.2em;font-weight:600}#inv .det p{color:rgba(255,255,255,.66)}
#inv .btn{background:#4fa9a3;color:#1d2026;border-radius:999px;padding:9px 20px;letter-spacing:.14em;transition:filter .15s,transform .1s}#inv .btn:hover:not(:disabled){filter:brightness(1.1)}#inv .btn:active:not(:disabled){transform:scale(.97)}#inv .btn:disabled{background:rgba(255,255,255,.1);color:rgba(255,255,255,.4)}
#inv .card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:13px 18px}#inv .card b{letter-spacing:.14em}
#inv .card u{text-decoration:none;font-size:10px;letter-spacing:.18em;color:#4fa9a3}
#inv .pip{height:4px;border-radius:2px;background:rgba(255,255,255,.14)}#inv .pip.on{background:#4fa9a3}
#inv .pb{height:4px;background:rgba(255,255,255,.1)}
#inv canvas{background:rgba(255,255,255,.04)!important;border:1px solid rgba(255,255,255,.09)!important;border-radius:16px!important}
@media(max-width:560px){#inv .grid{grid-template-columns:repeat(5,1fr);width:100%}#inv .slot{width:auto;aspect-ratio:1;height:auto}#inv .ivT button{padding:8px 12px}}
`;
  document.head.appendChild(st);
  const s2 = document.createElement("style"); s2.textContent = st.textContent.replace(/#inv/g, "#com") + `@keyframes cmb{50%{opacity:.25}}#com .live{animation:cmb 1.2s infinite}#com .cid{font-family:ui-monospace,monospace;letter-spacing:.14em;color:#4fa9a3;font-size:11px}#com .call{width:100%;border:1px solid rgba(79,169,163,.4);background:rgba(79,169,163,.08);border-radius:16px;padding:14px 18px}#com .call small{display:block;letter-spacing:.2em;font-size:10px;color:#4fa9a3;margin-bottom:6px}#com .call p{margin:0;font-size:14px;line-height:1.5;color:#fff}#com .card .m{flex:1}#com .card span{display:block;color:rgba(255,255,255,.62);font-size:12px;margin-top:3px;line-height:1.45}`; document.head.appendChild(s2);
}
const invEl = document.createElement("div"); invEl.id = "inv";
invEl.innerHTML = '<div class="ivP"><div class="ivH"><b id="ivT1"></b><span id="ivT2"></span><em id="ivGold"></em></div><div class="ivT" id="ivTabs"></div><div class="ivB" id="ivBody"></div><div class="ivF" id="ivF"></div></div>';
document.body.appendChild(invEl);
invEl.addEventListener("click", e => { if (e.target === invEl) toggleInv(); });
function invList() {
  const L = []; let g = gear.gold; while (g > 0) { L.push({id:"gold", n:Math.min(10, g)}); g -= 10; }
  if (gear.items.kit > 0) L.push({id:"kit", n:gear.items.kit}); if (gear.items.cell > 0) L.push({id:"cell", n:gear.items.cell});
  L.push({id:"card", n:1}); if (gear.map) L.push({id:"map", n:1}); return L;
}
function itemIcon(id, sz) {
  const cv = document.createElement("canvas"); cv.width = cv.height = sz; const x = cv.getContext("2d"), c = ITEMS[id].c, u = sz/58; x.translate(sz/2, sz/2); x.scale(u, u);
  if (id === "gold") { for (const [dx, dy, s] of [[-9, 8, 1], [9, 8, 1], [0, -4, 1]]) { x.fillStyle = "#b88a20"; x.beginPath(); x.moveTo(dx - 13, dy + 6); x.lineTo(dx + 13, dy + 6); x.lineTo(dx + 9, dy - 6); x.lineTo(dx - 9, dy - 6); x.fill(); x.fillStyle = c; x.fillRect(dx - 9, dy - 6, 18, 4); } }
  else if (id === "kit") { x.fillStyle = c; x.fillRect(-16, -12, 32, 24); x.fillStyle = "#4fa9a3"; x.fillRect(-3, -9, 6, 18); x.fillRect(-9, -3, 18, 6); }
  else if (id === "cell") { x.fillStyle = "#3f4249"; x.fillRect(-10, -16, 20, 32); x.fillStyle = c; x.fillRect(-7, -9, 14, 7); x.fillRect(-7, 1, 14, 7); x.fillRect(-4, -19, 8, 3); }
  else if (id === "card") { x.fillStyle = "#e8eefc"; x.fillRect(-17, -11, 34, 22); x.fillStyle = "#4fa9a3"; x.fillRect(-17, -11, 34, 5); x.fillStyle = "#1d2026"; x.fillRect(-12, -1, 20, 2); x.fillRect(-12, 4, 14, 2); }
  else { x.strokeStyle = c; x.lineWidth = 2; x.strokeRect(-16, -14, 32, 28); x.beginPath(); x.moveTo(-16, -4); x.lineTo(16, 4); x.moveTo(-3, -14); x.lineTo(5, 14); x.stroke(); x.fillStyle = "#4fa9a3"; x.beginPath(); x.arc(2, 0, 3, 0, 7); x.fill(); }
  return cv;
}
function toggleInv() {
  if (!invOpen && (!gear.pack || mode === "cut" || mode === "menu" || pauseOpen || settingsOpen)) return;
  invOpen = !invOpen; setPanel(invEl, invOpen); paused = invOpen; if (invOpen) { unlockPtr(); invSel = 0; try { ivRender(); } catch (e) { console.error(e); } try { uiSnd(.8, "ok"); } catch (e) {} } else { maseShop = false; if (invTab > 2) invTab = 0; uiSnd(.6, "tab"); lock(); }
}
function invKey(code) {
  if (maseShop && (code === "KeyE" || code === "KeyI" || code === "Escape")) { toggleInv(); return; } if (maseShop) return;
  if (code === "KeyI" || code === "Escape" || code === "Tab") { toggleInv(); return; }
  if (code === "ArrowRight" || code === "KeyD") { const n = invN(), t = (invTab + 1)%n; if (t === 3) { goCom(); return; } invTab = t; invSel = 0; ivRender(); uiSnd(.5, "tab"); }
  else if (code === "ArrowLeft" || code === "KeyA") { const n = invN(), t = (invTab + n - 1)%n; if (t === 3) { goCom(); return; } invTab = t; invSel = 0; ivRender(); uiSnd(.5, "tab"); }
  else if (code.startsWith("Digit") && +code[5] >= 1 && +code[5] <= invN()) { if (+code[5] === 4) { goCom(); return; } invTab = +code[5] - 1; invSel = 0; ivRender(); uiSnd(.5, "tab"); }
}
const invN = () => comAvail() ? 4 : 3;
function goCom() { if (!invOpen) return; toggleInv(); toggleCom(); }
function goInv() { if (!comOpen || !gear.pack) return; toggleCom(); toggleInv(); }
function ivRender() {
  if (!maseShop && invTab > 2) invTab = 0;
  $("ivT1").textContent = T(maseShop ? "MASES WERKSTATT" : "VIRTUAL BACKPACK"); $("ivT2").textContent = maseShop ? T("UPGRADE-BERATUNG") : "ARACHNE-8 · CJ-CITY"; $("ivGold").textContent = fmtSE(gear.se || 0); $("ivF").textContent = T("I / Esc: Schließen  ·  ← → oder 1–4: Reiter");
  const tb = $("ivTabs"); tb.innerHTML = ""; ["INVENTAR", "AUSRÜSTUNG", "SPINNE"].concat(comAvail() ? ["FUNK"] : []).forEach((n, i) => { const b = document.createElement("button"); b.className = "ivTab" + (i === invTab ? " on" : ""); b.textContent = (i + 1) + " · " + T(n); b.onclick = () => { if (i === 3) { goCom(); return; } invTab = i; invSel = 0; ivRender(); }; tb.appendChild(b); });
  tb.style.display = maseShop ? "none" : ""; if (maseShop) $("ivF").textContent = T("E / Esc: Schließen");
  const B = $("ivBody"); B.innerHTML = ""; [ivInv, ivEquip, ivSpider, ivUpg][maseShop ? 3 : invTab](B);
}
function ivInv(B) {
  const L = invList(), grid = document.createElement("div"); grid.className = "grid"; B.appendChild(grid);
  for (let i = 0; i < 24; i++) { const s = document.createElement("div"), it = L[i]; s.className = "slot ivSlot" + (it ? "" : " empty") + (i === invSel && it ? " on" : "");
    if (it) { s.appendChild(itemIcon(it.id, 58)); if (it.n > 1) { const c = document.createElement("i"); c.textContent = it.n; s.appendChild(c); } s.onclick = () => { invSel = i; ivRender(); }; } grid.appendChild(s); }
  const det = document.createElement("div"); det.className = "det"; B.appendChild(det); const it = L[invSel];
  if (it) { const D = ITEMS[it.id]; det.innerHTML = "<h3></h3><p></p>"; det.firstChild.textContent = T(D.n); det.children[1].textContent = T(D.d);
    if (D.use) { const b = document.createElement("button"); b.className = "btn ivBtn"; b.textContent = T("BENUTZEN"); b.onclick = () => ivUse(it.id); det.appendChild(b); } }
  else det.innerHTML = "<p>" + T("Leer.") + "</p>";
}
function ivUse(id) {
  if (id === "kit" && gear.items.kit > 0) { gear.items.kit--; for (const k in PARTS) PARTS[k] = Math.min(1, PARTS[k] + .5); toast("Bauteile repariert"); clang(.2); beep(900, .1, 0, .05); }
  else if (id === "cell" && gear.items.cell > 0) { gear.items.cell--; energy = 1; toast("Energie aufgeladen"); beep(1400, .12, 0, .05); beep(1900, .1, .1, .04); }
  writeSave(); ivRender();
}
function ivEquip(B) {
  const rows = [
    ["Laserklinge", gear.knife ? "AKTIV" : "–", gear.knife ? "Linksklick / G – Nahkampf mit der Klinge am vorderen Bein. Stufe " + (gear.upg.laser + 1) : "Noch nicht eingebaut."],
    ["Holo-Schild", gear.shield ? "AKTIV" : "–", "F oder Rechtsklick halten. Verbraucht Energie."],
    ["Dock-Bein", "AKTIV", "E: Konsolen hacken. Das vordere linke Bein dockt an."],
    ["Karte von CJ-City", gear.map ? "AKTIV" : "–", "M: Karte öffnen."],
    ["Virtual Backpack", "AKTIV", "I: Inventar, Bauteile, Upgrades."]
  ];
  for (const [n, s, d] of rows) { const c = document.createElement("div"); c.className = "card"; c.innerHTML = '<div class="m"><b></b><span></span></div><u></u>'; c.querySelector("b").textContent = T(n); c.querySelector("span").textContent = T(d); c.querySelector("u").textContent = T(s); B.appendChild(c); }
}
function ivSpider(B) {
  const cv = document.createElement("canvas"); cv.width = 300; cv.height = 280; cv.style.cssText = "background:#282b32;border:1px solid rgba(210,224,250,.2);border-radius:8px;max-width:100%"; B.appendChild(cv);
  const x = cv.getContext("2d"), col = v => v > .75 ? "#e8eefc" : v > .45 ? "#4fa9a3" : "#c0392b", cx = 150, cy = 140;
  const ang = [-.95, -.35, .3, .9];
  for (const side of [-1, 1]) for (let r = 0; r < 4; r++) { const nm = LEGN[r] + (side > 0 ? " links" : " rechts"), a = ang[r], hx = cx + side*18, hy = cy + r*9 - 14, kx = hx + side*58, ky = hy + a*52 - 18, fx = kx + side*28, fy = ky + a*36 + 30;
    x.strokeStyle = col(PARTS[nm]); x.lineWidth = 6; x.lineCap = "round"; x.beginPath(); x.moveTo(hx, hy); x.lineTo(kx, ky); x.lineTo(fx, fy); x.stroke(); x.fillStyle = "#1d2026"; x.beginPath(); x.arc(kx, ky, 4, 0, 7); x.fill(); }
  x.fillStyle = col(PARTS["Hauptakku"]); x.beginPath(); x.ellipse(cx, cy + 6, 26, 36, 0, 0, 7); x.fill(); x.fillStyle = col(PARTS["Rückenpanzer"]); x.beginPath(); x.ellipse(cx, cy + 12, 17, 22, 0, 0, 7); x.fill();
  x.fillStyle = col(PARTS["Sensorkopf"]); x.beginPath(); x.ellipse(cx, cy - 34, 13, 15, 0, 0, 7); x.fill(); x.fillStyle = "#4fa9a3"; x.fillRect(cx - 8, cy - 38, 16, 4);
  x.fillStyle = "#a7adb4"; x.font = "11px system-ui,sans-serif"; x.textAlign = "center"; x.fillText(T("Weiß: Gehäuse  ·  Orange: Verschleiß  ·  Rot: kritisch"), cx, 268);
  const pl = document.createElement("div"); pl.className = "pl"; B.appendChild(pl);
  const names = BODYP.concat(legs.map(legName)); const tot = dmgAvg();
  const h = document.createElement("div"); h.className = "r"; h.innerHTML = "<span></span><b></b>"; h.children[0].textContent = T("Gesamt-Integrität"); h.children[1].textContent = Math.round(tot*100) + " %"; pl.appendChild(h);
  for (const n of names) { const v = PARTS[n], r = document.createElement("div"); r.style.marginBottom = "7px"; r.innerHTML = '<div class="r" style="margin:0"><span></span><b></b></div><div class="pb"><div></div></div>'; r.querySelector("span").textContent = T(n); r.querySelector("b").textContent = Math.round(v*100) + " %"; const f = r.querySelector(".pb div"); f.style.width = (v*100) + "%"; f.style.background = col(v); pl.appendChild(r); }
}
function ivUpg(B) { fixUpg();
  const hint = document.createElement("div"); hint.style.cssText = "width:100%;color:#a7adb4;font-size:12px"; hint.textContent = T(maseShop ? "Mase baut die Upgrades ein. Bezahlt wird in SuperEuro (SE)." : "Upgrades gibt es nur bei Mase in der Werkstatt. Hier siehst du deinen Stand."); B.appendChild(hint);
  for (const U of UPG) { const lv = gear.upg[U.k], c = document.createElement("div"); c.className = "card"; c.innerHTML = '<div class="m"><b></b><span></span><div style="margin-top:6px"></div></div><div style="text-align:right"><u></u><br><button class="btn ivBtn"></button></div>';
    c.querySelector("b").textContent = T(U.n); c.querySelector("span").textContent = T(U.d) + (lv ? " · " + T(U.fx(lv)) : ""); const pp = c.querySelector(".m div"); for (let i = 0; i < 3; i++) { const p = document.createElement("span"); p.className = "pip" + (i < lv ? " on" : ""); pp.appendChild(p); }
    const b = c.querySelector("button"), cost = U.cost[lv], locked = U.req && !U.req(); if (locked) { c.style.opacity = ".55"; c.querySelector("span").textContent = T(U.need); } c.querySelector("u").textContent = lv >= 3 ? T("MAX") : T("Stufe") + " " + (lv + 1) + " · " + T(U.fx(lv + 1));
    b.textContent = locked ? "🔒" : lv >= 3 ? "✓" : maseShop ? fmtSE(cost) : T("BEI MASE"); b.disabled = !maseShop || locked || lv >= 3 || (gear.se || 0) < cost; b.onclick = () => { if (maseShop && !locked && (gear.se || 0) >= cost && lv < 3) { gear.se -= cost; gear.upg[U.k]++; clang(.3); beep(1200, .1, 0, .05); beep(1800, .12, .1, .05); toast(T(U.n) + ": " + T("Stufe") + " " + (lv + 2)); writeSave(); ivRender(); } };
    B.appendChild(c); }
}

/* ---------- Rackson gibt den Auftrag ---------- */
function jobCut() {
  const hd = 2.8, hw = hwS(), c = {ev:[], subs:[]}, F = makeRobot({body:0x8a5a6a, acc:0xd8a24a, glow:0xf2a0a8, scarf:0x6a2a3a}), R = makeRobot({body:0x3a4a5a, acc:0x3c8680, glow:0x8ad0a0, tape:true, apron:0x2a2c30, cool:true});
  F.glass.visible = R.glass.visible = false; exG.add(F.g, R.g); exAct.push(F, R); SPK.F.R = F; SPK.R.R = R; const rA = mkActor(R, 1.2, .5, -1.2, {bob:true}), fA = mkActor(F, -2.7, .3, 1.2, {bob:true});
  const sp = [[-1.5, hd - .6], [-.9, 1.7], [-.1, 1.0]], sSeg = [{t0:.6, pts:sp, spd:.9, L:wayLen(sp)}], keys = walkKeys([-1.5, hd - .6, 0, -1], sSeg, 0); let t = 2.2;
  t = dlgBuild([["R", "Na, da ist ja unser Arach! Und aufgemotzt, wie ich sehe. Mase hat sich wieder ausgetobt.", "j"]], t, c) + .2; const tA = t;
  t = dlgBuild([["A", "Messer, Schild, Karte, Backpack. Ich bin bereit."]], t, c) + .2;
  t = dlgBuild([["R", "Gut, denn ich hab was für dich. Dein erster Job. Nichts Wildes, versprochen.", "!"]], t, c) + .2; const tB = t;
  t = dlgBuild([["R", "Das Kreditkontor Brandt & Co., zwei Straßen weiter. Altes Haus, dicke Mauern. Im Tresor liegen Goldbarren, die gehören 'nem Typen, der sie nicht braucht."]], t, c) + .2;
  t = dlgBuild([["A", "Wie komme ich rein?"], ["R", "Von oben. Vorne ist zu und innen hängen Kameras. Aber die Feuerleiter in unserer Gasse führt aufs Dach, und da ist ein Lüftungsschacht direkt in die Schalterhalle.", "t"]], t, c) + .2; const tC = t;
  t = dlgBuild([["F", "Pass auf die Wachroboter auf, Süße. Zwei Stück. Nicht viele, aber die schießen.", "j"]], t, c) + .2;
  t = dlgBuild([["R", "Such die Tresor-Konsole in der Halle, hack sie, räum den Tresor aus und pack alles in dein Backpack. Dann raus, wie du reingekommen bist.", "t"]], t, c) + .2;
  t = dlgBuild([["R", "Und Kleine: Das Gold gehört dir. Mein Anteil sind die Kunden, die danach Schlange stehen. Kauf dir Upgrades damit.", "j"], ["A", "Verstanden. Bis später, Rackson."]], t, c);
  const dur = t + 1.4, last = keys[keys.length - 1]; keys.push([dur, last[1], last[2], last[3], last[4], 0, last[6], 0, 1, 0]);
  c.ev.push([.1, () => $("fade").classList.remove("on")], [dur - 1.1, () => $("fade").classList.add("on")]);
  return finishCut({dur, bin:.4, bout:.7, ev:c.ev, subs:c.subs,
    shots:[{t0:0, t1:tA, a:[-.4, 1.6, 2.9, .4, .9, .3, 58], b:[-.2, 1.5, 2.7, .5, .9, .4, 54]}, {t0:tA, t1:tB, a:[-.6, 1.5, 2.6, .6, .95, -.1, 50], b:[-.3, 1.45, 2.4, .8, .95, -.1, 46]},
      {t0:tB, t1:tC, a:[-.3, 1.3, 1.9, 1.2, 1.0, .5, 42], b:[0, 1.25, 1.8, 1.2, 1.0, .5, 38]}, {t0:tC, t1:dur, a:[.2, 1.5, 2.8, -1.2, .9, .2, 55], b:[0, 1.45, 2.6, -1.0, .9, .2, 52]}],
    init() { cutPlace(-1.5, hw, hd - .6, 0, 1, 0, 0, 0, -1); },
    spider(tt, dt) { pathPose(keys, tt, dt); actorTick(rA, tt, dt, PC, pos); actorTick(fA, tt, dt, PZ, pos); },
    final() {}, onEnd() { gear.job = 1; ch2.stage = 9; writeSave(); enterStreet("esc"); toast("Neuer Auftrag: Kreditkontor"); } });
}

/* ---------- Rackson trifft dich vor Mases Garage ---------- */
function rackMeetCut() {
  const hw = hwS(), hd = SD/2, c = {ev:[], subs:[]}, R = makeRobot({body:0x3a4a5a, acc:0x3c8680, glow:0x8ad0a0, tape:true, apron:0x2a2c30, cool:true});
  R.glass.visible = false; exG.add(R.g); exAct.push(R); SPK.R.R = R;
  const sx = GARX - 1.0, sz = hd - 2.3, rx = GARX + 1.5, rz = hd - 2.3, rA = mkActor(R, DOORX + .8, -hd + .5, 0, {bob:true});
  const tW = actorGo(rA, .8, [[DOORX + .8, -hd + .5], [DOORX - .5, -1.2], [rx + 2.2, rz - 1.2], [rx, rz]], 1.5); let t = tW + .3;
  t = dlgBuild([["R", "Ey, Arach! Genau dich hab ich gesucht. Und siehe da, Mase hat ganze Arbeit geleistet.", "j"]], t, c) + .2; const tA = t;
  t = dlgBuild([["A", "Messer, Schild, Karte, Backpack. Alles installiert."]], t, c) + .2;
  t = dlgBuild([["R", "Hübsch. Aber bei mir ist's weniger hübsch: Meine alte Klinge ist beim letzten Job in zwei Teile gegangen. Ich brauch 'ne neue Waffe.", "w"]], t, c) + .2; const tB = t;
  t = dlgBuild([["R", "Deshalb bin ich auf dem Weg zu Mase. Ich hab genug Altmetall dabei, dass er mir was Ordentliches baut.", "t"], ["A", "Er ist drin und schraubt noch an irgendwas."]], t, c) + .2;
  t = dlgBuild([["R", "Perfekt. Warte unten in der Werkstatt auf mich, ich besprech das kurz mit Mase. Dann hab ich was für dich, Arach.", "j"]], t, c) + .3; const tC = t;
  const rs = rackSpot(), tIn = actorGo(rA, t, [[rx, rz], [GARX + .6, hd - .6], [GARX + .3, hd + 1.8], rs], 1.3), dur = tIn + .8;
  c.ev.push([.1, () => $("fade").classList.remove("on")], [dur - .7, () => $("fade").classList.add("on")]);
  const cx = (rx + sx)/2;
  return finishCut({dur, bin:.5, bout:.6, ev:c.ev, subs:c.subs,
    shots:[{t0:0, t1:tW + .3, a:[DOORX - 2.5, 1.6, -hd + .3, DOORX - 1.5, 1.0, -1.0, 56], b:[rx + 4.5, 1.7, -2.4, rx + 1.0, 1.0, rz, 52]}, {t0:tW + .3, t1:tA, a:[cx + .6, 1.5, -hd + .6, cx, 1.0, rz, 60], b:[cx + .2, 1.45, -hd + 1.1, cx, 1.0, rz, 56]},
      {t0:tA, t1:tB, a:[sx + 1.7, 1.0, rz - 2.0, sx, .6, sz, 46], b:[sx + 1.4, .95, rz - 1.7, sx, .6, sz, 42]}, {t0:tB, t1:tC, a:[sx - .7, 1.4, rz - 2.2, rx, 1.2, rz, 46], b:[sx - .4, 1.4, rz - 1.9, rx, 1.2, rz, 42]},
      {t0:tC, t1:dur, a:[GARX + 3.2, 1.5, -.8, GARX + .6, 1.1, hd - 1.0, 54], b:[GARX + 2.8, 1.5, -.4, GARX + .3, 1.1, hd + .6, 50]}],
    init() { cutPlace(sx, hw, sz, 1, 0, 0, 0, 1, 0); },
    spider(tt, dt) { pathPose(holdKeys([sx, hw, sz], [1, 0, 0], [0, 1, 0]), tt, dt); actorTick(rA, tt, dt, PC, pos); },
    final() {}, onEnd() { shopRack = R; R.g.position.set(rs[0], 0, rs[1]); R.g.rotation.y = rs[2]; gear.rackMet = true; gear.rackReady = false; ch2.rw = 0; ch2.rwI = 0; cutPlace(sx, hw, sz, 1, 0, 0, 0, 1, 0); mode = "surf"; setObj(jobObj()); writeSave(); setTimeout(() => $("fade").classList.remove("on"), 250); } });
}

/* ---------- Rackson wartet in Mases Werkstatt ---------- */
let shopRack = null;
function rackSpot() { const M = shopM, mx = M ? M.g.position.x : GARX, mz = M ? M.g.position.z : SD/2 + 4; return [mx + 1.5, mz - .9, Math.atan2(-1.5, .9 + .3)]; }
function rackShopTick(dt) {
  if (xs.scene !== "street" || !shopM || gear.job !== 0 || !gear.rackMet || ch2.stage !== 8) return;
  if (mode !== "cut" && (!shopRack || shopRack.g.parent !== exG)) { const R = makeRobot({body:0x3a4a5a, acc:0x3c8680, glow:0x8ad0a0, tape:true, apron:0x2a2c30, cool:true}), s = rackSpot(); R.glass.visible = false; exG.add(R.g); exAct.push(R); R.g.position.set(s[0], 0, s[1]); R.g.rotation.y = s[2]; shopRack = R; }
  if (mode === "surf" && !gear.rackReady && pos.z > SD/2 + .3 && shopRack && shopM) {
    ch2.rw = (ch2.rw || 0) - dt; if (ch2.rw > 0) return;
    const i = ch2.rwI || 0;
    if (i >= RM_TALK.length) { gear.rackReady = true; setObj(jobObj()); toast("Rackson ist fertig"); beep(900, .1, 0, .04); beep(1300, .1, .12, .04); return; }
    const [k, txt, mood] = RM_TALK[i]; SPK.R.R = shopRack; speakCut(k, txt, mood); showSub(SPK[k].name, txt); ch2.rwI = i + 1; ch2.rw = dryDur(txt, SPK[k].vi, mood) + .9;
  }
}
const RM_TALK = [["R", "Also, Mase: Ich brauch 'ne neue Pistole. Kompakt, aber mit ordentlich Wumms.", "j"], ["M", "Hmm, hmm. Kompakt mit Wumms. Patronen oder Energiezelle?", "t"],
  ["R", "Energiezelle. Ich hab keine Lust, im Gefecht Schüsse zu zählen.", "t"], ["M", "Dann bau ich dir einen Kondensator in den Griff. Drei Schuss schnell, danach kurz laden.", "t"],
  ["R", "Und leise. Die Nachbarn schlafen eh schlecht.", "j"], ["M", "Leise geht. Ein Dämpfer aus dem Altmetall, das du mitgebracht hast. Bis morgen, versprochen.", "w"],
  ["R", "Du bist ein Schatz, Mase.", "j"], ["M", "Ich summ dabei was Schönes.", "w"]];
function maseInteract() {
  if (xs.scene !== "street" || !shopM || shopM.g.parent !== exG || !gear.knife || pos.z < SD/2 + .3 || Math.hypot(pos.x - shopM.g.position.x, pos.z - shopM.g.position.z) > 3.4) return null;
  return {label:"Mase: Upgrades", act:() => { maseLine("Hmm hmm. Was darf's sein, Kleine?"); maseShop = true; invTab = 3; invOpen = true; invEl.classList.add("show"); paused = true; unlockPtr(); invSel = 0; try { ivRender(); } catch (e) { console.error(e); } try { uiSnd(.8, "ok"); } catch (e) {} }};
}
function rackInteract() {
  if (xs.scene === "street" && gear.job >= 2 && gear.gold > 0 && payRack && payRack.g.parent === exG && Math.hypot(pos.x - payRack.g.position.x, pos.z - payRack.g.position.z) < 3.2) return {label:"Gold an Rackson übergeben", act:sellGold};
  if (xs.scene === "street" && ch2.stage === 8 && gear.job === 0 && gear.rackReady && shopRack && shopRack.g.parent === exG && Math.hypot(pos.x - shopRack.g.position.x, pos.z - shopRack.g.position.z) < 3.4) return {label:"Mit Rackson reden", act:() => startCut(jobCutShop())};
  return null;
}
function jobCutShop() {
  const hw = hwS(), c = {ev:[], subs:[]}, R = shopRack, M = shopM, s = rackSpot(), rx = s[0], rz = s[1], mx = M.g.position.x, mz = M.g.position.z, sx = rx - 1.7, sz = rz - 1.0;
  SPK.R.R = R; const rA = mkActor(R, rx, rz, s[2], {bob:true}); let t = 1.0;
  t = dlgBuild([["R", "So, fertig! Mase baut mir bis morgen was Schönes. Und jetzt zu dir, Arach.", "j"]], t, c) + .2; const tA = t;
  t = dlgBuild([["R", "Ich hab was für dich. Dein erster Job. Nichts Wildes, versprochen.", "!"]], t, c) + .2;
  t = dlgBuild([["R", "Das Kreditkontor Brandt & Co., zwei Straßen weiter. Altes Haus, dicke Mauern. Im Tresor liegen Goldbarren, die gehören 'nem Typen, der sie nicht braucht."]], t, c) + .2; const tB = t;
  t = dlgBuild([["A", "Wie komme ich rein?"], ["R", "Von oben. Vorne ist zu und innen hängen Kameras. Aber die Feuerleiter in unserer Gasse führt aufs Dach, und da ist ein Lüftungsschacht direkt in die Schalterhalle.", "t"]], t, c) + .2;
  t = dlgBuild([["M", "Pass auf die Wachroboter auf, Kleine. Zwei Stück. Nicht viele, aber die schießen.", "w"]], t, c) + .2; const tC = t;
  t = dlgBuild([["R", "Such die Tresor-Konsole in der Halle, hack sie, räum den Tresor aus und pack alles in dein Backpack. Dann raus, wie du reingekommen bist.", "t"]], t, c) + .2;
  t = dlgBuild([["R", "Und Kleine: Das Gold gehört dir. Mein Anteil sind die Kunden, die danach Schlange stehen. Kauf dir Upgrades damit.", "j"], ["A", "Verstanden. Bis später, Rackson."]], t, c);
  const dur = t + 1.0; c.ev.push([.1, () => $("fade").classList.remove("on")], [dur - .9, () => $("fade").classList.add("on")]);
  return finishCut({dur, bin:.4, bout:.7, ev:c.ev, subs:c.subs,
    shots:[{t0:0, t1:tA, a:[sx - 1.2, 1.5, sz - 2.0, rx, 1.0, rz, 56], b:[sx - .8, 1.45, sz - 1.7, rx, 1.0, rz, 50]}, {t0:tA, t1:tB, a:[rx - 2.3, 1.4, rz - 1.9, rx, 1.1, rz, 44], b:[rx - 1.9, 1.35, rz - 1.6, rx, 1.1, rz, 40]},
      {t0:tB, t1:tC, a:[sx + .6, 1.0, sz - 1.7, sx, .6, sz, 44], b:[sx + .8, .95, sz - 1.5, sx, .6, sz, 40]}, {t0:tC, t1:dur, a:[rx + .5, 1.5, rz - 3.0, (rx + mx)/2, 1.1, (rz + mz)/2, 54], b:[rx + .3, 1.45, rz - 2.5, (rx + mx)/2, 1.1, (rz + mz)/2, 50]}],
    init() { cutPlace(sx, hw, sz, 1, 0, 0, 0, 1, 0); M.talk = false; M.cutFace = _maseFace.set(rx, 1, rz); },
    spider(tt, dt) { pathPose(holdKeys([sx, hw, sz], [1, 0, 0], [0, 1, 0]), tt, dt); actorTick(rA, tt, dt, PC, pos); shopTick(dt); },
    final() { M.cutFace = null; }, onEnd() { M.cutFace = null; exG.remove(R.g); const i = exAct.indexOf(R); if (i >= 0) exAct.splice(i, 1); shopRack = null; gear.job = 1; ch2.stage = 9; writeSave(); enterStreet("esc"); toast("Neuer Auftrag: Kreditkontor"); } });
}

/* ======================= Heist: Dach, Schalterhalle, Tresor ======================= */
const hz = {bots:[], fx:[], piles:[], door:null, doorU:0, doorT:0, doorBl:[], term:null, alert:0, t:0, bl:null, ventP:null, redL:null, fail:0, done:false, shot:null, lootN:0};
function jobReset() { hz.bots.length = 0; hz.fx.length = 0; hz.piles.length = 0; hz.doorBl.length = 0; hz.door = null; hz.term = null; hz.alert = 0; hz.bl = null; hz.redL = null; hz.shot = null; hz.done = false; try { sirenOn(false); } catch (e) {} }
function enterHeist(kind) { window.loadShow && (loadShow(), loadHideSoon(2200));
  cpSet("heist"); exLeaveOld(); xs.cast = true; const hw = hwS();
  if (kind === "roof") { buildRoof(); ch2.stage = 9; placeAt(-7.2, hw, 4.3, 0, 1, 0, 1, 0, 0); setObj("Öffne das Lüftungsgitter am Dachaufbau und dring ins Kreditkontor ein."); }
  else { buildBank(); ch2.stage = 9; placeAt(-6.8, 6 - hw, 4.8, 0, -1, 0, 1, 0, 0); setObj(gear.hacked ? "Räum den Tresor aus (E) und flieh durch den Lüftungsschacht an der Decke." : "Hack die Tresor-Konsole an der Ostwand. Weiche den Wachrobotern aus – oder grill sie mit dem Laser."); }
  setTimeout(() => { $("fade").classList.remove("on"); }, 350);
}
function toBank() { $("fade").classList.add("on"); setTimeout(() => { enterHeist("bank"); toast("Kreditkontor · Schalterhalle"); setTimeout(() => startCut(bankArriveCut()), 80); }, 650); }
function heistExit() {
  $("fade").classList.add("on"); gear.job = 2; gear.loot = [0, 0, 0, 0]; gear.hacked = false;
  setTimeout(() => { writeSave(); enterStreet("esc"); toast(T("Auftrag abgeschlossen") + " · " + gear.gold + " " + T("Goldbarren")); setObj(jobObj()); setTimeout(() => say("RACKSON", "Gute Arbeit, Kleine! Ich hab's schon gehört. Schau in dein Backpack und bau dir was Schönes ein.", 7), 1200); }, 700);
}
function buildRoof() {
  const W = 18, Hh = 9, D = 14, steel = mStd(0x4a5468, .5, .6), dark = mStd(0x151b2e, .5, .6), orange = mStd(0x3c8680, .5, .5);
  const asph = canvasTex(128, 128, (x, w, h) => { x.fillStyle = "#31353b"; x.fillRect(0, 0, w, h); speckle(x, w, h, 900, .22); }, 8, 6);
  const facade = (seed, cols) => { let sd = seed; const rnd = () => (sd = (sd*16807)%2147483647)/2147483647; const cv = [0, 1].map(() => { const c = document.createElement("canvas"); c.width = 1024; c.height = 512; return c; }), a = cv[0].getContext("2d"), e = cv[1].getContext("2d");
    a.fillStyle = "#42464d"; a.fillRect(0, 0, 1024, 512); for (let k = 0; k < 2600; k++) { a.fillStyle = rnd() < .5 ? "rgba(0,0,0,.13)" : "rgba(255,255,255,.05)"; a.fillRect(rnd()*1024, rnd()*512, 3 + rnd()*10, 2); }
    for (let r = 0; r < 28; r++) { a.fillStyle = "rgba(0,0,0,.1)"; a.fillRect(0, r*18 + 17, 1024, 1); }
    e.fillStyle = "#000"; e.fillRect(0, 0, 1024, 512); const cw = 1024/cols;
    for (let r = 0; r < 3; r++) for (let c = 0; c < cols; c++) { const x = c*cw + cw*.22, y = r*170 + 40, w = cw*.56, h = 98; a.fillStyle = "#26292f"; a.fillRect(x - 6, y - 6, w + 12, h + 12); a.fillStyle = "#13161c"; a.fillRect(x, y, w, h); a.fillStyle = "#34383e"; a.fillRect(x - 10, y + h + 6, w + 20, 7);
      a.fillStyle = "#60646b"; a.fillRect(x + w/2 - 1.5, y, 3, h); a.fillRect(x, y + h*.5, w, 3);
      if (rnd() < .42) { const warm = rnd() < .7; e.fillStyle = warm ? "#78c4bd" : "#a3a8b0"; e.fillRect(x, y, w, h); e.fillStyle = "rgba(0,0,0,.55)"; for (let b = 0; b < 6; b++) e.fillRect(x, y + b*h/6 + (rnd() < .5 ? 3 : 0), w, 2); e.fillStyle = "#000"; e.fillRect(x + w/2 - 1.5, y, 3, h); e.fillRect(x, y + h*.5, w, 3); }
      else if (rnd() < .3) { a.fillStyle = "#565a60"; a.fillRect(x + 3, y + 3, w - 6, h*.45); } }
    for (let p = 0; p < 2; p++) { const px = 40 + rnd()*940; a.fillStyle = "#31353b"; a.fillRect(px, 0, 10, 512); a.fillStyle = "rgba(255,255,255,.08)"; a.fillRect(px + 2, 0, 2, 512); }
    const mk = c => { const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }; return [mk(cv[0]), mk(cv[1])]; };
  const fW = facade(11, 6), fE = facade(23, 6), fN = facade(37, 8), fS = facade(53, 8);
  const top = canvasTex(8, 8, (x, w, h) => { x.fillStyle = "#191c22"; x.fillRect(0, 0, w, h); }, 1, 1);
  exRoom(W, Hh, D, {floor:asph, ceil:top, wW:fW[0], wE:fE[0], wN:fN[0], wS:fS[0]}); roomMeshes[1].visible = false; skyLim = 1e9;
  [[2, fW], [3, fE], [4, fN], [5, fS]].forEach(([k, f]) => { const m = roomMeshes[k].material; m.emissiveMap = f[1]; m.emissive = new THREE.Color(0xffffff); m.emissiveIntensity = .85; m.roughness = .95; m.needsUpdate = true;
    if (k === 5) return; const t0 = f[0].clone(), t1 = f[1].clone(); t0.needsUpdate = t1.needsUpdate = true; t0.wrapS = t0.wrapT = t1.wrapS = t1.wrapT = THREE.RepeatWrapping; t0.repeat.set(1, 3); t1.repeat.set(1, 3);
    const w = k < 4 ? D : W, n = PLANES[k].m, c0 = roomMeshes[k].position, ex = new THREE.Mesh(new THREE.PlaneGeometry(w, 27), new THREE.MeshStandardMaterial({map:t0, emissiveMap:t1, emissive:0xffffff, emissiveIntensity:.7, roughness:.95})); ex.position.set(c0.x, Hh + 13.5, c0.z); ex.lookAt(ex.position.x + n.x, ex.position.y, ex.position.z + n.z); exG.add(ex); });
  // Skyline hinter der Südwand: echte Gebäude, Fenster leuchten
  { const wt = (cols, seed) => { let sd = seed; const rnd = () => (sd = (sd*16807)%2147483647)/2147483647; return canvasTex(128, 256, (x, w, h) => { x.fillStyle = "#16191f"; x.fillRect(0, 0, w, h); for (let r = 0; r < 14; r++) for (let c = 0; c < cols; c++) if (rnd() < .38) { x.fillStyle = rnd() < .75 ? "#78c4bd" : "#afb4bb"; x.fillRect(c*w/cols + 3, r*18 + 4, w/cols - 8, 10); } }, 1, 1); };
    let sd = 7; const rnd = () => (sd = (sd*16807)%2147483647)/2147483647;
    for (let k = 0; k < 16; k++) { const bw = 7 + rnd()*8, bh = 16 + rnd()*44, bz = D/2 + 10 + rnd()*34, bx = -62 + k*8 + rnd()*5, t = wt(3 + (rnd()*3 | 0), 100 + k); t.repeat.set(Math.max(1, Math.round(bw/7)), Math.max(1, Math.round(bh/16)));
      const bm = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bw*.8), new THREE.MeshBasicMaterial({map:t})); bm.position.set(bx, bh/2 - 6, bz); exG.add(bm); if (rnd() < .5) { const an = new THREE.Mesh(new THREE.BoxGeometry(.2, 5 + rnd()*6, .2), new THREE.MeshBasicMaterial({color:0x151b2e})); an.position.set(bx, bh - 6 + 3, bz); exG.add(an); } }
    const sp = new Float32Array(900); for (let k = 0; k < 300; k++) { const a = rnd()*Math.PI*2, e = .25 + rnd()*1.1, r = 150; sp[k*3] = Math.cos(a)*Math.cos(e)*r*(rnd() < .5 ? 1 : 1); sp[k*3 + 1] = 30 + Math.sin(e)*r*.7; sp[k*3 + 2] = Math.sin(a)*Math.cos(e)*r; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3)); exG.add(new THREE.Points(sg, new THREE.PointsMaterial({color:0xdfe8ff, size:1.6, sizeAttenuation:false, fog:false})));
    const moon = new THREE.Mesh(new THREE.CircleGeometry(5, 24), new THREE.MeshBasicMaterial({color:0xe8eeff, fog:false})); moon.position.set(-18, 52, -60); moon.lookAt(0, 20, 0); exG.add(moon); }

  for (const [x, z] of [[-4, -3.2], [-1.2, -4.6]]) { exBox(1.8, 1.0, 1.1, steel, x, .5, z, true); const f = new THREE.Mesh(new THREE.CircleGeometry(.38, 16), new THREE.MeshBasicMaterial({color:0x07090f})); f.rotation.x = -Math.PI/2; f.position.set(x, 1.01, z); exG.add(f); exBox(1.84, .06, 1.14, dark, x, .98, z); }
  exBox(.12, .12, 3, steel, -2.6, .7, -3.9); exBox(.9, 1.3, .9, steel, 6.2, .65, -4.8, true);                       // Rohr, Schornstein
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.7, 16), mStd(0x3a4560, .4, .7)); tank.position.set(-5.8, 2.7, -4.0); tank.castShadow = true; exG.add(tank); const lid = new THREE.Mesh(new THREE.ConeGeometry(1.05, .35, 16), dark); lid.position.set(-5.8, 3.75, -4.0); exG.add(lid);
  for (const [dx, dz] of [[-.75, -.75], [.75, -.75], [-.75, .75], [.75, .75]]) exBox(.1, 1.9, .1, dark, -5.8 + dx, .95, -4.0 + dz, true);
  exBox(.1, 6, .1, dark, 6.5, 3, 3.8); const bl = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), new THREE.MeshBasicMaterial({color:0x3c8680})); bl.position.set(6.5, 6.1, 3.8); exG.add(bl); hz.bl = bl;
  exBox(1.5, .9, 1.5, steel, 3.5, .45, -2.2, true); exBox(1.25, .05, 1.25, dark, 3.5, .92, -2.2); { const gg = new THREE.Group(), gm = mStd(0x6a7488, .6, .5); for (let k = 0; k < 5; k++) { const sl = new THREE.Mesh(new THREE.BoxGeometry(1.25, .03, .05), gm); sl.position.z = -.5 + k*.25; gg.add(sl); } for (const x of [-.6, .6]) { const fr = new THREE.Mesh(new THREE.BoxGeometry(.05, .03, 1.25), gm); fr.position.x = x; gg.add(fr); } gg.position.set(3.5, .96, -2.2); exG.add(gg); hz.grate = gg; } exBox(.5, .12, .02, orange, 3.5, .5, -1.44);
  exBox(2.4, 2.3, 1.3, steel, -7.8, 1.15, 6.2, true); { const dr = new THREE.Group(), lf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.0, .06), mStd(0x2a3244, .6, .5)); lf.position.x = .55; dr.add(lf); dr.position.set(-8.35, 1.0, 5.52); exG.add(dr); hz.hut = dr; exBox(1.25, 2.1, .04, dark, -7.8, 1.05, 5.53); } for (const x of [-8.8, -6.8]) exBox(.06, .9, .06, dark, x, .5, 6.0);                  // Dachluke / Geländer der Feuerleiter
  xs.lights = []; exPt(0xe0a060, .9, 16, -3, 3, 5); exPt(0x7a90d0, .9, 16, 5, 3, -4); exPt(0x3c8680, 1.1, 6, 3.5, 1.5, -.8);
  scene.fog = new THREE.FogExp2(0x101a34, .016); scene.background = new THREE.Color(0x0a1226);
  Object.assign(xs, {scene:"roof", env:"alley", dark:false, hI:1.3, hC:0x8a9ac8, hG:0x2a2c3c});
  hz.ventP = V3(3.5, 0, -2.2);
}
function buildBank() {
  const W = 18, Hh = 6, D = 13, hd = D/2, hw = W/2;
  const floor = canvasTex(128, 128, (x, w, h) => { x.fillStyle = "#e8eefc"; x.fillRect(0, 0, w, h); x.fillStyle = "#30343a"; x.fillRect(0, 0, w/2, h/2); x.fillRect(w/2, h/2, w/2, h/2); speckle(x, w, h, 300, .1); }, 9, 6.5);
  const wall = canvasTex(256, 256, (x, w, h) => { x.fillStyle = "#373a41"; x.fillRect(0, 0, w, h); x.fillStyle = "#292c33"; x.fillRect(0, h*.62, w, h*.38); x.fillStyle = "#e8eefc"; x.fillRect(0, h*.62 - 2, w, 4); x.fillStyle = "#4fa9a3"; x.fillRect(0, h*.62 + 4, w, 2); for (let i = 0; i < 4; i++) { x.strokeStyle = "rgba(232,238,252,.18)"; x.strokeRect(i*64 + 8, 14, 48, h*.62 - 34); } speckle(x, w, h, 500, .08); }, 4, 1);
  const ceil = canvasTex(64, 64, (x, w, h) => { x.fillStyle = "#22252b"; x.fillRect(0, 0, w, h); x.fillStyle = "#30343a"; x.fillRect(0, 0, w, 6); x.fillRect(0, 0, 6, h); }, 8, 6);
  exRoom(W, Hh, D, {floor, ceil, wW:wall, wE:wall, wN:wall, wS:wall}); skyLim = 1e9;
  const wood = pbrMat("wood", 1, 1, 0x7a6a8a, 0), steel = mStd(0x4a5468, .7, .45), dark = mStd(0x151b2e, .5, .6), brass = mStd(0xc8a24a, .8, .35), white = mStd(0xe8eefc, .2, .6), orange = mStd(0x3c8680, .5, .5), gold = new THREE.MeshStandardMaterial({color:0xe8b84a, metalness:.9, roughness:.28, emissive:0x3a2606});
  // Schalter-Tresen
  exBox(6.0, 1.1, .8, wood, -4, .55, -.5, true); exBox(6.2, .06, .95, brass, -4, 1.12, -.5); for (const x of [-6.2, -4, -1.8]) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .7), new THREE.MeshStandardMaterial({color:0x8ab0d8, transparent:true, opacity:.25, roughness:.1})); gl.position.set(x, 1.5, -.5); exG.add(gl); exBox(.04, .7, .04, brass, x - .65, 1.5, -.5); exBox(.04, .7, .04, brass, x + .65, 1.5, -.5); }
  // Säulen, Bänke, Schreibtisch
  for (const [x, z] of [[-4.5, 2.3], [1.5, 2.3], [1.5, -2.4], [-4.5, -2.4]]) { exBox(.7, Hh, .7, white, x, Hh/2, z, true); exBox(.9, .15, .9, brass, x, .08, z); exBox(.9, .15, .9, brass, x, Hh - .08, z); }
  for (const x of [-6, -2]) { exBox(2.4, .45, .6, wood, x, .22, 5.7, true); exBox(2.4, .5, .12, wood, x, .7, 5.95); }
  exBox(1.6, .75, .8, wood, -7.8, .38, -5.5, true); exBox(.4, .35, .05, dark, -7.8, 1.0, -5.75); exBox(1.0, .25, 1.0, steel, -3.2, .12, -5.5, true);
  // Tresor: Wände, Dach, Tür
  const vx0 = 4.6, vz1 = -2.2; exBox(.3, 3.2, 4.3, steel, vx0, 1.6, -4.35, true); exBox(1.4, 3.2, .3, steel, 5.3, 1.6, vz1, true); exBox(1.4, 3.2, .3, steel, 8.3, 1.6, vz1, true); exBox(1.8, .9, .3, steel, 6.8, 2.75, vz1); exBox(4.5, .2, 4.35, steel, 6.85, 3.1, -4.35, true);
  const door = new THREE.Group(); door.position.set(6.8, 1.18, vz1 + .3); exG.add(door); hz.door = door;
  { const slab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.36, .22), mStd(0x6a7790, .75, .4)); slab.castShadow = true; door.add(slab); const ring = new THREE.Mesh(new THREE.TorusGeometry(.45, .06, 8, 24), orange); ring.position.z = .14; door.add(ring); for (let k = 0; k < 4; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(.9, .05, .05), orange); sp.rotation.z = k*Math.PI/4; sp.position.z = .14; door.add(sp); } const pl = new THREE.Mesh(new THREE.PlaneGeometry(.9, .2), sign("TRESOR", "#e8eefc", .9, .2, "#292c33")); pl.position.set(0, .85, .12); door.add(pl); }
  for (const [w, h, x, y] of [[.12, 2.42, 5.94, 1.21], [.12, 2.42, 7.66, 1.21], [1.84, .12, 6.8, 2.4]]) exBox(w, h, .1, brass, x, y, vz1 + .14); const dbl = []; pushBox(dbl, 5.95, 7.65, 0, 2.3, vz1 + .15, vz1 + .41); hz.doorBl = dbl; hz.doorU = gear.hacked ? 1 : 0; hz.doorT = hz.doorU; if (!gear.hacked) blocks.push(...dbl); else door.position.x = 6.8 + 1.75;
  // Gold
  hz.piles = []; [[5.6, -3.2], [8.1, -3.3], [5.6, -5.6], [8.1, -5.6]].forEach(([x, z], i) => { const g = new THREE.Group(); g.position.set(x, 0, z); exG.add(g); exBox(.9, .1, .9, dark, x, .05, z, true);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3 - r; k++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(.34, .1, .18), gold); bar.position.set(-.3 + k*.36 + r*.18, .15 + r*.1, 0); bar.castShadow = true; g.add(bar); }
    if (gear.loot[i]) g.visible = false; hz.piles.push({g, x, z, i}); });
  exPt(0xffc860, 1.6, 6, 6.9, 2.4, -4.3);
  // Konsole + Lüftung + Lichter
  const T = makeTerminal("TRESOR-NET", V3(hw, 0, 1.8), V3(-1, 0, 0)); T.tmp = true; exG.add(T.g); blocks.push(...T.blks); T.lines = ["ZUGRIFF GEWÄHRT", "", "› Tresor 3: entriegelt", "› Kameras: Schleife", "› Tür fährt auf …", "› Alarm: Stufe 1"]; T.onHack = hackedVault; if (gear.hacked) { T.hacked = true; } drawScreen(T, 0, 0); T.active = true; hz.term = T;
  { const gr = new THREE.Group(); gr.position.set(-6.8, Hh - .05, 4.8); exG.add(gr); const f = new THREE.Mesh(new THREE.BoxGeometry(1.2, .08, 1.2), dark); gr.add(f); for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, .05, .05), steel); b.position.set(0, -.05, -.45 + k*.22); gr.add(b); } }
  xs.lights = []; exPt(0xffd8a0, 1.3, 13, -5, 5, 2); exPt(0xffd8a0, 1.3, 13, 1, 5, 2); exPt(0xffd8a0, 1.3, 13, -3, 5, -4.5); exPt(0xffd8a0, 1.0, 12, 5, 5, 4.5); hz.redL = exPt(0xff2010, 0, 14, 0, 5.4, 0);
  const shl = new THREE.Mesh(new THREE.BoxGeometry(.02, .02, 1), new THREE.MeshBasicMaterial({color:0xff5a3a})); shl.visible = false; exG.add(shl); hz.shot = shl;
  scene.fog = new THREE.FogExp2(0x101a34, .02); scene.background = new THREE.Color(0x0a1226);
  Object.assign(xs, {scene:"bank", env:"bar", dark:false, hI:.9, hC:0xb8c4e8, hG:0x2a2c3c});
  // Wachroboter
  hz.bots.length = 0;
  for (const W of [[[-7, 3.6], [-1, 3.6], [5, 3.6], [5, 1.0], [-1, 1.0], [-7, 1.0]], [[-6.5, -3.6], [3.2, -3.6], [3.2, .5], [-.5, .5], [-.5, -2.0]]]) {
    const R = makeRobot({body:0x2a3a5a, acc:0x3c8680, glow:0x8ad0a0}); R.glass.visible = false; exG.add(R.g); R.g.position.set(W[0][0], 0, W[0][1]); hz.bots.push({R, W, wi:1, pause:.5, hp:1, st:0, seen:99, cd:1, ph:0, dead:false, fall:0, lx:W[0][0], lz:W[0][1]}); }
  hz.alert = 0;
}
function hackedVault(T) { gear.hacked = true; hz.doorT = 1; clang(.5); beep(500, .3, 0, .08); toast("Tresor entriegelt"); setObj("Räum den Tresor aus (E) und flieh durch den Lüftungsschacht an der Decke."); writeSave(); }
function freeAt(x, z) { if (x < -8.5 || x > 8.5 || z < -6 || z > 6) return false; for (const k of blocks) { if (k.y1 < .15 || k.y0 > 1.5) continue; if (x > k.x0 - .3 && x < k.x1 + .3 && z > k.z0 - .3 && z < k.z1 + .3) return false; } return true; }
function moveBot(b, dx, dz) { const g = b.R.g.position; if (freeAt(g.x + dx, g.z)) g.x += dx; if (freeAt(g.x, g.z + dz)) g.z += dz; }
function botSees(b, d, dx, dz) {
  const ceil = nB.y < -.5, range = (ceil ? 3.4 : 8)*uTn(); if (d > range || d < .01) return false; const g = b.R.g;
  if (!b.st) { const dot = (dx*Math.sin(g.rotation.y) + dz*Math.cos(g.rotation.y))/d; if (dot < .55) return false; }
  const y = Math.max(.3, pos.y); for (let t = .3; t < d - .3; t += .3) { const x = g.position.x + dx*t/d, z = g.position.z + dz*t/d; for (const k of blocks) { if (k === hz.door) continue; if (y < k.y1 + .6 && k.y1 > 1.3 && x > k.x0 && x < k.x1 && z > k.z0 && z < k.z1) return false; } }
  return true;
}
function botShoot(b) {
  const R = b.R, g = R.g; _wp.set(g.position.x, 1.2, g.position.z); const sh = hz.shot; if (sh) { sh.visible = true; sh.position.copy(_wp).lerp(pos, .5); sh.scale.z = _wp.distanceTo(pos); sh.lookAt(pos); hz.shotT = .09; }
  beep(1400, .06, 0, .04); beep(600, .1, .03, .04);
  const ceil = nB.y < -.5; if (Math.random() < (ceil ? .4 : .62) && !(shd.on && shd.u > .5)) {
    const keys2 = Object.keys(PARTS), n = keys2[(Math.random()*keys2.length)|0], amt = (.07 + Math.random()*.08)*uPz(); PARTS[n] = Math.max(.02, PARTS[n] - amt); emitSparks(pos, nB); dmgHit = 1; story.sk += .15; thud(5); clang(.15);
    if (dmgAvg() < .3 && !hz.fail) { hz.fail = 1; showDeath("Integrität kritisch – Wachroboter haben ARACHNE-8 schwer beschädigt.", () => { for (const k in PARTS) PARTS[k] = Math.max(PARTS[k], .7); hz.fail = 0; enterHeist("bank"); }, 2800); } }
  else if (shd.on) { shd.flash = 1; }
}
function botDamage(b, dt) { if (b.dead) return; b.hp -= .4*dt*uLs(); if (!b.st) { b.st = 1; b.seen = 0; hz.alert = 1; } if (b.hp <= 0) { b.dead = true; b.fall = 0; { const g = b.R.g, dx = g.position.x - pos.x, dz = g.position.z - pos.z, L = Math.hypot(dx, dz) || 1; b.fa = {dx:dx/L, dz:dz/L, th:0, w:.25 + Math.random()*.2, bn:0, t:0, a1:(Math.random() - .5)*1.6, a2:(Math.random() - .5)*1.6, hit:false}; } clang(.6); emitSparks(_t3, nB); toast("Wachroboter ausgeschaltet"); b.R.chest.material.color.setHex(0x444a58); } }
function botRay(o, d, maxT) {
  let best = -1, bb = null; for (const b of hz.bots) { if (b.dead) continue; const p = b.R.g.position;
    for (let t = 0; t < maxT; t += .05) { const x = o.x + d.x*t - p.x, z = o.z + d.z*t - p.z, y = o.y + d.y*t - p.y; if (y > 0 && y < 1.6 && x*x + z*z < .09) { if (best < 0 || t < best) { best = t; bb = b; } break; } } }
  return bb ? {t:best, b:bb} : null;
}
function botAssist(a, d) {
  let bd = 8, bb = null; for (const b of hz.bots) { if (b.dead) continue; const p = b.R.g.position; _t4.set(p.x, 1.0, p.z).sub(a); const L = _t4.length(); if (L < bd && L > .3 && _t4.dot(d)/L > .82) { bd = L; bb = _t4.clone().multiplyScalar(1/L); } }
  if (bb) d.copy(bb); return !!bb;
}
const _t4 = V3();
function botFall(b, dt) {      // Umkippen mit Schwerkraft, Aufprall, Nachfedern, schlaffe Arme und Kopf
  const R = b.R, g = R.g, f = b.fa; if (!f) return; f.t += dt; g.rotation.order = "YXZ"; const fwdX = Math.sin(g.rotation.y), fwdZ = Math.cos(g.rotation.y), fx = f.dx*fwdX + f.dz*fwdZ, fr = f.dx*fwdZ - f.dz*fwdX;
  if (f.t < .22) { f.th += dt*.5*(f.t/.22); } else if (!f.bn) { f.w += (9.0*(Math.sin(f.th) + .25))*dt; f.th += f.w*dt; if (f.th >= 1.42) { f.th = 1.42; f.bn = 1; f.w = -f.w*.28; if (!f.hit) { f.hit = true; thud(6); clang(.35); emitSparks(_t3.set(g.position.x, .2, g.position.z), nB); } } }
  else { f.w += 14*dt; f.th += f.w*dt; if (f.th >= 1.42) { f.th = 1.42; f.w = -f.w*.3; if (Math.abs(f.w) < .2) { f.bn = 2; f.w = 0; } } }
  const k = f.th; g.rotation.x = k*fx*1.0; g.rotation.z = -k*fr*1.0; g.position.y = .14*Math.min(1, k/1.4) - .1*Math.min(1, f.t/.22)*(k < .6 ? 1 : 0);
  g.position.x += f.dx*dt*.35*Math.min(1, k/1.2)*(f.bn ? 0 : 1); g.position.z += f.dz*dt*.35*Math.min(1, k/1.2)*(f.bn ? 0 : 1);
  const fl = Math.min(1, f.t/.9); if (R.aL) { R.aL.rotation.x = -.4*fl + f.a1*fl; R.aR.rotation.x = -.4*fl + f.a2*fl; R.aL.rotation.z = -.5*fl; R.aR.rotation.z = .5*fl; R.fL.rotation.x = -.8*fl; R.fR.rotation.x = -.5*fl; } if (R.head) { R.head.rotation.x = -.55*Math.min(1, k/1.4)*Math.sign(fx || 1) + Math.sin(f.t*9)*.06*Math.exp(-f.t*2); R.head.rotation.z = .25*fr*fl; }
}
function botTick(b, dt) {
  const R = b.R, g = R.g;
  if (b.stun > 0) { b.stun -= dt; R.chest.material.color.setHex(0xe8eefc);
    if (b.kd) { if (b.kv > .05) { moveBot(b, b.kd.dx*b.kv*dt, b.kd.dz*b.kv*dt); b.kv *= Math.exp(-dt*5); }
      g.rotation.order = "YXZ"; const fx0 = Math.sin(g.rotation.y), fz0 = Math.cos(g.rotation.y), fx = b.kd.dx*fx0 + b.kd.dz*fz0, fr = b.kd.dx*fz0 - b.kd.dz*fx0, q = Math.min(1, b.stun*3.2)*(b.lean || 0)*.42; g.rotation.x = q*fx; g.rotation.z = -q*fr; if (R.head) R.head.rotation.x = -q*.8*Math.sign(fx || 1); }
    return; }
  if (g.rotation.x || g.rotation.z) { const kk = Math.max(0, 1 - dt*12); g.rotation.x *= kk; g.rotation.z *= kk; if (Math.abs(g.rotation.x) < .004) g.rotation.x = 0; if (Math.abs(g.rotation.z) < .004) g.rotation.z = 0; }
  if (b.dead) { botFall(b, dt); return; }
  const dx = pos.x - g.position.x, dz = pos.z - g.position.z, d = Math.hypot(dx, dz), see = botSees(b, d, dx, dz);
  if (see) { b.seen = 0; if (!b.st) { b.st = 1; hz.alert = 1; toast("Entdeckt!"); beep(900, .2, 0, .08); } } else b.seen += dt;
  if (b.st && b.seen > 9 && d > 9) b.st = 0;
  let mv = 0, face = g.rotation.y;
  if (!b.st) { const w = b.W[b.wi], ddx = w[0] - g.position.x, ddz = w[1] - g.position.z, dd = Math.hypot(ddx, ddz);
    if (b.pause > 0) b.pause -= dt; else if (dd < .15) { b.wi = (b.wi + 1)%b.W.length; b.pause = .9; } else { mv = .8; moveBot(b, ddx/dd*mv*dt, ddz/dd*mv*dt); face = Math.atan2(ddx, ddz); } }
  else { face = Math.atan2(dx, dz); if (d > 4.2) { mv = 1.7; moveBot(b, dx/d*mv*dt, dz/d*mv*dt); } else if (d < 2.6) { mv = -1.0; moveBot(b, -dx/d*1.0*dt, -dz/d*1.0*dt); }
    b.cd -= dt; if (b.cd <= 0 && d < 9 && d > .5 && b.seen < 1.5) { b.cd = 1.5 + Math.random()*.8; botShoot(b); } }
  let dy = face - g.rotation.y; while (dy > Math.PI) dy -= 2*Math.PI; while (dy < -Math.PI) dy += 2*Math.PI; g.rotation.y += dy*Math.min(1, dt*6);
  b.ph += Math.abs(mv)*dt*7.5/.5; const sw = mv ? Math.sin(b.ph)*.5*Math.sign(mv) : 0, k = Math.min(1, dt*10);
  R.legs[0].rotation.x += (sw - R.legs[0].rotation.x)*k; R.legs[1].rotation.x += (-sw - R.legs[1].rotation.x)*k; R.shins[0].rotation.x += ((mv ? Math.max(0, -Math.cos(b.ph))*.55 : 0) - R.shins[0].rotation.x)*k; R.shins[1].rotation.x += ((mv ? Math.max(0, Math.cos(b.ph))*.55 : 0) - R.shins[1].rotation.x)*k;
  _t4.set(g.position.x + Math.sin(g.rotation.y)*3, 0, g.position.z + Math.cos(g.rotation.y)*3); robotLife(R, PZ, clockT, dt, b.st ? pos : _t4);
  R.chest.material.color.setHex(b.st ? 0xff3a2a : 0x8ad0a0); if (b.st) { R.aR.rotation.x = -1.35; R.fR.rotation.x = -.2; }
}
function jobTick(dt) {
  if (!xs.on || (xs.scene !== "bank" && xs.scene !== "roof") || mode === "cut") return; hz.t += dt;
  if (xs.scene === "roof") { if (hz.bl) hz.bl.material.color.setHex(Math.sin(hz.t*3) > .6 ? 0xff7a2a : 0x3a1a0a); return; }
  if (hz.door) { hz.doorU += (hz.doorT - hz.doorU)*(1 - Math.exp(-dt*1.6)); hz.door.position.x = 6.8 + 1.75*hz.doorU; if (hz.doorU > .5 && hz.doorBl.length && blocks.includes(hz.doorBl[0])) for (const b of hz.doorBl) { const i = blocks.indexOf(b); if (i >= 0) blocks.splice(i, 1); } }
  for (const p of hz.piles) if (p.g.visible) p.g.rotation.y = Math.sin(hz.t*.7 + p.i)*.05;
  for (let i = hz.fx.length - 1; i >= 0; i--) { const f = hz.fx[i]; f.t += dt/.55; if (f.t >= 1) { exG.remove(f.m); hz.fx.splice(i, 1); continue; } f.m.position.lerpVectors(f.a, pos, f.t); f.m.position.y += Math.sin(f.t*Math.PI)*.5; f.m.scale.setScalar(1 - f.t*.7); }
  for (const b of hz.bots) botTick(b, dt);
  if (hz.shot && hz.shotT > 0) { hz.shotT -= dt; if (hz.shotT <= 0) hz.shot.visible = false; }
  const al = hz.bots.some(b => !b.dead && b.st); if (al !== !!hz.alarmOn) { hz.alarmOn = al; try { sirenOn(al); } catch (e) {} if (!al) toast("Alarm beendet"); }
  if (hz.redL) hz.redL.intensity = al ? 1.2 + Math.sin(hz.t*8)*1.0 : 0;
}
function lootPile(p) {
  p.g.visible = false; gear.loot[p.i] = 1; gear.gold += 5; const bar = new THREE.Mesh(new THREE.BoxGeometry(.34, .1, .18), new THREE.MeshBasicMaterial({color:0xf2c860})); bar.position.set(p.x, .3, p.z); exG.add(bar); hz.fx.push({m:bar, t:0, a:bar.position.clone()});
  clang(.3); beep(1500, .08, 0, .05); beep(2100, .1, .08, .05); toast("+5 Goldbarren → Backpack"); writeSave();
}
function jobInteract() {
  if (xs.scene === "street" && ch2.stage === 9 && gear.job === 1 && Math.hypot(pos.x - 1.1, pos.z + SD/2) < 2.4 && pos.y < 3) return {label:"Feuerleiter: aufs Dach klettern", act:() => startCut(climbCut())};
  if (xs.scene === "roof" && hz.ventP && Math.hypot(pos.x - hz.ventP.x, pos.z - hz.ventP.z) < 1.9 && pos.y < 1.6) return {label:"Lüftungsgitter aufschneiden", act:() => startCut(ventCut())};
  if (xs.scene !== "bank") return null;
  const ni = nearTerminal(); if (ni >= 0 && terms[ni].tmp && !terms[ni].hacked) return {label:"Konsole hacken · " + terms[ni].name, act:() => startHack()};
  for (const p of hz.piles) if (p.g.visible && gear.hacked && hz.doorU > .7 && Math.hypot(pos.x - p.x, pos.z - p.z) < 1.5 && pos.y < 1.2) return {label:"Gold in den Backpack packen", act:() => lootPile(p)};
  if (nB.y < -.6 && Math.hypot(pos.x + 6.8, pos.z - 4.8) < 1.9) { const left = hz.piles.some(p => p.g.visible); return gear.loot.some(v => v) ? {label:left ? "Lüftungsschacht: jetzt fliehen (Gold bleibt liegen)" : "Lüftungsschacht: fliehen", act:() => startCut(escapeCut())} : {label:"Erst Gold aus dem Tresor holen", disabled:true}; }
  return null;
}

let rackT = 0;
function rackIntercom() {
  const now = performance.now(); if (now - rackT < 2500) return; rackT = now; beep(880, .25, 0, .05); beep(660, .35, .3, .05);
  const L = gear.job === 1 ? ["Der Job läuft, Kleine. Feuerleiter in der Gasse, Dach, Lüftungsschacht. Ich bin nicht zu Hause!", "Kreditkontor, Tresor, Gold. Mehr Gerede hilft dir nicht, los jetzt!"] : ["Gute Arbeit gestern, Kleine! Ich such gerade was Neues. Komm später wieder.", "Kein neuer Job im Moment. Bau dir Upgrades ein, ich meld mich."];
  setTimeout(() => say("RACKSON", L[(Math.random()*L.length)|0], 5), 700);
}

/* ======================= Wegweiser-Pfeil (erscheint, wenn es zu lange dauert) ======================= */
const gd = {el:null, t:0, key:"", on:0}, _gv = V3(), _gq = new THREE.Quaternion();
{ const st = document.createElement("style"); st.textContent = `#guide{position:fixed;left:50%;top:14px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:6px 14px 6px 10px;background:rgba(27,30,36,.34);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.12);border-radius:999px;border-bottom:2px solid #4fa9a3;border-radius:12px;color:#f2f6ff;font:600 12px Inter,system-ui,sans-serif;letter-spacing:.06em;opacity:0;pointer-events:none;transition:opacity .5s;z-index:6}
#guide.on{opacity:1}#guide svg{width:34px;height:34px;transition:transform .15s linear}#guide svg path{fill:#4fa9a3;stroke:#f2f6ff;stroke-width:1.5;stroke-linejoin:round}#guide b{color:#4fa9a3;font-weight:700}
body.cine #guide,body.menu #guide{display:none!important}
@media(max-width:700px){#guide{top:74px}}`; document.head.appendChild(st);
  const el = document.createElement("div"); el.id = "guide"; el.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2 L20 20 L12 15.5 L4 20 Z"/></svg><span><b>WEITER</b> · <i id="guideD"></i></span>'; document.body.appendChild(el); gd.el = el; }
function guideTarget() {
  if (xs.on) {
    if (xs.scene === "street" && gear.obs && (gear.obs.st === 1 || gear.obs.st === 2) && gear.job >= 2 && ch2.stage >= 8) return V3(SW/2 - .4, 1, 1.6);
    if (xs.scene === "street") {
      if (ch2.stage === 3) return V3(DOORX, 1, -SD/2);
      if (ch2.stage === 5 || ch2.stage === 6) return V3(GARX, 1, SD/2 - .3);
      if (ch2.stage === 8 && gear.job === 0) { if (!gear.rackMet) return V3(GARX, 1, SD/2 - 1.6); if (gear.rackReady && shopRack) return shopRack.g.position.clone().setY(1); if (!gear.rackReady && pos.z < SD/2 + .3) return V3(GARX, 1, SD/2 + 2.5); return null; }
      if (ch2.stage === 9 && gear.job === 1) return null;
    }
    if (xs.scene === "stairs" && xs.bell && ch2.stage !== 9 && ch2.stage !== 10) return xs.bell;
    if (xs.scene === "roof" && hz.ventP) return V3(hz.ventP.x, 1, hz.ventP.z);
    if (xs.scene === "bank") { if (!gear.hacked) { const T = terms.find(q => q.tmp); return T ? T.g.position.clone().setY(1) : null; } const p = hz.piles.find(q => q.g.visible); if (p) return p.g.position.clone(); return hz.ventP ? V3(hz.ventP.x, 4, hz.ventP.z) : null; }
    return null;
  }
  if (alley.on && !alley.inBar && ch2.stage === 0 && barDoor) { const w = V3(); barDoor.getWorldPosition(w); return w; }
  return null;
}
function guideTick(dt) {
  const el = gd.el; if (!el) return;
  const key = [xs.on ? xs.scene : (alley.on ? "alley" + alley.inBar : "x"), ch2.stage, gear.job, gear.rackMet, gear.rackReady, gear.hacked, hz.lootN, mode === "cut" ? 1 : 0].join();
  if (key !== gd.key) { gd.key = key; gd.t = 0; }
  if (mode !== "surf" || paused || pauseOpen) { gd.t = Math.min(gd.t, 12); el.classList.remove("on"); return; }
  if (Math.hypot(vel.x, vel.z) > .3 || jump.held) gd.t += dt*.35; else gd.t += dt;       // wer nur steht oder zögert, bekommt schneller Hilfe
  let tg = null; try { tg = guideTarget(); } catch (e) {}
  if (!tg || gd.t < 40) { el.classList.remove("on"); return; }
  _gv.copy(tg).sub(camera.position); const dist = Math.hypot(tg.x - pos.x, tg.z - pos.z); if (dist < 2.2) { el.classList.remove("on"); return; }
  _gv.applyQuaternion(_gq.copy(camera.quaternion).invert()); const ang = Math.atan2(_gv.x, -_gv.z) + (_gv.y > 2.5 && Math.abs(_gv.x) + Math.abs(_gv.z) < .5 ? 0 : 0);
  el.querySelector("svg").style.transform = "rotate(" + (ang*57.2958).toFixed(1) + "deg)"; el.querySelector("b").textContent = T("WEITER"); el.querySelector("#guideD").textContent = Math.round(dist) + " m"; el.classList.add("on");
}


/* ---------- Hyperfunk: Auftrags-Feed & Anrufe ---------- */
let comOpen = false, comTab = 0, comCall = null;
const COM = [{k:"R", id:"RCK-0417", n:"Rackson", r:"Auftraggeber · Hyperfunk-Kanal 7", ok:() => ch2.stage >= 5}, {k:"M", id:"MSE-2209", n:"Mase", r:"Mechaniker · Werkstatt", ok:() => ch2.stage >= 7}, {k:"K", id:"KLR-0031", n:"Klirr", r:"Barkeeper · Bar Klirr", ok:() => ch2.stage >= 3}];
const comAvail = () => ch2.stage >= 3;
const comEl = document.createElement("div"); comEl.id = "com";
comEl.innerHTML = '<div class="ivP"><div class="ivH"><b>HYPERFUNK</b><span>KANAL 7 · VERSCHLÜSSELT</span><em class="live">● LIVE</em></div><div class="ivT" id="cmTabs"></div><div class="ivB" id="cmBody"></div><div class="ivF" id="cmF"></div></div>';
document.body.appendChild(comEl); comEl.addEventListener("click", e => { if (e.target === comEl) toggleCom(); });
function comSay(k, text) { const S = SPK[k]; if (!ac) return dryDur(text, S.vi); const v = Object.assign({}, VOICES[S.vi]); v.vol *= opt.voice*.85; try { return speakVowels(T(text), v).dur; } catch (e) { return 2; } }
function comLines(k) {
  const j = gear.job;
  if (k === "R") return j >= 2 ? ["Arach! Der Kreditkontor-Job war erste Sahne. Das Gold gehört dir, kauf dir Upgrades bei Mase.", "Ich halte den Kanal offen. Sobald der nächste Auftrag reinkommt, funk ich dich an."]
    : j === 1 ? ["Rackson hier. Zum Kreditkontor: Feuerleiter in der Gasse, aufs Dach, Lüftungsschacht in die Schalterhalle.", "Such die Tresor-Konsole, hack sie und pack das Gold ins Backpack. Und pass auf die Wachroboter auf."]
    : ["Hier Rackson. Schön, dass du dich meldest, Arach.", "Gerade liegt kein neuer Auftrag auf dem Kanal. Ich funk dich an, sobald was reinkommt."];
  if (k === "M") return j >= 2 ? ["Mase hier. Hmm hmm. Ach, du bist's, Kleine!", "Öffne dein Backpack, dann schalte ich dir die Upgrades per Fernzugriff frei. Und Racksons Pistole? Fast fertig."] : ["Mase hier. Hmm hmm. Ach, du bist's, Kleine!", "Wenn du was an dir verbessern willst, komm vorbei oder öffne dein Backpack. Ich bin in der Werkstatt."];
  return ["Bar Klirr. Na, Kleine? Schön, dass du anrufst.", "Wenn dir einer blöd kommt, sag Bescheid. Die Tür steht dir immer offen. Und der Öl-Vorrat auch."];
}
function comFeed() {
  const f = []; if (gear.obs && gear.obs.st === 3) f.push(["Beschattung Varga abgeschlossen. Vier Fotos, Kunde zufrieden. Anteil überwiesen.", "ERLEDIGT"]);
  if (gear.obs && gear.obs.st >= 1 && gear.obs.st < 3) f.push(["Neuer Auftrag: Beschattung Herr Varga. Vier Fotos über einen Tag – unentdeckt.", "AKTIV"]);
  if (gear.job >= 2) f.push(["Auftrag abgeschlossen: Kreditkontor Brandt & Co. Das Gold gehört dir. Upgrades gibt es bei Mase.", "ERLEDIGT"]);
  if (gear.job >= 1) f.push(["Neuer Auftrag: Kreditkontor Brandt & Co. Einstieg über Feuerleiter, Dach und Lüftungsschacht.", gear.job === 1 ? "AKTIV" : "NEU"]);
  if (gear.rackMet) f.push(["Kanal 7 ist offen. Rackson hält dich auf dem Laufenden.", "LIVE"]); return f;
}
function toggleCom() {
  if (!comOpen && (!comAvail() || mode === "cut" || mode === "menu" || pauseOpen || settingsOpen || invOpen)) return;
  comOpen = !comOpen; setPanel(comEl, comOpen); paused = comOpen; comCall = null;
  if (comOpen) { unlockPtr(); comTab = 0; try { comRender(); } catch (e) { console.error(e); } try { uiSnd(.8, "ok"); } catch (e) {} } else { try { uiSnd(.6, "tab"); } catch (e) {} lock(); }
}
function comKey(code) {
  if (code === "KeyJ" || code === "Escape" || code === "Tab") { toggleCom(); return; } if (code === "KeyI" || code === "Digit3") { goInv(); return; }
  if (code === "ArrowRight" || code === "ArrowLeft" || code === "KeyA" || code === "KeyD") { comTab = 1 - comTab; comRender(); }
  else if (code === "Digit1" || code === "Digit2") { comTab = +code[5] - 1; comRender(); }
}
function comRender() {
  $("cmF").textContent = T("J / Esc: Schließen  ·  ← → oder 1–2: Reiter");
  const tb = $("cmTabs"); tb.innerHTML = ""; ["AUFTRÄGE", "KONTAKTE"].concat(gear.pack ? ["BACKPACK"] : []).forEach((n, i) => { const b = document.createElement("button"); b.className = "ivTab" + (i === comTab ? " on" : ""); b.textContent = (i + 1) + " · " + T(n); b.onclick = () => { if (i === 2) { goInv(); return; } comTab = i; comRender(); }; tb.appendChild(b); });
  const B = $("cmBody"); B.innerHTML = ""; const card = (t, d, u, extra) => { const c = document.createElement("div"); c.className = "card"; c.innerHTML = '<div class="m"><b></b><span></span></div><u></u>'; c.querySelector("b").textContent = T(t); c.querySelector("span").textContent = T(d); c.querySelector("u").textContent = T(u); if (extra) extra(c); B.appendChild(c); return c; };
  if (comTab === 0) {
    const f = comFeed(); if (!f.length) card("Keine Übertragung", "Noch kein Auftrag. Rackson meldet sich, sobald etwas reinkommt.", "WARTE …");
    if (gear.job >= 1) card("Kreditkontor Brandt & Co.", "Tresor in der Schalterhalle leerräumen. Gold gehört dir. Zwei Wachroboter, Kameras im Gebäude.", gear.job === 1 ? "AKTIV" : "ERLEDIGT");
    if (gear.obs && gear.obs.st >= 1) card("Beschattung · Herr Varga", "Fotografiere die Zielperson an vier Momenten eines Tages: Haus verlassen, Übergabe, Telefonat, Heimkehr. Nicht entdecken lassen.", gear.obs.st === 3 ? "ERLEDIGT" : "AKTIV");
    const h = document.createElement("div"); h.style.cssText = "width:100%;color:rgba(255,255,255,.45);font-size:10px;letter-spacing:.24em;margin-top:6px"; h.textContent = T("ÜBERTRAGUNGEN"); B.appendChild(h);
    f.forEach(([t, u]) => card("RACKSON", t, u)); const w = document.createElement("div"); w.className = "live"; w.style.cssText = "width:100%;color:rgba(255,255,255,.4);font-size:11px;letter-spacing:.2em"; w.textContent = T("● Warte auf neue Übertragung …"); B.appendChild(w);
  } else {
    COM.forEach(C => { const ok = C.ok(); card(C.n, C.r, ok ? C.id : "KEIN KONTAKT", c => { const sp = c.querySelector("span"); sp.innerHTML += '<br><span class="cid"></span>'; sp.querySelector(".cid").textContent = "ID " + C.id; c.querySelector("u").style.display = "none"; const b = document.createElement("button"); b.className = "btn"; b.textContent = T("ANRUFEN"); b.disabled = !ok || !!callTok; b.onclick = () => comDial(C.k); c.appendChild(b); }); });
  }
}
let callTok = null;
const callEl = document.createElement("div"); callEl.id = "callHud";
callEl.innerHTML = '<svg class="ci" viewBox="0 0 24 24"><path d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.6 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.6 3.6a1 1 0 01-.25 1z" fill="currentColor"/></svg><div class="ct"><b></b><p></p></div>';
document.body.appendChild(callEl);
{ const st = document.createElement("style"); st.textContent = `#callHud{position:fixed;left:50%;transform:translateX(-50%) translateY(8px);bottom:calc(11vh + 18px);z-index:22;display:flex;gap:14px;align-items:flex-start;width:max-content;max-width:min(760px,90vw);opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;color:#f2f6ff;font-size:calc(clamp(14px,2.1vw,19px)*var(--ss,1));line-height:1.45;text-shadow:0 1px 8px rgba(0,0,0,.7)}
#callHud.on{opacity:1;transform:translateX(-50%)}body:not(.cine) #callHud{bottom:176px}body.touch:not(.cine) #callHud{bottom:196px;max-width:calc(100vw - 32px)}
#callHud .ci{flex:none;width:30px;height:30px;margin-top:2px;padding:7px;box-sizing:border-box;border-radius:50%;background:rgba(27,30,36,.4);border:1px solid rgba(90,169,255,.55);color:#5aa9ff;backdrop-filter:blur(8px)}
#callHud.ring .ci{animation:cmr .7s infinite}@keyframes cmr{0%,100%{transform:rotate(-14deg);box-shadow:0 0 0 0 rgba(90,169,255,.5)}50%{transform:rotate(14deg);box-shadow:0 0 0 8px rgba(90,169,255,0)}}
#callHud .ct{text-align:left}#callHud b{display:block;font-size:.62em;letter-spacing:.3em;color:#5aa9ff;margin-bottom:2px;font-weight:600}#callHud p{margin:0}`; document.head.appendChild(st); }
function callHide() { callEl.classList.remove("on", "ring"); }
function comCallRun(k, lines, incoming) {
  const C = COM.find(x => x.k === k), me = callTok = {}; callEl.querySelector("b").textContent = C.n.toUpperCase(); callEl.querySelector("p").textContent = T(incoming ? "Eingehender Anruf …" : "Verbinde …"); callEl.classList.add("on", "ring");
  beep(900, .15, 0, .05); beep(1250, .15, .25, .05); beep(900, .15, .7, .05); beep(1250, .15, .95, .05); if (incoming) toast("Hyperfunk: " + C.n + " ruft an");
  const next = i => { if (callTok !== me) return; callEl.classList.remove("ring"); if (i >= lines.length) { setTimeout(() => { if (callTok === me) { callHide(); callTok = null; } }, 1200); return; } callEl.querySelector("p").textContent = T(lines[i]); const d = comSay(k, lines[i]); setTimeout(() => next(i + 1), (d + .9)*1000); };
  setTimeout(() => next(0), 1700);
}
function comDial(k) { if (callTok) return; if (mode === "cut") return; toggleCom(); comCallRun(k, comLines(k), false); }
function comIncoming(k, lines) { if (callTok) return; if (mode === "cut" || subBusy()) { comPend = {k, lines}; return; } comCallRun(k, lines, true); }
let comPend = null; const subBusy = () => subTimer > 0 || $("sub").classList.contains("on");
function comTick(dt) {
  const bt = $("btnInv"); if (bt) bt.style.display = (gear.pack || comAvail()) ? "" : "none";
  if (comPend && mode === "surf" && !callTok && !paused && !subBusy()) { const q = comPend; comPend = null; comCallRun(q.k, q.lines, true); }
  if (mode !== "surf" || comOpen || invOpen || paused || !(xs.scene === "street" || alley.on)) { return; }
  gear.called = gear.called || {}; ch2.cT = (ch2.cT || 0) + dt;
  if (gear.job === 1 && !gear.called.j1 && ch2.cT > 40) { gear.called.j1 = 1; ch2.cT = 0; comIncoming("R", ["Arach, hier Rackson. Falls du's vergessen hast: Feuerleiter in der Gasse, dann aufs Dach.", "Der Lüftungsschacht führt direkt in die Schalterhalle. Ruf mich an, wenn du was brauchst."]); }
  else if (gear.job >= 2 && gear.called.j2 && !gear.called.j3 && gear.gold <= 0 && gear.obs && !gear.obs.st && ch2.cT > 30) { gear.called.j3 = 1; ch2.cT = 0; gear.obs.st = 1; writeSave(); setObj(jobObj()); comIncoming("R", ["Arach, Rackson. Ein Kunde zahlt gut für ein paar Bilder: Herr Varga, wohnt in Nr. 14, direkt hier an der Straße.", "Ich will ihn über einen ganzen Tag auf Fotos: wenn er morgens das Haus verlässt, bei einer Übergabe, beim Telefonieren und abends.", "Geh in die Ich-Perspektive, drück ab, wenn er's tut. Und lass dich nicht sehen – bleib an den Wänden."]); toast("Neuer Auftrag: Beschattung"); }
  else if (gear.job >= 2 && !gear.called.j2 && ch2.cT > 8) { gear.called.j2 = 1; ch2.cT = 0; comIncoming("R", ["Arach! Rackson. Das Kreditkontor war ein Traum, die Szene redet schon über dich.", "Bau dir Upgrades ein. Ich funk dich an, sobald der nächste Auftrag reinkommt."]); }
}


/* ---------- SuperEuro (SE) ---------- */
const fmtSE = n => Math.round(n).toLocaleString("de-DE") + " SE";
let payRack = null, seShown = 0, seTgt = 0, seBusy = false;
const seEl = document.createElement("div"); seEl.id = "seBox"; seEl.innerHTML = '<div class="sd"></div><div class="sr"><i>SE</i><b></b></div>'; document.body.appendChild(seEl);
{ const st = document.createElement("style"); st.textContent = `#seBox{position:fixed;right:12px;top:128px;z-index:20;display:none;flex-direction:column;align-items:flex-end;gap:4px;pointer-events:none;font-variant-numeric:tabular-nums}
#seBox .sr{display:flex;align-items:center;gap:8px;padding:5px 12px 5px 6px;border-radius:999px;background:rgba(27,30,36,.34);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(10px);color:#fff;font-size:13px;letter-spacing:.06em}
#seBox i{font-style:normal;font-size:9px;font-weight:700;letter-spacing:.06em;width:22px;height:22px;border-radius:50%;background:#4fa9a3;color:#1d2026;display:flex;align-items:center;justify-content:center}
#seBox .sd{font-size:15px;font-weight:600;color:#9bd6d0;opacity:0;transform:translateY(10px);text-shadow:0 2px 10px rgba(0,0,0,.6)}
#seBox.pay .sd{animation:sed 3.4s ease-out forwards}#seBox.pay .sr{animation:sep 3.4s ease-out}
@keyframes sed{0%{opacity:0;transform:translateY(14px) scale(.9)}12%{opacity:1;transform:translateY(0) scale(1.08)}30%{transform:scale(1)}80%{opacity:1}100%{opacity:0;transform:translateY(-8px)}}
@keyframes sep{0%,5%{box-shadow:0 0 0 0 rgba(79,169,163,.7);border-color:rgba(79,169,163,.9)}60%{box-shadow:0 0 0 14px rgba(79,169,163,0)}100%{border-color:rgba(255,255,255,.12)}}`; document.head.appendChild(st); }
function seTick(dt) {
  gear.se = gear.se || 0; seTgt = gear.se; const show = gear.se > 0 || seBusy; seEl.style.display = show && mode !== "menu" && mode !== "cut" ? "flex" : "none";
  if (seShown !== seTgt) { const d = seTgt - seShown; seShown += Math.sign(d)*Math.max(1, Math.abs(d)*Math.min(1, dt*1.6)); if (Math.abs(seTgt - seShown) < 1) seShown = seTgt; }
  seEl.querySelector("b").textContent = Math.round(seShown).toLocaleString("de-DE");
}
function sePay(n, why) {
  gear.se = (gear.se || 0) + n; seBusy = true; seEl.querySelector(".sd").textContent = "+ " + fmtSE(n) + (why ? "  ·  " + T(why) : ""); seEl.classList.remove("pay"); void seEl.offsetWidth; seEl.classList.add("pay"); setTimeout(() => { seBusy = false; seEl.classList.remove("pay"); }, 3600);
  try { sndOnce("sms", .9); } catch (e) {} for (let i = 0; i < 4; i++) beep(1320 + i*220, .09, .35 + i*.09, .05); beep(2640, .35, .75, .04); writeSave();
}
function sellGold() {
  const n = gear.gold, pay = n*2250; if (n <= 0 || payRack == null) return;
  say("RACKSON", n >= 20 ? "Zwanzig Barren, sauber gezählt. Fünfundvierzigtausend SuperEuro, Arach – kommt sofort auf dein Konto." : "Hab nachgezählt. Fair bezahlt, Arach – kommt gleich auf dein Konto.", 5); SPK.R.R = payRack; try { speakCut("R", n >= 20 ? "Zwanzig Barren, sauber gezählt. Fünfundvierzigtausend SuperEuro, Arach – kommt sofort auf dein Konto." : "Hab nachgezählt. Fair bezahlt, Arach – kommt gleich auf dein Konto.", "j"); } catch (e) {}
  gear.gold = 0; setObj(jobObj()); setTimeout(() => { sePay(pay, "Rackson · Goldverkauf"); toast("Überweisung: " + fmtSE(pay)); }, 3600);
}
function payRackTick() {
  if (xs.scene !== "street" || gear.job < 2 || gear.gold <= 0 || mode === "cut") return;
  if (!payRack || payRack.g.parent !== exG) { const R = makeRobot({body:0x3a4a5a, acc:0x3c8680, glow:0x8ad0a0, tape:true, apron:0x2a2c30, cool:true}); R.glass.visible = false; exG.add(R.g); exAct.push(R); R.g.position.set(-.8, 0, -.9); payRack = R; }
  payRack.g.rotation.y = Math.atan2(pos.x - payRack.g.position.x, pos.z - payRack.g.position.z);
}


/* ---------- Mission-Übergänge: Klettern, Dachluke, Gitter aufschneiden, Flucht ---------- */
function miniCut(dur, keys, shots, ev, onEnd, init, spExtra, noOut) {
  const c = {ev:ev.slice(), subs:[]}; c.ev.push([.05, () => $("fade").classList.remove("on")]); if (!noOut) c.ev.push([dur - .8, () => $("fade").classList.add("on")]);
  return finishCut({dur, bin:.3, bout:.4, ev:c.ev, subs:c.subs, shots, init, spider(tt, dt) { pathPose(keys, tt, dt); if (spExtra) spExtra(tt, dt); }, final() {}, onEnd});
}
function climbCut() {
  const hw = hwS(), wz = -SD/2 + hw, x0 = 1.1, k = [[0, pos.x, hw, pos.z, 0, 0, -1, 0, 1, 0], [1.3, x0, hw, -1.9, 0, 0, -1, 0, 1, 0], [2.3, x0, .8, wz, 0, 1, 0, 0, 0, 1], [6.2, x0, 9.6, wz, 0, 1, 0, 0, 0, 1]];
  for (let i = 1; i < 4; i++) { const t0 = 2.3 + i*1.0; k.splice(3, 0, [t0, x0 + Math.sin(i)*.12, .8 + (9.6 - .8)*(t0 - 2.3)/3.9, wz, 0, 1, 0, 0, 0, 1]); } k.sort((a, b) => a[0] - b[0]);
  return miniCut(7.0, k, [{t0:0, t1:2.4, a:[3.6, 1.6, -.2, 1.1, .6, -2.4, 56], b:[3.4, 1.9, -.4, 1.1, 1.0, -3.0, 52]}, {t0:2.4, t1:7, a:[4.4, 2.5, .4, 1.1, 2.0, -3.1, 60], b:[4.2, 9.6, .3, 1.1, 9.0, -3.1, 52]}],
    [[2.5, () => { clang(.3); }], [3.4, () => clang(.25)], [4.4, () => clang(.25)], [5.4, () => clang(.25)]], () => { enterHeist("roof"); toast("Dach · Kreditkontor Brandt & Co."); setTimeout(() => startCut(roofArriveCut()), 80); }, () => {});
}
function roofArriveCut() {
  const hw = hwS(), k = [[0, -7.8, hw, 5.2, 0, 0, -1, 0, 1, 0], [1.4, -7.8, hw, 5.2, 0, 0, -1, 0, 1, 0], [3.4, -7.4, hw, 3.5, 1, 0, 0, 0, 1, 0], [4.4, -6.2, hw, 3.5, 1, 0, 0, 0, 1, 0]];
  return miniCut(4.8, k, [{t0:0, t1:4.8, a:[-3.6, 1.7, 1.2, -7.6, .8, 5.0, 56], b:[-4.4, 1.5, 1.8, -7.2, .6, 4.0, 50]}], [[.8, () => { clang(.3); beep(180, .3, 0, .05); }]], () => { setObj("Schneide das Lüftungsgitter am Dachaufbau auf und dring ins Kreditkontor ein."); },
    () => { cutPlace(-7.8, hw, 5.2, 0, 0, -1, 0, 1, 0); if (hz.hut) hz.hut.rotation.y = 0; }, (tt) => { if (hz.hut) hz.hut.rotation.y = -Math.min(1, Math.max(0, (tt - .6)/1.0))*1.9; }, true);
}
function ventCut() {
  const hw = hwS(), vx = hz.ventP.x, vz = hz.ventP.z, top = .95 + hw, g0 = hz.grate; const gp = g0 ? g0.position.clone() : null;
  const k = [[0, pos.x, hw, pos.z, vx - pos.x, 0, vz - pos.z, 0, 1, 0], [1.4, vx - 1.2, hw, vz + .9, 1, 0, -.6, 0, 1, 0], [2.2, vx - .8, top - .1, vz, 1, 0, 0, 0, 1, 0], [2.6, vx - .45, top, vz, 1, 0, 0, 0, 1, 0], [5.6, vx - .45, top, vz, 1, 0, 0, 0, 1, 0], [6.4, vx, top - .2, vz, 1, 0, 0, 0, 1, 0], [7.2, vx + .1, .5, vz, 0, -1, 0, -1, 0, 0]];
  const sp = (tt) => { if (!g0 || !gp) return; if (tt < 3.6) { g0.position.copy(gp); g0.rotation.set(0, 0, 0); return; } const u = Math.min(1, (tt - 3.6)/1.0), ax = gp.x + 1.6*u, ay = gp.y + 2.0*u - 3.2*u*u + (u >= 1 ? 0 : 0); g0.position.set(ax, Math.max(.05, ay), gp.z + .8*u); g0.rotation.set(u*2.8, u*1.5, u*3.4); if (u >= 1 && !g0.userData.l) { g0.userData.l = 1; clang(.5); } };
  const ev = [[3.0, () => { beep(340, 1.0, 0, .06); beep(520, .8, .2, .04); }]]; for (let i = 0; i < 7; i++) ev.push([2.7 + i*.15, () => { _t3.set(vx - .1 + Math.random()*.4 - .2, .98, vz + Math.random()*1.0 - .5); emitSparks(_t3, V3(0, 1, 0)); }]);
  return miniCut(7.6, k, [{t0:0, t1:2.4, a:[vx - 4.2, 1.6, vz + 2.8, vx - .6, .6, vz, 55], b:[vx - 3.0, 1.3, vz + 2.2, vx - .6, .8, vz, 50]}, {t0:2.4, t1:5.4, a:[vx - 1.6, 1.3, vz + 1.6, vx, 1.0, vz, 48], b:[vx - 1.3, 1.2, vz + 1.4, vx, 1.0, vz, 44]}, {t0:5.4, t1:7.6, a:[vx + 1.8, 2.0, vz + 2.4, vx, .8, vz, 54], b:[vx + 1.0, 2.2, vz + 1.6, vx, .6, vz, 50]}],
    ev, () => { toBank(); }, null, sp);
}
function bankArriveCut() {
  const hw = hwS(), top = 6 - hw, k = [[0, -6.8, 6.4, 4.8, 1, 0, 0, 0, -1, 0], [1.6, -6.8, 6.4, 4.8, 1, 0, 0, 0, -1, 0], [2.6, -6.8, top, 4.8, 1, 0, 0, 0, -1, 0], [4.2, -5.8, top, 4.8, 1, 0, 0, 0, -1, 0]]; let gr = null;
  return miniCut(4.6, k, [{t0:0, t1:4.6, a:[-3.8, 2.4, 2.8, -6.6, 5.8, 4.8, 62], b:[-4.4, 2.0, 3.2, -6.4, 5.4, 4.8, 58]}], [[.4, () => { if (gr) { gr.userData.fall = 1; } }]], () => { setObj("Hack die Tresor-Konsole an der Ostwand. Weiche den Wachrobotern aus – oder grill sie mit dem Laser."); },
    () => { cutPlace(-6.8, 6.4, 4.8, 1, 0, 0, 0, -1, 0); gr = new THREE.Mesh(new THREE.BoxGeometry(1.1, .05, 1.1), mStd(0x6a7488, .6, .5)); gr.position.set(-6.8, 5.97, 4.8); exG.add(gr); gr.userData.t = 0; }, (tt) => { if (!gr) return; const u = Math.max(0, tt - .5); if (u > 0) { const y = Math.max(.05, 5.97 - 4.9*u*u); gr.position.y = y; gr.position.x = -6.8 + .5*u; gr.rotation.set(u*2.2, 0, u*1.3); if (y <= .05 && !gr.userData.l) { gr.userData.l = 1; clang(.5); } } }, true);
}
function escapeCut() {
  const hw = hwS(), top = 6 - hw, k = [[0, pos.x, pos.y, pos.z, 1, 0, 0, 0, -1, 0], [1.2, -6.8, top, 4.8, 1, 0, 0, 0, -1, 0], [2.6, -6.8, 6.5, 4.8, 1, 0, 0, 0, -1, 0]];
  return miniCut(3.2, k, [{t0:0, t1:3.2, a:[-4.2, 2.6, 2.6, -6.8, 5.6, 4.8, 60], b:[-5.0, 2.4, 3.2, -6.8, 5.8, 4.8, 56]}], [[1.0, () => clang(.3)]], () => { heistExit(); });
}

/* ---------- Auftrag 3: Beschattung – Herr Varga, ein Tag in vier Fotos ---------- */
const OBS_S = [
  {clk:"07:40", nm:"MORGEN", hd:"Verlässt das Haus", sky:[[0, "#ffd7a8"], [.45, "#78c4bd"], [1, "#878c93"]], fog:0xc8a690, hI:1.1, hC:0xffe2c4, hG:0x3a3030},
  {clk:"12:30", nm:"MITTAG", hd:"Heimliche Übergabe", sky:[[0, "#d6e8ff"], [.5, "#c4cad2"], [1, "#9da2a9"]], fog:0xaebed4, hI:1.7, hC:0xdfeaff, hG:0x4a4a54},
  {clk:"16:10", nm:"NACHMITTAG", hd:"Verdächtiges Telefonat", sky:[[0, "#78c4bd"], [.45, "#d99a78"], [1, "#6d7178"]], fog:0xb89886, hI:1.35, hC:0xffd8b0, hG:0x2e2a30},
  {clk:"20:45", nm:"ABEND", hd:"Kommt nicht allein heim", sky:[[0, "#25292f"], [.5, "#32363c"], [1, "#181b22"]], fog:0x161a34, hI:.6, hC:0x8a9ad8, hG:0x16161e}
];
const obs = {run:null, busy:false}, _obq1 = V3(), _obq2 = V3(), _obq3 = V3();
const obsHud = document.createElement("div"); obsHud.id = "obsHud"; obsHud.innerHTML = '<div class="oh"><b></b><span></span></div><div class="ob"><i></i></div>'; document.body.appendChild(obsHud);
const obsClk = document.createElement("div"); obsClk.id = "obsClk"; obsClk.innerHTML = '<b></b><i></i><span></span>'; document.body.appendChild(obsClk);
{ const st = document.createElement("style"); st.textContent = `#obsHud{position:fixed;left:50%;top:14px;transform:translateX(-50%) translateY(-8px);z-index:19;opacity:0;pointer-events:none;transition:opacity .3s,transform .3s;min-width:260px;padding:8px 16px 10px;border-radius:14px;background:rgba(27,30,36,.34);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(10px);color:#fff;font-size:11px;letter-spacing:.2em}
#obsHud.mom{border-color:#4fa9a3;box-shadow:0 0 0 1px rgba(79,169,163,.6)}#obsHud.on{opacity:1;transform:translateX(-50%)}#obsHud .oh{display:flex;justify-content:space-between;gap:18px}#obsHud b{font-weight:600;color:#9bd6d0}#obsHud .ob{margin-top:7px;height:3px;border-radius:2px;background:rgba(255,255,255,.14);overflow:hidden}#obsHud .ob i{display:block;height:100%;width:0;background:#4fa9a3;transition:width .15s}
#obsClk{position:fixed;inset:0;z-index:23;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#fff;opacity:0;pointer-events:none;transition:opacity .6s;text-align:center}#obsClk.on{opacity:1}
#obsClk b{font-size:clamp(40px,9vw,92px);font-weight:300;letter-spacing:.12em}#obsClk i{width:46px;height:2px;background:#4fa9a3}#obsClk span{font-size:clamp(11px,1.8vw,15px);letter-spacing:.38em;color:rgba(255,255,255,.75)}`; document.head.appendChild(st); }
function obsFig(o) {
  const g = scientist(0, 0, 0, o); const i = sci.indexOf(g); if (i >= 0) sci.splice(i, 1); exG.add(g); g.position.y = 0; g.visible = false;
  const P = g.userData.p, env = new THREE.Mesh(new THREE.BoxGeometry(.12, .02, .17), mStd(0xf2f2ee, .1, .7)); env.position.set(0, -.3, .05); env.visible = false; P.foreR.add(env);
  const ph = new THREE.Mesh(new THREE.BoxGeometry(.04, .11, .015), mStd(0x101216, .5, .4)); ph.position.set(0, -.3, .03); ph.visible = false; P.foreR.add(ph); g.userData.env = env; g.userData.ph = ph; return g;
}
const OBS_ST = [
  () => ({a:[{g:obsFig({skin:0xd0a88c, hair:0x2a2018, coat:0x3a3c48, pants:0x1c1e26, longCoat:1}), x:DOORX, z:-SD/2 + .25, yaw:0, steps:[["go", 6.4, -1.0], ["wait", 9, "watch", -Math.PI/2, 1], ["go", -2, .2], ["go", -10.9, .2]]}], need:[0]}),
  () => { const R = makeRobot({body:0x3a4a5a, acc:0x3c8680, glow:0x8ad0a0, cool:true}); R.glass.visible = false; exG.add(R.g); exAct.push(R); R.g.position.set(-3.6, 0, .9); R.g.rotation.y = Math.PI/2; R.look = V3(-1.9, 1.4, .9);
    return {robot:R, a:[{g:obsFig({skin:0xd0a88c, hair:0x2a2018, coat:0x3a3c48, pants:0x1c1e26, longCoat:1}), x:10.9, z:.5, yaw:0, steps:[["go", -2.0, .9], ["wait", 9, "hand", -Math.PI/2, 1], ["go", -10.9, .5]]}], need:[0], robotNeed:1}; },
  () => ({a:[{g:obsFig({skin:0xd0a88c, hair:0x2a2018, coat:0x3a3c48, pants:0x1c1e26, longCoat:1}), x:-10.9, z:.4, yaw:0, steps:[["go", -4.7, -2.0], ["wait", 9, "phone", Math.PI, 1], ["go", 10.9, -.2]]}], need:[0]}),
  () => ({a:[{g:obsFig({skin:0xd0a88c, hair:0x2a2018, coat:0x3a3c48, pants:0x1c1e26, longCoat:1}), x:-10.9, z:.5, yaw:0, steps:[["go", DOORX - 1.1, -1.5], ["wait", 9, "look", Math.PI, 1], ["go", DOORX, -SD/2 + .3]]},
    {g:obsFig({skin:0xb88a70, hair:0x5a2a20, coat:0x7a4a32, pants:0x241c1c, longCoat:1, bun:1}), x:-11.7, z:.9, yaw:0, steps:[["go", DOORX - 1.9, -1.0], ["wait", 9, "idle", Math.PI*.8, 0], ["go", DOORX - .5, -SD/2 + .3]]}], need:[0, 1]})
];
function obsTod(i) { const S = OBS_S[i]; try { roomMeshes[1].material.map = gradTex(S.sky); roomMeshes[1].material.needsUpdate = true; } catch (e) {} xs.hI = S.hI; xs.hC = S.hC; xs.hG = S.hG; try { scene.fog.color.setHex(S.fog); scene.background.setHex(S.fog); } catch (e) {} if (xs.sideL) for (const l of xs.sideL) l.intensity = l.userData.b*(i === 3 ? 1.3 : .12); }
function obsClear() { const r = obs.run; if (r) { for (const A of r.a) { exG.remove(A.g); } if (r.robot) { exG.remove(r.robot.g); const k = exAct.indexOf(r.robot); if (k >= 0) exAct.splice(k, 1); } } obs.run = null; obsHud.classList.remove("on"); }
function obsBegin(i) {
  const O = gear.obs, S = OBS_S[i]; obs.busy = true; O.st = 2; O.slot = i; obsClear(); $("fade").classList.add("on"); mode === "surf" && (obs.fadeT = 1);
  obsClk.querySelector("b").textContent = S.clk; obsClk.querySelector("span").textContent = T(S.nm) + "  ·  " + T(S.hd).toUpperCase(); setTimeout(() => obsClk.classList.add("on"), 500);
  setTimeout(() => { if (xs.scene !== "side") { obs.busy = false; obsClk.classList.remove("on"); return; } obsTod(i); const r = OBS_ST[i](); r.slot = i; r.susp = 0; r.done = false; r.t = 0;
    for (const A of r.a) { A.i = 0; A.t = 0; A.win = false; A.pose = "walk"; A.g.position.set(A.x, 0, A.z); A.g.rotation.y = A.yaw; A.g.visible = true; A.sw = 0; }
    obs.run = r; $("fade").classList.remove("on"); obsClk.classList.remove("on"); obs.busy = false; setObj(jobObj()); if (!O.tip) { O.tip = 1; setTimeout(() => toast("Ich-Perspektive (V), dann Foto: Enter bzw. RT"), 2500); } writeSave(); }, 2800);
}
function obsStep(A, dt) {
  const g = A.g, P = g.userData.p, s = A.steps[A.i]; if (!s) { A.over = true; g.visible = false; return; }
  let mv = 0; A.wg = Math.max(0, (A.wg || 0) - dt);
  if (s[0] === "go") { const dx = s[1] - g.position.x, dz = s[2] - g.position.z, d = Math.hypot(dx, dz), nx = A.steps[A.i + 1]; if (nx && nx[0] === "wait" && nx[4] && d < 1.6) A.wg = Math.max(A.wg, .5); if (d < .08) { A.i++; A.t = 0; return; } const sp = 1.05*dt; g.position.x += dx/d*Math.min(sp, d); g.position.z += dz/d*Math.min(sp, d); mv = 1; A.pose = "walk";
    let ya = Math.atan2(dx, dz) - g.rotation.y; ya = Math.atan2(Math.sin(ya), Math.cos(ya)); g.rotation.y += ya*Math.min(1, dt*7); }
  else { A.t += dt; A.pose = s[2]; A.win = !!s[4] && A.t > .3; if (A.win) A.wg = 1.2; let ya = s[3] - g.rotation.y; ya = Math.atan2(Math.sin(ya), Math.cos(ya)); g.rotation.y += ya*Math.min(1, dt*4); if (A.t > s[1]) { A.i++; A.t = 0; A.win = false; } }
  A.ok = A.win || A.wg > 0;
  A.sw += dt*7.5*mv; const w = Math.sin(A.sw), k = mv, t = clockT; A.mv = mv;
  P.legL.rotation.x = w*.7*k; P.legR.rotation.x = -w*.7*k; P.shinL.rotation.x = Math.max(0, -w)*.9*k; P.shinR.rotation.x = Math.max(0, w)*.9*k; g.position.y = Math.abs(Math.sin(A.sw))*.015*k;
  const po = A.pose; let aL = -w*.55*k, fL = -.25, aR = w*.55*k, fR = -.25, hx = .04, hy = 0;
  if (po === "watch") { aL = -.9; fL = -1.75; hx = .28; hy = Math.sin(t*.7)*.1; }
  else if (po === "hand") { aR = -1.25; fR = -.12; hy = .15; }
  else if (po === "phone") { aR = -.55; fR = -2.25; hy = Math.sin(t*.9)*.7; hx = .05; }
  else if (po === "look") { aL = -.15; aR = .15; hy = Math.sin(t*1.5)*.9; }
  else if (po === "idle") { aL = -.15; aR = .15; hy = Math.sin(t*.6)*.5; }
  const e = Math.min(1, dt*8); P.armL.rotation.x += (aL - P.armL.rotation.x)*e; P.foreL.rotation.x += (fL - P.foreL.rotation.x)*e; P.armR.rotation.x += (aR - P.armR.rotation.x)*e; P.foreR.rotation.x += (fR - P.foreR.rotation.x)*e;
  P.head.rotation.x += (hx - P.head.rotation.x)*e; P.head.rotation.y += (hy - P.head.rotation.y)*Math.min(1, dt*5); g.userData.env.visible = po === "hand"; g.userData.ph.visible = po === "phone";
}
function obsSusp(r, dt) {
  let rate = 0; if (r.t > 4) for (const A of r.a) { if (A.over) continue; const g = A.g, dx = pos.x - g.position.x, dz = pos.z - g.position.z, d = Math.hypot(dx, dz) + 1e-4, fx = Math.sin(g.rotation.y), fz = Math.cos(g.rotation.y), cone = (dx*fx + dz*fz)/d > .35, floor = pos.y < 1.4;
    let q = 0; if (d < 1.6) q = .35; if (cone && floor) q = Math.max(q, d < 2.4 ? .6 : d < 5 ? .2*(1 - (d - 2.4)/2.6) + .03 : 0); else if (cone && d < 3.0) q = Math.max(q, .08); rate = Math.max(rate, q); }
  r.susp = clamp(r.susp + (rate > 0 ? rate*dt : -.3*dt), 0, 1);
}
function obsTick(dt) {
  obsGuide(dt);
  const O = gear.obs; if (!O || !O.st) { obsHud.classList.remove("on"); return; }
  obsGateMain(); if (xs.scene !== "side") { if (obs.run) obsClear(); obsHud.classList.remove("on"); return; }
  if (mode === "cut" || mode === "menu") return;
  if (!obs.run && !obs.busy && mode === "surf" && ch2.stage >= 8 && (O.st === 1 || O.st === 2) && !paused) { obs.busy = true; setTimeout(() => { if (xs.scene === "side" && mode === "surf") obsBegin(O.st === 1 ? 0 : O.slot); else obs.busy = false; }, O.st === 1 ? 3500 : 1500); if (O.st === 1) toast("Beschattung beginnt …"); }
  const r = obs.run; if (!r) return; if (paused) return;
  r.t += dt; let over = true; for (const A of r.a) { obsStep(A, dt); if (!A.over) over = false; }
  if (r.robot) { r.robot.look.set(r.a[0].g.position.x, 1.4, r.a[0].g.position.z); }
  obsSusp(r, dt); const H = obsHud; H.classList.toggle("on", mode === "surf"); const mom = r.a.some(a => a.ok) && !O.shots[r.slot]; H.classList.toggle("mom", mom); H.querySelector("b").textContent = T("BESCHATTUNG") + " · " + OBS_S[r.slot].clk + (mom ? " · " + T("JETZT FOTOGRAFIEREN") : ""); H.querySelector("span").textContent = T("FOTOS") + " " + O.shots.reduce((a, b) => a + b, 0) + "/4"; H.querySelector("i").style.width = (r.susp*100) + "%";
  for (const A of r.a) if (r.susp > .35) { const P = A.g.userData.p, g = A.g, dx = pos.x - g.position.x, dz = pos.z - g.position.z; let ya = Math.atan2(dx, dz) - g.rotation.y; ya = Math.atan2(Math.sin(ya), Math.cos(ya)); P.head.rotation.y += (clamp(ya, -1, 1) - P.head.rotation.y)*Math.min(1, dt*6); }
  if (r.susp >= 1 && !r.done) { r.done = true; toast("Varga hat dich bemerkt – der Tag beginnt von vorn"); try { beep(220, .25, 0, .08); } catch (e) {} setTimeout(() => obsBegin(r.slot), 900); return; }
  if (over && !r.done) { r.done = true; if (O.shots[r.slot]) { if (r.slot >= 3) setTimeout(obsFinish, 600); else setTimeout(() => obsBegin(r.slot + 1), 900); } else { toast("Kein brauchbares Foto – der Moment wird wiederholt"); setTimeout(() => obsBegin(r.slot), 1200); } }
}
function obsFinish() {
  const O = gear.obs; O.st = 3; obsClear(); $("fade").classList.add("on"); obsClk.querySelector("b").textContent = "21:30"; obsClk.querySelector("span").textContent = T("DER TAG IST VORBEI"); obsClk.classList.add("on");
  setTimeout(() => { obsTod(0); xs.hI = 1.3; xs.hC = 0x9aa4c8; xs.hG = 0x2a2a34; try { scene.fog.color.setHex(0xb89886); scene.background.setHex(0xb89886); } catch (e) {} try { roomMeshes[1].material.map = gradTex([[0, "#78c4bd"], [.45, "#c98a86"], [1, "#5f636a"]]); } catch (e) {} $("fade").classList.remove("on"); obsClk.classList.remove("on"); sePay(6500, "Beschattung abgeschlossen"); setObj(jobObj()); writeSave();
    setTimeout(() => comIncoming("R", ["Die Bilder sind angekommen, Arach. Der Kunde ist begeistert, dein Anteil liegt auf dem Konto.", "Eins noch: Wer war die Frau an Vargas Seite? Das lass ich mal nachprüfen …"]), 4000); }, 2600);
}
function obsInFrame(g, dy) {
  camera.updateMatrixWorld(true); _obq1.set(g.position.x, g.position.y + dy, g.position.z); const v = _obq2.copy(_obq1).sub(camera.position), d = v.length(); if (d > 24) return false;
  _obq1.project(camera); if (_obq1.z > 1 || Math.abs(_obq1.x) > .95 || Math.abs(_obq1.y) > .95) return false;
  v.divideScalar(d); const hit = rayBox(camera.position, v).t; return hit > d - 1.1;
}
function obsShot() {
  const r = obs.run, O = gear.obs; if (!r || mode !== "surf") return; const A0 = r.a.find(a => a.ok);
  if (!A0) { toast("Noch nichts Verdächtiges – warte auf „JETZT FOTOGRAFIEREN“ oben."); return; }
  if (O.shots[r.slot]) { toast("Dieses Foto ist schon im Kasten."); return; }
  for (let i = 0; i < r.a.length; i++) if (r.need.includes(i) && !obsInFrame(r.a[i].g, 1.4)) { toast(i === 0 ? "Varga ist nicht richtig im Bild." : "Die Begleitung fehlt im Bild."); return; }
  if (r.robotNeed && !obsInFrame(r.robot.g, 1.0)) { toast("Der Kontakt muss mit ins Bild."); return; }
  O.shots[r.slot] = 1; toast("Foto " + O.shots.reduce((a, b) => a + b, 0) + "/4 · " + T(OBS_S[r.slot].hd)); try { beep(1320, .12, 0, .05); beep(1760, .18, .1, .05); } catch (e) {} writeSave();
}

/* ---------- Parallelstraße: Schauplatz der Beschattung ---------- */
// Durchgang in der bekannten Straße (Ostwand) und Rückweg in der Parallelstraße (Nordwand)
function sideGate(x, z, ry, txt, fx, fz) {
  const dk = mStd(0x24242a, .5, .5), cx = x - Math.sin(ry)*.15, cz = z + Math.cos(ry)*.15, wx = Math.abs(Math.cos(ry)) > .5 ? 1 : 0, wz = 1 - wx;   // Breitenrichtung des Rahmens
  exBox(.3 + wx*1.2, 2.4 + 0, .3 + wz*1.2, new THREE.MeshBasicMaterial({color:0x0e1014}), cx, 1.2, cz);
  exBox(.34 + wx*1.6, .16, .34 + wz*1.6, dk, cx, 2.48, cz);
  for (const s of [-1, 1]) exBox(.34 + wx*.14, 2.4, .34 + wz*.14, dk, cx + s*wx*.68, 1.2, cz + s*wz*.68);
  exPl(1.5, .3, sign(txt, "#78c4bd", 1.5, .3, "#14161a"), x - Math.sin(ry)*.34, 2.85, z + Math.cos(ry)*.34, ry);
  const b = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({color:0xffe0b0})); b.position.set(x - Math.sin(ry)*.5, 2.6, z + Math.cos(ry)*.5); exG.add(b);
  const l = exPt(0xffc890, .9, 5, x - Math.sin(ry)*.8, 2.3, z + Math.cos(ry)*.8); l.userData.aim = [-Math.sin(ry)*.5, -1, Math.cos(ry)*.5];
}
function obsGateMain() { if (xs.og || xs.scene !== "street" || !gear.obs || !gear.obs.st) return; xs.og = 1; sideGate(SW/2 - .02, 1.6, -Math.PI/2, "DURCHGANG · PARALLELSTRASSE"); }
function obsGateInt() {
  if (!gear.obs || !gear.obs.st || mode !== "surf") return null;
  if (xs.scene === "street" && pos.x > SW/2 - 2.0 && Math.abs(pos.z - 1.6) < 1.3 && pos.y < 3) return {label:"Durchgang zur Parallelstraße", act:() => { $("fade").classList.add("on"); setTimeout(enterSide, 650); }};
  if (xs.scene === "side" && pos.z < -SD/2 + 2.0 && Math.abs(pos.x + 8.4) < 1.3 && pos.y < 3) return {label:"Zurück zur Hauptstraße", act:() => { obsClear(); $("fade").classList.add("on"); setTimeout(() => enterStreet("side"), 650); }};
  return null;
}
function enterSide() { window.loadShow && (loadShow(), loadHideSoon(2200));
  cpSet("side"); exLeaveOld(); buildSide(); ch2.dark = false; ch2.stage = 8 + Math.min(gear.job, 2); const hw = hwS(), hd = SD/2;
  placeAt(-8.4, hw, -hd + 1.0, 0, 1, 0, 0, 0, 1); const O = gear.obs; obsTod(O && O.st === 2 ? O.slot : 0); setObj(jobObj());
  toast(T("Parallelstraße")); setTimeout(() => { $("fade").classList.remove("on"); }, 350);
}
function buildSide() {
  xs.cast = true; const T = alleyTexts(), roadT = T.road.clone(); roadT.needsUpdate = true; xs.og = 0;
  exRoom(SW, SH, SD, {floor:roadT, ceil:gradTex(OBS_S[0].sky), ceilBasic:true, wW:brickT(T, 3, 4), wE:brickT(T, 3, 4), wN:brickT(T, 8, 4), wS:brickT(T, 8, 4)});
  const hd = SD/2, hw = SW/2; applyAsphalt(roomMeshes[0], SW, SD, 0x948e82);
  [[2, SD, 0x9a8470], [3, SD, 0x9a8470], [4, SW, 0xc6a07c], [5, SW, 0xb89078]].forEach(([i, w, c]) => applyBrick(roomMeshes[i], w*1.9, SH*1.9, c));
  const conc = mStd(0x8a8478, .1, .9), dk = mStd(0x1a1c20, .5, .6), wood = mStd(0x5a3e2a, .1, .8), green = mStd(0x2e4a34, .05, .9), metal = mStd(0x2a2c32, .6, .5);
  for (const s of [-1, 1]) { exBox(SW, .5, .14, conc, 0, .25, s*(hd - .07)); exBox(SW, .3, .3, conc, 0, SH - .15, s*(hd - .15)); }
  exBox(.14, .5, SD, conc, hw - .07, .25, 0); exBox(.14, .5, SD, conc, -hw + .07, .25, 0);
  xs.sideL = [];
  const lamp = (col, I, d, x, y, z, aim) => { const l = exPt(col, I, d, x, y, z); l.userData.aim = aim || [0, -1, 0]; l.userData.b = I; xs.sideL.push(l); return l; };
  // Fenster mit Läden, Blumenkästen, Vorhängen
  const mkWin = (lit, k) => { const c = document.createElement("canvas"); c.width = 64; c.height = 88; const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 88);
    if (lit) { g.addColorStop(0, ["#78c4bd", "#f0d090", "#78c4bd"][k%3]); g.addColorStop(1, "#a8743c"); } else { g.addColorStop(0, "#5f636a"); g.addColorStop(.55, "#292d33"); g.addColorStop(1, "#12161c"); }
    x.fillStyle = g; x.fillRect(0, 0, 64, 88);
    if (lit) { x.fillStyle = "rgba(130,64,44,.6)"; x.fillRect(0, 0, 13, 88); x.fillRect(51, 0, 13, 88); if (k%2) { x.fillStyle = "rgba(50,30,20,.65)"; x.beginPath(); x.arc(34, 52, 8, 0, 7); x.fill(); x.fillRect(26, 58, 16, 30); } else { x.fillStyle = "rgba(255,240,200,.35)"; x.beginPath(); x.arc(32, 18, 14, 0, 7); x.fill(); } }
    else { x.fillStyle = "rgba(255,255,255,.08)"; x.beginPath(); x.moveTo(0, 0); x.lineTo(34, 0); x.lineTo(0, 56); x.fill(); }
    x.fillStyle = "#2a2622"; x.fillRect(30, 0, 4, 88); x.fillRect(0, 40, 64, 4); x.fillRect(0, 0, 64, 3); x.fillRect(0, 85, 64, 3); x.fillRect(0, 0, 3, 88); x.fillRect(61, 0, 3, 88);
    const tx = new THREE.CanvasTexture(c); return new THREE.MeshBasicMaterial({map:tx}); }, winM = [mkWin(0, 0), mkWin(0, 1), mkWin(1, 0), mkWin(1, 1), mkWin(1, 2)];
  const shopM = (kind) => { const c = document.createElement("canvas"); c.width = 256; c.height = 128; const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, "#f0cf8c"); g.addColorStop(1, "#7a4c26"); x.fillStyle = g; x.fillRect(0, 0, 256, 128);
    x.fillStyle = "rgba(60,36,20,.75)"; for (const y of [44, 82]) x.fillRect(8, y, 240, 5);
    for (let i = 0; i < 12; i++) for (const y of [44, 82]) { const px = 14 + i*20 + (y > 50 ? 6 : 0); if (kind === 0) { x.fillStyle = ["#e8e2d4", "#b8573a", "#3a5a48"][i%3]; x.fillRect(px, y - 14, 10, 14); } else if (kind === 1) { x.fillStyle = ["#c4813a", "#b87f00", "#78c4bd"][i%3]; x.beginPath(); x.ellipse(px + 6, y - 6, 9, 6, 0, 0, 7); x.fill(); } else { x.fillStyle = ["#d84a3a", "#e8e8e0", "#71767d"][i%3]; x.fillRect(px, y - 18, 12, 18); } }
    x.fillStyle = "rgba(255,240,190,.55)"; for (const px of [50, 128, 206]) { x.beginPath(); x.arc(px, 8, 14, 0, 7); x.fill(); }
    x.fillStyle = "#2a2018"; x.fillRect(0, 0, 256, 5); x.fillRect(0, 123, 256, 5); x.fillRect(0, 0, 5, 128); x.fillRect(251, 0, 5, 128); x.fillRect(126, 0, 4, 128);
    return new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}); };
  const shut = [0x3a5a48, 0x5a3a30, 0x2e4058];
  for (const s of [-1, 1]) for (const x of [-9.6, -7.2, -4.8, -2.4, 0, 2.4, 4.8, 7.2, 9.6]) for (const y of [4.8, 7.4, 10.0]) {
    if (s < 0 && Math.abs(x - DOORX) < 1.3 && y < 5.6) continue; if (s > 0 && y < 5.6 && x > -9.8 && x < 7.4) continue; const z0 = s*hd, inn = -s, ry = s < 0 ? 0 : Math.PI;
    exBox(1.15, 1.55, .1, conc, x, y, z0 + inn*.05).userData.noSh = 1; const g = new THREE.Mesh(new THREE.PlaneGeometry(.92, 1.3), winM[Math.random() < .3 ? 2 + Math.floor(Math.random()*3) : Math.floor(Math.random()*2)]); g.position.set(x, y, z0 + inn*.105); g.rotation.y = ry; exG.add(g);
    const sc = shut[(Math.abs(Math.round(x*3 + y))) % 3]; for (const k of [-1, 1]) exBox(.3, 1.45, .04, mStd(sc, .05, .85), x + k*.68, y, z0 + inn*.12).userData.noSh = 1;
    exBox(1.35, .09, .34, conc, x, y - .82, z0 + inn*.17).userData.noSh = 1;
    if (Math.random() < .5) { exBox(1.0, .22, .26, wood, x, y - .62, z0 + inn*.3).userData.noSh = 1; exBox(.95, .14, .24, green, x, y - .46, z0 + inn*.3).userData.noSh = 1; } }
  // Haustüren (Nord): Nr. 29, Nr. 31 (Vargas Haus), Nr. 33
  const door = (x, s, col, num, wd) => { const z0 = s*hd, inn = -s, ry = s < 0 ? 0 : Math.PI;
    exBox(1.5, .16, .26, conc, x, 2.4, z0 + inn*.13); exBox(.16, 2.34, .26, conc, x - .7, 1.17, z0 + inn*.13); exBox(.16, 2.34, .26, conc, x + .7, 1.17, z0 + inn*.13); exBox(1.2, 2.25, .07, mStd(col, .1, wd ? .8 : .5), x, 1.12, z0 + inn*.06);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(.5, .9), winM[3]); gl.position.set(x, 1.55, z0 + inn*.1); gl.rotation.y = ry; exG.add(gl);
    exBox(.1, .05, .08, mStd(0xd8b060, .8, .3), x + .42, 1.05, z0 + inn*.13); exBox(1.7, .16, .7, conc, x, .08, z0 + inn*.4); exPl(.44, .24, sign(num, "#78c4bd", .44, .24, "#1c1a18"), x, 2.75, z0 + inn*.02, ry);
    const b = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({color:0xffe0b0})); b.position.set(x, 2.95, z0 + inn*.3); exG.add(b); lamp(0xffc890, 1.0, 7, x, 2.85, z0 + inn*.4, [0, -1, inn*1.5]); };
  door(DOORX, -1, 0x2c4a3a, "Nr. 31", true); door(2.6, -1, 0x4a3224, "Nr. 29", true); door(-2.4, -1, 0x23304a, "Nr. 33", false);
  // Rückweg (Nordwand, West)
  sideGate(-8.4, -hd + .02, 0, "← HAUPTSTRASSE");
  // Südseite: Café Lenz mit Markise, Tische, Bäckerei, Kiosk
  const awn = (x0, x1, col, txt, tc, kind) => { const w = x1 - x0, cx = (x0 + x1)/2; const a = new THREE.Mesh(new THREE.BoxGeometry(w, .08, 1.5), mStd(col, .05, .9)); a.position.set(cx, 2.95, hd - .8); a.rotation.x = .22; exG.add(a); for (let i = 0; i < Math.floor(w/.6); i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(.3, .11, 1.5), mStd(0xe8e4dc, .05, .9)); st.position.set(x0 + .6*i + .45, 2.95, hd - .8); st.rotation.x = .22; exG.add(st); }
    for (const sx of [x0 + .1, x1 - .1]) exBox(.05, 2.9, .05, metal, sx, 1.45, hd - 1.5);
    exPl(w - .4, .45, sign(txt, tc, w - .4, .45, "#1c1612"), cx, 3.55, hd - .06, Math.PI); const wl = new THREE.Mesh(new THREE.PlaneGeometry(w - 1.0, 1.5), shopM(kind)); wl.position.set(cx, 1.5, hd - .05); wl.rotation.y = Math.PI; exG.add(wl);
    exBox(w - .9, .08, .06, dk, cx, 2.3, hd - .07); exBox(w - .9, .08, .06, dk, cx, .75, hd - .07); lamp(0xffc080, 1.1, 6, cx, 2.0, hd - 1.2, [0, -1, 0]); };
  awn(-9.6, -4.4, 0x2a5a44, "CAFÉ LENZ", "#f0d8a0", 0); awn(-3.6, .6, 0x8a3a2e, "BÄCKEREI KOCH", "#f4e4c0", 1); awn(1.6, 4.0, 0x2a4a7a, "KIOSK", "#f0f0f0", 2);
  const tbl = (x, z) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .05, 14), mStd(0xe8e0d0, .1, .6)); t.position.set(x, .74, z); exG.add(t); const p = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .74, 8), metal); p.position.set(x, .37, z); exG.add(p); solidOf(p, blocks);
    for (const [cx, cz] of [[-.55, 0], [.55, 0]]) { exBox(.38, .04, .38, wood, x + cx, .46, z + cz); exBox(.38, .42, .04, wood, x + cx, .68, z + cz + (cz ? 0 : 0) + .17*Math.sign(cx)*0); exBox(.04, .46, .04, metal, x + cx - .15, .23, z + cz - .15); exBox(.04, .46, .04, metal, x + cx + .15, .23, z + cz + .15); } };
  for (const x of [-8.6, -6.9, -5.4]) tbl(x, hd - 1.9);
  // Kiosk-Tresen und Zeitungsständer, Briefkasten, Bank, Laternen, Bäume
  exBox(2.2, 1.0, .5, mStd(0x2a4a7a, .1, .8), 2.8, .5, hd - .35, true); exBox(2.3, .05, .6, wood, 2.8, 1.02, hd - .35);
  for (let i = 0; i < 6; i++) exBox(.28, .22, .02, mStd([0xe0a030, 0xe8e8e8, 0xc84a3a][i%3], .05, .9), 2.0 + i*.32, 1.25, hd - .1);
  exBox(.42, .9, .34, mStd(0xe0b020, .2, .6), 1.1, .45, -hd + .35, true); exBox(.34, .06, .02, dk, 1.1, .8, -hd + .52);
  { const bx = -4.6, bz = -hd + .45; exBox(1.5, .06, .45, wood, bx, .48, bz, true); exBox(1.5, .4, .06, wood, bx, .75, bz - .2); for (const k of [-.65, .65]) exBox(.06, .46, .4, metal, bx + k, .23, bz); }
  { const lp = new THREE.Group(); lp.position.set(-6.2, 0, -hd + .35); exG.add(lp); const pm = mStd(0x1c2a24, .6, .4), pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 4.2, 8), pm); pole.position.y = 2.1; lp.add(pole); const hd2 = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), new THREE.MeshBasicMaterial({color:0xffe4b0})); hd2.position.y = 4.35; lp.add(hd2); lp.updateMatrixWorld(true); solidOf(pole, blocks); lamp(0xffd8a0, 1.4, 9, -6.2, 4.1, -hd + .6, [0, -1, 0]); }
  for (const x of [-1.4, 5.8, 9.2]) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(.4, .3, .6, 12), mStd(0x6a4030, .05, .85)); pot.position.set(x, .3, hd - .6); exG.add(pot); solidOf(pot, blocks); const tr = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 2.1, 8), wood); tr.position.set(x, 1.6, hd - .6); exG.add(tr);
    for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.SphereGeometry(.7 - k*.06, 10, 8), mStd(k%2 ? 0x3a6a3c : 0x2e5a34, .02, .9)); c.position.set(x + Math.sin(k*2)*.35, 2.9 + k*.28, hd - .6 + Math.cos(k*2)*.35); exG.add(c); } }
  for (const [x, z, s] of [[-.5, hd - .45, .8], [10.1, -hd + .5, .8], [6.4, -hd + .45, .6]]) exBox(s, s, s, mStd(0x9a8466, .02, .95), x, s/2, z, true);
  { const pts = [V3(-10, 6.2, -hd + .3), V3(0, 5.3, 0), V3(10, 6.2, hd - .3)], cv = new THREE.CatmullRomCurve3(pts), cp = cv.getPoints(40); exG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cp), new THREE.LineBasicMaterial({color:0x2a2a2e})));
    const fl = cp.filter((_, i) => i%2 === 0), col = new Float32Array(fl.length*3), cc = [[.95, .55, .2], [.9, .9, .85], [.3, .6, .9], [.9, .3, .3]]; fl.forEach((_, i) => { const c = cc[i%4]; col.set(c, i*3); }); const ge = new THREE.BufferGeometry().setFromPoints(fl); ge.setAttribute("color", new THREE.BufferAttribute(col, 3)); exG.add(new THREE.Points(ge, new THREE.PointsMaterial({size:6, sizeAttenuation:false, vertexColors:true, fog:false}))); }
  { const mh = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .02, 20), mStd(0x2a2a2e, .5, .6)); mh.position.set(1.0, .011, .3); exG.add(mh); for (let i = -2; i <= 2; i++) exBox(.62, .006, .025, dk, 1.0, .024, .3 + i*.12);
    for (const [px, pz, sx, sz] of [[-1.9, .7, 1.1, .6], [5.2, -.4, .9, .5], [-8.6, -.9, .8, .45]]) { const pd = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({color:0x6a7a92, transparent:true, opacity:.45, depthWrite:false})); pd.rotation.x = -Math.PI/2; pd.scale.set(sx, sz, 1); pd.position.set(px, .008, pz); exG.add(pd); }
    for (const dz of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.34, .022, 6, 20), metal); w.position.set(-.4 + dz*.5, .36, -hd + .6); exG.add(w); }
    exBox(1.0, .03, .03, metal, -.4, .58, -hd + .6); exBox(.03, .34, .03, metal, -.55, .52, -hd + .6); exBox(.03, .44, .03, metal, .08, .52, -hd + .6); exBox(.03, .03, .4, metal, .1, .78, -hd + .6); exBox(.2, .04, .06, dk, -.58, .76, -hd + .6);
    for (const [px, pz] of [[-hw + .35, -hd + .08], [hw - .35, hd - .08]]) { const pp = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, SH - .4, 8), mStd(0x3a3c40, .5, .5)); pp.position.set(px, (SH - .4)/2, pz); exG.add(pp); for (const y of [2, 5, 8, 11]) { const br = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .08, 8), mStd(0x2a2c30, .6, .4)); br.position.set(px, y, pz); exG.add(br); } } }
  // Enden der Straße: hohe Mauer West, Garagentor Ost
  exBox(.3, 3.0, 3.2, mStd(0x4a4e58, .5, .6), hw - .2, 1.5, hd - 1.8); exPl(2.4, .5, sign("PRIVAT · NICHT PARKEN", "#78c4bd", 2.4, .5, "#1c1816"), hw - .06, 3.4, hd - 1.8, -Math.PI/2);
  scene.fog = new THREE.FogExp2(0xc8a690, .03); scene.background = new THREE.Color(0xc8a690);
  Object.assign(xs, {scene:"side", env:"alley", dark:false, hI:1.1, hC:0xffe2c4, hG:0x3a3030, bell:null, drunkT:99, dl:0, drunk:null});
}

/* ---------- Beschattung: Schritt-für-Schritt-Anleitung ---------- */
const obsGd = document.createElement("div"); obsGd.id = "obsGd"; obsGd.innerHTML = '<i></i><span></span>'; document.body.appendChild(obsGd);
{ const st = document.createElement("style"); st.textContent = `#obsGd{position:fixed;left:50%;bottom:11%;transform:translate(-50%,8px);z-index:21;display:flex;align-items:flex-start;gap:12px;max-width:min(560px,90vw);padding:11px 18px 11px 12px;border-radius:16px;background:rgba(11,14,20,.55);border:1px solid rgba(226,232,240,.16);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#e2e8f0;font-size:14px;line-height:1.45;letter-spacing:.03em;opacity:0;pointer-events:none;transition:opacity .35s,transform .35s}#obsGd.on{opacity:1;transform:translate(-50%,0)}#obsGd i{font-style:normal;font-size:11px;font-weight:700;min-width:26px;height:26px;padding:0 6px;box-sizing:border-box;border-radius:7px;display:flex;align-items:center;justify-content:center;background:#4fa9a3;color:#0b0e14;flex:none}#obsGd.warn i{background:#d9695f;color:#fff}#obsGd small{display:block;font-size:10px;letter-spacing:.24em;color:rgba(226,232,240,.55);margin-bottom:2px}`; document.head.appendChild(st); }
const obsG = {t:0, last:"", min:0};
function obsGuide(dt) {
  const O = gear.obs, show = (k, h, t, warn) => { const key = h + t; if (obsG.last !== key) { obsG.last = key; obsGd.querySelector("i").textContent = k; const sp = obsGd.querySelector("span"); sp.innerHTML = "<small></small>"; sp.querySelector("small").textContent = T(h).toUpperCase(); sp.appendChild(document.createTextNode(Array.isArray(t) ? t.map(x => T(x)).join("") : T(t))); } obsGd.classList.toggle("warn", !!warn); obsGd.classList.add("on"); };
  if (!O || !O.st || xs.scene !== "side" || mode !== "surf" || paused || opt.tut === false) { obsGd.classList.remove("on"); if (xs.scene !== "side") obsG.t = 0; return; }
  obsG.t += dt; const tch = window.inputMode === "touch", pad = window.inputMode === "pad", r = obs.run;
  const kPhoto = tch ? "Foto-Knopf" : pad ? "RT" : "Linksklick oder Enter", kFp = tch ? "Kamera-Knopf" : pad ? "Y" : "V";
  if (!r) { if (O.st === 3) { obsGd.classList.remove("on"); return; }
    if (obsG.t < 7) show("1/3", "Auftrag", "Du beschattest Herrn Varga und machst 4 Beweisfotos – Morgen, Mittag, Nachmittag, Abend. Jede Szene ist ein kurzer Moment."); 
    else if (obsG.t < 14) show("2/3", "So geht's", "Bleib unauffällig: nicht direkt vor Varga stehen und ihm nicht nahe kommen. Klettere an Wände, Laternen oder Dächer – oben sieht er dich kaum.");
    else if (obsG.t < 21) show("3/3", "Foto machen", ["Wechsle mit ", kFp, " in die Ich-Perspektive, ziele auf Varga und drücke ", kPhoto, ", sobald oben „JETZT FOTOGRAFIEREN“ leuchtet."]);
    else obsGd.classList.remove("on"); return; }
  const slot = r.slot, taken = !!O.shots[slot], mom = r.a.some(a => a.ok) && !taken, need = slot === 1 ? "Varga UND der Roboter müssen im Bild sein." : slot === 3 ? "Varga UND seine Begleitung müssen im Bild sein." : "Varga muss im Bild sein.";
  if (r.susp > .35 && !taken) show("!", "Er wird misstrauisch", "Geh sofort aus seinem Blickfeld – hinter ihn, weit weg oder hoch an die Wand. Sonst beginnt der Tag von vorn.", true);
  else if (taken) show("✓", "Foto im Kasten", "Gut gemacht. Bleib versteckt, bis die nächste Szene beginnt.");
  else if (r.t < 5) show("1", "Position suchen", "Varga kommt gleich. Such dir einen Platz mit freier Sicht, mindestens 3 m Abstand – am besten erhöht an einer Wand oder Laterne.");
  else if (!fp) show(kFp, "Ich-Perspektive", ["Drücke ", kFp, " und richte die Kamera auf Varga (Maus bzw. A/D drehen). ", mom ? "Jetzt ist der Moment!" : "Warte auf den Moment: „JETZT FOTOGRAFIEREN“ erscheint oben."]);
  else if (!mom) show("⏳", "Warten", ["Halte Varga im Bild und warte, bis oben „JETZT FOTOGRAFIEREN“ erscheint. ", need]);
  else show("📷", "Jetzt!", [need, " Dann ", kPhoto, "."]);
}
