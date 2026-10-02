(() => {
  const schema = window.ORECUBE_NEWS_SCHEMA;
  const publications = (window.ORECUBE_NEWS_PUBLICATIONS || []).filter((item) => ['published', 'updated'].includes(item.status));
  const featured = document.getElementById('featuredStory');
  const latest = document.getElementById('latestStories');
  const search = document.getElementById('newsSearch');
  const type = document.getElementById('newsType');
  const category = document.getElementById('newsCategory');
  const product = document.getElementById('newsProduct');
  const sort = document.getElementById('newsSort');
  const count = document.getElementById('newsCount');
  const empty = document.getElementById('newsEmpty');
  if (!schema || !featured || !latest || !search || !type || !category || !product || !sort || !count || !empty) return;

  const params = new URLSearchParams(window.location.search);
  search.value = params.get('q') || '';
  sort.value = params.get('sort') || 'newest';

  function addOptions(select, values) {
    values.forEach((value) => {
      if ([...select.options].some((option) => option.value === value)) return;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
  }

  const availableTypes = [...new Set(publications.map((item) => item.type).filter(Boolean))].sort();
  const availableCategories = [...new Set(publications.map((item) => item.category).filter(Boolean))].sort();
  addOptions(type, availableTypes);
  addOptions(category, availableCategories);
  type.value = params.get('type') || '';
  category.value = params.get('category') || '';
  const initiatives = [...new Set(publications.map((item) => item.product || item.initiative).filter(Boolean))].sort();
  addOptions(product, initiatives);
  product.value = params.get('product') || '';
  product.closest('label').hidden = initiatives.length === 0;
  type.closest('label').hidden = availableTypes.length < 2;
  sort.closest('label').hidden = publications.filter((item) => item.publicationDate).length < 2;

  function textElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function formatDate(value) {
    if (!value) return 'Undated perspective';
    return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function metadata(item) {
    const wrapper = document.createElement('div');
    wrapper.className = 'news-meta';
    [item.type, formatDate(item.publicationDate), item.category, item.product || item.initiative]
      .filter(Boolean)
      .forEach((value) => wrapper.append(textElement('span', '', value)));
    if (item.readingTime) wrapper.append(textElement('span', '', item.readingTime));
    return wrapper;
  }

  function createFeatured(item) {
    const article = document.createElement('article');
    article.className = 'news-featured';
    const layout = document.createElement('div');
    layout.className = 'news-featured-layout';
    const copy = document.createElement('div');
    copy.className = 'news-featured-copy';
    copy.append(metadata(item));
    const heading = document.createElement('h2');
    const titleLink = document.createElement('a');
    titleLink.href = item.slug;
    titleLink.textContent = item.title;
    heading.append(titleLink);
    copy.append(heading);
    copy.append(textElement('p', 'news-summary', item.summary));
    const read = textElement('a', 'news-read-link', 'Read story');
    read.href = item.slug;
    copy.append(read);
    layout.append(copy);
    const media = item.media || {};
    let heroMedia = media.heroImage || media.shortVideo || media.visual3d || media.animatedDiagram
      || media.productScreenshot || media.researchChart || media.coverImage || item.coverImage;
    if (typeof heroMedia === 'string') heroMedia = { mediaType: 'image', src: heroMedia, alt: item.coverAlt || '', credit: item.coverCredit || '' };
    if (heroMedia) {
      const figure = window.ORECUBE_CREATE_NEWS_MEDIA(heroMedia, 'news-featured-media', 'eager');
      if (figure) layout.append(figure);
    }
    article.append(layout);
    return article;
  }

  function createStory(item) {
    const article = document.createElement('article');
    article.className = 'news-story';
    let thumbnail = item.media?.thumbnail;
    if (typeof thumbnail === 'string') thumbnail = { mediaType: 'image', src: thumbnail, alt: item.thumbnailAlt || '', credit: item.thumbnailCredit || '' };
    if (thumbnail) article.classList.add('has-media');
    const side = document.createElement('div');
    side.className = 'news-story-side';
    side.append(metadata(item));
    article.append(side);
    const content = document.createElement('div');
    const heading = document.createElement('h3');
    const titleLink = document.createElement('a');
    titleLink.href = item.slug;
    titleLink.textContent = item.title;
    heading.append(titleLink);
    content.append(heading);
    content.append(textElement('p', 'news-summary', item.summary));
    const read = textElement('a', 'news-read-link', 'Read story');
    read.href = item.slug;
    content.append(read);
    article.append(content);
    if (thumbnail) {
      const figure = window.ORECUBE_CREATE_NEWS_MEDIA(thumbnail, 'news-media-thumb');
      if (figure) article.append(figure);
    }
    return article;
  }

  function updateUrl() {
    const next = new URLSearchParams();
    if (search.value.trim()) next.set('q', search.value.trim());
    if (type.value) next.set('type', type.value);
    if (category.value) next.set('category', category.value);
    if (product.value) next.set('product', product.value);
    if (sort.value !== 'newest') next.set('sort', sort.value);
    const query = next.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const stories = publications.filter((item) => {
      const searchable = [item.title, item.summary, item.category, item.product, item.initiative, ...item.tags]
        .filter(Boolean).join(' ').toLocaleLowerCase();
      return (!query || searchable.includes(query))
        && (!type.value || item.type === type.value)
        && (!category.value || item.category === category.value)
        && (!product.value || item.product === product.value || item.initiative === product.value);
    }).sort((first, second) => {
      if (!first.publicationDate && !second.publicationDate) return first.title.localeCompare(second.title);
      if (!first.publicationDate) return 1;
      if (!second.publicationDate) return -1;
      const difference = new Date(first.publicationDate) - new Date(second.publicationDate);
      return sort.value === 'oldest' ? difference : -difference;
    });

    const featuredItem = stories.find((item) => item.featured) || stories[0];
    featured.replaceChildren(...(featuredItem ? [createFeatured(featuredItem)] : []));
    const remaining = stories.filter((item) => item !== featuredItem);
    latest.replaceChildren(...remaining.map(createStory));
    count.textContent = `${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`;
    empty.hidden = stories.length > 0;
    updateUrl();
  }

  const listData = [...publications].sort((first, second) => {
    if (!first.publicationDate && !second.publicationDate) return 0;
    if (!first.publicationDate) return 1;
    if (!second.publicationDate) return -1;
    return new Date(second.publicationDate) - new Date(first.publicationDate);
  });
  const itemList = document.getElementById('newsStructuredData');
  if (itemList) {
    itemList.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: listData.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: new URL(item.slug, window.location.origin).href,
        name: item.title
      }))
    });
  }

  [search, type, category, product, sort].forEach((control) => {
    control.addEventListener(control === search ? 'input' : 'change', render);
  });
  render();
})();
