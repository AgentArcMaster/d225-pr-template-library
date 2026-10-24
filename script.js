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
  const collectionView = document.querySelector('#collection-view');
  const designView = document.querySelector('#design-view');
  const templateList = document.querySelector('#template-list');
  const comingSoon = document.querySelector('#coming-soon');
  const toast = document.querySelector('#copy-toast');
  let activeFilter = 'All';
  let visibleLimit = 12;
  let toastTimer;
  let activeCollectionId = null;
  let returnFocus = null;

  const normalize = value => String(value || '').toLowerCase().trim();
  const validCanvaUrl = value => {
    try { const url = new URL(value); return url.protocol === 'https:' && ['canva.com', 'www.canva.com', 'canva.link'].includes(url.hostname); }
    catch { return false; }
  };
  const validPreview = value => typeof value === 'string' && (/^assets\/[\w./-]+\.(?:png|jpe?g|webp)$/i.test(value) || /^https:\/\//i.test(value));
  // A supplied preview can be listed before its Canva template link is ready.
  const published = templates.filter(item => item.id && item.title && categories.some(category => category.id === item.category) && (validPreview(item.image) || validCanvaUrl(item.canvaUrl)));
  const templateFor = id => published.filter(item => item.category === id);
  const findCategory = id => categories.find(item => item.id === id);
  const searchableTemplate = item => {
    const category = findCategory(item.category);
    return [item.title, item.role, ...(Array.isArray(item.tags) ? item.tags : []), item.format, category?.title, category?.tag].join(' ').toLowerCase();
  };

  function createPreview(item, large = false) {
    const frame = document.createElement('div'); frame.className = large ? 'design-preview-frame' : 'template-preview-frame';
    const placeholder = document.createElement('div'); placeholder.className = 'template-placeholder'; placeholder.textContent = item.title;
    if (validPreview(item.image)) {
      const img = document.createElement('img'); img.src = item.image; img.alt = `Full preview of ${item.title}`; img.loading = large ? 'eager' : 'lazy'; img.decoding = 'async';
      img.addEventListener('error', () => img.replaceWith(placeholder), { once: true });
      frame.append(img);
    } else frame.append(placeholder);
    return frame;
  }

  function createTemplateCard(item) {
    const card = document.createElement('button'); card.type = 'button'; card.className = 'template-item';
    card.setAttribute('aria-label', `View ${item.title} preview`);
    card.append(createPreview(item));
    const body = document.createElement('div'); body.className = 'template-item-body';
    const category = findCategory(item.category);
    const label = document.createElement('span'); label.className = 'template-category'; label.textContent = category.title;
    const heading = document.createElement('h3'); heading.textContent = item.title;
    const meta = document.createElement('p'); meta.textContent = [item.role, item.format || 'Poster'].filter(Boolean).join(' · ');
    const action = document.createElement('span'); action.className = 'template-view-action'; action.textContent = 'View design ↗';
    body.append(label, heading, meta, action); card.append(body);
    card.addEventListener('click', () => openDesign(item));
    return card;
  }

  function showCollection(id) {
    const category = findCategory(id);
    if (!category) return;
    activeCollectionId = id;
    document.querySelector('#dialog-kicker').textContent = `${category.tag} / Collection ${category.mark}`;
    document.querySelector('#dialog-title').textContent = category.title;
    const available = templateFor(id);
    document.querySelector('#dialog-description').textContent = available.length
      ? 'Choose a design to see its full preview and Canva editing option.'
      : (category.details || 'A dedicated collection for this poster type.');
    templateList.replaceChildren(...available.map(createTemplateCard));
    comingSoon.hidden = available.length > 0;
    designView.hidden = true;
    collectionView.hidden = false;
    dialog.setAttribute('aria-labelledby', 'dialog-title');
    history.replaceState(null, '', `#collection-${id}`);
  }

  function openDesign(item) {
    if (!dialog.open) { returnFocus = document.activeElement; dialog.showModal(); }
    showCollection(item.category);
    document.querySelector('#design-preview').replaceChildren(createPreview(item, true));
    document.querySelector('#design-kicker').textContent = findCategory(item.category).title;
    document.querySelector('#design-title').textContent = item.title;
    document.querySelector('#design-meta').textContent = [item.role, item.format || 'Poster'].filter(Boolean).join(' · ');
    const link = document.querySelector('#design-canva-link');
    const hasLink = validCanvaUrl(item.canvaUrl);
    link.hidden = !hasLink;
    if (hasLink) link.href = item.canvaUrl;
    else link.removeAttribute('href');
    document.querySelector('#design-link-pending').hidden = hasLink;
    collectionView.hidden = true;
    designView.hidden = false;
    dialog.setAttribute('aria-labelledby', 'design-title');
    history.replaceState(null, '', `#design-${encodeURIComponent(item.id)}`);
    document.querySelector('#design-back').focus();
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
    if (!findCategory(id)) return;
    returnFocus = document.activeElement;
    showCollection(id);
    if (!dialog.open) dialog.showModal();
    document.querySelector('#dialog-close').focus();
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
  document.querySelector('#design-back').addEventListener('click', () => {
    showCollection(activeCollectionId);
    document.querySelector('#dialog-close').focus();
  });
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    if (location.hash.startsWith('#collection-') || location.hash.startsWith('#design-')) history.replaceState(null, '', '#library');
    if (returnFocus?.isConnected) returnFocus.focus();
    returnFocus = null;
  });
  document.querySelectorAll('.swatch').forEach(button => button.addEventListener('click', async () => {
    const hex = button.dataset.hex;
    try { await navigator.clipboard.writeText(hex); toast.textContent = `${hex} copied to clipboard`; }
    catch { toast.textContent = `HEX: ${hex}`; }
    toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }));
  render();
  const initial = decodeURIComponent(location.hash.slice(1));
  if (initial.startsWith('collection-')) openCollection(initial.slice('collection-'.length));
  else if (initial.startsWith('design-')) {
    const item = published.find(design => design.id === initial.slice('design-'.length));
    if (item) openDesign(item);
  }
})();
