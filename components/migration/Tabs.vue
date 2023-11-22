<script lang="ts" setup>
interface TabsProps {
  tabs: {
    name: string
    value: string
  }[]
  defaultSelected: string
}

const props = defineProps<TabsProps>()
const emits = defineEmits(['updated'])

const activeTab = ref(props.defaultSelected)

function onTabUpdated(value: string) {
  activeTab.value = value
  emits('updated', value)
}

const currentIndicatorPosition = computed(() => {
  const activeIndex = props.tabs.findIndex(tab => tab.value === activeTab.value)
  if (activeIndex === -1)
    return 0

  return (100 / props.tabs.length) * activeIndex
})
</script>

<template>
  <div>
    <span
      v-for="tab in props.tabs"
      :key="tab.value"
      :class="`inline-block text-xs font-medium text-center text-slate-400 cursor-pointer ${activeTab === tab.value ? '!text-green-500' : ''}`"
      :style="{ width: `${100 / tabs.length}%` }"
      @click="() => onTabUpdated(tab.value)"
    >
      {{ tab.name }}
    </span>

    <span
      class="mt-2 block h-1 rounded-t-[10px] bg-green-500 transition-all"
      :style="{
        width: `${100 / tabs.length}%`,
        marginLeft: `${currentIndicatorPosition}%`,
      }"
    />
  </div>
</template>
