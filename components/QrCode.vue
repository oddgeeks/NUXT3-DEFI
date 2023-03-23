<script setup>
import ExternalLinkSVG from "~/assets/images/icons/external-link.svg?component";

const { safeAddress } = useAvocadoSafe();
const account = computed(() => safeAddress.value || "0x000000000000000");
</script>
<template>
  <div>
    <div
      class="pt-7.5 pb-6.25 px-7.5 bg-slate-50 dark:bg-gray-850 rounded-5.5 flex flex-col justify-center items-center"
      :class="{ 'blur pointer-events-none': !safeAddress }"
    >
      <StyledQrCode
        class="rounded-5 mx-auto bg-white overflow-hidden"
        :size="140"
        :margin="7"
        :data="account"
        :key="account"
      />

      <Copy class="mt-5" :text="account">
        <template #content>
          {{ shortenHash(account) }}
        </template>
      </Copy>
      <NuxtLink
        :href="`/w/${account}`"
        external
        target="_blank"
        class="inline-flex text-primary text-sm items-center space-x-2 mt-3"
      >
        <span>Payment Link</span>
        <ExternalLinkSVG />
      </NuxtLink>
    </div>
  </div>
</template>
