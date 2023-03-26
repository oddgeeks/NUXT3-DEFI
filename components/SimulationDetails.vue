<script lang="ts" setup>
import SVGInfoCircle from "~/assets/images/icons/exclamation-circle.svg?component";
import ChevronDownSVG from "~/assets/images/icons/chevron-down.svg?component";

defineProps<{
  details: ISimulation;
  chainId: string;
}>();
</script>

<template>
  <details>
    <summary>
      <div
        class="text-xs justify-center text-center text-orange-400 flex items-center gap-[6px]"
      >
        <SVGInfoCircle />
        Token Transfer & Approval Detected
        <ChevronDownSVG class="w-4" />
      </div>
    </summary>

    <ul class="grid grid-cols-2 gap-x-[10px] gap-y-5 mt-5">
      <li :key="k" v-for="(item, k) in details.balanceChange.approveTokens">
        <SimulationTokenCard
          type="approve"
          :chainId="chainId"
          :payload="item"
        />
      </li>
      <li :key="k" v-for="(item, k) in details.balanceChange.receiveTokens">
        <SimulationTokenCard
          type="recieve"
          :chainId="chainId"
          :payload="item"
        />
      </li>
      <li :key="k" v-for="(item, k) in details.balanceChange.sendTokens">
        <SimulationTokenCard type="send" :chainId="chainId" :payload="item" />
      </li>
    </ul>
  </details>
</template>
