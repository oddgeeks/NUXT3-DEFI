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
        title: 'Set up Google Auth/Authy',
        description: 'Please enter the provided code or scan QR in your Auth Provider.',
        label: 'Authenticator app (TOTP) login',
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

      const { success: verifySuccess, payload: verifyPayload } = await authVerify(authMfa, 'update')

      if (verifyPayload?.fallbackMfa)
        return activateToptMfa(mfa, verifyPayload.fallbackMfa)

      if (!verifySuccess || !verifyPayload?.code)
        return

      signPayload.value.mfaType = preferredMfa.value.value
      signPayload.value.mfaCode = verifyPayload.code
    }

    const resp = await handleRequestActivateMfa(mfa, signPayload)

    if (!resp?.status)
      throw new Error('Failed to activate TOTP MFA')

    const { success: activateSuccess } = await openTotptActivateModal(resp.data)

    if (!activateSuccess)
      throw new Error('Failed to activate TOTP MFA')
  }

  async function authVerify(mfa: IMfa, mfaRequestType: MfaRequestType) {
    if (mfa.value !== 'totp') {
      const success = mfaRequestType === 'transaction' ? await signAndRequestTransactionMfaCode(mfa) : await signAndRequestUpdateMfaCode(mfa)

      if (!success)
        throw new Error('Failed to request MFA code')
    }

    return openVerifyMFAModal({
      mfa,
      mfaRequestType,
      authenticate: true,
      request: signAndRequestUpdateMfaCode,
    })
  }

  async function activateMfa(mfa: IMfa, value: any, _authMfa?: IMfa) {
    await switchToAvocadoNetwork()

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

    if (atLeastOneMfaVerifed.value) {
      const authMfa: IMfa = _authMfa || preferredMfa.value

      const { success: verifySuccess, payload: verifyPayload } = await authVerify(authMfa, 'update')

      if (verifyPayload?.fallbackMfa)
        return activateMfa(mfa, value, verifyPayload.fallbackMfa)

      if (!verifySuccess || !verifyPayload?.code)
        throw new Error('MFA verification failed')

      value.mfaType = authMfa.value
      value.mfaCode = verifyPayload.code
    }

    const resp = await handleRequestActivateMfa(mfa, signPayload)

    if (!resp?.status)
      throw new Error('Failed to activate MFA')

    const { success } = await openVerifyMFAModal({
      mfa,
      mfaRequestType: 'update',
      request: handleRequestActivateMfa.bind(null, signPayload),
      verify: verifyUpdateRequest,
    })

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
    signAndRequestTransactionMfaCode,
    signAndRequestDeleteMfaCode,
    verifyDeleteRequest,
    regenerateTotpRecoveryCode,
    removeTotpUsingRecoveryCode,
    signAndRequestUpdateMfaCode,
    verifyUpdateRequest,
    activateMfa,
    activateToptMfa,
    authVerify,
  }
}
