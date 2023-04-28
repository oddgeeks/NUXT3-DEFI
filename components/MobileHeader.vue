<script lang="ts" setup>
import Avocado from '@/assets/images/icons/avocado.svg?component'
import Hamburger from '@/assets/images/icons/hamburger.svg?component'

const { active } = useWeb3()
</script>

<template>
  <header class="flex flex-col transition-transform">
    <div class="flex justify-between items-center">
      <NuxtLink to="/" class="flex items-center">
        <Avocado class="text-primary" />
        <span v-if="!active" class="ml-2">Avocado</span>
      </NuxtLink>

      <Web3Button v-if="active" :hide-e-o-a="true" />

      <div v-if="active" role="button" tabindex="0" @click="openMobileHeader()">
        <Hamburger />
      </div>

      <div v-if="!active">
        <Web3Button />
      </div>
    </div>
  </header>
</template>
