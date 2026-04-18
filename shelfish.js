/**
 * shelfish v4-scratch: lean, grid-based media shelves.
 * robust trigger & circular priority fetching.
 */
class Shelfish {
    constructor() {
        this.key = '8942f1dc81e199d343c97639c0bbca67';
        this.icons = { 'Book': '📚', 'Movie': '🎬', 'TV': '📺', 'Music': '🎵' };
        this.items = [];
        this.processedIds = new Set();
        this.isFetching = false;
        
        this.init();
    }

    init() {
        this.scan();
        new MutationObserver(() => this.scan()).observe(document.body, { childList: true, subtree: true });
    }

    scan() {
        document.querySelectorAll('ul:not([data-shelfish-loaded])').forEach(ul => {
            // check for any LI containing the book emoji
            const items = Array.from(ul.querySelectorAll('li'));
            const triggerIdx = items.findIndex(li => li.innerText.includes('📚') || li.innerHTML.includes('📚'));
            
            if (triggerIdx !== -1) {
                this.transform(ul, items, triggerIdx);
            }
        });
    }

    transform(ul, items, triggerIdx) {
        ul.dataset.shelfishLoaded = "true";
        
        // collect items after the trigger emoji
        const shelfItems = items.slice(triggerIdx + 1)
            .map(li => this.parse(li.innerText || li.textContent))
            .filter(Boolean);
            
        if (!shelfItems.length) return;

        const container = document.createElement('div');
        container.className = 'shelfish-v4-container';
        
        const grid = document.createElement('div');
        grid.className = 'shelfish-v4-grid';
        
        shelfItems.forEach(item => {
            if (!this.items.some(it => it.id === item.id)) {
                this.items.push(item);
            }
            grid.innerHTML += this.render(item);
        });

        container.appendChild(grid);
        ul.replaceWith(container);

        // monitor visibility for priority fetching
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isFetching) {
                    this.startCircularFetch(entry.target.dataset.id);
                }
            });
        }, { rootMargin: '100px' });

        container.querySelectorAll('.shelfish-v4-item').forEach(el => observer.observe(el));
    }

    parse(raw) {
        const p = raw.split('|').map(s => s.trim());
        if (p.length < 2) return null;
        
        const tagMatch = p[0].match(/\[(.*?)\]/i);
        if (!tagMatch) return null;
        
        const type = tagMatch[1].trim().toLowerCase();
        let typeStr = type === 'tv' ? 'TV' : type.charAt(0).toUpperCase() + type.slice(1);
        
        return {
            id: 'sh-' + Math.random().toString(36).substr(2, 9),
            type: typeStr || 'Book',
            title: p[0].replace(tagMatch[0], '').trim(),
            author: p[1],
            link: (p[2] && p[2] !== '#') ? p[2] : null,
            label: (p[3] && p[3] !== '#') ? p[3] : 'Read review'
        };
    }

    render(i) {
        const btn = i.link ? `<a href="${i.link}" class="shelfish-v4-btn">${i.label} →</a>` : '';
        return `
            <div class="shelfish-v4-item" data-id="${i.id}" data-type="${i.type}" data-title="${i.title}" data-author="${i.author}">
                <div class="shelfish-v4-card">
                    <div class="shelfish-v4-thumb">
                        <div class="shelfish-v4-placeholder">${this.icons[i.type] || '📖'}</div>
                        <img class="shelfish-v4-img" alt="${i.title}">
                    </div>
                    <div class="shelfish-v4-info">
                        <div class="shelfish-v4-title">${i.title}</div>
                        <div class="shelfish-v4-author">${i.author}</div>
                        ${btn}
                    </div>
                </div>
            </div>`;
    }

    async startCircularFetch(startId) {
        if (this.isFetching) return;
        this.isFetching = true;

        const startIndex = this.items.findIndex(it => it.id === startId);
        if (startIndex === -1) { this.isFetching = false; return; }

        const sequence = [...this.items.slice(startIndex), ...this.items.slice(0, startIndex)];

        for (const item of sequence) {
            if (this.processedIds.has(item.id)) continue;
            await this.fetchArtwork(item);
            this.processedIds.add(item.id);
            await new Promise(r => setTimeout(r, 150));
        }

        this.isFetching = false;
    }

    async fetchArtwork(item) {
        const cacheKey = `sh4_${item.type}_${item.title}_${item.author}`.replace(/\s+/g, '_');
        let url = localStorage.getItem(cacheKey);

        if (!url) {
            const isVid = ['Movie', 'TV'].includes(item.type);
            const q = encodeURIComponent(item.title + (isVid ? '' : ' ' + item.author));
            const endpoint = isVid 
                ? `https://api.themoviedb.org/3/search/${item.type === 'Movie' ? 'movie' : 'tv'}?api_key=${this.key}&query=${q}`
                : `https://itunes.apple.com/search?term=${q}&media=${item.type === 'Music' ? 'music' : 'ebook'}&limit=1`;

            try {
                const res = await fetch(endpoint).then(r => r.json());
                const hit = res.results?.[0];
                if (hit) {
                    if (hit.poster_path) url = `https://image.tmdb.org/t/p/w500${hit.poster_path}`;
                    else if (hit.artworkUrl100) url = hit.artworkUrl100.replace('100x100bb.jpg', '1000x1000bb.jpg');
                    if (url) localStorage.setItem(cacheKey, url);
                }
            } catch (e) {}
        }

        if (url) {
            const el = document.querySelector(`.shelfish-v4-item[data-id="${item.id}"] img`);
            if (el) {
                el.src = url;
                el.onload = () => el.classList.add('loaded');
            }
        }
    }
}

const initSH4 = () => { window.ShelfishV4 = new Shelfish(); };
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initSH4); } else { initSH4(); }
