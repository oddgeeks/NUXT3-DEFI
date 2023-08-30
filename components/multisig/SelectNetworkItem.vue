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
    :key="option.chainId" class="dark:border-slate-800 border-slate-100 bg-slate-100 dark:bg-gray-850 rounded-5"
  >
    <div class="p-4 text-sm">
      <div class="flex items-center justify-between">
        <div class="flex gap-3 items-center">
          <ChainLogo class="w-[26px] h-[26px]" :chain="option.chainId" />
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
      <div class="flex sm:items-center text-xs justify-between sm:flex-row flex-col">
        <div class="flex sm:p-3 p-4 items-center gap-2.5">
          <SvgoUserCircle class="w-4 h-4 text-slate-400" />
          {{ signers.length }} existing signers
          <Tippy max-width="none" interactive tag="button" content-tag="div" content-class="content-wrapper">
            <template #default>
              <SvgoInfo2 class="text-slate-500" />
            </template>
            <template #content>
              <ul class="flex flex-col gap-2.5">
                <li v-for="address in signers" :key="address" class="flex text-xs items-center gap-2.5">
                  <AuthorityAvatar class="shrink-0 w-5 h-5" :address="address" />
                  {{ address }} {{ getContactNameByAddress(address) ? `(${getContactNameByAddress(address)})` : '' }}
                </li>
              </ul>
            </template>
          </Tippy>
        </div>
        <hr class="border-slate-150 sm:hidden block dark:border-slate-800">
        <div class="text-slate-400 sm:p-3 p-4">
          Threshold:  {{ option?.threshold }}  out of  {{ signers.length }}
        </div>
      </div>
    </template>
    <span v-if="!disabled && duplicateAddresses?.length" class="text-[10px] p-4 flex flex-col gap-2.5 pt-2 text-orange-400">
      <span class="flex items-center gap-2.5">
        <SvgoInfo2 class="w-4 font-medium" />
        {{ duplicateAddresses.length }} {{ duplicateAddresses.length > 1 ? 'addresses are' : 'address is' }} already a signer on {{ chainIdToName(option.chainId) }} & will be skipped.
      </span>
    </span>
  </li>
</template>
