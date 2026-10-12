# music-frontend

Preview: [music.marcey.net](https://music.marcey.net/)

Dieses Projekt ist die eine Hälfte des music-Projekts (die andere ist [music-backend](https://github.com/Marc3y/music-backend)). Die Inspiration liegt hierbei bei dem Projekt untitled. Auf der Seite kann man Songs, Beats und Projekte hochladen und in verschiedenen Playlists kategorisieren, sowie bestimmte Songs, Projekte oder auch Playlists mit anderen Personen teilen. Ebenfalls ist es möglich, Personen als Collaborator bestimmter Playlists hinzuzufügen.

Das Projekt setzt die Zielgruppe auf Producer und Musiker.

Daneben gibt es auch eine native SwiftUI-App für iOS und macOS ([music-app](https://github.com/Marc3y/music-app)), die dieselbe Funktionalität gegen dasselbe Backend abbildet.

![Preview](gitlib/prev.png)

## Tech-Stack

- **Next.js 16** (App Router) mit React und TypeScript
- Tailwind CSS und shadcn-artige Komponenten
- wavesurfer.js für die Wellenform-UI im Player
- `fft.js` + `web-audio-beat-detector` für BPM-/Key-Erkennung beim Upload (clientseitig)
- `@tanstack/react-virtual` zum Virtualisieren großer Track & Playlist-Listen
- `motion` (Framer Motion) für Animations
- Supabase für Google-Login

## Features

### Konto & Login

- Registrierung mit E-Mail-Verifizierung per Code
- Login mit Email / Passwort oder Google
- Passwort vergessen / zurücksetzen per E-Mail-Link
- Profil mit Username, Profilbild (mit zuschneiden-Option) und Konto-Löschung

### Bibliothek & Playlists

- Eigene Playlists erstellen, umbenennen, Cover hinzufügen und löschen
- Drei Sections in Bibliothek: eigene Playlists, geteilte Inhalte, Playlists bei denen man Collaborator ist
- Collaborator zu Playlists einladen und wieder entfernen
- Drag & Drop zum Sortieren von Tracks in playlists

### Tracks, Versionen & Projektdateien

- Upload von Audiodateien (MP3, WAV, FLAC, AAC, OGG, …) sowie Projektarchiven (`.zip`/`.rar`)
- Automatische BPM und Key-Erkennung im Browser nach Upload (unstable)
- Mehrere Versionen pro Track (z. B. verschiedene Mixe etc.), mit Auswahl der aktiven Hauptversion
- Pro Version kann man eine Projektdatei (DAW-Projekt als .zip) anhängen, herunterladen oder entfernen
- Metadaten (Titel, Künstler, Beschreibung, BPM, Tonart) nachträglich bearbeitbar
- Track-Infoseite mit Höranzahl, Downloads, Dateigröße, Format und mehr

### Player

- Durchgehender Player über die ganze Seite hinweg (Mini-Player + ausklappbare Vollansicht)
- Waveform, Warteschlange, Shuffle & Loop
- Geschwindigkeit & Pitch anpassbar
- Nach 15s Abspielzeit gilt ein Song als gehört und wird gespeichert

### Teilen

- Öffentliche Links für Tracks, Projektdateien oder Playlists
- Optionaler Passwortschutz pro Link
- Anpassbar, ob Download erlaubt ist
- Playlist-Links lassen sich auf bestimmte Usernames einschränken
- Geteilte Inhalte lassen sich zur eigenen Bibliothek hinzufügen

### Benachrichtigungen

- Benachrichtigungscenter (Server-Sent Events) für neue Collaborator, geteilte Inhalte, Versionsänderungen, etc.

### Statistiken & Nutzung

- Übersicht zu Speicherverbrauch, Top-Tracks und Top-Hörern
- Verwaltung aller eigenen Tracks/Projekte + Löschen einzelner Dateien für Speicherplatz

### Abo-Stufen

- Drei Stufen (Free / Plus / Unlimited) mit unterschiedlichen Speicherlimits (Derzeit noch nicht kaufbar)

### Individualisierung

- Light & Darkmode
- Mehrere wählbare Farben
- Mehrere Hintergrund-Presets (Gradients und Muster)
- Zweisprachig (Deutsch/Englisch)

