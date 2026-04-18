(function() {
  const K='8942f1dc81e199d343c97639c0bbca67',R=()=>{
    document.querySelectorAll('ul:not([data-sh])').forEach(u=>{
      const f=u.querySelector('li');
      if(!f) return;
      const txt = f.innerText.toLowerCase();
      if(!txt.includes('shelfish') && !txt.includes('[shelf]')) return;
      u.dataset.sh='1'; const g=document.createElement('div'); g.className='sh-g';
      Array.from(u.querySelectorAll('li')).slice(1).forEach(l=>{
        const p=l.innerText.split('|').map(s=>s.trim());
        if(p.length<2) return;
        const [h, a, lk, lb] = p, t = h.match(/\[(.*?)\]/)?.[1]?.toLowerCase() || 'book', c = document.createElement('div'); c.className = 'sh-c';
        const label = (lb && lb !== '#') ? lb : 'Review';
        const btn = (lk && lk !== '#') ? `<a href="${lk}" class="sh-b">${label} →</a>` : '';
        c.innerHTML=`<div class="sh-t"><img class="sh-i"></div><b>${h.replace(/\[.*?\]/,'')}</b><p>${a}</p>${btn}`;
        g.appendChild(c); const q = encodeURIComponent(h + ' ' + a);
        const url = t.match(/movie|tv/) ? `https://api.themoviedb.org/3/search/${t=='movie'?'movie':'tv'}?api_key=${K}&query=${q}` : `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://itunes.apple.com/search?term=${q}&limit=1`)}`;
        fetch(url).then(r=>r.json()).then(d=>{const r=d.results?.[0],m=c.querySelector('img'); m.src=r?.poster_path?`https://image.tmdb.org/t/p/w500${r.poster_path}`:r?.artworkUrl100?.replace('100x100','600x600'); m.onload=()=>m.style.opacity=1;}).catch(()=>{});
      }); u.replaceWith(g);
    });
  };
  R(); new MutationObserver(R).observe(document.body, {childList:true, subtree:true});
})();
