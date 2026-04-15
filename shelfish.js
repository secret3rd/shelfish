/* shelfish — auto-fetch artwork for your /now page on bear blog */
class Shelfish {
    constructor() {
        this.tmdbKey = '8942f1dc81e199d343c97639c0bbca67';

        this.icons = {
            Book:  `<svg viewBox="0 0 24 24"><path d="M19 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h1V2H6v2z"/></svg>`,
            Movie: `<svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>`,
            TV:    `<svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>`,
            Music: `<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-4z"/></svg>`,
        };

        /* lazy-load artwork only when cards scroll into view */
        this.observer = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    this.loadArt(e.target);
                    this.observer.unobserve(e.target);
                }
            });
        }, { rootMargin: '300px' });

        /* re-scan if bear blog injects content after initial load */
        new MutationObserver(() => this.scan()).observe(document.body, {
            childList: true,
            subtree: true
        });

        this.scan();
    }

    /* find all unprocessed lists that start with the 🔢 trigger */
    scan() {
        document.querySelectorAll('ul:not([data-shelfish])').forEach(ul => {
            const first = ul.querySelector('li');
            if (first && (first.innerText || first.textContent).includes('🔢')) {
                this.transform(ul);
            }
        });
    }

    /*
     * Input format (one list item per entry):
     *   [Type] Title | Creator | Link | Label
     *
     *   Type    : Book, Movie, TV, Music
     *   Creator : author, director, showrunner, or artist
     *   Link    : review URL, or # to omit the button
     *   Label   : button text, or # for the default "Read review"
     */
    parse(raw) {
        const parts = raw.split('|').map(s => s.trim());
        if (parts.length !== 4) return null;

        const [typetitle, creator, link, labelRaw] = parts;
        if (!creator || creator === '#') return null;

        const typeMatch = typetitle.match(/\[(.*?)\]/i);
        if (!typeMatch) return null;

        const typeKey = typeMatch[1].trim().toLowerCase();
        const typeMap = { book: 'Book', movie: 'Movie', tv: 'TV', music: 'Music' };
        const type = typeMap[typeKey];
        if (!type) return null;

        const title = typetitle.replace(typeMatch[0], '').trim();
        if (!title) return null;

        const validLink = (link === '#' || link.startsWith('http') || (link.startsWith('/') && link.endsWith('/')));
        if (!validLink) return null;

        return {
            id: `sf-${Math.random().toString(36).slice(2, 9)}`,
            type,
            title,
            creator,
            link: link !== '#' ? link : null,
            label: (labelRaw && labelRaw !== '#') ? labelRaw : 'Read review',
        };
    }

    transform(ul) {
        ul.dataset.shelfish = '1';

        const items = Array.from(ul.querySelectorAll('li'))
            .map(li => this.parse(li.innerText || li.textContent))
            .filter(Boolean);

        if (!items.length) return;

        /* group: books → films+tv → music */
        const groups = [['Book'], ['Movie', 'TV'], ['Music']];
        const grids = groups
            .map(types => items.filter(i => types.includes(i.type)))
            .filter(g => g.length)
            .map(g => `<div class="shelfish-grid">${g.map(i => this.render(i)).join('')}</div>`)
            .join('');

        const container = document.createElement('div');
        container.className = 'shelfish-container';
        container.innerHTML = grids;
        ul.replaceWith(container);

        container.querySelectorAll('.shelfish-card').forEach(card => {
            card._sfItem = items.find(i => i.id === card.dataset.sfId);
            this.observer.observe(card);
        });
    }

    render(i) {
        const hasLink = i.link ? 'shelfish-has-link' : '';
        const btn = i.link
            ? `<a href="${i.link}" class="shelfish-btn"><span class="shelfish-btn-text">${i.label} <span class="shelfish-arrow" aria-hidden="true">→</span></span></a>`
            : `<div class="shelfish-btn shelfish-btn-hidden" aria-hidden="true"><span class="shelfish-btn-text">${i.label} <span class="shelfish-arrow">→</span></span></div>`;

        return `
            <div class="shelfish-item ${hasLink}">
                <div class="shelfish-card shelfish-is-${i.type.toLowerCase()}" data-sf-id="${i.id}">
                    <div class="shelfish-thumb">
                        <img onload="this.classList.add('shelfish-loaded')"
                             alt="${i.title} — ${i.creator}"
                             title="${i.title}">
                    </div>
                    <div class="shelfish-meta">
                        <div class="shelfish-title">${i.title}</div>
                        <div class="shelfish-creator">${i.creator}</div>
                    </div>
                </div>
                <div class="shelfish-btn-row">${btn}</div>
            </div>`;
    }

    async loadArt(card) {
        const item = card._sfItem;
        if (!item) return;

        const img = card.querySelector('img');
        const showPlaceholder = () => {
            card.querySelector('.shelfish-thumb').innerHTML =
                `<div class="shelfish-placeholder">${this.icons[item.type]}</div>`;
        };

        try {
            const url = await this.fetchArtwork(item);
            if (url) {
                img.src = url;
                img.onerror = showPlaceholder;
            } else {
                showPlaceholder();
            }
        } catch {
            showPlaceholder();
        }
    }

    async fetchArtwork({ type, title, creator }) {
        const isVideo = type === 'Movie' || type === 'TV';
        const q = encodeURIComponent(isVideo ? title : `${title} ${creator}`);

        const url = isVideo
            ? `https://api.themoviedb.org/3/search/${type === 'Movie' ? 'movie' : 'tv'}?api_key=${this.tmdbKey}&query=${q}`
            : `https://itunes.apple.com/search?term=${q}&media=${type === 'Music' ? 'music' : 'ebook'}&limit=1`;

        const res = await fetch(url);
        const data = await res.json();
        const hit = data.results?.[0];
        if (!hit) return null;

        if (hit.poster_path) return `https://image.tmdb.org/t/p/w500${hit.poster_path}`;
        if (hit.artworkUrl100) return hit.artworkUrl100.replace('100x100bb', '600x600bb');
        return null;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new Shelfish());
} else {
    new Shelfish();
}
