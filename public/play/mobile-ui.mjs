const viewport = matchMedia('(max-width: 680px)');
let dispose;
let loaded = document.readyState === 'complete';

function mountMobile() {
  const rail = document.querySelector('.command-rail');
  const nav = document.querySelector('#nav');
  const body = document.body;
  const restores = [];
  const move = (element, target) => {
    const marker = document.createComment('mobile position');
    element.before(marker);
    target.append(element);
    restores.push(() => marker.replaceWith(element));
  };
  const fold = (title, elements) => {
    const details = document.createElement('details');
    details.className = 'mobile-fold';
    const summary = document.createElement('summary');
    summary.textContent = title;
    details.append(summary);
    elements[0].before(details);
    elements.forEach(element => move(element, details));
    return details;
  };
  const menu = document.createElement('dialog');
  menu.id = 'mobile-menu';
  menu.className = 'mobile-menu';
  menu.setAttribute('aria-labelledby', 'mobile-menu-title');
  menu.innerHTML = `<div class="mobile-menu-heading"><h2 id="mobile-menu-title">מרכז המשחק</h2><button type="button" class="icon-btn" data-mobile-close aria-label="סגירת התפריט" title="סגירת התפריט">×</button></div><nav class="mobile-command-shortcuts" aria-label="מפקדה ומשימות"><button type="button" data-tab="syndicate"><span aria-hidden="true">♜</span>מפקדת הארגון</button><button type="button" data-tab="missions"><span aria-hidden="true">⚑</span>משימות העיר</button></nav><details class="mobile-fold mobile-status"><summary>מצב האימפריה</summary><div class="mobile-status-content"></div></details>`;
  body.append(menu);
  move(rail, menu);
  const journal = document.querySelector('.journal');
  const reports = fold('דוחות העיר', [journal]);
  move(reports, menu);
  const tools = document.createElement('div');
  tools.className = 'mobile-tools';
  tools.innerHTML = `<button type="button" data-mobile-action="online-open">♧ הזמנת חברים</button><button type="button" data-mobile-action="sound">♪ צלילים</button><button type="button" data-mobile-action="help">? כללי המשחק</button><button type="button" data-mobile-action="trivia">? טריוויה</button><button type="button" data-mobile-action="restart">↗ עיר חדשה</button>`;
  menu.append(tools);
  const bottom = document.createElement('nav');
  bottom.className = 'mobile-bottom-nav';
  bottom.setAttribute('aria-label', 'ניווט מהיר');
  bottom.innerHTML = `<button type="button" data-tab="city"><span aria-hidden="true">▦</span>עיר</button><button type="button" data-tab="adventures"><span aria-hidden="true">⌁</span>משימות צד</button><button type="button" data-tab="businesses"><span aria-hidden="true">⌂</span>עסקים</button><button type="button" data-tab="portfolio"><span aria-hidden="true">▥</span>נכסים</button><button type="button" data-mobile-menu aria-haspopup="dialog" aria-controls="mobile-menu"><span aria-hidden="true">☰</span>עוד</button>`;
  body.append(bottom);
  const shortcuts = document.createElement('nav');
  shortcuts.className = 'mobile-top-shortcuts';
  shortcuts.setAttribute('aria-label', 'מפקדה ומשימות');
  shortcuts.innerHTML = '<button type="button" data-tab="missions" title="משימות העיר"><span aria-hidden="true">⚑</span>משימות העיר</button><button type="button" data-tab="syndicate" title="מפקדת הארגון"><span aria-hidden="true">♜</span>מפקדת הארגון</button>';
  document.querySelector('.top-actions').append(shortcuts);
  const trivia = document.querySelector('#trivia');
  const triviaLabel = document.createElement('span');
  triviaLabel.className = 'mobile-trivia-label';
  triviaLabel.innerHTML = 'טריוויה <small>צעדים +</small>';
  trivia.append(triviaLabel);
  move(trivia, document.querySelector('.turn-bar'));
  const round = document.createElement('span');
  round.className = 'mobile-round';
  document.querySelector('.top-actions').before(round);
  const playerStats = document.createElement('div');
  playerStats.className = 'mobile-player-stats';
  playerStats.innerHTML = '<span class="mobile-player-level"></span><span class="mobile-player-reputation"></span>';
  round.before(playerStats);
  const lots = fold('נכסים ברובע', [document.querySelector('.land-list-heading'), document.querySelector('#land-list')]);
  const route = fold('משימות צד', [document.querySelector('#route-dock')]);
  move(lots, menu);
  move(route, menu);
  const overview = document.createElement('div');
  overview.className = 'mobile-city-overview';
  overview.innerHTML = '<section class="mobile-empire-status" aria-labelledby="mobile-empire-title"><h2 id="mobile-empire-title">מצב האימפריה</h2><div class="mobile-empire-metrics"></div></section><section class="mobile-rivals-status" aria-labelledby="mobile-rivals-title"><h2 id="mobile-rivals-title">מצב המתחרים</h2></section>';
  document.querySelector('.event-banner').after(overview);
  const empire = overview.querySelector('.mobile-empire-status');
  move(document.querySelector('.prestige'), empire);
  move(document.querySelector('#war-status'), empire);
  move(document.querySelector('#rivals'), overview.querySelector('.mobile-rivals-status'));
  const copyMetrics = () => {
    const metrics = document.querySelector('.metric-grid').cloneNode(true);
    metrics.removeAttribute('aria-label');
    metrics.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    return metrics;
  };
  const inspector = document.querySelector('.inspector');
  const planning = fold('ניהול הנכס שנבחר', [inspector]);
  planning.classList.add('mobile-planning');
  let selected = document.querySelector('#selected-id').textContent;
  const sync = () => {
    const tab = nav.querySelector('.active')?.dataset.tab || 'city';
    body.dataset.mobileTab = tab;
    tools.querySelector('[data-mobile-action="trivia"]').disabled = trivia.disabled;
    round.textContent = 'רבעון ' + document.querySelector('#quarter').textContent;
    const rank = document.querySelector('#rank').textContent;
    playerStats.querySelector('.mobile-player-level').textContent = rank.split('·').pop().trim();
    playerStats.querySelector('.mobile-player-reputation').textContent = 'מוניטין ' + document.querySelector('#reputation').textContent;
    overview.querySelector('.mobile-empire-metrics').replaceChildren(copyMetrics());
    planning.querySelector('summary').textContent = 'ניהול הנכס · ' + document.querySelector('#property-name').textContent;
    for (const button of bottom.querySelectorAll('button')) {
      const active = button.dataset.tab === tab || (button.hasAttribute('data-mobile-menu') && !['city', 'adventures', 'businesses', 'portfolio'].includes(tab));
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
  };
  const snapshot = () => {
    const content = menu.querySelector('.mobile-status-content');
    content.replaceChildren(copyMetrics());
  };
  const close = () => menu.close();
  const onClick = event => {
    if (event.target.closest('[data-mobile-menu]')) {
      snapshot();
      menu.showModal();
    }
    if (event.target.closest('[data-mobile-close]') || event.target === menu) close();
    const action = event.target.closest('[data-mobile-action]');
    if (action) {
      close();
      document.getElementById(action.dataset.mobileAction).click();
    }
    if (event.target.closest('[data-tab]')) {
      if (menu.open) close();
      queueMicrotask(() => {
        sync();
        document.querySelector('.center-panel').scrollIntoView({block: 'start'});
      });
    }
    if (event.target.closest('#trivia')) close();
  };
  const onToggle = () => {
    body.classList.toggle('mobile-menu-open', menu.open);
    for (const button of body.querySelectorAll('[data-mobile-menu]')) button.setAttribute('aria-expanded', String(menu.open));
  };
  const onInspect = event => {
    if (event.target.closest('#property-manage, [data-asset]')) planning.open = true;
  };
  const onManageRequest = () => {
    planning.open = true;
    queueMicrotask(() => {
      sync();
      document.querySelector('#inspector-actions').scrollIntoView({block: 'start', behavior: 'smooth'});
    });
  };
  menu.addEventListener('close', onToggle);
  menu.addEventListener('toggle', onToggle);
  document.addEventListener('click', onClick);
  document.addEventListener('click', onInspect, true);
  document.addEventListener('property-manage-request', onManageRequest);
  const observer = new MutationObserver(sync);
  observer.observe(nav, {subtree: true, attributes: true, attributeFilter: ['class']});
  observer.observe(document.querySelector('#quarter'), {childList: true, characterData: true, subtree: true});
  observer.observe(trivia, {attributes: true, attributeFilter: ['disabled']});
  observer.observe(document.querySelector('#rank'), {childList: true, characterData: true, subtree: true});
  observer.observe(document.querySelector('#reputation'), {childList: true, characterData: true, subtree: true});
  observer.observe(document.querySelector('.metric-grid'), {childList: true, characterData: true, subtree: true});
  const selectionObserver = new MutationObserver(() => {
    sync();
    const current = document.querySelector('#selected-id').textContent;
    if (current !== selected) {
      selected = current;
      planning.open = true;
      document.querySelector('#inspector-actions').scrollIntoView({block: 'start', behavior: 'smooth'});
    }
  });
  selectionObserver.observe(document.querySelector('#selected-id'), {childList: true});
  body.classList.add('mobile-ready');
  onToggle();
  sync();
  return () => {
    observer.disconnect();
    selectionObserver.disconnect();
    document.removeEventListener('click', onClick);
    document.removeEventListener('click', onInspect, true);
    document.removeEventListener('property-manage-request', onManageRequest);
    menu.close();
    restores.reverse().forEach(restore => restore());
    [menu, bottom, shortcuts, triviaLabel, round, playerStats, lots, route, overview, reports, planning].forEach(element => element.remove());
    body.classList.remove('mobile-ready', 'mobile-menu-open');
    delete body.dataset.mobileTab;
  };
}

function updateLayout() {
  if (!loaded) return;
  if (viewport.matches && !dispose) dispose = mountMobile();
  else if (!viewport.matches && dispose) {
    dispose();
    dispose = undefined;
  }
}

if (!loaded) window.addEventListener('load', () => { loaded = true; updateLayout(); }, {once: true});
else updateLayout();
viewport.addEventListener('change', updateLayout);