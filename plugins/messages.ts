import get from 'lodash/get'

export default defineNuxtPlugin(() => {
  const messages = {
    en: {
      nonAuthorized: `You are not a signer on {network} and cannot interact with assets on this network.
<a class='text-primary block' target='_blank' href=https://guides.avocado.instadapp.io/avocado-multisig/your-avocado-multisig#why-cant-i-send-assets-in-a-particular-network>Learn More</a>`,
      fuseNotSupported: 'Fuse network is not supported legacy safes',
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
