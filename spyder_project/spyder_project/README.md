# SPYDER – Projekt
Browser-Spiel (Three.js r128, Vanilla JS, Web Audio). Du spielst die Roboterspinne ARACHNE-8 in CJ-City.

## Struktur
- `src/index.template.html` – HTML/CSS/UI-Gerüst (Menü, HUD, Einstellungen)
- `src/*.js` – Spielcode in Ladereihenfolge (siehe `ORDER` in `build.py`); `i18n.js` = Übersetzungen, `melee.js` = Kampf, `story.js` = Intro/Story, `job.js`/`ch2.js` = Kapitel 2 …
- `assets/textures/` – 42 Texturen (JPG), `assets/audio/` – 11 Klänge (MP3), `assets/ui/` – 6 UI-Bilder (Logos, PNG)
- `src/three.webgpu.js` – Three.js r170 (WebGPU-Build, nur für die experimentelle WebGPU-Option)
- `build.py` – baut daraus `dist/spyder.html`

## Bauen
`python3 build.py` (nur Python 3 nötig). Dateien in `assets/` ersetzen die eingebetteten Daten (gleicher Dateiname, gleiches Format) – danach neu bauen.
Standardmäßig lädt das Spiel Three.js r128 von cdnjs (Internet nötig); WebGPU-Modus nutzt die eingebettete Version.
