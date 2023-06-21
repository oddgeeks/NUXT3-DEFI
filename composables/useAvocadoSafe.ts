import { storeToRefs } from 'pinia'
import { isAddress } from '@ethersproject/address'
import { VoidSigner, ethers } from 'ethers'
import axios from 'axios'
import {
  AvoMultisigImplementation__factory,
} from '~/contracts'
import {
  Forwarder__factory,
} from '@/contracts'

export function useAvocadoSafe() {
  const { switchToAvocadoNetwork } = useNetworks()
  const { library, account, provider } = useWeb3()
  const { trackingAccount, isTrackingMode } = useAccountTrack()
  const { avoProvider } = useSafe()

  const { selectedSafe, isSafeMultisig } = storeToRefs(useAuthorities())

  // check if we have a cached safe address
  const { safeAddress, mainSafeAddress, tokenBalances, totalBalance, totalEoaBalance, eoaBalances, fundedEoaNetworks } = storeToRefs(useSafe())

  const safe = shallowRef<ReturnType<typeof avocado.createSafe>>()
  const signer = computed(() => (safe.value ? safe.value.getSigner() : null))

  watch(
    [library, account, isTrackingMode, selectedSafe],
    () => {
      if (isTrackingMode.value) {
        const voidSigner = new VoidSigner(trackingAccount.value, avoProvider)
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

    const tx = await signer.value.sendTransaction(
      {
        ...transaction,
        chainId: Number(transaction.chainId),
      },
      { source: '0xE8385fB3A5F15dED06EB5E20E5A81BF43115eb8E', ...options },
    )

    return tx.hash!
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
      const params = await generateMultisigSignature({ chainId, actions: transactions })

      // generate proposal
      const { data } = await axios.post<IMultisigTransaction>(`/safes/${selectedSafe.value?.safe_address}/transactions`, {
        chain_id: String(chainId),
        status: 'pending',
        nonce: String(params?.nonce),
        signer: params?.signatureParams,
        data: params?.castParams,
      }, {
        baseURL: multisigURL,
      })

      if (data.confirmations_required === 1) {
        const txHash = await multisigBroadcast({
          confirmations: data.confirmations,
          message: data.data,
          owner: account.value,
          safe: selectedSafe.value?.safe_address!,
          targetChainId: chainId,
        })

        return txHash
      }
      else {
        // handle multisig flow
      }
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

  async function generateMultisigSignature({ chainId, actions }: any) {
    const providerWithSigner = library.value
    const underlyingProvider = new ethers.providers.JsonRpcProvider(getRpcURLByChainId(chainId))

    actions = actions.map((action: any) => {
      return {
        operation: action.operation || '0',
        target: action.to,
        data: action.data || '0x',
        value: action.value || '0',
      }
    })

    await providerWithSigner.send('eth_requestAccounts', [])
    const avoSigner = providerWithSigner.getSigner()

    const forwarderProxyContract = Forwarder__factory.connect(
      forwarderProxyAddress,
      underlyingProvider,
    )

    const domainSeparatorName = 'Avocado-Safe-Multisig'
    const domainSeparatorVersion = '3.0.0'

    const verifyingContract = selectedSafe.value?.safe_address!

    const avoMultsigInstance = AvoMultisigImplementation__factory.connect(verifyingContract, underlyingProvider)

    let nonce
    try {
      nonce = (await avoMultsigInstance.avoSafeNonce()).toNumber()
    }
    catch {
      nonce = 0
    }

    console.log(nonce)

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

    const params = {
      actions,
      id: 0,
      avoSafeNonce: nonce,
      salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
      source: verifyingContract,
      metadata: '0x00',

    }

    const forwardParams = {
      gas: '80000',
      gasPrice: '0',
      validUntil: '0',
      validAfter: '0',
    }

    const castParams = {
      params,
      forwardParams,
    }

    const signature = await avoSigner._signTypedData(domain, types, castParams)

    const signatureParams = [{
      signature,
      signer: account.value,
    }]

    try {
      const forwarderVerification = await forwarderProxyContract.callStatic.verifyMultisigV3(
        account.value,
        castParams.params,
        castParams.forwardParams,
        signatureParams,
      )

      if (forwarderVerification) {
        return {
          signatureParams: {
            signature,
            address: account.value,
          },
          castParams,
          nonce,
        }
      }
    }
    catch (err) {
      console.log(err)
    }
  }

  const multisigBroadcast = async (params: IMultisigBroadcastParams) => {
    const sortedSignatures = params.confirmations.sort((left, right) =>
      left.address.toLowerCase().localeCompare(right.address.toLowerCase()),
    ).map((i) => {
      return {
        signature: i.signature,
        signer: i.address,
      }
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
    generateMultisigSignature,
  }
}
