const sum = (items, value) => items.reduce((total, item) => total + (Number(value(item)) || 0), 0);
const owned = (state, player) => state.assets.filter(asset => asset.owner === player.id);
const GOALS = [
  ['land', 'מרחיבים את האימפריה', 'רכשו נכסים חדשים', [1, 2, 3, 4, 5, 6], (state, player) => owned(state, player).length],
  ['homes', 'קורת גג לתושבים', 'הוסיפו בתי מגורים', [1, 2, 3, 4, 5, 6], (state, player) => owned(state, player).filter(asset => asset.type === 'home' && asset.level).length],
  ['business', 'עסקים ברחוב', 'הוסיפו עסקים פעילים', [1, 2, 3, 4, 5, 6], (state, player) => owned(state, player).filter(asset => asset.level && asset.type !== 'home').length],
  ['levels', 'העיר עולה קומה', 'הוסיפו רמות פיתוח לנכסים', [1, 2, 3, 5, 7, 10], (state, player) => sum(owned(state, player), asset => asset.level)],
  ['green', 'רחוב ירוק', 'בצעו הסבות ירוקות', [1, 2, 3, 4, 5, 6], (state, player) => owned(state, player).filter(asset => asset.green).length],
  ['managers', 'צוות שמנהל קדימה', 'מנו מנהלים לנכסים', [1, 2, 3, 4, 5, 6], (state, player) => owned(state, player).filter(asset => asset.manager).length],
  ['permits', 'עיר בתכנון', 'הוסיפו היתרי פיתוח מאושרים או בטיפול', [1, 2, 3, 4, 5, 6], (state, player) => owned(state, player).filter(asset => ['pending', 'approved'].includes(asset.permit)).length],
  ['stock', 'המדפים מתמלאים', 'הגדילו את מלאי המוצרים בעסקים ביחידות', [40, 80, 100, 120, 160, 200], (state, player) => sum(owned(state, player), asset => asset.stock)],
  ['customers', 'קהל חוזר לעיר', 'שרתו לקוחות נוספים בעסקים', [10, 20, 40, 60, 80, 100], (state, player) => sum(owned(state, player), asset => asset.totalCustomers)],
  ['factory', 'קווי הייצור עובדים', 'הוסיפו יחידות תוצרת למלאי המפעלים', [5, 10, 15, 20, 30, 40], (state, player) => sum(owned(state, player), asset => asset.outputStock)],
  ['trivia', 'ידע בשירות העיר', 'ענו נכון על שאלות טריוויה', [1, 2, 3, 4, 5, 6], (state, player) => player.triviaRight],
  ['mining', 'עתודות דיגיטליות', 'כרו מטבעות BE נוספים', [5, 10, 15, 20, 30, 40], (state, player) => player.mined],
  ['projects', 'משקיעים בתושבים', 'הוסיפו תשתיות עירוניות', [1, 2, 3, 4, 5, 6], (state, player) => player.projects.length],
  ['neighborhoods', 'קהילות חדשות', 'הוסיפו רמות לשכונות', [1, 2, 3, 4, 5, 6], (state, player) => sum(Object.values(player.neighborhoods), value => value)],
  ['fleet', 'העיר בתנועה', 'הוסיפו כלי רכב לצי', [1, 2, 3, 4, 5, 6], (state, player) => player.fleet.length],
  ['research', 'מעבדת העתיד', 'הוסיפו רמות מחקר', [1, 2, 3, 4, 5, 6], (state, player) => sum(Object.values(player.skills), value => value), 9],
  ['route', 'מגלים את הטיילת', 'בקרו בתחנות נוספות במסלול הצד', [1, 2, 3, 4, 5, 6], (state, player) => player.adventure?.visits ?? 0],
  ['operations', 'הארגון מתקדם', 'השלימו מבצעים מוצלחים', [1, 2, 3, 4, 5, 6], (state, player) => player.operationsWon ?? 0],
  ['security', 'ביטחון ברחובות', 'הוסיפו רמות אבטחה לנכסים', [1, 2, 3, 4, 5, 6], (state, player) => sum(owned(state, player), asset => asset.security)],
  ['reputation', 'שם טוב בעיר', 'צברו נקודות מוניטין נוספות', [2, 4, 6, 8, 10, 12], (state, player) => player.rep, 100]
];

export const CITY_MISSIONS = GOALS.flatMap(([kind, name, desc, targets], group) => targets.map((target, stage) => ({
  id: `city-${kind}-${stage + 1}`, kind, name: `${name} · ${target}`, desc: `${desc}: ${target}`,
  target, cash: 450 + stage * 200 + (group % 3) * 100, steps: stage >= 3 ? 2 : 1
})));
const BY_ID = new Map(CITY_MISSIONS.map(mission => [mission.id, mission]));
const GOAL_BY_KIND = new Map(GOALS.map(goal => [goal[0], goal]));
const metric = (state, player, mission) => Number(GOAL_BY_KIND.get(mission.kind)[4](state, player)) || 0;

export function initCityMissions(state) {
  for (const player of state.players) {
    player.cityMissions ??= {cycle: -1, active: [], completed: [], pendingSteps: 0};
    const board = player.cityMissions;
    const cycle = Math.floor((state.round - 1) / 8);
    if (board.cycle === cycle) continue;
    board.cycle = cycle;
    const completed = new Set(board.completed);
    const pool = CITY_MISSIONS.filter(mission => !completed.has(mission.id) && metric(state, player, mission) + mission.target <= (GOAL_BY_KIND.get(mission.kind)[5] ?? Infinity));
    let seed = ((state.seed >>> 0) ^ Math.imul(player.id + 1, 2654435761) ^ Math.imul(cycle + 1, 2246822519)) >>> 0;
    const chosen = [];
    while (pool.length && chosen.length < 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const index = Math.floor(seed / 4294967296 * pool.length);
      const [mission] = pool.splice(index, 1);
      chosen.push({id: mission.id, baseline: metric(state, player, mission)});
      for (let offset = pool.length - 1; offset >= 0; offset--) if (pool[offset].kind === mission.kind) pool.splice(offset, 1);
    }
    board.active = chosen;
  }
  return state;
}

export function cityMissionBoard(state, id) {
  const player = state.players[id], board = player.cityMissions;
  if (!board) return [];
  return board.active.flatMap(entry => {
    const mission = BY_ID.get(entry.id);
    return mission ? [{...mission, progress: Math.min(mission.target, Math.max(0, metric(state, player, mission) - entry.baseline)), complete: board.completed.includes(entry.id)}] : [];
  });
}

export function rewardCityMissions(state, id, log, missionId) {
  const player = state.players[id], board = player.cityMissions;
  for (const mission of cityMissionBoard(state, id)) {
    if (missionId && mission.id !== missionId) continue;
    if (mission.complete || mission.progress < mission.target) continue;
    board.completed.push(mission.id);
    player.cash += mission.cash;
    if (state.active === id && state.phase === 'action') player.ap += mission.steps;
    else board.pendingSteps += mission.steps;
    log(state, `${player.name}: משימת העיר ״${mission.name}״ הושלמה · ${mission.cash}+ קרדיטים, ${mission.steps}+ צעדי פעולה.`, 'mission');
  }
}

export function applyCityMissionSteps(player) {
  if (!player.cityMissions) return;
  player.ap += player.cityMissions.pendingSteps;
  player.cityMissions.pendingSteps = 0;
}