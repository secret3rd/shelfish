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
        container.style.setProperty('--shelfish-bg', window.getComputedStyle(document.body).color);
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
