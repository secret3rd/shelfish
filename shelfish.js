/**
 * shelfish v6.6: persistent caching & typographic refinement.
 */
(function() {
    const TMDB_KEY = '8942f1dc81e199d343c97639c0bbca67';
    
    const icons = { 'Book': '📚', 'Movie': '🎬', 'TV': '📺', 'Music': '🎵' };

    const styles = `
        .sh-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
            gap: 1.5rem; 
            margin: 2.5rem 0; 
            width: 100%; 
            clear: both; 
        }
        .sh-card { 
            background: color-mix(in srgb, currentColor, transparent 94%); 
            backdrop-filter: blur(10px); 
            border: 1px solid color-mix(in srgb, currentColor, transparent 88%); 
            border-radius: 12px; 
            padding: 1rem; 
            display: flex; 
            flex-direction: column; 
            gap: 0.8rem; 
            height: 100%; 
            box-sizing: border-box; 
            max-width: 15rem; /* updated to 15rem */
        }
        .sh-thumb { 
            width: 100%; 
            aspect-ratio: 2/3; 
            background: #0001; 
            border-radius: 6px; 
            overflow: hidden; 
            position: relative; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
        }
        .sh-img { 
            width: 100% !important; 
            height: 100% !important; 
            object-fit: cover !important; 
            opacity: 0; 
            transition: opacity 0.5s; 
            position: absolute; 
            top: 0; left: 0; 
            border-radius: 0 !important; 
            margin: 0 !important; 
        }
        .sh-img.loaded { opacity: 1; }
        .sh-info { display: flex; flex-direction: column; gap: 0.3rem; }
        .sh-title { 
            font-size: 1.1rem; /* slightly larger */
            font-weight: 600; 
            line-height: 1.25; 
        }
        .sh-author { 
            font-size: 0.85rem; 
            opacity: 0.6; 
            margin: 0; 
        }
        .sh-btn { 
            font-size: 0.9rem; 
            font-weight: 600; /* match title strength */
            text-decoration: none; 
            color: inherit; 
            margin-top: auto; 
            padding-top: 0.8rem; 
            border-top: 1px solid color-mix(in srgb, currentColor, transparent 90%); 
            display: flex;
            align-items: center;
            justify-content: flex-start; /* start instead of between */
            gap: 0.4rem; /* closely appended */
        }
        .sh-btn .sh-arr { 
            transition: transform 0.2s ease; 
        }
        .sh-btn:hover .sh-arr { 
            transform: translateX(4px); 
        }
        @media (max-width: 480px) { 
            .sh-grid { grid-template-columns: 1fr 1fr; gap: 0.8rem; } 
            .sh-card { padding: 0.7rem; max-width: none; } 
        }
    `;

    const getCache = (k) => localStorage.getItem('sh_v6_' + k);
    const setCache = (k, v) => localStorage.setItem('sh_v6_' + k, v);

    const fetchArt = async (type, title, author, img) => {
        const cleanTitle = title.replace(/\[.*?\]/g, '').trim();
        const cacheKey = `${type}_${cleanTitle}_${author}`.replace(/\s+/g, '_').toLowerCase();
        
        let cached = getCache(cacheKey);
        if (cached) {
            img.src = cached;
            img.onload = () => img.classList.add('loaded');
            return;
        }

        const query = encodeURIComponent(cleanTitle + ' ' + author);
        let url;
        if (type.match(/movie|tv/)) {
            const qTitle = encodeURIComponent(cleanTitle);
            url = `https://api.themoviedb.org/3/search/${type === 'movie' ? 'movie' : 'tv'}?api_key=${TMDB_KEY}&query=${qTitle}`;
        } else {
            const entity = type === 'music' ? 'album' : 'ebook';
            const media = type === 'music' ? 'music' : 'ebook';
            url = `https://itunes.apple.com/search?term=${query}&limit=1&media=${media}&entity=${entity}`;
        }

        try {
            const res = await fetch(url).then(r => r.json());
            const result = res.results?.[0];
            if (result) {
                const src = result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : result.artworkUrl100?.replace('100x100', '1000x1000');
                if (src) {
                    setCache(cacheKey, src);
                    img.src = src;
                    img.onload = () => img.classList.add('loaded');
                }
            }
        } catch (e) {}
    };

    const transform = () => {
        if (!document.getElementById('shelfish-css')) {
            const styleNode = document.createElement('style');
            styleNode.id = 'shelfish-css';
            styleNode.innerHTML = styles;
            document.head.appendChild(styleNode);
        }

        document.querySelectorAll('ul:not([data-shelfish])').forEach(ul => {
            const first = ul.querySelector('li');
            if (!first || !first.innerText.toLowerCase().includes('shelf')) return;

            ul.dataset.shelfish = "true";
            const grid = document.createElement('div');
            grid.className = 'sh-grid';

            Array.from(ul.querySelectorAll('li')).slice(1).forEach(li => {
                const parts = li.innerText.split('|').map(s => s.trim());
                if (parts.length < 2) return;

                const [rawTitle, author, link, label] = parts;
                const type = (rawTitle.match(/\[(.*?)\]/)?.[1] || 'Book').toLowerCase();
                const displayTitle = rawTitle.replace(/\[.*?\]/g, '').trim();
                
                const card = document.createElement('div');
                card.className = 'sh-card';
                card.innerHTML = `
                    <div class="sh-thumb">
                        <span style="opacity:0.2; font-size:2rem">${icons[type.charAt(0).toUpperCase() + type.slice(1)] || '📖'}</span>
                        <img class="sh-img">
                    </div>
                    <div class="sh-info">
                        <b class="sh-title">${displayTitle}</b>
                        <p class="sh-author">${author}</p>
                    </div>
                    ${(link && link !== '#') ? `<a href="${link}" class="sh-btn">${(label && label !== '#') ? label : 'Review'} <span class="sh-arr">→</span></a>` : ''}
                `;
                
                grid.appendChild(card);
                fetchArt(type, displayTitle, author, card.querySelector('.sh-img'));
            });

            ul.replaceWith(grid);
        });
    };

    transform();
    new MutationObserver(transform).observe(document.body, { childList: true, subtree: true });
})();
