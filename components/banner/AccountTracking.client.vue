<script setup lang="ts">
import { getAddress } from 'ethers/lib/utils'

const router = useRouter()
const route = useRoute()
const { trackingAccount } = useAccountTrack()
const { getSafes } = useSafe()
const { accountSafeMapping } = storeToRefs(useSafe())

async function disconnect() {
  const selectedEOAAddress = window.ethereum.selectedAddress
  const paramSafe = route.params.safe as string

  if (paramSafe && selectedEOAAddress) {
    const { data: safes } = await getSafes(selectedEOAAddress)

    const isSafeExist = safes.some(safe => safe.multisig === 1 && getAddress(safe.safe_address) === getAddress(paramSafe))
    const fallbackMultisigSafe = safes.find(safe => safe.multisig === 1)
    const cachedSafeAddress = accountSafeMapping.value[getAddress(selectedEOAAddress)]

    if (isSafeExist) {
      trackingAccount.value = ''
      router.go(0)
      return
    }
    else if (cachedSafeAddress || fallbackMultisigSafe) {
      const actualSafeAddress = cachedSafeAddress || fallbackMultisigSafe?.safe_address!
      const matched = route.matched[0]?.path || ''
      const path = matched.replace(':safe()', actualSafeAddress)

      trackingAccount.value = ''

      if (path)
        window.location.assign(path)
      else
        window.location.assign('/')

      return
    }
  }

  trackingAccount.value = ''
  router.go(0)
}
</script>

<template>
  <div
    class="w-full h-9 bg-primary bg-opacity-10 shrink-0 fixed sm:relative z-50 top-0 flex justify-center items-center gap-[15px]"
  >
    <p class="text-xs text-primary">
      Tracking account: {{ shortenHash(trackingAccount!) }}
    </p>
    <button class="text-red-alert text-xs" @click="disconnect">
      (Disconnect)
    </button>
  </div>
</template>
