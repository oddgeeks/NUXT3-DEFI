import { isAddress } from '@ethersproject/address'
import { VoidSigner, ethers } from 'ethers'
import axios from 'axios'

import { isUndefined } from '@walletconnect/utils'
import { serialize } from 'error-serializer'
import {
  AvoMultisigImplementation__factory,
} from '@/contracts'

export function useAvocadoSafe() {
  const { public: config } = useRuntimeConfig()
  const { switchToAvocadoNetwork } = useNetworks()
  const { library, account, provider } = useWeb3()
  const { trackingAccount, isTrackingMode } = useAccountTrack()
  const { getRpcProviderByChainId } = useShared()
  const { avoProvider, getSafeOptions, refreshSelectedSafe, getFallbackSafeOptionsByChainId } = useSafe()
  const { selectedSafe, isSelectedSafeLegacy, safeOptions } = storeToRefs(useSafe())
  const { clearAllModals } = useModal()
  const dryRun = useCookie<boolean | undefined>('dry-run')

  const { isSafeMultisig } = storeToRefs(useMultisig())
  const { getRequiredSigner } = useMultisig()

  const { safeAddress, tokenBalances, totalBalance, totalEoaBalance, eoaBalances, fundedEoaNetworks, networkOrderedBySumTokens } = storeToRefs(useSafe())

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
          ? avocado.createSafe(library.value.getSigner().connectUnchecked())
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
    transactionType: TransactionActionType,
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

    if (isSelectedSafeLegacy.value) {
      const tx = await signer.value.sendTransaction(
        {
          ...transaction,
          chainId: Number(transaction.chainId),
        },
        { source: '0xE8385fB3A5F15dED06EB5E20E5A81BF43115eb8E', ...options },
      )

      return tx.hash!
    }
    else {
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
        transactionType,
        options,
        actions,
      })

      if (txHash)
        return txHash
    }
  }

  const sendTransactions = async (
    transactions: TransactionsAction[],
    chainId: number | string,
    options: { metadata?: string; id?: string } = {},
    transactionType: TransactionActionType,
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

    if (isSelectedSafeLegacy.value) {
      const tx = await signer.value.sendTransactions(
        transactions,
        Number(chainId),
        { source: '0xE8385fB3A5F15dED06EB5E20E5A81BF43115eb8E', ...options },
      )

      return tx.hash!
    }
    else {
      const txHash = await createProposalOrSignDirecty({ chainId, actions: transactions, metadata: options.metadata, options, transactionType })

      if (txHash)
        return txHash
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

  async function generateMultisigSignatureAndSign({ chainId, actions, nonce, metadata, options }: IGenerateMultisigSignatureParams) {
    const data = await generateMultisigSignatureMessage({ chainId, actions, nonce, metadata, options })
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

    if (!selectedSafe.value)
      throw new Error('Safe not initialized')

    const signatureObject = {
      signatures: sortedSignatures,
      message: params.message,
      owner: params.owner,
      safe: params.safe,
      targetChainId: String(params.targetChainId),
      index: String(selectedSafe.value?.multisig_index || 0),
    }

    if (selectedSafe.value.multisig_index > 0 || params.signers.length > 1) {
      try {
        const executionSignature = await signExecutionData(params, sortedSignatures)

        Object.assign(signatureObject, {
          executionSignature,
        })
      }
      catch (e) {
        console.log(e)
        throw new Error('Failed to sign execution data', {
          cause: 'sign-execution-data-failed',
        })
      }
    }

    if (dryRun.value) {
      Object.assign(signatureObject, {
        dryRun: true,
      })
    }

    const transactionHash = await avoProvider.send('txn_broadcast', [signatureObject])

    if (dryRun.value) {
      alert(`Dry run value: ${transactionHash}`)
      return
    }

    if (transactionHash && params.proposalId) {
      let message = generateSlackMessage(params.message.params.metadata, params.targetChainId)
      if (!message)
        message = `\n${'`Multisig Hash`'} <${config.domainURL}/multisig/${params.safe}/pending-transactions/${params.proposalId}| ${shortenHash(params.proposalId)}>`

      logActionToSlack({
        account: account.value,
        action: 'multisig',
        chainId: String(params.targetChainId),
        message,
        txHash: transactionHash,
        type: 'success',
      })
    }

    const executing = useCookie<boolean>(`executing-${params.proposalId}`, {
      // 2 mins expiry
      expires: new Date(Date.now() + 1000 * 60 * 2),
    })

    executing.value = true

    const provider = getRpcProviderByChainId(params.targetChainId)

    provider.waitForTransaction(transactionHash).then((tx) => {
      console.log(tx)
      setTimeout(async () => {
        await until(selectedSafe).toMatch(i => !!i)
        if (!selectedSafe.value)
          return

        refreshNuxtData(`${selectedSafe.value.safe_address}-signers`)
        refreshNuxtData(`${selectedSafe.value.safe_address}-${params.targetChainId}-threshold`)
        refreshSelectedSafe()
        getSafeOptions(selectedSafe.value)
      }, 5000)
    })

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

    const latestAvosafeNonce = await getLatestAvosafeNonce(chainId)

    const avoNonce = !isUndefined(nonce) ? nonce : latestAvosafeNonce

    const params = {
      actions,
      id: '0',
      avoNonce: String(avoNonce),
      salt: ethers.utils.defaultAbiCoder.encode(['uint256'], [Date.now()]),
      source: '0xE8385fB3A5F15dED06EB5E20E5A81BF43115eb8E',
      metadata: metadata || '0x00',
      ...options,
    }

    const forwardParams = {
      gas: '0',
      gasPrice: '0',
      validUntil: '0',
      validAfter: '0',
      value: '0',
    }

    return {
      params,
      forwardParams,
    } as any
  }

  async function createProposalOrSignDirecty(args: IGenerateMultisigSignatureParams) {
    const { chainId, actions, nonce, metadata, estimatedFee = false, rejection, rejectionId, options, transactionType = 'others', clearModals = true } = args

    const requiredSigner = await getRequiredSigner(selectedSafe.value?.safe_address!, chainId)

    if (isSafeEligableToSingleExecution(requiredSigner, selectedSafe.value)) {
      const params = await generateMultisigSignatureAndSign({ chainId, actions, metadata, options })

      const txHash = await multisigBroadcast({
        proposalId: '',
        confirmations: [{
          address: params.signatureParams.address,
          signature: params.signatureParams.signature,
          created_at: new Date().getTime(),
        }],
        signers: [params.signatureParams.address],
        message: params.castParams,
        owner: selectedSafe.value?.owner_address!,
        safe: selectedSafe.value?.safe_address!,
        targetChainId: chainId,
      })

      return txHash
    }

    const { success, payload } = await openEditNonceModal({ chainId, actions, defaultNonce: nonce, estimatedFee, rejection, rejectionId, transactionType, metadata, options })

    if (!success)
      throw new Error('Transaction cancelled')

    if (payload.txHash)
      return payload.txHash

    if (clearModals)
      clearAllModals()

    openReviewMultisigTransaction(payload.id, chainId, rejection)
  }

  async function signExecutionData(params: IMultisigBroadcastParams, sortedSignatures: any[]): Promise<string> {
    await switchToAvocadoNetwork()

    if (!signer.value)
      throw new Error('Safe not initialized')

    const config = await getFallbackSafeOptionsByChainId(selectedSafe.value!, params.targetChainId)

    if (!config)
      throw new Error('Config not found')

    const types = {
      Cast: [
        { name: 'params', type: 'CastParams' },
        { name: 'forwardParams', type: 'CastForwardParams' },
        { name: 'signatures', type: 'SignatureParams[]' },
      ],
      CastParams: [
        { name: 'actions', type: 'Action[]' },
        { name: 'id', type: 'uint256' },
        { name: 'avoNonce', type: 'int256' },
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
        { name: 'value', type: 'uint256' },
      ],
      SignatureParams: [
        { name: 'signature', type: 'bytes' },
        { name: 'signer', type: 'address' },
      ],
    }

    const domain = {
      name: config.domainName,
      version: config.latestVersion,
      chainId: String(avoChainId),
      salt: ethers.utils.solidityKeccak256(['uint256'], [params.targetChainId]),
      verifyingContract: selectedSafe.value?.safe_address,
    }

    console.log(domain)

    const value = {
      params: params.message.params,
      forwardParams: params.message.forwardParams,
      signatures: sortedSignatures,
    }

    const { signature, cancelled } = await signTypedData(provider.value, account.value, {
      domain,
      types,
      value,
    })

    if (cancelled)
      throw new Error('Signature cancelled')

    if (!signature)
      throw new Error('Failed to get signature')

    console.log({ domain, types, value, account: account.value, signature })

    return signature
  }

  async function signMultisigData({ chainId, data }: any): Promise<string> {
    await switchToAvocadoNetwork()

    const config = await getFallbackSafeOptionsByChainId(selectedSafe.value!, chainId)

    if (!config)
      throw new Error('Config not found')

    const verifyingContract = selectedSafe.value?.safe_address!

    const domain = {
      name: config?.domainName,
      version: config?.latestVersion,
      chainId: avoChainId,
      verifyingContract,
      salt: ethers.utils.solidityKeccak256(['uint256'], [chainId]),
    }

    console.log({ domain })

    // The named list of all type definitions
    const types = {
      Cast: [
        { name: 'params', type: 'CastParams' },
        { name: 'forwardParams', type: 'CastForwardParams' },
      ],
      CastParams: [
        { name: 'actions', type: 'Action[]' },
        { name: 'id', type: 'uint256' },
        { name: 'avoNonce', type: 'int256' },
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
        { name: 'value', type: 'uint256' },
      ],
    }

    const { signature, cancelled } = await signTypedData(provider.value, account.value, {
      domain,
      types,
      value: data,
    })

    if (cancelled)
      throw new Error('Signature cancelled')

    if (!signature)
      throw new Error('Failed to get signature')

    console.log({ domain, types, value: data, account: account.value, signature })

    return signature
  }

  async function rejectMultisigTransaction(tx: IMultisigTransaction) {
    const avoMultsigInterface = AvoMultisigImplementation__factory.createInterface()
    const isNonseq = tx.nonce == '-1'

    const metadata = encodeRejectionMetadata(tx.id)

    const params = isNonseq
      ? {
          rejection_id: tx.id,
          status: 'pending',
          chain_id: tx.chain_id,
        }
      : {
          nonce: tx.nonce,
          status: 'pending',
          chain_id: tx.chain_id,
        }

    const { data } = await axios.get<IMultisigTransactionResponse>(`/safes/${tx.safe_address}/transactions`, {
      params,
      baseURL: multisigURL,
    })

    const isRejectionAlreadyExist = isNonseq ? data.meta.total > 0 : data.meta.total > 1

    if (isRejectionAlreadyExist)
      throw new Error('A rejection proposal for this txn already exists')

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

  async function getCurrentNonce(chainId: number | string) {
    try {
      const config = await getFallbackSafeOptionsByChainId(selectedSafe.value!, chainId)

      return config.nonce
    }
    catch (error) {
      console.log(error, 'Error while fetching nonce')
      return 0
    }
  }

  async function addSignersWithThreshold(addresses: ISignerAddress[], threshold: string, chainId: number | string) {
    const avoMultisigInstance = AvoMultisigImplementation__factory.connect(selectedSafe.value?.safe_address!, getRpcProviderByChainId(chainId))

    const currentThreshold = safeOptions.value.find(i => i.chainId == chainId)?.threshold || 1
    const actualThreshold = threshold || currentThreshold

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
        data: (await avoMultisigInstance.populateTransaction.addSigners(sortedSigners, actualThreshold)).data,
        value: '0',
        operation: '0',
      },
    ] as any[]

    return createProposalOrSignDirecty({ chainId, actions, estimatedFee: true, metadata, clearModals: false, transactionType: 'add-signers' })
  }

  async function changeThreshold(threshold: string, chainId: string | number) {
    const metadata = encodeChangeThresholdMetadata(threshold)

    const avoMultisigInstance = AvoMultisigImplementation__factory.connect(selectedSafe.value?.safe_address!, getRpcProviderByChainId(chainId))

    const actions = [
      {
        target: selectedSafe.value?.safe_address,
        data: (await avoMultisigInstance.populateTransaction.setRequiredSigners(threshold))?.data,
        value: '0',
        operation: '0',
      },
    ] as any[]

    return createProposalOrSignDirecty({ chainId, actions, estimatedFee: true, metadata })
  }

  async function removeSignerWithThreshold(addresses: string[], chainId: number | string, threshold: number) {
    const avoMultisigInstance = AvoMultisigImplementation__factory.connect(selectedSafe.value?.safe_address!, getRpcProviderByChainId(chainId))

    const currentThreshold = safeOptions.value.find(i => i.chainId == chainId)?.threshold || 1
    const actualThreshold = threshold || currentThreshold

    const sortedAddress = addresses.sort((left, right) =>
      left.toLowerCase().localeCompare(right.toLowerCase()),
    )

    const metadata = encodeRemoveSignersMetadata(sortedAddress)

    const actions: any[] = [
      {
        target: selectedSafe.value?.safe_address,
        data: (await avoMultisigInstance.populateTransaction.removeSigners(sortedAddress, actualThreshold)).data,
        value: '0',
        operation: '0',
      },
    ]

    return createProposalOrSignDirecty({ chainId, actions, estimatedFee: true, metadata, clearModals: false, transactionType: 'remove-signers' })
  }

  const getLatestAvosafeNonce = async (chainId: string | number) => {
    try {
      const currentNonce = await getCurrentNonce(chainId)

      console.log({ nonce: currentNonce, safe: selectedSafe.value })

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
    catch (e) {
      const parsed = serialize(e)

      logActionToSlack({
        account: account.value,
        action: 'fetch-nonce',
        message: `Failed to fetch nonce for chainId: ${chainId}
${parsed.message}`,
      })
      return 0
    }
  }

  function getActualId(tx: any[], defaultId = 0) {
    const isDelegateCall = tx.some(i => i?.operation == '1')

    return isSafeMultisig.value && isDelegateCall ? '1' : defaultId
  }

  function checkTransactionExecuted(tx: IMultisigTransaction) {
    return tx.executed_at !== null
  }

  function isSafeEligableToSingleExecution(requiredSigner: number, safe?: ISafe) {
    return safe && safe.multisig_index === 0 && requiredSigner === 1
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
    signMultisigData,
    generateMultisigSignatureMessage,
    generateMultisigSignatureAndSign,
    multisigBroadcast,
    createProposalOrSignDirecty,
    rejectMultisigTransaction,
    getCurrentNonce,
    addSignersWithThreshold,
    getLatestAvosafeNonce,
    removeSignerWithThreshold,
    changeThreshold,
    getActualId,
    checkTransactionExecuted,
    networkOrderedBySumTokens,
  }
}
