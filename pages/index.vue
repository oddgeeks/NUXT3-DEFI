<script setup>
import LinkSVG from "~/assets/images/icons/external-link.svg?raw";
import QuestionCircleSVG from "~/assets/images/icons/question-circle.svg?component";
const { safeAddress } = useAvocadoSafe();
</script>

<template>
  <div class="container flex flex-col gap-[30px] flex-1 md:pb-10">
    <TotalBalance />
    <DApps />
    <div class="flex gap-5 lg:flex-row flex-col flex-1">
      <div class="flex flex-col w-full gap-5">
        <h2 class="font-semibold inline-flex gap-2.5">
          Balances
          <button
            @click="
              openDialogModal({
                type: 'question',
                title: 'AvoSafe Balances',
                isButtonVisible: false,
                content: `These are your AvoSafe Balances, not your EOA balances. Deposit funds into your AvoSafe to begin using Avocado.
          <br><br>
          <a href='https://guides.avocado.link/en/getting-started/topping-up-your-avocado-account' target='blank' rel='noopener noreferrer' class='text-sm inline-flex gap-2.5 text-blue-500'>Learn more about how to deposit ${LinkSVG}</a>
          `,
              })
            "
          >
            <QuestionCircleSVG class="w-5 h-5" />
          </button>
        </h2>
        <Balances />
      </div>
      <div class="flex flex-col md:shrink-0 md:basis-[213px] gap-5">
        <div class="w-full flex flex-col gap-5">
          <h2 class="font-semibold inline-flex gap-2.5">
            Your Wallet
            <button
              @click="
                openDialogModal({
                  type: 'question',
                  title: 'Your Wallet',
                  isButtonVisible: false,
                  content: `Deposit or receive funds by scanning or copying your AvoSafe QR code. You can deposit or receive from any supported chains.
          <br><br>
          <a href='https://guides.avocado.link/en/getting-started/topping-up-your-avocado-account' target='blank' rel='noopener noreferrer' class='text-sm inline-flex gap-2.5 text-blue-500'>Learn more about how to deposit ${LinkSVG}</a>
          `,
                })
              "
            >
              <QuestionCircleSVG class="w-5 h-5" />
            </button>
          </h2>
          <QrCode />
        </div>
      </div>
    </div>
  </div>
</template>
