import type IWalletConnect from '@walletconnect/client'
import Bridge from '~~/components/modals/Bridge.vue'
import Swap from '~~/components/modals/Swap.vue'
import PendingTransaction from '~~/components/modals/PendingTransaction.vue'
import Send from '~~/components/modals/Send.vue'
import TopUpGas from '~~/components/modals/TopUpGas.vue'
import WalletConnect from '~~/components/modals/WalletConnect.vue'
import WalletConnectDetails from '~~/components/modals/WalletConnectDetails.vue'
import TokenSelection from '~~/components/modals/TokenSelection.vue'
import ImportToken from '~~/components/modals/ImportToken.vue'
import CustomToken from '~~/components/modals/CustomToken.vue'
import WCTransaction from '~~/components/modals/WCTransaction.vue'
import PowerOffSVG from '~/assets/images/icons/power-off-bg.svg'
import Dialog from '~~/components/modals/Dialog.vue'
import CustomTx from '~~/components/modals/CustomTx.vue'
import UpgradeVersion from '~~/components/modals/UpgradeVersion.vue'
import Web3 from '~/components/modals/Web3.vue'
import MobileHeader from '~/components/modals/MobileHeader.vue'
import DeployNetwork from '~/components/modals/DeployNetwork.vue'
import YourWallet from '~/components/modals/YourWallet.vue'
import Networks from '~/components/modals/Networks.vue'
import Balance from '~/components/modals/Balance.vue'
import AddContact from '~/components/modals/AddContact.vue'
import SelectContact from '~/components/modals/SelectContact.vue'
import NFTDetails from '~/components/modals/NFTDetails.vue'
import SendNFT from '~/components/modals/SendNFT.vue'

const { openModal } = useModal()
interface DialogModalProps {
  title?: string
  content?: string
  type: 'success' | 'error' | 'question'
  headerIconUrl?: string
  isButtonVisible?: boolean
  isCancelButtonVisible?: boolean
  headerIconComponent?: any
  cancelButtonText?: string
  buttonText?: string
  buttonProps?: any
  cancelButtonProps?: any
}

interface IWcTransactionModal {
  payload: any
  chainId: string
  wc: IWalletConnect
  metadata: string
  isSign?: boolean
  signMessageDetails?: any
}

export function showPendingTransactionModal(hash: string,
  chainId: number | string,
  type: ITxType,
  async = false) {
  return openModal({
    component: PendingTransaction,
    async,
    componentProps: {
      hash,
      chainId,
      type,
    },
  })
}

export function openBridgeModal(address: string, chainId: number | string) {
  openModal({
    component: Bridge,
    componentProps: {
      address,
      chainId,
    },
    options: {
      wrapperClass: 'max-w-[600px]',
    },
  })
}

export function openSwapModal(address: string,
  chainId: number | string,
  toAddress?: string,
  amount?: string) {
  openModal({
    component: Swap,
    componentProps: {
      address,
      chainId,
      toAddress,
      amount,
    },
    options: {
      wrapperClass: 'max-w-[600px]',
    },
  })
}

export function openSendModal(chainId: number | string,
  address?: string,
  contact?: IContact) {
  openModal({
    component: Send,
    componentProps: {
      address,
      chainId,
      contact,
    },
    options: {
      wrapperClass: 'max-w-[600px]',
    },
  })
}

export function openWalletConnectModal() {
  openModal({
    component: WalletConnect,
  })
}

export async function openDisconnectWalletModal() {
  return openDialogModal({
    title: 'Are you sure you want to Log Out?',
    type: 'question',
    cancelButtonText: 'Cancel',
    isCancelButtonVisible: true,
    headerIconComponent: h(PowerOffSVG),
    buttonText: 'Disconnect',
    buttonProps: {
      color: 'red',
    },
    cancelButtonProps: {
      color: 'white',
    },
  })
}

export function openTopUpGasModal() {
  openModal({
    component: TopUpGas,
  })
}

export function openWalletDetailsModal(session: any) {
  openModal({
    component: WalletConnectDetails,
    componentProps: {
      session,
    },
  })
}

export async function openTokenSelectionModal(params: any) {
  return openModal({
    component: TokenSelection,
    async: true,
    componentProps: {
      tokens: params?.tokens || [],
      selectedToken: params?.selectedToken || null,
    },
    options: {
      contentClass: '!px-2.5',
    },
  })
}

export const openWCTransactionModal = useThrottleFn(
  async (params: IWcTransactionModal) => {
    return openModal({
      component: WCTransaction,
      async: true,
      componentProps: {
        payload: params.payload,
        chainId: params.chainId,
        wc: params.wc,
        metadata: params.metadata,
        isSign: params.isSign,
        signMessageDetails: params?.signMessageDetails,
      },
      options: {
        contentClass: 'md:px-10 md:pt-[34px] md:pb-10',
        wrapperClass: '!max-w-[600px]',
      },
    })
  },
  1000,
)

export function openImportTokenModal() {
  openModal({
    component: ImportToken,
    options: {
      contentClass: '!px-2.5 !pb-0 overflow-hidden',
    },
  })
}

export function openCustomTokenModal(address?: string) {
  return openModal({
    component: CustomToken,
    componentProps: {
      address,
    },
  })
}

export function openWeb3Modal() {
  return openModal({
    component: Web3,
  })
}

export async function openDialogModal({
  title = '',
  content = '',
  type = 'success',
  buttonText = 'Okay',
  headerIconUrl = '',
  isButtonVisible = true,
  cancelButtonText = 'Cancel',
  isCancelButtonVisible = false,
  headerIconComponent = null,
  buttonProps = {},
  cancelButtonProps = {},
}: DialogModalProps) {
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
  })
}

export async function openUpgradeModal(network: NetworkVersion) {
  return openModal({
    component: UpgradeVersion,
    async: true,
    componentProps: {
      network,
    },
  })
}

export function openCustomTxModal() {
  openModal({
    component: CustomTx,
  })
}

export function openMobileHeader() {
  openModal({
    component: MobileHeader,
    options: {
      sheetPosition: 'top',
      contentClass: '!px-5 !py-5',
    },
  })
}

export function openDeployNetworkModal(network: Network) {
  openModal({
    component: DeployNetwork,
    componentProps: {
      network,
    },
  })
}

export function openYourWalletModal(address: string) {
  openModal({
    component: YourWallet,
    componentProps: {
      address,
    },
  })
}

export function openNetworksModal() {
  openModal({
    component: Networks,
  })
}

export function openBalanceModal(balance: any) {
  openModal({
    component: Balance,
    componentProps: {
      balance,
    },
  })
}

export function openAddContactModal(name?: string,
  address?: string,
  chainId?: number | string,
  isEdit?: boolean) {
  return openModal({
    component: AddContact,
    async: true,
    componentProps: {
      name,
      address,
      chainId,
      isEdit,
    },
  })
}

export async function openDeleteContactModal() {
  return openDialogModal({
    title: 'Are you sure you want to delete this contact?',
    type: 'question',
    cancelButtonText: 'Cancel',
    isCancelButtonVisible: true,
    buttonText: 'Delete',
    buttonProps: {
      color: 'red',
    },
    cancelButtonProps: {
      color: 'white',
    },
  })
}

export async function openSelectContactModal() {
  return openModal({
    component: SelectContact,
    async: true,
  })
}

export function openNFTDetailsModal(NFTData: NFTData) {
  openModal({
    component: NFTDetails,
    componentProps: {
      asset: NFTData,
    },

  })
}

export function openSendNFTModal(NFTData: NFTData) {
  openModal({
    component: SendNFT,
    componentProps: {
      asset: NFTData,
    },
    options: {
      wrapperClass: 'max-w-[600px]',
    },
  })
}

// @ts-expect-error
globalThis.openCustomTxModal = openCustomTxModal
