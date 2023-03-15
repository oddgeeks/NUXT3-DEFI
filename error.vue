<script lang="ts" setup>
const error = useError();
const { parseRequestError } = useErrorHandler()
const parsedError = parseRequestError(error);
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
         <h1 class="mb-7.5 sm:mb-10 text-[120px] sm:text-[260px] leading-[100px] sm:leading-[250px]">{{ parsedError.statusCode }}</h1>
         <div class="flex flex-col gap-2.5 sm:gap-[26px] mb-[50px] sm:mb-10">
          <h1 class="text-[18px] sm:text-[40px] leading-7.5">{{ parsedError.statusMessage }}</h1>
          <h2 class="text-slate-400 leading-6 sm:leading-7.5 text-xs sm:text-base font-medium sm:font-semibold">{{ parsedError.message }}</h2>
         </div>
         <CommonButton class="!px-7.5 w-full justify-center sm:w-fit" as="NuxtLink" to="/" size="lg">
            Back to Home
         </CommonButton>
        </div>
      </div>
    </main>
  </div>
</template>
