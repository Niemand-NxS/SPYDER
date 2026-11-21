# Online-Speicher für SPYDER einrichten (Firebase)

Das Spiel speichert Profil, Statistiken, Erfolge und die 3 Spielstände in einem Firebase-Konto (Anmeldung mit Name + Passwort). Kostenlos im Spark-Tarif.

1. https://console.firebase.google.com → **Projekt hinzufügen** (Analytics kann aus bleiben).
2. **Build → Authentication → Los geht's → Anmeldemethode → E-Mail/Passwort** aktivieren (nur den ersten Schalter, nicht „E-Mail-Link").
3. **Build → Firestore Database → Datenbank erstellen** (Produktionsmodus, beliebige Region). Danach Reiter **Regeln**: Inhalt von `firestore.rules` einfügen und **Veröffentlichen**.
4. **Projekteinstellungen (Zahnrad) → Allgemein → Meine Apps → Web (</>)** → App registrieren. Der angezeigte `firebaseConfig`-Block (apiKey, authDomain, projectId, appId …) wird kopiert.
5. Im Spiel: **Konto** → Block in das Feld einfügen → **Online-Speicher aktivieren**. Die Seite lädt neu, danach erscheint Registrieren/Anmelden.
   (Alternativ den Block in `FB_CONFIG` am Anfang des Abschnitts „Online-Speicher" in `uisnd.js` eintragen.)
6. **Authentication → Einstellungen → Autorisierte Domains**: die Domain eintragen, unter der das Spiel läuft (z. B. `deinname.github.io`). Von einer lokal geöffneten Datei (`file://`) funktioniert die Anmeldung nicht – das Spiel muss über eine Web-Adresse laufen.

Hinweise
- Der apiKey ist bei Firebase kein Geheimnis; geschützt werden die Daten durch die Regeln aus Schritt 3.
- Namen: 2–16 Zeichen (Buchstaben, Zahlen, `_ . -`); intern wird `name@spyder-nxs.app` als Login verwendet, es wird keine echte E-Mail benötigt. Eine Passwort-vergessen-Funktion gibt es deshalb nicht.
- Abgleich: Statistiken = jeweils höherer Wert, Erfolge = Vereinigung, Spielstände = der neuere gewinnt.
