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
    $('#results-count').textContent = `显示 ${samples.length} / ${data.samples.length} 条`;
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
  renderSamples();

  function openCase(s, trigger) {
    lastTrigger = trigger;
    $('#case-content').innerHTML = `<p class="case-meta">BILIBILI · ${s.publishedAt} · ${duration(s.duration)}</p><h2 id="case-title">${esc(s.title)}</h2><p>原作标题：${esc(s.originalTitle)}</p>
    <div class="case-metrics"><span>播放 ${s.views.toLocaleString('zh-CN')}</span><span>点赞 ${s.likes.toLocaleString('zh-CN')}</span><span>收藏 ${s.favorites.toLocaleString('zh-CN')}</span><span>评论 ${s.comments.toLocaleString('zh-CN')}</span></div>
    <h3>作品内容</h3><p>${esc(s.fact)}</p>
    ${s.dossier ? `<div class="case-dossier"><p class="eyebrow">叙述路径</p><p class="case-arc">${esc(s.dossier.arc)}</p>${s.dossier.outline.length ? `<h3>作者公开的内容顺序</h3><ol class="case-outline">${s.dossier.outline.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}<h3>内容结构</h3><p>${esc(s.dossier.logic)}</p></div>` : ''}
    <div class="case-links">${link(s.url,'打开原作')}</div>`;
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
    $('#map-panel').innerHTML = `<span class="map-no" aria-hidden="true">${m.no}</span><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p><div class="map-examples">${m.examples.map(x => `<span>${esc(x)}</span>`).join('')}</div>`;
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


  const catalog = data.catalog || [];
  const seasons = data.seasons || [];
  let archiveLimit = 12;
  const localDate = unix => new Date(unix * 1000 + 8 * 3600 * 1000).toISOString().slice(0,10);
  const median = values => { const sorted = [...values].sort((a,b) => a-b); const m = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[m] : (sorted[m-1] + sorted[m]) / 2; };
  $('#series-grid').innerHTML = seasons.map((s,i) => `<article class="series-card"><div class="series-meta"><span>COLLECTION ${String(i+1).padStart(2,'0')}</span><span>${s.count}条</span></div><h4>${esc(s.name)}</h4><p><strong>${esc(s.role)}</strong></p><p>${esc(s.about)}</p><p>${esc(s.analysis)}</p><button data-series="${esc(s.name)}">查看这个合集的作品 ↓</button></article>`).join('');
  $('#archive-series').insertAdjacentHTML('beforeend', seasons.map(s => `<option value="${esc(s.name)}">${esc(s.name)} · ${s.count}条</option>`).join(''));
  function renderArchive() {
    const query = $('#archive-search').value.trim().toLowerCase();
    const series = $('#archive-series').value;
    const order = $('#archive-sort').value;
    const records = catalog.filter(s => (series === 'all' || s.series.includes(series)) && (!query || `${s.originalTitle} ${s.series.join(' ')}`.toLowerCase().includes(query)));
    records.sort((a,b) => order === 'views' ? b.views-a.views : order === 'duration' ? b.duration-a.duration : b.publishedAt.localeCompare(a.publishedAt));
    const visible = records.slice(0,archiveLimit);
    $('#archive-count').textContent = `匹配 ${records.length} / ${catalog.length} 条 · 已显示 ${visible.length} 条`;
    $('#archive-body').innerHTML = visible.length ? visible.map(s => `<tr><td>${link(s.url,s.originalTitle)}</td><td>${esc(s.series.join(' / '))}</td><td>${s.publishedAt}</td><td>${duration(s.duration)}</td><td title="${s.views.toLocaleString('zh-CN')}">${number(s.views)}</td></tr>`).join('') : '<tr><td colspan="5">没有匹配作品，请换一个关键词或合集。</td></tr>';
    $('#archive-more').hidden = visible.length >= records.length;
    $('#archive-more').textContent = `再显示${Math.min(12,records.length-visible.length)}条 ↓`;
  }
  $('#archive-search').addEventListener('input', () => { archiveLimit = 12; renderArchive(); });
  $('#archive-series').addEventListener('change', () => { archiveLimit = 12; renderArchive(); });
  $('#archive-sort').addEventListener('change', () => { archiveLimit = 12; renderArchive(); });
  $('#archive-more').addEventListener('click', () => { archiveLimit += 12; renderArchive(); });
  $('#series-grid').addEventListener('click', e => { const button = e.target.closest('[data-series]'); if (!button) return; $('#archive-series').value = button.dataset.series; $('#archive-search').value = ''; archiveLimit = 12; renderArchive(); $('#catalog').scrollIntoView({behavior:'smooth'}); history.replaceState(null,'','#catalog'); });
  renderArchive();
  const maxRecord = [...catalog].sort((a,b) => b.views-a.views)[0];
  $('#performance-stats').innerHTML = `<div><span>本批累计播放中位数</span><strong>${number(median(catalog.map(s => s.views)))}</strong><p>81条跨年作品的中间值</p></div><div><span>本批时长中位数</span><strong>${duration(Math.round(median(catalog.map(s => s.duration))))}</strong><p>时长跨度 ${duration(Math.min(...catalog.map(s => s.duration)))} — ${duration(Math.max(...catalog.map(s => s.duration)))}</p></div><div><span>本批最高累计播放</span><strong>${number(maxRecord.views)}</strong><p>${esc(maxRecord.originalTitle)}</p></div>`;
  $('#series-metrics').innerHTML = seasons.map(s => `<tr><td>${esc(s.name)}</td><td>${s.count}</td><td>${number(s.medianViews)}</td><td>${duration(Math.round(s.medianDuration))}</td><td>${localDate(s.first)} — ${localDate(s.last)}</td></tr>`).join('');
  $('#year-matrix').innerHTML = seasons.map(s => `<tr><td>${esc(s.name)}</td>${['2022','2023','2024','2025','2026'].map(year => `<td>${catalog.filter(x => x.series.includes(s.name) && x.publishedAt.startsWith(year)).length}</td>`).join('')}</tr>`).join('');
  const months = Array.from({length:12}, (_,i) => { const d = new Date(Date.UTC(2025,10+i,1)); const key = d.toISOString().slice(0,7); return {key,label:`${String(d.getUTCFullYear()).slice(-2)}.${String(d.getUTCMonth()+1).padStart(2,'0')}`,count:catalog.filter(s => s.publishedAt.startsWith(key)).length}; });
  const maxMonth = Math.max(1,...months.map(m => m.count));
  $('#month-chart').innerHTML = months.map(m => `<div class="month-bar" title="${m.key}：本批${m.count}条"><b>${m.count}</b><i style="height:${m.count/maxMonth*112}px" aria-hidden="true"></i><span>${m.label}</span></div>`).join('');

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
  addEventListener('beforeprint', () => { printState = {filter,order,archiveLimit,query:$('#archive-search').value,series:$('#archive-series').value,details:$$('details').map(d => d.open)}; filter = 'all'; order = 'relevance'; archiveLimit = catalog.length; $('#archive-search').value = ''; $('#archive-series').value = 'all'; $$('details').forEach(d => d.open = true); renderSamples(); renderArchive(); });
  addEventListener('afterprint', () => { if (printState) { ({filter,order,archiveLimit} = printState); $('#archive-search').value = printState.query; $('#archive-series').value = printState.series; $$('details').forEach((d,i) => d.open = printState.details[i]); printState = null; renderSamples(); renderArchive(); } });
  $('#print').addEventListener('click', () => window.print());
})();
