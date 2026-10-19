const PREFERENCE_KEY = 'block-empire-tutorial-v1';

export const TUTORIAL_STEPS = [
  {title: 'בוחרים נכס בעיר', text: 'לחצו על מגרש או מבנה במפה. האפשרויות של הנכס ייפתחו בצד שמאל במחשב, או באזור הניהול בטלפון.', target: '.city-canvas', tab: 'city'},
  {title: 'רוכשים ומשדרגים', text: 'בנכס פנוי אפשר לרכוש עסק פעיל או קרקע. בנכס שלכם מבקשים היתר ואז מפתחים לרמה הבאה. שימו לב למחיר ולצעדים הנדרשים.', target: '#inspector-actions', tab: 'city', manage: true},
  {title: 'שומרים על האימפריה', text: 'היתרה היא הכסף הזמין, והתזרים הוא התחזית לרבעון הבא. שמרו כסף לתחזוקה ודאגו לאנרגיה ולמלאי בעסקים.', target: '.metric-grid', tab: 'city'},
  {title: 'משימות שמקדמות אתכם', text: 'משימות העיר מתחלפות כל שמונה רבעונים. השלימו יעד ולחצו על איסוף תגמול לקבלת כסף וצעדי פעולה נוספים.', target: '#tab-view', tab: 'missions'},
  {title: 'ידע שווה פעולות', text: 'אפשר לפתוח טריוויה בכל תור: תשובה נכונה מוסיפה צעד פעולה. שלוש תשובות נכונות נותנות יחד חמישה צעדים נוספים.', target: '#trivia', tab: 'city'},
  {title: 'מסיימים תור וצומחים', text: 'כשסיימתם לפעול, לחצו על סיום התור. אחרי כל השחקנים מתקבלים תקבולי הרבעון. פתחו נכסים וצברו יוקרה כדי לנצח.', target: '#end-turn', tab: 'city'}
];

export function shouldShowTutorial(storage) {
  try { return storage.getItem(PREFERENCE_KEY) !== 'false'; }
  catch { return true; }
}

export function saveTutorialPreference(storage, showAgain) {
  try { storage.setItem(PREFERENCE_KEY, String(showAgain)); return true; }
  catch { return false; }
}

function mountTutorial() {
  const panel = document.createElement('section');
  panel.id = 'game-tutorial';
  panel.className = 'tutorial-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'tutorial-title');
  panel.innerHTML = '<div class="tutorial-heading"><span id="tutorial-counter"></span><button type="button" class="icon-btn" id="tutorial-close" aria-label="סגירת המדריך" title="סגירת המדריך">×</button></div><progress id="tutorial-progress" aria-label="התקדמות במדריך"></progress><div aria-live="polite"><h2 id="tutorial-title" tabindex="-1"></h2><p id="tutorial-text"></p></div><label class="tutorial-preference"><input type="checkbox" id="tutorial-again">להציג את המדריך בפעם הבאה?</label><small id="tutorial-storage-note" hidden>ההעדפה לא נשמרה בדפדפן הזה.</small><div class="tutorial-controls"><button type="button" class="secondary" id="tutorial-back" title="השלב הקודם">הקודם</button><button type="button" class="primary" id="tutorial-next">הבא</button></div>';
  document.body.append(panel);
  const counter = panel.querySelector('#tutorial-counter');
  const progress = panel.querySelector('#tutorial-progress');
  const title = panel.querySelector('#tutorial-title');
  const text = panel.querySelector('#tutorial-text');
  const preference = panel.querySelector('#tutorial-again');
  const storageNote = panel.querySelector('#tutorial-storage-note');
  const back = panel.querySelector('#tutorial-back');
  const next = panel.querySelector('#tutorial-next');
  let stepIndex = 0, highlighted, previousFocus;
  const storage = {
    getItem: key => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value)
  };
  const clearHighlight = () => {
    highlighted?.classList.remove('tutorial-target');
    highlighted = undefined;
  };
  const remember = () => {
    storageNote.hidden = saveTutorialPreference(storage, preference.checked);
  };
  const close = () => {
    remember();
    clearHighlight();
    panel.hidden = true;
    document.body.classList.remove('tutorial-active');
    if (previousFocus?.isConnected && previousFocus.getClientRects().length) previousFocus.focus({preventScroll: true});
  };
  const renderStep = () => {
    clearHighlight();
    const step = TUTORIAL_STEPS[stepIndex];
    counter.textContent = `מדריך קצר · ${stepIndex + 1} מתוך ${TUTORIAL_STEPS.length}`;
    progress.max = TUTORIAL_STEPS.length;
    progress.value = stepIndex + 1;
    title.textContent = step.title;
    text.textContent = step.text;
    back.disabled = stepIndex === 0;
    next.textContent = stepIndex === TUTORIAL_STEPS.length - 1 ? 'מתחילים לשחק' : 'הבא';
    document.querySelector(`#nav [data-tab="${step.tab}"]`).click();
    if (step.manage) document.dispatchEvent(new Event('property-manage-request'));
    const currentStep = stepIndex;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (panel.hidden || currentStep !== stepIndex) return;
      highlighted = document.querySelector(step.target);
      highlighted?.classList.add('tutorial-target');
      if (highlighted && !['#trivia', '#end-turn'].includes(step.target)) highlighted.scrollIntoView({block: 'start', behavior: 'smooth'});
      title.focus({preventScroll: true});
    }));
  };
  const start = () => {
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    previousFocus = document.activeElement;
    preference.checked = shouldShowTutorial(storage);
    storageNote.hidden = true;
    stepIndex = 0;
    panel.hidden = false;
    document.body.classList.add('tutorial-active');
    renderStep();
  };
  const autoStart = () => {
    if (shouldShowTutorial(storage) && !document.querySelector('dialog[open]') && !new URLSearchParams(location.search).has('room')) start();
  };
  panel.querySelector('#tutorial-close').onclick = close;
  preference.onchange = remember;
  back.onclick = () => { if (stepIndex > 0) { stepIndex--; renderStep(); } };
  next.onclick = () => {
    if (stepIndex === TUTORIAL_STEPS.length - 1) close();
    else { stepIndex++; renderStep(); }
  };
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); close(); }
  });
  document.addEventListener('game-started', autoStart);
  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'primary full tutorial-launch';
  launch.textContent = 'סיור קצר במשחק';
  launch.setAttribute('aria-controls', panel.id);
  launch.onclick = start;
  document.querySelector('#info ol').before(launch);
  autoStart();
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') mountTutorial();
  else window.addEventListener('load', mountTutorial, {once: true});
}