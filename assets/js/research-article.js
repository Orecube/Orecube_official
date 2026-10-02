(() => {
  const publications = window.ORECUBE_RESEARCH_PUBLICATIONS || [];
  const publication = publications.find((item) => item.slug.replace(/\/$/, '') === window.location.pathname.replace(/\/$/, ''));
  const article = document.getElementById('articleContent');
  const contents = document.getElementById('tableOfContents');
  const references = document.getElementById('referencesList');
  const relatedList = document.getElementById('relatedResearchList');
  const relatedEmpty = document.getElementById('relatedResearchEmpty');
  if (!publication || !article || !contents || !references || !relatedList || !relatedEmpty) return;

  function renderBlocks(container, blocks) {
    blocks.forEach((block) => {
      if (block.type === 'list') {
        const list = document.createElement('ul');
        block.items.forEach((text) => {
          const item = document.createElement('li');
          item.textContent = text;
          list.append(item);
        });
        container.append(list);
        return;
      }

      if (block.type === 'quote') {
        const quote = document.createElement('blockquote');
        quote.textContent = block.text;
        container.append(quote);
        return;
      }

      if (block.type === 'subsection') {
        const subsection = document.createElement('section');
        const heading = document.createElement('h3');
        heading.textContent = block.heading;
        subsection.append(heading);
        block.paragraphs.forEach((text) => {
          const paragraph = document.createElement('p');
          paragraph.textContent = text;
          subsection.append(paragraph);
        });
        container.append(subsection);
        return;
      }

      const paragraph = document.createElement('p');
      paragraph.textContent = block.text;
      container.append(paragraph);
    });
  }

  const date = new Date(`${publication.publicationDate}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('articleDate').textContent = date;
  document.getElementById('articleType').textContent = publication.researchTypeLabel || publication.researchType;
  document.getElementById('articleAuthor').textContent = publication.author;
  document.getElementById('articleReadingTime').textContent = publication.readingTime;
  document.getElementById('articleTitle').textContent = publication.title;
  document.getElementById('articleStandfirst').textContent = publication.standfirst || publication.summary;
  document.title = publication.seoTitle || `${publication.title} | Orecube Research`;

  const publisher = document.getElementById('articlePublisher');
  if (publisher) publisher.textContent = publication.publisher;
  const affiliation = document.getElementById('articleAffiliation');
  if (affiliation) affiliation.textContent = publication.product || publication.initiative || '';
  const affiliationLabel = document.getElementById('articleAffiliationLabel');
  if (affiliationLabel) affiliationLabel.textContent = publication.product ? 'Product:' : 'Product or initiative:';
  const editorialLabel = document.getElementById('articleEditorialLabel');
  if (editorialLabel) editorialLabel.textContent = publication.editorialLabel || 'Orecube Research Synthesis';

  const description = publication.seoDescription || publication.summary;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="article:published_time"]')?.setAttribute('content', publication.publicationDate);
  document.querySelector('meta[property="article:modified_time"]')?.setAttribute('content', publication.lastUpdatedDate || publication.publicationDate);
  document.querySelector('meta[property="article:author"]')?.setAttribute('content', publication.author);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', publication.canonicalUrl || publication.slug);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: publication.title,
    description: publication.summary,
    datePublished: publication.publicationDate,
    dateModified: publication.lastUpdatedDate || publication.publicationDate,
    author: { '@type': 'Organization', name: publication.author },
    publisher: { '@type': 'Organization', name: publication.publisher },
    articleSection: publication.category,
    keywords: publication.tags.join(', '),
    mainEntityOfPage: window.location.href
  };
  const schemaScript = document.getElementById('articleStructuredData') || document.createElement('script');
  schemaScript.id = 'articleStructuredData';
  schemaScript.type = 'application/ld+json';
  schemaScript.textContent = JSON.stringify(schema);
  if (!schemaScript.isConnected) document.head.append(schemaScript);

  const articleLabel = document.getElementById('breadcrumbTitle');
  if (articleLabel) articleLabel.textContent = publication.title;
  if (publication.introduction) {
    const introduction = document.createElement('div');
    introduction.className = 'article-introduction';
    renderBlocks(introduction, publication.introduction);
    article.append(introduction);
  }

  publication.content.forEach((section) => {
    const sectionElement = document.createElement('section');
    sectionElement.className = 'article-section';
    sectionElement.id = section.id;
    const heading = document.createElement('h2');
    heading.textContent = section.heading;
    sectionElement.append(heading);
    const blocks = section.blocks || section.paragraphs.map((text) => ({ type: 'paragraph', text }));
    renderBlocks(sectionElement, blocks);
    article.append(sectionElement);

    const link = document.createElement('a');
    link.href = `#${section.id}`;
    link.textContent = section.heading;
    contents.append(link);
  });

  if (publication.references.length) {
    publication.references.forEach((reference) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = reference.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = reference.title;
      item.append(link);
      references.append(item);
    });
  } else {
    const note = document.createElement('li');
    note.textContent = 'The approved fallback brief supplied product requirements but did not include source citations. This publication is presented as an Orecube product thesis, not as peer-reviewed or independently validated research.';
    references.append(note);
  }

  const related = (publication.relatedResearch || []).map((reference) =>
    publications.find((item) => item.slug === reference || item.title === reference)
  ).filter(Boolean);
  related.forEach((item) => {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'text-link';
    link.href = item.slug;
    link.textContent = item.title;
    listItem.append(link);
    relatedList.append(listItem);
  });
  relatedEmpty.hidden = related.length > 0;

  document.getElementById('copyLink').addEventListener('click', async (event) => {
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