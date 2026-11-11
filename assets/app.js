const CATEGORIES=['Felállt fal elleni támadás','Lerohanás','Visszarendeződés','Védekezés','7:6','Emberelőny','Emberhátrány','Speciális'];
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
  const r=await fetch('assets/data/plays.json',{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);
  const data=await r.json();if(!Array.isArray(data))throw Error('JSON format');
  const plays=data.filter(p=>p&&typeof p==='object'&&p.name);
  const categories=[...new Set([...CATEGORIES,...plays.map(p=>p.category).filter(Boolean)])];
  categories.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;$('category').append(o)});
  const render=()=>{
   const q=$('query').value.toLocaleLowerCase('hu').trim(),cat=$('category').value;
   const filtered=plays.filter(p=>(!cat||p.category===cat)&&(!q||[p.name,p.category,p.description,...(Array.isArray(p.tags)?p.tags:[])].join(' ').toLocaleLowerCase('hu').includes(q)));
   $('list').replaceChildren(...filtered.map(playCard));
   $('count').textContent=filtered.length+' mozgás';
   $('empty').hidden=filtered.length!==0;
   $('empty').querySelector('h3').textContent=plays.length?'Nincs találat':'Még nincs feltöltött mozgás';
   $('empty').querySelector('p').textContent=plays.length?'Próbálj más keresést vagy kategóriát.':'Hamarosan itt jelennek meg a felnőtt csapat taktikai anyagai: valódi videó, animált taktikai videó és leírás.';
  };
  $('query').addEventListener('input',render);$('category').addEventListener('change',render);render();
 }catch(err){console.error(err);$('error').hidden=false;}
})();