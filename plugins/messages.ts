import get from 'lodash/get'

export default defineNuxtPlugin(() => {
  const messages = {
    en: {
      nonAuthorized: `You are not a signer on {network} and cannot interact with assets on this network.
<a class='text-primary block' target='_blank' href=https://guides.avocado.instadapp.io/avocado-multisig/your-avocado-multisig#why-cant-i-send-assets-in-a-particular-network>Learn More</a>`,
      fuseNotSupported: 'Fuse network is not supported legacy safes',
      mfa: {
        page: {
          title: 'Configure Avocado Protect ⚔️',
          subtitle: 'Avocado Protect is a non-custodial 2FA service which allows you to add an additional layer of verification before a transaction goes through. You can activate multiple methods at once. Note only one method will be required to validate transactions.',
        },
        notifications: {
          failedToActivate: 'Failed to activate {method}',
          failedToDeactivate: 'Failed to deactivate {method}',
          failedToRequest: 'Failed to request OTP code {method}',
          verificationFailed: 'Verification failed',
          activated: 'Successfully activated {method}',
          deactivated: 'Successfully deactivated {method}',
          setDefault: 'Default 2FA method set to {method}',
          incorrectOTP: 'Incorrect OTP, please retry',
          OTPSent: 'OTP sent to your {method}',
          OTPSentFailed: 'Failed to send OTP to your {method}',
          instadappSignerEnabled: 'OTP enabled for {chainName}',
          instadappSignerDisabled: 'OTP disabled for {chainName}',
          signerDisabled: 'Signer disabled for {chainName}',
          signerEnabled: 'Signer enabled for {chainName}',
        },
      },
    },
  }

  return {
    provide: {
      t: (key: string, vars: any = {}) => {
        const message = get(messages.en, key)

        if (!message)
          return key

        return message.replace(/\{([^\}]+)\}/g, (_: any, match: any) => {
          return vars[match] || `{${match}}`
        })
      },
    },
  }
})
