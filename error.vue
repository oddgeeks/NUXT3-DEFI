<script lang="ts" setup>
const error = useError()
const { parseRequestError } = useErrorHandler()
const parsedError = parseRequestError(error)
</script>

<template>
  <div class="flex h-full flex-col">
    <header class="flex items-center justify-between px-10 py-8">
      <NuxtLink to="/">
        <SvgoAvocadoLogo />
      </NuxtLink>

      <nav class="flex items-center">
        <ColorModeSwitcher />
      </nav>
    </header>

    <main class="flex h-full flex-col">
      <div class="container relative flex flex-1 justify-center">
        <div class="mx-auto flex max-w-3xl flex-col items-center justify-center text-center">
          <h1 class="mb-7.5 text-[120px] leading-[100px] sm:mb-10 sm:text-[260px] sm:leading-[250px]">
            {{ parsedError.statusCode }}
          </h1>
          <div class="mb-[50px] flex flex-col gap-2.5 sm:mb-10 sm:gap-[26px]">
            <h1 class="leading-7.5 text-[18px] sm:text-[40px]">
              {{ parsedError.statusMessage }}
            </h1>
            <h2 class="sm:leading-7.5 text-xs font-medium leading-6 text-slate-400 sm:text-base sm:font-semibold">
              {{ parsedError.message }}
            </h2>
          </div>
          <CommonButton class="w-full justify-center !px-7.5 sm:w-fit" as="NuxtLink" to="/" size="lg">
            Back to Home
          </CommonButton>
        </div>
      </div>
    </main>
  </div>
</template>
