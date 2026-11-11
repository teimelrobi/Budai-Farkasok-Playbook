const KEY='bf_adult_playbook_v2';const CATS=['Felállt fal elleni támadás','Lerohanás','Visszarendeződés','Védekezés','7:6','Emberelőny','Emberhátrány','Speciális'];
let items=[];const el=id=>document.getElementById(id);
const normalize=p=>({id:String(p.id||('m'+Date.now()+Math.random().toString(36).slice(2,6))),name:String(p.name||''),category:String(p.category||''),tags:Array.isArray(p.tags)?p.tags.map(String):[],video:String(p.video||p.media||''),tacticalVideo:String(p.tacticalVideo||''),description:String(p.description||'')});
function save(){localStorage.setItem(KEY,JSON.stringify(items));el('status').textContent=items.length+' mozgás a szerkesztőben · helyi mentés'}
function input(label,value,cb,kind='text'){
 const wrap=document.createElement('label');wrap.textContent=label;let control;
 if(kind==='textarea'){control=document.createElement('textarea');control.value=value}
 else if(kind==='category'){control=document.createElement('select');['',...CATS,...(value&&!CATS.includes(value)?[value]:[])].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v||'Válassz kategóriát';control.append(o)});control.value=value}
 else{control=document.createElement('input');control.type='text';control.value=value}
 control.addEventListener(kind==='category'?'change':'input',()=>cb(control.value));wrap.append(control);return wrap;
}
function render(){
 const root=el('items');root.replaceChildren();
 if(!items.length){const p=document.createElement('p');p.className='hint';p.textContent='Még nincs mozgás. Kattints az „Új mozgás” gombra.';root.append(p)}
 items.forEach((p,i)=>{
 const card=document.createElement('section');card.className='edit-card';
 const grid=document.createElement('div');grid.className='formgrid';
 const field=(label,value,key,kind='text')=>grid.append(input(label,value,v=>{p[key]=v;save()},kind));
 field('Mozgás neve',p.name,'name');field('Kategória',p.category,'category','category');
 const tags=input('Címkék (vesszővel elválasztva)',p.tags.join(', '),v=>{p.tags=v.split(',').map(s=>s.trim()).filter(Boolean);save()});tags.classList.add('wide');grid.append(tags);
 field('Valódi videó URL / elérési út',p.video,'video');field('Animált taktikai videó URL / elérési út',p.tacticalVideo,'tacticalVideo');
 const desc=input('Edzői leírás',p.description,v=>{p.description=v;save()},'textarea');desc.classList.add('wide');grid.append(desc);card.append(grid);
 const actions=document.createElement('div');actions.className='actions';actions.style.marginTop='14px';
 const dup=document.createElement('button');dup.className='btn';dup.textContent='Másolat';dup.onclick=()=>{items.splice(i+1,0,{...p,id:'m'+Date.now(),tags:[...p.tags]});save();render()};
 const del=document.createElement('button');del.className='btn danger';del.textContent='Törlés';del.onclick=()=>{if(confirm('Biztosan törlöd ezt a mozgást?')){items.splice(i,1);save();render()}};actions.append(dup,del);card.append(actions);root.append(card);
 });save();
}
async function loadPublished(){const r=await fetch('assets/data/plays.json',{cache:'no-store'});if(!r.ok)throw Error('Adatfájl nem elérhető');const data=await r.json();if(!Array.isArray(data))throw Error('Hibás formátum');return data.map(normalize)}
function exportJson(){const blob=new Blob([JSON.stringify(items,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='plays.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
el('add').onclick=()=>{items.unshift(normalize({name:'',category:''}));render()};
el('export').onclick=exportJson;
el('import').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data))throw Error('A JSON nem lista');if(!confirm('A jelenlegi helyi listát felülírod az importált adatokkal?'))return;items=data.map(normalize);render()}catch(err){alert('Import hiba: '+err.message)}finally{e.target.value=''}};
el('reset').onclick=async()=>{if(!confirm('Visszatöltöd a weboldalon jelenleg publikált adatokat? A helyi módosítások elvesznek.'))return;try{items=await loadPublished();render()}catch(e){alert(e.message)}};
(async()=>{try{const raw=localStorage.getItem(KEY);items=raw?JSON.parse(raw).map(normalize):await loadPublished();render()}catch(e){el('status').textContent='Hiba a betöltésnél: '+e.message}})();