(() => {
  'use strict';
  const data = window.RESEARCH;
  if (!data) return;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = n => n >= 10000 ? `${(n / 10000).toFixed(1)}万` : n.toLocaleString('zh-CN');
  const duration = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
  const link = (url, text) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>`;
  let filter = 'all';
  let order = 'relevance';
  let lastTrigger = null;
  const dialog = $('#case-dialog');

  function renderSamples() {
    let samples = data.samples.filter(s => filter === 'all' || s.categories.includes(filter));
    if (order === 'views') samples.sort((a, b) => b.views - a.views);
    if (order === 'date') samples.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    $('#results-count').textContent = `显示 ${samples.length} / ${data.samples.length} 条 · 播放等数据均来自 B 站`;
    $('#sample-grid').innerHTML = samples.map(s => `<article class="sample">
      <div class="sample-visual"><div class="poster" aria-hidden="true">${esc(s.title)}</div><img src="${esc(s.thumbnail)}" alt="${esc(s.title)}的原作封面" loading="lazy" referrerpolicy="no-referrer"><span class="length">${duration(s.duration)}</span></div>
      <div class="sample-body"><div class="sample-kicker"><span>${esc(s.topic)}</span><time datetime="${s.publishedAt}">${s.publishedAt}</time></div><h3>${esc(s.title)}</h3><p>${esc(s.hook)}</p>
      <div class="sample-stat"><div><strong title="${s.views.toLocaleString('zh-CN')}">${number(s.views)}</strong><span>播放</span></div><div><strong title="${s.likes.toLocaleString('zh-CN')}">${number(s.likes)}</strong><span>点赞</span></div><div><strong title="${s.favorites.toLocaleString('zh-CN')}">${number(s.favorites)}</strong><span>收藏</span></div></div>
      <div class="sample-actions"><button data-case="${s.id}" aria-haspopup="dialog" aria-label="查看拆解：${esc(s.title)}">查看拆解 ＋</button>${link(s.url, '观看原片')}</div></div></article>`).join('');
    $$('#sample-grid img').forEach(img => img.addEventListener('error', () => { img.hidden = true; img.style.display = 'none'; }));
  }

  $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    $$('[data-filter]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    renderSamples();
  }));
  $('#sample-sort').addEventListener('change', e => { order = e.target.value; renderSamples(); });
  $('#sample-date').textContent = `采集：${data.retrievedAt.slice(0, 10)} · 展示值按万保留一位小数；数据快照保留原值。`;
  renderSamples();

  function openCase(s, trigger) {
    lastTrigger = trigger;
    $('#case-content').innerHTML = `<p class="case-meta">BILIBILI · ${s.publishedAt} · ${duration(s.duration)}</p><h2 id="case-title">${esc(s.title)}</h2><p>原作标题：${esc(s.originalTitle)}</p>
    <div class="case-metrics"><span>播放 ${s.views.toLocaleString('zh-CN')}</span><span>点赞 ${s.likes.toLocaleString('zh-CN')}</span><span>收藏 ${s.favorites.toLocaleString('zh-CN')}</span><span>评论 ${s.comments.toLocaleString('zh-CN')}</span></div>
    <h3><span class="tag fact">公开事实</span> 从哪里观察</h3><p>${esc(s.fact)}</p>
    <h3><span class="tag analysis">研究判断</span> 值得拆解什么</h3><p>${esc(s.analysis)}</p>
    <h3><span class="tag suggestion">创作建议</span> 通用表达参考</h3><p>${esc(s.reference)}</p>
    <p class="note">${esc(s.boundary)}<br>拆解基于公开标题、简介或标签，未替代完整观看。数据为${data.retrievedAt.slice(0,10)}快照。</p>
    <div class="case-links">${link(s.url,'打开原作')}${link(s.api,'官方数据接口')}</div>`;
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    $('#close-dialog').focus();
  }
  $('#sample-grid').addEventListener('click', e => {
    const trigger = e.target.closest('[data-case]');
    if (trigger) { const sample = data.samples.find(s => s.id === trigger.dataset.case); if (sample) openCase(sample, trigger); }
  });
  $('#close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {
    const rect = dialog.getBoundingClientRect();
    if (e.target === dialog && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; lastTrigger?.focus(); });

  function selectMap(key) {
    const m = data.maps[key];
    if (!m) return;
    $$('[data-map]').forEach(button => { const selected = button.dataset.map === key; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; });
    $('#map-panel').setAttribute('aria-labelledby', `maptab-${key}`);
    $('#map-panel').innerHTML = `<span class="map-no" aria-hidden="true">${m.no}</span><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p><div class="map-examples">${m.examples.map(x => `<span>${esc(x)}</span>`).join('')}</div><p class="note"><span class="tag suggestion">研究参考</span> ${esc(m.reference)}</p>`;
  }
  const tabs = $$('[data-map]');
  tabs.forEach((button, i) => {
    button.addEventListener('click', () => selectMap(button.dataset.map));
    button.addEventListener('keydown', e => {
      let next;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i + tabs.length - 1) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { e.preventDefault(); selectMap(tabs[next].dataset.map); tabs[next].focus(); }
    });
  });
  selectMap('self');

  const storageKey = 'fushi-ip-research-v1';
  let saved = [];
  try { const value = JSON.parse(localStorage.getItem(storageKey)); if (Array.isArray(value)) saved = value; } catch {}
  const tasks = $$('[data-task]');
  const updateTasks = () => { $('#task-count').textContent = `${tasks.filter(t => t.checked).length} / ${tasks.length} 完成`; };
  tasks.forEach(input => {
    input.checked = saved.includes(input.dataset.task);
    input.addEventListener('change', () => { updateTasks(); try { localStorage.setItem(storageKey, JSON.stringify(tasks.filter(t => t.checked).map(t => t.dataset.task))); } catch {} });
  });
  updateTasks();
  const updateProgress = () => { const total = document.documentElement.scrollHeight - innerHeight; $('#progress').style.width = `${total > 0 ? Math.min(100, scrollY / total * 100) : 0}%`; };
  addEventListener('scroll', updateProgress, {passive:true});
  addEventListener('resize', updateProgress);
  updateProgress();
  if ('IntersectionObserver' in window) {
    const links = $$('.header nav a');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) links.forEach(a => a.classList.toggle('active', a.hash === `#${entry.target.id}`)); });
    }, {rootMargin:'-15% 0px -65% 0px'});
    links.forEach(a => { const section = $(a.hash); if (section) observer.observe(section); });
  }
  let printState;
  addEventListener('beforeprint', () => { printState = {filter,order}; filter = 'all'; order = 'relevance'; renderSamples(); });
  addEventListener('afterprint', () => { if (printState) { ({filter,order} = printState); printState = null; renderSamples(); } });
  $('#print').addEventListener('click', () => window.print());
})();
