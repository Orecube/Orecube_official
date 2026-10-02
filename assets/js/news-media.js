window.ORECUBE_CREATE_NEWS_MEDIA = (media, className = '', loading = 'lazy') => {
  if (media?.type && !media.mediaType) media = { ...media, mediaType: media.type };
  if (!media?.mediaType || !window.ORECUBE_NEWS_SCHEMA?.mediaTypes.includes(media.mediaType)) return null;
  const figure = document.createElement('figure');
  figure.className = `news-media-figure ${className}`.trim();
  if (media.fit === 'contain') figure.classList.add('news-media-contain');

  if (['image', 'diagram', 'screenshot'].includes(media.mediaType)) {
    const image = document.createElement('img');
    image.src = media.dark || media.src;
    const srcset = media.darkSrcset || media.srcset;
    if (srcset) image.srcset = srcset;
    if (media.sizes) image.sizes = media.sizes;
    image.alt = media.alt || '';
    image.loading = loading;
    image.decoding = 'async';
    if (media.width) image.width = media.width;
    if (media.height) image.height = media.height;
    if (media.focalPoint) image.style.objectPosition = media.focalPoint;
    const fallback = document.createElement('span');
    fallback.className = 'news-media-fallback';
    fallback.textContent = 'Image unavailable';
    fallback.hidden = true;
    image.addEventListener('error', () => { image.hidden = true; fallback.hidden = false; });
    figure.append(image, fallback);
  } else if (media.mediaType === 'video') {
    const wrapper = document.createElement('div');
    wrapper.className = 'news-media-video';
    let fallback;
    let posterFailureFallback = null;
    if (media.poster) {
      fallback = document.createElement('img');
      fallback.className = 'news-video-fallback';
      fallback.src = media.poster;
      fallback.alt = media.alt || '';
      fallback.loading = loading;
      fallback.decoding = 'async';
      posterFailureFallback = document.createElement('div');
      posterFailureFallback.className = 'news-media-fallback news-video-fallback';
      posterFailureFallback.textContent = 'Video preview unavailable';
      posterFailureFallback.hidden = true;
      fallback.addEventListener('error', () => { fallback.hidden = true; posterFailureFallback.hidden = false; });
    } else {
      fallback = document.createElement('div');
      fallback.className = 'news-media-fallback news-video-fallback';
      fallback.textContent = 'Video preview unavailable';
    }
    const video = document.createElement('video');
    video.playsInline = true;
    video.controls = media.controls !== false;
    video.muted = Boolean(media.autoplay || media.muted);
    video.loop = Boolean(media.loop);
    video.preload = 'metadata';
    if (media.poster) video.poster = media.poster;
    const source = document.createElement('source');
    source.src = media.src;
    video.append(source);
    if (media.captions) {
      const track = document.createElement('track');
      track.kind = 'captions';
      track.src = typeof media.captions === 'string' ? media.captions : media.captions.src;
      track.srclang = typeof media.captions === 'string' ? 'en' : media.captions.language || 'en';
      track.label = typeof media.captions === 'string' ? 'Captions' : media.captions.label || 'Captions';
      track.default = true;
      video.append(track);
    }
    video.addEventListener('loadeddata', () => { fallback.hidden = true; if (posterFailureFallback) posterFailureFallback.hidden = true; });
    video.addEventListener('error', () => { video.hidden = true; if (!posterFailureFallback || posterFailureFallback.hidden) fallback.hidden = false; });
    wrapper.append(fallback);
    if (posterFailureFallback) wrapper.append(posterFailureFallback);
    wrapper.append(video);
    figure.append(wrapper);
    if (media.autoplay && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.autoplay = true;
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) video.play().catch(() => {});
            else video.pause();
          });
        });
        observer.observe(video);
      } else {
        video.addEventListener('canplay', () => video.play().catch(() => {}), { once: true });
      }
    }
  } else if (media.mediaType === '3d') {
    const details = document.createElement('details');
    details.className = 'news-media-3d';
    const summary = document.createElement('summary');
    summary.textContent = 'Load interactive 3D visual';
    details.append(summary);
    if (media.poster) {
      const poster = document.createElement('img');
      poster.src = media.poster;
      poster.alt = media.alt || '';
      poster.loading = loading;
      poster.decoding = 'async';
      const fallback = document.createElement('div');
      fallback.className = 'news-media-fallback';
      fallback.textContent = 'Interactive visual unavailable';
      fallback.hidden = true;
      poster.addEventListener('error', () => { poster.hidden = true; fallback.hidden = false; });
      details.append(poster);
      details.append(fallback);
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'news-media-fallback';
      fallback.textContent = 'Interactive visual unavailable';
      details.append(fallback);
    }
    details.addEventListener('toggle', () => {
      const existingFrame = details.querySelector('iframe');
      if (!details.open && existingFrame) {
        existingFrame.src = 'about:blank';
        existingFrame.remove();
      } else if (details.open && !existingFrame) {
        const frame = document.createElement('iframe');
        frame.src = media.src;
        frame.title = media.alt || 'Interactive 3D visual';
        frame.loading = 'lazy';
        frame.allowFullscreen = true;
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        details.append(frame);
      }
    });
    figure.append(details);
  }

  if (media.caption || media.credit || media.source) {
    const caption = document.createElement('figcaption');
    if (media.caption) {
      const text = document.createElement('span');
      text.textContent = media.caption;
      caption.append(text);
    }
    if (media.credit || media.source) {
      const credit = document.createElement('span');
      credit.textContent = media.credit || media.source;
      caption.append(credit);
    }
    figure.append(caption);
  }
  return figure;
};
