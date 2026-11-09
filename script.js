(() => {
  const { categories, templates } = window.D225_CATALOG;
  const grid = document.querySelector('#collection-grid');
  const search = document.querySelector('#template-search');
  const count = document.querySelector('#results-count');
  const empty = document.querySelector('#empty-search');
  const searchTip = document.querySelector('#search-tip');
  const searchTipText = document.querySelector('#search-tip-text');
  const searchTipAction = document.querySelector('#search-tip-action');
  const collectionTip = document.querySelector('#collection-tip');
  const collectionTipText = document.querySelector('#collection-tip-text');
  const collectionTipAction = document.querySelector('#collection-tip-action');
  let dismissedTipQuery = '';
  const dialog = document.querySelector('#collection-dialog');
  const collectionView = document.querySelector('#collection-view');
  const designView = document.querySelector('#design-view');
  const templateList = document.querySelector('#template-list');
  const collectionUpdate = document.querySelector('#collection-update');
  const comingSoon = document.querySelector('#coming-soon');
  const toast = document.querySelector('#copy-toast');
  let activeFilter = 'All';
  let toastTimer;
  let activeCollectionId = null;
  let returnFocus = null;

  const normalize = value => String(value || '').toLowerCase().trim();
  const matchesSearch = (text, query) => ['cc', 'cj', 'ge'].includes(query)
    ? new RegExp(`\\b${query}\\b`).test(text)
    : text.includes(query);
  const validCanvaUrl = value => {
    try { const url = new URL(value); return url.protocol === 'https:' && ['canva.com', 'www.canva.com', 'canva.link'].includes(url.hostname); }
    catch { return false; }
  };
  const validPreview = value => typeof value === 'string' && (/^assets\/[\w./-]+\.(?:png|jpe?g|webp)$/i.test(value) || /^https:\/\//i.test(value));
  // A supplied preview can be listed before its Canva template link is ready.
  const published = templates.filter(item => item.id && item.title && categories.some(category => category.id === item.category) && (validPreview(item.image) || validCanvaUrl(item.canvaUrl)));
  const templateFor = id => published.filter(item => item.category === id);
  const findCategory = id => categories.find(item => item.id === id);
  const relatedCollections = {
    'meeting-leaders': { target: 'club-contest', text: 'Some Speech Contests layouts can be personalised for TMOD / GE / TTM too.', action: 'Explore contest designs ↗' },
    'club-contest': { target: 'meeting-leaders', text: 'TMOD / GE / TTM layouts can be personalised for Contest Chair or Chief Judge too.', action: 'Explore meeting-role designs ↗' },
    'level-completion': { target: 'pathways-completion', text: 'Some Pathways Completion layouts can be adapted for a level milestone. Update the achievement wording to match.', action: 'Explore Pathways designs ↗' },
    'pathways-completion': { target: 'level-completion', text: 'Some Level Completion layouts can be adapted for a completed path. Update the achievement wording to match.', action: 'Explore Level designs ↗' },
    'triple-crown': { target: 'dtm', text: 'Some DTM layouts can be adapted for Triple Crown recognition. Replace the designation wording with the correct award.', action: 'Explore DTM designs ↗' },
    'dtm': { target: 'triple-crown', text: 'Some Triple Crown layouts can be adapted for a DTM milestone. Replace the award wording with the correct designation.', action: 'Explore Triple Crown designs ↗' }
  };
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
    const meta = document.createElement('p'); meta.textContent = [item.role, item.format || (item.category === 'certificates' ? 'Certificate' : 'Poster')].filter(Boolean).join(' · ');
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
    const allDesigns = templateFor(id);
    const query = normalize(search.value);
    const matchingDesigns = query ? allDesigns.filter(item => matchesSearch(searchableTemplate(item), query)) : [];
    const available = matchingDesigns.length ? matchingDesigns : allDesigns;
    document.querySelector('#dialog-description').textContent = available.length
      ? 'Choose a design to see its full preview and Canva editing option.'
      : (category.details || 'A dedicated collection for this poster type.');
    templateList.replaceChildren(...available.map(createTemplateCard));
    comingSoon.hidden = available.length > 0;
    document.querySelector('#coming-soon-description').textContent = id === 'certificates'
      ? 'Certificate previews will appear here as the PR team releases them.'
      : 'Poster previews will appear here as the PR team releases them.';
    const related = relatedCollections[id];
    collectionTip.hidden = !related;
    if (related) {
      collectionTipText.textContent = related.text;
      collectionTipAction.textContent = related.action;
      collectionTipAction.dataset.collection = related.target;
    }
    collectionUpdate.textContent = category.note || '';
    collectionUpdate.hidden = !category.note || allDesigns.length === 0;
    designView.hidden = true;
    collectionView.hidden = false;
    dialog.setAttribute('aria-labelledby', 'dialog-title');
    history.replaceState(null, '', `#collection-${id}`);
  }

  const promptForDesign = item => {
    if (item.category === 'agenda' && /\b(mom|minutes)\b/i.test([item.title, item.role, ...(item.tags || [])].join(' '))) return 'mom';
    return ({ 'club-awards': 'club-award', 'role-player-winners': 'role-winner', 'testimonials': 'testimonial' })[item.category] || item.category;
  };

  function openDesign(item) {
    if (!dialog.open) { returnFocus = document.activeElement; dialog.showModal(); }
    showCollection(item.category);
    document.querySelector('#design-preview').replaceChildren(createPreview(item, true));
    document.querySelector('#design-kicker').textContent = findCategory(item.category).title;
    document.querySelector('#design-title').textContent = item.title;
    document.querySelector('#design-meta').textContent = [item.role, item.format || (item.category === 'certificates' ? 'Certificate' : 'Poster')].filter(Boolean).join(' · ');
    document.querySelector('#design-instruction').textContent = item.category === 'certificates'
      ? 'Preview the certificate, then open its Canva template to personalise it for your recipient.'
      : 'Preview the full poster, then open its Canva template to personalise it for your club.';
    const link = document.querySelector('#design-canva-link');
    const hasLink = validCanvaUrl(item.canvaUrl);
    link.hidden = !hasLink;
    if (hasLink) link.href = item.canvaUrl;
    else link.removeAttribute('href');
    document.querySelector('#design-link-pending').hidden = hasLink;
    const credit = document.querySelector('#design-credit');
    document.querySelector('#design-credit-text').textContent = item.credit || '';
    credit.hidden = !item.credit;
    const captionButton = document.querySelector('#design-caption-button');
    const promptId = promptForDesign(item);
    captionButton.hidden = !window.D225_CATALOG.captionPrompts.some(prompt => prompt.id === promptId);
    captionButton.dataset.promptId = promptId;
    collectionView.hidden = true;
    designView.hidden = false;
    dialog.setAttribute('aria-labelledby', 'design-title');
    history.replaceState(null, '', `#design-${encodeURIComponent(item.id)}`);
    document.querySelector('#design-back').focus();
  }

  function render() {
    const query = normalize(search.value);
    const matches = categories.filter(item => {
      if (item.id === 'certificates' && !query) return false;
      const inFilter = activeFilter === 'All' || item.tag === activeFilter;
      const searchable = [item.title, item.tag, item.keywords, ...templateFor(item.id).map(searchableTemplate)].join(' ').toLowerCase();
      return inFilter && (!query || matchesSearch(searchable, query));
    });
    grid.replaceChildren();
    matches.forEach(item => {
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'collection-card';
      const available = templateFor(item.id).length;
      card.setAttribute('aria-label', `View ${item.title} collection, ${available} ${available === 1 ? 'design' : 'designs'} available`);
      card.innerHTML = `<div class="card-art"><span class="art-corner">D225 / ${item.mark}</span><div class="card-poster"><small>DISTRICT 225 · PR</small><strong></strong><i></i></div></div><div class="card-content"><div class="card-topline"><span></span><span>${item.id === 'certificates' ? 'CERTIFICATES' : `${item.mark} / 13`}</span></div><h3></h3><div class="card-status"><span>${available ? `${available} ${available === 1 ? 'design' : 'designs'} available` : 'Designs coming soon'}</span><b aria-hidden="true">↗</b></div></div>`;
      card.querySelector('.card-poster strong').textContent = item.title;
      card.querySelector('.card-topline span').textContent = item.tag;
      card.querySelector('h3').textContent = item.title;
      card.addEventListener('click', () => openCollection(item.id));
      grid.append(card);
    });
    count.textContent = `${matches.length} ${matches.length === 1 ? 'collection' : 'collections'}`;
    empty.hidden = matches.length !== 0;
    const suggestion = [
      [/\b(cc|cj|contest chair|chief judge|contestants?|contest officials?)\b/, 'club-contest'],
      [/\b(tmod|ge|ttm|toastmaster of the day|general evaluator|table topics master)\b/, 'meeting-leaders'],
      [/\b(level\s*(?:[1-5]|completion)|level milestone)\b/, 'level-completion'],
      [/\bpathways?\s+completion\b/, 'pathways-completion'],
      [/\btriple\s+crown\b/, 'triple-crown'],
      [/\b(dtm|distinguished toastmaster)\b/, 'dtm']
    ].find(([pattern]) => pattern.test(query));
    const related = suggestion && relatedCollections[suggestion[1]];
    searchTip.hidden = !related || dismissedTipQuery === query;
    if (!searchTip.hidden) {
      searchTipText.textContent = related.text;
      searchTipAction.textContent = related.action;
      searchTipAction.dataset.collection = related.target;
    }
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
    render();
  }));
  search.addEventListener('input', render);
  searchTipAction.addEventListener('click', () => openCollection(searchTipAction.dataset.collection));
  const certificatesCount = document.querySelector('#certificates-count');
  const certificateDesignCount = templateFor('certificates').length;
  certificatesCount.textContent = certificateDesignCount
    ? `${certificateDesignCount} ${certificateDesignCount === 1 ? 'design' : 'designs'} available`
    : 'Designs coming soon';
  document.querySelector('#certificates-explore').addEventListener('click', () => openCollection('certificates'));
  collectionTipAction.addEventListener('click', () => {
    showCollection(collectionTipAction.dataset.collection);
    document.querySelector('#dialog-close').focus();
  });
  document.querySelector('#search-tip-close').addEventListener('click', () => { dismissedTipQuery = normalize(search.value); searchTip.hidden = true; });
  document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => { search.value = button.dataset.query; render(); search.focus(); }));
  document.querySelector('#clear-search').addEventListener('click', () => { search.value = ''; document.querySelector('[data-filter="All"]').click(); search.focus(); });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !dialog.open && !document.querySelector('#zoom-dialog')?.open && !/input|textarea/i.test(document.activeElement.tagName)) { event.preventDefault(); search.focus(); }
  });
  document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
  document.querySelector('#design-caption-button').addEventListener('click', event => {
    const promptId = event.currentTarget.dataset.promptId;
    if (!promptId) return;
    returnFocus = null;
    dialog.close();
    location.hash = `prompt-${encodeURIComponent(promptId)}`;
  });
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

(() => {
  const zoom = window.D225_CATALOG.zoom;
  const dialog = document.querySelector('#zoom-dialog');
  const grid = document.querySelector('#zoom-role-grid');
  const explore = document.querySelector('#zoom-explore');
  const close = document.querySelector('#zoom-dialog-close');
  const customLink = document.querySelector('#zoom-custom-link');
  const customPending = document.querySelector('#zoom-custom-pending');
  let returnFocus = null;

  function allowedUrl(value, hosts) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && hosts.includes(url.hostname);
    } catch { return false; }
  }

  zoom.roles.forEach(role => {
    const active = allowedUrl(role.url, ['drive.google.com', 'docs.google.com']);
    const card = document.createElement(active ? 'a' : 'button');
    card.className = 'zoom-role-card';
    if (active) {
      card.href = role.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    } else {
      card.type = 'button';
      card.disabled = true;
    }
    const title = document.createElement('strong');
    title.textContent = role.label;
    const status = document.createElement('span');
    status.textContent = active ? 'Open Drive collection ↗' : 'Drive link coming soon';
    card.append(title, status);
    grid.append(card);
  });

  if (allowedUrl(zoom.customCanvaUrl, ['canva.link', 'canva.com', 'www.canva.com'])) {
    customLink.href = zoom.customCanvaUrl;
    customLink.hidden = false;
    customPending.hidden = true;
  }

  explore.addEventListener('click', () => {
    returnFocus = document.activeElement;
    dialog.showModal();
    close.focus();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    if (returnFocus?.isConnected) returnFocus.focus();
    returnFocus = null;
  });
})();

/* Single district presentation template */
(() => {
  const link = document.querySelector('#presentation-link');
  const pending = document.querySelector('#presentation-pending');
  const value = window.D225_CATALOG.presentation?.canvaUrl;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['canva.link', 'canva.com', 'www.canva.com'].includes(url.hostname)) return;
    link.href = url.href;
    link.hidden = false;
    pending.hidden = true;
  } catch { /* Keep the honest coming-soon state until a valid link is added. */ }
})();

/* Caption prompt library and PR contact */
(() => {
  const { captionPrompts, captionPromptRules, prContactEmails } = window.D225_CATALOG;
  const grid = document.querySelector('#prompt-grid');
  const search = document.querySelector('#prompt-search');
  const count = document.querySelector('#prompt-count');
  const empty = document.querySelector('#prompt-empty');
  const toast = document.querySelector('#copy-toast');
  let toastTimer;

  const fullPrompt = item => `${item.prompt}\n\n${captionPromptRules}`;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  async function copyPrompt(value) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {}
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch {}
    field.remove();
    return copied;
  }

  function makeCard(item, index) {
    const card = document.createElement('article');
    card.className = 'prompt-card';
    card.id = `prompt-${item.id}`;
    const top = document.createElement('div');
    top.className = 'prompt-card-top';
    const category = document.createElement('span');
    category.textContent = item.category;
    const number = document.createElement('small');
    number.textContent = String(index + 1).padStart(2, '0');
    top.append(category, number);
    const heading = document.createElement('h3');
    heading.textContent = item.title;
    const description = document.createElement('p');
    description.className = 'prompt-card-description';
    description.textContent = item.summary;
    const details = document.createElement('details');
    details.className = 'prompt-details';
    const summary = document.createElement('summary');
    summary.textContent = 'Read more';
    const switcher = document.createElement('div');
    switcher.className = 'prompt-switch';
    switcher.setAttribute('role', 'tablist');
    switcher.setAttribute('aria-label', `${item.title} caption resources`);
    const panels = ['prompt', 'sample'].map((type, tabIndex) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'prompt-switch-tab';
      tab.id = `tab-${type}-${item.id}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', `panel-${type}-${item.id}`);
      tab.textContent = type === 'prompt' ? 'AI prompt' : 'Sample caption';
      const panel = document.createElement('div');
      panel.className = 'prompt-slide';
      panel.id = `panel-${type}-${item.id}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      const label = document.createElement('span');
      label.className = 'prompt-slide-label';
      label.textContent = type === 'prompt' ? 'COPY · FILL IN · GENERATE' : 'EXAMPLE · PERSONALISE BEFORE POSTING';
      const body = document.createElement('p');
      body.textContent = type === 'prompt' ? fullPrompt(item) : item.sampleCaption;
      panel.append(label, body);
      switcher.append(tab);
      tab.addEventListener('click', () => selectSlide(tabIndex));
      tab.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 :
          (tabIndex + (event.key === 'ArrowRight' ? 1 : -1) + 2) % 2;
        selectSlide(next);
        switcher.children[next].focus();
      });
      return panel;
    });
    function selectSlide(index) {
      [...switcher.children].forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
    }
    selectSlide(0);
    details.append(summary, switcher, ...panels);
    const actions = document.createElement('div');
    actions.className = 'prompt-actions';
    const promptButton = document.createElement('button');
    promptButton.type = 'button';
    promptButton.className = 'prompt-copy';
    promptButton.textContent = 'Copy prompt ↗';
    promptButton.setAttribute('aria-label', `Copy ${item.title} prompt`);
    promptButton.addEventListener('click', async () => {
      if (await copyPrompt(fullPrompt(item))) showToast(`${item.title} prompt copied`);
      else { details.open = true; selectSlide(0); showToast('Copy unavailable; select the prompt text above.'); }
    });
    const captionButton = document.createElement('button');
    captionButton.type = 'button';
    captionButton.className = 'prompt-copy prompt-copy-caption';
    captionButton.textContent = 'Copy caption ↗';
    captionButton.setAttribute('aria-label', `Copy ${item.title} sample caption`);
    captionButton.addEventListener('click', async () => {
      if (await copyPrompt(item.sampleCaption)) showToast(`${item.title} sample caption copied — personalise before posting`);
      else { details.open = true; selectSlide(1); showToast('Copy unavailable; select the sample caption text above.'); }
    });
    actions.append(promptButton, captionButton);
    card.append(top, heading, description, details, actions);
    return card;
  }

  function render() {
    const query = search.value.toLowerCase().trim();
    const matches = captionPrompts.filter(item =>
      [item.title, item.category, item.summary, ...(item.tags || [])].join(' ').toLowerCase().includes(query)
    );
    grid.replaceChildren(...matches.map(makeCard));
    count.textContent = `${matches.length} ${matches.length === 1 ? 'prompt' : 'prompts'}`;
    empty.hidden = matches.length > 0;
  }

  search.addEventListener('input', render);
  render();

  function openPromptFromHash() {
    if (!location.hash.startsWith('#prompt-')) return;
    const id = decodeURIComponent(location.hash.slice('#prompt-'.length));
    const item = captionPrompts.find(prompt => prompt.id === id);
    if (!item) return;
    search.value = item.title;
    render();
    const card = document.getElementById(`prompt-${item.id}`);
    card.querySelector('details').open = true;
    card.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    card.querySelector('summary').focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', openPromptFromHash);
  openPromptFromHash();

  const contactButton = document.querySelector('#pr-contact-button');
  const contactNote = document.querySelector('#pr-contact-note');
  const recipients = Array.isArray(prContactEmails) ? prContactEmails : [];
  const validEmail = value => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value);
  if (recipients.length && recipients.every(validEmail)) {
    const subject = encodeURIComponent('District 225 PR team request');
    const body = encodeURIComponent('Club / Area:\nType of PR support:\nEvent or deadline:\nDetails or links:\nYour name and contact:\n');
    contactButton.disabled = false;
    contactNote.textContent = 'Opens your email app addressed to the PR team.';
    contactButton.addEventListener('click', () => {
      window.location.href = `mailto:${recipients.join(',')}?subject=${subject}&body=${body}`;
    });
  }
})();

/* Hero resource carousel and gentle reveal motion */
(() => {
  const carousel = document.querySelector('.hero-carousel');
  const slides = [...carousel.querySelectorAll('.hero-slide')];
  const dots = [...carousel.querySelectorAll('[data-hero-slide]')];
  const count = document.querySelector('#hero-slide-count');
  const autoplay = document.querySelector('#hero-autoplay');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let timer = null;
  let paused = motionPreference.matches;

  function showSlide(next) {
    active = (next + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      const selected = index === active;
      slide.classList.toggle('is-active', selected);
      slide.setAttribute('aria-hidden', String(!selected));
      slide.toggleAttribute('inert', !selected);
    });
    dots.forEach((dot, index) => dot.setAttribute('aria-pressed', String(index === active)));
    count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  }

  function stopRotation() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function startRotation() {
    stopRotation();
    if (paused || motionPreference.matches || document.hidden) return;
    timer = setTimeout(() => { showSlide(active + 1); startRotation(); }, 5500);
  }

  function updateAutoplay() {
    autoplay.textContent = paused ? '▶' : 'Ⅱ';
    autoplay.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    autoplay.setAttribute('aria-pressed', String(paused));
    autoplay.disabled = motionPreference.matches;
  }

  function chooseSlide(next) {
    showSlide(next);
    startRotation();
  }

  document.querySelector('#hero-prev').addEventListener('click', () => chooseSlide(active - 1));
  document.querySelector('#hero-next').addEventListener('click', () => chooseSlide(active + 1));
  dots.forEach((dot, index) => dot.addEventListener('click', () => chooseSlide(index)));
  autoplay.addEventListener('click', () => { paused = !paused; updateAutoplay(); startRotation(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopRotation(); else startRotation(); });
  motionPreference.addEventListener?.('change', () => { paused = motionPreference.matches; updateAutoplay(); startRotation(); });
  showSlide(0);
  updateAutoplay();
  startRotation();

  if (!motionPreference.matches && 'IntersectionObserver' in window) {
    const selector = '.section-heading, .compact-heading, .collection-grid, .zoom-panel, .zoom-create, .prompt-how, .prompt-grid, .principle-grid article, .wordmark-specs article, .type-card, .palette-grid, .pr-contact-inner';
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -35px 0px' });
    document.querySelectorAll(selector).forEach(element => {
      if (element.getBoundingClientRect().top > window.innerHeight * 0.9) {
        element.classList.add('motion-reveal');
        observer.observe(element);
      }
    });
  }
})();


