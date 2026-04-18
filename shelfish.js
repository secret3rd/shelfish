(function() {
  const K = '8942f1dc81e199d343c97639c0bbca67', run = () => {
    document.querySelectorAll('ul:not([data-sh])').forEach(u => {
      const li = Array.from(u.children);
      if (li[0]?.innerText.trim().toLowerCase() !== 'shelfish') return;
      u.dataset.sh = "1"; const g = document.createElement('div'); g.className = 'sh-g';
      li.slice(1).forEach(l => {
        const [h, a, lk] = l.innerText.split('|').map(s => s.trim());
        const t = h.match(/\[(.*?)\]/)?.[1]?.toLowerCase() || 'book', c = document.createElement('div'); c.className = 'sh-c';
        c.innerHTML = `<div class="sh-t"><img class="sh-i"></div><b>${h.replace(/\[.*?\]/, '')}</b><p>${a}</p>${lk?`<a href="${lk}" class="sh-b">Review →</a>`:''}`;
        g.appendChild(c); const q = encodeURIComponent(h + ' ' + a);
        const url = t.match(/movie|tv/) ? `https://api.themoviedb.org/3/search/${t=='movie'?'movie':'tv'}?api_key=${K}&query=${q}` : `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://itunes.apple.com/search?term=${q}&limit=1`)}`;
        fetch(url).then(r=>r.json()).then(d=>{
          const r = d.results?.[0], img = c.querySelector('img');
          img.src = r?.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : r?.artworkUrl100?.replace('100x100','600x600');
          img.onload = () => img.style.opacity = 1;
        }).catch(()=>{});
      });
      u.replaceWith(g);
    });
  };
  run(); setTimeout(run, 1500);
})();
