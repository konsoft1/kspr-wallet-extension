let sessionData = {
    accounts: [],
    lastActivityTime: Date.now(),
    isLoggedIn: false,
    network: 'testnet-11',
    kaspaApiUrl: 'ws://57.129.49.28:17210',  // Default to testnet server IP and port
    encryptedSeed: null,
    password: null,
    currentAccountSelected: 1
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SET_SESSION_DATA') {
        // Update session data and reset the last activity time
        sessionData = { ...sessionData, ...message.data, lastActivityTime: Date.now() };

        if (message.data.network && message.data.kaspaApiUrl) {
            sessionData.network = message.data.network;
            sessionData.kaspaApiUrl = message.data.kaspaApiUrl;
            // Notify of network update
            chrome.runtime.sendMessage({ type: 'NETWORK_UPDATED', kaspaApiUrl: sessionData.kaspaApiUrl });
        }

        // Preserve encrypted seed and password if not explicitly provided
        if (!message.data.encryptedSeed) {
            sessionData.encryptedSeed = sessionData.encryptedSeed || null;
        }
        if (!message.data.password) {
            sessionData.password = sessionData.password || null;
        }

        sendResponse({ status: 'success' });
    } else if (message.type === 'GET_SESSION_DATA') {
        // Send the current session data
        sendResponse(sessionData);
    }
});

// Interval to check for inactivity and keep the service worker alive
setInterval(() => {
    const currentTime = Date.now();
    console.log(sessionData);

    if (currentTime - sessionData.lastActivityTime >= 10 * 60 * 1000) {
        // Clear session data after 10 minutes of inactivity
        sessionData = { 
            accounts: [], 
            lastActivityTime: Date.now(), 
            isLoggedIn: false, 
            network: sessionData.network, // Preserve network
            kaspaApiUrl: sessionData.kaspaApiUrl, // Preserve API URL
            encryptedSeed: null, 
            password: null,
            currentAccountSelected: 1 
        };
    } else {
        // Use chrome.alarms to keep the service worker alive
        chrome.alarms.create('keepAlive', { delayInMinutes: 4 });
    }
}, 20000);

// Listener to keep the service worker alive
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'keepAlive') {
        console.log('Keeping the service worker alive.');
    }
});

// Handle the service worker being suspended
chrome.runtime.onSuspend.addListener(() => {
    sessionData = { 
        accounts: [], 
        lastActivityTime: Date.now(), 
        isLoggedIn: false, 
        network: sessionData.network, // Preserve network
        kaspaApiUrl: sessionData.kaspaApiUrl, // Preserve API URL
        encryptedSeed: null, 
        password: null,
        currentAccountSelected: 1 
    };
});

console.log('Background script running, interval set to clear session data every 20 seconds');
