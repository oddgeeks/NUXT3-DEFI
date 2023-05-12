<script setup lang="ts">
const router = useRouter()
const { trackingAccount } = useAccountTrack()

function disconnect() {
  trackingAccount.value = ''
  router.go(0)
}
</script>

<template>
  <div
    class="w-full h-9 bg-primary bg-opacity-10 shrink-0 fixed sm:relative z-50 top-0 flex justify-center items-center gap-[15px]"
  >
    <p class="text-xs text-primary">
      Tracking account: {{ shortenHash(trackingAccount) }}
    </p>
    <button class="text-red-alert text-xs" @click="disconnect">
      (Disconnect)
    </button>
  </div>
</template>
