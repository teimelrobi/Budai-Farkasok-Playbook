async function loadPlays(){
  // Ingyenes host (GitHub Pages/Netlify/Cloudflare Pages) alatt működik.
  const res = await fetch('assets/data/plays.json', { cache: 'no-store' });
  return await res.json();
}

function uniq(arr){
  return [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'hu'));
}

function addOptions(selectEl, values){
  values.forEach(v=>{
    const o=document.createElement('option');
    o.value=v; o.textContent=v;
    selectEl.appendChild(o);
  });
}

function chip(text){
  const s=document.createElement('span');
  s.className='chip';
  s.textContent=text;
  return s;
}

function renderRow(play){
  const tpl = document.getElementById('rowTpl');
  const node = tpl.content.cloneNode(true);

  node.querySelector('.name').textContent = play.name || 'Mozgás neve';
  node.querySelector('.defense').textContent = play.defense || '';
  node.querySelector('.desc').textContent = play.description || '';

  const chipsWrap = node.querySelector('.chips');
  const chipVals = [play.phase, play.situation].filter(Boolean);
  chipVals.forEach(v=>chipsWrap.appendChild(chip(v)));

  const video = node.querySelector('video.media');
  const img = node.querySelector('img.media-img');

  const src = play.media || '';
  if(src.match(/\.(mp4|webm|ogg)$/i)){
    video.src = src;
    video.style.display = 'block';
    img.style.display = 'none';
  }else if(src){
    img.src = src;
    img.style.display = 'block';
    video.style.display = 'none';
  }else{
    const box = node.querySelector('.media-box');
    box.textContent = 'Ide kerül a gif / videó';
    box.style.color = '#6b7280';
  }

  return node;
}

function matches(play, q, fDefense, fSituation, fPhase){
  if(fDefense && (play.defense||'') !== fDefense) return false;
  if(fSituation && (play.situation||'') !== fSituation) return false;
  if(fPhase && (play.phase||'') !== fPhase) return false;

  if(!q) return true;
  const hay = [
    play.name, play.defense, play.situation, play.phase, play.description
  ].filter(Boolean).join(' ').toLowerCase();
  return hay.includes(q.toLowerCase());
}

(async function main(){
  const plays = await loadPlays();

  const q = document.getElementById('q');
  const list = document.getElementById('list');
  const empty = document.getElementById('empty');
  const fDefense = document.getElementById('fDefense');
  const fSituation = document.getElementById('fSituation');
  const fPhase = document.getElementById('fPhase');

  addOptions(fDefense, uniq(plays.map(p=>p.defense)));
  addOptions(fSituation, uniq(plays.map(p=>p.situation)));
  addOptions(fPhase, uniq(plays.map(p=>p.phase)));

  function refresh(){
    list.innerHTML = '';
    const filtered = plays.filter(p => matches(p, q.value.trim(), fDefense.value, fSituation.value, fPhase.value));
    empty.hidden = filtered.length !== 0;
    filtered.forEach(p => list.appendChild(renderRow(p)));
  }

  q.addEventListener('input', refresh);
  fDefense.addEventListener('change', refresh);
  fSituation.addEventListener('change', refresh);
  fPhase.addEventListener('change', refresh);

  refresh();
})().catch(err=>{
  console.error(err);
  document.getElementById('list').innerHTML =
    '<div class="empty">Hiba a betöltésnél. Ellenőrizd, hogy az <b>assets/data/plays.json</b> megvan-e (és hogy az oldal hostolva van-e, nem file:// megnyitva).</div>';
});
