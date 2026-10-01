(() => {
  const publication = (window.ORECUBE_RESEARCH_PUBLICATIONS || []).find((item) => item.slug.replace(/\/$/, '') === window.location.pathname.replace(/\/$/, ''));
  const article = document.getElementById('articleContent');
  const contents = document.getElementById('tableOfContents');
  const references = document.getElementById('referencesList');
  const relatedList = document.getElementById('relatedResearchList');
  const relatedEmpty = document.getElementById('relatedResearchEmpty');
  if (!publication || !article || !contents || !references || !relatedList || !relatedEmpty) return;

  const date = new Date(`${publication.publicationDate}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('articleDate').textContent = date;
  document.getElementById('articleType').textContent = publication.researchTypeLabel || publication.researchType;
  document.getElementById('articleAuthor').textContent = publication.author;
  document.getElementById('articleReadingTime').textContent = publication.readingTime;
  document.getElementById('articleTitle').textContent = publication.title;
  document.getElementById('articleStandfirst').textContent = publication.summary;
  document.title = 'Building a Better Way to Learn | Orecube Research';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: publication.title,
    description: publication.summary,
    datePublished: publication.publicationDate,
    author: { '@type': 'Organization', name: publication.author },
    publisher: { '@type': 'Organization', name: publication.publisher },
    articleSection: publication.category,
    keywords: publication.tags.join(', '),
    mainEntityOfPage: window.location.href
  };
  const schemaScript = document.createElement('script');
  schemaScript.type = 'application/ld+json';
  schemaScript.textContent = JSON.stringify(schema);
  document.head.append(schemaScript);

  publication.content.forEach((section) => {
    const sectionElement = document.createElement('section');
    sectionElement.className = 'article-section';
    sectionElement.id = section.id;
    const heading = document.createElement('h2');
    heading.textContent = section.heading;
    sectionElement.append(heading);
    section.paragraphs.forEach((text) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      sectionElement.append(paragraph);
    });
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