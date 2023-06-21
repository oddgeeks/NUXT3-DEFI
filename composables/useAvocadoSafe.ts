import { storeToRefs } from 'pinia'
import { isAddress } from '@ethersproject/address'
import { VoidSigner, ethers } from 'ethers'
import {
  Forwarder__factory,
} from '@/contracts'

export function useAvocadoSafe() {
  const { switchToAvocadoNetwork } = useNetworks()
  const { library, account, provider } = useWeb3()
  const { trackingAccount, isTrackingMode } = useAccountTrack()
  const { avoProvider } = useSafe()

  const { selectedSafe } = storeToRefs(useAuthorities())

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

    await generateMultisigSignature({ chainId, actions: transactions })

    // const tx = await signer.value.sendTransactions(
    //   transactions,
    //   Number(chainId),
    //   { source: '0xE8385fB3A5F15dED06EB5E20E5A81BF43115eb8E', ...options },
    // )

    // return tx.hash!
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
    const providerWithSigner = new ethers.providers.Web3Provider(provider.value)
    const underlyingProvider = new ethers.providers.JsonRpcProvider(getRpcURLByChainId(chainId))

    await providerWithSigner.send('eth_requestAccounts', [])
    const avoSigner = providerWithSigner.getSigner()

    const forwarderProxyContract = Forwarder__factory.connect(
      forwarderProxyAddress,
      underlyingProvider,
    )

    const domainSeparatorName = 'Avocado-Safe-Multisig'
    const domainSeparatorVersion = '3.0.0'

    const verifyingContract = selectedSafe.value?.safe_address!

    const slot0 = await underlyingProvider.getStorageAt(verifyingContract, 0)
    const nonce = Number(slot0.slice(0, 26))

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

    console.log(signature)

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

      console.log('forwarderVerification', forwarderVerification)
    }
    catch (err) {
      console.log(err)
    }

    // const transactionHash = await providerAvocado.send('txn_broadcast', [{
    //   signatures: signatureParams,
    //   message: castParams,
    //   owner,
    //   safe: multisigAddress,
    //   targetChainId: String(underlyingChain),
    // }])
    // console.log(transactionHash)
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
