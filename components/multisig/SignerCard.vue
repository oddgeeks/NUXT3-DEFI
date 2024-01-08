<script setup lang="ts">
import * as yup from 'yup'
import { isAddress } from '@ethersproject/address'
import { useField, useForm } from 'vee-validate'

const props = defineProps<{
  safe: ISafe
  chainId: number | string
}>()

const { getContactNameByAddress } = useContacts()
const { getRequiredSigner } = useMultisig()
const { account } = useWeb3()
const { changeThreshold } = useAvocadoSafe()

const [DefineTemplate, AddressItem] = createReusableTemplate()

const threshold = ref()

const chainAddresses = defineModel<ChainSigners>({
  default: {},
  required: true,
  local: true,
})

const chainSigners = computed(() => [...props.safe.signers[props.chainId]].sort((address) => {
  const isOwner = checkAddressIsOwner(address)
  return isOwner ? -1 : 1
}))

const newSigners = computed(() => chainAddresses.value[props.chainId] || [])

const blurry = ref(chainSigners.value.length === 0)

const {
  handleSubmit,
  meta,
} = useForm({
  validationSchema: yup.object({
    address: yup.string()
      .required('')
      .test('is-valid-address', 'Incorrect address', (value) => {
        return value ? isAddress(value || '') : true
      })
      .test(
        'cannot-add-self',
        'Cannot add self as signer',
        (value) => {
          if (!isAddress(value || ''))
            return true
          return account.value?.toLowerCase() !== value?.toLowerCase()
        },
      )
      .test(
        'duplicate-address',
        'Signer already added',
        (value) => {
          if (!isAddress(value || ''))
            return true

          const fieldCount = [...newSigners.value, ...chainSigners.value].filter(field => field.toLowerCase() === value?.toLowerCase())

          if (fieldCount?.length)
            return false

          return true
        },
      ),

  }),
})

const { value, errorMessage, setValue } = useField('address')

function checkAddressIsOwner(address: string) {
  return isAddressEqual(address, props.safe.owner_address)
}

async function handleSelectContact() {
  const result = await openSelectContactModal()

  if (result.success) {
    const _contact = result.payload as IContact

    setValue(_contact.address, true)
  }
}

function syncNewSigners() {
  const signers = newSigners.value.filter((address) => {
    return !chainSigners.value.some(signer => isAddressEqual(signer, address))
  })

  chainAddresses.value = {
    ...chainAddresses.value,
    [props.chainId]: signers,
  }

  if (chainSigners.value.length > 1)
    blurry.value = false
}

function handleRemoveSigner(address: string) {
  const index = newSigners.value.findIndex(_address => _address.toLowerCase() === address.toLowerCase())

  if (index !== -1) {
    const _newSigners = [...newSigners.value]
    _newSigners.splice(index, 1)
    chainAddresses.value = {
      ...chainAddresses.value,
      [props.chainId]: _newSigners,
    }
  }
}

const onSubmit = handleSubmit(() => {
  Object.assign(chainAddresses.value, {
    [props.chainId]: [...newSigners.value, value.value],
  })
  setValue(undefined, true)
})

async function setThreshold() {
  threshold.value = await getRequiredSigner(props.safe.safe_address, props.chainId)
}

async function handleTresholdChange(chainId: string | number) {
  const { success, payload } = await openUpdateThresholdModal(chainId, 0)

  if (success && payload) {
    const metadata = encodeChangeThresholdMetadata(payload)

    const txHash = await changeThreshold({
      threshold: payload,
      chainId,
    })

    if (txHash) {
      logActionToSlack({
        account: account.value,
        message: generateSlackMessage(metadata, chainId),
        action: 'change-threshold',
        txHash,
        chainId: String(chainId),
      })

      showPendingTransactionModal({
        hash: txHash,
        chainId,
      })
    }
  }
}

watchThrottled(() => props.safe, async () => {
  await setThreshold()
  syncNewSigners()
}, {
  throttle: 1000,
  deep: true,
  immediate: true,
})
</script>

<template>
  <div class="relative">
    <form :class="blurry ? 'blur pointer-events-none select-none' : ''" class="h-fit rounded-5 border border-gray-800 bg-gray-850 p-5 transition-all" @submit="onSubmit">
      <DefineTemplate v-slot="{ address, removable } = {} as any">
        <li class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 text-xs">
            <AuthorityAvatar class="h-5 w-5" :address="address" />

            <span v-if="getContactNameByAddress(address)">
              {{ getContactNameByAddress(address) }}
            </span>
            <button v-else type="button" :class="removable ? 'text-primary' : 'text-gray-400'" class="text-xs" @click="openAddContactModal(undefined, address)">
              Save as Contact
            </button>

            <span v-if="checkAddressIsOwner(address)">(Owner)</span>
            <button v-if="removable" v-tippy="'Remove Signer'" type="button" @click="handleRemoveSigner(address)">
              <SvgoX class="h-3 w-3" />
            </button>
          </div>
          <span v-tippy="address" class="text-xs text-gray-400">
            {{ shortenHash(address) }}
          </span>
        </li>
      </DefineTemplate>
      <div class="flex flex-col gap-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <ChainLogo class="h-10 w-10" :chain="chainId" />
            {{ chainIdToName(chainId) }}
          </div>

          <SvgoInfo2 v-if="newSigners.length" v-tippy="'You have unsaved changes to your Multisig Signers, click Submit Changes to proceed'" class="h-5 w-5 text-orange-400" />
        </div>
        <TransitionGroup tag="ul" class="scroll-style flex min-h-[20px] flex-col gap-2.5 overflow-auto sm:max-h-[200px]" name="signer-list">
          <AddressItem v-for="address in newSigners" :key="address" :removable="true" :address="address" />
          <AddressItem v-for="address in chainSigners" :key="address" :address="address" />
          <AddressItem v-if="!chainSigners.length && account" :address="account" />
        </TransitionGroup>
        <div>
          <CommonInput v-model="value" :error-message="errorMessage" placeholder="Signer EOA Address" container-classes="!bg-gray-800">
            <template #suffix>
              <button
                v-tippy="'Select contact'"
                type="button"
                class="ml-3"
                @click="handleSelectContact"
              >
                <SvgoContact class="text-gray-400" />
              </button>
            </template>
          </CommonInput>
        </div>
        <div v-if="threshold !== undefined" class="flex items-center justify-between text-xs text-gray-400">
          <div class="flex items-center gap-2">
            <SvgoStamp />
            <div class="group">
              <p class="h-fit translate-y-0 opacity-100 transition-all group-hover:h-0 group-hover:translate-y-5 group-hover:opacity-0">
                {{ threshold }}
                confirm. req.
              </p>
              <button class="invisible flex h-0 translate-y-5 text-primary opacity-0 transition-all group-hover:visible group-hover:h-fit group-hover:translate-y-0 group-hover:opacity-100" @click="handleTresholdChange(chainId)">
                Modify threshold
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <SvgoUsers />
            {{ safe.signers[chainId].length }}
            total signer(s)
          </div>
        </div>
        <CommonButton type="submit" :disabled="!meta.valid" class="justify-center" size="lg">
          Add Signer
        </CommonButton>
        <p v-if="!chainSigners?.length && !newSigners.length" class="text-xs flex items-center gap-2 text-orange-400">
          <SvgoInfo2 />
          Add Signer below to finalize deployment
        </p>
      </div>
    </form>
    <Transition name="fade">
      <button v-if="blurry" type="button" class="absolute left-1/2 top-1/2 flex w-max -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-10 border border-gray-800 bg-gray-850 px-[14px] py-2 text-sm" @click="blurry = false">
        <ChainLogo class="h-[26px] w-[26px]" :chain="chainId" />
        <span class="whitespace-nowrap">
          Deploy {{ chainIdToName(chainId) }}
        </span>
        <SvgoChevronDown class="h-4 w-4 shrink-0 -rotate-90 text-gray-400" />
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.signer-list-move,
  .signer-list-enter-active,
  .signer-list-leave-active {
    transition: all 0.5s ease;
  }

  .signer-list-enter-from,
  .signer-list-leave-to {
    opacity: 0;
    transform: translateY(30px);
  }

  .signer-list-leave-active {
    position: absolute;
  }

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-out;
  transform-origin: left top;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
