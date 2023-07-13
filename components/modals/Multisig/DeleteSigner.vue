<script setup lang=ts>
const props = defineProps<{
  addresses: string[]
  chainId: number | string
}>()

const emit = defineEmits(['resolve', 'destroy'])

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
    <h1 class="text-lg flex gap-[14px] p-7.5">
      <div class="w-10 h-10 shrink-0 rounded-full text-lg bg-primary items-center justify-center flex text-white">
        1
      </div>
      <p class="flex flex-col gap-2">
        <span class="leading-[26px]">
          Are you sure you want <br> to delete the following signers from?

        </span>
        <span class="block sm:text-sm text-xs text-slate-400 font-medium">
          On <ChainLogo class="w-5 h-5 shrink-0 inline-block" :chain="chainId" />  {{ chainIdToName(chainId) }}</span>
      </p>
    </h1>
    <hr class="border-slate-150 dark:border-slate-800">
    <ul class="text-sm flex gap-[26px] p-7.5 flex-col">
      <li v-for="address in reactiveAddresses" :key="address" class="flex gap-3 items-center justify-between">
        <div class="flex gap-3 items-center">
          <AuthorityAvatar :address="address" />
          <span style="overflow-wrap: anywhere" class="text-slate-400 font-medium">
            {{ address }}
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
