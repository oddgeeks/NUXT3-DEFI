import Bridge from "~~/components/modals/Bridge.vue";
import PendingTransaction from "~~/components/modals/PendingTransaction.vue";
import Send from "~~/components/modals/Send.vue";
import TopUpGas from "~~/components/modals/TopUpGas.vue";
import WalletConnect from "~~/components/modals/WalletConnect.vue";
import DisconnectWallet from "~~/components/modals/DisconnectWallet.vue";

const { openModal } = useModal();

export const showPendingTransactionModal = (hash: string, chainId: number | string) => {
    openModal(PendingTransaction, {
        hash,
        chainId
    })
}

export const openBridgeModal = (address: string, chainId: number | string) => {
    openModal(Bridge, {
        address,
        chainId,
        }, {
        wrapperClass: 'max-w-[600px]',
    })
}

export const openSendModal = (address: string, chainId: number | string) => {
    openModal(Send, {
        address,
        chainId
    })
}

export const openWalletConnectModal = () => {
    openModal(WalletConnect, {})
}

export const openTopUpGasModal = () => {
    openModal(TopUpGas, {})
}

export const openDisconnectWalletModal = (session: any) => {
    openModal(DisconnectWallet, {
      session,
    });
};