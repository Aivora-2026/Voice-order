const CUR="$";
const MENU=[
 {id:"pizza",name:"Margherita pizza",price:12.5,t:"Mains",al:["margherita","pizza"]},
 {id:"paneer",name:"Paneer tikka",price:9.5,t:"Starters",al:["paneer tikka","paneer"]},
 {id:"butter",name:"Butter chicken",price:13,t:"Mains",al:["butter chicken"]},
 {id:"biryani",name:"Veg biryani",price:11,t:"Mains",al:["biryani","biriyani"]},
 {id:"naan",name:"Garlic naan",price:3.5,t:"Breads",al:["garlic naan","naan","nan"]},
 {id:"salad",name:"Caesar salad",price:8,t:"Starters",al:["caesar salad","caesar","salad"]},
 {id:"pasta",name:"Pasta alfredo",price:12,t:"Mains",al:["pasta alfredo","alfredo","pasta"]},
 {id:"dosa",name:"Masala dosa",price:8.5,t:"Mains",al:["masala dosa","dosa"]},
 {id:"lassi",name:"Mango lassi",price:4.5,t:"Drinks",al:["mango lassi","lassi"]},
 {id:"coffee",name:"Cold coffee",price:4,t:"Drinks",al:["cold coffee","coffee"]},
 {id:"fries",name:"French fries",price:5,t:"Sides",al:["french fries","fries","chips"]},
 {id:"brownie",name:"Chocolate brownie",price:6,t:"Dessert",al:["chocolate brownie","brownie"]}
];
const NUM={one:1,a:1,an:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,couple:2};
const $=id=>document.getElementById(id);
const money=n=>CUR+n.toFixed(2);
let cart={},orders=[],seq=100,listening=false,rec=null;

function parse(text){
  const s=" "+text.toLowerCase().replace(/[.,!?]/g," , ")+" ";
  const hits=[];
  MENU.forEach(m=>m.al.forEach(a=>{
    const re=new RegExp("\\b"+a+"(?:e?s)?\\b","g");let x;
    while((x=re.exec(s)))hits.push({i:x.index,e:x.index+x[0].length,m});
  }));
  hits.sort((a,b)=>a.i-b.i||(b.e-b.i)-(a.e-a.i));
  const out=[];let end=0;
  for(const h of hits){
    if(h.i<end)continue;
    const gap=s.slice(end,h.i).trim().split(/[\s,]+/).filter(Boolean);
    let q=1;
    for(let k=gap.length-1;k>=0;k--){
      const w=gap[k];
      if(/^\d+$/.test(w)){q=+w;break}
      if(NUM[w]){q=NUM[w];break}
    }
    out.push({m:h.m,q:Math.min(q,50)});end=h.e;
  }
  return out;
}
function handle(text){
  const t=text.toLowerCase();
  $("heard").innerHTML="Heard: <b>“"+esc(text)+"”</b>";
  if(/\b(clear|reset|start over|cancel)\b.*\border\b|\bstart over\b/.test(t)){clearCart();return reply("Order cleared.")}
  if(/\b(place|confirm|submit|send|finish)\b.*\border\b|that'?s all|that is all|\bthat'?s it\b/.test(t)){const a=parse(t);a.forEach(x=>add(x.m.id,x.q));return place()}
  const found=parse(t);
  if(!found.length)return reply("I didn’t catch a menu item. Try “one butter chicken and two naan”.");
  if(/\b(remove|delete|take off|take out|no more|without)\b/.test(t)){
    found.forEach(x=>{cart[x.m.id]=(cart[x.m.id]||0)-x.q;if(cart[x.m.id]<=0)delete cart[x.m.id]});
    render();return reply("Removed "+found.map(x=>x.q+" "+x.m.name).join(", ")+".");
  }
  found.forEach(x=>add(x.m.id,x.q,true));
  render();
  reply("Added "+found.map(x=>x.q+" "+x.m.name).join(", ")+". Anything else?");
}
function add(id,n,quiet){cart[id]=(cart[id]||0)+n;if(!quiet)render()}
function clearCart(){cart={};render()}
function total(){return MENU.reduce((s,m)=>s+(cart[m.id]||0)*m.price,0)}
function render(){
  const ids=MENU.filter(m=>cart[m.id]);
  $("cart").innerHTML=ids.length?ids.map(m=>`<div class="line"><span class="nm">${m.name}<br><small style="color:var(--mute)">${money(m.price)} each</small></span><span class="q"><button data-d="-1" data-id="${m.id}" aria-label="Remove one ${m.name}">−</button><b>${cart[m.id]}</b><button data-d="1" data-id="${m.id}" aria-label="Add one ${m.name}">+</button></span><b>${money(m.price*cart[m.id])}</b></div>`).join(""):'<div class="empty">Nothing yet. Tap the mic and say what you’d like.</div>';
  $("total").textContent=money(total());
}
function place(){
  if(!Object.keys(cart).length)return reply("Your order is empty. Say what you’d like first.");
  const o={no:++seq,table:$("table").value.trim()||"Walk-in",items:MENU.filter(m=>cart[m.id]).map(m=>({n:m.name,q:cart[m.id]})),total:total(),time:new Date(),s:"New"};
  orders.unshift(o);cart={};render();renderOrders();
window.addEventListener("load",()=>{$("status").textContent="Starting the microphone…";startListening()});
  reply("Order "+o.no+" sent to the kitchen. Thank you!");
}
function renderOrders(){
  const live=orders.filter(o=>o.s!=="Done");
  $("cnt").textContent=live.length;
  $("orders").innerHTML=live.length?live.map(o=>`<article class="panel ord" data-s="${o.s}"><h3><span>#${o.no} · ${esc(o.table)}</span><span>${money(o.total)}</span></h3><small>${o.time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} · ${o.s}</small><ul>${o.items.map(i=>`<li>${i.q} × ${i.n}</li>`).join("")}</ul><button class="btn ${o.s==="Ready"?"acc":""}" data-no="${o.no}">${{New:"Start preparing",Preparing:"Mark ready",Ready:"Mark served"}[o.s]}</button></article>`).join(""):'<div class="empty">No open orders. New orders appear here the moment they’re sent.</div>';
}
function esc(s){return s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function reply(msg){
  $("status").textContent=msg;
  if($("speak").checked&&window.speechSynthesis){
    try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(msg);u.lang=$("lang").value;u.onend=()=>{if(keep&&!listening)setTimeout(startListening,300)};speechSynthesis.speak(u)}catch(e){}
  }
}
/* voice */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function setMic(on){
  listening=on;$("mic").classList.toggle("on",on);
  $("mic").setAttribute("aria-label",on?"Stop listening":"Start listening");
  if(on)$("status").textContent="Listening…";
}
let keep=true,starting=false;
function startListening(){
  if(!SR){$("status").textContent="Voice input isn’t supported in this browser. Type your order below, or try Chrome, Edge or Safari.";return}
  if(listening||starting)return;
  try{speechSynthesis&&speechSynthesis.cancel()}catch(e){}
  rec=new SR();rec.lang=$("lang").value;rec.interimResults=true;rec.continuous=false;
  let failed=false;
  starting=true;
  rec.onstart=()=>{starting=false;setMic(true);$("heard").textContent=""};
  rec.onresult=e=>{
    let fin="",tmp="";
    for(let i=e.resultIndex;i<e.results.length;i++){(e.results[i].isFinal?(fin+=e.results[i][0].transcript):(tmp+=e.results[i][0].transcript))}
    if(tmp)$("heard").innerHTML="<b>"+esc(tmp)+"</b>";
    if(fin)handle(fin.trim());
  };
  rec.onerror=e=>{
    starting=false;setMic(false);
    if(e.error==="no-speech"||e.error==="aborted")return;
    failed=true;keep=false;
    const blocked=e.error==="not-allowed"||e.error==="service-not-allowed";
    if(blocked){const fr=window.self!==window.top;$("openTab").href=location.href;$("openTab").classList.toggle("hide",!fr);$("status").textContent=fr?"The mic is blocked in this embedded view. Open the page in its own tab, then allow the microphone.":"Microphone is blocked. Click the lock icon beside the address bar, set Microphone to Allow, then reload. Or tap the mic to try again.";return}
    $("status").textContent="Voice input stopped ("+e.error+"). Tap the mic to retry.";
  };
  rec.onend=()=>{
    starting=false;setMic(false);
    // keep listening between phrases, but wait while the app is speaking a reply
    if(keep&&!failed&&!(window.speechSynthesis&&speechSynthesis.speaking))setTimeout(()=>{if(keep)startListening()},400);
  };
  try{rec.start()}catch(e){starting=false;setMic(false);$("status").textContent="Tap the mic to start listening."}
}
$("mic").onclick=()=>{
  if(listening){keep=false;rec&&rec.stop();$("status").textContent="Microphone paused. Tap the mic to listen again.";return}
  keep=true;startListening();
};
/* events */
$("typed").onsubmit=e=>{e.preventDefault();const v=$("txt").value.trim();if(v){handle(v);$("txt").value=""}};
$("clear").onclick=()=>{clearCart();reply("Order cleared.")};
$("place").onclick=place;
$("cart").onclick=e=>{const b=e.target.closest("button[data-id]");if(!b)return;const id=b.dataset.id;cart[id]=(cart[id]||0)+ +b.dataset.d;if(cart[id]<=0)delete cart[id];render()};
$("menu").innerHTML=MENU.map(m=>`<button class="item" data-id="${m.id}"><span class="t">${m.t}</span><b>${m.name}</b><span class="p">${money(m.price)} · tap to add</span></button>`).join("");
$("menu").onclick=e=>{const b=e.target.closest(".item");if(b){add(b.dataset.id,1);$("status").textContent="Added 1 "+MENU.find(m=>m.id===b.dataset.id).name+"."}};
$("orders").onclick=e=>{const b=e.target.closest("button[data-no]");if(!b)return;const o=orders.find(x=>x.no==b.dataset.no);o.s={New:"Preparing",Preparing:"Ready",Ready:"Done"}[o.s];renderOrders()};
function tab(k){
  $("vOrder").classList.toggle("hide",k);$("vKitchen").classList.toggle("hide",!k);
  $("tabO").setAttribute("aria-selected",!k);$("tabK").setAttribute("aria-selected",k);
}
$("tabO").onclick=()=>tab(false);$("tabK").onclick=()=>tab(true);
render();renderOrders();
window.addEventListener("load",()=>{$("status").textContent="Starting the microphone…";startListening()});
