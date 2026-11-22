/* Preserve the player's place while updating a prop, puzzle or casework panel. */
function viewKey17(){
  if(run.step===2)return `2:${run.callerActive||run.caller}:${run.pickedUp}:${run.part}`;
  if(run.step===7){
    if(run.route==='child')return `7:child:${game14('child').revealed===3&&!game14('child').childMatched?'identify':'messages'}`;
    if(run.route==='family')return `7:family:${game14('family').phase}`;
    return `7:${run.route}`;
  }
  if(run.step===13)return `13:${run.todayPage||0}`;
  return `${run.step}:${run.part||0}:${!!run.intro}`;
}
const SCROLL_PANELS17=['.telephone-reader','.field-device','.today-device','.archive-folder','.scene-caption'];
// Picking up the handset opens its reader directly, without going through render().
const personCallBefore17=personCall;
personCall=function(world){personCallBefore17(world);world.dataset.viewKey17=viewKey17();};
function captureView17(){
  const world=$('main').querySelector('.world');
  if(!world)return null;
  const panels=SCROLL_PANELS17.map(selector=>{
    const node=world.querySelector(selector);
    if(!node)return null;
    const open=Array.from(node.querySelectorAll('details')).map(d=>({label:d.querySelector('summary')?.textContent,open:d.open}));
    return {selector,top:node.scrollTop,left:node.scrollLeft,open};
  }).filter(Boolean);
  return {key:world.dataset.viewKey17,panels};
}
function restoreView17(snapshot,world){
  if(!snapshot||snapshot.key!==world.dataset.viewKey17)return;
  snapshot.panels.forEach(saved=>{
    const node=world.querySelector(saved.selector);
    if(!node)return;
    node.querySelectorAll('details').forEach(d=>{
      const match=saved.open.find(item=>item.label===d.querySelector('summary')?.textContent);
      if(match)d.open=match.open;
    });
    node.scrollTop=saved.top;
    node.scrollLeft=saved.left;
  });
}

/* Source metadata has its own quiet visual language, separate from story titles. */
source=function(parent,key){
  const info=NEWS_SOURCES[key],details=el('details','source source-card17');
  const summary=el('summary','source-summary17');
  summary.append(el('span','source-badge17','资料出处'),el('span','source-toggle17','查看来源'));
  const credit=el('p','source-credit17',info.name);
  const link=el('a','source-link17',info.title);
  link.href=info.url;link.target='_blank';link.rel='noopener noreferrer';
  details.append(summary,credit,link,el('small','source-note17','打开报道原文，将跳转至来源网站。'));
  parent.append(details);
};

/* Keep image-side paging and add navigation after the text, within thumb reach. */
todayView=function(world){
  world.append(art('desk'));
  const index=Math.min(2,Math.max(0,run.todayPage||0)),chapter=NOW_CHAPTER[index];
  const panel=el('article','today-device');
  function turn(page){run.todayPage=page;save();render();fx15('paper');}
  sidePager(panel,storyPicture(chapter.id),index,3,()=>turn(index-1),()=>turn(index+1));
  panel.append(el('span','file-label','如今的漳州110 · '+chapter.tag),el('h1','',chapter.title));
  chapter.text.forEach(text=>panel.append(el('p','',text)));
  source(panel,chapter.source);if(index===1)source(panel,'G');
  const nav=el('nav','reading-nav17');nav.setAttribute('aria-label','正文翻页');
  const previous=button('上一页','reading-prev17',()=>turn(index-1));previous.disabled=index===0;
  const next=button(index===2?'合上笔记，走向尾声':'下一页','reading-next17',()=>{
    if(index===2){run.finished=true;move(14);}else turn(index+1);
  });
  nav.append(previous,el('span','reading-page17',`${index+1} / 3`),next);panel.append(nav);world.append(panel);
};
backCover=todayView;

/* One scrollable case panel: messages start at their text, never at an image bottom. */
let chatFocus17=false;
document.addEventListener('click',event=>{
  if(event.target.closest?.('.route-child > .receive-message'))chatFocus17=true;
},true);
function decorateChild17(world){
  const panel=world.querySelector('.route-child'),log=world.querySelector('.child-live-chat');
  if(!panel||!log){chatFocus17=false;return;}
  const cue=el('div','message-scroll-cue17');
  cue.append(el('span','','上下滑动查看消息'),el('span','message-read-progress17'));
  const drawer=world.querySelector('.child-message-drawer');
  drawer.insertBefore(cue,log);
  const progress=cue.querySelector('.message-read-progress17');
  const update=()=>{
    const range=panel.scrollHeight-panel.clientHeight;
    const ratio=range>0?Math.max(0,Math.min(1,panel.scrollTop/range)):1;
    progress.textContent=ratio>.98?'已到本页末尾':`已读 ${Math.round(ratio*100)}%`;
    cue.style.setProperty('--read-progress17',`${Math.round(ratio*100)}%`);
  };
  panel.addEventListener('scroll',update,{passive:true});
  if(chatFocus17){
    const messages=log.querySelectorAll('.message'),latest=messages[messages.length-1];
    if(latest)panel.scrollTop+=latest.getBoundingClientRect().top-panel.getBoundingClientRect().top-54;
  }
  chatFocus17=false;update();
}

/* Pointer events provide real touch dragging; clicking remains an equal option. */
function bindUnitDrag17(world){
  const panel=world.querySelector('.route-govern'),target=world.querySelector('.dispatch-drop');
  if(!panel||!target)return;
  world.querySelectorAll('.unit-card').forEach((card,index)=>{
    const id=UNITS14[index][0];let drag=null,ignoreClickUntil=0,frame=0;
    const rectContains=(rect,x,y)=>x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;
    function paint(){
      if(!drag||!drag.moving)return;
      drag.ghost.style.left=drag.x+'px';drag.ghost.style.top=drag.y+'px';
      target.classList.toggle('drop-ready17',rectContains(target.getBoundingClientRect(),drag.x,drag.y));
      const rect=panel.getBoundingClientRect();
      if(drag.y>rect.bottom-52)panel.scrollTop+=9;
      else if(drag.y<rect.top+52)panel.scrollTop-=9;
      frame=requestAnimationFrame(paint);
    }
    function begin(event,x,y){
      if(drag)return;
      event.preventDefault();
      drag={x,y,startX:x,startY:y,moving:false,ghost:null};
      if(event.pointerId!==undefined)card.setPointerCapture?.(event.pointerId);
    }
    function moveDrag(event,x,y){
      if(!drag)return;event.preventDefault();drag.x=x;drag.y=y;
      if(!drag.moving&&Math.hypot(x-drag.startX,y-drag.startY)>8){
        drag.moving=true;drag.ghost=card.cloneNode(true);drag.ghost.classList.add('unit-drag-ghost17');
        drag.ghost.style.width=card.getBoundingClientRect().width+'px';drag.ghost.setAttribute('aria-hidden','true');
        document.body.append(drag.ghost);card.classList.add('unit-dragging17');fx15('pickup');paint();
      }
    }
    function end(event,cancelled=false){
      if(!drag)return;
      event.preventDefault();ignoreClickUntil=Date.now()+750;
      const valid=!drag.moving||rectContains(target.getBoundingClientRect(),drag.x,drag.y);
      drag.ghost?.remove();card.classList.remove('unit-dragging17');target.classList.remove('drop-ready17');
      cancelAnimationFrame(frame);drag=null;
      if(cancelled)return;
      if(!valid){fx15('error');toast('把卡片放到虚线办理区里。');return;}
      const result=assignUnit14(game14('govern'),id);
      if(!result.ok){fx15('error');toast(result.message);return;}
      save();render();fx15('drop');
    }
    card.addEventListener('click',event=>{
      if(Date.now()<ignoreClickUntil){event.preventDefault();event.stopImmediatePropagation();}
    },true);
    if('PointerEvent' in window){
      card.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse')begin(event,event.clientX,event.clientY);});
      card.addEventListener('pointermove',event=>moveDrag(event,event.clientX,event.clientY));
      card.addEventListener('pointerup',event=>end(event));
      card.addEventListener('pointercancel',event=>end(event,true));
    }else{
      card.addEventListener('touchstart',event=>{const touch=event.touches[0];if(touch)begin(event,touch.clientX,touch.clientY);},{passive:false});
      card.addEventListener('touchmove',event=>{const touch=event.touches[0];if(touch)moveDrag(event,touch.clientX,touch.clientY);},{passive:false});
      card.addEventListener('touchend',event=>end(event),{passive:false});
      card.addEventListener('touchcancel',event=>end(event,true),{passive:false});
    }
  });
}

const renderBefore17=render;
render=function(){
  const previous=captureView17();
  renderBefore17();
  const world=$('main').querySelector('.world');world.dataset.viewKey17=viewKey17();
  restoreView17(previous,world);
  bindUnitDrag17(world);
  requestAnimationFrame(()=>{
    if(!world.isConnected)return;
    restoreView17(previous,world);decorateChild17(world);
  });
  if(run.step===13)$('task-text').textContent='读完正文，可在下方翻页；第三页读完后，合上笔记进入尾声。';
};
render();
