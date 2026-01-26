const DEFENSES_ORDER = ["6:0", "5:1"]; 
const SITUATIONS_ORDER = [
  "Támadás",
  "Védekezés",
  "Lerohanás",
  "Visszarendeződés",
  "Létszámfölény",
  "Létszámhátrány",
];

// Gyakori elírások automatikus javítása
// Megjegyzés: az alábbi táblázat + a normalizeSituation-ben lévő "fuzzy" javítás
// biztosítja, hogy a *Lerihanás* jellegű elütések se jelenjenek meg.
const SITUATION_FIX = {
  // tipikus elütések
  "lerihanás": "Lerohanás",
  "lerihanas": "Lerohanás",
  "lerohanás": "Lerohanás",
  "lerohanas": "Lerohanás",
};

function normStr(s){
  return (s ?? "").toString().trim();
}

function normalizeSituation(s){
  const t = normStr(s);
  if(!t) return "";
  const key = t.toLowerCase().replace(/\s+/g," ");
  // 1) fix táblázat
  if(SITUATION_FIX[key]) return SITUATION_FIX[key];

  // 2) "fuzzy" fix: ha valaki elgépelte (pl. lerihanás / larihanas / lerih...),
  // akkor is legyen Lerohanás.
  if(key.includes('leriha') || key.includes('lariha') || key.includes('lerih')){
    return "Lerohanás";
  }
  // ha pontosan egyezik valamelyik "hivatalos" értékkel
  const hit = SITUATIONS_ORDER.find(v => v.toLowerCase() === key);
  return hit || t;
}

function normalizeDefense(s){
  const t = normStr(s);
  if(!t) return "";
  // pl. 6-0, 6.0 -> 6:0
  const key = t.replace(/[\.-]/g,":").replace(/\s+/g,"");
  if(key === "6:0") return "6:0";
  if(key === "5:1") return "5:1";
  return t;
}

function normalizePlay(p){
  const play = { ...p };
  play.name = normStr(play.name);
  play.description = (play.description ?? "").toString();
  play.media = normStr(play.media);
  play.defense = normalizeDefense(play.defense);
  play.situation = normalizeSituation(play.situation);
  return play;
}

async function loadPlays(){
  const res = await fetch('assets/data/plays.json', { cache: 'no-store' });
  const data = await res.json();
  return Array.isArray(data) ? data.map(normalizePlay) : [];
}

function uniq(arr){ return [...new Set(arr.filter(Boolean))]; }

function addOptions(selectEl, values){
  values.forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; selectEl.appendChild(o); });
}

function chip(text){ const s=document.createElement('span'); s.className='chip'; s.textContent=text; return s; }

function renderRow(play){
  const tpl = document.getElementById('rowTpl');
  const node = tpl.content.cloneNode(true);

  node.querySelector('.name').textContent = play.name || 'Mozgás neve';
  node.querySelector('.defense').textContent = play.defense || '';
  node.querySelector('.desc').textContent = play.description || '';

  const chipsWrap = node.querySelector('.chips');
  [play.situation].filter(Boolean).forEach(v=>chipsWrap.appendChild(chip(v)));

  const video = node.querySelector('video.media');
  const img = node.querySelector('img.media-img');
  const src = play.media || '';

  if(src.match(/\.(mp4|webm|ogg)$/i)){
    video.src = src; video.style.display = 'block'; img.style.display = 'none';
  }else if(src){
    img.src = src; img.style.display = 'block'; video.style.display = 'none';
  }else{
    const box = node.querySelector('.media-box');
    box.textContent = 'Ide kerül a gif / videó';
    box.style.color = 'rgba(255,255,255,0.55)';
  }
  return node;
}

function matches(play, q, fDefense, fSituation){
  if(fDefense && (play.defense||'') !== fDefense) return false;
  if(fSituation && (play.situation||'') !== fSituation) return false;

  if(!q) return true;
  const hay = [play.name, play.defense, play.situation, play.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

function orderedFilterValues(ordered, fromData){
  const inData = uniq(fromData);
  const known = ordered.filter(v => inData.includes(v));
  const extra = inData.filter(v => !ordered.includes(v)).sort((a,b)=>a.localeCompare(b,'hu'));
  return [...known, ...extra];
}

(async function main(){
  const plays = await loadPlays();

  const q = document.getElementById('q');
  const list = document.getElementById('list');
  const empty = document.getElementById('empty');
  const fDefense = document.getElementById('fDefense');
  const fSituation = document.getElementById('fSituation');

  addOptions(fDefense, orderedFilterValues(DEFENSES_ORDER, plays.map(p=>p.defense)));
  addOptions(fSituation, orderedFilterValues(SITUATIONS_ORDER, plays.map(p=>p.situation)));

  function refresh(){
    list.innerHTML = '';
    const filtered = plays.filter(p => matches(p, q.value.trim(), fDefense.value, fSituation.value));
    empty.hidden = filtered.length !== 0;
    filtered.forEach(p => list.appendChild(renderRow(p)));
  }

  q.addEventListener('input', refresh);
  fDefense.addEventListener('change', refresh);
  fSituation.addEventListener('change', refresh);

  refresh();
})().catch(err=>{
  console.error(err);
  const list = document.getElementById('list');
  if(list){
    list.innerHTML = '<div class="empty">Hiba a betöltésnél. Ellenőrizd, hogy az <b>assets/data/plays.json</b> megvan-e.</div>';
  }
});
