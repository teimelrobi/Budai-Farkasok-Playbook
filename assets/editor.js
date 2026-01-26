/*
  Lightweight in-browser editor for plays.json
  - Stores drafts in LocalStorage
  - If LocalStorage empty, auto-loads assets/data/plays.json
*/

const LS_KEY = 'bf_playbook_plays_v1';
const DATA_URL = 'assets/data/plays.json';

const DEF = {
  ved: ['6:0','5:1'],
  szitu: ['Támadás','Védekezés','Lerohanás','Visszarendeződés','Létszámfölény','Létszámhátrány']
};

let plays = [];

function $(sel){ return document.querySelector(sel); }

function safeParse(json){
  try{ return JSON.parse(json); }catch{ return null; }
}

function normalizePlay(p, idx){
  const id = (p && (p.id ?? p.ID ?? p.Id)) ?? (idx+1);
  return {
    id,
    name: (p?.name ?? p?.név ?? p?.nev ?? '').toString(),
    vedekezes: (p?.vedekezes ?? p?.véd ?? p?.ved ?? '').toString(),
    szituacio: (p?.szituacio ?? p?.szituáció ?? '').toString(),
    media: (p?.media ?? p?.útvonal ?? p?.utvonal ?? '').toString(),
    description: (p?.description ?? p?.leírás ?? p?.leiras ?? '').toString(),
  };
}

function loadFromLocalStorage(){
  const raw = localStorage.getItem(LS_KEY);
  if(!raw) return null;
  const parsed = safeParse(raw);
  if(!parsed) return null;
  if(!Array.isArray(parsed)) return null;
  return parsed.map(normalizePlay);
}

async function loadFromFile(){
  const res = await fetch(DATA_URL, { cache: 'no-store' });
  if(!res.ok) throw new Error('Fetch failed: '+res.status);
  const parsed = await res.json();
  if(!Array.isArray(parsed)) throw new Error('plays.json is not an array');
  return parsed.map(normalizePlay);
}

function save(){
  localStorage.setItem(LS_KEY, JSON.stringify(plays, null, 2));
}

function newEmpty(){
  const nextId = plays.length ? Math.max(...plays.map(p=>Number(p.id)||0)) + 1 : 1;
  return { id: nextId, name:'', vedekezes:'', szituacio:'', media:'assets/media/', description:'' };
}

function render(){
  const tbody = $('#tbody');
  tbody.innerHTML = '';

  plays.forEach((p, i)=>{
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="small"><span class="badge">${escapeHtml(String(p.id))}</span></td>
      <td><input type="text" data-k="name" data-i="${i}" value="${escapeAttr(p.name)}" placeholder="Pl. 0 Bal"/></td>
      <td style="min-width:120px">
        <select data-k="vedekezes" data-i="${i}">
          <option value="">—</option>
          ${DEF.ved.map(v=>`<option ${p.vedekezes===v?'selected':''} value="${escapeAttr(v)}">${escapeHtml(v)}</option>`).join('')}
        </select>
      </td>
      <td style="min-width:170px">
        <select data-k="szituacio" data-i="${i}">
          <option value="">—</option>
          ${DEF.szitu.map(s=>`<option ${p.szituacio===s?'selected':''} value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join('')}
        </select>
      </td>
      <td>
        <input class="mediaPath" type="text" data-k="media" data-i="${i}" value="${escapeAttr(p.media)}" placeholder="assets/media/01_valami.mp4"/>
      </td>
      <td>
        <textarea data-k="description" data-i="${i}" placeholder="Kulcspontok...">${escapeHtml(p.description)}</textarea>
      </td>
      <td>
        <div class="rowActions">
          <button class="btn" data-act="dup" data-i="${i}">Duplikál</button>
          <button class="btn btnDanger" data-act="del" data-i="${i}">Töröl</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function exportJson(){
  const blob = new Blob([JSON.stringify(plays, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'plays.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
}

function importJson(file){
  const reader = new FileReader();
  reader.onload = ()=>{
    const parsed = safeParse(String(reader.result));
    if(!Array.isArray(parsed)){
      alert('Hiba: a fájl nem JSON tömb (array).');
      return;
    }
    plays = parsed.map(normalizePlay);
    save();
    render();
  };
  reader.readAsText(file);
}

function resetAll(){
  if(!confirm('Biztosan visszaállítod az aktuális böngészőben tárolt adatokat?')) return;
  localStorage.removeItem(LS_KEY);
  plays = [];
  boot();
}

function escapeHtml(s){
  return s
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}
function escapeAttr(s){
  return escapeHtml(s).replaceAll('\n','&#10;');
}

function attachHandlers(){
  // live edits
  document.addEventListener('input', (e)=>{
    const t = e.target;
    const k = t?.dataset?.k;
    const i = Number(t?.dataset?.i);
    if(!k || Number.isNaN(i)) return;
    plays[i][k] = t.value;
    save();
  });

  // actions
  document.addEventListener('click', (e)=>{
    const b = e.target.closest('button');
    if(!b) return;
    const act = b.dataset.act;
    const i = Number(b.dataset.i);
    if(!act || Number.isNaN(i)) return;

    if(act==='dup'){
      const copy = {...plays[i], id: (Math.max(...plays.map(p=>Number(p.id)||0)) + 1)};
      plays.splice(i+1, 0, copy);
      save();
      render();
    }
    if(act==='del'){
      if(!confirm('Törlöd ezt a sort?')) return;
      plays.splice(i,1);
      save();
      render();
    }
  });

  $('#btnAdd').addEventListener('click', ()=>{
    plays.unshift(newEmpty());
    save();
    render();
    window.scrollTo({top:0, behavior:'smooth'});
  });

  $('#btnExport').addEventListener('click', exportJson);

  const file = $('#fileImport');
  const btnImport = $('#btnImport');
  file.addEventListener('change', ()=>{
    btnImport.disabled = !file.files || !file.files[0];
  });
  btnImport.addEventListener('click', ()=>{
    if(!file.files || !file.files[0]) return;
    importJson(file.files[0]);
  });

  $('#btnReset').addEventListener('click', resetAll);
}

async function boot(){
  // 1) try LocalStorage
  const fromLS = loadFromLocalStorage();
  if(fromLS && fromLS.length){
    plays = fromLS;
    render();
    return;
  }

  // 2) try plays.json
  try{
    const fromFile = await loadFromFile();
    plays = fromFile;
    save();
    render();
  }catch(err){
    // 3) empty fallback
    plays = [];
    render();
    console.warn('Could not load plays.json for editor:', err);
  }
}

// init
attachHandlers();
boot();
