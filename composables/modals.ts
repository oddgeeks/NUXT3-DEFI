import Bridge from "~~/components/modals/Bridge.vue";
import Swap from "~~/components/modals/Swap.vue";
import PendingTransaction from "~~/components/modals/PendingTransaction.vue";
import Send from "~~/components/modals/Send.vue";
import TopUpGas from "~~/components/modals/TopUpGas.vue";
import WalletConnect from "~~/components/modals/WalletConnect.vue";
import WalletConnectDetails from "~~/components/modals/WalletConnectDetails.vue";
import TokenSelection from "~~/components/modals/TokenSelection.vue";
import ImportToken from "~~/components/modals/ImportToken.vue";
import WCTransaction from "~~/components/modals/WCTransaction.vue";
import PowerOffSVG from "~/assets/images/icons/power-off-bg.svg?component";
import Dialog from "~~/components/modals/Dialog.vue";
import type IWalletConnect from "@walletconnect/client";
import CustomTx from "~~/components/modals/CustomTx.vue";

const { openModal } = useModal();
interface DialogModalProps {
  title?: string;
  content?: string;
  type: "success" | "error" | "question";
  headerIconUrl?: string;
  isButtonVisible?: boolean;
  isCancelButtonVisible?: boolean;
  headerIconComponent?: any;
  cancelButtonText?: string;
  buttonText?: string;
  buttonProps?: any;
  cancelButtonProps?: any;
}

interface IWcTransactionModal {
  payload: any;
  chainId: string;
  modalId: string;
  wc: IWalletConnect;
}

export const showPendingTransactionModal = (
  hash: string,
  chainId: number | string,
  type: ITxType
) => {
  openModal({
    component: PendingTransaction,
    componentProps: {
      hash,
      chainId,
      type,
    },
  });
};

export const openBridgeModal = (address: string, chainId: number | string) => {
  openModal({
    component: Bridge,
    componentProps: {
      address,
      chainId,
    },
    options: {
      wrapperClass: "max-w-[600px]",
    },
  });
};

export const openSwapModal = (
  address: string,
  chainId: number | string,
  toAddress?: string,
  amount?: string
) => {
  openModal({
    component: Swap,
    componentProps: {
      address,
      chainId,
      toAddress,
      amount,
    },
    options: {
      wrapperClass: "max-w-[600px]",
    },
  });
};

export const openSendModal = (address: string, chainId: number | string) => {
  openModal({
    component: Send,
    componentProps: {
      address,
      chainId,
    },
    options: {
      wrapperClass: "max-w-[500px]",
    },
  });
};

export const openWalletConnectModal = () => {
  openModal({
    component: WalletConnect,
  });
};

export const openDisconnectWalletModal = async () => {
  return openDialogModal({
    title: "Are you sure you want to Log Out?",
    type: "question",
    cancelButtonText: "Cancel",
    isCancelButtonVisible: true,
    headerIconComponent:  h(PowerOffSVG),
    buttonText: "Disconnect",
    buttonProps: {
      color:'red',
    },
    cancelButtonProps: {
      color: "white",
    }
  })
}

export const openTopUpGasModal = () => {
  openModal({
    component: TopUpGas,
  });
};

export const openWalletDetailsModal = (session: any) => {
  openModal({
    component: WalletConnectDetails,
    componentProps: {
      session,
    },
  });
};

export const openTokenSelectionModal = async (params: any) => {
  return openModal({
    component: TokenSelection,
    async: true,
    componentProps: {
      tokens: params?.tokens || [],
      selectedToken: params?.selectedToken || null,
    },
    options: {
      contentClass: "!px-2.5",
    },
  });
};

export const openWCTransactionModal = async (params: IWcTransactionModal) => {
  return openModal({
    id: params.modalId,
    component: WCTransaction,
    async: true,
    componentProps: {
      payload: params.payload,
      chainId: params.chainId,
      wc: params.wc,
    },
    options: {
      contentClass: "md:px-10 md:pt-[34px] md:pb-10",
    },
  });
};

export const openImportTokenModal = () => {
  openModal({
    component: ImportToken,
  });
}

export const openDialogModal = async ({
  title = "",
  content = "",
  type = "success",
  buttonText = "Okay",
  headerIconUrl = "",
  isButtonVisible = true,
  cancelButtonText = "Cancel",
  isCancelButtonVisible = false,
  headerIconComponent = null,
  buttonProps = {},
  cancelButtonProps = {},
}: DialogModalProps) => {
  return await openModal({
    async: true,
    component: Dialog,
    componentProps: {
      title,
      headerIconUrl,
      content,
      type,
      buttonText,
      headerIconComponent,
      isButtonVisible,
      cancelButtonText,
      isCancelButtonVisible,
      buttonProps,
      cancelButtonProps,
    },
  });
};

export const openCustomTxModal = () => {
  openModal({
    component: CustomTx,
  });
};

//@ts-ignore
globalThis.openCustomTxModal = openCustomTxModal