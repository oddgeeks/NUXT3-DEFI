<script setup lang="ts">
</script>

<template>
  <section class="flex flex-col">
    <div class="flex bg-slate-50 dark:bg-gray-950">
      <div class="mx-auto flex h-screen min-w-0 max-w-7xl flex-1 flex-col px-4 sm:px-10">
        <div class="hidden items-center justify-end py-8 sm:flex">
          <NuxtLink class="mr-auto hidden items-center gap-2.5 md:flex" to="/migration">
            <SvgoAvocadoLogo />
            <span class="rounded-lg bg-purple bg-opacity-[14%] px-2 py-0.5 text-xs uppercase leading-[18px] text-purple">migration</span>
          </NuxtLink>
          <nav class="relative flex items-center gap-7.5">
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
