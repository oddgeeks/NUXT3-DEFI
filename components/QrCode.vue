<script setup>
import ExternalLinkSVG from "~/assets/images/icons/external-link.svg?component";

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
      <a
        :href="`/w/${account}`"
        class="inline-flex text-primary items-center space-x-2 mt-3"
      >
        <span>Payment Link</span>
        <ExternalLinkSVG />
      </a>
    </div>
  </div>
</template>
