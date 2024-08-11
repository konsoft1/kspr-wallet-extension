import { initKaspa, setSessionData, createAccounts, filterAccountsByBalance, rpcClient, kaspa } from './kaspaUtils.js';
import { showToast, showScreen, showModal } from './uiUtils.js';
import { decryptData, encryptData } from './cryptoUtils.js';
import { populateAccountSelector, displayAccountDetails } from './accountHandlers.js';

let mnemonic; // Ensure this is available globally within this module

async function handleSeedProcess(seed, password, screenWallet) {
    const { Mnemonic } = kaspa;
    try {
        const accounts = await createAccounts(new Mnemonic(seed));
        const accountsWithBalance = await filterAccountsByBalance(accounts)
        const sessionData = { accounts: accountsWithBalance, isLoggedIn: true, lastActivityTime: Date.now(), password, encryptedSeed: await encryptData(password, seed) };
        await setSessionData(sessionData);
        localStorage.setItem('encryptedSeed', JSON.stringify(sessionData.encryptedSeed));
        showScreen(screenWallet);
        populateAccountSelector(accountsWithBalance);
        const currentAccountNumberElement = document.getElementById('current-account-number');
        currentAccountNumberElement.textContent = "Account #1";
        displayAccountDetails(accountsWithBalance[0]);
        console.log("Handled seed process and updated accounts");
    } catch (error) {
        console.error("Error handling seed process:", error);
        showToast("Failed to handle seed process.", "error");
    }
}

export async function handleWallet(isCreate, screenShowMnemonic, screenWallet) {
    const { Mnemonic } = kaspa;
    const unlockPasswordInput = document.getElementById('unlockPassword');

    try {
        await initKaspa();
        console.log("Kaspa Initialized");

        if (isCreate) {
            mnemonic = Mnemonic.random(12);
            document.getElementById('mnemonicWords').innerText = mnemonic.phrase;
            showScreen(screenShowMnemonic);
        } else {
            const password = unlockPasswordInput.value;
            if (!password) {
                showToast("Password is required!", "error");
                return;
            }
            const encryptedSeed = JSON.parse(localStorage.getItem('encryptedSeed'));
            const seed = await decryptData(password, encryptedSeed);
            console.log("Seed Decrypted, processing seed...");
            await handleSeedProcess(seed, password, screenWallet);
        }
    } catch (error) {
        console.log("Error:", error);
        showToast(isCreate ? "Failed to create wallet." : "Failed to unlock wallet. Please check your password.", "error");
    }
}

export async function logout(screenUnlockWallet) {
    const unlockPasswordInput = document.getElementById('unlockPassword');
    await setSessionData({ accounts: [], isLoggedIn: false });
    if (rpcClient && rpcClient.isConnected) await rpcClient.disconnect();
    unlockPasswordInput.value = '';
    showScreen(screenUnlockWallet);
    showToast("Wallet logout successfully!", "success");
}

async function handleMnemonicInput(mnemonicInput, screenWallet) {
    const { Mnemonic } = kaspa;
    if (!Mnemonic.validate(mnemonicInput)) {
        showToast("Invalid mnemonic. Please check and try again.", "error");
        return;
    }

    /**
     * Roni
     */
    const password = await showPromptModal('Enter a password to encrypt your seed:');
    if (password === null) {
        return;
    }
    /* const password = prompt("Enter a password to encrypt your seed:");
    if (!password) {
        showToast("Password is required!", "error");
        return;
    } */

    await handleSeedProcess(mnemonicInput, password, screenWallet);
}

export async function resetWallet(screenWallet) {
    await initKaspa();
    const resetMnemonicInput = document.getElementById('resetMnemonic').value.trim();
    await handleMnemonicInput(resetMnemonicInput, screenWallet);
}

export async function confirmMnemonic(screenWallet) {
    const confirmMnemonicInput = document.getElementById('confirmMnemonic').value.trim();
    if (mnemonic && confirmMnemonicInput === mnemonic.phrase) {
        /**
         * Roni
         */
        const password = await showPromptModal('Enter a password to encrypt your seed:');
        if (password === null) {
            return;
        }
        /* const password = prompt("Enter a password to encrypt your seed:");
        if (!password) {
            showToast("Password is required!", "error");
            return;
        } */
        await handleSeedProcess(mnemonic.phrase, password, screenWallet);
    } else {
        showToast("The mnemonic does not match. Please try again.", "error");
    }
}

export async function importWallet(screenWallet) {
    await initKaspa();
    const importMnemonicInput = document.getElementById('importMnemonic').value.trim();
    await handleMnemonicInput(importMnemonicInput, screenWallet);
}

export async function exportWalletSeed() {
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
        const seed = await decryptData(password, encryptedSeed);
        showModal("Your wallet seed", seed);
    } catch (error) {
        console.log("Error:", error);
        showToast("Wrong password.", "error");
    }
}
