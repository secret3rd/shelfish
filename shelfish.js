/**
 * Auto-fetch book/album covers and movie/tv posters for your /now page on bear blog.
 */
class Shelfish {
    constructor(config = {}) {
        this.key = config.tmdbKey || '8942f1dc81e199d343c97639c0bbca67';
        this.icons = {
            'Book': `📚`,
            'Movie': `🎬`,
            'TV': `📺`,
            'Music': `🎵`
        };
        this.scan();
        new MutationObserver(() => this.scan()).observe(document.body, { childList: true, subtree: true });
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

        let html = `<div class="shelfish-grid">${items.map((i, index) => this.render(i, index)).join('')}</div>`;

        const container = document.createElement('div');
        container.className = 'shelfish-container';
        container.innerHTML = html;
        ul.replaceWith(container);

        container.querySelectorAll('.shelfish-card').forEach(c => {
            c._shelfishItem = items.find(i => i.id === c.id);
            this.loadArt(c);
        });
    }

    parse(rawLine) {
        const parts = rawLine.split('|').map(s => s.trim());
        if (parts.length < 2 || parts.length > 4) return null;

        const [tpTit, cr] = parts;
        const tag = tpTit.match(/\[(.*?)\]/i);
        if (!tag || !cr || cr === '#') return null;

        const lk = parts[2] && parts[2] !== '#' ? parts[2] : null;
        const label = (lk && parts[3] && parts[3] !== '#') ? parts[3] : 'Read review';

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

    render(i, index) {
        /* shelfish-has-review flattens the shared border between card and button when a link exists. */
        const hasRev = i.link ? 'shelfish-has-review' : '';
        const lazyAttr = index >= 4 ? ' loading="lazy"' : '';
        const linkHTML = i.link
            ? `<div class="shelfish-btn-wrapper"><a href="${i.link}" class="superbutton-link superbutton-rounded shelfish-btn">${i.label} <span class="shelfish-arrow">→</span></a></div>`
            : `<div class="shelfish-btn-wrapper"><div class="superbutton-link superbutton-rounded shelfish-btn shelfish-hidden">${i.label} <span class="shelfish-arrow">→</span></div></div>`;
        return `<div class="shelfish-item-wrapper ${hasRev}"><div class="shelfish-card shelfish-is-${i.type.toLowerCase()}" id="${i.id}"><div class="shelfish-thumb"><img${lazyAttr} onload="this.classList.add('shelfish-loaded')" alt="${i.title} by ${i.author}" title="${i.title}"></div><div class="shelfish-info"><div class="shelfish-title">${i.title}</div><div class="shelfish-author">${i.author}</div></div></div>${linkHTML}</div>`;
    }

    async loadArt(card) {
        const i = card._shelfishItem;
        const img = card.querySelector('img');
        const injectPlaceholder = () => card.querySelector('.shelfish-thumb').innerHTML = `<div class="shelfish-placeholder"><span class="shelfish-fallback-icon">${this.icons[i.type]}</span></div>`;

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
