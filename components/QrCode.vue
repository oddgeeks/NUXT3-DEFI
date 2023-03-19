<script setup>
const { safeAddress } = useAvocadoSafe();
const account = computed(() => safeAddress.value || "0x000000000000000");
</script>
<template>
  <div>
    <div
      class="pt-7.5 pb-6.25 px-7.5 bg-slate-50 dark:bg-gray-850 rounded-5.5 flex flex-col justify-center items-center"
    >
      <StyledQrCode
        class="rounded-5 mx-auto bg-white overflow-hidden"
        :size="140"
        :margin="7"
        :data="account"
        :key="account"
        :class="{ blur: !safeAddress }"
      />

      <Copy class="mt-5" :text="account" :class="{ blur: !safeAddress }">
        <template #content>
          {{ shortenHash(account) }}
        </template>
      </Copy>
    </div>
  </div>
</template>