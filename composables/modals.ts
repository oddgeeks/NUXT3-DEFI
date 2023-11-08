import type { SessionTypes } from '@walletconnect/types'
import ExecuteTransaction from '~~/components/modals/Multisig/ExecuteTransaction.vue'
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
import AddSigner from '~/components/modals/Multisig/AddSigner.vue'
import ReviewSigner from '~/components/modals/Multisig/ReviewSigner.vue'
import WalletNameEdit from '~/components/modals/WalletNameEdit.vue'
import ReviewMultisigTransaction from '~/components/modals/Multisig/ReviewTransaction.vue'
import MultisigTransactionDetail from '~/components/modals/Multisig/TransactionDetails.vue'
import EditNonce from '~/components/modals/Multisig/EditNonce.vue'
import SignSigner from '~/components/modals/Multisig/SignSigner.vue'
import DeleteSigner from '~/components/modals/Multisig/DeleteSigner.vue'
import SignDeleteSigner from '~/components/modals/Multisig/SignDeleteSigner.vue'
import UpdateThreshold from '~/components/modals/Multisig/UpdateThreshold.vue'
import FetchGnosisSafe from '~/components/modals/Multisig/FetchGnosisSafe.vue'
import MultisigSelectNetwork from '~/components/modals/Multisig/SelectNetwork.vue'
import UpdateNoticeModal from '~/components/modals/UpdateNotice.vue'
import CreateBatchModal from '~/components/modals/CreateBatchModal.vue'
import ViewDecodedModal from '~/components/modals/Multisig/ViewDecodedModal.vue'
import WelcomeModal from '~/components/modals/Welcome.vue'
import CreateBookmark from '~/components/modals/CreateBookmark.vue'
import ExecutionError from '~/components/modals/Multisig/ExecutionError.vue'
import ActivateMFA from '~/components/modals//Mfa/ActivateMFA.vue'
import AuthenticateMFA from '~/components/modals//Mfa/Authenticate.vue'
import VerifyMFA from '~/components/modals//Mfa/VerifyMFA.vue'
import TotpRecoveryCode from '~/components/modals/Mfa/TotpRecoveryCode.vue'
import TotpDeactivateByRecoveryCode from '~/components/modals/Mfa/TotpDeactivateByRecoveryCode.vue'
import TotpActivate from '~/components/modals/Mfa/TotpActivate.vue'
import MFATerms from '~/components/modals/Mfa/Terms.vue'
import MFASignInstadappSigner from '~/components/modals/Mfa/SignInstadappSigner.vue'
import MFAActivateBackupSigner from '~/components/modals/Mfa/ActivateBackupSigner.vue'
import MFAReviewBackupTransaction from '~/components/modals/Mfa/ReviewBackupTransaction.vue'
import ReviewSignerProcess from '~/components/modals/Multisig/ReviewSignerProcess.vue'
import AllWallets from '~/components/modals/AllWallets.vue'

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
  bookmark?: IBookmark
}

export function showPendingTransactionModal(hash: string,
  chainId: number | string,
  type?: IWeb3Action,
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
  contact?: IContact,
  bookmark?: IBookmark,
) {
  openModal({
    component: Send,
    componentProps: {
      address,
      chainId,
      contact,
      bookmark,
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
  const { tokens = [], selectedToken = null, sort = true } = params || {}
  return openModal({
    component: TokenSelection,
    async: true,
    componentProps: {
      tokens,
      selectedToken,
      sort,
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
        bookmark: params?.bookmark,
      },
      options: {
        contentClass: '!p-0',
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

export async function openUpgradeModal(options: ISafeOptions) {
  return openModal({
    component: UpgradeVersion,
    async: true,
    componentProps: {
      options,
    },
    options: {
      contentClass: 'sm:!p-7.5',
      wrapperClass: '!max-w-[510px]',
    },
  })
}

export function openCustomTxModal() {
  openModal({
    component: CustomTx,
  })
}

export function openDeployNetworkModal(option: ISafeOptions) {
  openModal({
    component: DeployNetwork,
    componentProps: {
      option,
    },
    options: {
      wrapperClass: '!max-w-[560px]',
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
  if (isEdit) {
    const { allSafes } = storeToRefs(useSafe())
    const safe = allSafes.value.find(i => isAddressEqual(i.safe_address, address))

    if (safe)
      return openWalletNameEditModal(safe)
  }

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

export async function openSelectContactModal(chainId?: string | number) {
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
  return openModal({
    component: UpdateNoticeModal,
    async: true,
  })
}

export function openWelcomeModal() {
  openModal({
    component: WelcomeModal,
    options: {
      wrapperClass: 'md:min-w-[560px]',
      contentClass: '!p-0',
    },
  })
}

export function openAddSignerModal(params?: IAddSignerModalParams) {
  const { addresses, threshold, gnosisAddress, defaultSelectedNetworks } = params || {}
  return openModal({
    component: AddSigner,
    componentProps: {
      addresses,
      defaultThreshold: threshold,
      gnosisAddress,
      defaultSelectedNetworks,
    },
    options: {
      wrapperClass: 'max-w-[560px]',
      contentClass: '!p-0',
    },
  })
}

export function openReviewSignerModal(props: IReviewSignerModalParams) {
  const { addresses, gnosisAddress, defaultSelectedNetworks, defaultThreshold } = props
  return openModal({
    component: ReviewSigner,
    componentProps: {
      addresses,
      gnosisAddress,
      defaultSelectedNetworks,
      defaultThreshold,
    },
    options: {
      wrapperClass: 'max-w-[560px]',
      contentClass: '!p-0',
    },
  })
}

export function openSignSignerModal(addresses: ISignerAddress[], chainIds: number[], gnosisAddress?: string, defaultThreshold?: number) {
  return openModal({
    component: SignSigner,
    componentProps: {
      addresses,
      chainIds,
      gnosisAddress,
      defaultThreshold,
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
  const { chainId, actions, defaultNonce, estimatedFee, rejection, rejectionId, transactionType, options = {}, metadata } = params
  return openModal({
    component: EditNonce,
    componentProps: {
      chainId,
      actions,
      defaultNonce,
      estimatedFee,
      rejection,
      rejectionId,
      transactionType,
      options,
      metadata,
    },
    options: {
      wrapperClass: 'max-w-[560px]',
      contentClass: '!p-0',
    },
    async: true,
  })
}

export function openUpdateThresholdModal(chainId: number | string, additionalCount: number, {
  activeStep = 0,
  totalSteps = 0,
  defaultThreshold = undefined,
} = {}) {
  return openModal({
    component: UpdateThreshold,
    componentProps: {
      chainId,
      additionalCount,
      activeStep,
      totalSteps,
      thresholdDefault: defaultThreshold,
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

export function openReviewMultisigTransaction(transactionId: string, chainId: string | number, rejection = false) {
  return openModal({
    component: ReviewMultisigTransaction,
    componentProps: {
      transactionId,
      rejection,
      chainId,
    },
  })
}

export function openReview2faBackupTransaction(transactionId: string, chainId: string | number) {
  return openModal({
    component: MFAReviewBackupTransaction,
    componentProps: {
      transactionId,
      chainId,
    },
    options: {
      contentClass: '!p-7.5',
      wrapperClass: '!max-w-[560px]',
      closeButton: false,
      clickToClose: false,
    },
  })
}
export async function openMultisigTransactionDetails(transaction: IMultisigTransaction) {
  return openModal({
    component: MultisigTransactionDetail,
    componentProps: {
      transaction,
    },
    async: true,
    options: {
      wrapperClass: '!max-w-[1080px]',
      contentClass: '!p-0',
    },
  })
}

export function openMultisigSelectNetworkModal(params: ISelectSignerNetworkModalParams) {
  const { addresses, defaultSelectedNetworks, gnosisAddress, defaultThreshold } = params

  return openModal({
    component: MultisigSelectNetwork,
    componentProps: {
      addresses,
      defaultSelectedNetworks,
      gnosisAddress,
      defaultThreshold,
    },
    options: {
      contentClass: '!p-0',
      wrapperClass: '!max-w-[560px]',
    },
    async: true,
  })
}

export function openExecuteTransactionModal(params: IOpenExecuteModalParams) {
  const { isGasTopup = false, transaction } = params
  return openModal({
    component: ExecuteTransaction,
    componentProps: {
      transaction,
      isGasTopup,
    },
    options: {
      wrapperClass: '!max-w-[560px]',
    },
    async: true,
  })
}

export async function openCreateBookmarkModal(props: CreateBookmarkProps) {
  return openModal({
    component: CreateBookmark,
    componentProps: props,
    async: true,
    options: {
      wrapperClass: 'max-w-[600px]',
      contentClass: '!p-0',
    },
  })
}

export function openFetchGnosisSafeModal(gnosisAddress?: string) {
  return openModal({
    component: FetchGnosisSafe,
    componentProps: {
      address: gnosisAddress,
    },
    options: {
      contentClass: '!p-0',
      wrapperClass: '!max-w-[560px]',
    },
  })
}

export async function openExecutionErrorModal(proposalId: string, safeAddress: string) {
  return openModal({
    component: ExecutionError,
    componentProps: {
      proposalId,
      safeAddress,
    },

  })
}

export async function openCreateBatchModal(params: ICreateBatchModal) {
  return openModal({
    component: CreateBatchModal,
    async: true,
    componentProps: params,
    options: {
      contentClass: '!p-7.5',
      wrapperClass: '!max-w-[560px]',
    },
  })
}

export async function openDecodedParamsModal(params: IDecodedParams) {
  return openModal({
    component: ViewDecodedModal,
    async: true,
    componentProps: {
      decodedParams: params,
    },
    options: {
      contentClass: '!p-0',
      wrapperClass: '!max-w-[fit-content]',
    },
  })
}

export async function openMfaTermsModal() {
  return openModal({
    component: MFATerms,
    async: true,
    options: {
      contentClass: '!p-0',
      wrapperClass: '!max-w-[575px]',
    },
  })
}

export async function openMfaActivateModal(params: IMfaActivateModalParams) {
  const { mfaType } = params || {}
  return openModal({
    component: ActivateMFA,
    async: true,
    componentProps: {
      mfaType,
    },
    options: {
      contentClass: '!p-0',
    },
  })
}

export async function openTotptActivateModal(totp: ITotpData) {
  return openModal({
    component: TotpActivate,
    async: true,
    componentProps: {
      totp,
    },
    options: {
      contentClass: '!p-0',
      clickToClose: false,
      closeButton: false,
    },
  })
}

export async function openMfaAuthenticateModal(mfaRequestType: MfaRequestType, excludeMfa: IMfa, chainId?: number | string) {
  return openModal({
    component: AuthenticateMFA,
    async: true,
    componentProps: {
      mfaRequestType,
      excludeMfa,
      chainId,
    },
    options: {
      contentClass: '!p-0',
      wrapperClass: '!max-w-[560px]',
    },
  })
}

export async function openVerifyMFAModal(params: IMfaVerifyModalParams) {
  const { mfa, request, authenticate, mfaRequestType, verify, inputValue, defaultSessionAvailable, chainId, expire } = params || {}

  return openModal({
    component: VerifyMFA,
    async: true,
    componentProps: {
      mfa,
      request,
      chainId,
      verify,
      inputValue,
      authenticate,
      mfaRequestType,
      defaultSessionAvailable,
      expire,
    },
    options: {
      contentClass: '!p-0',
      wrapperClass: '!max-w-[490px]',
    },
  })
}

export async function openRegenerateTotpRecoveryCodeModal(recoverycodes?: string[]) {
  return openModal({
    component: TotpRecoveryCode,
    async: true,
    componentProps: {
      recoverycodes,
    },
    options: {
      contentClass: '!p-0',
      wrapperClass: '!max-w-[560px]',
      clickToClose: false,
      closeButton: false,
    },
  })
}

export async function openDeactivateTotpByRecoveryCodes() {
  return openModal({
    component: TotpDeactivateByRecoveryCode,
    async: true,
    componentProps: {
    },
    options: {
      contentClass: '!p-0',
      wrapperClass: '!max-w-[560px]',
    },
  })
}
export function openMfaSignInstadappSignerModal(address: string, removeSigner?: boolean) {
  return openModal({
    component: MFASignInstadappSigner,
    async: true,
    componentProps: {
      address,
      removeSigner,
    },
    options: {
      contentClass: '!p-0',
      wrapperClass: '!max-w-[560px]',
    },
  })
}

export function openAddBackupSignerModal() {
  return openModal({
    component: MFAActivateBackupSigner,
    async: true,
    componentProps: {
    },
    options: {
      contentClass: '!p-0',
      wrapperClass: '!max-w-[560px]',
    },
  })
}

export function openReviewSignerProcessModal(params: IOpenReviewSignerProcessModalParams) {
  const { chainId, actions, deleteSigner, isInstadappSigner, removeBackupSigner } = params || {}

  return openModal({
    component: ReviewSignerProcess,
    componentProps: {
      chainId,
      actions,
      deleteSigner,
      isInstadappSigner,
      removeBackupSigner,
    },
    async: true,
  })
}

export function open2faTerminateSessionModal() {
  return openDialogModal({
    title: 'Are you sure you want to terminate your verified session?',
    content: 'OTP verification will be required for transacting if you terminate.',
    type: 'question',
    cancelButtonText: 'Keep session',
    isCancelButtonVisible: true,
    buttonText: 'Terminate',
    buttonProps: {
      color: 'red',
    },
    cancelButtonProps: {
      color: 'white',
    },
  })
}

export function openAllWalletsModal() {
  return openModal({
    component: AllWallets,
    options: {
      wrapperClass: '!max-w-[800px]',
      contentClass: '!p-0',
    },
  })
}

// @ts-expect-error
globalThis.openCustomTxModal = openCustomTxModal
