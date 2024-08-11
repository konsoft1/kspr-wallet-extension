(async function () {
  try {
    // Check if the overlay already exists
    let overlay = document.getElementById('custom-overlay');

    if (!overlay) {
      // Create overlay element
      overlay = document.createElement('div');
      overlay.id = 'custom-overlay';

      // Create iframe element
      const iframe = document.createElement('iframe');
      iframe.id = 'custom-iframe';
      iframe.src = chrome.runtime.getURL('popup.html');
      iframe.allow = "clipboard-read; clipboard-write";
      overlay.appendChild(iframe);

      // Append overlay to the body
      document.body.appendChild(overlay);

      // Add event listener to close the overlay
      window.addEventListener('message', (event) => {
        if (event.data === 'close-overlay') {
          overlay.remove();
        }
      });

      document.addEventListener('click', function (event) {
        overlay.remove();
      });
    } else {
      // If overlay already exists, just show it
      overlay.style.display = 'flex';
    }
  } catch (error) {
    console.error('Error in content script:', error);
  }
})();