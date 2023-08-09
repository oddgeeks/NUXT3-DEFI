<template>
    <div class="flex-1 flex-grow text-slate-400 rounded-10 border border-slate-150 dark:border-slate-800
        p-[10px] pl-[14px] h-[40px] flex flex-row items-center gap-[10px] cursor-pointer"
        :class="{
            'dark:bg-slate-800 bg-slate-50 dark:text-white text-slate-900': selected,
            'dark:bg-gray-850 bg-slate-150': !selected
        }"
        @click="onUpdateSelected"
        >
        <slot name="content"></slot>
    </div>
</template>
<script setup lang="ts">
interface IProps {
    selected: boolean;
    value: any;
    height?: number;
}
const props = defineProps<IProps>()

const emit = defineEmits<{
    select: [value: IProps['value']]
}>()

const onUpdateSelected = () => {
    emit('select', props.value)
}
</script>