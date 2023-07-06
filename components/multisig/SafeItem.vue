<script setup lang="ts">
defineProps<{
  address: string
  chainId: number | string
  owner: boolean
}>()

const selectedAddresses = toRef(inject<string[]>('selectedAddresses'))
const selectedChainId = toRef(inject<number | string>('selectedChainId'))

// async function handleDeleteSigner(address: string, chainId: string | number) {
//   const { success } = await openDeleteSigner(address)

//   if (success)
//     openDeleteSignerSign(address, chainId)
// }
</script>

<template>
  <div class="flex items-center justify-between py-6.5 px-7.5 border-b-1 last:border-b-0 border-slate-150 dark:border-slate-800 w-full">
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center sm:gap-5 gap-3 flex-1 flex-wrap">
        <AuthorityAvatar
          :address="address"
          class="-mr-2 shrink-0"
        />
        <span class="sm:block hidden">
          {{ address }}
        </span>
        <span class="dark:text-white text-xs text-slate-900 sm:hidden block sm:ml-0 ml-2.5">{{ shortenHash(address) }}</span>
        <Copy icon-only :text="address">
          <template #copy>
            <div
              class="dark:bg-slate-800 bg-slate-150  rounded-full w-7.5 h-7.5 flex"
            >
              <SvgoCopy class="w-[14px] h-[14px] m-auto text-slate-400" />
            </div>
          </template>
        </Copy>

        <NuxtLink external target="_blank" :to="getExplorerUrl(chainId, `/address/${address}`)" class="dark:bg-slate-800 items-center justify-center bg-slate-150 rounded-full w-7.5 h-7.5 flex">
          <SvgoExternalLink class="text-slate-400 w-4" />
        </NuxtLink>

        <span v-if="owner">
          (Owner)
        </span>
      </div>
      <label v-if="!owner" :for="`input${address}`">
        <input :id="`input${address}`" v-model="selectedAddresses" :value="address" class="peer sr-only" type="checkbox" @change="selectedChainId = chainId">
        <SvgoCheckCircle class="svg-circle cursor-pointer darker text-slate-500 peer-checked:success-circle" />
      </label>
    </div>
  </div>
</template>
