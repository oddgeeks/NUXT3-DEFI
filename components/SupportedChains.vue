<script setup lang="ts">
const props = defineProps({
  account: String,
});

const { availableNetworks } = useNetworks();

const sortedNetworks = computed(() => {
  const priorNetworks = [1, 137, 42161, 10, 56, 43114, 100];

  return availableNetworks.sort((a, b) => {
    const aIndex = priorNetworks.indexOf(a.chainId);
    const bIndex = priorNetworks.indexOf(b.chainId);

    if (aIndex === -1 || bIndex === -1) return 0;

    return aIndex - bIndex;
  });
});
</script>

<template>
  <ul class="grid grid-cols-4 gap-5">
    <li
      v-tippy="{
        arrow: true,
        arrowType: 'round',
        animation: 'fade',
        content: network.name,
      }"
      :key="network.chainId"
      v-for="network in sortedNetworks"
    >
      <a
        v-if="props.account"
        target="_blank"
        :href="getExplorerUrl(network.chainId, `/address/${props.account}`)"
      >
        <ChainLogo
          :stroke="false"
          class="w-[26px] h-[26px]"
          :chain="network.chainId"
        />
      </a>

      <ChainLogo
        v-else
        :stroke="false"
        class="w-[26px] h-[26px]"
        :chain="network.chainId"
      />
    </li>
  </ul>
</template>
