// Readable, shared visual vocabulary: physical signs, map labels and property cards.
const circle=(x,y,r)=>`M${x-r} ${y} C${x-r} ${y-r*.552} ${x-r*.552} ${y-r} ${x} ${y-r} C${x+r*.552} ${y-r} ${x+r} ${y-r*.552} ${x+r} ${y} C${x+r} ${y+r*.552} ${x+r*.552} ${y+r} ${x} ${y+r} C${x-r*.552} ${y+r} ${x-r} ${y+r*.552} ${x-r} ${y} Z`;
const icons={
 home:'M3 11 L12 3 L21 11 M5 10 L5 21 L19 21 L19 10 M10 21 L10 14 L14 14 L14 21',
 shop:'M3 9 L21 9 L18 21 L6 21 Z M7 9 L10 3 M17 9 L14 3 M9 12 L10 18 M15 12 L14 18',
 supermarket:'M2 3 L5 3 L8 17 L20 17 M6 7 L22 7 L19 14 L8 14 '+circle(10,21,1)+circle(18,21,1),
 cafe:'M4 8 L17 8 L17 15 Q17 19 11 19 Q4 19 4 15 Z M17 9 L20 9 Q24 12 20 15 L17 15 M2 22 L21 22 M8 5 Q6 3 9 1 M13 5 Q11 3 14 1',
 restaurant:'M4 2 L4 10 Q7 14 10 10 L10 2 M7 2 L7 22 M18 22 L18 2 Q13 8 15 12 L18 12',
 bakery:'M3 12 Q1 6 7 5 Q12 0 17 5 Q24 5 22 12 L21 20 L4 20 Z M7 8 L9 12 M12 6 L14 11 M17 8 L19 12',
 pharmacy:'M9 2 L15 2 L15 9 L22 9 L22 15 L15 15 L15 22 L9 22 L9 15 L2 15 L2 9 L9 9 Z',
 clinic:'M9 2 L15 2 L15 7 L20 7 L20 13 L15 13 L15 18 L9 18 L9 13 L4 13 L4 7 L9 7 Z M2 22 L7 22 L10 19 L13 23 L16 20 L22 20',
 gym:'M2 7 L5 7 L5 17 L2 17 Z M5 5 L8 5 L8 19 L5 19 Z M8 11 L16 11 L16 13 L8 13 M16 5 L19 5 L19 19 L16 19 Z M19 7 L22 7 L22 17 L19 17',
 daycare:circle(6,5,3)+circle(18,5,3)+circle(12,12,8)+circle(9,11,1)+circle(15,11,1)+'M9 16 Q12 19 15 16',
 laundry:'M4 2 L20 2 L20 22 L4 22 Z M4 6 L20 6 M7 4 L8 4 M16 4 L17 4 '+circle(12,14,5)+'M8 15 Q11 12 16 15',
 hardware:'M3 22 L13 12 M12 9 L17 4 L21 8 L16 13 Z M12 9 L9 6 L14 1 L18 5 M4 17 L8 21',
 garage:'M3 17 L3 10 L6 4 L18 4 L21 10 L21 17 Z M3 10 L21 10 M5 17 L5 21 L8 21 L8 17 M16 17 L16 21 L19 21 L19 17 M6 13 L8 13 M16 13 L18 13',
 horsefarm:'M4 22 L5 16 L13 10 L13 3 L17 1 L20 7 L22 10 L18 12 L16 9 L15 18 L19 22 Z M9 12 L8 6 L13 3 M17 6 L18 6',
 bitcoinfarm:'M9 3 L9 21 M13 1 L13 3 M13 21 L13 23 M6 3 L15 3 Q22 3 19 9 Q18 11 14 11 L9 11 M9 11 L16 11 Q23 11 20 18 Q19 21 14 21 L6 21',
 station:'M5 3 Q12 0 19 3 L20 17 L17 20 L7 20 L4 17 Z M6 6 L18 6 L18 12 L6 12 Z M7 16 L9 16 M15 16 L17 16 M8 20 L5 23 M16 20 L19 23',
 office:'M5 22 L5 3 L16 3 L16 22 M16 9 L21 9 L21 22 M8 6 L10 6 M12 6 L14 6 M8 10 L10 10 M12 10 L14 10 M8 14 L10 14 M12 14 L14 14 M9 22 L9 18 L12 18 L12 22 M2 22 L23 22',
 hotel:'M2 7 L2 22 M22 12 L22 22 M2 18 L22 18 L22 12 Q22 9 18 9 L11 9 L11 18 M4 10 L9 10 L9 15 L4 15 Z',
 factory:'M2 22 L2 11 L8 6 L8 11 L14 6 L14 11 L22 11 L22 22 Z M17 11 L17 2 L21 2 L21 11 M6 16 L8 16 M12 16 L14 16 M18 16 L20 16',
 cementworks:'M4 15 L4 5 Q8 1 12 5 L12 15 Z M4 15 L8 20 L12 15 M8 20 L8 23 M15 4 L21 4 L21 20 L15 20 Z M15 8 L21 8 M15 12 L21 12 M15 16 L21 16',
 sawmill:circle(6,16,4)+circle(18,16,4)+circle(12,7,4)+'M6 12 L18 12 M9 4 L15 4 M4 16 L8 16 M16 16 L20 16',
 glassworks:'M3 3 L16 3 L16 18 L3 18 Z M8 7 L22 7 L22 22 L8 22 Z M11 17 L18 10 M13 20 L20 13',
 steelworks:'M3 2 L21 2 L21 6 L15 6 L15 18 L21 18 L21 22 L3 22 L3 18 L9 18 L9 6 L3 6 Z',
 brickworks:'M2 5 L22 5 L22 21 L2 21 Z M2 10 L22 10 M2 16 L22 16 M9 5 L9 10 M16 10 L16 16 M7 16 L7 21 M17 16 L17 21',
 airport:'M10 22 L10 15 L2 18 L2 15 L10 9 L10 3 Q12 0 14 3 L14 9 L22 15 L22 18 L14 15 L14 22 L17 23 L7 23 Z'
};
const data={
 home:['בית מגורים','#7a5643','בית עם גג רעפים, מרפסת וחצר','מגורים לתושבים והכנסה קבועה בכל רבעון.'],
 shop:['מכולת','#a75736','סוכך פסים, סל קניות ודוכני תוצרת','מוצרי יום־יום לתושבי השכונה; ההכנסה תלויה במלאי ובקניות.'],
 supermarket:['סופרמרקט','#366b52','חזית זכוכית רחבה, עגלות קניות וסמל עגלה','חנות מזון גדולה שמשרתת הרבה לקוחות בשכונה.'],
 cafe:['בית קפה','#754633','כוס קפה גדולה, שולחנות ושמשיות','קפה ואירוח לתושבים ולמבקרים; נדרש מלאי למכירות.'],
 restaurant:['מסעדה','#a14938','מזלג גדול, חצר אוכל ושולחנות ערוכים','ארוחות ושירות לסועדים; יותר תושבים ותחבורה מביאים לקוחות.'],
 bakery:['מאפייה','#a46c25','כיכר לחם על הגג, חלון תצוגה ותנור','מכירת לחמים ומאפים לתושבי השכונה.'],
 pharmacy:['בית מרקחת','#267753','צלב ירוק גדול וחזית בית מרקחת','מכירת מוצרי בריאות ושירות לתושבים; נדרש מלאי.'],
 clinic:['מרפאה','#347d92','צלב רפואי אדום, אמבולנס וכניסה מקורה','שירותי בריאות שמוסיפים מגוון ורווחה לשכונה.'],
 gym:['חדר כושר','#755796','משקולת ענקית, אולם ספורט וסל','פעילות ספורט וכושר לתושבים והכנסה שוטפת.'],
 daycare:['גן ילדים','#b78334','בתי משחק צבעוניים, קוביות, מגלשה וחצר מגודרת','שירות חינוך למשפחות; מוסיף מגוון שירותים לשכונה.'],
 laundry:['מכבסה','#377e9f','מכונות כביסה עם תופים עגולים בחזית','כביסה ושירותי יום־יום לתושבים.'],
 hardware:['כלי עבודה','#8d6538','פטיש, כלי עבודה ומדפים עם חומרי עזר','חנות ציוד וכלי עבודה; לקוחות קונים מהמלאי.'],
 garage:['מוסך','#3c6280','עמדות טיפול פתוחות, מכוניות ומתקני הרמה','טיפול ברכב ושירות לתושבי השכונה.'],
 horsefarm:['חוות סוסים','#677b40','סוסים במכלאה מגודרת, אורוות וגג אסם','רכיבה ואירוח; פארק ברובע משפר את ההכנסה.'],
 bitcoinfarm:['חוות ביטקוין','#9c7a29','מטבע ביטקוין גדול, שרתים ומערכות קירור','כריית מטבעות BE מדומים; דורשת קיבולת אנרגיה.'],
 station:['תחנת רכבת','#3d7581','רכבת ברציף, מסילות וסככות נוסעים','מרכז תחבורה שמחזק ביקוש והכנסה מהצי.'],
 office:['משרדים','#446d96','מגדל זכוכית גבוה עם קומות וכתר עליון','משרדים ופעילות עסקית; מייצרים הכנסה שוטפת.'],
 hotel:['מלון','#775788','שלט מלון, מרפסות ובריכת שחייה בין האגפים','אירוח ותיירות בעיר; עונת תיירות משפרת הכנסה.'],
 factory:['מפעל חכם','#54757c','גג תעשייתי משונן, ציוד ייצור וארובה','מפעל שמייצר הכנסה שוטפת; פולט עשן כשהוא פועל.'],
 cementworks:['מלט','#7e7a59','ממגורות מלט גבוהות, מערבל וארובות','מייצר מלט לבנייה ולמכירה לשחקנים.'],
 sawmill:['עץ','#8b623c','בולי עץ עגולים, סככת ניסור ומסור','מייצר עץ לבנייה ולמכירה לשחקנים.'],
 glassworks:['זכוכית','#368c9d','לוחות זכוכית שקופים, כבשן וגג מזוגג','מייצר זכוכית לפיתוח נכסים ולמסחר.'],
 steelworks:['פלדה','#716d5b','מנוף, קורות פלדה וכבשן עם מתכת לוהטת','מייצר פלדה לבנייה ולמסחר בין השחקנים.'],
 brickworks:['לבנים','#ab5b3b','קיר לבנים, ערמות לבנים וכבשן קמור','מייצר לבנים לפיתוח בתים ועסקים.'],
 airport:['שדה תעופה','#36718d','מטוס, מגדל פיקוח ומסלול המראה','טיסות וחופשות; הזמנות שחקנים מכניסות כסף לבעלים.']
};
export const BUILDING_IDENTITY=Object.freeze(Object.fromEntries(Object.entries(data).map(([type,[label,color,features,description]])=>[type,{label,color,features,description,path:icons[type]}])));
export function iconSVG(type){const d=BUILDING_IDENTITY[type];return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d?.path??icons.home}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
function traceIcon(ctx,path){const commands=path.match(/[MLQCZ][^MLQCZ]*/g)??[];ctx.beginPath();for(const command of commands){const n=command.slice(1).trim().split(/[ ,]+/).filter(Boolean).map(Number);switch(command[0]){case'M':ctx.moveTo(...n);break;case'L':ctx.lineTo(...n);break;case'Q':ctx.quadraticCurveTo(...n);break;case'C':ctx.bezierCurveTo(...n);break;case'Z':ctx.closePath();}}ctx.stroke();}
// A face-local 120 × 36 canvas is affinely mapped onto each physical sign.
export function signMatrix(points){const i=points[2][0]<points[3][0]?2:3,j=i===2?3:2,k=i===2?1:0,p=points[i],u=points[j],v=points[k];return[(u[0]-p[0])/120,(u[1]-p[1])/120,(v[0]-p[0])/36,(v[1]-p[1])/36,p[0],p[1]];}
export function drawSign(ctx,type,points){const d=BUILDING_IDENTITY[type];if(!d)return;const mat=signMatrix(points);if(Math.hypot(mat[0],mat[1])*120<22)return;ctx.save();ctx.transform(...mat);ctx.strokeStyle='#fff5db';ctx.lineWidth=1.7;ctx.lineJoin='round';ctx.lineCap='round';ctx.save();ctx.translate(87,6);traceIcon(ctx,d.path);ctx.restore();ctx.fillStyle='#fff5db';ctx.font=`bold ${d.label.length>8?12:15}px Arial,"DejaVu Sans",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction='rtl';ctx.fillText(d.label,43,19,76);ctx.restore();}
export function signSVG(type,points){const d=BUILDING_IDENTITY[type];if(!d)return'';return `<g transform="matrix(${signMatrix(points).map(n=>n.toFixed(5)).join(' ')})"><path transform="translate(87 6)" d="${d.path}" fill="none" stroke="#fff5db" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><text x="43" y="23" text-anchor="middle" direction="rtl" font-family="Arial,DejaVu Sans,sans-serif" font-size="${d.label.length>8?12:15}" font-weight="700" fill="#fff5db">${d.label}</text></g>`;}
