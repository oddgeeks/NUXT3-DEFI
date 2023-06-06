<script setup lang="ts">
import SVGInfo from '~/assets/images/icons/exclamation-circle.svg?component'
import SVGX from '~/assets/images/icons/x.svg?component'

const { hideVersionUpdateBanner } = useBanner()
</script>

<template>
  <div
    class="bg-[#fbeadc] dark:bg-[#3d312f] rounded-5 z-30 w-[340px] flex gap-2.5 p-[14px] absolute right-0 top-[66px]"
  >
    <SVGInfo class="text-orange-400 w-5 h-5 shrink-0" />
    <div class="flex flex-col gap-2">
      <p class="text-xs text-orange-400 leading-5">
        Your safe version is out of date. Please update it.
      </p>
      <NuxtLink
        to="/upgrade"
        class="text-primary self-baseline text-xs leading-5"
      >
        Update Safe
      </NuxtLink>
    </div>
    <button class="self-baseline w-5 h-5" @click="hideVersionUpdateBanner">
      <SVGX class="w-3 h-3 text-slate-400" />
    </button>
  </div>
</template>
