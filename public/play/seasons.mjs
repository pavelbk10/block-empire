export const SEASON_GOALS=[12000,25000,50000,100000,0];
export const SEASON_ROUNDS=[40,80,160,320,640,0];
export const seasonOptions=options=>({goal:SEASON_GOALS.includes(options?.goal)?options.goal:12000,maxRounds:SEASON_ROUNDS.includes(options?.rounds)?options.rounds:80});
export function extendSeason(s,options,{score,log}){
 const {goal,rounds}=options??{};
 if(!SEASON_GOALS.includes(goal)||!SEASON_ROUNDS.includes(rounds))throw Error('בחרו יעד יוקרה ואורך עונה מהרשימה');
 const oldGoal=s.goal??12000,oldRounds=s.maxRounds??80;
 if((oldGoal===0&&goal!==0)||(oldGoal>0&&goal!==0&&goal<oldGoal)||(oldRounds===0&&rounds!==0)||(oldRounds>0&&rounds!==0&&rounds<oldRounds))throw Error('אפשר להאריך עונה, לא לקצר יעד או מספר רבעונים');
 if(goal===oldGoal&&rounds===oldRounds)throw Error('בחרו יעד גבוה יותר או עונה ארוכה יותר');
 const alive=s.players.filter(p=>!p.out),best=Math.max(...alive.map(p=>score(s,p.id)));
 if(s.phase==='finished'&&(alive.length<2||(goal!==0&&goal<=best)||(rounds!==0&&rounds<s.round)))throw Error('כדי להמשיך בחרו יעד מעל הניקוד המוביל ומשך שכולל את הרבעון הנוכחי. משחק עם שחקן יחיד שנותר אינו ניתן לחידוש.');
 s.goal=goal;s.maxRounds=rounds;s.seasonRevision=(s.seasonRevision??0)+1;
 if(s.phase==='finished'){s.phase='action';s.winner=null;s.quiz=null;s.auction=null;if(s.players[s.active].out)s.active=alive[0].id;}
 log(s,`העונה הוארכה: ${goal?goal.toLocaleString('he-IL')+' יוקרה':'ללא יעד יוקרה'} · ${rounds?'עד '+rounds+' רבעונים':'ללא מגבלת רבעונים'}.`,'season');return s;
}
