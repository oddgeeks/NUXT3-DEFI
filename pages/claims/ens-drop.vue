<script setup lang="ts">
import confetti from "canvas-confetti";
import { ethers } from "ethers";
import CheckCircle from "~/assets/images/icons/check-circle.svg?component";

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
    claimed.value = true;
    
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
  <div class="container flex flex-col items-center justify-center gap-[30px] flex-1">
    <div class="flex flex-col items-center space-y-6 max-w-md text-center" v-if="!account">
      <p class="leading-8">Connect your wallet to check your eligibility</p>
      <div class="w-48">
        <Web3Button />
      </div>
    </div>
    <div 
      v-else-if="eligible && !claimed"
      class="flex flex-col items-center gap-7.5 bg-slate-50 dark:bg-gray-850 p-12 rounded-5"
    >
      <span class="w-[320px] text-center text-slate-400">You are eligible! You have received</span>
      <span class="text-6xl">50 USDC</span>
      <CommonButton size="lg" class="flex items-center gap-2 px-32" @click="claimAirdrop">
        Claim
      </CommonButton>
    </div>
    <div v-else-if="!claimed" class="flex flex-col items-center gap-7.5 bg-slate-50 dark:bg-gray-850 p-12 rounded-5">
      <span class="w-[360px] text-center">You are not eligible! or Try again with another ENS.</span>
      <CommonButton size="lg">
        <span class="text-center w-full">Back</span>
      </CommonButton>
    </div>
    <div v-else class="flex flex-col gap-7.5 bg-slate-50 dark:bg-gray-850 p-12 rounded-5">
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
  </div>
</template>
