<script setup lang="ts">
import SVGX from '~/assets/images/icons/x.svg?component'

const { hideRabbyBanner } = useBanner()
</script>

<template>
  <div
    class="w-full max-w-[832px] mx-auto text-xs relative bg-[#4CA054] bg-opacity-60 py-[15px] px-5 sm:rounded-5 backdrop-blur shrink-0 flex flex-col sm:flex-row justify-between items-center gap-[15px]"
  >
    <div class="flex space-x-[25px] items-start sm:items-center">
      <span class="text-2xl">
        🐇
      </span>
      <p class="leading-5 w-5/6 sm:w-fit">
        Want to see Avocado support on <NuxtLink class="underline inline-flex" target="_blank" external to="http://rabby.io">
          Rabby.io?
        </NuxtLink> Take a moment to vote and show support for Avocado Network on Rabby.
      </p>
    </div>
    <div class="flex space-x-5 items-center w-full sm:w-fit">
      <CommonButton
        as="NuxtLink"
        href="https://debank.com/proposal/5040"
        target="_blank"
        size="sm"
        class="w-full sm:w-fit h-7.5 sm:h-fit justify-center"
      >
        Vote
      </CommonButton>
      <button
        class="w-5 h-5 rounded-full flex items-center justify-center bg-white bg-opacity-20"
        @click="hideRabbyBanner"
      >
        <SVGX class="dark:text-white text-slate-500" />
      </button>
    </div>
  </div>
</template>
