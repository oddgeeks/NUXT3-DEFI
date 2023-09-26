<script setup lang="ts">
const { legacySafeAddress } = storeToRefs(useSafe())
</script>

<template>
  <div class="bg-gray-850 border-slate-750 rounded-5">
    <div class="p-[20px] flex items-start justify-between">
      <div class="text-sm font-semibold">
        <div class="mb-[6px] flex items-center">
          <span class="text-green-500">Personal</span>
          <SvgoEdit />
        </div>
        <div class="mb-[6px] flex items-center">
          <Copy :text="legacySafeAddress">
            <template #content>
              {{ shortenHash(legacySafeAddress) }}
            </template>
          </Copy>
        </div>
        <div class="text-slate-400">
          $134,785.50
        </div>
      </div>
      <div class="flex items-center">
        <SvgoInfo2 class="text-slate-400" />
        <UiTag class="ml-[10px] !bg-opacity-100" text="Legacy" color="WHITE" uppercase />
        <div class="text-xs font-semibold px-2 py-[2px] bg-white dark:text-slate-900 inline-block rounded-[8px]">
          Legacy
        </div>
      </div>
    </div>

    <!-- <WalletAssets /> -->
  </div>
</template>
