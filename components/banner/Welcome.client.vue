<script setup>
import SVGX from '~/assets/images/icons/x.svg'

const { toggleWelcomeBanner } = useBanner()
</script>

<template>
  <div
    class="w-full h-9 text-xs relative bg-green-400 bg-opacity-10 shrink-0 flex justify-center items-center gap-[15px]"
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
