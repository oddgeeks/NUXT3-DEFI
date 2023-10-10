const mfaTermsAccepted = useLocalStorage('mfa-terms-accepted', false)
const preferredMfaType = useLocalStorage('mfa-preferred-type', '')

export function useMfa() {
  const { mfaEmailVerifed, mfaPhoneVerifed, mfaTotpVerifed, selectedSafe, atLeastOneMfaVerifed } = storeToRefs(useSafe())
  const { avoProvider, fetchSafeInstanceses } = useSafe()
  const { switchToAvocadoNetwork } = useNetworks()
  const { account, library } = useWeb3()

  const mfaSessionTypes = {
    RequestCode: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint32' },
      { name: 'type', type: 'string' },
    ],
  }

  const mfaTypes = computed(() =>
    [
      {
        value: 'totp',
        title: 'Set up Authenticator app',
        description: 'Please enter the provided code or scan QR in your Auth Provider.',
        label: 'Authenticator app login',
        enterOtpLabel: 'Enter TOTP provided by Auth Provider',
        types: {
          Totp: [
            { name: 'owner', type: 'address' },
            { name: 'index', type: 'uint32' },
            { name: 'mfaType', type: 'string' },
            { name: 'mfaCode', type: 'string' },
          ],
        },
        activated: mfaTotpVerifed.value,
      },
      {
        value: 'phone',
        label: 'SMS OTP based login',
        enterOtpLabel: 'Enter Phone OTP',
        title: 'Enter your phone number',
        description: 'We will send an OTP to your phone.',
        removeTypes: {
          Phone: [
            { name: 'owner', type: 'address' },
            { name: 'index', type: 'uint32' },
          ],
        },
        types: {
          Phone: [
            { name: 'owner', type: 'address' },
            { name: 'index', type: 'uint32' },
            { name: 'countryCode', type: 'uint256' },
            { name: 'phone', type: 'uint256' },
            { name: 'mfaType', type: 'string' },
            { name: 'mfaCode', type: 'string' },
          ],
        },
        activated: mfaPhoneVerifed.value,

      }, {
        value: 'email',
        title: 'Enter your Email',
        enterOtpLabel: 'Enter email OTP',
        description: 'We will send an OTP to your email.',
        label: 'Email OTP login',
        removeTypes: {
          Email: [
            { name: 'owner', type: 'address' },
            { name: 'index', type: 'uint32' },
          ],
        },
        types: {
          Email: [
            { name: 'owner', type: 'address' },
            { name: 'index', type: 'uint32' },
            { name: 'email', type: 'string' },
            { name: 'mfaType', type: 'string' },
            { name: 'mfaCode', type: 'string' },
          ],
        },
        activated: mfaEmailVerifed.value,
      },
    ] as IMfa[],
  )

  const preferredMfa = computed(() => {
    const mfas = mfaTypes.value.filter(mfa => mfa.activated)

    const mfa = mfas.find(mfa => mfa.value === preferredMfaType.value)

    return mfa || mfas[0]
  })

  async function handleRequestActivateMfa(mfa: IMfa, payload: any) {
    const { signature, cancelled } = await signTypedData(library.value, account.value, payload)

    if (cancelled || !signature)
      return

    const resp: IMfaResponse = await avoProvider.send('mfa_requestUpdate', [{
      type: mfa.value,
      data: payload.value,
      signature,
    }])

    return resp
  }

  async function activateToptMfa(mfa: IMfa, _authMfa?: IMfa) {
    await switchToAvocadoNetwork()

    let resp: IMfaResponse | undefined
    const domain = {
      name: 'Avocado MFA Update',
      version: '1.0.0',
      chainId: String(avoChainId),
      verifyingContract: selectedSafe.value?.safe_address,
    }

    const signPayload = {
      domain,
      types: mfa.types,
      value: {
        owner: selectedSafe.value?.owner_address,
        index: selectedSafe.value?.multisig_index,
        mfaType: '',
        mfaCode: '',
      },
    }

    if (atLeastOneMfaVerifed.value) {
      const authMfa: IMfa = _authMfa || preferredMfa.value

      const { success: verifySuccess, payload: verifyPayload } = await authVerify({
        mfa: authMfa,
        mfaRequestType: 'update',
        submitFn: async (_mfa, code) => {
          signPayload.value.mfaType = _mfa.value
          signPayload.value.mfaCode = code

          resp = await handleRequestActivateMfa(mfa, signPayload)

          if (resp?.status)
            return true

          return false
        },
      })

      if (verifyPayload?.fallbackMfa)
        return activateToptMfa(mfa, verifyPayload.fallbackMfa)

      if (!verifySuccess || !verifyPayload?.code)
        return
    }

    if (!resp?.status)
      throw new Error('Failed to activate TOTP MFA')

    const { success: activateSuccess } = await openTotptActivateModal(resp.data)

    if (!activateSuccess)
      throw new Error('Failed to activate TOTP MFA')
  }

  async function authVerify(params: IAuthVerifyParams) {
    const { mfa, mfaRequestType, submitFn } = params || {}

    const requestFunction = mfaRequestType === 'transaction' ? signAndRequestTransactionMfaCode : signAndRequestUpdateMfaCode

    if (mfa.value !== 'totp') {
      const success = await requestFunction(mfa)

      if (!success)
        throw new Error('Failed to request MFA code')
    }

    return openVerifyMFAModal({
      mfa,
      mfaRequestType,
      authenticate: true,
      request: requestFunction.bind(null, mfa),
      verify: submitFn,
    })
  }

  async function requestActivateMfa(mfa: IMfa, value: any) {
    const domain = {
      name: 'Avocado MFA Update',
      version: '1.0.0',
      chainId: String(avoChainId),
      verifyingContract: selectedSafe.value?.safe_address,
    }

    const signPayload = {
      domain,
      types: mfa.types,
      value,
    } as any

    const resp = await handleRequestActivateMfa(mfa, signPayload)

    if (!resp?.status) {
      return {
        success: false,
      }
    }

    return openVerifyMFAModal({
      mfa,
      mfaRequestType: 'update',
      request: handleRequestActivateMfa.bind(null, mfa, signPayload),
      verify: verifyUpdateRequest,
      inputValue: value,
    })
  }

  async function activateMfa(mfa: IMfa, value: any, _authMfa?: IMfa) {
    await switchToAvocadoNetwork()

    if (atLeastOneMfaVerifed.value) {
      const authMfa: IMfa = _authMfa || preferredMfa.value

      const { success: verifySuccess, payload: verifyPayload } = await authVerify(
        {
          mfa: authMfa,
          mfaRequestType: 'update',
          submitFn: async (_mfa, code) => {
            value.mfaType = _mfa.value
            value.mfaCode = code

            const { success } = await requestActivateMfa(mfa, value)

            return success
          },
        })

      if (verifyPayload?.fallbackMfa)
        return activateMfa(mfa, value, verifyPayload.fallbackMfa)

      if (verifySuccess) {
        await fetchSafeInstanceses()
        return
      }
    }

    const { success } = await requestActivateMfa(mfa, value)

    if (success)
      await fetchSafeInstanceses()

    else
      throw new Error('MFA verification failed')
  }

  async function signAndRequestUpdateMfaCode(mfa: IMfa) {
    await switchToAvocadoNetwork()

    const domain = {
      name: 'Avocado MFA Code',
      version: '1.0.0',
      chainId: String(avoChainId),
      verifyingContract: selectedSafe.value?.safe_address,
    }

    const value = {
      owner: selectedSafe.value?.owner_address,
      index: selectedSafe.value?.multisig_index,
      type: mfa.value,
    }

    const payload = {
      domain,
      types: mfaSessionTypes,
      value,
    }

    const { signature, cancelled } = await signTypedData(library.value, account.value, payload)

    if (cancelled || !signature)
      return

    return avoProvider.send('mfa_requestCode', [
      {
        signature,
        data: value,
      },
    ])
  }

  async function signAndRequestDeleteMfaCode(mfa: IMfa) {
    await switchToAvocadoNetwork()

    const domain = {
      name: 'Avocado MFA Update',
      version: '1.0.0',
      chainId: String(avoChainId),
      verifyingContract: selectedSafe.value?.safe_address,
    }

    const value = {
      owner: selectedSafe.value?.owner_address,
      index: selectedSafe.value?.multisig_index,
    }

    const payload = {
      domain,
      types: mfa.removeTypes!,
      value,
    }

    const { signature, cancelled } = await signTypedData(library.value, account.value, payload)

    if (cancelled || !signature)
      return

    return avoProvider.send('mfa_requestRemove', [
      {
        type: mfa.value,
        signature,
        data: value,
      },
    ])
  }

  async function signAndRequestTransactionMfaCode(mfa: IMfa) {
    await switchToAvocadoNetwork()

    const domain = {
      name: 'Avocado MFA Transaction',
      version: '1.0.0',
      chainId: String(avoChainId),
      verifyingContract: selectedSafe.value?.safe_address,
    }

    const value = {
      owner: selectedSafe.value?.owner_address,
      index: selectedSafe.value?.multisig_index,
      type: mfa.value,
    }

    const payload = {
      domain,
      types: mfaSessionTypes,
      value,
    }

    const { signature, cancelled } = await signTypedData(library.value, account.value, payload)

    if (cancelled || !signature)
      return

    return avoProvider.send('mfa_requestTransactionCode', [
      {
        signature,
        data: value,
      },
    ])
  }

  function verifyDeleteRequest(mfa: IMfa, code: string) {
    return avoProvider.send('mfa_verifyRemove', [{
      type: mfa.value,
      owner: selectedSafe.value?.owner_address,
      index: String(selectedSafe.value?.multisig_index),
      code,
    }])
  }

  function verifyUpdateRequest(mfa: IMfa, code: string) {
    return avoProvider.send('mfa_verifyUpdate', [{
      type: mfa.value,
      owner: selectedSafe.value?.owner_address,
      index: String(selectedSafe.value?.multisig_index),
      code,
    }])
  }

  function regenerateTotpRecoveryCode(mfa: IMfa, code: string) {
    return avoProvider.send('mfa_regenerateTotpRecoveryCodes', [{
      owner: selectedSafe.value?.owner_address,
      index: String(selectedSafe.value?.multisig_index),
      code,
    }])
  }

  function removeTotpUsingRecoveryCode(code: string) {
    return avoProvider.send('mfa_removeTotpUsingRecoveryCode', [{
      owner: selectedSafe.value?.owner_address,
      index: String(selectedSafe.value?.multisig_index),
      code,
    }])
  }

  return {
    mfaTermsAccepted,
    mfaSessionTypes,
    mfaTypes,
    preferredMfaType,
    preferredMfa,
    verifyUpdateRequest,
    activateMfa,
    activateToptMfa,
    authVerify,
    signAndRequestTransactionMfaCode,
    signAndRequestDeleteMfaCode,
    verifyDeleteRequest,
    regenerateTotpRecoveryCode,
    removeTotpUsingRecoveryCode,
    signAndRequestUpdateMfaCode,
  }
}
