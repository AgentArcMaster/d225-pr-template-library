(() => {
  const { categories, templates } = window.D225_CATALOG;
  const grid = document.querySelector('#collection-grid');
  const search = document.querySelector('#template-search');
  const count = document.querySelector('#results-count');
  const empty = document.querySelector('#empty-search');
  const directResults = document.querySelector('#direct-results');
  const directGrid = document.querySelector('#direct-grid');
  const directCount = document.querySelector('#direct-count');
  const showMore = document.querySelector('#show-more');
  const dialog = document.querySelector('#collection-dialog');
  const templateList = document.querySelector('#template-list');
  const comingSoon = document.querySelector('#coming-soon');
  const toast = document.querySelector('#copy-toast');
  let activeFilter = 'All';
  let visibleLimit = 12;
  let toastTimer;

  const normalize = value => String(value || '').toLowerCase().trim();
  const validCanvaUrl = value => {
    try { const url = new URL(value); return url.protocol === 'https:' && ['canva.com', 'www.canva.com', 'canva.link'].includes(url.hostname); }
    catch { return false; }
  };
  const published = templates.filter(item => validCanvaUrl(item.canvaUrl) && categories.some(category => category.id === item.category));
  const templateFor = id => published.filter(item => item.category === id);
  const findCategory = id => categories.find(item => item.id === id);
  const searchableTemplate = item => {
    const category = findCategory(item.category);
    return [item.title, item.role, ...(Array.isArray(item.tags) ? item.tags : []), item.format, category?.title, category?.tag].join(' ').toLowerCase();
  };

  function createTemplateCard(item) {
    const article = document.createElement('article'); article.className = 'template-item';
    if (item.image && /^(assets\/|https:\/\/)/.test(item.image)) {
      const img = document.createElement('img'); img.src = item.image; img.alt = `${item.title} preview`; img.loading = 'lazy'; article.append(img);
    } else {
      const placeholder = document.createElement('div'); placeholder.className = 'template-placeholder'; placeholder.textContent = item.title; article.append(placeholder);
    }
    const body = document.createElement('div'); body.className = 'template-item-body';
    const category = findCategory(item.category);
    const label = document.createElement('span'); label.className = 'template-category'; label.textContent = category.title;
    const heading = document.createElement('h3'); heading.textContent = item.title;
    const meta = document.createElement('p'); meta.textContent = [item.role, item.format || 'Poster'].filter(Boolean).join(' · ');
    const link = document.createElement('a'); link.href = item.canvaUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Use in Canva ↗';
    body.append(label, heading, meta, link); article.append(body);
    return article;
  }

  function render() {
    const query = normalize(search.value);
    const designMatches = published.filter(item => {
      const category = findCategory(item.category);
      return (activeFilter === 'All' || category.tag === activeFilter) && (!query || searchableTemplate(item).includes(query));
    });
    directResults.hidden = designMatches.length === 0;
    directGrid.replaceChildren(...designMatches.slice(0, visibleLimit).map(createTemplateCard));
    directCount.textContent = `${designMatches.length} ${designMatches.length === 1 ? 'design' : 'designs'}`;
    showMore.hidden = designMatches.length <= visibleLimit;
    const matches = categories.filter(item => {
      const inFilter = activeFilter === 'All' || item.tag === activeFilter;
      const searchable = [item.title, item.tag, item.keywords, ...templateFor(item.id).flatMap(t => [t.title, t.role, ...(Array.isArray(t.tags) ? t.tags : [])])].join(' ').toLowerCase();
      return inFilter && (!query || searchable.includes(query));
    });
    grid.replaceChildren();
    matches.forEach(item => {
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'collection-card';
      const available = templateFor(item.id).length;
      card.setAttribute('aria-label', `View ${item.title} collection, ${available} ${available === 1 ? 'design' : 'designs'} available`);
      card.innerHTML = `<div class="card-art"><span class="art-corner">D225 / ${item.mark}</span><div class="card-poster"><small>DISTRICT 225 · PR</small><strong></strong><i></i></div></div><div class="card-content"><div class="card-topline"><span></span><span>${item.mark} / 13</span></div><h3></h3><div class="card-status"><span>${available ? `${available} ${available === 1 ? 'design' : 'designs'} available` : 'Designs coming soon'}</span><b aria-hidden="true">↗</b></div></div>`;
      card.querySelector('.card-poster strong').textContent = item.title;
      card.querySelector('.card-topline span').textContent = item.tag;
      card.querySelector('h3').textContent = item.title;
      card.addEventListener('click', () => openCollection(item.id));
      grid.append(card);
    });
    count.textContent = `${matches.length} ${matches.length === 1 ? 'collection' : 'collections'}`;
    empty.hidden = matches.length !== 0 || designMatches.length !== 0;
  }

  function openCollection(id) {
    const category = findCategory(id);
    if (!category) return;
    document.querySelector('#dialog-kicker').textContent = `${category.tag} / Collection ${category.mark}`;
    document.querySelector('#dialog-title').textContent = category.title;
    const available = templateFor(id);
    document.querySelector('#dialog-description').textContent = available.length
      ? 'Choose a design to open its Canva template. Replace the sample text and images with your club details before publishing.'
      : (category.details || 'A dedicated collection for this poster type.');
    templateList.replaceChildren();
    available.forEach(item => templateList.append(createTemplateCard(item)));
    comingSoon.hidden = available.length > 0;
    dialog.showModal();
    history.replaceState(null, '', `#collection-${id}`);
  }

  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll('.filter').forEach(b => { const selected = b === button; b.classList.toggle('active', selected); b.setAttribute('aria-pressed', String(selected)); });
    visibleLimit = 12; render();
  }));
  search.addEventListener('input', () => { visibleLimit = 12; render(); });
  document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => { search.value = button.dataset.query; visibleLimit = 12; render(); search.focus(); }));
  showMore.addEventListener('click', () => { visibleLimit += 12; render(); });
  document.querySelector('#clear-search').addEventListener('click', () => { search.value = ''; document.querySelector('[data-filter="All"]').click(); search.focus(); });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !dialog.open && !/input|textarea/i.test(document.activeElement.tagName)) { event.preventDefault(); search.focus(); }
  });
  document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { if (location.hash.startsWith('#collection-')) history.replaceState(null, '', '#library'); });
  document.querySelectorAll('.swatch').forEach(button => button.addEventListener('click', async () => {
    const hex = button.dataset.hex;
    try { await navigator.clipboard.writeText(hex); toast.textContent = `${hex} copied to clipboard`; }
    catch { toast.textContent = `HEX: ${hex}`; }
    toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }));
  render();
  const initial = decodeURIComponent(location.hash.slice(1));
  if (initial.startsWith('collection-')) openCollection(initial.slice('collection-'.length));
})();
