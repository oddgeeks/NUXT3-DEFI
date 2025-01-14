type Mfa = 'totp' | 'phone' | 'email' | 'backup'

interface ITotpData {
  algorithm: string
  digits: number
  period: number
  secret: string
  issuer: string
  label: string
  uri: string
  recovery_codes: string[]
}

interface IMfaResponse {
  status: boolean
  data: ITotpData
}

interface IKeyMfa {
  mfaCode: string
  mfaType: string
}

interface IMfa {
  value: Mfa
  label: string
  activated: boolean
  title: string
  description: string
  enterOtpLabel: string
  icon: string
  type: string
  otpSentNotificationKey?: string
  removeTypes?: {
    [key: string]: {
      name: string
      type: string
    }[]
  }
  types: {
    [key: string]: {
      name: string
      type: string
    }[]
  }
}
