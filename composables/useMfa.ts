const mfaTermsAccepted = useLocalStorage('mfa-terms-accepted', false)

export function useMfa() {
  return {
    mfaTermsAccepted,
  }
}
