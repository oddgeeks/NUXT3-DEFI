<script setup lang="ts">
defineProps<{
  decodedParams: IDecodedParams
}>()
</script>

<template>
  <div class="py-9 pr-14">
    <BuilderViewer
      v-for="input in decodedParams.inputs"
      :key="input.name"
      :name="input.name"
      :method="decodedParams.method"
      :builder="decodedParams.builder"
      :value="decodedParams.args[input.name]"
      :input="input"
    />
  </div>
</template>
