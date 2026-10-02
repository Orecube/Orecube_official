window.ORECUBE_NEWS_SCHEMA = {
  statuses: ['draft', 'preview', 'scheduled', 'published', 'updated', 'archived'],
  articleTypes: ['News', 'Product announcement', 'Research update', 'Company update', 'Engineering', 'Safety and responsibility', 'Perspective', 'Blog'],
  categories: ['Company', 'Products', 'Research', 'Technology', 'Safety and Trust', 'Learning and Education', 'Global Access', 'Perspectives'],
  mediaTypes: ['image', 'video', '3d', 'diagram', 'screenshot'],
  mediaFields: ['heroImage', 'coverImage', 'imageGallery', 'shortVideo', 'visual3d', 'animatedDiagram', 'productScreenshot', 'researchChart', 'videoPoster', 'captions', 'alt', 'credit', 'source', 'focalPoint', 'light', 'dark', 'srcset', 'sizes', 'autoplay', 'muted', 'loop', 'controls']
};

window.ORECUBE_NEWS_PUBLICATIONS = [
  {
    title: 'The most useful AI starts with people.',
    slug: '/news/people-first-ai.html',
    type: 'Perspective',
    summary: 'Usefulness depends on whether an AI tool fits the moment, makes sense to the person using it, and helps them reach a meaningful goal.',
    standfirst: 'The most useful AI starts with people.',
    publicationDate: null,
    lastUpdatedDate: null,
    author: 'Orecube',
    publisher: 'Orecube',
    product: null,
    initiative: null,
    category: 'Perspectives',
    tags: ['people and technology', 'useful AI', 'human-centered design'],
    readingTime: null,
    featured: true,
    coverImage: null,
    media: {
      heroImage: {
        mediaType: 'diagram',
        src: '/assets/media/news/human-centered-ai.svg',
        poster: null,
        alt: 'Editorial diagram showing a person setting direction, AI providing support, and a person retaining judgment.',
        caption: 'AI can support a person’s goals while the person retains judgment.',
        credit: 'Orecube, original editorial diagram',
        source: 'Created for this Orecube perspective',
        focalPoint: '50% 50%',
        fit: 'contain',
        autoplay: false,
        muted: false,
        loop: false,
        captions: null,
        light: null,
        dark: '/assets/media/news/human-centered-ai.svg',
        width: 1600,
        height: 900
      },
      imageGallery: [],
      shortVideo: null,
      visual3d: null,
      animatedDiagram: null,
      productScreenshot: null,
      researchChart: null
    },
    references: [],
    relatedArticles: ['/news/learning-with-ai.html', '/news/responsible-progress.html'],
    status: 'published',
    content: [
      'It is tempting to measure progress only by what a model can do. But usefulness also depends on whether a tool fits the moment, makes sense to the person using it, and helps them reach a goal that matters to them.',
      'That shifts the design question from “What can the system generate?” to “How can this help someone think, create, learn, or solve a problem?” Keeping people in the picture makes AI more approachable and its purpose clearer.'
    ]
  },
  {
    title: 'AI can make room for more curiosity.',
    slug: '/news/learning-with-ai.html',
    type: 'Perspective',
    summary: 'A helpful learning companion can help a learner ask a clearer question, explore a new angle, or break a complicated idea into manageable parts.',
    standfirst: 'AI can make room for more curiosity without replacing the effort and discovery that make learning meaningful.',
    publicationDate: null,
    lastUpdatedDate: null,
    author: 'Orecube',
    publisher: 'Orecube',
    product: null,
    initiative: null,
    category: 'Learning and Education',
    tags: ['learning', 'curiosity', 'AI in education'],
    readingTime: null,
    featured: false,
    coverImage: null,
    references: [],
    relatedArticles: ['/news/people-first-ai.html', '/news/responsible-progress.html'],
    status: 'published',
    content: [
      'A helpful learning companion should do more than deliver information. It can help a learner ask a clearer question, explore a new angle, or break a complicated idea into manageable parts.',
      'The goal is not to replace the effort and discovery that make learning meaningful. It is to make it easier to begin, keep going, and find a path through unfamiliar material.'
    ]
  },
  {
    title: 'Responsibility is part of progress.',
    slug: '/news/responsible-progress.html',
    type: 'Perspective',
    summary: 'Considering safety, context, and human impact helps connect AI development choices to their real-world consequences.',
    standfirst: 'Responsibility is part of progress as AI capabilities and the ways people use them continue to evolve.',
    publicationDate: null,
    lastUpdatedDate: null,
    author: 'Orecube',
    publisher: 'Orecube',
    product: null,
    initiative: null,
    category: 'Safety and Trust',
    tags: ['responsible development', 'safety', 'human impact'],
    readingTime: null,
    featured: false,
    coverImage: null,
    references: [],
    relatedArticles: ['/news/people-first-ai.html', '/news/learning-with-ai.html'],
    status: 'published',
    content: [
      'As AI becomes more capable, the way it is developed and applied matters just as much as the capability itself. Considering safety, context, and human impact helps connect technical choices to their real-world consequences.',
      'Responsible development is ongoing work. It benefits from careful research, honest communication about what systems can do, and attention to the people affected by them.'
    ]
  }
];
