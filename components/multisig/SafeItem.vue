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
  <div class="flex w-full items-center justify-between border-b-1 border-slate-150 p-[18px] last:border-b-0 dark:border-slate-800 sm:px-7.5 sm:py-6.5">
    <div class="flex w-full items-center justify-between">
      <div class="flex flex-1 flex-wrap items-center gap-3 sm:gap-5">
        <AuthorityAvatar
          :address="address"
          class="-mr-2 shrink-0"
        />
        <span class="hidden sm:block">
          <span class="flex flex-col items-baseline gap-1 text-white">
            <span>
              <span v-if="contactName">
                {{ contactName }}
              </span>
              <button v-else class="text-sm font-medium text-primary" @click="openAddContactModal(undefined, address)">
                Save as Contact
              </button>
              <span v-if="owner" class="text-slate-400">
                (Owner)
              </span>
            </span>
            <span class="text-slate-400">
              {{ address }}
            </span>
          </span>
        </span>
        <span class="ml-2.5 flex min-w-[135px] flex-col gap-1 text-xs text-slate-900 dark:text-white sm:ml-0 sm:hidden">
          <span>
            <span v-if="contactName" class="text-slate-400">
              {{ contactName }}
            </span>

            <button v-else class="text-sm font-medium text-primary" @click="openAddContactModal(undefined, address)">
              Save as Contact
            </button>

            <span v-if="owner" class="text-slate-400">
              (Owner)
            </span>
          </span>
          {{ shortenHash(address) }}
        </span>
        <Copy icon-only :text="address">
          <template #copy>
            <div
              class="flex h-7.5  w-7.5 rounded-full bg-slate-150 dark:bg-slate-800"
            >
              <SvgoCopy class="m-auto h-[14px] w-[14px] text-slate-400" />
            </div>
          </template>
        </Copy>

        <NuxtLink external target="_blank" :to="getExplorerUrl(chainId, `/address/${address}`)" class="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-150 dark:bg-slate-800">
          <SvgoExternalLink class="w-4 text-slate-400" />
        </NuxtLink>
      </div>
      <label
        v-if="!owner" v-tippy="{
          content: errorMessage || null,
          hideOnClick: false,
        }" :for="`input-${address}-${chainId}`"
      >
        <input :id="`input-${address}-${chainId}`" :disabled="isDisabled || !canSign" :value="address" class="peer sr-only" type="checkbox" @change="selectedChainId = chainId" @input="handleInput">
        <SvgoCheckCircle class="svg-circle darker peer-checked:success-circle cursor-pointer text-slate-500" />
      </label>
    </div>
  </div>
</template>
