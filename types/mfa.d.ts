type Mfa = 'totp' | 'phone' | 'email'

interface IMfaResponse {
  status: boolean;
  data: {
    algorithm: string
    digits: number
    period: number
    secret: string
    issuer: string
    label: string
    uri: string
    recovery_codes: string[]
  }
}

interface IMfa {
  value: Mfa
  label: string
  activated: boolean
  title: string
  description: string
  removeTypes?: {
    [key: string]: {
      name: string
      type: string
    }[]
  },
  types: {
    [key: string]: {
      name: string
      type: string
    }[]
  }
}