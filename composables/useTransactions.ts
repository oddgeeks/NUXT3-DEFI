import PendingTransaction from "~~/components/modals/PendingTransaction.vue";

const { openModal } = useModal();


export const showPendingTransactionModal = (hash: string, chainId: number | string) => {
    openModal(PendingTransaction, {
        hash,
        chainId
    })
}