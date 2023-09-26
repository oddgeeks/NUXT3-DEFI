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
  label: string
  requestMethod: string
  verifyMethod: string
  activated: boolean
  title: string
  description: string
  types: {
    [key: string]: {
      name: string
      type: string
    }[]
  }
}