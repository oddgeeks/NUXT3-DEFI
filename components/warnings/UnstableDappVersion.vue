<script setup lang="ts">
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";
import LinkSVG from "~/assets/images/icons/external-link.svg?component";

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
  <p class="text-xs text-orange-400 leading-5 inline-flex gap-2">
    <SVGInfo class="text-orange-400 w-5 h-5 shrink-0" />
    Your Avocado wallet is not yet deployed on {{ formatted }} - some dapp
    connections might break.
    <NuxtLink target="_blank" class="text-orange-500 font-bold inline-flex gap-2" external href="https://help.avocado.instadapp.io/en/articles/7046928-how-to-deploy-wallet-for-first-time-users"> Learn more <LinkSVG class="w-4"/></NuxtLink>
  </p>
</template>
