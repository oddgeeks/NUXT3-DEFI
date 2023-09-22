type Mfa = 'totp' | 'phone' | 'email'

interface IMfaResponse {
  algorithm: string
  digits: number
  period: number
  secret: string
  issuer: string
  label: string
  uri: string
}

interface IMfa {
  value: Mfa
  requestMethod: string
  verifyMethod: string
  disabled: boolean
  types: {
    [key: string]: {
      name: string
      type: string
    }[]
  }
}