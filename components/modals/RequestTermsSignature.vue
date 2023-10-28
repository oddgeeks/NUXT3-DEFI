<script setup lang="ts">
const emit = defineEmits(['destroy', 'resolve'])
const { avoProvider } = useSafe()

const { parseTransactionError } = useErrorHandler()

const referral = useCookie<string | null>('ref-code')

const { account, library } = useWeb3()
const pending = ref(false)

async function handleSign() {
  try {
    pending.value = true

    let template = `
issueAt: {{ISSUE_AT}}
nonce: {{NONCE}}
`

    const dateNow = new Date().toUTCString()

    const generateNonceParams = {
      ISSUE_AT: dateNow,
    }

    const isReferrer = await avoProvider.send('api_hasReferralForUser', [account.value,
    ])

    if (referral.value && !isReferrer) {
      Object.assign(generateNonceParams, {
        referrer: referral.value,
      })
    }

    const nonce = await avoProvider.send('api_generateNonce', [
      account.value,
      null,
      template,
      generateNonceParams,
    ])

    template = template.replaceAll('{{NONCE}}', nonce)
    template = template.replaceAll('{{ISSUE_AT}}', dateNow)

    const signer = library.value.getSigner()

    const signature = await signer.signMessage(template)

    if (!isReferrer) {
      const linkStatus = await avoProvider.send('api_signUser', [
        signature,
        nonce,
      ])

      console.log({ linkStatus })
    }

    setTimeout(() => {
      emit('resolve', true)
    }, 0)

    referral.value = null
  }
  catch (e: any) {
    const parsed = parseTransactionError(e)
    openSnackbar({
      message: parsed.formatted,
      type: 'error',
    })
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-7.5">
    <SvgoAvocadoLogoMini class="h-20 w-20" />
    <h1 class="text-3xl">
      Welcome to Avocado
    </h1>
    <h2 class="text-center font-medium">
      By connecting your wallet and using Avocado, you agree to our <NuxtLink class="text-primary" to="/">
        Terms of Service
      </NuxtLink> and <NuxtLink class="text-primary" to="/">
        Privacy Policy
      </NuxtLink>
    </h2>

    <div class="flex w-full items-center justify-between gap-5 self-start">
      <CommonButton class="flex-1 justify-center" size="lg" color="white" @click="$emit('resolve', false)">
        Cancel
      </CommonButton>
      <CommonButton :loading="pending" class="flex-1 justify-center" size="lg" @click="handleSign">
        Accept & Connect
      </CommonButton>
    </div>
  </div>
</template>
