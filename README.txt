SVARA PWA
=========
This version is installable as a Progressive Web App.

Structure:
- src/index.html
- src/style.css
- src/script.js
- images/background.jpg
- images/logo.svg
- icons/icon-192.png
- icons/icon-512.png
- music/Kachaudi Gali.mp3
- manifest.json
- sw.js

Included app features:
- Responsive full-screen cinematic player
- Mobile app-style bottom navigation
- PWA install prompt + manifest
- Service worker/offline shell
- Local audio import + drag/drop
- Search
- Liked songs persisted in localStorage
- Shuffle/repeat
- Progress + volume
- Previous/next
- Media Session controls where supported
- Keyboard shortcuts on desktop
- Hover flow animation for songs on pointer devices
- Touch-friendly active-song motion on phones

Important:
PWA installation/service workers require a secure context (HTTPS) or localhost.
Opening the HTML directly with file:// will not provide installability.
For local development use a server such as VS Code Live Server.
