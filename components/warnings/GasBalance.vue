<script lang="ts" setup>
import { storeToRefs } from "pinia";
const { gasBalance } = storeToRefs(useSafe());
const { account, chainId } = useWeb3()

const isGasBalanceInsufficient = computed(() => {
  return account.value && chainId.value === 634 && lte(gasBalance.value, 0.1);
});

</script>
<template>
   <div v-if="isGasBalanceInsufficient" class="container mb-8">
     <div  class="bg-orange-500 gap-[15px] w-full justify-center flex bg-opacity-10 text-orange-500 rounded-5 p-4 text-sm text-center">
        <span class="text-xs self-center">
         Your gas balance is insufficient. Please top up to trigger transactions.
        </span>
        <CommonButton size="sm" @click="openTopUpGasModal()">Top up</CommonButton>
    </div>
   </div>
</template>