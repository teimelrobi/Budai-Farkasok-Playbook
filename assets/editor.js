const PLAY_KEY='bf_adult_playbook_v2', FOLDER_KEY='bf_adult_playbook_folders_v1';
const CATS=['Felállt fal elleni támadás','Lerohanás','Visszarendeződés','Védekezés','7:6','Emberelőny','Emberhátrány','Speciális'];
const DEFENSES=['6:0','5:1','3:2:1','4:2','3:3','5+1','Egyéb'];
let items=[],folders=[];
const el=id=>document.getElementById(id);
const normalize=p=>({id:String(p.id||('m'+Date.now()+Math.random().toString(36).slice(2,8))),name:String(p.name||''),category:String(p.category||''),folder:String(p.folder||''),defense:String(p.defense||''),tags:Array.isArray(p.tags)?p.tags.map(String):[],video:String(p.video||p.media||''),tacticalVideo:String(p.tacticalVideo||''),description:String(p.description||'')});
function save(){localStorage.setItem(PLAY_KEY,JSON.stringify(items));localStorage.setItem(FOLDER_KEY,JSON.stringify(folders));el('status').textContent=items.length+' mozgás · '+folders.length+' mappa · helyi mentés'}
function input(label,value,cb,choices=null,kind='text'){
 const wrap=document.createElement('label');wrap.textContent=label;let control;
 if(kind==='textarea'){control=document.createElement('textarea');control.value=value}
 else if(choices){control=document.createElement('select');[...new Set(['',...choices,...(value&&!choices.includes(value)?[value]:[])])].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v||'— nincs kiválasztva —';control.append(o)});control.value=value}
 else{control=document.createElement('input');control.type='text';control.value=value}
 control.addEventListener(choices?'change':'input',()=>cb(control.value));wrap.append(control);return wrap;
}
function renderFolders(){
 const root=el('folderItems');root.replaceChildren();
 for(const name of folders){
  const row=document.createElement('div');row.className='folder-edit-item';
  const field=document.createElement('input');field.value=name;field.setAttribute('aria-label','Mappa átnevezése');
  field.addEventListener('change',()=>{
   const next=field.value.trim();if(!next||folders.some(n=>n!==name&&n.toLowerCase()===next.toLowerCase())){alert('Üres vagy már létező mappanév.');field.value=name;return}
   folders=folders.map(n=>n===name?next:n);items.forEach(p=>{if(p.folder===name)p.folder=next});save();render();
  });
  const del=document.createElement('button');del.type='button';del.className='btn danger';del.textContent='Törlés';
  del.addEventListener('click',()=>{
   if(!confirm('Törlöd a(z) '+name+' mappát? A hozzá tartozó mozgások megmaradnak, de mappa nélkül.'))return;
   folders=folders.filter(n=>n!==name);items.forEach(p=>{if(p.folder===name)p.folder=''});save();render()
  });row.append(field,del);root.append(row);
 }
 if(!folders.length){const hint=document.createElement('p');hint.className='hint';hint.textContent='Még nincs saját mappa. Az elsőt a fenti mezővel hozhatod létre.';root.append(hint)}
}
function render(){
 renderFolders();
 const root=el('items');root.replaceChildren();
 if(!items.length){const p=document.createElement('p');p.className='hint';p.textContent='Még nincs mozgás. Kattints az „Új mozgás” gombra.';root.append(p)}
 items.forEach((p,i)=>{
  const card=document.createElement('section');card.className='edit-card';
  const grid=document.createElement('div');grid.className='formgrid';
  const field=(label,value,key,choices=null,kind='text')=>grid.append(input(label,value,v=>{p[key]=v;save()},choices,kind));
  field('Mozgás neve',p.name,'name');field('Kategória',p.category,'category',CATS);
  field('Saját mappa',p.folder,'folder',folders);field('Védekezési forma',p.defense,'defense',DEFENSES);
  const tags=input('Címkék (vesszővel elválasztva)',p.tags.join(', '),v=>{p.tags=v.split(',').map(s=>s.trim()).filter(Boolean);save()});tags.classList.add('wide');grid.append(tags);
  field('Valódi videó URL / elérési út',p.video,'video');field('Animált taktikai videó URL / elérési út',p.tacticalVideo,'tacticalVideo');
  const desc=input('Edzői leírás',p.description,v=>{p.description=v;save()},null,'textarea');desc.classList.add('wide');grid.append(desc);card.append(grid);
  const actions=document.createElement('div');actions.className='actions';actions.style.marginTop='14px';
  const dup=document.createElement('button');dup.type='button';dup.className='btn';dup.textContent='Másolat';dup.onclick=()=>{items.splice(i+1,0,{...p,id:'m'+Date.now(),tags:[...p.tags]});save();render()};
  const del=document.createElement('button');del.type='button';del.className='btn danger';del.textContent='Törlés';del.onclick=()=>{if(confirm('Biztosan törlöd ezt a mozgást?')){items.splice(i,1);save();render()}};
  actions.append(dup,del);card.append(actions);root.append(card);
 });save();
}
async function fetchJson(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error('Nem érhető el: '+path);return r.json()}
async function loadPublished(){
 const [plays,names]=await Promise.all([fetchJson('assets/data/plays.json'),fetchJson('assets/data/folders.json')]);
 if(!Array.isArray(plays)||!Array.isArray(names))throw Error('Hibás JSON-formátum');
 items=plays.map(normalize);folders=[...new Set(names.filter(n=>typeof n==='string').map(n=>n.trim()).filter(Boolean))];render();
}
function exportJson(data,name){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
async function readArray(file){const data=JSON.parse(await file.text());if(!Array.isArray(data))throw Error('A JSON nem lista');return data}
el('addFolder').onclick=()=>{
 const name=el('newFolder').value.trim();if(!name)return;
 if(folders.some(n=>n.toLowerCase()===name.toLowerCase())){alert('Ez a mappa már létezik.');return}
 folders.push(name);el('newFolder').value='';render();
};
el('newFolder').addEventListener('keydown',e=>{if(e.key==='Enter')el('addFolder').click()});
el('add').onclick=()=>{items.unshift(normalize({name:'',category:'Felállt fal elleni támadás'}));render()};
el('export').onclick=()=>exportJson(items,'plays.json');
el('exportFolders').onclick=()=>exportJson(folders,'folders.json');
el('import').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=await readArray(file);if(confirm('Felülírod a helyi mozgáslistát?')){items=data.map(normalize);render()}}catch(err){alert('Import hiba: '+err.message)}finally{e.target.value=''}};
el('importFolders').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=await readArray(file);if(data.some(n=>typeof n!=='string'))throw Error('A mappanevek szövegek legyenek');if(confirm('Felülírod a helyi mappalistát?')){folders=[...new Set(data.map(n=>n.trim()).filter(Boolean))];render()}}catch(err){alert('Import hiba: '+err.message)}finally{e.target.value=''}};
el('reset').onclick=async()=>{if(!confirm('Visszatöltöd a weboldalon publikált adatokat? A helyi módosítások elvesznek.'))return;try{await loadPublished()}catch(e){alert(e.message)}};
(async()=>{try{
 const raw=localStorage.getItem(PLAY_KEY),rawFolders=localStorage.getItem(FOLDER_KEY);
 if(raw!==null||rawFolders!==null){
  if(raw===null){const data=await fetchJson('assets/data/plays.json');items=data.map(normalize)}else items=JSON.parse(raw).map(normalize);
  if(rawFolders===null){folders=await fetchJson('assets/data/folders.json')}else folders=JSON.parse(rawFolders);
  if(!Array.isArray(folders))folders=[];folders=[...new Set(folders.filter(n=>typeof n==='string').map(n=>n.trim()).filter(Boolean))];render();
 }else await loadPublished()
}catch(e){el('status').textContent='Hiba a betöltésnél: '+e.message}})();