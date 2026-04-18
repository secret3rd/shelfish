/**
 * shelfish v6: the bulletproof mvp.
 * single-file implementation. zero external dependencies.
 */
(function() {
    const SHELFISH_KEY = '8942f1dc81e199d343c97639c0bbca67';
    const ICONS = { 'Book': '📚', 'Movie': '🎬', 'TV': '📺', 'Music': '🎵' };

    // injection of essential styles for the glass look
    const styles = `
        .sh-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0; width: 100%; clear: both; }
        .sh-card { background: color-mix(in srgb, currentColor, transparent 92%); backdrop-filter: blur(8px); border: 1px solid color-mix(in srgb, currentColor, transparent 85%); border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 0.8rem; height: 100%; box-sizing: border-box; }
        .sh-thumb { width: 100%; aspect-ratio: 2/3; background: #3332; border-radius: 6px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
        .sh-img { width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.3s; position: absolute; top:0; left:0; border-radius: 0 !important; margin: 0 !important; }
        .sh-img.loaded { opacity: 1; }
        .sh-title { font-size: 1rem; font-weight: 600; line-height: 1.2; }
        .sh-author { font-size: 0.85rem; opacity: 0.7; }
        .sh-placeholder { font-size: 1.5rem; opacity: 0.3; }
        @media (max-width: 480px) { .sh-grid { grid-template-columns: 1fr 1fr; gap: 0.5rem; } .sh-card { padding: 0.5rem; } }
    `;

    const run = () => {
        const styleTag = document.createElement('style');
        styleTag.innerHTML = styles;
        document.head.appendChild(styleTag);

        // find the [shelf] trigger anywhere in the body
        const bodies = document.querySelectorAll('p, li, div');
        bodies.forEach(el => {
            if (el.dataset.shelfishProcessed) return;
            if (el.innerText.trim() === '[shelf]' || el.textContent.trim() === '[shelf]') {
                transform(el);
            }
        });
    };

    const transform = (trigger) => {
        trigger.dataset.shelfishProcessed = "true";
        const parent = trigger.parentElement;
        const text = parent.innerText || parent.textContent;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l && l !== '[shelf]');
        
        const items = lines.map(line => {
            const p = line.split('|').map(s => s.trim());
            if (p.length < 2) return null;
            const typeMatch = p[0].match(/\[(.*?)\]/);
            return {
                type: typeMatch ? typeMatch[1] : 'Book',
                title: typeMatch ? p[0].replace(typeMatch[0], '').trim() : p[0],
                author: p[1]
            };
        }).filter(Boolean);

        if (items.length > 0) {
            const grid = document.createElement('div');
            grid.className = 'sh-grid';
            items.forEach(i => {
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
                    </div>
                `;
                grid.appendChild(card);
                fetchArt(i, card.querySelector('img'));
            });
            parent.innerHTML = '';
            parent.appendChild(grid);
        }
    };

    const fetchArt = async (item, img) => {
        const isVid = ['Movie', 'TV'].includes(item.type);
        const q = encodeURIComponent(item.title + (isVid ? '' : ' ' + item.author));
        const url = isVid 
            ? `https://api.themoviedb.org/3/search/${item.type === 'Movie' ? 'movie' : 'tv'}?api_key=${SHELFISH_KEY}&query=${q}`
            : `https://itunes.apple.com/search?term=${q}&limit=1`;
        
        try {
            const res = await fetch(url).then(r => r.json());
            const hit = res.results?.[0];
            const artUrl = hit?.poster_path ? `https://image.tmdb.org/t/p/w200${hit.poster_path}` : hit?.artworkUrl100?.replace('100x100bb', '600x600bb');
            if (artUrl) { img.src = artUrl; img.onload = () => img.classList.add('loaded'); }
        } catch(e) {}
    };

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', run); } else { run(); }
    setTimeout(run, 1500); // safety run for slow pages
})();
