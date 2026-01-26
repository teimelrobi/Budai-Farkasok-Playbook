const DEFENSES = ["", "6:0", "5:1"]; // "" = Mind / üres
const SITUATIONS = [
  "",
  "Támadás",
  "Védekezés",
  "Lerohanás",
  "Visszarendeződés",
  "Létszámfölény",
  "Létszámhátrány",
];

// Gyakori elírások automatikus javítása
const SITUATION_FIX = {
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
  if(SITUATION_FIX[key]) return SITUATION_FIX[key];
  // "fuzzy" fix: nehogy elütés maradjon (pl. Lerihanás)
  if(key.includes('leriha') || key.includes('lariha') || key.includes('lerih')){
    return "Lerohanás";
  }
  const hit = SITUATIONS.find(v => v && v.toLowerCase() === key);
  return hit || t;
}

function normalizeDefense(s){
  const t = normStr(s);
  if(!t) return "";
  const key = t.replace(/[\.-]/g,":").replace(/\s+/g,"");
  if(key === "6:0") return "6:0";
  if(key === "5:1") return "5:1";
  return t;
}

function normalizePlay(p){
  return {
    id: normStr(p.id) || crypto.randomUUID().slice(0,8),
    name: normStr(p.name),
    defense: normalizeDefense(p.defense),
    situation: normalizeSituation(p.situation),
    media: normStr(p.media),
    description: (p.description ?? "").toString(),
  };
}

const LS_KEY = 'handball_playbook_editor_v1';

const els = {
  add: document.getElementById('add'),
  exp: document.getElementById('export'),
  imp: document.getElementById('import'),
  reset: document.getElementById('reset'),
  tbody: document.getElementById('tbody'),
};

function loadFromStorage(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return null;
    const arr = JSON.parse(raw);
    if(!Array.isArray(arr)) return null;
    return arr.map(normalizePlay);
  }catch(e){
    return null;
  }
}

function saveToStorage(plays){
  localStorage.setItem(LS_KEY, JSON.stringify(plays, null, 2));
}

let plays = loadFromStorage() || [];

function optionList(values, selected){
  return values.map(v => {
    const label = v === "" ? "" : v;
    const sel = (v === selected) ? ' selected' : '';
    return `<option value="${escapeHtml(v)}"${sel}>${escapeHtml(label || '—')}</option>`;
  }).join('');
}

function escapeHtml(s){
  return (s ?? '').toString()
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function render(){
  els.tbody.innerHTML = '';

  plays.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="in small" data-k="id" data-i="${idx}" value="${escapeHtml(p.id)}" /></td>
      <td><input class="in" data-k="name" data-i="${idx}" value="${escapeHtml(p.name)}" placeholder="Pl. 0 Bal" /></td>
      <td>
        <select class="in" data-k="defense" data-i="${idx}">
          ${optionList(DEFENSES, p.defense)}
        </select>
      </td>
      <td>
        <select class="in" data-k="situation" data-i="${idx}">
          ${optionList(SITUATIONS, p.situation)}
        </select>
      </td>
      <td>
        <div class="media-cell">
          <input class="in" data-k="media" data-i="${idx}" value="${escapeHtml(p.media)}" placeholder="assets/media/01_fatek.mp4" />
          <button class="btn mini ghost" data-act="prefix" data-i="${idx}">+assets</button>
        </div>
      </td>
      <td><textarea class="in ta" data-k="description" data-i="${idx}" rows="3" placeholder="Kulcspontok...">${escapeHtml(p.description)}</textarea></td>
      <td>
        <div class="row-actions">
          <button class="btn mini" data-act="dup" data-i="${idx}">Duplikál</button>
          <button class="btn mini danger" data-act="del" data-i="${idx}">Töröl</button>
        </div>
      </td>
    `;

    els.tbody.appendChild(tr);
  });
}

function addOne(){
  const base = {
    id: crypto.randomUUID().slice(0,8),
    name: '',
    defense: '',
    situation: '',
    media: '',
    description: '',
  };
  plays.unshift(base);
  saveToStorage(plays);
  render();
}

function duplicateAt(i){
  const p = plays[i];
  const copy = { ...p, id: crypto.randomUUID().slice(0,8) };
  plays.splice(i+1, 0, copy);
  saveToStorage(plays);
  render();
}

function deleteAt(i){
  plays.splice(i, 1);
  saveToStorage(plays);
  render();
}

function updateField(i, k, v){
  const p = plays[i];
  if(!p) return;
  if(k === 'situation') v = normalizeSituation(v);
  if(k === 'defense') v = normalizeDefense(v);
  p[k] = v;
  saveToStorage(plays);
}

function exportJson(){
  // export előtt normalizálunk, hogy ne menjen ki elírás
  const out = plays.map(normalizePlay);
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'plays.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJson(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const arr = JSON.parse(reader.result);
      if(!Array.isArray(arr)) throw new Error('Nem tömb a JSON');
      plays = arr.map(normalizePlay);
      saveToStorage(plays);
      render();
      alert('Import kész. (Mentve LocalStorage)');
    }catch(e){
      alert('Import hiba: ' + e.message);
    }
  };
  reader.readAsText(file);
}

els.add.addEventListener('click', addOne);
els.exp.addEventListener('click', exportJson);
els.reset.addEventListener('click', () => {
  if(confirm('Biztosan törlöd a szerkesztőben mentett adatokat?')){
    localStorage.removeItem(LS_KEY);
    plays = [];
    render();
  }
});
els.imp.addEventListener('change', (e) => {
  const f = e.target.files?.[0];
  if(f) importJson(f);
  e.target.value = '';
});

els.tbody.addEventListener('input', (e) => {
  const el = e.target;
  const i = Number(el.dataset.i);
  const k = el.dataset.k;
  if(!k) return;
  updateField(i, k, el.value);
});

els.tbody.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  const act = btn.dataset.act;
  const i = Number(btn.dataset.i);

  if(act === 'dup') return duplicateAt(i);
  if(act === 'del') return deleteAt(i);
  if(act === 'prefix'){
    const p = plays[i];
    if(!p) return;
    if(p.media && !p.media.startsWith('assets/')){
      p.media = 'assets/' + p.media.replace(/^\/+/, '');
      saveToStorage(plays);
      render();
    }
  }
});

// első render + auto-normalizálás a már mentett adaton
plays = plays.map(normalizePlay);
saveToStorage(plays);
render();
