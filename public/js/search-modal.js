// Search Modal
function initSearchModal() {
  const searchBtn = document.getElementById('searchBtn');
  const searchModal = document.getElementById('searchModal');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchCloseBtn = document.getElementById('searchCloseBtn');
  const modalSearch = document.getElementById('modalSearch');
  const modalSearchSubmit = document.getElementById('modalSearchSubmit');

  if (searchBtn && searchModal) {
    searchBtn.addEventListener('click', () => {
      searchModal.classList.add('active');
      modalSearch.focus();
    });
  }
  if (searchCloseBtn) {
    searchCloseBtn.addEventListener('click', () => {
      searchModal.classList.remove('active');
    });
  }
  if (searchOverlay) {
    searchOverlay.addEventListener('click', () => {
      searchModal.classList.remove('active');
    });
  }
  if (modalSearchSubmit) {
    modalSearchSubmit.addEventListener('click', () => {
      doModalSearch();
    });
  }
  if (modalSearch) {
    modalSearch.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        doModalSearch();
      }
    });
  }
  function doModalSearch() {
    const query = modalSearch.value.trim();
    if (query) {
      window.location.href = '/search?q=' + encodeURIComponent(query);
    }
  }
  function doNavSearch() {
    // Keep this for compatibility
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSearchModal);
} else {
  initSearchModal();
}
