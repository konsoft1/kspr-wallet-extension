import { kaspa, rpcClient, initKaspa, getSessionData } from './kaspaUtils.js';
import { showToast } from './uiUtils.js';

const { PrivateKey, Address, createTransactions } = kaspa;

export async function sendKas() {
    const recipientAddressInput = document.getElementById('recipientAddress');
    const sendAmountInput = document.getElementById('sendAmount');
    const priorityFeeInput = document.getElementById('priorityFeeKas');
    const recipientAddress = recipientAddressInput.value.trim();
    const sendAmount = parseFloat(sendAmountInput.value.trim());
    const priorityFee = parseFloat(priorityFeeInput.value.trim());

    if (!recipientAddress || !sendAmount) {
        showToast("Recipient address and amount are required.", "error");
        return;
    }

    const amountInSatoshis = BigInt(sendAmount * 1e8);
    const priorityFeeInSatoshis = BigInt(priorityFee * 1e8);

    try {
        await initKaspa();

        const sessionData = await getSessionData();
        const selectedAccount = sessionData.accounts[document.getElementById('accountSelector').selectedIndex];
        const privateKey = new PrivateKey(selectedAccount.privateKey);
        const sourceAddress = privateKey.toKeypair().toAddress(sessionData.network);
        const destinationAddress = new Address(recipientAddress);

        const utxosResponse = await rpcClient.getUtxosByAddresses([sourceAddress.toString()]);
        const utxos = utxosResponse.entries.map(entry => entry.entry);

        if (utxos.length === 0) {
            showToast("No UTXOs available for this address.", "error");
            return;
        }

        const { transactions } = await createTransactions({
            entries: utxos,
            outputs: [{ address: destinationAddress, amount: amountInSatoshis }],
            priorityFee: priorityFeeInSatoshis,
            changeAddress: sourceAddress,
            networkId: sessionData.network
        });

        for (const pending of transactions) {
            await pending.sign([privateKey]);
            const txId = await pending.submit(rpcClient);
            showToast(`Transaction sent! TXID: ${txId}`, "success");
        }
    } catch (error) {
        showToast("Failed to send transaction.", "error");
        console.error("Error:", error);
    }
}

