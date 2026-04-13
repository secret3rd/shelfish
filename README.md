# Shelf-ish (Professional Edition)

Shelf-ish is a minimalist media framework for Bear Blog. This edition strictly scans for the `🔢` emoji within bullet lists, transforming arrays into a responsive visual gallery completely siloed from global blog styles.

---

## 1. Quick Deployment
You must add both the core script and the visual styles to your Bear Blog settings.

**Settings > Footer Directive:**
```html
<script src="https://gist.githubusercontent.com/secret3rd/ee97b5443b6d3fdf8b82505df752e1cc/raw/6f41b2d62b16aa5bbdbd8d9f10cd200c0adfaec3/shelf-ish.js"></script>
```

**Settings > Header Directive:**
```html
<link rel="stylesheet" href="https://gistcdn.githack.com/secret3rd/db9153b57f3d3def1ccf60d41471f3be/raw/66f1f1ce4dfdd4eb84bc80b96223e81434a96836/shelf-ish.css">
```

---

## 2. Formatting Requirements
The parser requires a strictly formatted array to populate the gallery grid correctly.

1.  **The Trigger Marker**: Your unordered list MUST start with the `🔢` emoji on the very first bullet point.
2.  **The Strict Syntax**: Every subsequent list item must adhere to a strict 4-slot structure, separated by pipes (`|`).

`- [Type] Title | Creator | ImageURL | ReviewURL | Button Label`

### Managing Empty Fields (# Placeholder)
If you omit a custom image, review link, or button label, use the `#` character as a placeholder.

- `#` in the **Image Field**: Triggers the engine to ping external APIs (TMDB/iTunes) to automatically fetch high-res poster art.
- `#` in the **Review Field**: Prevents the review button from rendering entirely.
- `#` in the **Button Label Field** (or omitted): Defaults to `Read review`.

**Examples:**
```
- [Book] Project Hail Mary | Andy Weir | # | https://goodreads.com/... | Check on Goodreads
- [Movie] Dune | Denis Villeneuve | # | https://letterboxd.com/... | View on Letterboxd
- [Music] Cowboy Carter | Beyoncé | # | #
- [TV] Severance | Dan Erickson | # | #
```
