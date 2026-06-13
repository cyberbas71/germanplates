# Kennzeichen · German Plate Finder

A phone-friendly Progressive Web App. Type the prefix letters of a German licence
plate (the *Unterscheidungszeichen*, e.g. `B`, `M`, `HH`, `GAP`) and it tells you:

- **Which city / district** the vehicle is registered in
- **How far that city is from you** (great-circle distance, in km), using your phone's GPS
- The **compass direction** toward it

## Features

- 🔌 **Works offline** — the full code database (630 prefixes) and the app are cached via a service worker.
- 📱 **Installable** — "Add to Home Screen" turns it into a standalone app.
- 🎯 **Smart matching** — longest-prefix lookup (`GAP` beats `G`), live suggestions, handles separators (`M-AB 123` → `M`).
- 📍 **Location remembered** — your last position is saved locally for instant distances.

## Run locally

It's pure static files — no build step:

```bash
npx serve .       # or: python3 -m http.server 8000
```

Geolocation requires `https://` (or `localhost`), which Vercel provides automatically.

## How it works

- `plates.js` — the prefix → `{ city, lat, lng }` database.
- `index.html` — UI + logic (Haversine distance, bearing, longest-prefix lookup).
- `sw.js` / `manifest.webmanifest` — offline + installability.
- `icons/gen.js` — regenerates the PNG app icons from scratch (no dependencies).

## Note on data

Coordinates are the approximate centre of each issuing city/district, so distances
are accurate to a few kilometres — perfect for "how far did that car come from?",
not for navigation.
