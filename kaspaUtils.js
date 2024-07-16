import * as kaspa from './kaspa/kaspa.js';
import { decryptData } from './cryptoUtils.js';

export let rpcClient;
let wasmInitialized = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'NETWORK_UPDATED') {
        const kaspaApiUrl = message.kaspaApiUrl;
        updateRpcClient(kaspaApiUrl);
    }
});

async function initWasmModule() {
    if (!wasmInitialized) {
        try {
            await kaspa.default('./kaspa/kaspa_bg.wasm');
            wasmInitialized = true;
            console.log("Wasm initialized");
        } catch (error) {
            console.error("Error initializing Wasm module:", error);
            throw error;
        }
    }
}

async function updateRpcClient(kaspaApiUrl) {
    try {
        await initWasmModule(); // Ensure the Wasm module is initialized
        if (rpcClient && rpcClient.isConnected) {
            await rpcClient.disconnect();
        }
        const RpcClient = kaspa.RpcClient;
        const sessionData = await getSessionData();
        const networkId = sessionData.network === 'mainnet' ? 'mainnet' : 'testnet-11';
        rpcClient = new RpcClient({ url: kaspaApiUrl, networkId: networkId });
        await rpcClient.connect();
        console.log("Connected new RPC client");
    } catch (error) {
        console.error("Error updating RPC client:", error);
        throw error;
    }
}

export async function filterAccountsByBalance(accounts) {
    const addresses = accounts.map(account => account.address);
    const balancesResponse = await rpcClient.getBalancesByAddresses(addresses);
    const balances = balancesResponse.entries;

    const accountsWithBalance = [];
    var foundBalanceIndex = 0;
    const accountLength = localStorage.getItem('accountLength');

    for (let i = 24; i >= 0; i--) {
        const balance = Number(balances[i].balance) * Math.pow(10, -8); // Convert BigInt to Number and format the balance
        if (foundBalanceIndex === 0 && balance > 0){
            foundBalanceIndex = i;
        }
        if (i <= foundBalanceIndex || i <= accountLength - 1) {
            accountsWithBalance.push({ ...accounts[i], balance });
        }
    }

    if (foundBalanceIndex > accountLength) {
        localStorage.setItem('accountLength', foundBalanceIndex + 1);
    }

    return accountsWithBalance.reverse()
}

export async function initKaspa() {
    try {
        await initWasmModule(); // Ensure the Wasm module is initialized
        const sessionData = await getSessionData();
        const kaspaApiUrl = sessionData.kaspaApiUrl;
        await updateRpcClient(kaspaApiUrl);
        console.log("Initialized RPC client during initKaspa");
    } catch (error) {
        console.error("Error initializing Kaspa:", error);
        throw error;
    }
}

export async function createAccounts(mnemonic) {
    try {
        const { PublicKeyGenerator, createAddress, NetworkType, XPrv, PrivateKeyGenerator } = kaspa;
        const sessionData = await getSessionData();
        const networkType = sessionData.network === 'mainnet' ? NetworkType.Mainnet : NetworkType.Testnet;

        const xPrv = new XPrv(mnemonic.toSeed());
        const xpub = PublicKeyGenerator.fromMasterXPrv(xPrv.intoString("kprv"), false, 0n);
        const compressedPublicKeys = xpub.receivePubkeys(0, 25);
        const addresses = compressedPublicKeys.map(key => createAddress(key, networkType).toString());
        const privateKeyGenerator = new PrivateKeyGenerator(xPrv, false, 0n);

        return compressedPublicKeys.map((key, index) => ({
            name: `Account #${index + 1}`,
            address: addresses[index],
            privateKey: privateKeyGenerator.receiveKey(index).toString()
        }));
    } catch (error) {
        console.error("Error creating accounts:", error);
        throw error;
    }
}

export async function reloadAccounts() {
    try {
        const sessionData = await getSessionData();
        if (!sessionData.encryptedSeed || !sessionData.password) {
            console.log("No encrypted seed or password found in session data");
            return;
        }

        const seed = await decryptData(sessionData.password, sessionData.encryptedSeed);
        const accounts = await createAccounts(new kaspa.Mnemonic(seed));
        const accountsWithBalance = await filterAccountsByBalance(accounts)

        await setSessionData({ ...sessionData, accounts: accountsWithBalance });
        console.log("Accounts reloaded with new network settings");
    } catch (error) {
        console.error("Error reloading accounts:", error);
        throw error;
    }
}

export function setSessionData(data) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'SET_SESSION_DATA', data }, (response) => resolve(response));
    });
}

export function getSessionData() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_SESSION_DATA' }, (response) => resolve(response));
    });
}

export { kaspa };
