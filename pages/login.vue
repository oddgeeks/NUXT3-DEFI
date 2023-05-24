<script setup lang="ts">
import { storeToRefs } from 'pinia'
import LinkSVG from '~/assets/images/icons/external-link.svg?raw'
import CheckCircle from '~/assets/images/icons/check-circle.svg'
import QuestionCircleSVG from '~/assets/images/icons/question-circle.svg'

const { account } = useWeb3()
const { unstableDappNetworks } = useBanner()
const { safeAddress } = useAvocadoSafe()
const { networkPreference } = storeToRefs(useSafe())
const router = useRouter()

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const isHideZeroBalances = useLocalStorage('hide-zero-balances', false)

function handleOpenDialog() {
  openDialogModal({
    type: 'question',
    title: 'Avocado Wallet Balances',
    isButtonVisible: false,
    content: `These are your Avocado Wallet Balances, not your EOA balances. Deposit funds into your Avocado Wallet to begin using Avocado.
          <br><br>
          <a href='https://help.avocado.instadapp.io/en/articles/7038878-depositing-funds-to-your-avocado-account' target='blank' rel='noopener noreferrer' class='text-sm font-medium inline-flex gap-2.5 text-primary'>Learn more about how to deposit ${LinkSVG}</a>
          `,
  })
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
  <div>
    
  </div>
</template>
