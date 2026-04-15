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
- [Movie] Dune | Denis Villeneuve
```

And watch it turn into something like this:

![Output](https://bear-images.sfo2.cdn.digitaloceanspaces.com/afewgoodpens/19am.webp)

Any list that starts with the `🔢` emoji triggers the script, and transforms a simple list into a responsive, visual bookshelf.

---

## Features

- **Auto Image Fetch**: Pulls high-quality artwork for books, movies, TV shows, and music without you touching a single JPG.
- **Smart Attribution**: Mandatory input is the Title and Creator. It might be obvious for books and music, but for movies you should enter the Director, and for TV shows the Creator or Showrunner.
- **Trusted Sources**: Books and music art are fetched from the iTunes library. Movies and TV shows pull from The Movie DB.
- **Glass/Ghost Premium UI**: The UI natively inherits from your blog's colors directly without relying on hardcoded stylings, perfectly creating high-contrast transparent layers universally!
- **Accessibility**: Alt text for images is generated on the basis of text input.
- **Flexible Links**: You can link to reviews, the album's lead single, a download link, anything that adds a layer. You can also leave this empty.
  
---

## Implementation

I suggest embedding both the stylesheet and JS within the page where you want the shelves. My guess is this is not the most lightweight code and it's more of a novelty. You wouldn't want the rest of your lightweight blog's speed to be affected by it. 

### Deployment Code

Paste this at the top of your `/now/` page:

```html
<head>
<style>
/* Paste full source from shelfish.css here if you want total independence */
@import url('https://cdn.jsdelivr.net/gh/secret3rd/shelfish@muru-v2-rehash/shelfish.css');
</style>

<script src="https://cdn.jsdelivr.net/gh/secret3rd/shelfish@muru-v2-rehash/shelfish.js"></script>
</head>

Some body content

Followed by the markdown lists which will be translated on load
```

---

## The Syntax Guide

Every list must strictly adhere to this format. You can provide strictly 2, 3, or 4 piped values. The final two fields are completely optional. Type `#` if you wish to skip the link but want to specify a custom label.

`- [Type] Title | Creator | Link | Label`

### Right vs. Wrong
- **✅ Correct**: `- [Movie] Dune | Denis Villeneuve`
- **✅ Correct**: `- [Movie] Oppenheimer | Christopher Nolan | /my-review/ | My 5 star review!`
- **❌ Wrong**: `- [Movie] Dune | Denis Villeneuve | # | # | #` (Too many fields. Will be dropped).
- **✅ Correct**: `- [Book] A Hobbit's Tale | JRR Tolkien | # | Read my thoughts` (Skipping the link to just use a custom label).

Essentially, the first two fields are mandatory. If you leave them empty or type more than 4 piped fields, the full entry will be ignored. 

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

## Source Code

You are free to pick these apart and host them yourself for maximum performance. I am happy to redirect people using this plugin to a more elegant fork when it comes up.

<details>
<summary>View shelfish.js Source</summary>

```javascript
/**
 * Auto-fetch book/album covers and movie/tv posters for your /now page on bear blog.
 */
class Shelfish {
    constructor(config = {}) {
        this.key = config.tmdbKey || '8942f1dc81e199d343c97639c0bbca67';
        this.icons = {
            'Book': `<svg viewBox="0 0 24 24"><path d="M19 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h1V2h-1V4z"/></svg>`,
            'Movie': `<svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>`,
            'TV': `<svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>`,
            'Music': `<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-4z"/></svg>`
        };
        this.setupLazyLoader();
        this.scan();
        new MutationObserver(() => this.scan()).observe(document.body, { childList: true, subtree: true });
    }

    setupLazyLoader() {
        this.shelfish_lazy = new IntersectionObserver(es => es.forEach(e => {
            if (e.isIntersecting) { this.loadArt(e.target); this.shelfish_lazy.unobserve(e.target); }
        }), { rootMargin: '300px' });
    }

    scan() {
        /* Scans for the trigger emoji anywhere in the first item's content to ensure detection regardless of formatting. */
        document.querySelectorAll('ul:not([data-shelfish-loaded])').forEach(ul => {
            const li = ul.querySelector('li');
            if (li && (li.innerHTML.includes('🔢') || li.innerText.includes('🔢'))) {
                this.transform(ul, Array.from(ul.querySelectorAll('li')));
            }
        });
    }

    transform(ul, nodeArray) {
        ul.dataset.shelfishLoaded = "true";
        const items = nodeArray.map(node => this.parse(node.innerText || node.textContent)).filter(Boolean);
        if (!items.length) return;

        let html = `<div class="shelfish-grid">${items.map(i => this.render(i)).join('')}</div>`;

        const container = document.createElement('div');
        container.className = 'shelfish-container';
        container.innerHTML = html;
        ul.replaceWith(container);

        container.querySelectorAll('.shelfish-card').forEach(c => {
            c._shelfishItem = items.find(i => i.id === c.id);
            this.shelfish_lazy.observe(c);
        });
    }

    parse(rawLine) {
        const parts = rawLine.split('|').map(s => s.trim());
        if (parts.length < 2 || parts.length > 4) return null;

        const [tpTit, cr] = parts;
        const tag = tpTit.match(/\[(.*?)\]/i);
        if (!tag || !cr || cr === '#') return null;

        const lk = parts[2] && parts[2] !== '#' ? parts[2] : null;
        const label = parts[3] && parts[3] !== '#' ? parts[3] : 'Read review';

        const bType = tag[1].trim().toLowerCase();
        let typeStr = bType === 'tv' ? 'TV' : bType.charAt(0).toUpperCase() + bType.slice(1);

        return {
            id: `shelfish-${Math.random().toString(36).substr(2,9)}`,
            type: typeStr,
            title: tpTit.replace(tag[0], '').trim(),
            author: cr,
            img: null,
            link: lk,
            label: label
        };
    }

    render(i) {
        /* shelfish-has-review flattens the shared border between card and button when a link exists. */
        const hasRev = i.link ? 'shelfish-has-review' : '';
        const linkHTML = i.link
            ? `<div class="shelfish-btn-wrapper"><a href="${i.link}" class="superbutton-link superbutton-rounded shelfish-btn">${i.label} <span class="shelfish-arrow">→</span></a></div>`
            : `<div class="shelfish-btn-wrapper"><div class="superbutton-link superbutton-rounded shelfish-btn shelfish-hidden">${i.label} <span class="shelfish-arrow">→</span></div></div>`;
        return `<div class="shelfish-item-wrapper ${hasRev}"><div class="shelfish-card shelfish-is-${i.type.toLowerCase()}" id="${i.id}"><div class="shelfish-thumb"><img onload="this.classList.add('shelfish-loaded')" alt="${i.title} by ${i.author}" title="${i.title}"></div><div class="shelfish-info"><div class="shelfish-title">${i.title}</div><div class="shelfish-author">${i.author}</div></div></div>${linkHTML}</div>`;
    }

    async loadArt(card) {
        const i = card._shelfishItem;
        const img = card.querySelector('img');
        const injectPlaceholder = () => card.querySelector('.shelfish-thumb').innerHTML = `<div class="shelfish-placeholder">${this.icons[i.type]}</div>`;

        try {
            const url = i.img || await this.fetchAPI(i);
            if (url) {
                img.src = url;
                img.onerror = injectPlaceholder;
            } else { injectPlaceholder(); }
        } catch (e) { injectPlaceholder(); }
    }

    async fetchAPI({ type, title, author }) {
        /* TMDB for films and TV, iTunes Search API for books and music. */
        const isVid = ['Movie', 'TV'].includes(type);
        const q = encodeURIComponent(title + (isVid ? '' : ' ' + author));
        const url = isVid ? `https://api.themoviedb.org/3/search/${type === 'Movie' ? 'movie' : 'tv'}?api_key=${this.key}&query=${q}`
                          : `https://itunes.apple.com/search?term=${q}&media=${type === 'Music' ? 'music' : 'ebook'}&limit=1`;
        try {
            const res = await (await fetch(url)).json();
            const hit = res.results && res.results.length > 0 ? res.results[0] : null;
            if (hit && hit.poster_path) return `https://image.tmdb.org/t/p/w500${hit.poster_path}`;
            if (hit && hit.artworkUrl100) return hit.artworkUrl100.replace('100x100bb.jpg', '1000x1000bb.jpg');
        } catch (e) {}
        return null;
    }
}
/* SAFETY TRIGGER: Waits for DOM to fully load before looking for documents to avoid Head/Markdown injection crashes */
const initShelfish = () => { window.ShelfishInstance = new Shelfish(); };
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initShelfish); } else { initShelfish(); }
```
</details>

<details>
<summary>View shelfish.css Source</summary>

```css
.shelfish-container { 
    background: transparent !important; margin: 2rem 0 !important; clear: both !important; color: inherit !important;
}
.shelfish-grid { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)) !important; gap: 3rem 1.5rem !important; align-items: stretch !important; margin-bottom: 2rem !important; color: inherit !important; }

/* Card layout — flex column so the review button always sits flush at the bottom. */
.shelfish-item-wrapper { display: flex !important; flex-direction: column !important; gap: 0 !important; height: 100% !important; color: inherit !important; }
.shelfish-card { background: color-mix(in srgb, currentColor, transparent 88%) !important; border-radius: 10px !important; padding: 0.8rem !important; box-sizing: border-box !important; display: flex !important; flex-direction: column !important; gap: 0.6rem !important; flex: 1 !important; color: inherit !important; border: 1px solid color-mix(in srgb, currentColor, transparent 80%) !important; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03) !important; }
.shelfish-thumb { width: 100% !important; aspect-ratio: 2/3 !important; border-radius: 6px !important; position: relative !important; overflow: hidden !important; flex-shrink: 0 !important; border: 1px solid color-mix(in srgb, currentColor, transparent 80%) !important; background: color-mix(in srgb, currentColor, transparent 88%) !important; display: flex !important; align-items: center !important; justify-content: center !important; }
.shelfish-is-music .shelfish-thumb { aspect-ratio: 1/1 !important; }
.shelfish-thumb img { width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important; opacity: 0; transition: opacity 0.8s ease-in-out !important; z-index: 2 !important; }
.shelfish-thumb img.shelfish-loaded { opacity: 1 !important; }
.shelfish-info { display: flex !important; flex-direction: column !important; gap: 0.2rem !important; color: inherit !important; }
.shelfish-title { font-size: 0.95rem !important; font-weight: 700 !important; line-height: 1.3 !important; letter-spacing: -0.01em !important; margin: 0 !important; font-family: inherit !important; color: inherit !important; }
.shelfish-author { font-size: 0.8rem !important; opacity: 0.8 !important; line-height: 1.4 !important; font-family: inherit !important; color: inherit !important; }

/* Review button — ghost variant holds row height when no link is present. */
.shelfish-btn-wrapper { display: flex !important; justify-content: center !important; width: 100% !important; align-self: center !important; margin: 0 !important; color: inherit !important; }
.shelfish-btn { width: 100% !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 0.4rem !important; padding: 0.6em 1em !important; box-sizing: border-box !important; border: 1px solid color-mix(in srgb, currentColor, transparent 80%) !important; background-color: transparent !important; color: inherit !important; border-radius: 6px !important; text-decoration: none !important; font-size: 0.85rem !important; font-weight: 600 !important; transition: all 0.2s ease !important; }
.shelfish-btn:hover { background-color: color-mix(in srgb, currentColor, transparent 90%) !important; border-color: color-mix(in srgb, currentColor, transparent 60%) !important; text-decoration: none !important; }
.shelfish-btn.shelfish-hidden { visibility: hidden !important; pointer-events: none !important; opacity: 0 !important; background: transparent !important; color: transparent !important; border: none !important; }
.shelfish-btn .shelfish-arrow { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important; display: inline-block !important; }
.shelfish-btn:hover .shelfish-arrow { transform: translateX(4px) !important; }
.shelfish-has-review .shelfish-card { border-bottom-left-radius: 0 !important; border-bottom-right-radius: 0 !important; border-bottom: none !important; }
.shelfish-has-review .shelfish-btn { border-top-left-radius: 0 !important; border-top-right-radius: 0 !important; }

/* Shown when no poster art is found via API. */
.shelfish-placeholder { position: absolute !important; inset: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; background: color-mix(in srgb, currentColor, transparent 88%) !important; z-index: 1 !important; }
.shelfish-placeholder svg { width: 40% !important; height: 40% !important; fill: currentColor !important; opacity: 0.15 !important; }

@media (max-width: 480px) { .shelfish-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important; gap: 2.5rem 1.25rem !important; } }
```
</details>

---

If you have any feedback or thoughts, you can contact me by writing to me at **hello [at] murugappan.com**
