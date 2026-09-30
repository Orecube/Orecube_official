document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('mobileSearchOverlay');
  const searchInput = document.getElementById('mobileSearchInput');
  const menuDetails = document.querySelector('header details');
  const menuBackdrop = document.getElementById('mobileMenuBackdrop');
  let activeSearchButton;

  function syncMenu() {
    const isOpen = window.matchMedia('(max-width: 767px)').matches && Boolean(menuDetails?.open);
    menuBackdrop?.classList.toggle('hidden', !isOpen);
    menuDetails?.querySelector('summary')?.setAttribute('aria-expanded', String(isOpen));
    document.documentElement.style.overflow = isOpen ? 'hidden' : '';
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  menuDetails?.addEventListener('toggle', syncMenu);
  menuBackdrop?.addEventListener('click', () => {
    if (menuDetails) menuDetails.open = false;
    syncMenu();
    menuDetails?.querySelector('summary')?.focus();
  });
  window.addEventListener('resize', syncMenu);
  syncMenu();

  if (!overlay) return;

  function closeSearch() {
    overlay.classList.add('hidden');
    activeSearchButton?.setAttribute('aria-expanded', 'false');
    activeSearchButton?.focus();
  }

  document.addEventListener('click', (event) => {
    const searchButton = event.target.closest('[data-search-open]');
    if (searchButton) {
      if (menuDetails?.open) menuDetails.open = false;
      activeSearchButton = searchButton;
      activeSearchButton.setAttribute('aria-expanded', 'true');
      overlay.classList.remove('hidden');
      searchInput?.focus();
      return;
    }

    if (event.target.closest('[data-search-close]')) closeSearch();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!overlay.classList.contains('hidden')) closeSearch();
    if (menuDetails?.open) {
      menuDetails.open = false;
      menuDetails.querySelector('summary')?.focus();
    }
  });
});