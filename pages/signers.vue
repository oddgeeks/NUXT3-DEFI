<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { signers, requiredSigners } = storeToRefs(useMultisig())
const { changeThreshold } = useAvocadoSafe()

async function handleDeleteSigner(signer: ISigner) {
  const { success } = await openDeleteSigner(signer)

  if (success)
    openDeleteSignerSign(signer)
}

async function handleTresholdChange(chainId: string | number) {
  const { success, payload } = await openUpdateThresholdModal(chainId, 0)

  if (success && payload) {
    const txHash = await changeThreshold(payload, chainId)

    if (txHash)
      showPendingTransactionModal(txHash, chainId)
  }
}
</script>

<template>
  <div class="flex flex-col gap-10 flex-1">
    <div class="flex flex-col gap-2.5">
      <h2 class="text-base">
        Manage Multisig Signers
      </h2>
      <span class="text-xs text-slate-400 leading-5">
        Signers are addresses that are required to sign transactions before they can be executed on the blockchain.
      </span>
    </div>
    <div class="flex flex-col gap-2">
      <div class="flex flex-col dark:bg-gray-850 bg-slate-50 rounded-[25px]">
        <template v-for="(signer) in signers" :key="signer.address">
          <div class="flex items-center justify-between py-6.5 px-7.5 border-b-1 last:border-b-0 border-slate-150 dark:border-slate-800 w-full">
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center sm:gap-5 gap-3 flex-1 flex-wrap">
                <AuthorityAvatar
                  :address="signer.address"
                  class="-mr-2 shrink-0"
                />
                <span class="sm:block hidden">
                  {{ signer.address }}
                </span>
                <span class="dark:text-white text-xs text-slate-900 sm:hidden block sm:ml-0 ml-2.5">{{ shortenHash(signer.address) }}</span>
                <Copy icon-only :text="signer.address">
                  <template #copy>
                    <div
                      class="dark:bg-slate-800 bg-slate-150  rounded-full w-7.5 h-7.5 flex"
                    >
                      <SvgoCopy class="w-[14px] h-[14px] m-auto text-slate-400" />
                    </div>
                  </template>
                </Copy>
              </div>
              <button @click="handleDeleteSigner(signer)">
                <SvgoTrash />
              </button>
            </div>
          </div>
        </template>
        <div class="flex py-6.5 px-7.5 border-t-1 border-slate-150 dark:border-slate-800">
          <button class="flex items-center text-primary gap-3" @click="openAddSignerModal()">
            <div class="bg-primary w-5 h-5 rounded-full flex">
              <SvgoPlus class="text-white m-auto w-2 h-2" />
            </div>
            Add New Signer
          </button>
        </div>
      </div>
    </div>
    <div>
      <h2 class="mb-2.5">
        Required confirmations
      </h2>
      <p class="text-xs text-slate-400 mb-5">
        Any transaction requires the confirmation of:
      </p>
      <div v-if="requiredSigners.length" class="dark:bg-gray-850 bg-slate-100 px-7.5 py-[26px] text-sm rounded-[25px]">
        <span v-for="item of requiredSigners" :key="item.chainId" class="flex items-center gap-2.5">
          <ChainLogo class="w-5 h-5" :chain="item.chainId" />
          <span>
            {{ item.requiredSignerCount }} out of {{ item.signerCount }}
          </span>
          <button class="text-primary ml-4" @click="handleTresholdChange(item.chainId)">
            Change
          </button>
        </span>
      </div>
    </div>
  </div>
</template>
