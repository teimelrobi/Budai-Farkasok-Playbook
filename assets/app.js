const CATEGORIES=['Felállt fal elleni támadás','Lerohanás','Visszarendeződés','Védekezés','7:6','Emberelőny','Emberhátrány','Speciális'];
const DEFENSES=['6:0','5:1','3:2:1','4:2','3:3','5+1','Egyéb'];
const $=id=>document.getElementById(id);
const safe=s=>String(s??'').trim();
function videoBlock(title,src){
 const block=document.createElement('div');block.className='video-panel';
 const label=document.createElement('h4');label.textContent=title;block.append(label);
 const wrap=document.createElement('div');wrap.className='video-wrap';
 if(src){
   const video=document.createElement('video');video.controls=true;video.playsInline=true;video.preload='metadata';video.src=src;wrap.append(video);
 }else{const placeholder=document.createElement('div');placeholder.className='placeholder';placeholder.textContent='Videó hamarosan';wrap.append(placeholder);}
 block.append(wrap);return block;
}
function playCard(play){
 const card=document.createElement('article');card.className='play-card';
 const top=document.createElement('div');top.className='play-top';
 const labels=document.createElement('div');labels.className='labels';
 const cat=document.createElement('span');cat.className='pill';cat.textContent=play.category||'Egyéb';labels.append(cat);
 (Array.isArray(play.tags)?play.tags:[]).forEach(t=>{const tag=document.createElement('span');tag.className='tag';tag.textContent=t;labels.append(tag)});
 if(play.folder){const folder=document.createElement('span');folder.className='tag';folder.textContent='📁 '+play.folder;labels.append(folder)}
 if(play.defense){const defense=document.createElement('span');defense.className='tag';defense.textContent='Védekezés: '+play.defense;labels.append(defense)}
 const title=document.createElement('h3');title.textContent=play.name||'Névtelen mozgás';top.append(labels,title);
 const body=document.createElement('div');body.className='play-body';
 const videos=document.createElement('div');videos.className='video-grid';
 videos.append(videoBlock('Mérkőzés / edzésvideó',safe(play.video||play.media)),videoBlock('Animált taktikai videó',safe(play.tacticalVideo)));
 const desc=document.createElement('section');desc.className='description';
 const h=document.createElement('h4');h.textContent='Edzői leírás';const p=document.createElement('p');p.textContent=play.description||'A mozgáshoz még nincs leírás.';desc.append(h,p);
 body.append(videos,desc);card.append(top,body);return card;
}
(async()=>{
 try{
  const [playResponse,folderResponse]=await Promise.all([
    fetch('assets/data/plays.json',{cache:'no-store'}),
    fetch('assets/data/folders.json',{cache:'no-store'})
  ]);
  if(!playResponse.ok)throw Error('Mozgások nem elérhetők');
  const data=await playResponse.json();if(!Array.isArray(data))throw Error('Hibás mozgáslista');
  const savedFolders=folderResponse.ok?await folderResponse.json():[];
  const folders=Array.isArray(savedFolders)?savedFolders.filter(x=>typeof x==='string'&&x.trim()):[];
  const plays=data.filter(p=>p&&typeof p==='object'&&p.name);
  const categories=[...new Set([...CATEGORIES,...plays.map(p=>p.category).filter(Boolean)])];
  const allFolders=[...new Set([...folders,...plays.map(p=>p.folder).filter(Boolean)])];
  const defenses=[...new Set([...DEFENSES,...plays.map(p=>p.defense).filter(Boolean)])];
  function options(id,values){values.forEach(v=>{const option=document.createElement('option');option.value=v;option.textContent=v;$(id).append(option)})}
  options('category',categories);options('folder',allFolders);options('defense',defenses);
  const nav=$('folderNav');
  const makeNavButton=(label,value)=>{
    const button=document.createElement('button');button.type='button';button.className='folder-button';button.textContent=label;button.dataset.folder=value;
    button.addEventListener('click',()=>{$('folder').value=value;render()});return button;
  };
  nav.append(makeNavButton('Összes mozgás',''));
  allFolders.forEach(folder=>nav.append(makeNavButton('📁 '+folder,folder)));
  const render=()=>{
   const q=$('query').value.toLocaleLowerCase('hu').trim(),cat=$('category').value,folder=$('folder').value,defense=$('defense').value;
   const filtered=plays.filter(p=>(!cat||p.category===cat)&&(!folder||p.folder===folder)&&(!defense||p.defense===defense)&&(!q||[p.name,p.category,p.folder,p.defense,p.description,...(Array.isArray(p.tags)?p.tags:[])].join(' ').toLocaleLowerCase('hu').includes(q)));
   $('list').replaceChildren(...filtered.map(playCard));
   $('count').textContent=filtered.length+' mozgás';
   $('empty').hidden=filtered.length!==0;
   $('empty').querySelector('h3').textContent=plays.length?'Nincs találat':'Még nincs feltöltött mozgás';
   $('empty').querySelector('p').textContent=plays.length?'Próbálj más keresést, mappát vagy védekezési formát.':'A saját mappák elkészültek. Hamarosan itt jelennek meg a felnőtt csapat taktikai videói és leírásai.';
   nav.querySelectorAll('.folder-button').forEach(b=>b.classList.toggle('active',b.dataset.folder===folder));
  };
  ['query','category','folder','defense'].forEach(id=>$(id).addEventListener(id==='query'?'input':'change',render));
  render();
 }catch(err){console.error(err);$('error').hidden=false;}
})();