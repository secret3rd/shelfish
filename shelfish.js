/**
 * shelfish v6.2: boxed fencing & high-res artwork.
 */
(function() {
    const SHELFISH_KEY = '8942f1dc81e199d343c97639c0bbca67';
    
    const MEDIA_MAP = {
        'book': { media: 'ebook', entity: 'ebook' },
        'music': { media: 'music', entity: 'album' },
        'movie': { media: 'movie', entity: 'movie' },
        'tv': { media: 'tvShow', entity: 'tvSeason' }
    };

    const ICONS = { 'Book': '📚', 'Movie': '🎬', 'TV': '📺', 'Music': '🎵' };

    const styles = `
        .sh-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.5rem; margin: 2rem 0; width: 100%; clear: both; }
        .sh-card { background: color-mix(in srgb, currentColor, transparent 92%); backdrop-filter: blur(8px); border: 1px solid color-mix(in srgb, currentColor, transparent 85%); border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 0.8rem; height: 100%; box-sizing: border-box; }
        .sh-thumb { width: 100%; aspect-ratio: 2/3; background: #3332; border-radius: 6px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
        .sh-img { width: 100% !important; height: 100% !important; object-fit: cover !important; opacity: 0; transition: opacity 0.3s; position: absolute; top:0; left:0; border-radius: 0 !important; margin: 0 !important; border:0 !important; }
        .sh-img.loaded { opacity: 1; }
        .sh-title { font-size: 1rem !important; font-weight: 600 !important; line-height: 1.2 !important; margin:0 !important; }
        .sh-author { font-size: 0.85rem !important; opacity: 0.7 !important; margin:0 !important; }
        .sh-placeholder { font-size: 2rem; opacity: 0.1; }
        @media (max-width: 480px) { .sh-grid { grid-template-columns: 1fr 1fr; gap: 0.8rem; } .sh-card { padding: 0.6rem; } }
    `;

    const run = () => {
        if (!document.getElementById('sh-styles')) {
            const style = document.createElement('style');
            style.id = 'sh-styles';
            style.innerHTML = styles;
            document.head.appendChild(style);
        }

        // find all starting [shelf] triggers
        const triggerElements = Array.from(document.querySelectorAll('p, li, div'))
            .filter(el => el.innerText.trim() === '[shelf]' && !el.dataset.shProcessed);

        triggerElements.forEach(startNode => {
            startNode.dataset.shProcessed = "true";
            processShelfBlock(startNode);
        });
    };

    const processShelfBlock = (startNode) => {
        const parent = startNode.parentElement;
        const siblings = Array.from(parent.children || []);
        const startIndex = siblings.indexOf(startNode);
        
        let elementsToReplace = [startNode];
        let shelfLines = [];
        let foundEnd = false;

        // collect everything until [/shelf]
        for (let i = startIndex + 1; i < siblings.length; i++) {
            const el = siblings[i];
            const text = el.innerText.trim();
            elementsToReplace.push(el);

            if (text === '[/shelf]') {
                foundEnd = true;
                break;
            }
            
            if (text.includes('|') && text.includes('[') && text.includes(']')) {
                shelfLines.push(text);
            }
        }

        if (foundEnd && shelfLines.length > 0) {
            const items = shelfLines.map(line => parse(line)).filter(Boolean);
            const grid = document.createElement('div');
            grid.className = 'sh-grid';
            
            items.forEach(item => {
                const card = createCard(item);
                grid.appendChild(card);
                fetchArt(item, card.querySelector('img'));
            });

            startNode.insertAdjacentElement('beforebegin', grid);
            elementsToReplace.forEach(el => el.remove());
        }
    };

    const parse = (line) => {
        const p = line.split('|').map(s => s.trim());
        if (p.length < 2) return null;
        const typeMatch = p[0].match(/\[(.*?)\]/);
        return {
            type: typeMatch ? typeMatch[1].trim().toLowerCase() : 'book',
            title: typeMatch ? p[0].replace(typeMatch[0], '').trim() : p[0],
            author: p[1]
        };
    };

    const createCard = (i) => {
        const card = document.createElement('div');
        const typeStr = i.type === 'tv' ? 'TV' : i.type.charAt(0).toUpperCase() + i.type.slice(1);
        card.className = 'sh-card';
        card.innerHTML = `
            <div class="sh-thumb">
                <div class="sh-placeholder">${ICONS[typeStr] || '📖'}</div>
                <img class="sh-img" alt="${i.title}">
            </div>
            <div class="sh-info">
                <div class="sh-title">${i.title}</div>
                <div class="sh-author">${i.author}</div>
            </div>`;
        return card;
    };

    const fetchArt = async (item, img) => {
        const mapping = MEDIA_MAP[item.type] || MEDIA_MAP['book'];
        const q = encodeURIComponent(item.title + (item.type === 'movie' || item.type === 'tv' ? '' : ' ' + item.author));
        
        let endpoint;
        if (item.type === 'movie' || item.type === 'tv') {
            endpoint = `https://api.themoviedb.org/3/search/${item.type === 'movie' ? 'movie' : 'tv'}?api_key=${SHELFISH_KEY}&query=${q}`;
        } else {
            endpoint = `https://itunes.apple.com/search?term=${q}&media=${mapping.media}&entity=${mapping.entity}&limit=1`;
        }
        
        try {
            const res = await fetch(endpoint).then(r => r.json());
            const hit = res.results?.[0];
            let artUrl = null;

            if (item.type === 'movie' || item.type === 'tv') {
                if (hit?.poster_path) artUrl = `https://image.tmdb.org/t/p/w500${hit.poster_path}`;
            } else {
                if (hit?.artworkUrl100) {
                    // pull 1000px if possible, fallback to 600px
                    artUrl = hit.artworkUrl100.replace(/100x100bb/g, '1000x1000bb');
                }
            }

            if (artUrl) {
                img.src = artUrl;
                img.onload = () => img.classList.add('loaded');
            }
        } catch(e) {}
    };

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', run); } else { run(); }
    setTimeout(run, 1500);
})();
