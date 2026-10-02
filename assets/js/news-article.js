(() => {
  const publications = window.ORECUBE_NEWS_PUBLICATIONS || [];
  const preview = new URLSearchParams(window.location.search).get('preview') === '1';
  const publication = publications.find((item) => item.slug === window.location.pathname
    && (['published', 'updated'].includes(item.status) || (preview && item.status !== 'archived')));
  if (!publication) return;

  document.title = publication.seoTitle || `${publication.title} | Orecube News & Perspectives`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', publication.seoDescription || publication.summary);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', publication.seoDescription || publication.summary);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', new URL(publication.slug, window.location.origin).href);

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: publication.title,
    description: publication.seoDescription || publication.summary,
    author: { '@type': 'Organization', name: publication.author },
    publisher: { '@type': 'Organization', name: publication.publisher },
    mainEntityOfPage: new URL(publication.slug, window.location.origin).href
  };
  if (publication.publicationDate) article.datePublished = publication.publicationDate;
  if (publication.lastUpdatedDate) article.dateModified = publication.lastUpdatedDate;
  if (publication.category) article.articleSection = publication.category;
  if (publication.tags?.length) article.keywords = publication.tags.join(', ');
  const structuredData = document.getElementById('newsArticleStructuredData');
  if (structuredData) structuredData.textContent = JSON.stringify(article);

  const metadata = document.getElementById('newsArticleMeta');
  if (metadata) {
    metadata.replaceChildren();
    const display = [publication.type];
    if (publication.publicationDate) display.push(new Date(`${publication.publicationDate}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
    else display.push('Undated perspective');
    if (publication.lastUpdatedDate) display.push(`Updated ${new Date(`${publication.lastUpdatedDate}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`);
    display.push(publication.category, publication.product || publication.initiative, publication.author, publication.readingTime);
    display.filter(Boolean).forEach((value) => {
      const item = document.createElement('span');
      item.textContent = value;
      metadata.append(item);
    });
  }

  const media = publication.media || {};
  const cover = publication.coverImage;
  const heroMedia = media.heroImage || media.shortVideo || media.visual3d || media.animatedDiagram
    || media.productScreenshot || media.researchChart || (cover && typeof cover === 'object' ? cover : null);
  const heroMount = document.getElementById('newsHeroMedia');
  const normalizedHero = typeof heroMedia === 'string' ? { mediaType: 'image', src: heroMedia, alt: publication.coverAlt || '' } : heroMedia;
  if (heroMount && normalizedHero && window.ORECUBE_CREATE_NEWS_MEDIA) {
    const figure = window.ORECUBE_CREATE_NEWS_MEDIA(normalizedHero, 'news-article-media', 'eager');
    if (figure) heroMount.replaceChildren(figure);
  }
  const galleryMount = document.getElementById('newsArticleGallery');
  const gallery = media.imageGallery || publication.imageGallery || [];
  if (galleryMount && gallery.length && window.ORECUBE_CREATE_NEWS_MEDIA) {
    gallery.forEach((item) => {
      const figure = window.ORECUBE_CREATE_NEWS_MEDIA(item, 'news-article-gallery-item');
      if (figure) galleryMount.append(figure);
    });
    galleryMount.classList.add('news-article-gallery');
  }

  const relatedList = document.getElementById('newsRelatedStories');
  if (relatedList) {
    relatedList.replaceChildren();
    const related = (publication.relatedArticles || [])
      .map((slug) => publications.find((item) => item.slug === slug))
      .filter(Boolean);
    related.forEach((item) => {
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = item.slug;
      link.textContent = item.title;
      listItem.append(link);
      relatedList.append(listItem);
    });
    if (!related.length) relatedList.closest('.news-related')?.remove();
  }

  document.getElementById('copyNewsLink')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(window.location.href);
      button.textContent = 'Link copied';
      window.setTimeout(() => { button.textContent = 'Copy link'; }, 1800);
    } catch {
      button.textContent = 'Copy unavailable';
      window.setTimeout(() => { button.textContent = 'Copy link'; }, 1800);
    }
  });
})();
