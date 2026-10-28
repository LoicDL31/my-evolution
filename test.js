const a=require('./app.js'),fs=require('fs');let ok=0,ko=0;const t=(n,c)=>{c?ok++:(ko++,console.log('ÉCHEC :',n))};
const ex={version:1,seances:a.DEFPROG()};fs.writeFileSync('programme-exemple.json',JSON.stringify(ex,null,2));
t('exemple valide',a.validateProgram(ex).errors.length===0);
t('liste vide refusée',a.validateProgram({seances:[]}).errors.length>0);
t('nom manquant refusé',a.validateProgram({seances:[{jour:'lundi',exercices:[{nom:'x'}]}]}).errors.length>0);
t('jour invalide refusé',a.validateProgram({seances:[{jour:'funday',nom:'n',exercices:[{nom:'x'}]}]}).errors.length>0);
t('exercices vides refusés',a.validateProgram({seances:[{jour:'lundi',nom:'n',exercices:[]}]}).errors.length>0);
t('series non entier refusé',a.validateProgram({seances:[{jour:'lundi',nom:'n',exercices:[{nom:'x',series:'3'}]}]}).errors.length>0);
t('date valide acceptée',a.validateProgram({seances:[{date:'2026-11-02',nom:'n',exercices:[{nom:'x'}]}]}).errors.length===0);
const S=a.DEF();a.setS(S);const k='2026-10-26';// lundi, séance prévue
S.days[k]={g:{s1:1,f1:1,f2:1,f3:1,f4:0,o1:1,o2:1,o3:0}};
let s;
S.days[k].g.s2=2;S.days[k].g.s3=2;s=a.score(k);
t('sport 1/1 = 100 %',s.sport.t===1&&s.sport.a===1&&s.sport.p===100);
S.days[k].g.f5=2;s=a.score(k);t('alimentation 3/4 = 75 %',s.food.t===3&&s.food.a===4&&s.food.p===75);
S.days[k].g.o4=2;s=a.score(k);t('organisation 2/3',s.org.t===2&&s.org.a===3&&Math.abs(s.org.p-66.67)<.01);
t('repos : sport non applicable',a.score('2026-10-27').sport.a===0);
console.log(ok+' tests réussis, '+ko+' échec(s)');process.exit(ko?1:0);
