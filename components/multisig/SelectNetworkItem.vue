<script setup lang="ts">
import { getAddress } from 'ethers/lib/utils'
import { Tippy } from 'vue-tippy'

const props = defineProps<{
  option: ISafeOptions
  selected: boolean
  addresses: ISignerAddress[]
}>()
defineEmits(['onSelect'])
const { selectedSafe } = storeToRefs(useSafe())
const { isAccountCanSign } = useMultisig()
const { getContactNameByAddress } = useContacts()
const { account } = useWeb3()

const signers = computed(() => {
  const allSigners = selectedSafe.value?.signers || {}
  const signers = allSigners[props.option.chainId] || []

  if (!signers.length)
    signers.push(account.value)

  return signers
})

const disabled = computed(() => {
  if (isAllSignersDuplicate.value)
    return true

  const [address] = props.addresses

  return props.addresses?.length === 1 && signers.value.some(i => getAddress(i) === getAddress(address.address))
})

const duplicateAddresses = computed(() => {
  return props.addresses.filter(address => signers.value.some(i => getAddress(i) === getAddress(address.address)))
})

const isAllSignersDuplicate = computed(() => {
  return duplicateAddresses.value.length === props.addresses.length
})

const canSign = computed(() => {
  if (!account.value || !selectedSafe.value?.owner_address)
    return false

  return isAccountCanSign(props.option.chainId, account.value, selectedSafe.value?.owner_address)
})
</script>

<template>
  <li
    :key="option.chainId" class="rounded-5 border-slate-100 bg-slate-100 dark:border-slate-800 dark:bg-gray-850"
  >
    <div class="p-4 text-sm">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <ChainLogo class="h-[26px] w-[26px]" :chain="option.chainId" />
          {{ chainIdToName(option.chainId) }}
        </div>
        <div
          v-tippy="{
            content: !canSign ? 'You are not a signer on this network' : undefined,
          }"
        >
          <CommonButton
            :disabled="disabled || !canSign"
            :color="selected ? 'white' : 'primary'"
            @click="$emit('onSelect', option.chainId)"
          >
            {{ disabled ? 'Already Added' : selected ? 'Selected' : 'Select' }}
          </CommonButton>
        </div>
      </div>
    </div>
    <template v-if="option">
      <hr class="border-slate-150 dark:border-slate-800">
      <div class="flex flex-col justify-between text-xs sm:flex-row sm:items-center">
        <div class="flex items-center gap-2.5 p-4 sm:p-3">
          <SvgoUserCircle class="h-4 w-4 text-slate-400" />
          {{ signers.length }} existing signers
          <Tippy max-width="none" interactive tag="button" content-tag="div" content-class="content-wrapper">
            <template #default>
              <SvgoInfo2 class="text-slate-500" />
            </template>
            <template #content>
              <ul class="flex flex-col gap-2.5">
                <li v-for="address in signers" :key="address" class="flex items-center gap-2.5 text-xs">
                  <AuthorityAvatar class="h-5 w-5 shrink-0" :address="address" />
                  {{ address }} {{ getContactNameByAddress(address) ? `(${getContactNameByAddress(address)})` : '' }}
                </li>
              </ul>
            </template>
          </Tippy>
        </div>
        <hr class="block border-slate-150 dark:border-slate-800 sm:hidden">
        <div class="p-4 text-slate-400 sm:p-3">
          Threshold:  {{ option?.threshold }}  out of  {{ signers.length }}
        </div>
      </div>
    </template>
    <span v-if="!disabled && duplicateAddresses?.length" class="flex flex-col gap-2.5 p-4 pt-2 text-[10px] text-orange-400">
      <span class="flex items-center gap-2.5">
        <SvgoInfo2 class="w-4 font-medium" />
        {{ duplicateAddresses.length }} {{ duplicateAddresses.length > 1 ? 'addresses are' : 'address is' }} already a signer on {{ chainIdToName(option.chainId) }} & will be skipped.
      </span>
    </span>
  </li>
</template>
