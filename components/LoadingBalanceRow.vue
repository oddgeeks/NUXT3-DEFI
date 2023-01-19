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
    <td class="pl-7.5 pr-10 py-6">
      <div class="flex space-x-3">
       <div :class="loadingClass" class="w-10 h-10 rounded-full flex items-center justify-center">
          <svg class="text-slate-400" width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M10.0007 0C4.47744 0 0 4.47744 0 10.0007C0 15.5239 4.47744 20.0013 10.0007 20.0013C15.5239 20.0013 20.0013 15.5239 20.0013 10.0007C20.0013 7.34831 18.9477 4.80461 17.0722 2.92912C15.1967 1.05364 12.653 0 10.0007 0ZM10.0023 18.001C5.58378 18.001 2.00182 14.4191 2.00182 10.0005C2.00182 5.58195 5.58378 2 10.0023 2C14.4209 2 18.0029 5.58195 18.0029 10.0005C18.0029 12.1224 17.16 14.1574 15.6596 15.6577C14.1592 17.1581 12.1242 18.001 10.0023 18.001ZM3.99887 9.45083C4.25575 6.54619 6.56366 4.24671 9.46922 4.00047C9.61233 3.99159 9.75237 4.04458 9.85376 4.14597C9.95515 4.24736 10.0081 4.3874 9.99926 4.53051V5.53057C9.99053 5.77515 9.8027 5.97579 9.55923 6.0006C7.6808 6.19802 6.19642 7.68241 5.999 9.56083C5.97294 9.81565 5.75503 10.0074 5.49896 10.0009H4.4989C4.35906 9.99945 4.22568 9.94177 4.12887 9.84085C4.03766 9.73203 3.99119 9.59262 3.99887 9.45083Z" fill="#94A3B8"/>
          </svg>
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
    <td class="px-10 py-6">
      <div :class="loadingClass" class="rounded-5 w-20 h-5"></div>
    </td>
    <td class="py-6">
      <div :class="loadingClass" class="rounded-5 w-[60px] h-5"></div>
    </td>
    <td class="px-7.5 py-6 flex items-center gap-[15px]">
      <div :class="loadingClass" class="rounded-5 w-9 h-9"></div>
      <div :class="loadingClass" class="rounded-5 w-9 h-9"></div>
      <div :class="loadingClass" class="rounded-5 w-9 h-9"></div>
    </td>
  </tr>
</template>
