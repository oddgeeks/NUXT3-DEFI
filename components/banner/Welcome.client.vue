<script setup>
import SVGX from '~/assets/images/icons/x.svg?component'

const { toggleWelcomeBanner } = useBanner()
</script>

<template>
  <div
    class="relative flex h-9 w-full shrink-0 items-center justify-center gap-[15px] bg-green-400 bg-opacity-10 text-xs"
  >
    <p class="text-green-400">
      Welcome to Avocado! 🥑 Get started by following this simple guide
    </p>
    <a
      class="text-primary underline-offset-4"
      target="blank"
      rel="noopener noreferrer"
      href="https://help.avocado.instadapp.io/en/getting-started/a-checklist-to-get-started-with-avocado"
    >(<u>Take me in!</u>)</a>
    <button class="absolute right-10" @click="toggleWelcomeBanner(false)">
      <SVGX class="text-slate-500" />
    </button>
  </div>
</template>
