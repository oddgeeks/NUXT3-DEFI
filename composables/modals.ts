import Bridge from "~~/components/modals/Bridge.vue";
import Swap from "~~/components/modals/Swap.vue";
import PendingTransaction from "~~/components/modals/PendingTransaction.vue";
import Send from "~~/components/modals/Send.vue";
import TopUpGas from "~~/components/modals/TopUpGas.vue";
import WalletConnect from "~~/components/modals/WalletConnect.vue";
import WalletConnectDetails from "~~/components/modals/WalletConnectDetails.vue";
import Dialog from "~~/components/modals/Dialog.vue";

const { openModal } = useModal();
interface DialogModalProps {
  title?: string;
  content?: string;
  type?: "success" | "error" | "question";
  headerIconUrl?: string;
  isButtonVisible?: boolean;
  isCancelButtonVisible?: boolean;
  cancelButtonText?: string;
  buttonText?: string;
  callback?: () => void;
  cancelCallback?: () => void;
  buttonProps?: any;
  cancelButtonProps?: any;
}

export const showPendingTransactionModal = (
  hash: string,
  chainId: number | string,
  type: ITxType
) => {
  openModal(PendingTransaction, {
    hash,
    chainId,
    type,
  });
};

export const openBridgeModal = (address: string, chainId: number | string) => {
  openModal(
    Bridge,
    {
      address,
      chainId,
    },
    {
      wrapperClass: "max-w-[600px]",
    }
  );
};

export const openSwapModal = (address: string, chainId: number | string) => {
  openModal(
    Swap,
    {
      address,
      chainId,
    },
    {
      wrapperClass: "max-w-[600px]",
    }
  );
};

export const openSendModal = (address: string, chainId: number | string) => {
  openModal(Send, {
    address,
    chainId,
  });
};

export const openWalletConnectModal = () => {
  openModal(WalletConnect, {});
};

export const openTopUpGasModal = () => {
  openModal(TopUpGas, {});
};

export const openWalletDetailsModal = (session: any) => {
  openModal(WalletConnectDetails, {
    session,
  });
};

export const openDialogModal = ({
  title = "",
  content = "",
  type = "success",
  buttonText = "Okay",
  headerIconUrl = "",
  isButtonVisible = true,
  cancelButtonText = "Cancel",
  isCancelButtonVisible = false,
  buttonProps = {},
  cancelButtonProps = {},
  cancelCallback = () => {},
  callback = () => {},
}: DialogModalProps) => {
  openModal(Dialog, {
    title,
    headerIconUrl,
    content,
    type,
    buttonText,
    isButtonVisible,
    callback,
    cancelCallback,
    cancelButtonText,
    isCancelButtonVisible,
    buttonProps,
    cancelButtonProps,
  });
};
