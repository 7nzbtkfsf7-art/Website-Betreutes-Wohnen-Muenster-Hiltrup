# Website Betreutes Wohnen Münster-Hiltrup

Info-Website, veröffentlicht über GitHub Pages. Bis zum Start ist sie nur mit Passwort zu sehen.

**Vorschau:** https://7nzbtkfsf7-art.github.io/Website-Betreutes-Wohnen-Muenster-Hiltrup/

Jede Änderung wird automatisch veröffentlicht. Das dauert etwa eine Minute und ist unter dem Reiter **Actions** („Website veröffentlichen“) zu sehen. Solange der Vorschau-Modus an ist, wird jede Seite verschlüsselt: Besucher sehen zuerst eine Anmeldeseite und brauchen das Vorschau-Passwort.

## Einmalig einrichten

1. **Sichtbarkeit:** Mit GitHub Free veröffentlicht GitHub Pages nur öffentliche Repositories. Dafür *Settings → General → Danger Zone → Change repository visibility → Public* wählen. Mit GitHub Pro kann das Repository privat bleiben.
2. **GitHub Pages einschalten:** Unter *Settings → Pages → Build and deployment* bei *Source* **GitHub Actions** wählen.
3. **Passwort festlegen:** *Settings → Secrets and variables → Actions → New repository secret* öffnen. Name `VORSCHAU_PASSWORT`, als Wert das Passwort eintragen (mindestens 12 Zeichen). Ohne dieses Secret wird nichts veröffentlicht.
4. **Website hochladen:** Im Reiter **Code** auf *Add file → Upload files* gehen und den **Inhalt** des Website-Ordners hineinziehen, sodass `index.html` direkt im Hauptordner liegt. Mit *Commit changes* bestätigen.

Danach startet die Veröffentlichung von selbst. Ein grüner Haken unter **Actions** heißt: Die Vorschau ist online.

## Vorschau teilen

- Link und Passwort am besten getrennt schicken, zum Beispiel den Link per E-Mail und das Passwort per SMS.
- „Angemeldet bleiben“ ist vorausgewählt. Wer sich angemeldet hat, wird 30 Tage lang nicht erneut gefragt, auch nicht beim Wechsel zwischen den Seiten.
- **Passwort ändern:** Das Secret `VORSCHAU_PASSWORT` neu setzen und unter *Actions → Website veröffentlichen → Run workflow* neu veröffentlichen. Danach gilt das alte Passwort nicht mehr.

## Was der Passwortschutz leistet

- Alle Seiten (`.html`-Dateien) sind verschlüsselt. Ohne Passwort ist nur die Anmeldeseite zu sehen, und auch die soll nicht in Suchmaschinen erscheinen.
- Bilder, PDFs und Stylesheets sind **nicht** verschlüsselt. Wer die genaue Adresse einer Datei kennt, kann sie öffnen.
- Ist das Repository öffentlich, kann jeder alle Dateien direkt hier auf GitHub lesen. Der Passwortschutz hält dann vor allem zufällige Besucher und Suchmaschinen fern.
- Alle nutzen dasselbe Passwort, einzelne Benutzerkonten gibt es nicht.

## Wenn etwas nicht klappt

Bei einem roten Kreuz unter **Actions** den Lauf öffnen. Die Meldung oben nennt den Grund, zum Beispiel „Passwort fehlt“ oder „Startseite fehlt“.

- **Fehler im Teil „veroeffentlichen“** (oft mit „404“ oder einem Hinweis auf GitHub Pages): Meist fehlt Schritt 1 oder 2 der Einrichtung. Die Reihenfolge ist wichtig, denn eine spätere Änderung der Sichtbarkeit schaltet GitHub Pages wieder aus. Danach unter *Actions → Website veröffentlichen → Run workflow* neu starten.
- **Bilder oder Gestaltung fehlen in der Vorschau:** Die Vorschau liegt in einem Unterordner. Pfade in der Website deshalb relativ schreiben, also `bilder/foto.jpg` statt `/bilder/foto.jpg`.
- **Kontaktformular:** Formulare, die PHP brauchen, funktionieren auf GitHub Pages nicht. Dafür gibt es externe Formular-Dienste.

## Start mit eigener Domain

1. Die Domain bei einem Anbieter registrieren.
2. Unter *Settings → Pages → Custom domain* die Domain eintragen und speichern. Beim Domain-Anbieter dann diese DNS-Einträge setzen:
   - für `www`: CNAME auf `7nzbtkfsf7-art.github.io`
   - für die Domain ohne `www`: A-Einträge auf `185.199.108.153`, `185.199.109.153`, `185.199.110.153` und `185.199.111.153`

   Sobald GitHub die Domain erkennt, *Enforce HTTPS* anhaken.
3. Empfohlen: Die Domain im GitHub-Konto bestätigen (*Konto-Settings → Pages → Add a domain*), damit niemand sonst sie für eine GitHub-Seite nutzen kann.
4. Den Passwortschutz ausschalten: In `.github/workflows/veroeffentlichen.yml` die Zeile `PASSWORTSCHUTZ: an` in `PASSWORTSCHUTZ: aus` ändern. Mit dieser Änderung geht die Seite ohne Passwort online.
5. Vor dem Start Impressum und Datenschutzerklärung prüfen. GitHub (USA) ist dann der Hoster und verarbeitet die IP-Adressen der Besucher.
