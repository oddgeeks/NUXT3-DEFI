<script setup lang='ts'>
const props = defineProps({
  chainId: {
    type: [String, Number],
    required: true,
  },
  address: {
    type: String,
    required: false,
  },
  contact: {
    type: Object as PropType<IContact>,
    required: false,
  },
})
defineEmits(['destroy'])

const { initialize, steps, activeStep, reset, isCrossChain, data } = useSend()
const contact = ref<IContact | undefined>(props.contact)

initialize({
  fromChainId: +props.chainId,
  address: props.address,
  contact: props.contact,
})

async function handleEdit() {
  if (!props.contact)
    return

  const result = await openAddContactModal(
    props.contact.name,
    props.contact.address,
    props.contact.chainId,
    true,
  )

  if (result.success) {
    contact.value = result.payload as IContact

    data.value.address = contact.value.address
  }
}
onUnmounted(() => {
  reset()
})
</script>

<template>
  <div>
    <h1 class="text-center mb-7.5 text-lg">
      {{ isCrossChain ? 'Cross-chain Send' : 'Send' }}
      <span v-if="contact"> to {{ contact.name }}  </span>
    </h1>
    <div
      v-if="contact"
      class="flex items-center rounded-5 mb-5 -mt-3 pl-5 pr-4 py-5 dark:bg-gray-850 bg-slate-50 justify-between w-full"
    >
      <div class="flex items-center gap-3">
        <ChainLogo :stroke="false" class="w-7 h-7" :chain="contact.chainId" />
        <Copy :text="contact.address">
          <template #content>
            <span class="dark:text-white text-slate-900">{{
              shortenHash(contact.address)
            }}</span>
          </template>
        </Copy>
      </div>
      <CommonButton
        :disabled="contact.owner"
        color="white"
        class="justify-center dark:bg-slate-800 bg-slate-150 !px-4"
        @click="handleEdit()"
      >
        Edit
      </CommonButton>
    </div>
    <ul class="flex gap-2.5 justify-center mb-7.5">
      <li v-for="(step, index) in steps" :key="index" class="flex gap-2.5">
        <div class="flex flex-col items-center justify-center gap-2.5">
          <div class="flex items-center justify-center flex-col gap-2.5">
            <div
              :class="index <= activeStep ? 'bg-primary' : 'bg-slate-800'"
              class="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
            >
              {{ index + 1 }}
            </div>
            <span :class="index <= activeStep ? '' : 'text-slate-500'" class="text-xs leading-5">
              {{ step.name }}
            </span>
          </div>
        </div>
        <div
          v-if="index + 1 < steps.length" :class="{
            'animation': index < activeStep,
            'bg-slate-750': index >= activeStep,
          }" class="w-[60px] h-1 rounded-[10px] mt-[18px] bg-slate-750 relative divider"
        />
      </li>
    </ul>

    <component :is="steps[activeStep].component" @destroy="$emit('destroy')" />
  </div>
</template>

<style scoped>
.animation:after {
  width: 100% !important;
}

.divider:after {
  content: '';
  transition: width 200ms ease-in-out;
  @apply absolute bg-primary w-0 h-full rounded-[inherit];
}
</style>
