document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('mobileSearchOverlay');
  const searchInput = document.getElementById('mobileSearchInput');
  let activeSearchButton;

  if (!overlay) return;

  function closeSearch() {
    overlay.classList.add('hidden');
    activeSearchButton?.setAttribute('aria-expanded', 'false');
    activeSearchButton?.focus();
  }

  document.addEventListener('click', (event) => {
    const searchButton = event.target.closest('[data-search-open]');
    if (searchButton) {
      activeSearchButton = searchButton;
      activeSearchButton.setAttribute('aria-expanded', 'true');
      overlay.classList.remove('hidden');
      searchInput?.focus();
      return;
    }

    if (event.target.closest('[data-search-close]')) closeSearch();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !overlay.classList.contains('hidden')) closeSearch();
  });
});