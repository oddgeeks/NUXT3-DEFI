<script lang="ts" setup>
const props = defineProps<{
  authority: IAuthority
  chainIds: string[]
}>()
</script>

<template>
  <div>
    <h1 class="text-lg">
      Estimated Gas Required
    </h1>
    {{ chainIds }}
    <CommonButton size="lg" class="w-full justify-center">
      Save Changes
    </CommonButton>
  </div>
</template>
