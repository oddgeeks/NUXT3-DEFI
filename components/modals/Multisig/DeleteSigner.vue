<script setup lang=ts>
const props = defineProps<{
  addresses: string[]
  chainId: number | string
}>()

const emit = defineEmits(['resolve', 'destroy'])
const { getContactNameByAddress } = useContacts()

const reactiveAddresses = ref(props.addresses)

function removeAddress(address: string) {
  reactiveAddresses.value = reactiveAddresses.value.filter(a => a !== address)
}

watch(reactiveAddresses, () => {
  if (!reactiveAddresses.value.length)
    emit('destroy')
})
</script>

<template>
  <div class="flex flex-col">
    <div class="flex flex-col gap-7.5 p-6 sm:p-7.5">
      <Steps class="mr-10" :current-step="1" :total-steps="3" />

      <div class="flex gap-[14px] text-lg">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg text-white">
          1
        </div>
        <div class="flex flex-col gap-4">
          <h1 class="leading-[26px]">
            Are you sure you want <br> to delete the following signers?
          </h1>
          <span class="block text-xs font-medium text-gray-400 sm:text-sm">
            On <ChainLogo class="inline-block h-5 w-5 shrink-0" :chain="chainId" />  {{ chainIdToName(chainId) }}</span>
        </div>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-gray-800">
    <ul class="flex flex-col gap-[26px] p-6 text-sm sm:p-7.5">
      <li v-for="address in reactiveAddresses" :key="address" class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <AuthorityAvatar :address="address" />
          <span style="overflow-wrap: anywhere" class="font-medium text-gray-400">
            <span v-if="getContactNameByAddress(address)" class="text-white">
              ({{ getContactNameByAddress(address) }})
              <span class="text-gray-400">
                {{ address }}
              </span>
            </span>
            <span v-else>
              {{ address }}
            </span>
          </span>
        </div>
        <button class="text-gray-400" @click="removeAddress(address)">
          <SvgoX />
        </button>
      </li>
    </ul>
    <hr class="border-slate-150 dark:border-gray-800">
    <div class="flex gap-4 p-7.5">
      <CommonButton size="lg" class="flex-1 justify-center" color="white" @click="$emit('destroy')">
        Cancel
      </CommonButton>
      <CommonButton :disabled="!reactiveAddresses.length" size="lg" color="red" class="flex-1 justify-center" @click="$emit('resolve', true, reactiveAddresses)">
        Delete
      </CommonButton>
    </div>
  </div>
</template>
