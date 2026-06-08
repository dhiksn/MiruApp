// Global Custom Confirm Modal
let currentConfirmCallback = null;

function openConfirmModal(options = {}) {
  const {
    topBarLabel = "KONFIRMASI HAPUS",
    title = "Hapus",
    titleHighlight = "",
    description = "Item ini akan dihapus permanen. Aksi ini tidak bisa dibatalkan.",
    cancelText = "BATAL",
    confirmText = "YA HAPUS",
    onConfirm
  } = options;

  // Remove existing modal first
  const existingModal = document.getElementById('confirmModal');
  if (existingModal) existingModal.remove();

  // Create modal
  const modal = document.createElement('div');
  modal.id = 'confirmModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-top-bar">
        <i class="ti ti-alert-triangle"></i>
        <span class="modal-top-bar-label">${topBarLabel}</span>
      </div>
      <div class="modal-body">
        <div class="modal-body-title">
          ${title}${titleHighlight ? ` <span>${titleHighlight}</span>` : ''}?
        </div>
        <div class="modal-body-description">
          ${description}
        </div>
        <div class="modal-buttons">
          <button class="modal-btn modal-btn-secondary" id="confirmModalCancel">
            <i class="ti ti-x"></i>
            ${cancelText}
          </button>
          <button class="modal-btn modal-btn-primary" id="confirmModalConfirm">
            <i class="ti ti-trash"></i>
            ${confirmText}
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Event listeners
  document.getElementById('confirmModalCancel').addEventListener('click', closeConfirmModal);
  document.getElementById('confirmModalConfirm').addEventListener('click', () => {
    if (onConfirm) {
      onConfirm();
    }
    closeConfirmModal();
  });
  modal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      closeConfirmModal();
    }
  });

  // Show modal
  modal.classList.add('active');
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  if (modal) {
    modal.classList.remove('active');
    // Remove modal after transition
    setTimeout(() => modal.remove(), 150);
  }
  currentConfirmCallback = null;
}
