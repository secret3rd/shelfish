# Shelfish

Shelfish is a bear blog plugin that auto-fetches thumbnails for books, movies, TV shows, and music albums. Think of it as a book shelf or a display case for your vinyl records.

It's not the most valuable thing at your home, not by any stretch, but it's one of the first places where people's eyes gravitate. 

This plugin is easy to embed, and I suggest you directly embed both the CSS file and JS file under a `<head>` directive in your `/now/ page` or whichever page you intend to show this in. 

---

## How it works

You type this into your editor:

```markdown
#### Reading
- 🔢
- [Book] How to Sharpen Pencils | David Rees | # | #
- [Book] Me Talk Pretty One Day | David Sedaris | # | https://annas-archive.gd/md5/fee89ccf14db2280a64fac5553dadadc | Get EPUB 
```

And the engine transforms it into a responsive, visual gallery automatically.

---

## Features

- **Auto Image Fetch**: Pulls high-quality artwork for books, movies, TV shows, and music without you touching a single JPG.
- **Smart Attribution**: Mandatory input is the Title and Creator. It might be obvious for books and music, but for movies you should enter the Director, and for TV shows the Creator or Showrunner.
- **Trusted Sources**: Books and music art are fetched from the iTunes library. Movies and TV shows pull from The Movie DB.

### Bells and Whistles
- **Custom Thumbnails**: You can upload your own thumbnail or cover URL in case it's not a popular piece of media or it's simply unavailable in the databases.
- **Accessibility**: Alt text for images is generated on the basis of your input.
- **Flexible Links**: You can link to reviews, a single from the album, a download link, whatever you think adds to it. You can also leave this empty.

---

## Implementation

I suggest embedding both the stylesheet and JS within the page where you want the shelves. My guess is this is not the best written lightweight code and it's really more of a novelty. You don't want the rest of your lightweight blog's speed to be affected by it. 

### Deployment Code

Paste this at the top of your page:

```html
<style>
/* Paste full source from shelfish.css here if you want total independence */
@import url('https://cdn.jsdelivr.net/gh/secret3rd/shelfish/shelfish.css');
</style>

<script src="https://cdn.jsdelivr.net/gh/secret3rd/shelfish/shelfish.js"></script>
```

---

## The Syntax Guide

Every list must adhere to the 5-part pipe structure.

`- [Type] Title | Creator | Image | Link | Label`

### Right vs. Wrong
- **✅ Correct**: `- [Movie] Dune | Denis Villeneuve | # | #`
- **❌ Wrong**: `- [Movie] Dune | Denis Villeneuve | #` (Missing pipes will cause the line to be ignored).
- **❌ Wrong**: `- [Book] Title | Creator | image.jpg | target.html` (If you want a custom label, you MUST provide all 5 slots).

If the input is wrong, the engine will silently skip that entry to keep your grid looking clean rather than rendering a broken card.

---

## Disclaimers

- Big shoutout to **Ben Dodson's** iTunes library project for making me realize this was possible.
- The **TMDB API** this script uses is a personal one. It should be okay for a few of you to use; if there's significant interest, I might have to take a business license and request donations, or close the project.
- Far be it from me to thank a trillion-dollar company, but the **iTunes library** is central to this project.
- It would also be nice to have video games be logged, maybe there's a **Steam** thumbnail fetcher. I am not a very big gamer except for Apple Arcade on my iPad, so I didn't bother.
- While I know how to code, I used the help of **Google Antigravity** quite generously. I would love for an indie dev to fork this and rewrite it without the use of AI. I do feel it's quite bloated.

---

## Source Code

You are free to pick these apart and host them yourself for maximum performance.

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

        let html = '';
        const groups = [{ t: ['Book'] }, { t: ['Movie', 'TV'] }, { t: ['Music'] }];
        groups.forEach(g => {
            const matches = items.filter(i => g.t.includes(i.type));
            if (matches.length) html += `<div class="shelfish-grid">${matches.map(i => this.render(i)).join('')}</div>`;
        });

        const container = document.createElement('div');
        container.className = 'shelfish-container';
        container.innerHTML = html;
        ul.replaceWith(container);

        container.querySelectorAll('.shelfish-card').forEach(c => {
            c._shelfishItem = items.find(i => i.id === c.id);
            this.shelfish_lazy.observe(c);
        });
    }

    validURL(val) {
        /* Only '#', 'http(s)://...', or '/relative/' paths are accepted. Anything else drops the entry. */
        if (val === '#') return true;
        if (val.startsWith('http')) return true;
        if (val.startsWith('/') && val.endsWith('/')) return true;
        return false;
    }

    parse(rawLine) {
        const parts = rawLine.split('|').map(s => s.trim());
        if (parts.length < 2) return null;

        const [tpTit, cr] = parts;
        const im = parts[2] || '#';
        const lk = parts[3] || '#';
        const label = (parts[4] && parts[4] !== '#') ? parts[4] : 'Read review';

        const tag = tpTit.match(/\[(.*?)\]/i);
        if (!tag || !cr || cr === '#') return null;
        if (!this.validURL(im) || !this.validURL(lk)) return null;

        const bType = tag[1].trim().toLowerCase();
        let typeStr = bType === 'tv' ? 'TV' : bType.charAt(0).toUpperCase() + bType.slice(1);

        return {
            id: `shelfish-${Math.random().toString(36).substr(2,9)}`,
            type: typeStr,
            title: tpTit.replace(tag[0], '').trim(),
            author: cr,
            img: im !== '#' ? im : null,
            link: lk !== '#' ? lk : null,
            label
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
            if (hit && hit.artworkUrl100) return hit.artworkUrl100.replace('100x100bb.jpg', '1000x1500-999.jpg');
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
/* Styles your media list. Scoped to .shelfish-* to avoid conflicts with the host theme. */
:root {
    --shelfish-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --shelfish-accent: var(--link-color, #557968);
    --shelfish-card-bg: var(--shelfish-accent);
    --shelfish-border: rgba(255, 255, 255, 0.1);
}
.shelfish-container { background: transparent !important; margin: 2rem 0 !important; clear: both !important; }
.shelfish-grid { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)) !important; gap: 3rem 1.5rem !important; align-items: stretch !important; margin-bottom: 2rem !important; }

/* Card layout — flex column so the review button always sits flush at the bottom. */
.shelfish-item-wrapper { display: flex !important; flex-direction: column !important; gap: 0.2rem !important; height: 100% !important; }
.shelfish-card { background: var(--shelfish-card-bg) !important; border-radius: 10px !important; padding: 0.8rem !important; border: 1px solid var(--shelfish-border) !important; box-sizing: border-box !important; display: flex !important; flex-direction: column !important; gap: 0.6rem !important; flex: 1 !important; color: #fff !important; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important; }
.shelfish-thumb { width: 100% !important; aspect-ratio: 2/3 !important; border-radius: 6px !important; position: relative !important; overflow: hidden !important; flex-shrink: 0 !important; }
.shelfish-is-music .shelfish-thumb { aspect-ratio: 1/1 !important; }
.shelfish-thumb img { width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important; opacity: 0; transition: opacity 0.8s ease-in-out !important; z-index: 2 !important; }
.shelfish-thumb img.shelfish-loaded { opacity: 1 !important; }
.shelfish-info { display: flex !important; flex-direction: column !important; gap: 0.2rem !important; }
.shelfish-title { font-size: 0.95rem !important; font-weight: 700 !important; line-height: 1.3 !important; letter-spacing: -0.01em !important; margin: 0 !important; font-family: var(--shelfish-font) !important; }
.shelfish-author { font-size: 0.8rem !important; opacity: 0.8 !important; line-height: 1.4 !important; font-family: var(--shelfish-font) !important; }

/* Review button — ghost variant holds row height when no link is present. */
.shelfish-btn-wrapper { display: flex !important; justify-content: center !important; width: 100% !important; align-self: center !important; margin: 0 !important; }
.shelfish-btn { width: 100% !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 0.4rem !important; padding: 0.6em 1em !important; box-sizing: border-box !important; border: 1.5px dotted var(--shelfish-accent) !important; background-color: transparent !important; color: var(--shelfish-accent) !important; border-radius: 6px !important; text-decoration: none !important; font-size: 0.85rem !important; font-weight: 600 !important; transition: all 0.2s ease !important; }
.shelfish-btn:hover { background-color: var(--shelfish-accent) !important; color: var(--background-color, #fff) !important; text-decoration: none !important; }
.shelfish-btn.shelfish-hidden { visibility: hidden !important; pointer-events: none !important; opacity: 0 !important; background: transparent !important; border-color: transparent !important; color: transparent !important; }
.shelfish-btn .shelfish-arrow { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important; display: inline-block !important; }
.shelfish-btn:hover .shelfish-arrow { transform: translateX(4px) !important; }
.shelfish-has-review .shelfish-card { border-bottom-left-radius: 0 !important; border-bottom-right-radius: 0 !important; }
.shelfish-has-review .shelfish-btn { border-top-left-radius: 0 !important; border-top-right-radius: 0 !important; }

/* Shown when no poster art is found via API. */
.shelfish-placeholder { position: absolute !important; inset: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; background: linear-gradient(135deg, #d3d3d3 0%, #a9a9a9 100%) !important; z-index: 1 !important; }
.shelfish-placeholder svg { width: 40% !important; height: 40% !important; fill: rgba(0,0,0,0.15) !important; }

@media (max-width: 480px) { .shelfish-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important; gap: 2.5rem 1.25rem !important; } }
```
</details>

---

Contact me by writing to me at **hello [at] murugappan.com**
