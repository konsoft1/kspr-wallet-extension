import { rpcClient, getSessionData, reloadAccounts, setSessionData } from './kaspaUtils.js';
import { showToast, showModal, showPromptModal } from './uiUtils.js';
import { decryptData } from './cryptoUtils.js';

const API_MAINNET = 'https://api.kasplex.org/v1';
const API_TESTNET = 'https://tn11api.kasplex.org/v1';

async function fetchWithRetries(url, options = {}, retries = 3, backoff = 300) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            if (i < retries - 1) {
                console.log(`Fetch failed, retrying in ${backoff}ms...`, error);
                await new Promise(resolve => setTimeout(resolve, backoff));
                backoff *= 2; // Exponential backoff
            } else {
                console.log("Fetch failed, no more retries left:", error);
                throw error;
            }
        }
    }
}

export async function fetchBalance(address) {
    try {
        if (!rpcClient || !rpcClient.isConnected) {
            console.log("Waiting for RPC client to connect...");
            await new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (rpcClient && rpcClient.isConnected) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            });
        }
        const balanceResponse = await rpcClient.getBalanceByAddress({ address });
        const balance = Number(balanceResponse.balance) * Math.pow(10, -8); // Convert BigInt to Number and format the balance
        return balance;
    } catch (error) {
        console.error("Error fetching balance:", error);
        throw new Error(`Error fetching balance: ${error.message}`);
    }
}

async function fetchTokenDetails(address) {
    try {
        const sessionData = await getSessionData();
        const apiEndpoint = sessionData.network === 'mainnet' ? API_MAINNET : API_TESTNET;
        const url = `${apiEndpoint}/krc20/address/${address}/tokenlist`;

        const result = await fetchWithRetries(url);

        let tokensInfo = "";

        if (result.error) {
            showToast("Failed to fetch KRC20 token balance.", "error");
            tokensInfo = "Can't find KRC20 tokens for now.";
        } else if (result.result && result.result.length > 0) {
            for (const token of result.result) {
                const tokenBalance = (parseInt(token.balance) * Math.pow(10, -Math.abs(parseInt(token.dec)))).toLocaleString('en-US');
                tokensInfo += `${tokenBalance} ${token.tick}<br />`;
            }
        } else {
            tokensInfo = "You don't have any KRC20 token yet.";
        }
        return tokensInfo;
    } catch (error) {
        console.log("Error:", error);
        return "Can't find KRC20 tokens for now.";
    }
}

export async function displayAccountDetails(account) {
    if (account) {
        const accountAddress = document.getElementById('accountAddress');
        const accountDetailsDiv = document.getElementById('accountDetails');

        // Show loading placeholders
        accountAddress.textContent = account.address;
        accountDetailsDiv.innerHTML = `
            <p id="balancePlaceholder"><strong>Balance:</strong> Loading...</p>
            <p id="tokenDetailsPlaceholder"><strong>KRC20 Tokens:</strong></p>
            <p id="tokenDetails">Loading...</p>
        `;

        // Fetch balance and update
        try {
            const balance = await fetchBalance(account.address);
            const balanceElement = document.getElementById('balancePlaceholder');
            if (balanceElement) {
                balanceElement.innerHTML = `<strong>Balance:</strong> ${balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} KAS`;
            }
        } catch (error) {
            const balanceElement = document.getElementById('balancePlaceholder');
            if (balanceElement) {
                balanceElement.innerHTML = `<strong>Balance:</strong> Error fetching balance`;
            }
        }

        // Fetch token details and update
        try {
            const tokenDetails = await fetchTokenDetails(account.address);
            const tokenDetailsElement = document.getElementById('tokenDetailsPlaceholder');
            if (tokenDetailsElement) {
                tokenDetailsElement.innerHTML = `<strong>KRC20 Tokens:</strong>`;
            }

            const tokenInfoElement = document.getElementById('tokenDetails');
            tokenInfoElement.innerHTML = tokenDetails;
            accountDetailsDiv.appendChild(tokenInfoElement);
        } catch (error) {
            const tokenDetailsElement = document.getElementById('tokenDetailsPlaceholder');
            if (tokenDetailsElement) {
                tokenDetailsElement.innerHTML = `<strong>KRC20 Tokens:</strong>`;
            }
            const tokenInfoElement = document.getElementById('tokenDetails');
            tokenInfoElement.innerHTML = `Error fetching tokens`;
            accountDetailsDiv.appendChild(tokenInfoElement);
        }
    }
}

/**
 * Roni
 */
export function populateAccountSelector(accounts) {
    /* const accountSelector = document.getElementById('accountSelector');
    accountSelector.innerHTML = accounts.map((account, index) => `<option value="${index}">${account.name}</option>`).join(''); */
    const accountChooseList = document.getElementById('accountChooseList');
    accountChooseList.innerHTML = accounts.map((account, index) => `<li><a class="dropdown-item" href="">${account.name}</a></li>`).join('');
    const accountChooseItems = document.querySelectorAll('#accountChooseList li a');
    accountChooseItems.forEach((item, index) => {
        item.addEventListener('click', async function (event) {
            switchAccount(index);
        });
    });
}

/**
 * Roni
 */
export async function switchAccount(selectedIndex) {
    /* const sessionData = await getSessionData();
    const accountSelector = document.getElementById('accountSelector');
    const selectedAccount = sessionData.accounts[accountSelector.selectedIndex];
    const currentAccountNumberElement = document.getElementById('current-account-number');
    currentAccountNumberElement.textContent = `Account #${accountSelector.selectedIndex + 1}`;
    displayAccountDetails(selectedAccount);
    await setSessionData({ currentAccountSelected: accountSelector.selectedIndex + 1 }); */

    const sessionData = await getSessionData();
    const selectedAccount = sessionData.accounts[selectedIndex];
    const accountChoosed = document.getElementById('accountChoosed');
    accountChoosed.innerText = selectedAccount
    accountChoosed.data = selectedIndex;
    const currentAccountNumberElement = document.getElementById('current-account-number');
    currentAccountNumberElement.textContent = `Account #${selectedIndex + 1}`;
    displayAccountDetails(selectedAccount);
    await setSessionData({ currentAccountSelected: selectedIndex + 1 });
}

export async function createNewAccount() {
    try {
        const sessionData = await getSessionData();
        let accountLength = sessionData.accounts.length || 0;

        accountLength += 1;

        if (accountLength <= 25) {
            localStorage.setItem('accountLength', accountLength);
            await reloadAccounts();
            const newSessionData = await getSessionData();
            populateAccountSelector(newSessionData.accounts);
            displayAccountDetails(newSessionData.accounts[accountLength - 1]);
            /**
             * Roni
             */
            /* const accountSelector = document.getElementById('accountSelector');
            accountSelector.selectedIndex = accountLength - 1; */
            const accountChoosed = document.getElementById('accountChoosed');
            accountChoosed.innerText = newSessionData.accounts[accountLength - 1].name;
            accountChoosed.data = accountLength - 1;
            await setSessionData({ currentAccountSelected: accountLength });

            showToast(`Account #${accountLength} created with success`, "success");
        } else {
            showToast("25 accounts max per wallet", "error");
        }
    } catch (error) {
        console.error("Error creating new account:", error);
        showToast("Error creating new account.", "error");
    }
}

export async function exportPrivateKey() {
    try {
        /**
         * Roni
         */
        const password = await showPromptModal('Enter your wallet password:');
        if (password === null) {
            return;
        }
        /* const password = prompt("Enter your wallet password:");
        if (!password) {
            showToast("Password is required!", "error");
            return;
        } */

        const encryptedSeed = JSON.parse(localStorage.getItem('encryptedSeed'));
        await decryptData(password, encryptedSeed);
        const sessionData = await getSessionData();
        const currentAccount = sessionData.accounts[sessionData.currentAccountSelected - 1];
        showModal(`Account #${sessionData.currentAccountSelected} Private Key`, currentAccount.privateKey);

    } catch (error) {
        console.log("Error:", error);
        showToast("Wrong password.", "error");
    }
}
