<script setup lang='ts'>
const props = defineProps({
  chainId: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
})

const { initialize, steps, activeStep, reset } = useSend()

initialize({
  fromChainId: +props.chainId,
  tokenAddress: props.address,
})

onUnmounted(() => {
  reset()
})
</script>

<template>
  <div>
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

    <component :is="steps[activeStep].component" />
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
