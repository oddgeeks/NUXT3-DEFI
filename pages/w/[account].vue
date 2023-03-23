<script setup lang="ts">
import { isAddress } from "@ethersproject/address";
import ExclamationCircleSVG from "~/assets/images/icons/exclamation-circle.svg?component";

const router = useRoute();
const account = router.params.account as string;

if (!isAddress(account)) {
  throw { statusCode: 404, message: "Invalid address" };
}
</script>

<template>
  <div class="container flex-1">
    <div class="flex justify-center items-center md:py-32">
      <div
        class="flex flex-col md:flex-row p-5 md:p-10 bg-slate-50 dark:bg-gray-850 rounded-5.5 justify-start md:space-x-6 space-y-6 md:space-y-0"
      >
        <div class="flex items-start">
          <StyledQrCode
            class="rounded-5 mx-auto bg-white overflow-hidden"
            :size="160"
            :margin="7"
            :data="account"
            :key="account"
          />
        </div>
        <div class="flex flex-col space-y-5">
          <div class="font-semibold inline-flex gap-2.5 items-center">
            <ExclamationCircleSVG class="w-4 h-4 text-primary" />
            <span class="flex-1 text-xs leading-5 font-medium">
              Please use the following details to send me funds!
            </span>
          </div>

          <Copy
            class="px-4 py-3 flex items-center text-xs text-wrap justify-between rounded-5 dark:bg-slate-800 bg-slate-100 gap-2 text-left"
            :text="account"
          >
            <template #content>
              {{ account }}
            </template>
          </Copy>

          <span class="font-semibold inline-flex gap-2.5 text-xs">
            Supported Chains
          </span>
          <SupportedChains :account="account" class="!flex justify-between" />
        </div>
      </div>
    </div>
  </div>
</template>
