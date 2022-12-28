<script lang="ts" setup>
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

const prevPage = computed(() => Math.max(props.current - 1, 1));
const nextPage = computed(() =>
  Math.min(props.current + 1, pages.value.length)
);

const pages = computed(() => {
  const pages = [];
  for (let i = 1; i <= Math.ceil(props.total / props.limit); i++) {
    pages.push(i);
  }
  return pages;
});
</script>

<template>
  <nav aria-label="Page navigation example">
    <ul class="inline-flex -space-x-px">
      <li>
        <NuxtLink
          :to="{ path: urlPrefix, query: { page: prevPage } }"
          class="px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >Previous
        </NuxtLink>
      </li>

      <li :key="page" v-for="page in pages">
        <NuxtLink
          :to="{ path: urlPrefix, query: { page } }"
          aria-current="page"
          :class="{
            'text-blue-600 bg-blue-50 dark:bg-gray-700 dark:text-white hover:bg-blue-100 hover:text-blue-700':
              +page === +props.current,
          }"
          class="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        >
          {{ page }}
        </NuxtLink>
      </li>
      <li>
        <NuxtLink
          :to="{ path: urlPrefix, query: { page: nextPage } }"
          class="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >Next
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
