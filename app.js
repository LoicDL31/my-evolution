'use strict';
const CATS=['sport','food','org'],CN={sport:'Sport',food:'Alimentation',org:'Organisation'};
const J=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'],WK=[1,2,3,4,5,6,0];
const TABS=[['today','Aujourd’hui','◉'],['sport','Sport','▲'],['food','Repas','●'],['org','Tâches','■'],['prog','Progrès','↗']];
const BODY=[['weight','Poids (kg)'],['waist','Taille (cm)'],['chest','Poitrine (cm)'],['hips','Hanches (cm)'],['thigh','Cuisse (cm)'],['arm','Bras (cm)'],['calf','Mollet (cm)']];
const MEALS=[['b','Petit-déjeuner'],['l','Déjeuner'],['d','Dîner'],['c','Collation (facultatif)']];
const STL={done:'terminée',partial:'partielle',postponed:'reportée'};
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const fk=k=>{const a=k.split('-');return new Date(+a[0],+a[1]-1,+a[2])};
const uid=()=>Math.random().toString(36).slice(2,9);
const fmt=p=>p==null?'—':String(Math.round(p*10)/10).replace('.',',')+' %';
const fdate=k=>fk(k).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
const E=(nom,series,reps,repos,consignes,variantes)=>({nom,series,reps,repos,consignes,variantes});
const DEFPROG=()=>[
{jour:'lundi',nom:'Haut du corps A (pousser)',muscles:['pectoraux','épaules','triceps'],exercices:[
E('Pompes',3,'8-15','60-90 s','Corps gainé, poitrine près du sol.',['Pompes sur les genoux','Pompes mains surélevées']),
E('Développé haltères au sol',3,'10-12','60-90 s','Coudes à 45°, poussée contrôlée.',['Développé avec bande élastique']),
E('Élévations latérales',3,'12-15','45-60 s','Charge légère, sans balancer le buste.'),
E('Extension triceps à une main',3,'10-12','45-60 s','Coude fixe près de l’oreille.')]},
{jour:'mercredi',nom:'Dos et biceps (tirer)',muscles:['dos','biceps'],exercices:[
E('Rowing à un bras',3,'10-12','60-90 s','Dos plat, tirer le coude vers la hanche.'),
E('Rowing penché deux haltères',3,'10-12','60-90 s','Genoux légèrement fléchis, omoplates serrées.'),
E('Tirage élastique',3,'12-15','45-60 s','Tirer vers la poitrine, ne pas hausser les épaules.'),
E('Curl biceps',3,'10-12','45-60 s','Coudes fixes, descente lente.',['Curl avec bande élastique'])]},
{jour:'vendredi',nom:'Haut du corps B (épaules, bras)',muscles:['épaules','pectoraux','bras'],exercices:[
E('Développé militaire assis',3,'8-12','60-90 s','Dos droit, ne pas cambrer.'),
E('Pompes inclinées ou déclinées',3,'8-15','60-90 s','Gardez le corps aligné.',['Pompes classiques']),
E('Oiseau (arrière d’épaules)',3,'12-15','45-60 s','Buste penché, charge légère.'),
E('Curl marteau',2,'10-12','45-60 s','Poignets neutres.')]},
{jour:'samedi',nom:'Abdos et cardio',muscles:['abdominaux','condition physique'],exercices:[
E('Crunch',3,'12-20','30-45 s','Expirer en montant, nuque relâchée.'),
E('Planche',3,'30-45 s','45 s','Bassin aligné, ventre serré.',['Planche sur les genoux']),
E('Relevés de jambes allongé',3,'10-15','45 s','Lombaires collées au sol.',['Relevés de genoux']),
E('Marche rapide ou cardio léger',1,'15-20 min','—','Allure où tu peux encore parler.')]}];
const DEF=()=>({v:1,settings:{theme:'auto',maxPrio:3},
goals:{sport:[{id:'s1',t:'Réaliser la séance prévue'},{id:'s2',t:'Noter répétitions et charges'},{id:'s3',t:'Respecter la récupération',opt:1}],
food:[{id:'f1',t:'Repas suffisamment équilibrés'},{id:'f2',t:'Sources de protéines'},{id:'f3',t:'Fruits et légumes'},{id:'f4',t:'Boire régulièrement de l’eau'},{id:'f5',t:'Prévoir les repas du lendemain',opt:1}],
org:[{id:'o1',t:'Accomplir une tâche importante'},{id:'o2',t:'Préparer mes affaires pour demain'},{id:'o3',t:'Respecter mon horaire de sommeil'},{id:'o4',t:'Limiter les distractions numériques',opt:1}]},
program:DEFPROG(),days:{},tasks:[],shop:[],body:[],missions:['5 minutes de rangement','Préparer un repas simple','Courte marche','Préparer mes affaires pour demain']});
let S,cur,tab='today',cm,cmp=[],bad=false,persisted=null,goTop=false;

/* ---------- stockage IndexedDB (un seul enregistrement « state ») ---------- */
let db;
const idb=()=>new Promise((ok,ko)=>{const r=indexedDB.open('my-evolution',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)});
async function load(){db=await idb();return new Promise((ok,ko)=>{const q=db.transaction('kv').objectStore('kv').get('state');q.onsuccess=()=>ok(q.result);q.onerror=()=>ko(q.error)})}
function save(){if(!db)return;try{const t=db.transaction('kv','readwrite');t.objectStore('kv').put(JSON.parse(JSON.stringify(S)),'state');t.onerror=t.onabort=()=>{bad=true;toast('Échec de l’enregistrement : exporte une sauvegarde.')}}catch(e){bad=true;toast('Échec de l’enregistrement : exporte une sauvegarde.')}}
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),3000)}

/* ---------- logique ---------- */
const D=k=>S.days[k]||(S.days[k]={g:{}});
const sessions=k=>{const w=J[fk(k).getDay()];return S.program.filter(s=>s.date?s.date===k:s.jour===w)};
function gstate(k,c,g){const d=S.days[k],e=d&&d.g[g.id];if(e!==undefined)return e;if(d&&d.hard&&g.opt)return 2;if(c==='sport'&&!sessions(k).length)return 2;return 0}
function score(k){const o={};let T=0,A=0;for(const c of CATS){let t=0,a=0;for(const g of S.goals[c]){const s=gstate(k,c,g);if(s===2)continue;a++;if(s===1)t++}o[c]={t,a,p:a?t/a*100:null};T+=t;A+=a}o.all={t:T,a:A,p:A?T/A*100:null};return o}
const act=k=>{const d=S.days[k];return !!d&&(Object.keys(d.g).length>0||Object.keys(d.sp||{}).length>0)};
function cls(k,t){if(k>t)return '';if(!act(k))return sessions(k).length?'':'rest';const p=score(k).all.p;return p==null?'rest':p>=70?'good':p>=35?'mid':'low'}
function validateProgram(o){const e=[],a=Array.isArray(o)?o:o&&o.seances;
if(!Array.isArray(a)||!a.length)return{errors:['Le fichier doit contenir une liste « seances » non vide.'],list:[]};
a.forEach((s,i)=>{const p='Séance '+(i+1)+' : ';if(!s||typeof s!=='object'){e.push(p+'objet attendu.');return}
const jr=typeof s.jour==='string'&&J.includes(s.jour.toLowerCase()),dt=typeof s.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s.date)&&!isNaN(fk(s.date));
if(!jr&&!dt)e.push(p+'« jour » (ex. "lundi") ou « date » (AAAA-MM-JJ) requis.');
if(typeof s.nom!=='string'||!s.nom.trim())e.push(p+'« nom » requis.');
if(s.muscles!==undefined&&!Array.isArray(s.muscles))e.push(p+'« muscles » doit être une liste.');
if(!Array.isArray(s.exercices)||!s.exercices.length)e.push(p+'« exercices » doit être une liste non vide.');
else s.exercices.forEach((x,j)=>{const q=p+'exercice '+(j+1)+' : ';if(!x||typeof x.nom!=='string'||!x.nom.trim()){e.push(q+'« nom » requis.');return}
if(x.series!==undefined&&!(Number.isInteger(x.series)&&x.series>0))e.push(q+'« series » doit être un entier positif.');
['reps','repos','consignes'].forEach(f=>{if(x[f]!==undefined&&typeof x[f]!=='string')e.push(q+'« '+f+' » doit être du texte.')});
if(x.variantes!==undefined&&!(Array.isArray(x.variantes)&&x.variantes.every(v=>typeof v==='string')))e.push(q+'« variantes » doit être une liste de textes.')})});
return{errors:e,list:e.length?[]:a.map(s=>{const r={nom:s.nom.trim(),muscles:s.muscles||[],exercices:s.exercices.map(x=>({nom:x.nom.trim(),series:x.series,reps:x.reps,repos:x.repos,consignes:x.consignes,variantes:x.variantes}))};if(s.date)r.date=s.date;else r.jour=s.jour.toLowerCase();return r})}}
function msg(){let tot=0,last=null,wk=0;const t=new Date();for(const k in S.days){const sp=S.days[k].sp;if(!sp)continue;for(const n in sp){const st=sp[n].st;if(st==='done'||st==='partial'){tot++;if(!last||k>last)last=k;if((t-fk(k))/864e5<7)wk++}}}
if(!tot)return 'Quand tu seras prêt, une première séance suffit pour démarrer.';
if((t-fk(last))/864e5>=4)return 'Content de te revoir. Reprendre petit, c’est déjà reprendre.';
if(wk>=3)return 'Belle régularité cette semaine.';
if(tot===1)return 'Première séance enregistrée. Bien joué.';
return 'Un jour à la fois : la régularité compte plus que l’intensité.'}
function bilan(){const t=new Date(),tk=key(t);let pl=0,dn=0,pa=0,ft=0,fa=0,dif=[];
for(let i=0;i<7;i++){const d=new Date(t);d.setDate(t.getDate()-i);const k=key(d),x=S.days[k];
sessions(k).forEach(s=>{pl++;const r=x&&x.sp&&x.sp[s.nom];if(r&&r.st==='done')dn++;if(r&&r.st==='partial')pa++});
if(act(k)){const sc=score(k);ft+=sc.food.t;fa+=sc.food.a}if(x&&x.rv&&x.rv.hard)dif.push(x.rv.hard)}
const lim=new Date(t);lim.setDate(t.getDate()-6);const lk=key(lim);
const td=S.tasks.filter(x=>x.done&&x.doneOn>=lk).length,tm=S.tasks.filter(x=>!x.done&&x.due&&x.due>=lk&&x.due<tk).length;
const w=S.body.filter(x=>x.weight!=null),dw=w.length>1?(w[w.length-1].weight-w[w.length-2].weight):null;
const fp=fa?ft/fa*100:null;
const sug=pl&&dn+pa<pl/2?'Choisis une séance courte (20 minutes) pour reprendre le rythme.':fp!=null&&fp<50?'Prépare à l’avance un repas simple pour demain.':'Continue ainsi et vise une petite progression sur une charge ou une répétition.';
return {pl,dn,pa,fp,tp:td+tm?td/(td+tm)*100:null,dw,dif,sug}}

/* ---------- vues ---------- */
const dnav=()=>`<div class="dn"><button data-act="day" data-d="-1" aria-label="Jour précédent">‹</button><b>${fdate(cur)}</b><button data-act="day" data-d="1" aria-label="Jour suivant">›</button></div>`;
function vToday(){const k=cur,sc=score(k),d=S.days[k]||{g:{}},ss=sessions(k),tk=S.tasks.filter(x=>x.doneOn===k).length,ml=Object.values(d.meals||{}).filter(x=>x.t).length;
let h=dnav()+`<section class="card big"><div class="pc">${fmt(sc.all.p)}</div><div>${sc.all.t} sur ${sc.all.a} objectifs applicables</div><p class="mut">${msg()}</p></section>`;
h+=CATS.map(c=>`<section class="card c-${c}"><h2>${CN[c]}<span>${fmt(sc[c].p)}</span></h2>`+(c==='sport'?(ss.length?`<p class="mut">Prévu : ${ss.map(s=>esc(s.nom)).join(', ')}</p>`:'<p class="mut">Jour de repos : objectifs sport non applicables.</p>'):'')+S.goals[c].map(g=>{const s=gstate(k,c,g);return `<button class="g s${s}" data-act="g" data-c="${c}" data-g="${g.id}" aria-label="${esc(g.t)} : ${['à faire','terminé','non applicable'][s]}"><i>${['','✓','–'][s]}</i><span>${esc(g.t)}${g.opt?' <em>facultatif</em>':''}</span></button>`}).join('')+'</section>').join('');
h+=`<button class="btn" data-act="hard">${d.hard?'Mode journée difficile activé · désactiver':'Journée difficile ?'}</button>`;
h+=`<details class="card"${d.hard?' open':''}><summary>Mission minimale</summary>${S.missions.map((m,i)=>`<button class="g s${(d.mm||{})[i]?1:0}" data-act="mm" data-i="${i}"><i>${(d.mm||{})[i]?'✓':''}</i><span>${esc(m)}</span></button>`).join('')}<p class="mut">Facultatif. Fais ce que ton énergie permet.</p></details>`;
h+=`<details class="card"><summary>Bilan du jour (facultatif)</summary>`+[['ok','Ce qui a bien fonctionné'],['hard','Principale difficulté'],['next','Priorité pour demain']].map(([f,l])=>`<label>${l}<textarea data-f="rv" data-k="${f}">${esc((d.rv||{})[f])}</textarea></label>`).join('')+'</details>';
h+=`<label class="card">Notes du jour<textarea data-f="note">${esc(d.note)}</textarea></label>`;
const sp=Object.entries(d.sp||{}).filter(([n,r])=>r.st).map(([n,r])=>esc(n)+' ('+STL[r.st]+')').join(', ');
return h+`<section class="card"><h2>Résumé</h2><p class="mut">Séances : ${sp||'aucune enregistrée'}<br>Repas notés : ${ml}/4 · Tâches terminées : ${tk}</p></section>`}
function sCard(s,k){const r=((S.days[k]||{}).sp||{})[s.nom]||{logs:{}};r.logs=r.logs||{};
return `<section class="card c-sport"><h2>${esc(s.nom)}<span>${r.st?STL[r.st]:''}</span></h2><p class="mut">${esc((s.muscles||[]).join(', '))}</p>`+s.exercices.map(x=>{const v=(r.var||{})[x.nom];
const vs=x.variantes&&x.variantes.length?`<select data-f="var" data-s="${esc(s.nom)}" data-e="${esc(x.nom)}"><option value="">Exercice prévu</option>${x.variantes.map(y=>`<option${v===y?' selected':''}>${esc(y)}</option>`).join('')}</select>`:'';
return `<div class="ex"><b>${esc(v||x.nom)}</b><span class="mut">${x.series?x.series+' × ':''}${esc(x.reps||'')}${x.repos?' · repos '+esc(x.repos):''}</span>${x.consignes?`<p class="mut">${esc(x.consignes)}</p>`:''}${vs}<textarea rows="1" placeholder="Charges, répétitions, ressenti" data-f="log" data-s="${esc(s.nom)}" data-e="${esc(x.nom)}">${esc(r.logs[x.nom])}</textarea></div>`}).join('')
+'<div class="seg">'+[['done','Terminée'],['partial','Partielle'],['postponed','Reportée'],['reset','Effacer']].map(([v,l])=>`<button class="${r.st===v?'on':''}" data-act="st" data-s="${esc(s.nom)}" data-v="${v}">${l}</button>`).join('')+'</div></section>'}
function vSport(){const k=cur,ss=sessions(k);let h=dnav()+(ss.length?ss.map(s=>sCard(s,k)).join(''):'<p class="card">Pas de séance prévue ce jour : c’est un jour de repos.</p>');
h+='<h2>Programme de la semaine</h2>';
for(const w of WK){S.program.filter(s=>!s.date&&s.jour===J[w]).forEach(s=>{h+=`<details class="card"><summary>${J[w]} · ${esc(s.nom)}</summary>${s.exercices.map(x=>`<p>${esc(x.nom)} <span class="mut">${x.series?x.series+' × ':''}${esc(x.reps||'')}</span></p>`).join('')}</details>`})}
const dated=S.program.filter(s=>s.date);if(dated.length)h+=dated.map(s=>`<p class="mut">${s.date} · ${esc(s.nom)}</p>`).join('');
h+='<h2>Historique des séances</h2>';const hs=[];Object.keys(S.days).sort().reverse().forEach(k=>{const sp=S.days[k].sp||{};for(const n in sp){const r=sp[n],lg=Object.entries(r.logs||{}).filter(a=>a[1]);if(r.st||lg.length)hs.push(`<details class="card"><summary>${k} · ${esc(n)} ${r.st?'('+STL[r.st]+')':''}</summary>${lg.map(a=>`<p><b>${esc(a[0])}</b> : ${esc(a[1])}</p>`).join('')||'<p class="mut">Aucune note.</p>'}</details>`)}});
return h+(hs.slice(0,20).join('')||'<p class="mut">Aucune séance enregistrée pour le moment.</p>')}
function vFood(){const k=cur,m=(S.days[k]||{}).meals||{};
let h=dnav()+'<p class="mut">Pense aux protéines, aux fruits, aux légumes et à l’eau. Un repas plus copieux que prévu n’est pas un échec. Aucune calorie n’est calculée ici. Choisis « demain » avec les flèches pour préparer tes repas.</p>';
h+=MEALS.map(([id,l])=>{const x=m[id]||{};return `<section class="card c-food"><h2>${l}<label class="chk"><input type="checkbox" data-f="mealok" data-m="${id}"${x.ok?' checked':''}> préparé</label></h2><textarea data-f="meal" data-m="${id}" placeholder="Plat, ingrédients, quantités si tu veux">${esc(x.t)}</textarea></section>`}).join('');
h+=`<section class="card"><h2>Liste de courses</h2>${S.shop.map((x,i)=>`<div class="tk"><button data-act="sdone" data-i="${i}">${x.done?'☑':'☐'}</button><span style="${x.done?'text-decoration:line-through':''}">${esc(x.t)}</span><button data-act="sdel" data-i="${i}" aria-label="Supprimer">✕</button></div>`).join('')}<div class="add"><input id="si" placeholder="Ajouter un article"><button data-act="sadd">Ajouter</button></div><button class="btn" data-act="sclear">Retirer les articles cochés</button></section>`;
const past=Object.keys(S.days).filter(x=>x<cur&&Object.values(S.days[x].meals||{}).some(y=>y.t)).sort().reverse().slice(0,5);
return h+(past.length?'<h2>Repas précédents</h2>'+past.map(x=>`<details class="card"><summary>${x}</summary>${MEALS.map(([i,l])=>(S.days[x].meals[i]&&S.days[x].meals[i].t)?`<p><b>${l}</b> : ${esc(S.days[x].meals[i].t)}</p>`:'').join('')}</details>`).join(''):'')}
function vOrg(){const t=key(new Date());const open=S.tasks.filter(x=>!x.done).sort((a,b)=>a.prio-b.prio||(a.due||'9').localeCompare(b.due||'9'));
const top=open.filter(x=>x.prio===1||(x.due&&x.due<=t)).slice(0,S.settings.maxPrio),rest=open.filter(x=>!top.includes(x));
const row=x=>`<div class="tk"><button data-act="tdone" data-i="${x.id}" aria-label="Terminer">☐</button><span>${esc(x.t)}<br><em>${esc(x.cat||'')}${x.due?' · échéance '+x.due:''}${x.due&&x.due<t?' · EN RETARD':''}</em></span><button data-act="tpost" data-i="${x.id}">+1 j</button><button data-act="tdel" data-i="${x.id}" aria-label="Supprimer">✕</button></div>`;
let h=`<section class="card c-org"><h2>Nouvelle tâche</h2><input id="tt" placeholder="Titre"><select id="tp"><option value="1">Priorité haute</option><option value="2" selected>Priorité normale</option><option value="3">Priorité basse</option></select><input id="tc" placeholder="Catégorie (ex. études)"><label>Échéance<input id="td" type="date"></label><button class="btn" data-act="tadd">Ajouter la tâche</button></section>`;
h+=`<section class="card"><h2>Prioritaires du jour (max ${S.settings.maxPrio})</h2>${top.map(row).join('')||'<p class="mut">Rien de prioritaire.</p>'}</section>`;
h+=`<section class="card"><h2>Autres tâches</h2>${rest.map(row).join('')||'<p class="mut">Aucune.</p>'}</section>`;
const dn=S.tasks.filter(x=>x.done).sort((a,b)=>b.doneOn.localeCompare(a.doneOn)).slice(0,15);
return h+`<details class="card"><summary>Terminées (${dn.length})</summary>${dn.map(x=>`<p>${esc(x.t)} <em>${x.doneOn}</em></p>`).join('')}</details>`}
function cal(){const y=cm.getFullYear(),m=cm.getMonth(),f=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate(),t=key(new Date());
let h=`<div class="dn"><button data-act="mo" data-d="-1" aria-label="Mois précédent">‹</button><b>${cm.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</b><button data-act="mo" data-d="1" aria-label="Mois suivant">›</button></div><div class="cal">`+['L','M','M','J','V','S','D'].map(x=>`<small>${x}</small>`).join('')+'<span></span>'.repeat(f);
for(let d=1;d<=n;d++){const k=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');h+=`<button class="cd ${cls(k,t)}${k===cur?' sel':''}" data-act="pick" data-k="${k}">${d}</button>`}
return h+'</div><p class="mut">Vert : bien avancé · orange : partiel · rouge : peu réalisé · bordure bleue : repos prévu. Touche un jour pour le consulter.</p>'}
function chart(f,l){const p=S.body.filter(x=>x[f]!=null);if(p.length<2)return `<p class="mut">${l} : il faut au moins 2 mesures pour la courbe.</p>`;
const ys=p.map(x=>x[f]),mn=Math.min(...ys),sp=(Math.max(...ys)-mn)||1,xs=p.map(x=>fk(x.date).getTime()),x0=xs[0],xr=(xs[xs.length-1]-x0)||1;
const pts=p.map((x,i)=>((xs[i]-x0)/xr*280+10).toFixed(1)+','+(90-(x[f]-mn)/sp*70).toFixed(1)).join(' ');
return `<div class="ch"><b>${l}</b> <span class="mut">${ys[0]} → ${ys[ys.length-1]}</span><svg viewBox="0 0 300 100" role="img" aria-label="Courbe ${l}"><polyline points="${pts}" fill="none" stroke="var(--sport)" stroke-width="2.5"/></svg></div>`}
function vProg(){const b=bilan(),last=S.body[S.body.length-1]||{},opt=S.body.map((x,i)=>`<option value="${x.date}">${x.date}</option>`).join('');
let h=`<section class="card">${cal()}</section>`;
h+=`<section class="card"><h2>Bilan des 7 derniers jours</h2><p>Séances : ${b.dn} terminée(s), ${b.pa} partielle(s) sur ${b.pl} prévue(s)<br>Objectifs alimentation : ${fmt(b.fp)}<br>Tâches : ${fmt(b.tp)}${b.dw!=null?`<br>Poids depuis la dernière mesure : ${b.dw>0?'+':''}${String(Math.round(b.dw*10)/10).replace('.',',')} kg`:''}</p>${b.dif.length?`<p class="mut">Difficultés notées : ${b.dif.map(esc).join(' · ')}</p>`:''}<p><b>Idée pour la semaine prochaine :</b> ${b.sug}</p><p class="mut">Simple lecture de tes données, sans interprétation médicale.</p></section>`;
h+=`<section class="card"><h2>Mesures du ${cur}</h2>${BODY.map(([f,l])=>`<label>${l}<input id="b_${f}" inputmode="decimal" placeholder="${last[f]!=null?'dernière : '+last[f]:''}"></label>`).join('')}<button class="btn" data-act="body">Enregistrer les mesures</button><p class="mut">Pas de pesée quotidienne nécessaire.</p></section>`;
h+=`<section class="card">${chart('weight','Poids (kg)')}${chart('waist','Tour de taille (cm)')}</section>`;
if(S.body.length>1){const[a,c]=[cmp[0]||S.body[0].date,cmp[1]||S.body[S.body.length-1].date],A=S.body.find(x=>x.date===a),B=S.body.find(x=>x.date===c);
h+=`<section class="card"><h2>Comparer deux dates</h2><select data-f="cmp" data-i="0">${opt.replace(`value="${a}"`,`value="${a}" selected`)}</select><select data-f="cmp" data-i="1">${opt.replace(`value="${c}"`,`value="${c}" selected`)}</select><table>${BODY.filter(([f])=>A[f]!=null&&B[f]!=null).map(([f,l])=>`<tr><td>${l}</td><td>${A[f]} → ${B[f]}</td><td>${(B[f]-A[f])>0?'+':''}${Math.round((B[f]-A[f])*10)/10}</td></tr>`).join('')}</table></section>`}
return h}
function vSet(){let h='<section class="card"><h2>Apparence et limites</h2><label>Thème<select data-f="theme">'+[['auto','Automatique'],['light','Clair'],['dark','Sombre']].map(([v,l])=>`<option value="${v}"${S.settings.theme===v?' selected':''}>${l}</option>`).join('')+`</select></label><label>Tâches prioritaires par jour<input type="number" min="1" max="10" data-f="maxp" value="${S.settings.maxPrio}"></label></section>`;
h+='<section class="card"><h2>Objectifs quotidiens</h2>'+CATS.map(c=>`<h3>${CN[c]}</h3>`+S.goals[c].map(g=>`<div class="tk"><span>${esc(g.t)}</span><button data-act="gopt" data-c="${c}" data-g="${g.id}">${g.opt?'facultatif':'normal'}</button><button data-act="gdel" data-c="${c}" data-g="${g.id}" aria-label="Supprimer">✕</button></div>`).join('')+`<div class="add"><input id="ng_${c}" placeholder="Nouvel objectif"><button data-act="gadd" data-c="${c}">Ajouter</button></div>`).join('')+'<button class="btn" data-act="greset">Restaurer les objectifs initiaux</button></section>';
h+=`<section class="card"><h2>Programme hebdomadaire</h2><button class="btn" data-act="pexp">Exporter le programme (JSON)</button><label>Mode d’import<select id="pmode"><option value="replace">Remplacer le programme</option><option value="merge">Fusionner (même jour + nom = remplacé)</option></select></label><label>Fichier JSON<input id="pfile" type="file" accept=".json,application/json"></label><button class="btn" data-act="preset">Restaurer le programme initial</button><details><summary>Exemple de format</summary><pre>${esc(JSON.stringify({version:1,seances:[DEFPROG()[0]]},null,1))}</pre></details><p class="mut">L’historique des séances n’est jamais supprimé.</p></section>`;
h+=`<section class="card"><h2>Sauvegarde des données</h2><p class="mut">Stockage du navigateur ${persisted?'protégé contre l’effacement automatique':'non garanti : Android peut l’effacer'}${bad?' · ERREUR d’enregistrement détectée':''}. Exporte régulièrement un fichier et garde-le hors du téléphone (Drive, e-mail).</p><button class="btn" data-act="dexp">Exporter toutes les données</button><label>Restaurer une sauvegarde<input id="dfile" type="file" accept=".json,application/json"></label></section>`;
return h}
const VIEWS={today:vToday,sport:vSport,food:vFood,org:vOrg,prog:vProg,set:vSet};
function render(){const y=scrollY;$('#v').innerHTML=VIEWS[tab]();$('#nav').innerHTML=TABS.map(([id,l,i])=>`<button class="${tab===id?'on':''}" data-act="tab" data-v="${id}"><span>${i}</span>${l}</button>`).join('');$('#ttl').textContent=tab==='set'?'Paramètres':'My Evolution';scrollTo(0,goTop?0:y);goTop=false}
function applyTheme(){document.documentElement.dataset.theme=S.settings.theme==='auto'?'':S.settings.theme}
function dl(n,o){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o,null,2)],{type:'application/json'}));a.download=n;document.body.appendChild(a);a.click();a.remove()}

/* ---------- actions ---------- */
const A={
tab:b=>{tab=b.dataset.v;goTop=true},
day:b=>{const d=fk(cur);d.setDate(d.getDate()+ +b.dataset.d);cur=key(d)},
mo:b=>{cm=new Date(cm.getFullYear(),cm.getMonth()+ +b.dataset.d,1)},
pick:b=>{cur=b.dataset.k;tab='today';goTop=true},
g:b=>{const c=b.dataset.c,g=S.goals[c].find(x=>x.id===b.dataset.g);D(cur).g[g.id]=(gstate(cur,c,g)+1)%3},
hard:()=>{const d=D(cur);d.hard=!d.hard},
mm:b=>{const d=D(cur);d.mm=d.mm||{};d.mm[b.dataset.i]=d.mm[b.dataset.i]?0:1},
st:b=>{const d=D(cur),n=b.dataset.s,v=b.dataset.v;d.sp=d.sp||{};if(v==='reset'){delete d.sp[n];return}const r=d.sp[n]=d.sp[n]||{logs:{}};r.st=v;if(v==='done'&&S.goals.sport.some(g=>g.id==='s1'))d.g.s1=1},
sadd:()=>{const v=$('#si').value.trim();if(v)S.shop.push({t:v,done:0})},
sdone:b=>{const x=S.shop[+b.dataset.i];x.done=x.done?0:1},sdel:b=>{S.shop.splice(+b.dataset.i,1)},sclear:()=>{S.shop=S.shop.filter(x=>!x.done)},
tadd:()=>{const t=$('#tt').value.trim();if(!t)return toast('Donne un titre à la tâche.');S.tasks.push({id:uid(),t,prio:+$('#tp').value,cat:$('#tc').value.trim(),due:$('#td').value||'',done:0})},
tdone:b=>{const x=S.tasks.find(y=>y.id===b.dataset.i);x.done=1;x.doneOn=key(new Date())},
tpost:b=>{const x=S.tasks.find(y=>y.id===b.dataset.i),d=fk(x.due||key(new Date()));d.setDate(d.getDate()+1);x.due=key(d)},
tdel:b=>{if(confirm('Supprimer définitivement cette tâche ?'))S.tasks=S.tasks.filter(y=>y.id!==b.dataset.i)},
body:()=>{const e={date:cur};let any=0;for(const[f]of BODY){const v=parseFloat(($('#b_'+f).value||'').replace(',','.'));if(!isNaN(v)){e[f]=v;any=1}}
if(!any)return toast('Saisis au moins une mesure.');const i=S.body.findIndex(x=>x.date===cur);if(i<0)S.body.push(e);else S.body[i]={...S.body[i],...e};S.body.sort((a,b)=>a.date.localeCompare(b.date));toast('Mesures enregistrées')},
gopt:b=>{const g=S.goals[b.dataset.c].find(x=>x.id===b.dataset.g);g.opt=g.opt?0:1},
gdel:b=>{if(confirm('Supprimer cet objectif ? L’historique déjà coché reste enregistré.'))S.goals[b.dataset.c]=S.goals[b.dataset.c].filter(x=>x.id!==b.dataset.g)},
gadd:b=>{const c=b.dataset.c,v=$('#ng_'+c).value.trim();if(v)S.goals[c].push({id:uid(),t:v})},
greset:()=>{if(confirm('Restaurer les objectifs initiaux ? L’historique n’est pas effacé.'))S.goals=DEF().goals},
preset:()=>{if(confirm('Restaurer le programme initial ? L’historique des séances est conservé.'))S.program=DEFPROG()},
pexp:()=>dl('my-evolution-programme.json',{version:1,seances:S.program}),
dexp:()=>dl('my-evolution-sauvegarde-'+key(new Date())+'.json',S)};
const C={
log:e=>{const d=D(cur);d.sp=d.sp||{};const r=d.sp[e.dataset.s]=d.sp[e.dataset.s]||{logs:{}};r.logs=r.logs||{};r.logs[e.dataset.e]=e.value},
var:e=>{const d=D(cur);d.sp=d.sp||{};const r=d.sp[e.dataset.s]=d.sp[e.dataset.s]||{logs:{}};r.var=r.var||{};r.var[e.dataset.e]=e.value;return 1},
note:e=>{D(cur).note=e.value},rv:e=>{const d=D(cur);d.rv=d.rv||{};d.rv[e.dataset.k]=e.value},
meal:e=>{const d=D(cur);d.meals=d.meals||{};d.meals[e.dataset.m]={...(d.meals[e.dataset.m]||{}),t:e.value}},
mealok:e=>{const d=D(cur);d.meals=d.meals||{};d.meals[e.dataset.m]={...(d.meals[e.dataset.m]||{}),ok:e.checked}},
theme:e=>{S.settings.theme=e.value;applyTheme()},maxp:e=>{S.settings.maxPrio=Math.max(1,Math.min(10,+e.value||3))},
cmp:e=>{cmp[+e.dataset.i]=e.value;return 1}};
async function importProgram(f){let o;try{o=JSON.parse(await f.text())}catch(x){return alert('Fichier illisible : ce n’est pas du JSON valide.')}
const r=validateProgram(o);if(r.errors.length)return alert('Import annulé. Erreurs :\n• '+r.errors.slice(0,8).join('\n• '));
const rep=$('#pmode').value==='replace';if(!confirm((rep?'Remplacer le programme actuel par':'Fusionner avec le programme actuel :')+' '+r.list.length+' séance(s) ? L’historique est conservé.'))return;
if(rep)S.program=r.list;else r.list.forEach(s=>{const i=S.program.findIndex(p=>(p.date||p.jour)===(s.date||s.jour)&&p.nom===s.nom);if(i<0)S.program.push(s);else S.program[i]=s});
save();render();toast('Programme importé')}
async function importData(f){let o;try{o=JSON.parse(await f.text())}catch(x){return alert('Fichier illisible.')}
if(!o||o.v!==1||!o.goals||!Array.isArray(o.program)||typeof o.days!=='object'||!Array.isArray(o.tasks)||!Array.isArray(o.body))return alert('Ce fichier n’est pas une sauvegarde My Evolution valide.');
if(!validateProgram(o.program).list.length&&o.program.length)return alert('Le programme de la sauvegarde est invalide.');
if(!confirm('Remplacer TOUTES les données actuelles par cette sauvegarde ?'))return;S={...DEF(),...o};save();applyTheme();render();toast('Sauvegarde restaurée')}
if(typeof document!=='undefined'){document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;A[b.dataset.act](b);save();render()});
document.addEventListener('change',e=>{const t=e.target;if(t.id==='pfile'&&t.files[0]){importProgram(t.files[0]);t.value='';return}if(t.id==='dfile'&&t.files[0]){importData(t.files[0]);t.value='';return}
if(t.dataset.f&&C[t.dataset.f]){const r=C[t.dataset.f](t);save();if(r)render()}})}
async function init(){try{S=await load()}catch(e){bad=true;toast('Stockage indisponible : les données ne seront pas conservées.')}
S=Object.assign(DEF(),S||{});cur=key(new Date());cm=new Date(fk(cur).getFullYear(),fk(cur).getMonth(),1);applyTheme();render();
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().then(p=>{persisted=p});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})}
if(typeof module!=='undefined')module.exports={validateProgram,score,DEFPROG,DEF,setS:x=>{S=x}};else init();
