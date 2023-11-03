<script lang="ts" setup>
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

const loadingClass = computed(() => ({
  'loading-box': props.loading,
  'dark:bg-gray-900 bg-slate-150': !props.loading,
}))
</script>

<template>
  <tr>
    <td class="w-1/3 py-6 pl-7.5 text-left">
      <div class="flex space-x-3">
        <div :class="loadingClass" class="flex h-10 w-10 items-center justify-center rounded-full" />

        <div class="space-y-1">
          <div :class="loadingClass" class="h-5 w-20 rounded-5" />

          <div :class="loadingClass" class="h-5 w-32 rounded-5" />
        </div>
      </div>
    </td>
    <td class="py-6">
      <div :class="loadingClass" class="h-5 w-[120px] rounded-5" />
    </td>
    <td class="py-6">
      <div :class="loadingClass" class="mx-auto h-5 w-20 rounded-5" />
    </td>
    <td class="py-6 pl-10">
      <div :class="loadingClass" class="h-5 w-[60px] rounded-5" />
    </td>
    <td class="flex items-center justify-center gap-[15px] py-6">
      <div :class="loadingClass" class="h-9 w-9 rounded-5" />
      <div :class="loadingClass" class="h-9 w-9 rounded-5" />
      <div :class="loadingClass" class="h-9 w-9 rounded-5" />
    </td>
  </tr>
</template>
