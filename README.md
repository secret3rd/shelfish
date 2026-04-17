# Shelfish

Shelfish is a bear blog plugin that auto-fetches thumbnails for books, movies, TV shows, and music albums. 

Think of it like the book shelf / vinyl record display case / DVD rack in your home.

---

## How it works

You type something like this into your page editor:

```markdown
- 🔢
- [TV] Superstore | Justin Spitzer | /best-workplace-comedy-ever/ | Read review
- [Movie] Dr. Strangelove | Stanley Kubrick | # | #
- [TV] Ghosts (US) | Joe Port
```

And watch it turn into something like this:

![Shelfish demo featuring posters of Superstore, Dr. Strangelove, and Ghosts US](https://bear-images.sfo2.cdn.digitaloceanspaces.com/afewgoodpens/11pm.webp)

It's equally capable of extracting album art and book covers. You can see a live demo of it at [my /now/ page](https://murugappan.com/now).

Any markdown list that starts with the `🔢` emoji will trigger the script and transform itself into a visual bookshelf.

---

## Features

- **Auto Image Fetch**: Pulls high-quality artwork for books, movies, TV shows, and music without you touching a single JPG.
- **Smart Attribution**: Mandatory input is the Title and Creator. It might be obvious for books and music, but for movies the Director is the creator, and for TV shows, the original creator / showrunner is considered the creator.
- **Trusted Sources**: Books and music art are fetched from the iTunes library. Movies and TV shows come from The Movie DB.
- **Glass/Ghost Premium UI**: The UI natively inherits from your blog's colors.
- **Accessibility**: Alt text for images is generated on the basis of text input.
- **Flexible Links**: You can link to reviews, the album's lead single, a download link, anything that would make your /now/ page more interesting. Of course, you can also simply list down the items without any links.
  
---

## Implementation

I suggest embedding both the stylesheet and JS within the page where you want the shelves. Most likely your /now/ or /about/ page. 

This is lightweight but will still bring down your load speed by a few milliseconds. I wouldn't want the rest of my lightweight blog's speed to be affected by it, so I recommend not loading it directly on your stylesheet or footer directives.

### Deployment Code

For the fastest page load times (and best Google PageSpeed scores), paste the CSS in your `<head>` and the script tag at the bottom of your `<body>` (or in a footer injection if Bear Blog supports it).

```html
<head>
<style>
/* Paste full source from shelfish.css here if you want total independence */
@import url('https://cdn.jsdelivr.net/gh/secret3rd/shelfish/shelfish.css');
</style>
</head>

... Your page content ...

<!-- Place scripts right before closing body or in your footer injection -->
<script src="https://cdn.jsdelivr.net/gh/secret3rd/shelfish/shelfish.js"></script>
```

---

## The Syntax Guide

Every list must start with a `🔢` emoji and subsequent items must adhere to this format. The final two fields are optional. 

`- [Type] Title | Creator | Link | Label`

### Right vs. Wrong
- **✅ Correct**: `- [Movie] Dune | Denis Villeneuve`
- **✅ Correct**: `- [Movie] Oppenheimer | Christopher Nolan | /my-review/` (Providing a link but no label will automatically default the button text to "Read review").
- **✅ Correct**: `- [Movie] Oppenheimer | Christopher Nolan | /my-review/ | My 5 star review!`
- **❌ Wrong**: `- [Movie] Dune | Denis Villeneuve | # | # | #` (Too many fields. Will be dropped).

Essentially, the first two fields are mandatory. If you leave them empty or type more than 4 piped fields, the full entry will be ignored. 

Chances are you will do one minor error and the whole shelf will break like my attempts at IKEA DIY furniture. 
But the relatively simple format makes it easy to debug and fix.

---

## Disclaimers

- Typos in titles and creator names can render your search fruitless, so be careful with it.
- Shoutout to **Ben Dodson's** [iTunes library](https://github.com/bendodson/itunes-artwork-finder) project for making me realize this was even possible.
- The script uses my personal **TMDB** API key, please refrain from pinging frequently. If you are forking it, please get your own key from [TMDB](https://www.themoviedb.org/settings/api/request) - it's free. If there's significant interest, I could consider a business license.
- Far be it from me to thank a trillion-dollar company, but the **iTunes library** is central to this project.
- It would also be nice to implement a **Steam** thumbnail fetcher, too. But I'm not much of gamer so I didn't bother with it.
- I would like to make some improvements on the first paint of the shelves. But it works fine enough for my use case.
- While I do know how to code, I'm quite rusty and used **Google Antigravity** generously. I would love for an indie dev to fork this and remix it without the use of AI. Despite my best attempts, it's a bit bloated.

---

## Source Code

You are free to pick these apart and host them yourself for maximum performance. I am happy to redirect people using this plugin to a more elegant fork when it comes up.

- [shelfish.js](shelfish.js)
- [shelfish.css](shelfish.css)

---

If you have any feedback or thoughts, you can contact me through my [website](https://murugappan.com/get-in-touch) or write to me at **hello [at] murugappan.com**
