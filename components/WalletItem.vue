<script setup lang="ts">
defineProps<{
  authority: IAuthority
  active?: Boolean
}>()
</script>

<template>
  <div
    :class="{
      'dark:bg-slate-850 bg-slate-50': active,
      'dark:bg-gray-850 bg-slate-150': !active,
    }" class="px-4 flex justify-between py-3.5 border rounded-2xl border-slate-150 dark:border-slate-750"
  >
    <div>
      <p class="leading-[10px] text-primary mb-2.5">
        Personal
      </p>
      <p class="text-sm leading-[18px] mb-[6px]">
        {{ shortenHash(authority.address) }}
      </p>
      <p class="text-slate-400 leading-[18px] text-sm">
        {{ formatUsd('134785.50') }}
      </p>
    </div>
    <div>
      <SvgoCheckCircle
        :class="{
          'success-circle': active,
          'svg-circle darker': !active,
        }"
        class="h-6 w-6"
      />
    </div>
  </div>
</template>
