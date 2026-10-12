# music-frontend

Dieses Projekt ist die eine Hälfte des music-Projekts (die andere ist [music-backend](https://github.com/Marc3y/music-backend)). Die Inspiration liegt hierbei bei dem Projekt untitled. Auf der Seite kann man Songs, Beats und Projekte hochladen und in verschiedenen Playlists kategorisieren, sowie bestimmte Songs, Projekte oder auch Playlists mit anderen Personen teilen. Ebenfalls ist es möglich, Personen als Collaborator bestimmter Playlists hinzuzufügen.

Das Projekt setzt die Zielgruppe auf Producer und Musiker.

Daneben gibt es auch eine native SwiftUI-App für iOS und macOS ([music-app](https://github.com/Marc3y/music-app)), die dieselbe Funktionalität gegen dasselbe Backend abbildet.

## Tech-Stack

- **Next.js 16** (App Router) mit React und TypeScript
- Tailwind CSS, shadcn-artige Komponenten auf Basis von Base UI
- [wavesurfer.js](https://wavesurfer.xyz/) für die Wellenform-Darstellung im Player
- `fft.js` + `web-audio-beat-detector` für clientseitige BPM-/Tonart-Erkennung beim Upload
- `@tanstack/react-virtual` zum Virtualisieren großer Track-/Playlist-Listen
- `motion` (Framer Motion) für Animationen
- Supabase ausschließlich als Google-OAuth-Broker (keine eigene Datenhaltung dort)

## Features

### Konten & Login

- Registrierung mit E-Mail-Verifizierung per Code
- Login mit E-Mail/Passwort oder Google (über Supabase als OAuth-Broker)
- Passwort vergessen / zurücksetzen per E-Mail-Link
- Eigenes Profil mit Benutzername, Profilbild (inkl. Zuschneiden) und Konto-Löschung

### Bibliothek & Playlists

- Eigene Playlists anlegen, umbenennen, mit Cover versehen und löschen
- Drei Bereiche in der Bibliothek: eigene Playlists, mit dir geteilte Inhalte, Playlists bei denen du Collaborator bist
- Collaborator zu Playlists einladen und wieder entfernen
- Drag & Drop zum Sortieren von Playlists und Tracks

### Tracks, Versionen & Projektdateien

- Upload von Audiodateien (MP3, WAV, FLAC, AAC, OGG, …) sowie Projektarchiven (`.zip`/`.rar`)
- Automatische BPM- und Tonart-Erkennung direkt im Browser nach dem Upload
- Mehrere Versionen pro Track (z. B. verschiedene Mixe), mit Auswahl der aktiven Hauptversion
- Pro Version lässt sich zusätzlich eine Projektdatei (DAW-Projekt als Archiv) anhängen, herunterladen oder entfernen
- Metadaten (Titel, Künstler, Beschreibung, BPM, Tonart) nachträglich bearbeitbar
- Track-Infoseite mit Höranzahl, Downloads, Dateigröße, Format und mehr

### Player

- Durchgehender Player über die ganze App hinweg (Mini-Player + ausklappbare Vollansicht)
- Wellenform-Visualisierung, Warteschlange, Shuffle und Loop (aus/alle/einzeln)
- Wiedergabegeschwindigkeit einstellbar, inklusive tonhöhenunabhängigem Zeitlupen-/Zeitraffer-Modus
- Hörvorgänge werden nach 15 Sekunden Wiedergabe automatisch gezählt

### Teilen

- Öffentliche Links für einzelne Tracks, Projektdateien oder ganze Playlists
- Optionaler Passwortschutz pro Link
- Steuerbar, ob Download erlaubt ist
- Playlist-Links lassen sich auf bestimmte Benutzernamen einschränken
- Empfangene geteilte Inhalte lassen sich in die eigene Bibliothek übernehmen

### Benachrichtigungen

- Echtzeit-Benachrichtigungscenter (Server-Sent Events) für neue Collaborator, geteilte Inhalte, Versionsänderungen u. Ä.

### Statistiken & Nutzung

- Übersicht zu Speicherverbrauch, Top-Tracks und Top-Hörern
- Verwaltung aller eigenen Tracks/Projekte inkl. Löschen einzelner Dateien zur Speicherfreigabe

### Abo-Stufen

- Drei Stufen (Free / Plus / Unlimited) mit unterschiedlichen Speicherlimits

### Individualisierung

- Helles und dunkles Theme
- Mehrere wählbare Akzentfarben
- Zahlreiche Hintergrund-Presets (Farbverläufe und Muster)
- Vollständig zweisprachig (Deutsch/Englisch)

### Performance

- Re-Render-Optimierungen für den Player (60-Hz-Zeitupdates laufen außerhalb von React-State)
- Virtualisierte Listen für sehr große Playlists
- Bildoptimierung über `next/image`, Code-Splitting selten genutzter Dialoge
