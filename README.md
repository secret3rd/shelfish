# Shelfish

Shelfish is a bear blog plugin that auto-fetches thumbnails for books, movies, TV shows, and music albums. 

Think of it like the book shelf vinyl record display case in your home.

---

## How it works

You type something like this into your page editor:

```markdown
- 🔢
- [Music] Random Access Memories | Daft Punk | https://www.youtube.com/watch?v=5NV6Rdv1a3I | Best song of 2013!
- [Music] This Music May Contain Hope | RAYE | /this-doodle-may-contain-hope/ | Inspired by RAYE
- [Music] The Mountain | Gorillaz | /the-mountain-review/ | More thoughts here
```

And watch it turn into something like this:

![Output](https://bear-images.sfo2.cdn.digitaloceanspaces.com/afewgoodpens/19am.webp)

Any list that starts with the `🔢` emoji triggers the script, and transforms a simple list into a responsive, visual bookshelf.

---

## Features

- **Auto Image Fetch**: Pulls high-quality artwork for books, movies, TV shows, and music without you touching a single JPG.
- **Smart Attribution**: Mandatory input is the Title and Creator. It might be obvious for books and music, but for movies you should enter the Director, and for TV shows the Creator or Showrunner.
- **Trusted Sources**: Books and music art are fetched from the iTunes library. Movies and TV shows pull from The Movie DB.

### Bells and Whistles
- **Custom Theming**: The CSS is extremely lightweight and intelligently adapts to your site's current foreground/background colors. You can optionally override the active card background globally by passing a `?bg=` parameter in the script src.
- **Accessibility**: Alt text for images is generated on the basis of text input.
- **Flexible Links**: You can link to reviews, the album's lead single, a download link, anything that adds a layer. You can also leave this empty.
  
---

## Implementation

I suggest embedding both the stylesheet and JS within the page where you want the shelves. My guess is this is not the most lightweight code and it's more of a novelty. You wouldn't want the rest of your lightweight blog's speed to be affected by it. 

### Deployment Code

Paste this at the top of your `/now/` page:

```html
<head>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/secret3rd/shelfish/shelfish.css">
<!-- You can optionally pass a custom background via the bg param -->
<script src="https://cdn.jsdelivr.net/gh/secret3rd/shelfish/shelfish.js?bg=color-mix(in srgb, var(--link-color) 10%, transparent)"></script>
</head>

Some body content

Followed by the markdown lists which will be translated on load
```

---

## The Syntax Guide

Every list must strictly adhere to this format. Type `#` in case you wish to leave a field empty. 

`- [Type] Title | Creator | Link | Label`

### Right vs. Wrong
- **✅ Correct**: `- [Movie] Dune | Denis Villeneuve | # | #`
- **✅ Correct**: `- [Movie] Oppenheimer | Christopher Nolan | /my-review/ | My 5 star review!`
- **❌ Wrong**: `- [Movie] Dune | Denis Villeneuve` (Missing fields will cause the line to be ignored).
- **❌ Wrong**: `- [Book] A Hobbit's Tale | JRR Tolkien | /fan-art-page/` (Missing the final `#` or label if using a link).

Essentially, the first two fields are mandatory. If you leave them empty or type `#` in their place, the full entry will be ignored. Similarly, if you enter the wrong number of fields, your entry will be ignored. 

Chances are you will do one minor error and the whole shelf will break like my attempts at IKEA DIY furniture. 
But the relatively simple format makes it easy to debug and fix.

---

## Disclaimers

- Typos in titles and creator names can render your search pointless.
- Shoutout to **Ben Dodson's** [iTunes library](https://github.com/bendodson/itunes-artwork-finder) project for making me realize this was possible.
- The script uses my personal **TMDB** API key, please refrain from pinging every other minute and getting me suspended. If there's significant interest, I might consider buying a business license.
- Far be it from me to thank a trillion-dollar company, but the **iTunes library** is also quite central to this project.
- It would also be nice to implement a **Steam** thumbnail fetcher. I am not a big gamer so I didn't bother about it.
- The first paint of the shelves is quite slow, and I would like to make some improvements there. But it works fine enough for now.
- While I do know how to code, I'm quite rusty and used the help of **Google Antigravity** generously. I would love for an indie dev to fork this and remix it without the use of AI. I do feel it's bloated.

---

If you have any feedback or thoughts, you can contact me by writing to me at **hello [at] murugappan.com**
