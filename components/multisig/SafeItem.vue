<script setup lang="ts">
const props = defineProps<{
  address: string
  chainId: number | string
  owner: boolean
}>()

const { account } = useWeb3()
const { selectedSafe } = storeToRefs(useSafe())
const { isAccountCanSign } = useMultisig()

const selectedAddresses = inject<Ref<string[]>>('selectedAddresses')
const selectedChainId = inject<Ref<number | string>>('selectedChainId')

const canSign = computed(() => isAccountCanSign(props.chainId, account.value, selectedSafe.value?.owner_address))

const { getContactNameByAddress } = useContacts()

const contactName = computed(() => {
  return getContactNameByAddress(props.address)
})

const isDisabled = computed(() => {
  if (!selectedChainId?.value)
    return false

  return selectedChainId.value !== props.chainId
})

const errorMessage = computed(() => {
  if (isDisabled.value)
    return 'Deselect current chain addresses to select a different chain'

  if (!canSign.value)
    return 'You are not a signer on this network'
})

function handleInput() {
  if (!selectedAddresses?.value)
    return

  if (selectedAddresses?.value.includes(props.address))
    selectedAddresses.value = selectedAddresses.value.filter(address => address !== props.address)

  else
    selectedAddresses.value = [...selectedAddresses.value, props.address]
}
</script>

<template>
  <div class="flex items-center justify-between p-[18px] sm:py-6.5 sm:px-7.5 border-b-1 last:border-b-0 border-slate-150 dark:border-slate-800 w-full">
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center sm:gap-5 gap-3 flex-1 flex-wrap">
        <AuthorityAvatar
          :address="address"
          class="-mr-2 shrink-0"
        />
        <span class="sm:block hidden">
          <span v-if="contactName" class="text-white">
            ({{ contactName }})
            <span class="text-slate-400">
              {{ address }}
            </span>
          </span>
          <span v-else>
            {{ address }}
          </span>
        </span>
        <span class="dark:text-white text-xs flex text-slate-900 sm:hidden flex-col sm:ml-0 ml-2.5">

          <span>
            <span v-if="contactName" class="text-slate-400">
              {{ contactName }}
            </span>

            <span v-if="owner" class="text-slate-400">
              (Owner)
            </span>
          </span>
          {{ shortenHash(address) }}</span>
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

        <span v-if="owner" class="sm:block hidden">
          (Owner)
        </span>
      </div>
      <label
        v-if="!owner" v-tippy="{
          content: errorMessage || null,
        }" :for="`input-${address}-${chainId}`"
      >
        <input :id="`input-${address}-${chainId}`" :disabled="isDisabled || !canSign" :value="address" class="peer sr-only" type="checkbox" @change="selectedChainId = chainId" @input="handleInput">
        <SvgoCheckCircle class="svg-circle cursor-pointer darker text-slate-500 peer-checked:success-circle" />
      </label>
    </div>
  </div>
</template>
