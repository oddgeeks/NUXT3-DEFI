<template>
  <div class="flex gap-[14px]">
    <slot name="icon-content">
      <CommonTxTypeIcon class="h-9 w-9">
        <template #icon>
          <slot name="icon" />
        </template>
      </CommonTxTypeIcon>
    </slot>
    <div class="flex flex-col gap-1">
      <h1 class="text-lg">
        <slot name="title" />
      </h1>
      <h2 v-if="$slots?.subtitle" class="text-xs font-medium leading-5 text-gray-400">
        <slot name="subtitle" />
      </h2>
    </div>
  </div>
</template>
