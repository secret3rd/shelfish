/**
 * auto-fetch book/album covers and movie/tv posters for your /now page on bear blog.
 */
class Shelfish {
    constructor(config = {}) {
        this.key = config.tmdbKey || '8942f1dc81e199d343c97639c0bbca67';
        this.icons = { 'Book': `📚`, 'Movie': `🎬`, 'TV': `📺`, 'Music': `🎵` };
        this.queue = [];
        this.isProcessing = false;
        this.setupLazyLoader();
        this.scan();
        // re-scan on dynamic updates
        new MutationObserver(() => this.scan()).observe(document.body, { childList: true, subtree: true });
        // re-balance lanes on resize for perfect gapping
        window.addEventListener('resize', () => this.rebalance());
    }

    setupLazyLoader() {
        this.shelfish_lazy = new IntersectionObserver(es => es.forEach(e => {
            if (e.isIntersecting) { this.loadArt(e.target); this.shelfish_lazy.unobserve(e.target); }
        }), { rootMargin: '400px' });
    }

    scan() {
        document.querySelectorAll('ul:not([data-shelfish-loaded])').forEach(ul => {
            const li = ul.querySelector('li');
            if (li && (li.innerHTML.includes('🔢') || li.innerText.includes('🔢'))) {
                this.transform(ul, Array.from(ul.querySelectorAll('li')));
            }
        });
    }

    rebalance() {
        // re-runs transformation logic if window width changes significantly
        const now = Date.now();
        if (this.lastRebalance && now - this.lastRebalance < 500) return;
        this.lastRebalance = now;
        document.querySelectorAll('.shelfish-container').forEach(c => {
            if (c._sourceUl) this.transform(c._sourceUl, Array.from(c._sourceUl.querySelectorAll('li')));
        });
    }

    transform(ul, nodeArray) {
        ul.dataset.shelfishLoaded = "true";
        const items = nodeArray.map(node => this.parse(node.innerText || node.textContent)).filter(Boolean);
        if (!items.length) return;

        // determine column count based on container width for proper sectioning
        const width = ul.parentElement ? ul.parentElement.offsetWidth : window.innerWidth;
        const colCount = width > 900 ? 3 : (width > 480 ? 2 : 1);

        // distribute into lanes that actually fit to avoid massive gaps on wrap
        const lanes = Array.from({ length: colCount }, () => []);
        items.forEach((item, idx) => {
            lanes[idx % colCount].push(this.render(item, idx));
        });

        const laneHTML = lanes.map(l => `<div class="shelfish-lane">${l.join('')}</div>`).join('');
        const html = `<div class="shelfish-grid" data-cols="${colCount}">${laneHTML}</div>`;

        let container = ul.nextElementSibling && ul.nextElementSibling.classList.contains('shelfish-container') 
            ? ul.nextElementSibling 
            : null;

        if (!container) {
            container = document.createElement('div');
            container.className = 'shelfish-container';
            container._sourceUl = ul;
            ul.replaceWith(container);
            ul.style.display = 'none'; // keep source for re-balancing
            container.before(ul);
        }
        
        container.innerHTML = html;

        container.querySelectorAll('.shelfish-item-wrapper').forEach(c => {
            c._shelfishItem = items.find(i => i.id === c.dataset.id);
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
        const label = (lk && parts[3] && parts[3] !== '#') ? parts[3] : 'Read review';
        const bType = tag[1].trim().toLowerCase();
        let typeStr = bType === 'tv' ? 'TV' : bType.charAt(0).toUpperCase() + bType.slice(1);
        return {
            id: `shel-` + Math.random().toString(36).substr(2,5),
            type: typeStr,
            title: tpTit.replace(tag[0], '').trim(),
            author: cr,
            img: null,
            link: lk,
            label: label
        };
    }

    render(i, index) {
        const hasRev = i.link ? 'shelfish-has-review' : '';
        const linkHTML = i.link
            ? `<div class="shelfish-btn-wrapper"><a href="${i.link}" class="superbutton-link superbutton-rounded shelfish-btn">${i.label} <span class="shelfish-arrow">→</span></a></div>`
            : '';
        return `
            <div class="shelfish-item-wrapper ${hasRev}" data-id="${i.id}" style="order: ${index}">
                <div class="shelfish-card shelfish-is-${i.type.toLowerCase()}">
                    <div class="shelfish-thumb"><img onload="this.classList.add('shelfish-loaded')" alt="${i.title}" title="${i.title}"></div>
                    <div class="shelfish-info">
                        <div class="shelfish-title">${i.title}</div>
                        <div class="shelfish-author">${i.author}</div>
                    </div>
                </div>
                ${linkHTML}
            </div>`;
    }

    async loadArt(wrapper) {
        if (wrapper.dataset.shelfishProcessed) return;
        const i = wrapper._shelfishItem;
        const cacheKey = `shelfish_${i.type}_${i.title}_${i.author}`.replace(/\s+/g, '_');
        let cachedUrl = localStorage.getItem(cacheKey);
        if (cachedUrl) {
            wrapper.dataset.shelfishProcessed = "true";
            const img = wrapper.querySelector('img');
            img.src = cachedUrl;
            img.onerror = () => { wrapper.querySelector('.shelfish-thumb').innerHTML = `<div class="shelfish-placeholder">${this.icons[i.type]}</div>`; };
            return;
        }
        this.queue.push(wrapper);
        this.processQueue();
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;
        while (this.queue.length > 0) {
            const wrapper = this.queue.shift();
            if (wrapper.dataset.shelfishProcessed) continue;
            wrapper.dataset.shelfishProcessed = "true";
            const i = wrapper._shelfishItem;
            const img = wrapper.querySelector('img');
            try {
                const url = i.img || await this.fetchAPI(i);
                if (url) { 
                    localStorage.setItem(`shelfish_${i.type}_${i.title}_${i.author}`.replace(/\s+/g, '_'), url); 
                    img.src = url; 
                } else { 
                    wrapper.querySelector('.shelfish-thumb').innerHTML = `<div class="shelfish-placeholder">${this.icons[i.type]}</div>`; 
                }
            } catch (e) { wrapper.querySelector('.shelfish-thumb').innerHTML = `<div class="shelfish-placeholder">${this.icons[i.type]}</div>`; }
            await new Promise(r => setTimeout(r, 250));
        }
        this.isProcessing = false;
    }

    async fetchAPI({ type, title, author }) {
        const isVid = ['Movie', 'TV'].includes(type);
        const q = encodeURIComponent(title + (isVid ? '' : ' ' + author));
        const url = isVid ? `https://api.themoviedb.org/3/search/${type === 'Movie' ? 'movie' : 'tv'}?api_key=${this.key}&query=${q}`
                          : `https://itunes.apple.com/search?term=${q}&media=${type === 'Music' ? 'music' : 'ebook'}&limit=1`;
        try {
            const res = await (await fetch(url)).json();
            const hit = res.results && res.results.length > 0 ? res.results[0] : null;
            if (hit && hit.poster_path) return `https://image.tmdb.org/t/p/w500${hit.poster_path}`;
            if (hit && hit.artworkUrl100) return hit.artworkUrl100.replace('100x100bb.jpg', '1000x1000bb.jpg');
        } catch (e) {} return null;
    }
}
const initShelfish = () => { window.ShelfishInstance = new Shelfish(); };
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initShelfish); } else { initShelfish(); }
