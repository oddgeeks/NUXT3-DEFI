<template>
  <div>
    <h2 class="text-white text-base font-semibold mb-5">Migrate To</h2>

    <!-- <UiInput
      placeholder="Search name"
      name="search"
      @input="(event) => searchInput = event.target.value"
    >
      <template #icon>
        <img src="~/assets/images/search.svg" alt="Search" />
      </template>
    </UiInput> -->

    <MigrationWalletItem v-if="mainSafe" v2 primary :safe="mainSafe" />
    <MigrationWalletItem class="mt-4" v-if="multiSigSafe" primary :safe="multiSigSafe" />

    <!-- <MigrateToModal
      :show="!!(selectedWalletAddress?.length && selectedWallet && balances?.length && tokenList?.tokens?.length)"
      :selectedWallet="selectedWallet"
      :balances="balances"
      :tokenList="tokenList?.tokens"
      @close="selectedWalletAddress = ''"
    /> -->
  </div>
</template>

<script setup lang="ts">
const { mainSafe, multiSigSafe } = storeToRefs(useSafe())

const searchInput = ref('');
const selectedWalletAddress = ref('');

const selectWallet = (walletAddress: string) => {
  selectedWalletAddress.value = walletAddress;
};

// const selectedWallet = computed(() => wallets.value.find((wallet) => wallet.address === selectedWalletAddress.value));
</script>