<script setup lang="ts">
const router = useRouter();
const { trackingAccount } = useAccountTrack();

const disconnect = () => {
  trackingAccount.value = null;
  router.go(0);
};
</script>

<template>
    <div
      class="w-full h-9 bg-blue-500 bg-opacity-10 shrink-0 flex justify-center items-center gap-[15px]"
    >
      <p class="text-xs text-blue-500">
        Tracking account: {{ shortenHash(trackingAccount) }}
      </p>
      <button @click="disconnect" class="text-red-alert text-xs">
        (Disconnect)
      </button>
    </div>
</template>
