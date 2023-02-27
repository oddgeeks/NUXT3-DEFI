<script setup lang="ts">
import confetti from "canvas-confetti";
import CheckCircle from "~/assets/images/icons/check-circle.svg?component";
import GiftSVG from "~/assets/images/icons/gift.svg?component";
import SVGX from "~/assets/images/icons/x.svg?component";
import { openClaimedGasModal } from "~~/composables/modals";

const router = useRouter();
const { parseTransactionError } = useErrorHandler();
const { account, library } = useWeb3();
const eligible = ref(false);
const claimed = ref(false);

const claimedConfetti = () => {
  fire(1, {
    spread: 26,
    startVelocity: 55,
  });
  fire(1, {
    spread: 60,
  });
  fire(1, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  fire(1, {
    spread: 120,
    startVelocity: 45,
  });
};

const eligibleConfetti = () => {
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};

watch(eligible, eligible => {
  if (!eligible) return;
  eligibleConfetti();
});

watch(account, account => {
  if (!account) return;
  // Check here if eligible
  eligible.value = true;
});

const defaults = {
  origin: { y: 0.6 }
};

const fire = (particleRatio: any, opts: any, count: number = 200) => {
  confetti(Object.assign({}, defaults, opts, {
    particleCount: Math.floor(count * particleRatio)
  }));
};

const claimAirdrop = async () => {
  const avocadoProvider = getRpcProvider(634);

  const signer = library.value.getSigner();

  const message = `Avocado wants you to sign in with your web3 account ${account.value}

  Action: Claim 100 USDC Airdrop
  URI: https://avocado.instadapp.io
  Nonce: {{NONCE}}
  Issued At: ${new Date().toISOString()}`;

  try {
    const airdropNonce = await avocadoProvider.send("api_generateNonce", [
      account.value,
      message,
    ]);
    const redeemSignature = await signer.signMessage(
      message.replaceAll("{{NONCE}}", airdropNonce)
    );

    const success = await avocadoProvider.send("api_claimGift", [
      `${account.value.toLowerCase()}-100-1.0.0`,
      redeemSignature,
      airdropNonce,
    ]);

    claimedConfetti();
    openClaimedGasModal();
    router.push("/");
    
    if (success) {
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
  } catch (e) {
    const err = parseTransactionError(e);
    openSnackbar({
      message: err,
      type: "error",
    });
    logActionToSlack({
      message: err,
      type: "error",
      action: "reedem",
      account: account.value,
    });
  }
};

useForceSingleSession();
</script>

<template>
  <div class="container flex flex-col items-center justify-center gap-20 flex-1">
    <div class="flex items-center gap-20 relative">
      <div class="flex flex-col items-center gap-4">
        <div class="w-[46px] h-[46px] rounded-full bg-green-500 text-white flex items-center justify-center">
          1
        </div>
        <span>Enter Address</span>
      </div>

      <div class="flex flex-col items-center gap-4">
        <div
          class="w-[46px] h-[46px] rounded-full bg-green-500 text-white flex items-center justify-center font-medium"
          :class="{ 'bg-opacity-20 !text-green-400': !eligible }"
        >
          2
        </div>
        <span :class="{ 'text-slate-300 dark:text-slate-600': !eligible }">Claim Airdrop</span>
      </div>

      <div class="absolute top-5 left-24 flex items-center gap-1 font-medium">
        <div
          class="w-3 rounded-full bg-green-500 h-1"
          :class="{ 'bg-opacity-20': !account, '!bg-[#EB5757] !bg-opacity-20': account && !eligible }"
          v-for="i in 9"
          :key="i"
        >
        </div>
      </div>

      <div
        class="absolute top-2.5 left-[155px] bg-[#EB5757] flex items-center justify-center w-6 h-6 rounded-full"
        :class="{ '!hidden': !account || eligible }"
      >
        <SVGX />
      </div>
    </div>
    <div class="flex flex-col items-center rounded-7.5 bg-slate-50 dark:bg-gray-850 max-w-lg w-full text-center" v-if="!account">
      <div class="flex flex-col py-10 gap-10 px-[50px] w-full">
        <div class="flex flex-col gap-5">
          <p class="leading-8 text-xl">Check Eligibility</p>
          <p class="text-sm font-medium text-slate-400">Connect your wallet or enter your ENS</p>
        </div>
        <CommonButton size="lg" class="w-full flex justify-center" @click="openWeb3Modal">
          Connect Wallet
        </CommonButton>
      </div>
    </div>
    <div 
      v-else-if="eligible && !claimed"
      class="flex flex-col items-center gap-7.5"
    >
      <span class="text-[46px]">✨ Congratulations! ✨</span>
      <div class="flex flex-col">
        <span class="text-center text-slate-400">You are eligible! You have received</span>
        <div class="flex items-center gap-6.5">
          <img width="70" height="70" src="https://avocado.instadapp.io/tokens/usd-coin.svg" />
          <span class="text-[80px] font-bold">50 USDC</span>
        </div>
      </div>
      <CommonButton size="lg" class="flex items-center gap-2 px-32" @click="claimAirdrop">
        Claim
        <GiftSVG />
      </CommonButton>
    </div>
    <div v-else-if="!claimed" class="flex flex-col items-center gap-10 bg-slate-50 dark:bg-gray-850 py-10 px-[50px] rounded-5">
      <div class="flex flex-col gap-5 items-center">
        <span class="text-xl">This address is not eligible</span>
        <span class="text-slate-400 text-sm w-[269px] text-center">Connect to a different wallet or enter another address</span>
      </div>
      <CommonButton size="lg" class="flex w-full justify-center">
        Try again
      </CommonButton>
    </div>
    <div v-else class="flex flex-col items-center space-y-5">
      <div class="flex flex-col gap-7.5 bg-slate-50 dark:bg-gray-850 p-12 rounded-5">
        <span class="text-left text-lg">What you can do on Avocado with your claimed gas</span>
        <div class="flex flex-col gap-5">
          <div 
            v-for="ability in ['Deposit tokens to your avo wallet first', 'Connect your favorite dapps and making txns using USDC', 'Swap tokens', 'Bridge tokens']"
            class="flex items-center gap-2"
          >
            <CheckCircle class="text-white w-4 h-4 success-circle"/>
            <span>{{ ability }}</span>
          </div>
        </div>
      </div>
      <CommonButton as="NuxtLink" href="/" size="lg" class="max-w-[196px] flex justify-center">
        Get started
      </CommonButton>
    </div>
  </div>
</template>
