<script setup lang="ts">
import InstadappSVG from "@/assets/images/logo/instadapp.svg?component";
import Calendar from "@/assets/images/icons/calendar.svg?component";
import Hamburger from "@/assets/images/icons/hamburger.svg?component";
import Avocado from "@/assets/images/icons/avocado.svg?component";

const { active, account } = useWeb3();

defineEmits(["destroy"]);
</script>

<template>
  <div class="flex flex-col items-center mb-7.5">
    <figure
      class="flex gap-3 items-center border-2 border-slate-100 dark:border-slate-800 rounded-full py-2 px-4"
    >
      <figcaption class="text-xs text-slate-400">Built by</figcaption>
      <a target="_blank" href="https://instadapp.io/">
        <InstadappSVG />
      </a>
    </figure>

    <nav class="flex gap-10 text-xs text-slate-400 mt-5">
      <a target="_blank" href="https://help.avocado.instadapp.io">Help</a>
      <a href="mailto:info@instadapp.io">Email</a>
      <a
        rel="noopener noreferrer"
        target="_blank"
        href="https://twitter.com/instadapp"
        >Twitter</a
      >
      <a
        rel="noopener noreferrer"
        target="_blank"
        href="https://discord.com/invite/C76CeZc"
        >Discord</a
      >
    </nav>

    <div
      v-show="active"
      class="flex w-full justify-between items-center mt-7.5"
    >
      <div
        role="button"
        tabindex="0"
        class="bg-slate-100 dark:bg-slate-800 w-11 h-11 flex justify-center items-center rounded-full"
      >
        <ColorModeSwitcher />
      </div>

      <Web3Button :hideGas="true" />

      <NuxtLink
        role="button"
        tabindex="0"
        class="bg-slate-100 dark:bg-slate-800 w-11 h-11 flex justify-center items-center rounded-full"
        :to="{
          path: `/address/${account}`,
        }"
        @click="$emit('destroy')"
      >
        <Calendar color="blue" />
      </NuxtLink>
    </div>
  </div>
  <div class="flex justify-between items-center px-4">
    <NuxtLink to="/" class="flex items-center">
      <Avocado />
      <span class="ml-2" v-if="!active">Avocado</span>
    </NuxtLink>

    <Web3Button :hideEOA="true" v-if="active" />

    <button @click="$emit('destroy')" v-if="active">
      <Hamburger />
    </button>
  </div>
</template>
