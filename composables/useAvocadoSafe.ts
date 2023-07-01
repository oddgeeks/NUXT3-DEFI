import { storeToRefs } from 'pinia'
import { isAddress } from '@ethersproject/address'
import { VoidSigner, ethers } from 'ethers'
import axios from 'axios'

import { isUndefined } from '@walletconnect/utils'
import {
  AvoMultisigImplementation__factory,
  Forwarder__factory,
} from '@/contracts'

export function useAvocadoSafe() {
  const { switchToAvocadoNetwork } = useNetworks()
  const { library, account } = useWeb3()
  const { trackingAccount, isTrackingMode } = useAccountTrack()
  const { avoProvider } = useSafe()
  const { clearAllModals } = useModal()

  const { selectedSafe, isSafeMultisig } = storeToRefs(useAuthorities())

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
      const data = await openEditNonceModal(transaction.chainId)

      if (!data.success)
        throw new Error('Transaction canceled')

      const payload = data?.payload

      const txHash = await createProposalOrSignDirecty({
        chainId: transaction.chainId,
        metadata: options.metadata,
        nonce: payload?.nonce,
        note: payload?.note,
        actions: [
          {
            to: transaction.to,
            value: transaction.value,
            data: transaction.data,
            operation: transaction.operation,
          },
        ],
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
      const data = await openEditNonceModal(chainId)

      if (!data.success)
        throw new Error('Transaction canceled')

      const payload = data?.payload

      const txHash = await createProposalOrSignDirecty({ chainId, actions: transactions, metadata: options.metadata, nonce: payload?.nonce, note: payload?.note })

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

    console.log({
      signatures: sortedSignatures,
      message: params.message,
      owner: params.owner,
      safe: params.safe,
      targetChainId: String(params.targetChainId),
    })

    const transactionHash = await avoProvider.send('txn_broadcast', [{
      signatures: sortedSignatures,
      message: params.message,
      owner: params.owner,
      safe: params.safe,
      targetChainId: String(params.targetChainId),
    }])

    return transactionHash
  }

  async function generateMultisigSignatureMessage({ chainId, actions, nonce, metadata }: IGenerateMultisigSignatureParams) {
    actions = actions.map((action) => {
      return {
        operation: action.operation || '0',
        target: action?.target || action.to,
        data: action.data || '0x',
        value: action.value || '0',
      }
    }) as any

    const verifyingContract = selectedSafe.value?.safe_address!

    const latestAvosafeNonce = await getLatestAvosafeNonce(chainId)

    console.log({ latestAvosafeNonce })

    const avoSafeNonce = !isUndefined(nonce) ? nonce : latestAvosafeNonce

    const params = {
      actions,
      id: 0,
      avoSafeNonce,
      salt: ethers.utils.defaultAbiCoder.encode(['uint256'], [Date.now()]),
      source: verifyingContract,
      metadata: metadata || '0x00',
    }

    const forwardParams = {
      gas: '500000',
      gasPrice: '0',
      validUntil: '0',
      validAfter: '0',
    }

    return {
      params,
      forwardParams,
    } as any
  }

  async function createProposalOrSignDirecty({ chainId, actions, nonce, metadata, note }: IGenerateMultisigSignatureParams) {
    const params = await generateMultisigSignatureAndSign({ chainId, actions, nonce, metadata })

    // generate proposal
    const { data } = await axios.post<IMultisigTransaction>(`/safes/${selectedSafe.value?.safe_address}/transactions`, {
      chain_id: String(chainId),
      status: 'pending',
      signer: params?.signatureParams,
      data: params?.castParams,
      note,
      nonce,
    }, {
      baseURL: multisigURL,
    })

    if (data.confirmations_required === 1) {
      const txHash = await multisigBroadcast({
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
      clearAllModals()
      openReviewMultisigTransaction(data.id)
    }
  }

  async function signMultisigData({ chainId, data }: any) {
    await switchToAvocadoNetwork()
    const providerWithSigner = library.value

    await providerWithSigner.send('eth_requestAccounts', [])
    const avoSigner = providerWithSigner.getSigner()

    const domainSeparatorName = 'Avocado-Safe-Multisig'
    const domainSeparatorVersion = '3.0.0'

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
    })
  }

  async function getCurrentNonce(chainId: number | string) {
    const underlyingProvider = new ethers.providers.JsonRpcProvider(getRpcURLByChainId(chainId))
    const forwarderProxyContract = Forwarder__factory.connect(
      forwarderProxyAddress,
      underlyingProvider,
    )

    const currentNonce = (await forwarderProxyContract.avoSafeNonceMultisig(selectedSafe.value?.owner_address!)).toNumber()

    return currentNonce
  }

  async function addSignersWithThreshold(addresses: string[], threshold: string, chainId: number | string) {
    const avoMultsigInterface = AvoMultisigImplementation__factory.createInterface()

    const actions = [
      {
        target: selectedSafe.value?.safe_address,
        data: avoMultsigInterface.encodeFunctionData('addSigners', [addresses]),
        value: '0',
        operation: '0',
      },
      {
        target: selectedSafe.value?.safe_address,
        data: avoMultsigInterface.encodeFunctionData('setRequiredSigners', [threshold]),
        value: '0',
        operation: '0',
      },
    ]

    return createProposalOrSignDirecty({ chainId, actions } as any)
  }

  const getLatestAvosafeNonce = async (chainId: string | number) => {
    const currentNonce = await getCurrentNonce(chainId)

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
  }
}
