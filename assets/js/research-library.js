(() => {
  const publications = (window.ORECUBE_RESEARCH_PUBLICATIONS || []).filter((item) => item.status === 'published');
  const grid = document.getElementById('publicationGrid');
  const search = document.getElementById('researchSearch');
  const category = document.getElementById('categoryFilter');
  const type = document.getElementById('typeFilter');
  const product = document.getElementById('productFilter');
  const sort = document.getElementById('sortFilter');
  const featuredOnly = document.getElementById('featuredFilter');
  const resultCount = document.getElementById('resultCount');
  const emptyState = document.getElementById('emptyState');

  if (!grid || !search || !category || !type || !product || !sort || !featuredOnly) return;

  const params = new URLSearchParams(window.location.search);
  search.value = params.get('q') || '';
  category.value = params.get('category') || '';
  type.value = params.get('type') || '';
  product.value = params.get('product') || '';
  sort.value = params.get('sort') || 'newest';
  featuredOnly.checked = params.get('featured') === 'true';

  const dateLabel = (date) => new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  [...new Set(publications.map((item) => item.product || item.initiative).filter(Boolean))].sort().forEach((name) => {
    if ([...product.options].some((option) => option.value === name)) return;
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    product.append(option);
  });
  product.value = params.get('product') || '';

  function makeText(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function publicationCard(item, index) {
    const article = document.createElement('article');
    article.className = 'publication-row';
    const metadata = document.createElement('div');
    metadata.className = 'publication-metadata';
    metadata.append(makeText('span', 'publication-number', String(index + 1).padStart(2, '0')));
    metadata.append(makeText('span', 'publication-date', dateLabel(item.publicationDate)));
    metadata.append(makeText('span', 'publication-category', item.category));
    metadata.append(makeText('span', 'publication-type', item.researchTypeLabel || item.researchType));
    metadata.append(makeText('span', 'publication-byline', `${item.publisher}${item.product || item.initiative ? ` · ${item.product || item.initiative}` : ''} · ${item.readingTime}`));
    article.append(metadata);
    const content = document.createElement('div');
    content.className = 'publication-content';
    const title = document.createElement('h3');
    title.className = 'publication-title';
    const link = document.createElement('a');
    link.href = item.slug;
    link.textContent = item.title;
    title.append(link);
    content.append(title);
    content.append(makeText('p', 'publication-summary', `${item.summary} ${item.cardDetail}`));
    const tags = document.createElement('ul');
    tags.className = 'tag-list';
    tags.setAttribute('aria-label', 'Topics');
    item.tags.slice(0, 4).forEach((tag) => tags.append(makeText('li', 'tag', tag)));
    content.append(tags);
    const action = document.createElement('a');
    action.className = 'text-link';
    action.href = item.slug;
    action.textContent = 'Read research →';
    content.append(action);
    article.append(content);
    return article;
  }

  function updateUrl() {
    const next = new URLSearchParams();
    if (search.value.trim()) next.set('q', search.value.trim());
    if (category.value) next.set('category', category.value);
    if (type.value) next.set('type', type.value);
    if (product.value) next.set('product', product.value);
    if (sort.value !== 'newest') next.set('sort', sort.value);
    if (featuredOnly.checked) next.set('featured', 'true');
    const query = next.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const filtered = publications.filter((item) => {
      const searchable = [item.title, item.summary, item.product, item.initiative, item.category,
        ...item.secondaryCategories, ...item.tags].filter(Boolean).join(' ').toLocaleLowerCase();
      const categories = [item.category, ...item.secondaryCategories];
      return (!query || searchable.includes(query))
        && (!category.value || categories.includes(category.value))
        && (!type.value || item.researchType === type.value || (item.additionalResearchTypes || []).includes(type.value))
        && (!product.value || item.product === product.value || item.initiative === product.value)
        && (!featuredOnly.checked || item.featured);
    }).sort((a, b) => {
      const difference = new Date(a.publicationDate) - new Date(b.publicationDate);
      return sort.value === 'oldest' ? difference : -difference;
    });

    grid.replaceChildren(...filtered.map(publicationCard));
    resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'publication' : 'publications'}`;
    emptyState.hidden = filtered.length > 0;
    grid.hidden = filtered.length === 0;
    updateUrl();
  }

  [search, category, type, product, sort, featuredOnly].forEach((control) => {
    control.addEventListener(control === search ? 'input' : 'change', render);
  });

  render();
})();