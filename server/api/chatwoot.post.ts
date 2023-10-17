import { ethers } from 'ethers'
import CryptoJS from 'crypto-js'

import { chatwootMessage } from '../../utils/messages'

function computeHmac(message: string, key: string) {
  const hmac = CryptoJS.HmacSHA256(message, key)
  return hmac.toString(CryptoJS.enc.Hex)
}

export default defineEventHandler(async (event) => {
  const params = await readBody(event)

  const owner = params.owner
  const safeAddress = params.safeAddress
  const signature = params.signature

  const message = chatwootMessage
    .replace('{ACCOUNT}', owner)
    .replace('{SAFE_ADDRESS}', safeAddress)

  const verifedOwner = await ethers.utils.verifyMessage(message, signature)

  if (verifedOwner.toLowerCase() !== owner.toLowerCase())
    return createError('Signature verification failed')

  const secretKey = 'faEq2wUpvuFEeeC1NgqBdGsQ'

  const identifier = `${owner}:${safeAddress}`.toLowerCase()

  return computeHmac(identifier, secretKey)
})
