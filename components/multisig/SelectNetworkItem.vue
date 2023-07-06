<script setup lang="ts">
const props = defineProps<{
  network: Network
  selected: boolean
}>()
defineEmits(['onSelect'])
const { requiredSigners } = storeToRefs(useMultisig())

const signer = computed(() => requiredSigners.value.find((signer: any) => signer.chainId == props.network.chainId))
</script>

<template>
  <li
    :key="network.chainId" class="dark:border-slate-800 border-slate-100 bg-slate-100 dark:bg-gray-850 rounded-5"
  >
    <div class="p-4 text-sm">
      <div class="flex items-center justify-between">
        <div class="flex gap-3 items-center">
          <ChainLogo class="w-[26px] h-[26px]" :chain="network.chainId" />
          {{ network.name }}
        </div>
        <CommonButton
          :color="selected ? 'white' : 'primary'"
          @click="$emit('onSelect', network.chainId)"
        >
          {{ selected ? 'Selected' : 'Select' }}
        </CommonButton>
      </div>
    </div>
    <template v-if="signer">
      <hr class="border-slate-150 dark:border-slate-800">
      <div class="flex p-3 items-center text-xs justify-between">
        <div class="flex items-center gap-2.5">
          <SvgoUserCircle class="w-4 h-4 text-slate-400" />
          {{ signer?.signerCount }} existing signers
        </div>
        <div class="text-slate-400">
          Threshold:  {{ signer?.requiredSignerCount }}  out of  {{ signer?.signerCount }}
        </div>
      </div>
    </template>
  </li>
</template>
