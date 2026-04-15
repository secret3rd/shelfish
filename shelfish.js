/* auto-fetch artwork for books, movies, tv, and music on bear blog /now pages */
class Shelfish {
    constructor(config = {}) {
        this.key = config.tmdbKey || '8942f1dc81e199d343c97639c0bbca67';

        this.icons = {
            Book:  `<svg viewBox="0 0 24 24"><path d="M19 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h1V2h-1V4z"/></svg>`,
            Movie: `<svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>`,
            TV:    `<svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>`,
            Music: `<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-4z"/></svg>`,
        };

        this.observer = new IntersectionObserver(entries => entries.forEach(e => {
            if (e.isIntersecting) { this.loadArt(e.target); this.observer.unobserve(e.target); }
        }), { rootMargin: '300px' });

        // re-scan whenever bear blog dynamically injects content
        new MutationObserver(() => this.scan()).observe(document.body, { childList: true, subtree: true });
        this.scan();
    }

    scan() {
        document.querySelectorAll('ul:not([data-shelfish])').forEach(ul => {
            const first = ul.querySelector('li');
            if (first?.textContent.includes('🔢')) this.transform(ul);
        });
    }

    transform(ul) {
        ul.dataset.shelfish = '1';
        const items = [...ul.querySelectorAll('li')]
            .map(li => this.parse(li.innerText || li.textContent))
            .filter(Boolean);
        if (!items.length) return;

        // group by media type in display order
        const grids = [['Book'], ['Movie', 'TV'], ['Music']]
            .map(types => items.filter(i => types.includes(i.type)))
            .filter(g => g.length)
            .map(g => `<div class="shelfish-grid">${g.map(i => this.render(i)).join('')}</div>`)
            .join('');

        const container = document.createElement('div');
        container.className = 'shelfish-container';
        container.innerHTML = grids;
        ul.replaceWith(container);

        container.querySelectorAll('.shelfish-card').forEach(card => {
            card._item = items.find(i => i.id === card.id);
            this.observer.observe(card);
        });
    }

    parse(raw) {
        const parts = raw.split('|').map(s => s.trim());
        const [tpTit, author] = parts;
        const link  = parts[2] || '#';
        const label = (parts[3] && parts[3] !== '#') ? parts[3] : 'Read review';

        const tag = tpTit?.match(/\[(.*?)\]/i);
        if (!tag || !author || author === '#') return null;
        if (!link.startsWith('#') && !link.startsWith('http') && !link.startsWith('/')) return null;

        const t = tag[1].trim().toLowerCase();
        const type = t === 'tv' ? 'TV' : t.charAt(0).toUpperCase() + t.slice(1);

        return {
            id:    `sf-${Math.random().toString(36).slice(2, 9)}`,
            type,
            title: tpTit.replace(tag[0], '').trim(),
            author,
            link:  link !== '#' ? link : null,
            label,
        };
    }

    render(i) {
        const cls = i.link ? 'shelfish-has-review' : '';
        const btn = i.link
            ? `<div class="shelfish-btn-wrapper"><a href="${i.link}" class="superbutton-link shelfish-btn">${i.label} <span class="shelfish-arrow">→</span></a></div>`
            : `<div class="shelfish-btn-wrapper"><div class="shelfish-btn shelfish-hidden">${i.label} <span class="shelfish-arrow">→</span></div></div>`;
        return `<div class="shelfish-item-wrapper ${cls}"><div class="shelfish-card shelfish-is-${i.type.toLowerCase()}" id="${i.id}"><div class="shelfish-thumb"><img onload="this.classList.add('shelfish-loaded')" alt="${i.title} by ${i.author}" title="${i.title}"></div><div class="shelfish-info"><div class="shelfish-title">${i.title}</div><div class="shelfish-author">${i.author}</div></div></div>${btn}</div>`;
    }

    async loadArt(card) {
        const i = card._item;
        const img = card.querySelector('img');
        const placeholder = () => card.querySelector('.shelfish-thumb').innerHTML =
            `<div class="shelfish-placeholder">${this.icons[i.type]}</div>`;

        try {
            const url = await this.fetchAPI(i);
            if (url) { img.src = url; img.onerror = placeholder; }
            else placeholder();
        } catch (_) { placeholder(); }
    }

    async fetchAPI({ type, title, author }) {
        // tmdb for video, itunes for books + music
        const isVideo = ['Movie', 'TV'].includes(type);
        const q = encodeURIComponent(title + (isVideo ? '' : ' ' + author));
        const url = isVideo
            ? `https://api.themoviedb.org/3/search/${type === 'Movie' ? 'movie' : 'tv'}?api_key=${this.key}&query=${q}`
            : `https://itunes.apple.com/search?term=${q}&media=${type === 'Music' ? 'music' : 'ebook'}&limit=1`;
        try {
            const { results } = await (await fetch(url)).json();
            const hit = results?.[0];
            if (hit?.poster_path)  return `https://image.tmdb.org/t/p/w500${hit.poster_path}`;
            if (hit?.artworkUrl100) return hit.artworkUrl100.replace('100x100bb.jpg', '1000x1500-999.jpg');
        } catch (_) {}
        return null;
    }
}

// wait for dom before scanning to avoid markdown injection edge cases
const _sf = () => { window.ShelfishInstance = new Shelfish(); };
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', _sf) : _sf();
