<script setup>
import LinkSVG from "~/assets/images/icons/external-link.svg?raw";
import QuestionCircleSVG from "~/assets/images/icons/question-circle.svg?component";
const { safeAddress } = useAvocadoSafe();
</script>

<template>
    <div class="container flex flex-col gap-[30px] flex-1 md:pb-10">
      <TotalBalance />
      <DApps />
      <h2 class="font-semibold -mb-2.5 inline-flex gap-2.5">Balances
        <button @click="openDialogModal({
          type:'question',
          title: 'AvoSafe Balances',
          isButtonVisible: false,
          content:`These are your AvoSafe Balances, not your EOA balances. Deposit funds into your AvoSafe to use begin using Avocado.
          <br><br>
          <a class='text-sm inline-flex gap-2.5 text-blue-500'>Learn more about how to deposit ${LinkSVG}</a>
          `,
        })">
          <QuestionCircleSVG class="w-5 h-5" />
        </button>
      </h2>
      <div class="flex gap-5 lg:flex-row flex-col flex-1">
        <Balances />
        <div class="flex flex-col md:basis-[213px] gap-5">
          <QrCode />
        </div>
      </div>
    </div>
</template>
