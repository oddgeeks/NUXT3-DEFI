import type { SessionTypes } from '@walletconnect/types'
import Bridge from '~~/components/modals/Bridge.vue'
import Swap from '~~/components/modals/Swap.vue'
import PendingTransaction from '~~/components/modals/PendingTransaction.vue'
import Send from '~~/components/modals/Send/Main.vue'
import SignCrossSendTx from '~~/components/modals/SignCrossSendTx.vue'
import TopUpGas from '~~/components/modals/TopUpGas.vue'
import WalletConnect from '~~/components/modals/WalletConnect.vue'
import WalletConnectDetailsV2 from '~~/components/modals/WalletConnectDetailsV2.vue'
import TokenSelection from '~~/components/modals/TokenSelection.vue'
import ImportToken from '~~/components/modals/ImportToken.vue'
import CustomToken from '~~/components/modals/CustomToken.vue'
import WCTransaction from '~~/components/modals/WCTransaction.vue'
import PowerOffSVG from '~/assets/images/icons/power-off-bg.svg?component'
import Dialog from '~~/components/modals/Dialog.vue'
import CustomTx from '~~/components/modals/CustomTx.vue'
import UpgradeVersion from '~~/components/modals/UpgradeVersion.vue'
import Web3 from '~/components/modals/Web3.vue'
import DeployNetwork from '~/components/modals/DeployNetwork.vue'
import YourWallet from '~/components/modals/YourWallet.vue'
import Networks from '~/components/modals/Networks.vue'
import Balance from '~/components/modals/Balance.vue'
import AddContact from '~/components/modals/AddContact.vue'
import SelectContact from '~/components/modals/SelectContact.vue'
import NFTDetails from '~/components/modals/NFTDetails.vue'
import SendNFT from '~/components/modals/SendNFT.vue'
import SupportedNetworks from '~/components/modals/SupportedNetworks.vue'
import PendingCrossTransaction from '~/components/modals/PendingCrossTransaction.vue'
import DefiPositionDetails from '~/components/modals/DefiPositionDetails.vue'
import QrCode from '~/components/modals/QrCode.vue'
import AddAuthority from '~/components/modals/AddAuthority.vue'
import AddSigner from '~/components/modals/Multisig/AddSigner.vue'
import ReviewSigner from '~/components/modals/Multisig/ReviewSigner.vue'
import ManageAuthority from '~/components/modals/ManageAuthority.vue'
import EstimateAuthority from '~/components/modals/EstimateAuthority.vue'
import SignAuthorityTransactions from '~/components/modals/SignAuthorityTransactions.vue'
import WalletNameEdit from '~/components/modals/WalletNameEdit.vue'
import ReviewMultisigTransaction from '~/components/modals/Multisig/ReviewTransaction.vue'
import MultisigTransactionDetail from '~/components/modals/Multisig/TransactionDetails.vue'
import EditNonce from '~/components/modals/Multisig/EditNonce.vue'
import SignSigner from '~/components/modals/Multisig/SignSigner.vue'
import DeleteSigner from '~/components/modals/Multisig/DeleteSigner.vue'
import SignDeleteSigner from '~/components/modals/Multisig/SignDeleteSigner.vue'
import UpdateThreshold from '~/components/modals/Multisig/UpdateThreshold.vue'
import MultisigSelectNetwork from '~/components/modals/Multisig/SelectNetwork.vue'
import UpdateNoticeModal from '~/components/modals/UpdateNotice.vue'

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
  sessionV2?: SessionTypes.Struct
  metadata: string
  isSign?: boolean
  signMessageDetails?: any
}

export function showPendingTransactionModal(hash: string,
  chainId: number | string,
  type?: ITxType,
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
      wrapperClass: '!max-w-fit',
      contentClass: '!px-7.5 !py-[32px]',
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

export function openWalletDetailsModalV2(session: SessionTypes.Struct) {
  openModal({
    component: WalletConnectDetailsV2,
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
        sessionV2: params.sessionV2,
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

export async function openSelectContactModal(chainId: string | number) {
  return openModal({
    component: SelectContact,
    async: true,
    componentProps: {
      chainId,
    },
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

export function openSupportedNetworks() {
  openModal({
    component: SupportedNetworks,
  })
}

export function openSignCrossSendTx(props: ICrossSendParams) {
  return openModal({
    async: true,
    component: SignCrossSendTx,
    componentProps: props,
  })
}

export function openQrCode() {
  openModal({
    component: QrCode,
    options: {
      wrapperClass: '!bg-transparent max-w-[510px]',
      contentClass: '!pt-6',
    },
  })
}

export function showPendingCrossTransaction(avocadoHash: string, fromChainId: number | string, toChainId: number | string) {
  openModal({
    component: PendingCrossTransaction,
    componentProps: {
      fromChainId,
      toChainId,
      avocadoHash,
    },
  })
}

export function openDefiPositionDetailsModal(position: Positions) {
  openModal({
    component: DefiPositionDetails,
    componentProps: {
      position,
    },
    options: {
      wrapperClass: 'max-w-[760px]',
    },
  })
}

export function openUpdateNoticeModal() {
  openModal({
    component: UpdateNoticeModal,
  })
}

export function openAddAuthorityModal() {
  return openModal({
    component: AddAuthority,
  })
}

export function openAddSignerModal(addresses?: string[], treshold?: number) {
  return openModal({
    component: AddSigner,
    componentProps: {
      addresses,
      defaultTreshold: treshold,
    },
    options: {
      wrapperClass: 'max-w-[560px]',
      contentClass: '!p-0',
    },
  })
}

export function openReviewSignerModal(addresses: string[]) {
  return openModal({
    component: ReviewSigner,
    componentProps: {
      addresses,
    },
    options: {
      wrapperClass: 'max-w-[560px]',
      contentClass: '!p-0',
    },
  })
}

export function openSignSignerModal(addresses: string[], chainIds: number[]) {
  return openModal({
    component: SignSigner,
    componentProps: {
      addresses,
      chainIds,
    },
    options: {
      wrapperClass: 'max-w-[560px]',
      contentClass: '!p-0',
    },
  })
}

export function openDeleteSignerSign(address: string, chainId: number | string) {
  return openModal({
    component: SignDeleteSigner,
    componentProps: {
      address,
      chainId,
    },
    options: {
      wrapperClass: 'max-w-[560px]',
      contentClass: '!p-0',
    },
  })
}

export function openDeleteSigner(addresses: string[], chainId: number | string) {
  return openModal({
    component: DeleteSigner,
    componentProps: {
      addresses,
      chainId,
    },
    async: true,
    options: {
      wrapperClass: 'max-w-[560px]',
      contentClass: '!p-0',
    },
  })
}

export async function openEditNonceModal(params: IOpenNonceModalParams) {
  const { chainId, actions, defaultNonce, estimatedFee, rejection, rejectionId } = params
  return openModal({
    component: EditNonce,
    componentProps: {
      chainId,
      actions,
      defaultNonce,
      estimatedFee,
      rejection,
      rejectionId,
    },
    options: {
      wrapperClass: 'max-w-[560px]',
      contentClass: '!p-0',
    },
    async: true,
  })
}

export function openManageAuthorityModal(authority: IAuthority, chainIds?: number[], isNewAuthority = false) {
  return openModal({
    component: ManageAuthority,
    componentProps: {
      authority,
      chainIds,
      isNewAuthority,
    },
  })
}

export function openEstimateAuthorityModal(authority: IAuthority, chainIds: number[] | string[], remove = false) {
  return openModal({
    component: EstimateAuthority,
    componentProps: {
      authority,
      chainIds,
      remove,
    },
    options: {
      wrapperClass: '!max-w-[510px]',
    },
  })
}

export function openSignAuthorityModal(authority: IAuthority, transactions: IAuthorityTx[], remove = false) {
  return openModal({
    component: SignAuthorityTransactions,
    componentProps: {
      transactions,
      authority,
      remove,
    },
  })
}

export function openUpdateThresholdModal(chainId: number | string, additionalCount: number) {
  return openModal({
    component: UpdateThreshold,
    componentProps: {
      chainId,
      additionalCount,
    },
    options: {
      contentClass: '!p-0',
    },
    async: true,
  })
}

export function openWalletNameEditModal(safe: ISafe) {
  return openModal({
    component: WalletNameEdit,
    async: true,
    componentProps: {
      safe,
    },
  })
}

export function openReviewMultisigTransaction(transactionId: string, rejection = false) {
  return openModal({
    component: ReviewMultisigTransaction,
    componentProps: {
      transactionId,
      rejection,
    },
  })
}

export function openMultisigTransactionDetails(transaction: IMultisigTransaction) {
  return openModal({
    component: MultisigTransactionDetail,
    componentProps: {
      transaction,
    },
    options: {
      wrapperClass: '!max-w-[1080px]',
      contentClass: '!p-0',
    },
  })
}

export function openMultisigSelectNetworkModal(addresses: string[]) {
  return openModal({
    component: MultisigSelectNetwork,
    componentProps: {
      addresses,
    },
    options: {
      contentClass: '!p-0',
      wrapperClass: '!max-w-[560px]',
    },
    async: true,
  })
}

// @ts-expect-error
globalThis.openCustomTxModal = openCustomTxModal
