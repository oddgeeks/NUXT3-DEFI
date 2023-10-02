const mfaTermsAccepted = useLocalStorage('mfa-terms-accepted', false)

export function useMfa() {
  const { mfaEmailVerifed, mfaPhoneVerifed, mfaTotpVerifed } = storeToRefs(useSafe())

  const mfaMode = ref('everytime')

  const actualMfaMode = computed(() => {
    return mfaModes.value.find(mode => mode.value === mfaMode.value)
  })

  const mfaModes = computed(() => [
    {
      title: 'Validate every time',
      description: 'You will have to pass 2FA authentication for each transaction.',
      value: 'everytime',
      recommended: true,
    },
    {
      title: 'Session based',
      description: 'You will unlock the UI for 30 min. after each successful verification.',
      value: 'session',
    },
  ])

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
        requestMethod: 'mfa_requestTotpUpdate',
        verifyMethod: 'mfa_verifyTotpUpdate',
        activated: mfaTotpVerifed.value,
      },
      {
        value: 'phone',
        label: 'SMS OTP based login',
        title: 'Enter your phone number',
        description: 'We will send an OTP to your phone.',
        types: {
          Phone: [
            { name: 'owner', type: 'address' },
            { name: 'index', type: 'uint32' },
            { name: 'countryCode', type: 'uint256' },
            { name: 'phone', type: 'uint256' },
            { name: 'existingMfaType', type: 'string' },
            { name: 'existingMfaCode', type: 'string' },
          ],
        },
        requestMethod: 'mfa_requestPhoneUpdate',
        verifyMethod: 'mfa_verifyPhoneUpdate',
        activated: mfaPhoneVerifed.value,

      }, {
        value: 'email',
        title: 'Enter your Email',
        description: 'We will send an OTP to your email.',
        label: 'Email OTP login',
        types: {
          Email: [
            { name: 'owner', type: 'address' },
            { name: 'index', type: 'uint32' },
            { name: 'email', type: 'string' },
            { name: 'mfaType', type: 'string' },
            { name: 'mfaCode', type: 'string' },
          ],
        },
        requestMethod: 'mfa_requestEmailUpdate',
        verifyMethod: 'mfa_verifyEmailUpdate',
        activated: mfaEmailVerifed.value,
      },
    ] as IMfa[],
  )

  return {
    mfaTermsAccepted,
    mfaTypes,
    mfaModes,
    mfaMode,
    actualMfaMode,
  }
}
