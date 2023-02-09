<script lang="ts" setup>
const { account } = useWeb3()

</script>

<template>
  <header class="flex justify-between items-center">
    <NuxtLink to="/">
      <Logo />
    </NuxtLink>

    <nav class="flex items-center gap-7.5">
      <div class="flex text-sm">
        <NuxtLink
          active-class="dark:text-white text-slate-900"
          class="text-slate-400 py-3 px-5"
          to="/"
        >
          Home
        </NuxtLink>
        <NuxtLink
          v-if="account"
          active-class="dark:text-white text-slate-900"
          class="text-slate-400 py-3 px-5"
          :to="{
            path: `/address/${account}`,
          }"
        >
          History
        </NuxtLink>
      </div>
      <div class="flex items-center gap-5">
        <ColorModeSwitcher />
        <Web3Button />
      </div>
    </nav>
  </header>
</template>
