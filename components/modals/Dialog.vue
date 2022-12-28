<script setup lang="ts">
import SVGCheckCircle from "~/assets/images/icons/check-circle.svg?component";
import SVGErrorCircle from  "~/assets/images/icons/error-circle.svg?component";
import SVGQuestionCircle from  "~/assets/images/icons/question-circle.svg?component";

const { props, closeModal } = useModal();
</script>

<template>
    <div
      class="inline-flex gap-7.5 flex-col items-center justify-center text-center w-full"
    >
      <SVGCheckCircle
        class="text-white success-circle"
        v-if="props.type === 'success'"
      />
      <SVGErrorCircle  class="text-white" v-if="props.type === 'error'" />
      <SVGQuestionCircle  v-if="props.type === 'question'"/>

      <div class="flex flex-col gap-[15px]">
        <h1 class="text-lg">{{ props.title }}</h1>

        <p v-html="props.content" class="text-slate-400 text-xs text-center leading-5" />
      </div>
      <CommonButton
       v-if="props.isButtonVisible"
        @click="closeModal()"
        class="w-full justify-center"
        size="lg"
      >
        {{ props.buttonText }}
      </CommonButton>
    </div>
</template>
