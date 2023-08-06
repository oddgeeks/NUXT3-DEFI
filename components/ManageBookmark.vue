<script setup lang="ts">
defineProps<{
  bookmark?: IBookmark
}>()

defineEmits(['createBookmark', 'updateBookmark'])
</script>

<template>
  <div class="flex justify-center items-center gap-2 text-xs font-medium text-primary">
    <SvgoBookmark />
    <button
      v-if="!bookmark"
      type="button"
      @click="$emit('createBookmark')"
    >
      Save as Tx Shortcut
    </button>
    <span
      v-else
      type="button"
    >
      {{ bookmark.name }}
    </span>
    <SvgoInfo2
      v-if="!bookmark"
      v-tippy="'Bookmark this transaction so you can execute it in one click from the Avocado UI.'" class="text-slate-500"
    />
    <button
      v-else
      type="button"
      @click="$emit('updateBookmark')"
    >
      <SvgoPencil class="text-slate-400 shrink-0" />
    </button>
  </div>
</template>
