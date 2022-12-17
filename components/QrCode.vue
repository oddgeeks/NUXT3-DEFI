<script setup>
import CopySVG from "~/assets/images/icons/copy.svg?component";
import CheckCircle from "~/assets/images/icons/check-circle.svg?component";

import QrcodeVue from "qrcode.vue";
const { safeAddress } = useAvocadoSafe();
const { copy, copied } = useClipboard();
const account = computed(() => safeAddress.value || "0x000000000000000");

const shortenAddress = () => {
  return account.value.substr(0, 6) + "..." + account.value.substr(-4);
};
</script>
<template>
  <div>
    <h2 class="font-semibold mb-5">QR to Receive</h2>

    <div
      class="py-7.5 px-5.5 bg-gray-850 rounded-5.5 flex flex-col justify-center items-center"
      :class="{ blur: !safeAddress }"
    >
      <!-- <QrcodeVue :size="140" :margin="5" level="M" :value="account" foreground="#052740"
                class="rounded-[20px] mx-auto" /> -->

      <StyledQrCode
        class="rounded-[20px] mx-auto bg-white overflow-hidden"
        :data="account"
        :key="account"
      />

      <button
        class="text-slate-400 font-semibold mt-5 inline-flex items-center gap-2.5"
        @click="copy(account)"
      >
        <Transition mode="out-in" name="slide-left">
          <span v-if="copied"> Copied </span>
          <span v-else>{{ shortenAddress() }}</span>
        </Transition>

       <Transition mode="out-in" name="slide">
        <CheckCircle v-if="copied" class="w-4 h-4 text-slate-900 svg-circle" />
        <CopySVG v-else />
       </Transition>
      </button>
      <p
        v-if="safeAddress"
        class="mt-4 text-green-400 text-xs font-semibold text-center leading-5"
      >
        Deposit any tokens on Ethereum, Polygon, Arbitrum, Optimism and
        Avalanche.
      </p>
    </div>
  </div>
</template>

<style scoped>
.svg-circle > :deep(path:first-child) {
  @apply stroke-slate-400 fill-slate-400;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.1s ease-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.1s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}
</style>
