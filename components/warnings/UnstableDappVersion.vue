<script setup lang="ts">
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";

const { unstableDappNetworks } = useBanner();

const formatted = computed(() => {
  const formatter = new Intl.ListFormat("en", {
    style: "long",
    type: "conjunction",
  });

  return formatter.format([
    ...new Set(
      unstableDappNetworks.value.map((network) => {
        return chainIdToName(network.chainId);
      })
    ),
  ]);
});
</script>

<template>
  <div class="bg-orange-400 rounded-5 flex gap-2.5 bg-opacity-20 p-[14px]">
    <SVGInfo class="text-orange-400 w-5 h-5 shrink-0" />
    <div class="flex flex-col gap-2">
      <p class="text-xs text-orange-400 leading-5">
        Your Avocado wallet is not yet deployed on {{ formatted }}
        - some dapp connections might break. Perform a chain specific in-app
        transaction first to resolve this.
      </p>
    </div>
  </div>
</template>
