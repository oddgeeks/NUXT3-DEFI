<script setup lang="ts">
const { account } = useWeb3()
const { toggleSelectedDefiForMigration, setDefiForMigration } = useMigration()
const { defaultDefiApis } = useDefi()
const { fetchPositions, availablePositions } = useMigrationDefi()

const networkPreferences = ref(
  [...new Set(defaultDefiApis.map(i => i.chainId))],
)

const filteredPositions = computed(() => {
  const items = availablePositions.value?.filter(item =>
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
    <div class="flex items-center justify-between border-b-[1px] border-white p-5 text-xs font-medium dark:border-slate-750">
      <p class="text-slate-900 dark:text-white">
        Select DeFi for migration
      </p>
      <button class="text-green-500" @click="() => setDefiForMigration(filteredPositions)">
        Select All
      </button>
    </div>

    <!-- TODO: check if it's loaded -->
    <template v-if="!filteredPositions?.length">
      <MigrationLoadingDefi
        v-for="i in 4"

        :key="i"
      />
    </template>

    <MigrationDefiPosition
      v-for="position in filteredPositions"
      :key="position.id"
      :position="position"
      @toggle-check="() => toggleSelectedDefiForMigration(position)"
    />
  </div>
</template>
