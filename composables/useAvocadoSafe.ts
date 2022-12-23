import { storeToRefs } from "pinia";
import { ethers } from "ethers"
import { Forwarder__factory, GaslessWallet__factory } from '~~/contracts';
import { IGaslessSmartWallet } from "~~/contracts/Forwarder";
import { createSafe } from "@instadapp/avocado"

export const useAvocadoSafe = () => {
    const { switchNetworkByChainId } = useNetworks()
    const { account, library } = useWeb3()

    // check if we have a cached safe address
    const { safeAddress, tokenBalances, totalBalance } = storeToRefs(useSafe())

    const safe = shallowRef<ReturnType<typeof createSafe>>()

    watch(library, () => {
        safe.value = library.value ? createSafe(library.value.getSigner()) : undefined
    }, { immediate: true })

    const sendTransaction = async (transaction: { to: string, value?: string, data?: string, chainId: number }) => {
        if (!safe.value) return;

        await switchNetworkByChainId(75);

        const avoSigner = safe.value.getSigner();

        const tx = await avoSigner.sendTransaction(transaction)

        return tx.hash!
    }

    const sendTransactions = async (transactions: { to: string, value?: string, data?: string }[], chainId: number) => {
        if (!safe.value) return;

        await switchNetworkByChainId(75);

        const avoSigner = safe.value.getSigner();

        const tx = await avoSigner.sendTransactions(transactions, Number(chainId))

        return tx.hash!
    }

    return {
        tokenBalances,
        totalBalance,
        safeAddress,
        sendTransaction,
        sendTransactions,
    }
}