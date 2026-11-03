const KEY='three-feathers-data',SK='three-feathers-coach',PW='4oj2pp0z9s';
const POS=['Goalkeeper','Defender','Midfielder','Forward'];
const ROUTES=['home','squad','leaders','fixtures','gallery'];
const hash=s=>{let a=0xdeadbeef,b=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,2654435761);b=Math.imul(b^c,1597334677)}a=Math.imul(a^(a>>>16),2246822507)^Math.imul(b^(b>>>13),3266489909);b=Math.imul(b^(b>>>16),2246822507)^Math.imul(a^(a>>>13),3266489909);return(4294967296*(2097151&b)+(a>>>0)).toString(36)};

function normalize(s){
  s=s&&typeof s==='object'?s:{};
  s.players=Array.isArray(s.players)?s.players:[];
  s.fixtures=Array.isArray(s.fixtures)?s.fixtures:[];
  s.gallery=Array.isArray(s.gallery)?s.gallery:[];
  s.club=Object.assign({about:'',training:'',pitch:'',contact:''},s.club);
  s.updated=s.updated||0;
  return s;
}
function attempt(fn,fallback){try{return fn()}catch(e){return fallback}}

const saved=attempt(()=>JSON.parse(localStorage.getItem(KEY)),null);
const seed=window.CLUB_DATA||{};
let state=normalize(saved&&(saved.updated||0)>(seed.updated||0)?saved:seed);
let coach=attempt(()=>sessionStorage.getItem(SK),null)==='1',open=null,filter='All',q='',pending=null,msg='';
const app=document.getElementById('app');
const coachBtn=document.getElementById('coachBtn');
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const route=()=>{const r=location.hash.slice(1);return ROUTES.includes(r)?r:'home'};

function h(tag,props,...kids){
  const el=document.createElement(tag);
  for(const k in props||{}){
    const v=props[k];
    if(k==='class')el.className=v;
    else if(k.startsWith('on'))el.addEventListener(k.slice(2),v);
    else if(v!==false&&v!=null)el.setAttribute(k,v===true?'':v);
  }
  for(const c of kids.flat())if(c!=null&&c!==false)el.append(c);
  return el;
}

const total=k=>state.players.reduce((n,p)=>n+p[k],0);

const initials=n=>n.split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const avatar=p=>p.photo?h('img',{class:'ava',src:p.photo,alt:'',loading:'lazy'}):h('div',{class:'ava'},initials(p.name));
const head=(t,l)=>[h('h2',null,t),h('p',{class:'lede'},l)];
const empty=t=>h('p',{class:'empty on-bg'},t);

function save(){
  state.updated=Date.now();
  try{localStorage.setItem(KEY,JSON.stringify(state))}
  catch(e){msg='Browser storage is full. Export your data, then remove some photos.'}
}
const touch=()=>{msg='';save();render()};

const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
async function shrink(file,max,square,quality){
  const img=new Image();
  img.src=await read(file);
  await img.decode();
  let sw=img.width,sh=img.height,sx=0,sy=0;
  if(square){const s=Math.min(sw,sh);sx=(sw-s)/2;sy=(sh-s)/2;sw=sh=s}
  const k=Math.min(1,max/Math.max(sw,sh)),c=document.createElement('canvas');
  c.width=Math.round(sw*k);c.height=Math.round(sh*k);
  c.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,c.width,c.height);
  return c.toDataURL('image/jpeg',quality);
}

function bump(p,k,d){p[k]=Math.max(0,p[k]+d);touch()}
function confirmRemove(id,list){
  if(pending!==id){pending=id;render();return}
  state[list]=state[list].filter(x=>x.id!==id);pending=null;touch();
}

const leaders=k=>state.players.filter(p=>p[k]>0).sort((a,b)=>b[k]-a[k]||a.name.localeCompare(b.name));

function board(title,key,unit){
  const list=leaders(key).slice(0,10),max=list.length?list[0][key]:1;
  return h('div',{class:'panel'},h('h3',null,title),
    list.length?list.map((p,i)=>h('div',{class:'row'+(i===0?' lead':'')},
      h('span',{class:'rank'},list.findIndex(x=>x[key]===p[key])+1),
      h('div',{class:'who'},h('strong',null,p.name),h('span',null,p.position)),
      h('span',{class:'val'},p[key]),
      h('div',{class:'bar'},h('i',{style:'width:'+Math.round(p[key]/max*100)+'%'}))))
    :h('p',{class:'empty'},'No '+unit+' recorded yet.'));
}

function spot(title,key){
  const p=leaders(key)[0];
  return h('div',{class:'panel'},h('h3',null,title),
    p?h('div',{class:'spot'},avatar(p),h('div',{class:'who'},h('strong',null,p.name),h('span',null,p.position)),h('span',{class:'val'},p[key]))
     :h('p',{class:'empty'},'Nothing recorded yet.'));
}

function counter(p,k,label){
  return h('div',{class:'ctl'},h('span',null,label),
    h('button',{class:'sm',type:'button','aria-label':'Remove one '+label.toLowerCase()+' from '+p.name,onclick:()=>bump(p,k,-1)},'−'),
    h('button',{class:'sm',type:'button','aria-label':'Add one '+label.toLowerCase()+' to '+p.name,onclick:()=>bump(p,k,1)},'+'));
}

function card(p){
  return h('article',{class:'card'},
    h('div',{class:'cardhead'},avatar(p),h('div',{class:'num'},p.number!==''?'#'+p.number:'')),
    h('h3',null,p.name),
    h('div',{class:'pos'},p.position),
    h('div',{class:'tally'},
      h('div',null,h('b',null,p.goals),h('span',null,'Goals')),
      h('div',null,h('b',null,p.assists),h('span',null,'Assists'))),
    coach?[counter(p,'goals','Goals'),counter(p,'assists','Assists'),
      h('button',{class:'rm',type:'button',onclick:()=>confirmRemove(p.id,'players')},pending===p.id?'Confirm remove':'Remove player')]:null);
}

function grid(){
  const t=q.trim().toLowerCase();
  const list=state.players
    .filter(p=>(filter==='All'||p.position===filter)&&(!t||p.name.toLowerCase().includes(t)||String(p.number)===t))
    .sort((a,b)=>a.name.localeCompare(b.name));
  if(!list.length)return [empty(state.players.length?'No players match that search.':(coach?'Add your first player above.':'The squad list is coming soon.'))];
  return list.map(card);
}

function playerForm(){
  const name=h('input',{required:true,maxlength:40,autocomplete:'off',placeholder:'Full name'});
  const num=h('input',{type:'number',min:0,max:99,placeholder:'Optional'});
  const pos=h('select',null,POS.map(x=>h('option',{value:x},x)));
  const photo=h('input',{type:'file',accept:'image/*'});
  return h('div',{class:'coach'},h('h3',null,'Add a player'),
    h('p',null,'Add the player’s details. The photo is optional.'),
    h('form',{onsubmit:async e=>{
      e.preventDefault();
      const n=name.value.trim();
      if(!n)return;
      const p={id:uid(),name:n,number:num.value===''?'':Math.max(0,Math.min(99,parseInt(num.value,10)||0)),position:pos.value,goals:0,assists:0,photo:''};
      let note='';
      if(photo.files[0]){
        try{p.photo=await shrink(photo.files[0],320,true,.8)}
        catch(err){note='The photo could not be read, so the player was added without one.'}
      }
      state.players.push(p);open=null;touch();
      if(note){msg=note;render()}
    }},
      h('label',null,'Player name',name),
      h('label',null,'Shirt number',num),
      h('label',null,'Position',pos),
      h('label',null,'Photo (optional)',photo),
      h('button',{class:'btn',type:'submit'},'Add player')));
}

const when=f=>{
  const d=new Date(f.date+'T00:00:00');
  return [d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'}),f.time,f.venue,f.home?'Home':'Away'].filter(Boolean).join(', ');
};
const upcoming=()=>state.fixtures.filter(f=>f.us===null).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));
const played=()=>state.fixtures.filter(f=>f.us!==null).sort((a,b)=>b.date.localeCompare(a.date));

function fixture(f){
  const d=new Date(f.date+'T00:00:00'),done=f.us!==null;
  const res=!done?null:f.us>f.them?['w','Win']:f.us<f.them?['l','Loss']:['d','Draw'];
  const us=h('input',{type:'number',min:0,'aria-label':'Three Feathers goals'});
  const them=h('input',{type:'number',min:0,'aria-label':f.opponent+' goals'});
  return h('article',{class:'fx'},
    h('div',{class:'when'},h('b',null,d.getDate()),h('span',null,d.toLocaleString('en-GB',{month:'short'})+' '+d.getFullYear())),
    h('div',null,h('h3',null,'Three Feathers v '+f.opponent),h('small',null,when(f))),
    done?h('div',{class:'resbox'},h('span',{class:'score'},f.us+' – '+f.them),h('span',{class:'res '+res[0]},res[1])):null,
    coach?h('div',{class:'rec'},
      !done?[h('span',null,'Final score'),us,h('span',null,'to'),them,
        h('button',{class:'sm wide-btn',type:'button',onclick:()=>{
          if(us.value===''||them.value==='')return;
          f.us=Math.max(0,parseInt(us.value,10)||0);f.them=Math.max(0,parseInt(them.value,10)||0);touch();
        }},'Save result')]:null,
      h('button',{class:'rm',type:'button',onclick:()=>confirmRemove(f.id,'fixtures')},pending===f.id?'Confirm remove':'Remove game')):null);
}

function fixtureForm(){
  const opp=h('input',{required:true,maxlength:50,placeholder:'Opponent'});
  const date=h('input',{type:'date',required:true});
  const time=h('input',{type:'time'});
  const venue=h('input',{maxlength:60,placeholder:'Pitch or ground'});
  const side=h('select',null,h('option',{value:'1'},'Home'),h('option',{value:'0'},'Away'));
  return h('div',{class:'coach'},h('h3',null,'Add a game'),
    h('p',null,'Add upcoming games here. Enter the final score after the match to move it to played games.'),
    h('form',{onsubmit:e=>{
      e.preventDefault();
      if(!opp.value.trim()||!date.value)return;
      state.fixtures.push({id:uid(),opponent:opp.value.trim(),date:date.value,time:time.value,venue:venue.value.trim(),home:side.value==='1',us:null,them:null});
      touch();
    }},
      h('label',null,'Opponent',opp),h('label',null,'Date',date),h('label',null,'Kick-off time',time),
      h('label',null,'Venue',venue),h('label',null,'Home or away',side),
      h('button',{class:'btn',type:'submit'},'Add game')));
}

function photoForm(){
  const cap=h('input',{maxlength:80,placeholder:'For example: Final against Rovers'});
  const files=h('input',{type:'file',accept:'image/*',multiple:true,required:true});
  return h('div',{class:'coach'},h('h3',null,'Add match photos'),
    h('p',null,'Choose one or more photos. They are resized to save space.'),
    h('form',{onsubmit:async e=>{
      e.preventDefault();
      const list=[...files.files],caption=cap.value.trim();
      if(!list.length)return;
      try{for(const f of list)state.gallery.unshift({id:uid(),src:await shrink(f,1100,false,.72),caption})}
      catch(err){touch();msg='A photo could not be read. Use JPG or PNG images.';render();return}
      open=null;touch();
    }},
      h('label',null,'Caption (optional)',cap),h('label',null,'Photos',files),
      h('button',{class:'btn',type:'submit'},'Upload photos')));
}

const figure=g=>h('figure',null,
  h('a',{href:g.src,target:'_blank',rel:'noopener'},h('img',{src:g.src,alt:g.caption||'Match photo',loading:'lazy'})),
  g.caption||coach?h('figcaption',null,g.caption,coach?h('button',{class:'rm',type:'button',onclick:()=>confirmRemove(g.id,'gallery')},pending===g.id?'Confirm remove':'Remove photo'):null):null);

function clubForm(){
  const f={about:h('textarea',{rows:3,maxlength:600},state.club.about),
    training:h('input',{maxlength:80,value:state.club.training,placeholder:'Days and times'}),
    pitch:h('input',{maxlength:80,value:state.club.pitch,placeholder:'Where you play'}),
    contact:h('input',{maxlength:80,value:state.club.contact,placeholder:'Phone, WhatsApp or email'})};
  return h('div',{class:'coach'},h('h3',null,'Edit club info'),
    h('p',null,'This is shown on the home page.'),
    h('form',{onsubmit:e=>{e.preventDefault();for(const k in f)state.club[k]=f[k].value.trim();touch()}},
      h('label',{class:'wide'},'About the club',f.about),
      h('label',null,'Training days and times',f.training),
      h('label',null,'Home pitch',f.pitch),
      h('label',null,'Contact',f.contact),
      h('button',{class:'btn',type:'submit'},'Save club info')));
}

const addBtn=(key,label)=>{
  const on=coach&&open===key;
  return h('div',{class:'actions'},h('button',{class:'btn'+(on?' alt':''),type:'button',onclick:()=>{
    if(on){open=null;render()}else ask(()=>{open=key;render()});
  }},on?'Close form':label));
};
const form=(key,fn)=>coach&&open===key?fn():null;

const pages={
  home(){
    const n=upcoming()[0],c=state.club;
    const facts=[['Training',c.training],['Home pitch',c.pitch],['Contact',c.contact]].filter(x=>x[1]);
    return [
      n?h('div',{class:'next'},
        h('div',null,h('p',null,'Next match'),h('h3',null,'Three Feathers v '+n.opponent),h('p',null,when(n))),
        h('a',{class:'btn alt',href:'#fixtures'},'All fixtures')):null,
      h('h2',{class:'sub'},'About the club'),
      h('div',{class:'about'},
        h('div',{class:'panel'},h('p',null,c.about||'Three Feathers is a field hockey club. Meet the squad, follow our games and see photos from our matches.')),
        facts.length?h('div',{class:'panel'},h('dl',{class:'facts'},facts.map(([k,v])=>h('div',null,h('dt',null,k),h('dd',null,v))))):null),
      h('div',{style:'margin-top:16px'},addBtn('club','Edit club info')),
      form('club',clubForm),
      h('h2',{class:'sub'},'Players to watch'),
      h('div',{class:'boards'},spot('Top scorer','goals'),spot('Most assists','assists')),
      state.gallery.length?[h('h2',{class:'sub'},'From the touchline'),
        h('div',{class:'gal'},state.gallery.slice(0,3).map(figure)),
        h('p',null,h('a',{class:'btn alt',href:'#gallery'},'See all photos'))]:null
    ];
  },
  squad(){
    const host=h('div',{class:'grid'},grid());
    return [
      head('The squad','Everyone who pulls on the maroon and white.'),
      addBtn('player','Add player'),
      form('player',playerForm),
      h('div',{class:'toolbar'},
        ['All',...POS].map(x=>h('button',{class:'chip',type:'button','aria-pressed':String(filter===x),onclick:()=>{filter=x;render()}},x==='All'?'All players':x+'s')),
        h('input',{class:'search',type:'search','aria-label':'Search players',placeholder:'Search name or number',value:q,oninput:e=>{q=e.target.value;host.replaceChildren(...grid())}})),
      host
    ];
  },
  leaders(){
    return [head('Leaders','Ranked from the most to the fewest. The coach updates goals and assists on the Squad page.'),
      h('div',{class:'boards'},board('Top scorers','goals','goals'),board('Most assists','assists','assists'))];
  },
  fixtures(){
    const up=upcoming(),pl=played();
    return [
      head('Fixtures','Upcoming games and the results from games already played.'),
      addBtn('fixture','Add a game'),
      form('fixture',fixtureForm),
      h('h3',{class:'sub'},'Upcoming games'),
      up.length?h('div',{class:'stack'},up.map(fixture)):empty('No upcoming games have been added yet.'),
      h('h3',{class:'sub'},'Played games'),
      pl.length?h('div',{class:'stack'},pl.map(fixture)):empty('No results yet.')
    ];
  },
  gallery(){
    return [
      head('Gallery','Photos from our matches.'),
      addBtn('photo','Add match photos'),
      form('photo',photoForm),
      state.gallery.length?h('div',{class:'gal'},state.gallery.map(figure)):empty('No photos have been added yet.')
    ];
  }
};

function ask(done){
  if(coach){done();return}
  const input=h('input',{type:'password',autocomplete:'off',required:true,'aria-label':'Coach password'});
  const err=h('p',{class:'err',role:'alert'});
  const esc=e=>{if(e.key==='Escape')close()};
  const close=()=>{box.remove();document.removeEventListener('keydown',esc)};
  const box=h('div',{class:'modal'},
    h('form',{class:'dlg',role:'dialog','aria-modal':'true','aria-label':'Coach password',onsubmit:e=>{
      e.preventDefault();
      if(hash(input.value.trim())===PW){
        coach=true;attempt(()=>sessionStorage.setItem(SK,'1'));close();done();
      }else{err.textContent='That password is not correct. Try again.';input.select()}
    }},
      h('h3',null,'Coach password'),
      h('p',null,'Enter the coach password to add or change information.'),
      input,err,
      h('div',{class:'acts'},h('button',{class:'btn',type:'submit'},'Unlock'),h('button',{class:'btn alt',type:'button',onclick:close},'Cancel'))));
  document.addEventListener('keydown',esc);
  document.body.append(box);
  input.focus();
}

function logout(){coach=false;open=null;attempt(()=>sessionStorage.removeItem(SK));render()}

function exportData(){
  const blob=new Blob(['window.CLUB_DATA = '+JSON.stringify(state)+';\n'],{type:'text/javascript'});
  const a=h('a',{href:URL.createObjectURL(blob),download:'data.js'});
  document.body.append(a);a.click();a.remove();
}

async function importData(file){
  try{
    const t=await file.text();
    state=normalize(JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1)));
    touch();
  }catch(e){msg='That file could not be read. Choose a data.js file exported from this site.';render()}
}

function render(){
  const r=route();
  document.querySelector('.hero').hidden=r!=='home';
  document.querySelectorAll('#nav a').forEach(a=>{
    if(a.getAttribute('href')==='#'+r)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  coachBtn.textContent=coach?'Log out':'Coach login';
  const stat=(n,l)=>h('div',{class:'stat'},h('b',null,n),l);
  document.getElementById('stats').replaceChildren(stat(state.players.length,'Players'),stat(total('goals'),'Goals'),stat(total('assists'),'Assists'));
  app.replaceChildren(...[
    coach?h('div',{class:'coachbar',role:'status'},
      h('span',null,msg||'Coach mode. Changes are saved in this browser. To show them to everyone, export your data and replace data.js on your website.'),
      h('div',{class:'acts'},
        h('button',{class:'btn alt',type:'button',onclick:exportData},'Export data'),
        h('label',{class:'btn alt filebtn'},'Import data',h('input',{type:'file',accept:'.js,.json',onchange:e=>{if(e.target.files[0])importData(e.target.files[0])}})))):null,
    h('section',null,h('div',{class:'wrap'},...pages[r]().flat()))
  ].filter(Boolean));
}

coachBtn.addEventListener('click',()=>coach?logout():ask(render));
window.addEventListener('hashchange',()=>{pending=null;open=null;window.scrollTo(0,0);render()});
render();
