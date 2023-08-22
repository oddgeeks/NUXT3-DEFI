import { isAddress } from '@ethersproject/address'
import { VoidSigner, ethers } from 'ethers'
import axios from 'axios'

import { isUndefined } from '@walletconnect/utils'
import { GaslessWallet__factory } from '@instadapp/avocado-base/contracts'
import {
  AvoMultisigImplementation__factory,
  MultisigForwarder__factory,
} from '@/contracts'

const executedTransactions = ref<string[]>([])

export function useAvocadoSafe() {
  const { switchToAvocadoNetwork } = useNetworks()
  const { library, account } = useWeb3()
  const { trackingAccount, isTrackingMode } = useAccountTrack()
  const { getRpcProviderByChainId } = useShared()
  const { avoProvider } = useSafe()
  const { selectedSafe, isSelectedSafeLegacy } = storeToRefs(useSafe())
  const { multisigForwarderProxyContract } = useSafe()
  const { clearAllModals } = useModal()

  const { isSafeMultisig, requiredSigners } = storeToRefs(useMultisig())
  const { getRequiredSigner } = useMultisig()

  // check if we have a cached safe address
  const { safeAddress, mainSafeAddress, tokenBalances, totalBalance, totalEoaBalance, eoaBalances, fundedEoaNetworks } = storeToRefs(useSafe())

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
        options,
        actions,
      })

      if (txHash)
        return txHash
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

    if (isSelectedSafeLegacy.value) {
      const tx = await signer.value.sendTransactions(
        transactions,
        Number(chainId),
        { source: '0xE8385fB3A5F15dED06EB5E20E5A81BF43115eb8E', ...options },
      )

      return tx.hash!
    }
    else {
      const txHash = await createProposalOrSignDirecty({ chainId, actions: transactions, metadata: options.metadata, options })

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

    if (!signer.value)
      throw new Error('Safe not initialized')

    const signatureObject = {
      signatures: sortedSignatures,
      message: params.message,
      owner: params.owner,
      safe: params.safe,
      targetChainId: String(params.targetChainId),
      index: String(selectedSafe.value?.multisig_index || 0),
    }

    const signerCount = await getRequiredSigner(selectedSafe.value?.safe_address!, params.targetChainId) || 1

    if (signerCount > 1) {
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

    console.log(params)

    const transactionHash = await avoProvider.send('txn_broadcast', [signatureObject])

    if (transactionHash) {
      setTimeout(() => {
        avoProvider.send('api_getTransactionByHash', [
          transactionHash,
        ]).then((tx: IAvocadoTransaction) => {
          const hash = params.proposalId || tx.metadata.multisig_hash

          if (!hash)
            return

          // @todo: change URL later on
          const message = `\n${'`Multisig Hash`'} <https://avocado-git-f-multisafe-instadapp-eng.vercel.app/multisig/${params.safe}/pending-transactions/${hash}| ${shortenHash(hash)}>`

          logActionToSlack({
            account: account.value,
            action: 'multisig',
            chainId: String(params.targetChainId),
            message,
            txHash: transactionHash,
            type: 'success',
          })
        })
      }, 5000)
    }

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

    console.log({ latestAvosafeNonce })

    const avoNonce = !isUndefined(nonce) ? nonce : latestAvosafeNonce

    const params = {
      actions,
      id: 0,
      avoNonce,
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
      value: '0',
    }

    return {
      params,
      forwardParams,
    } as any
  }

  async function createProposalOrSignDirecty(args: IGenerateMultisigSignatureParams) {
    const { chainId, actions, nonce, metadata, estimatedFee = false, rejection, rejectionId, options, transactionType = 'others' } = args

    const requiredSigner = await getRequiredSigner(selectedSafe.value?.safe_address!, chainId)

    if (selectedSafe.value && selectedSafe.value.multisig_index === 0 && requiredSigner === 1) {
      const params = await generateMultisigSignatureAndSign({ chainId, actions, metadata, options })

      const txHash = await multisigBroadcast({
        proposalId: '',
        confirmations: [{
          address: params.signatureParams.address,
          signature: params.signatureParams.signature,
          created_at: new Date().getTime(),
        }],
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

    clearAllModals()

    openReviewMultisigTransaction(payload.id, rejection)
  }

  async function signExecutionData(params: IMultisigBroadcastParams, sortedSignatures: any[]) {
    if (!signer.value)
      throw new Error('Safe not initialized')

    const networkMultisigForwarderProxy = MultisigForwarder__factory.connect(
      multisigForwarderProxyAddress,
      getRpcProviderByChainId(params.targetChainId),
    )

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

    const provider = getRpcProviderByChainId(params.targetChainId)

    const wallet = GaslessWallet__factory.connect(
      safeAddress.value,
      provider,
    )

    try {
      version = await wallet.DOMAIN_SEPARATOR_VERSION()
      name = await wallet.DOMAIN_SEPARATOR_NAME()
    }
    catch (error) {
      version = await networkMultisigForwarderProxy.avocadoVersion('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', selectedSafe.value?.multisig_index || 0)
      name = await networkMultisigForwarderProxy.avocadoVersionName('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', selectedSafe.value?.multisig_index || 0)
    }

    const domain = {
      name,
      version,
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

    console.log({ domain, types, value })

    return signer.value._signTypedData(domain, types, value)
  }

  async function signMultisigData({ chainId, data }: any) {
    await switchToAvocadoNetwork()

    const avoSigner = library.value.getSigner()

    const contract = AvoMultisigImplementation__factory.connect(safeAddress.value, getRpcProviderByChainId(chainId))

    const networkMultisigForwarderProxy = MultisigForwarder__factory.connect(
      multisigForwarderProxyAddress,
      getRpcProviderByChainId(chainId),
    )

    let domainSeparatorName: string
    let domainSeparatorVersion: string

    try {
      [domainSeparatorName, domainSeparatorVersion] = await Promise.all([
        contract.DOMAIN_SEPARATOR_NAME(),
        contract.DOMAIN_SEPARATOR_VERSION(),
      ])
    }
    catch (error) {
      [domainSeparatorName, domainSeparatorVersion] = await Promise.all([
        networkMultisigForwarderProxy.avocadoVersionName(
          '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          selectedSafe.value?.multisig_index || 0,
        ),
        networkMultisigForwarderProxy.avocadoVersion(
          '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          selectedSafe.value?.multisig_index || 0,
        ),
      ])
    }

    const verifyingContract = selectedSafe.value?.safe_address!

    const domain = {
      name: domainSeparatorName,
      version: domainSeparatorVersion,
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

    console.log({ domain, types, data })

    return avoSigner._signTypedData(domain, types, data)
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

  async function getCurrentNonce(chainId: number | string, ownerAddress: string, multisafeIndex = 0) {
    try {
      const underlyingProvider = new ethers.providers.JsonRpcProvider(getRpcURLByChainId(chainId))
      const multisigForwarderProxyContract = MultisigForwarder__factory.connect(
        multisigForwarderProxyAddress,
        underlyingProvider,
      )

      const currentNonce = (await multisigForwarderProxyContract.avoNonce(ownerAddress, multisafeIndex)).toNumber()

      console.log({
        currentNonce,
      })

      return currentNonce
    }
    catch (error) {
      return 0
    }
  }

  async function addSignersWithThreshold(addresses: ISignerAddress[], threshold: string, chainId: number | string) {
    const avoMultisigInstance = AvoMultisigImplementation__factory.connect(selectedSafe.value?.safe_address!, getRpcProviderByChainId(chainId))

    const currentThreshold = requiredSigners.value.find(i => i.chainId == chainId)?.requiredSignerCount || 1
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

    return createProposalOrSignDirecty({ chainId, actions, estimatedFee: true, metadata, transactionType: 'add-signers' })
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

    const currentThreshold = requiredSigners.value.find(i => i.chainId == chainId)?.requiredSignerCount || 1
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

    return createProposalOrSignDirecty({ chainId, actions, estimatedFee: true, metadata, transactionType: 'remove-signers' })
  }

  const getLatestAvosafeNonce = async (chainId: string | number) => {
    if (!selectedSafe.value?.owner_address)
      return

    const currentNonce = await getCurrentNonce(chainId, selectedSafe.value?.owner_address, selectedSafe.value.multisig_index)

    console.log({ currentNonce, owner: selectedSafe.value?.owner_address, index: selectedSafe.value.multisig_index })

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

  function getActualId(tx: any[], defaultId = 0) {
    const isDelegateCall = tx.some(i => i?.operation == '1')

    return isSafeMultisig.value && isDelegateCall ? '1' : defaultId
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
