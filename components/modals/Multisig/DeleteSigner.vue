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
    <div class="p-6 sm:p-7.5 flex flex-col gap-7.5">
      <Steps class="mr-10" :current-step="1" :total-steps="3" />

      <div class="text-lg flex gap-[14px]">
        <div class="w-10 h-10 shrink-0 rounded-full text-lg bg-primary items-center justify-center flex text-white">
          1
        </div>
        <div class="flex flex-col gap-4">
          <h1 class="leading-[26px]">
            Are you sure you want <br> to delete the following signers?
          </h1>
          <span class="block sm:text-sm text-xs text-slate-400 font-medium">
            On <ChainLogo class="w-5 h-5 shrink-0 inline-block" :chain="chainId" />  {{ chainIdToName(chainId) }}</span>
        </div>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <ul class="text-sm flex gap-[26px] p-6 sm:p-7.5 flex-col">
      <li v-for="address in reactiveAddresses" :key="address" class="flex gap-3 items-center justify-between">
        <div class="flex gap-3 items-center">
          <AuthorityAvatar :address="address" />
          <span style="overflow-wrap: anywhere" class="text-slate-400 font-medium">
            <span v-if="getContactNameByAddress(address)" class="text-white">
              ({{ getContactNameByAddress(address) }})
              <span class="text-slate-400">
                {{ address }}
              </span>
            </span>
            <span v-else>
              {{ address }}
            </span>
          </span>
        </div>
        <button class="text-slate-400" @click="removeAddress(address)">
          <SvgoX />
        </button>
      </li>
    </ul>
    <hr class="border-slate-150 dark:border-slate-800">
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
