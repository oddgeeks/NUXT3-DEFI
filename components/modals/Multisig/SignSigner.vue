<script lang="ts" setup>
const props = defineProps<{
  addresses: ISignerAddress[]
  chainIds: number[]
}>()

const emit = defineEmits(['destroy'])
const signs = ref<boolean[]>([])

const allSigned = computed(() => props.chainIds.length === signs.value.length)

async function handleBack() {
  emit('destroy')
  openMultisigSelectNetworkModal(props.addresses, props.chainIds)
}
</script>

<template>
  <div>
    <div class="sm:p-7.5 p-5 flex flex-col gap-7.5">
      <Steps class="mr-10" :total-steps="4" :current-step="4" />
      <div class="flex gap-[14px]">
        <div class="w-10 h-10 shrink-0 rounded-full text-lg bg-primary items-center justify-center flex text-white">
          4
        </div>
        <div class="flex flex-col gap-1">
          <h1 class="text-lg leading-10">
            Sign on networks to proceed
          </h1>
        </div>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <ul class="p-7.5 flex flex-col gap-7">
      <MultisigSignAddSignerItem v-for="chainId in chainIds" :key="chainId" v-model="signs" :chain-id="chainId" :addresses="addresses" />
    </ul>
    <div class="p-7.5 grid grid-cols-2 gap-4">
      <CommonButton class="justify-center" size="lg" color="white" @click="handleBack">
        Back
      </CommonButton>
      <CommonButton v-if="allSigned" class="justify-center" size="lg" @click="$emit('destroy')">
        Close
      </CommonButton>
    </div>
  </div>
</template>
