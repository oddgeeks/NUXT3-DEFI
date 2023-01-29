<script lang="ts" setup>
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

const loadingClass = computed(() => ({
  'loading-box': props.loading,
  'dark:bg-slate-800 bg-slate-150' : !props.loading,
}))

</script>

<template>
  <tr>
    <td class="pl-7.5 py-6">
      <div class="flex space-x-3">
       <div :class="loadingClass" class="w-10 h-10 rounded-full flex items-center justify-center">
          <ChainLogo />
        </div>

        <div class="space-y-1">
          <div :class="loadingClass" class="rounded-5 w-20 h-5"></div>

          <div :class="loadingClass" class="rounded-5 w-32 h-5"></div>
        </div>
      </div>
    </td>
    <td class="py-6">
      <div :class="loadingClass" class="rounded-5 w-[120px] h-5"></div>
    </td>
    <td class=" py-6">
      <div :class="loadingClass" class="rounded-5 w-20 h-5"></div>
    </td>
    <td class="py-6">
      <div :class="loadingClass" class="rounded-5 w-[60px] h-5"></div>
    </td>
    <td class="py-6 flex justify-center items-center gap-[15px]">
      <div :class="loadingClass" class="rounded-5 w-9 h-9"></div>
      <div :class="loadingClass" class="rounded-5 w-9 h-9"></div>
      <div :class="loadingClass" class="rounded-5 w-9 h-9"></div>
    </td>
  </tr>
</template>
