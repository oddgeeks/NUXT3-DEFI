export function checkAtleastOneMfaVerified(safe?: ISafe) {
  if (!safe)
    return false
  return safe.mfa_phone_verified === 1 || safe.mfa_email_verified === 1 || safe.mfa_totp_verified === 1
}

export function checkSafeBackupSigner(safe: ISafe, account: string) {
  return checkAtleastOneMfaVerified(safe) && !isAddressEqual(safe.owner_address, account)
}

export function checkHasInstadappSigner(safe: ISafe) {
  const signers = formatSigners(safe.signers)

  const instadappSigners = signers.find(i => isAddressEqual(i.address, instadappSigner))

  if (!instadappSigners)
    return false

  return instadappSigners.chainIds.length > 0
}

export function checkHasInstadappSignerWithMfa(safe: ISafe) {
  return checkHasInstadappSigner(safe) && checkAtleastOneMfaVerified(safe)
}

export function isSignerAdded(safe: ISafe, address: string, chainId: number | string) {
  const signers = safe.signers?.[chainId] || []
  return signers.some(i => isAddressEqual(i, address))
}

export function isInstadappSignerAdded(safe: ISafe, chainId: number | string) {
  return isSignerAdded(safe, instadappSigner, chainId)
}
