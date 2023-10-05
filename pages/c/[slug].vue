<script setup lang="ts">
import confetti from 'canvas-confetti'
import CheckCircle from '~/assets/images/icons/check-circle.svg?component'
import GiftSVG from '~/assets/images/icons/gift.svg?component'
import SVGX from '~/assets/images/icons/x.svg?component'
import GasEmoji from '~/assets/images/icons/gas-emoji.svg?component'
import type { IPromo } from '~/server/data/promos'

definePageMeta({
  middleware: ['auth', 'claims'],
})

useEagerConnect()

const route = useRoute()
const router = useRouter()
const { parseTransactionError } = useErrorHandler()
const { account, library } = useWeb3()
const { avoProvider } = useSafe()
const { safeAddress } = useAvocadoSafe()

const eligible = ref(false)
const claimed = ref(false)
const claimSuccess = ref(false)
const claiming = ref(false)
const promo = ref<{ code: string; amount: number }>()

function claimedConfetti() {
  fire(1, {
    spread: 26,
    startVelocity: 55,
  })
  fire(1, {
    spread: 60,
  })
  fire(1, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  })
  fire(1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  })
  fire(1, {
    spread: 120,
    startVelocity: 45,
  })
}

function eligibleConfetti() {
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  })
  fire(0.2, {
    spread: 60,
  })
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}

watch(eligible, (eligible) => {
  if (!eligible || claimed)
    return
  eligibleConfetti()
})

watch(account, async () => {
  if (!account.value)
    return

  const res = await http<IPromo>(`/api/promos/${route.params.slug}`)
  const r1 = await avoProvider.send('api_promoUserInfo', [
    account.value,
    res.promo,
  ])

  promo.value = {
    code: res.promo,
    amount: r1.amount,
  }

  eligible.value = r1.eligible
  claimed.value = r1.claimed
})

const defaults = {
  origin: { y: 0.6 },
}

function fire(particleRatio: any, opts: any, count = 200) {
  confetti(Object.assign({}, defaults, opts, {
    particleCount: Math.floor(count * particleRatio),
  }))
}

async function claimAirdrop() {
  if (!promo.value)
    return
  claiming.value = true
  const signer = library.value.getSigner()

  let message = `Avocado wants you to sign in with your web3 account ${account.value}

Action: Claim ${toBN(promo.value.amount).toFixed(2)} USDC Airdrop
URI: https://avocado.instadapp.io
Nonce: {{NONCE}}
AvoAddress: {{SAFE}}
Issued At: ${new Date().toISOString()}`

  try {
    const nonce = await avoProvider.send('api_generateNonce', [
      account.value,
      safeAddress.value,
      message,
    ])

    message = message.replaceAll('{{NONCE}}', nonce)
    message = message.replaceAll('{{SAFE}}', safeAddress.value)

    const redeemSignature = await signer.signMessage(
      message,
    )

    const success = await avoProvider.send('api_promoClaim', [
      promo.value.code,
      redeemSignature,
      nonce,
    ])

    if (success) {
      claiming.value = false

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      })
      fire(0.2, {
        spread: 60,
      })
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      })
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      })
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      })

      claimedConfetti()
      router.push('/')
    }
  }
  catch (e: any) {
    const err = parseTransactionError(e)
    claiming.value = false
    logActionToSlack({
      message: err.formatted,
      type: 'error',
      action: 'reedem',
      account: account.value,
      errorDetails: err.parsed,
    })
  }
}
</script>

<template>
  <div class="container flex flex-1 flex-col items-center justify-center gap-20">
    <div class="relative flex items-center gap-24">
      <div class="flex flex-col items-center gap-4">
        <div class="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-green-500 text-white">
          1
        </div>
        <span>Connect Wallet</span>
      </div>

      <div class="flex flex-col items-center gap-4">
        <div
          class="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-green-500 font-medium text-white"
          :class="{ '!bg-[#EB5757] !bg-opacity-20 !text-[#EB5757]': !eligible || claimed, '!bg-green-500 !text-green-400': !account || account && !promo?.code }"
        >
          2
        </div>
        <span :class="{ 'text-slate-300 dark:text-slate-600': !eligible || claimed }">Claim Gas</span>
      </div>

      <div class="absolute left-[102px] top-5 flex items-center gap-1 font-medium">
        <div
          v-for="i in 9"
          :key="i"
          class="h-1 w-3 rounded-full bg-green-500"
          :class="{ 'bg-opacity-20': !account, '!bg-[#EB5757] !bg-opacity-20': (account && !eligible) || claimed, '!bg-green-500': account && !promo?.code }"
        />
      </div>

      <div
        class="absolute left-[160px] top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#EB5757]"
        :class="{ '!hidden': !account || eligible && !claimed || account && !promo?.code }"
      >
        <SVGX />
      </div>
    </div>
    <div v-if="!account" class="flex w-full max-w-lg flex-col items-center rounded-7.5 bg-slate-50 text-center dark:bg-gray-850">
      <div class="flex w-full flex-col gap-10 px-[50px] py-10">
        <div class="flex flex-col gap-5">
          <p class="text-xl leading-8">
            Check Eligibility
          </p>
          <p class="text-sm font-medium text-slate-400">
            Connect your wallet to check your eligibility
          </p>
        </div>
        <CommonButton size="lg" class="flex w-full justify-center" @click="openWeb3Modal">
          Connect Wallet
        </CommonButton>
      </div>
    </div>
    <div v-else-if="!promo" class="flex items-center justify-center py-32">
      <svg
        class="h-10 w-10 animate-spin text-green-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          stroke-linecap="round"
        />
      </svg>
    </div>
    <div
      v-else-if="eligible && !claimSuccess && !claimed"
      class="flex flex-col items-center gap-7.5"
    >
      <span class="text-[46px]">✨ Congratulations! ✨</span>
      <div class="flex flex-col items-center">
        <span class="max-w-2xl text-center leading-7 text-slate-400">You are eligible for free gas to make transactions on all supported networks all using only USDC. You have received:</span>
        <div class="flex items-center gap-6.5">
          <div class="relative">
            <GasEmoji />
            <img src="https://cdn.instadapp.io/avocado/tokens/usd-coin.svg" class="absolute -bottom-2 -left-2 rounded-full border-4 border-white dark:border-[#111827]" width="30" height="30">
          </div>
          <span class="text-[80px] font-bold">{{ promo && toBN(promo.amount).decimalPlaces(2) }} USDC</span>
        </div>
      </div>
      <CommonButton
        :loading="claiming"
        size="lg"
        class="flex items-center justify-center gap-2 sm:!px-14 sm:!py-3 sm:!text-xl"
        @click="claimAirdrop"
      >
        Claim
        <GiftSVG />
      </CommonButton>
    </div>
    <div v-else-if="claimed" class="flex flex-col items-center gap-10 rounded-5 bg-slate-50 px-[50px] py-10 dark:bg-gray-850">
      <div class="flex flex-col items-center gap-5">
        <span class="text-xl">You've already claimed this promo</span>
        <span class="w-[269px] text-center text-sm text-slate-400">Connect to a different wallet</span>
      </div>
    </div>
    <div v-else-if="!claimSuccess" class="flex flex-col items-center gap-10 rounded-5 bg-slate-50 px-[50px] py-10 dark:bg-gray-850">
      <div class="flex flex-col items-center gap-5">
        <span class="text-xl">This address is not eligible</span>
        <span class="w-[269px] text-center text-sm text-slate-400">Connect to a different wallet</span>
      </div>
    </div>
    <div v-else class="flex flex-col items-center space-y-5">
      <div class="flex flex-col gap-7.5 rounded-5 bg-slate-50 p-12 dark:bg-gray-850">
        <span class="text-left text-lg">What you can do on Avocado with your claimed gas</span>
        <div class="flex flex-col gap-5">
          <div
            v-for="ability in ['Deposit tokens to your avo wallet first', 'Connect your favorite dapps and making txns using USDC', 'Swap tokens', 'Bridge tokens']"
            :key="ability"
            class="flex items-center gap-2"
          >
            <CheckCircle class="success-circle h-4 w-4 text-white" />
            <span>{{ ability }}</span>
          </div>
        </div>
      </div>
      <CommonButton as="NuxtLink" href="/" size="lg" class="flex max-w-[196px] justify-center">
        Get started
      </CommonButton>
    </div>
  </div>
</template>
