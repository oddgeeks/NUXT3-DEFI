<script setup lang="ts">
import SVGInfo from '~/assets/images/icons/exclamation-circle.svg?component'

const { unstableDappNetworks } = useBanner()

const formatted = computed(() => {
  const formatter = new Intl.ListFormat('en', {
    style: 'long',
    type: 'conjunction',
  })

  return formatter.format([
    ...new Set(
      unstableDappNetworks.value.map((network) => {
        return chainIdToName(network.chainId)
      }),
    ),
  ])
})
</script>

<template>
  <div class="flex items-start gap-2">
    <SVGInfo class="h-5 w-5 shrink-0 text-orange-400" />
    <p class="text-xs leading-5 text-orange-400">
      Your Avocado wallet is not yet deployed on {{ formatted }} - some dapp
      connections might break.
      <NuxtLink to="/upgrade" class="text-xs text-primary">
        Deploy Now
      </NuxtLink>
    </p>
  </div>
</template>
