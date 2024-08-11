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
        toast.classList.add('fade-in');
    }, 1);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toastContainer.removeChild(toast), 500);
    }, 3000);
}

/**
 * Roni
 */
export function showModal(title, content) {
    const modal = document.getElementById('modal');
    const closeModal = document.getElementById('close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalInput = document.getElementById('modal-input');
    const modalAccept = document.getElementById('modal-accept');
    const modalReject = document.getElementById('modal-reject');

    modalTitle.style.display = 'block';
    modalInput.style.display = 'none';
    modalAccept.style.display = 'none';
    modalReject.style.display = 'none';

    modalTitle.textContent = title;
    modalContent.textContent = content;

    modal.style.display = 'block';

    // Close the modal when the user clicks on the close button
    closeModal.onclick = function () {
        modal.style.display = 'none';
    }

    // Close the modal when the user clicks anywhere outside of the modal
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

export function showPromptModal(content) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal');
        const closeModal = document.getElementById('close-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        const modalInput = document.getElementById('modal-input');
        const modalAccept = document.getElementById('modal-accept');
        const modalReject = document.getElementById('modal-reject');

        modalTitle.style.display = 'none';
        modalInput.style.display = 'block';
        modalAccept.style.display = 'inline-block';
        modalReject.style.display = 'inline-block';

        modalContent.textContent = content;

        modal.style.display = 'block';

        modalAccept.onclick = function () {
            modal.style.display = 'none';
            resolve(modalInput.value);
        }

        closeModal.onclick = function () {
            modal.style.display = 'none';
            resolve(null);
        }
        modalReject.onclick = function () {
            modal.style.display = 'none';
            resolve(null);
        }
        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = 'none';
                resolve(null);
            }
        }
    });
}
