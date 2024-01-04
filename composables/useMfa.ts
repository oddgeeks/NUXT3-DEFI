import type { CookieOptions } from 'nuxt/app'

const preferredMfaType = useLocalStorage('mfa-preferred-type', '')

export function useMfa() {
  const { selectedSafe } = storeToRefs(useSafe())
  const { backupSigners } = storeToRefs(useMultisig())
  const { avoChainId, instadappSigner } = storeToRefs(useEnvironmentState())
  const { avoProvider, fetchSafeInstanceses } = useSafe()
  const { switchToAvocadoNetwork } = useNetworks()
  const { account, library } = useWeb3()
  const { $t } = useNuxtApp()
  const mfaTermsAccepted = () => useLocalStorage(`mfa-terms-accepted-${selectedSafe.value?.safe_address}`, false)

  const isAvocadoProtectActive = computed(() => selectedSafe.value?.multisig === 1 && selectedSafe.value?.multisig_index === 0)

  const mfaEmailVerifed = computed(() => selectedSafe.value?.mfa_email_verified === 1)
  const mfaTotpVerifed = computed(() => selectedSafe.value?.mfa_totp_verified === 1)
  const mfaPhoneVerifed = computed(() => selectedSafe.value?.mfa_phone_verified === 1)

  const atLeastOneMfaVerifed = computed(() => checkAtleastOneMfaVerified(selectedSafe.value!))

  const is2FAenabled = computed(() => !!selectedSafe.value && atLeastOneMfaVerifed.value && checkHasInstadappSigner(selectedSafe.value, instadappSigner.value))

  const isSafeBackupSigner = computed(() => checkSafeBackupSigner(selectedSafe.value!, account.value))

  const getMFATokenExpiry = (otps?: CookieOptions) => useCookie<string | undefined | null>(`transaction-token-expiry-${selectedSafe.value?.safe_address}`, otps)
  const getMFAToken = (otps?: CookieOptions) => useCookie<string | undefined | null>(`transaction-token-${selectedSafe.value?.safe_address}`, otps)

  const backupSigner = computed(() => {
    const [firstBackupSigner] = backupSigners.value || []

    return firstBackupSigner
  })

  function terminateMFAToken() {
    getMFATokenExpiry().value = null
    getMFAToken().value = null
  }

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
        type: '2',
        label: 'Authenticator app',
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
        icon: 'SvgoTotp',
      },
      {
        value: 'phone',
        label: 'SMS OTP',
        enterOtpLabel: 'Enter SMS OTP',
        title: 'Enter your phone number',
        type: '1',
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
        icon: 'SvgoPhone',
        otpSentNotificationKey: 'mfa.notifications.SMSOtpSent',

      }, {
        value: 'email',
        title: 'Enter your Email',
        enterOtpLabel: 'Enter email OTP',
        description: 'We will send an OTP to your email.',
        label: 'Email OTP',
        type: '0',
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
        icon: 'SvgoEmail',
      },
      {
        value: 'backup',
        title: 'Backup address',
        label: 'Backup address',
        description: '',
        activated: !!backupSigners.value.length,
        icon: 'SvgoBackup',
        type: '',
      },
    ] as IMfa[],
  )

  const backupMfa = computed(() => mfaTypes.value.find(mfa => mfa.value === 'backup'))

  const activeMfaTypes = computed(() => mfaTypes.value.filter(mfa => mfa.activated && mfa.value !== 'backup'))

  const preferredMfa = computed(() => {
    const mfas = mfaTypes.value.filter(mfa => mfa.activated)

    const mfa = mfas.find(mfa => mfa.value === preferredMfaType.value)

    const fallbackMfas = mfas.filter(mfa => mfa.value !== 'backup')

    return mfa || fallbackMfas[0]
  })

  async function handleRequestActivateMfa(mfa: IMfa, payload: any) {
    const { signature, cancelled } = await signTypedData(library.value, account.value, payload)

    if (cancelled || !signature)
      return

    const resp: IMfaResponse = await avoProvider.send('mfa_requestUpdate', [{
      type: mfa.type,
      data: payload.value,
      signature,
    }])

    return resp
  }

  async function activateToptMfa(mfa: IMfa, keyMfa: IKeyMfa) {
    await switchToAvocadoNetwork()

    const domain = {
      name: 'Avocado MFA Update',
      version: '1.0.0',
      chainId: String(avoChainId.value),
      verifyingContract: selectedSafe.value?.safe_address,
    }

    const signPayload = {
      domain,
      types: mfa.types,
      value: {
        owner: selectedSafe.value?.owner_address,
        index: selectedSafe.value?.multisig_index,
        mfaType: keyMfa.mfaType,
        mfaCode: keyMfa.mfaCode,
      },
    }

    const resp = await handleRequestActivateMfa(mfa, signPayload)

    if (!resp?.status)
      throw new Error($t('mfa.notifications.failedToActivate', { method: mfa.label }))

    const { success: activateSuccess } = await openTotptActivateModal(resp.data)

    if (!activateSuccess)
      throw new Error($t('mfa.notifications.failedToActivate', { method: mfa.label }))
  }

  async function authVerify(params: IAuthVerifyParams) {
    const { mfa, mfaRequestType, submitFn, defaultSessionAvailable = false, expire, forceGrabSession, chainId } = params || {}

    const requestFunction = mfaRequestType === 'transaction' ? signAndRequestTransactionMfaCode : signAndRequestUpdateMfaCode

    if (mfa.value !== 'totp') {
      const success = await requestFunction(mfa)

      if (!success)
        throw new Error($t('mfa.notifications.failedToRequest', { method: mfa.label }))
    }

    return openVerifyMFAModal({
      mfa,
      mfaRequestType,
      authenticate: true,
      request: requestFunction.bind(null, mfa),
      verify: submitFn,
      defaultSessionAvailable,
      forceGrabSession,
      expire,
      chainId,
    })
  }

  async function requestActivateMfa(mfa: IMfa, value: any) {
    const domain = {
      name: 'Avocado MFA Update',
      version: '1.0.0',
      chainId: String(avoChainId.value),
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

    const { success } = await requestActivateMfa(mfa, value)

    if (success)
      await fetchSafeInstanceses()

    else
      throw new Error($t('mfa.notifications.verificationFailed'))
  }

  async function signAndRequestUpdateMfaCode(mfa: IMfa) {
    await switchToAvocadoNetwork()

    const domain = {
      name: 'Avocado MFA Code',
      version: '1.0.0',
      chainId: String(avoChainId.value),
      verifyingContract: selectedSafe.value?.safe_address,
    }

    const value = {
      owner: selectedSafe.value?.owner_address,
      index: selectedSafe.value?.multisig_index,
      type: mfa.type,
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
      chainId: String(avoChainId.value),
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
        type: mfa.type,
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
      chainId: String(avoChainId.value),
      verifyingContract: selectedSafe.value?.safe_address,
    }

    const value = {
      owner: selectedSafe.value?.owner_address,
      index: selectedSafe.value?.multisig_index,
      type: mfa.type,
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
      type: mfa.type,
      owner: selectedSafe.value?.owner_address,
      index: String(selectedSafe.value?.multisig_index),
      code,
    }])
  }

  function verifyUpdateRequest(mfa: IMfa, code: string) {
    return avoProvider.send('mfa_verifyUpdate', [{
      type: mfa.type,
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
    backupMfa,
    requestActivateMfa,
    isAvocadoProtectActive,
    signAndRequestTransactionMfaCode,
    signAndRequestDeleteMfaCode,
    verifyDeleteRequest,
    regenerateTotpRecoveryCode,
    removeTotpUsingRecoveryCode,
    signAndRequestUpdateMfaCode,
    mfaEmailVerifed,
    mfaTotpVerifed,
    mfaPhoneVerifed,
    isSafeBackupSigner,
    atLeastOneMfaVerifed,
    backupSigner,
    getMFATokenExpiry,
    getMFAToken,
    terminateMFAToken,
    activeMfaTypes,
    is2FAenabled,
  }
}
