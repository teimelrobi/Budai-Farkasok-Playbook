const STORAGE_KEY = 'playbook_editor_v1';

const DEFENSES = ['', '6:0', '5:1'];
const SITUATIONS = ['', '6:6', 'Emberelőny', 'Emberhátrány', 'Lerohanás', '7:6 játék'];
const PHASES = ['', 'Támadás', 'Védekezés', 'Lerohanás'];

function $(id){ return document.getElementById(id); }

function safeJsonParse(txt){
  try{ return JSON.parse(txt); }catch(e){ return null; }
}

function download(filename, text){
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
}

async function loadFromRepo(){
  const res = await fetch('assets/data/plays.json', { cache: 'no-store' });
  return await res.json();
}

function normalize(plays){
  if(!Array.isArray(plays)) return [];
  return plays.map((p, idx)=>({
    id: (p.id ?? String(idx+1).padStart(2,'0')),
    name: p.name ?? '',
    defense: p.defense ?? '',
    situation: p.situation ?? '',
    phase: p.phase ?? '',
    media: p.media ?? 'assets/media/',
    description: p.description ?? ''
  }));
}

function saveLocal(plays){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plays));
}

function loadLocal(){
  const txt = localStorage.getItem(STORAGE_KEY);
  if(!txt) return null;
  return safeJsonParse(txt);
}

function optionList(values, current){
  return values.map(v=>`<option value="${escapeHtml(v)}"${v===current?' selected':''}>${escapeHtml(v || '—')}</option>`).join('');
}

function escapeHtml(s){
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

function rowHtml(p, i){
  return `
  <tr data-i="${i}">
    <td><input class="input" data-k="id" value="${escapeHtml(p.id)}" /></td>
    <td><input class="input" data-k="name" value="${escapeHtml(p.name)}" placeholder="pl. Fatek" /></td>
    <td><select class="select" data-k="defense">${optionList(DEFENSES, p.defense)}</select></td>
    <td><select class="select" data-k="situation">${optionList(SITUATIONS, p.situation)}</select></td>
    <td><select class="select" data-k="phase">${optionList(PHASES, p.phase)}</select></td>
    <td>
      <div style="display:flex; gap:6px; align-items:center">
        <input class="input" data-k="media" value="${escapeHtml(p.media)}" placeholder="assets/media/01_fatek.mp4" />
        <button class="smallbtn" type="button" data-act="prefix">+assets</button>
      </div>
    </td>
    <td><textarea class="textarea" data-k="description" placeholder="Kulcspontok...">${escapeHtml(p.description)}</textarea></td>
    <td>
      <div class="actions">
        <button class="smallbtn dup" type="button" data-act="dup">Duplikál</button>
        <button class="smallbtn danger" type="button" data-act="del">Töröl</button>
      </div>
    </td>
  </tr>`;
}

function render(plays){
  $('tbody').innerHTML = plays.map(rowHtml).join('');
}

function readTable(){
  return Array.from(document.querySelectorAll('#tbody tr')).map(tr=>{
    const get = (k)=> (tr.querySelector(`[data-k="${k}"]`)?.value ?? '');
    return {
      id: get('id').trim(),
      name: get('name').trim(),
      defense: get('defense').trim(),
      situation: get('situation').trim(),
      phase: get('phase').trim(),
      media: get('media').trim(),
      description: get('description')
    };
  });
}

function addOne(plays){
  const next = String(plays.length + 1).padStart(2,'0');
  plays.push({ id: next, name: '', defense: '', situation: '', phase: '', media: `assets/media/${next}_`, description: '' });
  return plays;
}

function duplicateAt(plays, idx){
  const p = plays[idx];
  const next = String(plays.length + 1).padStart(2,'0');
  plays.splice(idx+1, 0, { ...p, id: next, name: (p.name ? p.name + ' (másolat)' : '' ) });
  return plays;
}

function deleteAt(plays, idx){
  plays.splice(idx,1);
  return plays;
}

function handleTableClick(e){
  const btn = e.target.closest('button[data-act]');
  if(!btn) return;
  const tr = e.target.closest('tr');
  const idx = Number(tr.getAttribute('data-i'));
  let plays = readTable();
  const act = btn.getAttribute('data-act');

  if(act === 'del') plays = deleteAt(plays, idx);
  if(act === 'dup') plays = duplicateAt(plays, idx);
  if(act === 'prefix'){
    const input = tr.querySelector('[data-k="media"]');
    const v = input.value.trim();
    if(v && !v.startsWith('assets/')) input.value = 'assets/media/' + v;
    else if(!v) input.value = 'assets/media/';
    plays = readTable();
  }

  saveLocal(plays);
  render(plays);
}

function autoSave(){
  saveLocal(readTable());
}

(async function main(){
  let plays = loadLocal();
  if(!plays){
    plays = normalize(await loadFromRepo());
  }else{
    plays = normalize(plays);
  }
  render(plays);

  $('add').addEventListener('click', ()=>{
    let current = readTable();
    current = addOne(current);
    saveLocal(current);
    render(current);
  });

  $('export').addEventListener('click', ()=>{
    const cleaned = normalize(readTable());
    download('plays.json', JSON.stringify(cleaned, null, 2));
  });

  $('import').addEventListener('change', async (e)=>{
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    const txt = await f.text();
    const parsed = safeJsonParse(txt);
    if(!parsed){ alert('Nem tudtam beolvasni a JSON-t.'); return; }
    const cleaned = normalize(parsed);
    saveLocal(cleaned);
    render(cleaned);
    e.target.value = '';
  });

  $('reset').addEventListener('click', async ()=>{
    if(!confirm('Visszaállítsam a repo plays.json alapján? A helyi változtatások elvésznek.')) return;
    const repoPlays = normalize(await loadFromRepo());
    saveLocal(repoPlays);
    render(repoPlays);
  });

  $('tbody').addEventListener('click', handleTableClick);
  $('tbody').addEventListener('input', autoSave);

})().catch(err=>{
  console.error(err);
  alert('Hiba a szerkesztő betöltésénél. Nyisd meg F12 konzolt.');
});
