import { isAddress } from '@ethersproject/address'
import { VoidSigner, ethers } from 'ethers'
import axios from 'axios'

import { isUndefined } from '@walletconnect/utils'
import { GaslessWallet__factory } from '@instadapp/avocado-base/contracts'
import {
  AvoMultisigImplementation__factory,
  Forwarder__factory,
} from '@/contracts'

const executedTransactions = ref<string[]>([])

export function useAvocadoSafe() {
  const { switchToAvocadoNetwork } = useNetworks()
  const { library, account } = useWeb3()
  const { trackingAccount, isTrackingMode } = useAccountTrack()
  const { avoProvider } = useSafe()
  const { selectedSafe } = storeToRefs(useSafe())
  const { forwarderProxyContract } = useSafe()
  const { clearAllModals } = useModal()

  const { isSafeMultisig, requiredSigners } = storeToRefs(useMultisig())

  // check if we have a cached safe address
  const { safeAddress, mainSafeAddress, tokenBalances, totalBalance, totalEoaBalance, eoaBalances, fundedEoaNetworks, multiSigSafeAddress } = storeToRefs(useSafe())

  const safe = shallowRef<ReturnType<typeof avocado.createSafe>>()
  const signer = computed(() => (safe.value ? safe.value.getSigner() : null))

  watch(
    [library, account, isTrackingMode, selectedSafe],
    () => {
      if (isTrackingMode.value) {
        const voidSigner = new VoidSigner(trackingAccount.value!, avoProvider)
        safe.value = avocado.createSafe(voidSigner)
      }
      else {
        safe.value = library.value
          ? avocado.createSafe(library.value.getSigner().connectUnchecked(), undefined, selectedSafe?.value?.owner_address || account.value)
          : undefined
      }
    },
    { immediate: true },
  )

  const sendTransaction = async (
    transaction: {
      to: string
      value?: string
      data?: string
      chainId: number | string
      operation?: string
    },
    options: { metadata?: string; id?: string } = {},
  ) => {
    if (isTrackingMode.value) {
      openSnackbar({
        message: 'Transaction might be successful',
        type: 'success',
      })
      return
    }

    await switchToAvocadoNetwork()

    if (!signer.value)
      throw new Error('Safe not initialized')

    if (isSafeMultisig.value) {
      const actions = [
        {
          to: transaction.to,
          value: transaction.value,
          data: transaction.data,
          operation: transaction.operation,
        },
      ]

      const txHash = await createProposalOrSignDirecty({
        chainId: transaction.chainId,
        metadata: options.metadata,
        actions,
      })

      if (txHash)
        return txHash
    }
    else {
      const tx = await signer.value.sendTransaction(
        {
          ...transaction,
          chainId: Number(transaction.chainId),
        },
        { source: '0xE8385fB3A5F15dED06EB5E20E5A81BF43115eb8E', ...options },
      )

      return tx.hash!
    }
  }

  const sendTransactions = async (
    transactions: {
      to: string
      value?: string
      data?: string
      operation?: string
    }[],
    chainId: number | string,
    options: { metadata?: string; id?: string } = {},
  ) => {
    if (isTrackingMode.value) {
      openSnackbar({
        message: 'Transaction might be successful',
        type: 'success',
      })
      return
    }

    await switchToAvocadoNetwork()

    if (!signer.value)
      throw new Error('Safe not initialized')

    if (isSafeMultisig.value) {
      const txHash = await createProposalOrSignDirecty({ chainId, actions: transactions, metadata: options.metadata })

      if (txHash)
        return txHash
    }
    else {
      const tx = await signer.value.sendTransactions(
        transactions,
        Number(chainId),
        { source: '0xE8385fB3A5F15dED06EB5E20E5A81BF43115eb8E', ...options },
      )

      return tx.hash!
    }
  }

  const isSafeAddress = async (
    safeAddressToCheck: string,
  ): Promise<boolean> => {
    if (!isAddress(safeAddressToCheck))
      return false

    const resp = await avoProvider.send('api_getSafe', [safeAddressToCheck])

    return (
      resp
      && resp.safe_address.toLowerCase() === safeAddressToCheck.toLowerCase()
    )
  }

  async function generateMultisigSignatureAndSign({ chainId, actions, nonce, metadata }: IGenerateMultisigSignatureParams) {
    const data = await generateMultisigSignatureMessage({ chainId, actions, nonce, metadata })
    const signature = await signMultisigData({ chainId, data })

    return {
      signatureParams: {
        signature,
        address: account.value,
      },
      castParams: data,
    }
  }

  async function multisigBroadcast(params: IMultisigBroadcastParams) {
    const sortedSignatures = params.confirmations.sort((left, right) =>
      left.address.toLowerCase().localeCompare(right.address.toLowerCase()),
    ).map((i) => {
      return {
        signature: i.signature,
        signer: i.address,
      }
    })

    if (!signer.value)
      throw new Error('Safe not initialized')

    const signatureObject = {
      signatures: sortedSignatures,
      message: params.message,
      owner: params.owner,
      safe: params.safe,
      targetChainId: String(params.targetChainId),
    }

    const signerCount = requiredSigners.value.find(i => i.chainId == params.targetChainId)?.signerCount || 1

    if (signerCount > 1) {
      const executionSignature = await signExecutionData(params, sortedSignatures)

      console.log(executionSignature)

      Object.assign(signatureObject, {
        executionSignature,
      })
    }

    console.log(params)

    const transactionHash = await avoProvider.send('txn_broadcast', [signatureObject])

    executedTransactions.value.push(params.proposalId)

    return transactionHash
  }

  async function generateMultisigSignatureMessage({ chainId, actions, nonce, metadata, options = {} }: IGenerateMultisigSignatureParams) {
    actions = actions.map((action) => {
      return {
        operation: action.operation ? String(action.operation) : '0',
        target: action?.target || action.to,
        data: action.data || '0x',
        value: action.value || '0',
      }
    }) as any

    const verifyingContract = selectedSafe.value?.safe_address!

    const latestAvosafeNonce = await getLatestAvosafeNonce(chainId)

    const avoSafeNonce = !isUndefined(nonce) ? nonce : latestAvosafeNonce

    const params = {
      actions,
      id: 0,
      avoSafeNonce,
      salt: ethers.utils.defaultAbiCoder.encode(['uint256'], [Date.now()]),
      source: verifyingContract,
      metadata: metadata || '0x00',
      ...options,
    }

    const forwardParams = {
      gas: '0',
      gasPrice: '0',
      validUntil: '0',
      validAfter: '0',
    }

    return {
      params,
      forwardParams,
    } as any
  }

  async function createProposalOrSignDirecty(args: IGenerateMultisigSignatureParams) {
    const { chainId, actions, nonce, metadata, clearModals = true, estimatedFee = false, rejection, rejectionId, transactionType = 'others' } = args

    const { success, payload } = await openEditNonceModal({ chainId, actions, defaultNonce: nonce, estimatedFee, rejection, rejectionId, transactionType })

    const actualNonce = !isUndefined(nonce) ? nonce : payload?.nonce

    if (!success)
      throw new Error('Transaction canceled')

    const signOnly = payload.signOnly

    const params = await generateMultisigSignatureAndSign({ chainId, actions, nonce: actualNonce, note: payload.note, metadata })

    // generate proposal
    const { data } = await axios.post<IMultisigTransaction>(`/safes/${selectedSafe.value?.safe_address}/transactions`, {
      chain_id: String(chainId),
      status: 'pending',
      signer: params?.signatureParams,
      data: params?.castParams,
      note: payload.note,
      nonce,
    }, {
      baseURL: multisigURL,
    })

    if (data.confirmations_required === 1 && !signOnly) {
      const txHash = await multisigBroadcast({
        proposalId: data.id,
        confirmations: data.confirmations,
        message: data.data,
        owner: selectedSafe.value?.owner_address!,
        safe: selectedSafe.value?.safe_address!,
        targetChainId: chainId,
      })

      return txHash
    }
    else {
      // handle multisig flow
      if (clearModals)
        clearAllModals()

      openReviewMultisigTransaction(data.id, rejection)
    }
  }

  async function signExecutionData(params: IMultisigBroadcastParams, sortedSignatures: any[]) {
    if (!signer.value)
      throw new Error('Safe not initialized')

    let name
    let version

    const types = {
      Cast: [
        { name: 'params', type: 'CastParams' },
        { name: 'forwardParams', type: 'CastForwardParams' },
        { name: 'signatures', type: 'SignatureParams[]' },
      ],
      CastParams: [
        { name: 'actions', type: 'Action[]' },
        { name: 'id', type: 'uint256' },
        { name: 'avoSafeNonce', type: 'int256' },
        { name: 'salt', type: 'bytes32' },
        { name: 'source', type: 'address' },
        { name: 'metadata', type: 'bytes' },
      ],
      Action: [
        { name: 'target', type: 'address' },
        { name: 'data', type: 'bytes' },
        { name: 'value', type: 'uint256' },
        { name: 'operation', type: 'uint256' },
      ],
      CastForwardParams: [
        { name: 'gas', type: 'uint256' },
        { name: 'gasPrice', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validUntil', type: 'uint256' },
      ],
      SignatureParams: [
        { name: 'signature', type: 'bytes' },
        { name: 'signer', type: 'address' },
      ],
    }

    const provider = getRpcProvider(params.targetChainId)

    const wallet = GaslessWallet__factory.connect(
      safeAddress.value,
      provider,
    )

    try {
      version = await wallet.DOMAIN_SEPARATOR_VERSION()
      name = await wallet.DOMAIN_SEPARATOR_NAME()
    }
    catch (error) {
      version = await forwarderProxyContract.avoWalletVersion('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')
      name = await forwarderProxyContract.avoWalletVersionName('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')
    }

    const domain = {
      name,
      version,
      chainId: String(avoChainId),
      salt: ethers.utils.solidityKeccak256(['uint256'], [params.targetChainId]),
      verifyingContract: selectedSafe.value?.safe_address,
    }

    const value = {
      params: params.message.params,
      forwardParams: params.message.forwardParams,
      signatures: sortedSignatures,
    }

    return signer.value._signTypedData(domain, types, value)
  }

  async function signMultisigData({ chainId, data }: any) {
    await switchToAvocadoNetwork()
    const providerWithSigner = library.value

    await providerWithSigner.send('eth_requestAccounts', [])
    const avoSigner = providerWithSigner.getSigner()

    const contract = AvoMultisigImplementation__factory.connect(safeAddress.value, getRpcProvider(chainId))

    const [domainSeparatorName, domainSeparatorVersion] = await Promise.all([
      contract.DOMAIN_SEPARATOR_NAME().catch(() => 'Avocado-Multisig'),
      contract.DOMAIN_SEPARATOR_VERSION().catch(() => '3.0.0'),
    ])

    console.log(domainSeparatorName, domainSeparatorVersion)

    const verifyingContract = selectedSafe.value?.safe_address!

    const domain = {
      name: domainSeparatorName,
      version: domainSeparatorVersion,
      chainId: avoChainId,
      verifyingContract,
      salt: ethers.utils.solidityKeccak256(['uint256'], [chainId]),
    }

    // The named list of all type definitions
    const types = {
      Cast: [
        { name: 'params', type: 'CastParams' },
        { name: 'forwardParams', type: 'CastForwardParams' },
      ],
      CastParams: [
        { name: 'actions', type: 'Action[]' },
        { name: 'id', type: 'uint256' },
        { name: 'avoSafeNonce', type: 'int256' },
        { name: 'salt', type: 'bytes32' },
        { name: 'source', type: 'address' },
        { name: 'metadata', type: 'bytes' },
      ],
      Action: [
        { name: 'target', type: 'address' },
        { name: 'data', type: 'bytes' },
        { name: 'value', type: 'uint256' },
        { name: 'operation', type: 'uint256' },
      ],
      CastForwardParams: [
        { name: 'gas', type: 'uint256' },
        { name: 'gasPrice', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validUntil', type: 'uint256' },
      ],
    }

    return avoSigner._signTypedData(domain, types, data)
  }

  async function rejectMultisigTransaction(tx: IMultisigTransaction) {
    const avoMultsigInterface = AvoMultisigImplementation__factory.createInterface()
    const isNonseq = tx.nonce == '-1'

    const metadata = encodeRejectionMetadata(tx.id)

    const actions = isNonseq
      ? [
          {
            to: tx.safe_address,
            data: avoMultsigInterface.encodeFunctionData('occupyNonSequentialNonces', [[tx.id]]),
            value: '0',
            operation: '0',
          },
        ]
      : [{
          to: tx.safe_address,
          data: '0x',
          value: '0',
          operation: '0',
        }]

    return createProposalOrSignDirecty({
      chainId: tx.chain_id,
      nonce: Number(tx.nonce),
      actions,
      metadata,
      estimatedFee: true,
      rejection: true,
      rejectionId: tx.id,
    })
  }

  async function getCurrentNonce(chainId: number | string, ownerAddress: string) {
    const underlyingProvider = new ethers.providers.JsonRpcProvider(getRpcURLByChainId(chainId))
    const forwarderProxyContract = Forwarder__factory.connect(
      forwarderProxyAddress,
      underlyingProvider,
    )

    const currentNonce = (await forwarderProxyContract.avoSafeNonceMultisig(ownerAddress)).toNumber()

    return currentNonce
  }

  async function addSignersWithThreshold(addresses: ISignerAddress[], threshold: string, chainId: number | string) {
    const avoMultsigInterface = AvoMultisigImplementation__factory.createInterface()

    const currentThreshold = requiredSigners.value.find(i => i.chainId == chainId)?.requiredSignerCount

    const signers = addresses.map(address => address.address)

    const sortedSigners = signers.sort((left, right) =>
      left.toLowerCase().localeCompare(right.toLowerCase()),
    )

    const metadata = threshold
      ? encodeMultipleActions(
        encodeAddSignersMetadata(sortedSigners, false),
        encodeChangeThresholdMetadata(threshold, false),
      )
      : encodeAddSignersMetadata(sortedSigners)

    const actions = [
      {
        target: selectedSafe.value?.safe_address,
        data: avoMultsigInterface.encodeFunctionData('addSigners', [sortedSigners]),
        value: '0',
        operation: '0',
      },
    ] as any[]

    if (threshold && currentThreshold) {
      const isThresholdIncreased = toBN(threshold).gt(currentThreshold)

      const action = {
        target: selectedSafe.value?.safe_address,
        data: avoMultsigInterface.encodeFunctionData('setRequiredSigners', [threshold]),
        value: '0',
        operation: '0',
      }

      if (isThresholdIncreased)
        actions.push(action)

      else
        actions.unshift(action)
    }

    return createProposalOrSignDirecty({ chainId, actions, clearModals: false, estimatedFee: true, metadata, transactionType: 'add-signers' })
  }

  async function changeThreshold(threshold: string, chainId: string | number) {
    const metadata = encodeChangeThresholdMetadata(threshold)

    const avoMultsigInterface = AvoMultisigImplementation__factory.createInterface()
    const actions = [
      {
        target: selectedSafe.value?.safe_address,
        data: avoMultsigInterface.encodeFunctionData('setRequiredSigners', [threshold]),
        value: '0',
        operation: '0',
      },
    ] as any[]

    return createProposalOrSignDirecty({ chainId, actions, estimatedFee: true, metadata })
  }

  async function removeSignerWithThreshold(addresses: string[], chainId: number | string, threshold: number) {
    const avoMultsigInterface = AvoMultisigImplementation__factory.createInterface()

    const currentThreshold = requiredSigners.value.find(i => i.chainId == chainId)?.requiredSignerCount

    const sortedAddress = addresses.sort((left, right) =>
      left.toLowerCase().localeCompare(right.toLowerCase()),
    )

    const metadata = encodeRemoveSignersMetadata(sortedAddress)

    const actions: any[] = [
      {
        target: selectedSafe.value?.safe_address,
        data: avoMultsigInterface.encodeFunctionData('removeSigners', [sortedAddress]),
        value: '0',
        operation: '0',
      },
    ]

    if (threshold && currentThreshold) {
      const isThresholdIncreased = toBN(threshold).gt(currentThreshold)

      const action = {
        target: selectedSafe.value?.safe_address,
        data: avoMultsigInterface.encodeFunctionData('setRequiredSigners', [threshold]),
        value: '0',
        operation: '0',
      }

      if (isThresholdIncreased)
        actions.push(action)

      else
        actions.unshift(action)
    }

    return createProposalOrSignDirecty({ chainId, actions, clearModals: false, estimatedFee: true, metadata, transactionType: 'remove-signers' })
  }

  const getLatestAvosafeNonce = async (chainId: string | number) => {
    if (!selectedSafe.value?.owner_address)
      return

    const currentNonce = await getCurrentNonce(chainId, selectedSafe.value?.owner_address)

    const { data } = await axios.get<IMultisigTransactionResponse>(`/safes/${selectedSafe.value?.safe_address}/transactions`, {
      params: {
        status: 'pending',
        chain_id: chainId,
      },
      baseURL: multisigURL,
    })

    const maxNonce = Math.max(...data.data.map(i => Number(i.nonce)))

    return Math.max(maxNonce, currentNonce - 1) + 1
  }

  function getActualId(tx: any[]) {
    const isDelegateCall = tx.some(i => i?.operation == '1')

    return isSafeMultisig.value && isDelegateCall ? '1' : undefined
  }

  function checkTransactionExecuted(tx: IMultisigTransaction) {
    return executedTransactions.value.some(i => i == tx.id) || tx.executed_at !== null
  }

  return {
    safe,
    signer,
    tokenBalances,
    totalEoaBalance,
    eoaBalances,
    totalBalance,
    account,
    safeAddress,
    sendTransaction,
    sendTransactions,
    isSafeAddress,
    fundedEoaNetworks,
    mainSafeAddress,
    signMultisigData,
    generateMultisigSignatureMessage,
    generateMultisigSignatureAndSign,
    multisigBroadcast,
    multiSigSafeAddress,
    createProposalOrSignDirecty,
    rejectMultisigTransaction,
    getCurrentNonce,
    addSignersWithThreshold,
    getLatestAvosafeNonce,
    removeSignerWithThreshold,
    changeThreshold,
    getActualId,
    executedTransactions,
    checkTransactionExecuted,
  }
}
