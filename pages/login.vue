<script setup lang="ts">
import { storeToRefs } from "pinia";
import LinkSVG from "~/assets/images/icons/external-link.svg?raw";
import CheckCircle from "~/assets/images/icons/check-circle.svg";
import QuestionCircleSVG from "~/assets/images/icons/question-circle.svg";

const { account } = useWeb3();
const { unstableDappNetworks } = useBanner();
const { safeAddress } = useAvocadoSafe();
const { networkPreference } = storeToRefs(useSafe());
const router = useRouter();

useAccountTrack(undefined, () => {
  useEagerConnect();
});

const isHideZeroBalances = useLocalStorage("hide-zero-balances", false);

function handleOpenDialog() {
  openDialogModal({
    type: "question",
    title: "Avocado Wallet Balances",
    isButtonVisible: false,
    content: `These are your Avocado Wallet Balances, not your EOA balances. Deposit funds into your Avocado Wallet to begin using Avocado.
          <br><br>
          <a href='https://help.avocado.instadapp.io/en/articles/7038878-depositing-funds-to-your-avocado-account' target='blank' rel='noopener noreferrer' class='text-sm font-medium inline-flex gap-2.5 text-primary'>Learn more about how to deposit ${LinkSVG}</a>
          `,
  });
}

// onMounted(() => {
//   nextTick(() => {
//     setTimeout(() => {
//       if (account.value) {
//         router.push('/')
//       }
//     }, 100)
//   })

// })
</script>

<template>
  <div class="sm:w-[460px] w-full mx-auto mt-[92px] py-10 sm:px-[50px] px-5 bg-gray-850">
    <div class="w-full flex justify-center">
      <SvgAvocadoLogo />
    </div>
    <h1 class="mt-5 text-2xl leading-10 font-semibold text-center">
      Connect to Avocado
    </h1>
    <p class="mt-2.5 text-xs leading-6 font-medium text-center text-slate-400">
      And enjoy the most user friendly web3 experience
    </p>

    <div class="sm:h-[300px] h-full mt-[30px]">Here should come the connectors</div>
  </div>
</template>
