<script setup lang="ts">
const { selectedSafe, safeAddress } = storeToRefs(useSafe())
const { library, account } = useWeb3()
const { parseTransactionError } = useErrorHandler()

const [open, toggle] = useToggle(false)
const isChatwoodReady = ref(false)

function getIdentifier(account: string, safe: string) {
  return `${account}:${safe}`.toLowerCase()
}

async function openMessagePopup() {
  try {
    const message = chatwootMessage
      .replace('{ACCOUNT}', account.value)
      .replace('{SAFE_ADDRESS}', selectedSafe.value?.safe_address!)

    const identifier = getIdentifier(account.value, selectedSafe.value?.safe_address!)

    const identifierHash = useCookie(`chatwoot-identifier-hash-${identifier}`)

    // @ts-expect-error
    if (!identifierHash.value || window?.$chatwoot?.resetTriggered) {
      const signer = library.value.getSigner()

      const signature = await signer.signMessage(message)

      const hash = await $fetch('/api/chatwoot', {
        method: 'post',
        body: {
          owner: account.value,
          safeAddress: selectedSafe.value?.safe_address!,
          signature,
        },
      })

      if (!hash)
        throw new Error('Failed to get hash')

      identifierHash.value = hash

      // @ts-expect-error
      Object.assign(window.$chatwoot, {
        resetTriggered: false,
      })
    }

    // @ts-expect-error
    const userExist = !!window?.$chatwoot?.user

    if (!userExist) {
      // @ts-expect-error
      window.$chatwoot?.setUser(identifier, {
        identifier_hash: identifierHash.value,
        name: account.value,
        company_name: selectedSafe.value?.safe_address,
      })
    }

    const timeout = userExist ? 0 : 500

    setTimeout(() => {
      // @ts-expect-error
      window?.$chatwoot?.toggle()
    }, timeout)
  }
  catch (e: any) {
    const parsed = parseTransactionError(e)

    notify({
      message: parsed.formatted,
      type: 'error',
    })
  }
}

onMounted(() => {
  window.addEventListener('chatwoot:ready', async () => {
    isChatwoodReady.value = true

    const element = document.getElementsByClassName('woot-widget-holder')[0]

    if (!element)
      return

    const observer = new MutationObserver(([event]: any[]) => {
      const isHidden = event.target.classList.contains('woot--hide')

      toggle(!isHidden)
    })

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['class'],
      childList: false,
      characterData: false,
    })
  })
})

watchThrottled([account, safeAddress], () => {
  if (process.server)
    return

  if (!account.value || !safeAddress.value)
    return

  const identifier = getIdentifier(account.value, safeAddress.value)

  // @ts-expect-error
  if (window?.$chatwoot.identifier !== identifier) {
    // @ts-expect-error
    delete window.$chatwoot.identifier
    // @ts-expect-error
    delete window.$chatwoot.user
    // @ts-expect-error
    window?.$chatwoot.reset()
  }
}, { immediate: true, throttle: 1000 })
</script>

<template>
  <button v-if="account && safeAddress" class="contents" type="button" @click="openMessagePopup">
    <div style="z-index: 30 !important;" :class="open ? 'woot--hide' : ''" class="woot-widget-bubble woot-elements--right">
      <svg width="24" height="24" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M240.808 240.808H122.123C56.6994 240.808 3.45695 187.562 3.45695 122.122C3.45695 56.7031 56.6994 3.45697 122.124 3.45697C187.566 3.45697 240.808 56.7031 240.808 122.122V240.808Z" fill="#FFFFFF" /></svg>
    </div>
    <div :class="!open ? 'woot--hide' : ''" class="woot-elements--right woot-widget-bubble woot--close" :style="open ? { opacity: '1 !important', visibility: 'visible !important', zIndex: '99999 !important', bottom: '20px' } : undefined" />
  </button>
</template>
