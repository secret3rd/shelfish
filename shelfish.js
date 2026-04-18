/**
 * shelfish v6.1: precise fetching & non-destructive injection.
 */
(function() {
    const SHELFISH_KEY = '8942f1dc81e199d343c97639c0bbca67';
    
    // mapping types to itunes entity/media keys for accuracy
    const MEDIA_MAP = {
        'book': { media: 'ebook', entity: 'ebook' },
        'music': { media: 'music', entity: 'album' },
        'movie': { media: 'movie', entity: 'movie' },
        'tv': { media: 'tvShow', entity: 'tvSeason' }
    };

    const ICONS = { 'Book': '📚', 'Movie': '🎬', 'TV': '📺', 'Music': '🎵' };

    const styles = `
        .sh-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; margin: 2rem 0; width: 100%; clear: both; }
        .sh-card { background: color-mix(in srgb, currentColor, transparent 92%); backdrop-filter: blur(8px); border: 1px solid color-mix(in srgb, currentColor, transparent 85%); border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 0.8rem; height: 100%; box-sizing: border-box; }
        .sh-thumb { width: 100%; aspect-ratio: 2/3; background: #3332; border-radius: 6px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
        .sh-img { width: 100% !important; height: 100% !important; object-fit: cover !important; opacity: 0; transition: opacity 0.3s; position: absolute; top:0; left:0; border-radius: 0 !important; margin: 0 !important; border:0 !important; }
        .sh-img.loaded { opacity: 1; }
        .sh-title { font-size: 1rem !important; font-weight: 600 !important; line-height: 1.2 !important; margin:0 !important; }
        .sh-author { font-size: 0.85rem !important; opacity: 0.7 !important; margin:0 !important; }
        .sh-placeholder { font-size: 1.5rem; opacity: 0.3; }
        @media (max-width: 480px) { .sh-grid { grid-template-columns: 1fr 1fr; gap: 0.8rem; } .sh-card { padding: 0.6rem; } }
    `;

    const run = () => {
        if (!document.getElementById('sh-styles')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'sh-styles';
            styleTag.innerHTML = styles;
            document.head.appendChild(styleTag);
        }

        // find all potential shelf starting points
        const triggerElements = Array.from(document.querySelectorAll('p, li, div'))
            .filter(el => el.innerText.trim() === '[shelf]' && !el.dataset.shelfishProcessed);

        triggerElements.forEach(trigger => transform(trigger));
    };

    const transform = (trigger) => {
        trigger.dataset.shelfishProcessed = "true";
        const parent = trigger.parentElement;
        const siblings = Array.from(parent.children || []);
        const triggerIndex = siblings.indexOf(trigger);
        
        let shelfLines = [];
        let elementsToReplace = [trigger];

        // identify sibling elements that match the [Type] Title | Creator pattern
        for (let i = triggerIndex + 1; i < siblings.length; i++) {
            const el = siblings[i];
            const text = el.innerText.trim();
            if (text.includes('|') && text.includes('[') && text.includes(']')) {
                shelfLines.push(text);
                elementsToReplace.push(el);
            } else {
                break; // stop at first non-matching element (heading, normal text, etc)
            }
        }

        const items = shelfLines.map(line => parse(line)).filter(Boolean);

        if (items.length > 0) {
            const grid = document.createElement('div');
            grid.className = 'sh-grid';
            items.forEach(item => {
                const card = createCard(item);
                grid.appendChild(card);
                fetchArt(item, card.querySelector('img'));
            });

            // insert grid at the trigger location and remove only the content elements
            trigger.insertAdjacentElement('beforebegin', grid);
            elementsToReplace.forEach(el => el.remove());
        }
    };

    const parse = (line) => {
        const p = line.split('|').map(s => s.trim());
        if (p.length < 2) return null;
        const typeMatch = p[0].match(/\[(.*?)\]/);
        return {
            type: typeMatch ? typeMatch[1].trim() : 'Book',
            title: typeMatch ? p[0].replace(typeMatch[0], '').trim() : p[0],
            author: p[1]
        };
    };

    const createCard = (i) => {
        const card = document.createElement('div');
        card.className = 'sh-card';
        card.innerHTML = `
            <div class="sh-thumb">
                <div class="sh-placeholder">${ICONS[i.type] || '📖'}</div>
                <img class="sh-img" alt="${i.title}">
            </div>
            <div class="sh-info">
                <div class="sh-title">${i.title}</div>
                <div class="sh-author">${i.author}</div>
            </div>`;
        return card;
    };

    const fetchArt = async (item, img) => {
        const type = item.type.toLowerCase();
        const mapping = MEDIA_MAP[type] || MEDIA_MAP['book'];
        const q = encodeURIComponent(item.title + (type === 'movie' || type === 'tv' ? '' : ' ' + item.author));
        
        let endpoint;
        if (type === 'movie' || type === 'tv') {
            endpoint = `https://api.themoviedb.org/3/search/${type === 'movie' ? 'movie' : 'tv'}?api_key=${SHELFISH_KEY}&query=${q}`;
        } else {
            endpoint = `https://itunes.apple.com/search?term=${q}&media=${mapping.media}&entity=${mapping.entity}&limit=1`;
        }
        
        try {
            const res = await fetch(endpoint).then(r => r.json());
            const hit = res.results?.[0];
            let artUrl = null;

            if (type === 'movie' || type === 'tv') {
                if (hit?.poster_path) artUrl = `https://image.tmdb.org/t/p/w200${hit.poster_path}`;
            } else {
                if (hit?.artworkUrl100) artUrl = hit.artworkUrl100.replace('100x100bb', '600x600bb');
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
