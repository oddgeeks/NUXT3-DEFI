<script lang="ts" setup>
import ArrowLeft from "~/assets/images/icons/arrow-left.svg?component";
import ArrowRight from "~/assets/images/icons/arrow-right.svg?component";

type INavigationType = "first" | "prev" | "next" | "last";

const props = defineProps({
  total: {
    type: Number,
    required: true,
  },
  current: {
    type: Number,
    required: true,
  },
  limit: {
    type: Number,
    required: true,
  },
  urlPrefix: {
    type: String,
    required: true,
    default: () => "/",
  },
});

const router = useRouter()

const pages = computed(() => {
  const pages = [];
  for (let i = 1; i <= Math.ceil(props.total / props.limit); i++) {
    pages.push(i);
  }
  return pages;
});

const disabled = computed(() => {
  return {
    prev: props.current === 1,
    next: props.current === pages.value.length,
  }
})

const start = computed(()=> (props.current - 1) * props.limit + 1)
const end = computed(()=> Math.min(props.current * props.limit, props.total))

const navigate = (type: INavigationType) => {
  let page;

  switch (type) {
    case "first":
      page = 1;
      break;
    case "prev":
      page = Math.max(props.current - 1, 1);
      break;
    case "next":
      page = Math.min(props.current + 1, pages.value.length);
      break;
    case "last":
      page = pages.value.length;
      break;
  }

  router.push({
    path: props.urlPrefix,
    query: {
      page,
    },
  });
}
</script>

<template>
  <nav class="py-6 px-7.5 flex justify-between">
    <div class="px-5 py-2 dark:bg-slate-800 bg-slate-150 text-sm rounded-7.5 w-fit">
      Showing {{ start }} to {{ end }} of {{ total }} results
    </div>
    <div class="flex gap-4 items-center">
      <CommonButton @click="navigate('first')" :disabled="disabled.prev" size="md" class="!px-4">
        First
      </CommonButton>
       <CommonButton @click="navigate('prev')"  :disabled="disabled.prev" size="md" class="!px-2 !py-2">
        <ArrowLeft class="w-5 h-5" />
      </CommonButton>
        <CommonButton @click="navigate('next')" :disabled="disabled.next" size="md" class="!px-2 !py-2">
        <ArrowRight class="w-5 h-5" />
      </CommonButton>
      <CommonButton @click="navigate('last')" :disabled="disabled.next" size="md" class="!px-4">
        Last
      </CommonButton>
    </div>
  </nav>
</template>
