<script setup lang="ts">
import { isAddress } from "@ethersproject/address";
import ExclamationCircleSVG from "~/assets/images/icons/exclamation-circle.svg?component";
import { serialize } from "error-serializer";

const router = useRoute();
const account = router.params.account as string;
const locale = computed(() =>
  typeof window !== "undefined" ? window.navigator.language : "en"
);
if (!isAddress(account)) {
  throw { statusCode: 404, message: "Post not found" };
}
</script>

<template>
  <div class="container flex-1">
    <div class="flex justify-center items-center py-32">
      <div
        class="flex pt-7.5 pb-6.25 px-7.5 bg-slate-50 dark:bg-gray-850 rounded-5.5 justify-start space-x-6"
      >
        <div>
          <StyledQrCode
            class="rounded-5 mx-auto bg-white overflow-hidden"
            :size="180"
            :margin="7"
            :data="account"
            :key="account"
          />
        </div>
        <div class="flex flex-col space-y-5">
          <h2 class="font-semibold inline-flex gap-2.5 items-center">
            <ExclamationCircleSVG class="w-5 h-5 text-primary" />
            Please use the following details to send me funds!
          </h2>

          <Copy
            class="px-4 py-[9px] flex items-center justify-between rounded-5 dark:bg-slate-800 bg-slate-100 gap-2"
            :text="account"
          >
            <template #content>
              {{ account }}
            </template>
          </Copy>

          <div>
            <h2 class="font-semibold inline-flex gap-2.5">Supported Chains</h2>
            <SupportedChains :account="account" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
