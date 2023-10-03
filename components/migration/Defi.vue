<script setup lang="ts">
const { account } = useWeb3()
const { toggleSelectedDefiForMigration, setDefiForMigration } = useMigration()
const { defaultDefiApis } = useDefi()
const { fetchPositions, positions } = useMigrationDefi()

const networkPreferences = ref(
  [...new Set(defaultDefiApis.map(i => i.chainId))],
)

const filteredPositions = computed(() => {
  const items = positions.value?.filter(item =>
    networkPreferences.value.some(i => i == item.chainId),
  )

  return items || []
})

watch(account, () => {
  if (!account.value)
    return

  fetchPositions()
}, {
  immediate: true,
})
</script>

<template>
  <div>
    <div class="p-5 flex items-center justify-between text-xs font-medium border-b-[1px] dark:border-slate-750 border-white">
      <p class="dark:text-white text-slate-900">Select DeFi for migration</p>
      <button class="text-green-500" @click="() => setDefiForMigration(filteredPositions)">Select All</button>
    </div>
    
    <!-- TODO: check if it's loaded -->
    <MigrationLoadingDefi
      v-if="!filteredPositions?.length"
      v-for="i in 4"
      :key="i"
    />

    <MigrationDefiPosition
      v-for="position in filteredPositions"
      :key="position.id"
      :position="position"
      @toggle-check="() => toggleSelectedDefiForMigration(position)"
    />
  </div>
</template>