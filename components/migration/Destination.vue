<template>
  <div>
    <h2 class="text-white text-base font-semibold mb-5">Migrate to</h2>

    <!-- <UiInput
      placeholder="Search name"
      name="search"
      @input="(event) => searchInput = event.target.value"
    >
      <template #icon>
        <img src="~/assets/images/search.svg" alt="Search" />
      </template>
    </UiInput> -->

    <MigrationWalletItem
      v-if="mainSafe"
      :safe="mainSafe"
      v2
      primary
      @click="handleSelect(mainSafe)"
    />
    <MigrationWalletItem
      v-if="multiSigSafe"
      class="mt-4"
      :safe="multiSigSafe"
      primary
      @click="handleSelect(multiSigSafe)"
    />
  </div>
</template>

<script setup lang="ts">
const { mainSafe, multiSigSafe } = storeToRefs(useSafe())

const handleSelect = (safe: ISafe) => {
  openMigrationModal(safe)
}
</script>