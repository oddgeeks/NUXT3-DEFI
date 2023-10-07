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

  async function activateToptMfa(mfa: IMfa) {
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
      const { success, payload: authPayload } = await openMfaAuthenticateModal('update')
      if (!success && !authPayload?.mfa)
        return

      const authMfa: IMfa = authPayload?.mfa

      const requestSuccess = await signAndRequestUpdateMfaCode(authMfa)

      if (!requestSuccess)
        throw new Error('Failed to request MFA code')

      const { success: verifySuccess, payload: verifyPayload } = await openVerifyMFAModal(authMfa, signAndRequestUpdateMfaCode)

      if (!verifySuccess || !verifyPayload?.code)
        return

      signPayload.value.mfaType = authMfa.value
      signPayload.value.mfaCode = verifyPayload.code
    }

    const resp = await handleRequestActivateMfa(mfa, signPayload)

    if (!resp?.status)
      throw new Error('Failed to activate TOTP MFA')

    const { success: activateSuccess } = await openTotptActivateModal(resp.data)

    if (!activateSuccess)
      throw new Error('Failed to activate TOTP MFA')
  }

  async function activateMfa(mfa: IMfa, value: any) {
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
      const { success, payload: authPayload } = await openMfaAuthenticateModal('delete')
      if (!success && !authPayload?.mfa)
        return

      const mfa: IMfa = authPayload?.mfa

      if (mfa.value !== 'totp') {
        const requestSuccess = await signAndRequestUpdateMfaCode(mfa)

        if (!requestSuccess)
          throw new Error('Failed to request MFA code')
      }

      const { success: verifySuccess, payload: verifyPayload } = await openVerifyMFAModal(mfa, signAndRequestUpdateMfaCode)

      if (!verifySuccess || !verifyPayload?.code)
        return

      value.mfaType = mfa.value
      value.mfaCode = verifyPayload.code
    }

    const resp = await handleRequestActivateMfa(mfa, signPayload)

    if (!resp?.status)
      throw new Error('Failed to activate MFA')

    const { success, payload: verifyPayload } = await openVerifyMFAModal(mfa, handleRequestActivateMfa.bind(null, signPayload))

    if (success && verifyPayload?.code) {
      const verifed = await verifyUpdateRequest(mfa, verifyPayload.code)

      if (verifed)
        await fetchSafeInstanceses()

      else
        throw new Error('MFA verification failed')
    }
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

  function regenerateTotpRecoveryCode(code: string) {
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
    signAndRequestTransactionMfaCode,
    signAndRequestDeleteMfaCode,
    verifyDeleteRequest,
    regenerateTotpRecoveryCode,
    removeTotpUsingRecoveryCode,
    signAndRequestUpdateMfaCode,
    verifyUpdateRequest,
    activateMfa,
    activateToptMfa,
  }
}
