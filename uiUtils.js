import { setSessionData } from './kaspaUtils.js';

export function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
    setSessionData({ lastActivityTime: Date.now() });
}

export function showToast(message, type) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toastContainer.removeChild(toast), 500);
    }, 3000);
}

export function showModal(title, content) {
    const modal = document.getElementById('modal');
    const closeModal = document.getElementById('close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    modalTitle.textContent = title;
    modalContent.textContent = content;
    modal.style.display = 'block';

    // Close the modal when the user clicks on the close button
    closeModal.onclick = function() {
        modal.style.display = 'none';
    }

    // Close the modal when the user clicks anywhere outside of the modal
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}
