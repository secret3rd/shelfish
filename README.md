# Shelfish

Shelfish is a Bear Blog plugin that auto-fetches thumbnails for books, movies, TV shows, and music albums.

Think of it like the bookshelf or vinyl record display case in your home.

---

## How it works

You type something like this into your page editor:

```markdown
- 🔢
- [Music] Random Access Memories | Daft Punk | https://www.youtube.com/watch?v=5NV6Rdv1a3I | Best record of 2013
- [Book] The Remains of the Day | Kazuo Ishiguro | /my-review/ | My review
- [Movie] Dune Part Two | Denis Villeneuve | # | #
```

And watch it turn into a responsive visual shelf.

Any list that starts with the `🔢` emoji triggers the script.

---

## Features

- **Auto Image Fetch**: Pulls artwork for books, movies, TV shows, and music without you touching a single image file.
- **Smart Attribution**: Mandatory input is the Title and Creator. For movies enter the Director; for TV shows the Creator or Showrunner.
- **Trusted Sources**: Books and music art are fetched from the iTunes library. Movies and TV shows pull from The Movie DB.
- **Accessibility**: Alt text for images is generated from your text input.
- **Flexible Links**: Link to a review, the album's lead single, anything. Leave it empty with `#`.

---

## Implementation

Paste this at the top of your `/now/` page:

```html
<head>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/secret3rd/shelfish/shelfish.css">
<script src="https://cdn.jsdelivr.net/gh/secret3rd/shelfish/shelfish.js"></script>
</head>
```

---

## Syntax

Every list item follows this format. Use `#` to leave a field empty.

`- [Type] Title | Creator | Link | Label`

| Field | Required | Notes |
|---|---|---|
| `[Type]` | ✅ | `Book`, `Movie`, `TV`, or `Music` |
| `Title` | ✅ | — |
| `Creator` | ✅ | Author, Director, Showrunner, or Artist |
| `Link` | — | Use `#` to omit the button |
| `Label` | — | Button text. Defaults to `Read review` |

**Examples**

```markdown
- [Movie] Dune Part Two | Denis Villeneuve | /my-review/ | My 5 star review
- [Book] Klara and the Sun | Kazuo Ishiguro | # | #
- [Music] Random Access Memories | Daft Punk | https://open.spotify.com/... | Listen
```

If you enter the wrong number of fields, the entry is silently ignored.

---

## Customising

All elements use stable class names. You can override any of them in your theme CSS.

| Class | What it styles |
|---|---|
| `.shelfish-container` | The entire component wrapper |
| `.shelfish-grid` | The CSS grid |
| `.shelfish-card` | Individual media cards |
| `.shelfish-thumb` | Thumbnail image container |
| `.shelfish-meta` | Title + creator text area |
| `.shelfish-title` | Title text |
| `.shelfish-creator` | Creator text |
| `.shelfish-btn` | The review link button |

---

## Disclaimers

- Typos in titles and creator names can make the image search miss.
- The script uses my personal **TMDB** API key. Please don't hammer it.
- Shoutout to **Ben Dodson's** [iTunes Artwork Finder](https://github.com/bendodson/itunes-artwork-finder) for the inspiration.
- The first paint is slow due to API calls. It's a novelty, not a performance tool.

---

If you have feedback, write to me at **hello [at] murugappan.com**
