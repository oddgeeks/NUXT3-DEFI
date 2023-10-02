<script setup lang="ts">
</script>

<template>
  <section class="flex flex-col">
    <div class="flex bg-slate-50 dark:bg-gray-950">
      <div class="flex flex-1 flex-col sm:px-10 px-4 max-w-7xl mx-auto min-w-0 h-screen">
        <div class="items-center justify-end py-8 flex hidden sm:flex">
          <NuxtLink class="mr-auto flex items-center gap-2.5 hidden md:flex" to="/migration">
            <SvgoAvocadoLogo />
            <span class="uppercase text-xs bg-purple bg-opacity-[14%] px-2 py-0.5 leading-[18px] rounded-lg text-purple">migration</span>
          </NuxtLink>
          <nav class="flex items-center gap-7.5 relative">
            <div class="flex items-center gap-5">
              <ColorModeSwitcher />
              <Web3Button />
            </div>
          </nav>
        </div>

        <MobileHeader />

        <slot />
        <TheFooter class="mt-[30px]" />
      </div>
    </div>
  </section>
</template>
