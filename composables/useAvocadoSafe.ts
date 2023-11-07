import { isAddress } from '@ethersproject/address'
import { ethers } from 'ethers'
import axios from 'axios'

import { isUndefined } from '@walletconnect/utils'
import { serialize } from 'error-serializer'
import { gte, parse } from 'semver'
import {
  AvoMultisigImplementation__factory,
} from '@/contracts'

export function useAvocadoSafe() {
  const { public: config } = useRuntimeConfig()
  const { switchToAvocadoNetwork } = useNetworks()
  const { account, library } = useWeb3()
  const { isTrackingMode } = useAccountTrack()
  const { getRpcProviderByChainId } = useShared()
  const { avoProvider, getSafeOptions, refreshSelectedSafe, getFallbackSafeOptionsByChainId } = useSafe()
  const { selectedSafe, isSelectedSafeLegacy, safeOptions } = storeToRefs(useSafe())
  const { clearAllModals } = useModal()
  const { authVerify, preferredMfa, isAvocadoProtectActive, atLeastOneMfaVerifed, getMFAToken, getMFATokenExpiry } = useMfa()
  const dryRun = useCookie<boolean | undefined>('dry-run')
  const latestMfaType = useState('latest-mfa-type')

  const { isSafeMultisig } = storeToRefs(useMultisig())
  const { getRequiredSigner } = useMultisig()

  const { safeAddress, tokenBalances, totalBalance, totalEoaBalance, eoaBalances, fundedEoaNetworks, networkOrderedBySumTokens } = storeToRefs(useSafe())

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

    if (isSelectedSafeLegacy.value) {
      const txHash = await sendTransactionsLegacy({
        actions: [transaction],
        chainId: transaction.chainId,
        options: {
          source: '0xE8385fB3A5F15dED06EB5E20E5A81BF43115eb8E',
          ...options,
        },
      })

      return txHash
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
        metadata: options.metadata || '0x',
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

    if (isSelectedSafeLegacy.value) {
      const txHash = await sendTransactionsLegacy({
        actions: transactions,
        chainId,
        options: {
          source: '0xE8385fB3A5F15dED06EB5E20E5A81BF43115eb8E', ...options,
        },
      })

      return txHash
    }
    else {
      const txHash = await createProposalOrSignDirecty({ chainId, actions: transactions, metadata: options.metadata || '0x', options, transactionType })

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
    const { signature, domain, value } = await signMultisigData({ chainId, data })

    return {
      signatureParams: {
        signature,
        address: account.value,
      },
      castParams: data,
      domain,
      value,
    }
  }

  async function sendTransactionsLegacy(params: IGenerateSignatureMessageParams) {
    const { chainId } = params || {}

    const message = await generateSignatureMessage(params)

    const { signature, digestHash } = await signLegacyData({
      chainId,
      message,
    })

    const transactionHash = await avoProvider.send('txn_broadcast', [
      {
        signature,
        message,
        owner: selectedSafe.value?.owner_address,
        targetChainId: String(chainId),
        dryRun: false,
        safe: selectedSafe.value?.safe_address,
        digestHash,
      },
    ])

    return transactionHash
  }

  async function signLegacyData(params: ISignLegacyDataParams) {
    const { chainId, message } = params || {}

    const safeOptions = await getFallbackSafeOptionsByChainId(selectedSafe.value!, chainId)

    const versionMajor = parse(safeOptions.currentVersion)?.major || 2

    const domain = {
      name: safeOptions.domainName,
      version: safeOptions.notdeployed ? safeOptions?.latestVersion : safeOptions.currentVersion,
      chainId: String(avoChainId),
      salt: ethers.utils.solidityKeccak256(['uint256'], [chainId]),
      verifyingContract: selectedSafe.value?.safe_address,
    }

    console.log({ domain })

    const types = {
      1: typesV1,
      2: typesV2,
    }[versionMajor] || {}

    const { signature, cancelled } = await signTypedData(library.value, account.value, {
      domain,
      types,
      value: message,
    })

    if (cancelled)
      throw new Error('Signature cancelled')

    if (!signature)
      throw new Error('Failed to get signature')

    return {
      signature,
      digestHash: ethers.utils._TypedDataEncoder.hash(domain, types, message),
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
      mfa_type: params.mfa_type,
      mfa_code: params.mfa_code,
      mfa_token: params.mfa_token,
      debug: params.debug,
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

    console.log({ signatureObject })

    const transactionHash = await avoProvider.send('txn_broadcast', [signatureObject])

    if (dryRun.value) {
      alert(`Dry run value: ${transactionHash}`)
      return
    }

    if (transactionHash && params.proposalId && !params.ignoreSlack) {
      const metadatalist = decodeMetadata(params.message.params.metadata) || []
      const [metadata] = metadatalist

      let message = generateSlackMessage(params.message.params.metadata, params.targetChainId)
      if (!message)
        message = `\n${'`Multisig Hash`'} <${config.domainURL}/multisig/${params.safe}/pending-transactions/${params.proposalId}| ${shortenHash(params.proposalId)}>`

      logActionToSlack({
        account: account.value,
        action: metadata?.type || 'multisig',
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

  async function generateSignatureMessage(params: IGenerateSignatureMessageParams) {
    const { actions, chainId, options } = params || {}

    const safeOptions = await getFallbackSafeOptionsByChainId(selectedSafe.value!, chainId)

    const actualVersion = safeOptions.notdeployed ? safeOptions.latestVersion : safeOptions.currentVersion

    const isV2 = gte(actualVersion, '2.0.0')

    if (isV2) {
      return {
        actions: actions.map(transaction => (
          {
            operation: transaction.operation || '0',
            target: transaction.to,
            data: transaction.data || '0x',
            value: transaction.value ? transaction.value.toString() : '0',
          }
        )),
        params: {
          metadata: options && options.metadata ? options.metadata : '0x',
          source: options && options.source ? options.source : '0x000000000000000000000000000000000000Cad0',
          id: options && options.id ? options.id : '0',
          validUntil: options && options.validUntil ? options.validUntil : '0',
          gas: options && options.gas ? options.gas : '0',
        },
        avoSafeNonce: String(safeOptions.nonce),
      }
    }

    return {
      actions: actions.map(transaction => (
        {
          target: transaction.to,
          data: transaction.data || '0x',
          value: transaction.value ? transaction.value.toString() : '0',
        }
      )),
      metadata: options && options.metadata ? options.metadata : '0x',
      source: options && options.source ? options.source : '0x000000000000000000000000000000000000Cad0',
      avoSafeNonce: String(safeOptions.nonce),
      validUntil: options && options.validUntil ? options.validUntil : '0',
      gas: options && options.gas ? options.gas : '0',
    }
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

  async function authenticateTransactionMfa(params?: IAuthTransactionMfa) {
    const { _authMfa, submitFn, defaultSessionAvailable = false, expire, forceGrabSession = false, chainId } = params || {}

    const mfa = _authMfa || preferredMfa.value
    let mfaToken

    if (mfa.value === 'backup')
      return { mfaCode: '', mfaType: 'backup' }

    const { success, payload: verifyPayload } = await authVerify({
      mfa,
      mfaRequestType: 'transaction',
      submitFn,
      defaultSessionAvailable,
      chainId,
      expire,
    })

    if (verifyPayload?.fallbackMfa) {
      return authenticateTransactionMfa({
        _authMfa: verifyPayload.fallbackMfa,
        submitFn,
        defaultSessionAvailable,
        expire,
        forceGrabSession,
        chainId,
      })
    }

    if (!success || !verifyPayload?.code)
      throw new Error('MFA verification failed')

    if (verifyPayload.sessionAvailable || forceGrabSession) {
      const resp = await avoProvider.send('mfa_generateSessionToken', [
        {
          owner: selectedSafe.value?.owner_address,
          index: selectedSafe.value?.multisig_index,
          ttl: expire || '30min',
          code: verifyPayload.code,
          type: mfa.value,
        },
      ])

      if (!resp)
        throw new Error('Failed to generate session token')

      if (verifyPayload.sessionAvailable) {
        const transactionToken = getMFAToken({
          expires: new Date(resp.expiresAt),
        })

        const transactionTokenExpiry = getMFATokenExpiry({
          expires: new Date(resp.expiresAt),
        })

        transactionToken.value = resp.token
        transactionTokenExpiry.value = resp.expiresAt
      }

      mfaToken = resp.token
    }

    return {
      mfaCode: verifyPayload.code,
      mfaType: mfa.value,
      mfaToken,
    }
  }

  function isEligableToProceed2FA(requiredSigner: number, chainId: string | number) {
    return isInstadappSignerAdded(selectedSafe.value!, chainId) && atLeastOneMfaVerifed.value && requiredSigner === 2
  }

  async function getSingleSignatureObject(args: IGenerateMultisigSignatureParams) {
    const { chainId, actions, metadata, options } = args
    const params = await generateMultisigSignatureAndSign({ chainId, actions, metadata, options })

    const signatureObject: IMultisigBroadcastParams = {
      proposalId: '',
      ignoreSlack: true,
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
      mfa_code: '',
      mfa_token: '',
      mfa_type: undefined,
      debug: {
        domain: params.domain,
      },
    }

    return signatureObject
  }

  async function createProposalOrSignDirecty(params: IGenerateMultisigSignatureParams) {
    const { chainId, transactionType, actions, metadata, options } = params

    const requiredSigner = await getRequiredSigner(selectedSafe.value?.safe_address!, chainId)

    const transactionToken = getMFAToken()

    if (isSafeEligableToSingleExecution(requiredSigner)) {
      if (isEligableToProceed2FA(requiredSigner, chainId) && !transactionToken.value) {
        let txHash

        const defaultSessionAvailable = transactionType === 'add-signers' || transactionType === 'remove-signers'

        const { mfaType } = await authenticateTransactionMfa({
          chainId,
          defaultSessionAvailable,
          submitFn: async (_mfa, code) => {
            try {
              const signatureObject = await getSingleSignatureObject(params)

              signatureObject.mfa_code = code
              signatureObject.mfa_type = _mfa.value

              txHash = await multisigBroadcast(signatureObject)

              return true
            }
            catch (e) {
              const parsed = serialize(e)

              if (parsed.message.includes('INVALID_MFA_CODE'))
                return false

              else
                throw e
            }
          },
        })

        // global usage of recent mfa type
        latestMfaType.value = mfaType

        if (mfaType === 'backup') {
          const nonce = -1
          const multisigParams = await generateMultisigSignatureAndSign({ chainId, actions, nonce, metadata, options })

          // generate proposal
          const { data } = await axios.post<IMultisigTransaction>(`/safes/${selectedSafe.value?.safe_address}/transactions`, {
            chain_id: String(chainId),
            status: 'pending',
            signer: multisigParams?.signatureParams,
            owner: selectedSafe.value?.owner_address,
            index: String(selectedSafe.value?.multisig_index),
            data: multisigParams?.castParams,
            nonce,
          }, {
            baseURL: multisigURL,
          })

          clearAllModals()
          openReview2faBackupTransaction(data.id, chainId)
          return
        }

        return txHash
      }

      const signatureObject = await getSingleSignatureObject(params)

      if (isEligableToProceed2FA(requiredSigner, chainId) && transactionToken.value)
        signatureObject.mfa_token = transactionToken.value

      const txHash = await multisigBroadcast(signatureObject)

      return txHash
    }

    return createProposal(params)
  }

  async function createProposal(args: IGenerateMultisigSignatureParams) {
    const { chainId, actions, nonce, metadata, estimatedFee = false, rejection, rejectionId, options, transactionType = 'others', clearModals = true } = args

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

    const { signature, cancelled } = await signTypedData(library.value, account.value, {
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

  async function signMultisigData({ chainId, data }: any) {
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

    const { signature, cancelled } = await signTypedData(library.value, account.value, {
      domain,
      types,
      value: data,
    })

    if (cancelled)
      throw new Error('Signature cancelled')

    if (!signature)
      throw new Error('Failed to get signature')

    console.log({ domain, types, value: data, account: account.value, signature })

    return {
      signature,
      domain,
      value: data,
    }
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

  async function addSignersWithThreshold(params: IAddSignerParams) {
    const { chainId, addresses, threshold, actionsOnly } = params || {}

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

    if (actionsOnly) {
      return {
        actions,
        metadata,
      }
    }

    return createProposalOrSignDirecty({ chainId, actions, estimatedFee: true, metadata, clearModals: false, transactionType: 'add-signers' })
  }

  async function changeThreshold(params: IChangeThresholdParams) {
    const { chainId, threshold } = params || {}

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

  async function removeSignerWithThreshold(params: IRemoveSignerParams) {
    const { addresses, chainId, threshold, actionsOnly } = params || {}

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

    if (actionsOnly) {
      return {
        actions,
        metadata,
      }
    }

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

  function isSafeEligableToSingleExecution(requiredSigner: number) {
    if (atLeastOneMfaVerifed.value && isAvocadoProtectActive.value)
      return true
    return selectedSafe.value && selectedSafe.value.multisig_index === 0 && requiredSigner === 1
  }

  return {
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
    signLegacyData,
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
    generateSignatureMessage,
    authenticateTransactionMfa,
    isEligableToProceed2FA,
  }
}
