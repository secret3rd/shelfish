/**
 * shelfish v5: the agnostic shelf.
 * no strict tags required. searches for the emoji trigger and transforms the sibling text.
 */
class Shelfish {
    constructor() {
        this.key = '8942f1dc81e199d343c97639c0bbca67';
        this.icons = { 'Book': '📚', 'Movie': '🎬', 'TV': '📺', 'Music': '🎵' };
        
        this.init();
    }

    init() {
        this.run();
        // catch any lazy-loaded content
        setTimeout(() => this.run(), 1000);
        setTimeout(() => this.run(), 3000);
    }

    run() {
        // find every element containing the book emoji that hasn't been processed
        const walkers = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        const targets = [];
        
        while(node = walkers.nextNode()) {
            if (node.textContent.includes('📚')) {
                targets.push(node.parentElement);
            }
        }

        targets.forEach(parent => {
            if (parent.dataset.shelfishProcessed || parent.closest('.shelfish-v5-container')) return;
            this.transform(parent);
        });
    }

    transform(container) {
        container.dataset.shelfishProcessed = "true";
        const text = container.innerText || container.textContent;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        // find lines that look like [Type] Title | Author
        const items = lines.map(line => this.parse(line)).filter(Boolean);
        if (!items.length) return;

        const shelf = document.createElement('div');
        shelf.className = 'shelfish-v5-container';
        
        const grid = document.createElement('div');
        grid.className = 'shelfish-v5-grid';
        
        items.forEach(item => {
            const card = this.createCard(item);
            grid.appendChild(card);
            this.fetchArt(item, card.querySelector('img'));
        });

        shelf.appendChild(grid);
        container.innerHTML = '';
        container.appendChild(shelf);
    }

    parse(line) {
        const p = line.split('|').map(s => s.trim());
        if (p.length < 2) return null;
        
        const typeMatch = p[0].match(/\[(.*?)\]/i);
        if (!typeMatch) return null;
        
        const type = typeMatch[1].trim().toLowerCase();
        let typeStr = type === 'tv' ? 'TV' : type.charAt(0).toUpperCase() + type.slice(1);
        
        return {
            type: typeStr,
            title: p[0].replace(typeMatch[0], '').trim(),
            author: p[1],
            id: 'sh-' + Math.random().toString(36).substr(2, 5)
        };
    }

    createCard(i) {
        const div = document.createElement('div');
        div.className = 'shelfish-v5-item';
        div.innerHTML = `
            <div class="shelfish-v5-card">
                <div class="shelfish-v5-thumb">
                    <div class="shelfish-v5-placeholder">${this.icons[i.type] || '📖'}</div>
                    <img class="shelfish-v5-img" alt="${i.title}">
                </div>
                <div class="shelfish-v5-info">
                    <div class="shelfish-v5-title">${i.title}</div>
                    <div class="shelfish-v5-author">${i.author}</div>
                </div>
            </div>`;
        return div;
    }

    async fetchArt(i, img) {
        const cacheKey = `sh5_${i.type}_${i.title}_${i.author}`.replace(/\s+/g, '_');
        let url = localStorage.getItem(cacheKey);

        if (!url) {
            const isVid = ['Movie', 'TV'].includes(i.type);
            const q = encodeURIComponent(i.title + (isVid ? '' : ' ' + i.author));
            const endpoint = isVid 
                ? `https://api.themoviedb.org/3/search/${i.type === 'Movie' ? 'movie' : 'tv'}?api_key=${this.key}&query=${q}`
                : `https://itunes.apple.com/search?term=${q}&media=${i.type === 'Music' ? 'music' : 'ebook'}&limit=1`;

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

        if (url && img) {
            img.src = url;
            img.onload = () => img.classList.add('loaded');
        }
    }
}

new Shelfish();
