<script lang="ts" setup>
import ArrowLeft from '~/assets/images/icons/arrow-left.svg'
import ArrowRight from '~/assets/images/icons/arrow-right.svg'

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
    required: false,
    default: () => '/',
  },
  compact: {
    type: Boolean,
    required: false,
    default: () => false,
  },
  autoNavigate: {
    type: Boolean,
    required: false,
    default: () => true,
  },
})
const emit = defineEmits(['update:current'])
const { $scrollToTop } = useNuxtApp()
type INavigationType = 'first' | 'prev' | 'next' | 'last'

const router = useRouter()
const route = useRoute()

const pages = computed(() => {
  const pages = []
  for (let i = 1; i <= Math.ceil(props.total / props.limit); i++)
    pages.push(i)

  return pages
})

const disabled = computed(() => {
  if (!pages.value.length) {
    return {
      prev: true,
      next: true,
    }
  }

  return {
    prev: props.current === 1,
    next: props.current === pages.value.length,
  }
})

const start = computed(() => (props.current - 1) * props.limit + 1)
const end = computed(() => Math.min(props.current * props.limit, props.total))

function navigate(type: INavigationType) {
  let page

  switch (type) {
    case 'first':
      page = 1
      break
    case 'prev':
      page = Math.max(props.current - 1, 1)
      break
    case 'next':
      page = Math.min(props.current + 1, pages.value.length)
      break
    case 'last':
      page = pages.value.length
      break
  }

  emit('update:current', page)

  if (props.autoNavigate) {
    router.push({
      path: props.urlPrefix,
      query: {
        ...route.query,
        page,
      },
    })
    $scrollToTop()
  }
}
</script>

<template>
  <nav class="flex w-full justify-between sm:px-7.5 sm:py-6">
    <div
      class="hidden w-fit rounded-7.5 bg-slate-150 px-5 py-2 text-sm dark:bg-slate-800 sm:inline"
    >
      <span v-if="!compact"> Showing </span>
      {{ start }} to {{ end }} of {{ total }}
      <span v-if="!compact"> results </span>
    </div>
    <div class="flex w-full items-center gap-4 sm:w-fit">
      <CommonButton
        :disabled="disabled.prev"
        size="md"
        class="hidden !px-4 sm:inline"
        @click="navigate('first')"
      >
        First
      </CommonButton>
      <CommonButton
        :disabled="disabled.prev"
        size="md"
        class="!p-2"
        @click="navigate('prev')"
      >
        <ArrowLeft class="h-5 w-5" />
      </CommonButton>
      <div
        class="w-full rounded-7.5 bg-slate-150 px-5 py-3 text-center text-xs text-slate-400 dark:bg-slate-800 sm:hidden"
      >
        {{ start }} - {{ end }} of {{ total }} results
      </div>
      <CommonButton
        :disabled="disabled.next"
        size="md"
        class="!p-2"
        @click="navigate('next')"
      >
        <ArrowRight class="h-5 w-5" />
      </CommonButton>
      <CommonButton
        :disabled="disabled.next"
        size="md"
        class="hidden !px-4 sm:inline"
        @click="navigate('last')"
      >
        Last
      </CommonButton>
    </div>
  </nav>
</template>
