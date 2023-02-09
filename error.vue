<script lang="ts" setup>
const error = useError();
const { parseRequestError } = useErrorHandler()
</script>

<template>
  <div class="flex flex-col h-full">
    <header class="flex justify-between items-center py-8 px-10">
      <NuxtLink to="/">
        <Logo />
      </NuxtLink>

      <nav class="flex items-center">
        <ColorModeSwitcher />
      </nav>
    </header>

    <main class="h-full flex flex-col">
      <div class="container relative flex-1 flex justify-center">
        <div class="flex flex-col justify-center items-center text-center max-w-3xl mx-auto">
         <h1 style="font-size: 256px;" class="leading-none mb-8">404</h1>
         <div class="flex flex-col gap-[26px] mb-10">
          <h1 class="text-[40px] leading-10">{{ parseRequestError(error).statusMessage }}</h1>
          <h2 class="text-slate-400 leading-[30px]">{{ parseRequestError(error).message }}</h2>
         </div>
         <CommonButton class="!px-7.5" as="NuxtLink" to="/" size="lg">
            Back to Home
         </CommonButton>
        </div>
      </div>
    </main>
  </div>
</template>
