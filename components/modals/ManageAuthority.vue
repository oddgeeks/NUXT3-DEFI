<script lang="ts" setup>
import * as yup from 'yup'
import { isAddress } from '@ethersproject/address'
import { useField, useForm } from 'vee-validate'
import { storeToRefs } from 'pinia'

// import { AvoSafeImplementation__factory } from '~~/contracts'

defineProps<{
  authority: IAuthority
}>()

const emit = defineEmits(['destroy'])

const { authorities } = storeToRefs(useAuthorities())

const chainId = ref('1')

const {
  handleSubmit,
  isSubmitting,
  errors,
  meta,
} = useForm({
  validationSchema: yup.object({
    address: yup
      .string()
      .required('')
      .test('is-valid-address', 'Incorrect address', (value) => {
        return value ? isAddress(value || '') : true
      })
      .test(
        'duplicate-address',
        'Authority already added',
        (value) => {
          if (!isAddress(value || ''))
            return true
          return !authorities.value.some(
            authority =>
              authority.address?.toLowerCase() === value?.toLowerCase(),
          )
        },
      ),
  }),
})

const {
  value: address,
  meta: addressMeta,
  setValue,
} = useField<string>('address')

// const { data: tx } = useAsyncData(async () => {
//   if (!address.value || !safeAddress.value)
//     return

//   const instance = AvoSafeImplementation__factory.connect(safeAddress.value, signer.value!)
//   const resp = await instance.populateTransaction.addAuthorities([address.value])

//   return {
//     to: safeAddress.value,
//     data: resp.data,
//     value: '0',
//     operation: '0',
//     chainId: chainId.value,
//   }
// }, {
//   watch: [
//     address,
//     safeAddress,
//     chainId,
//   ],
// })

// const { data, pending, error } = useEstimatedFee(
//   tx,
//   chainId,
// )

const disabled = computed(() => !meta.value.valid)

const onSubmit = handleSubmit(async () => {
  emit('destroy')
})

async function handleSelectContact() {
  const result = await openSelectContactModal(chainId.value)

  if (result.success) {
    const _contact = result.payload as IContact

    setValue(_contact.address)
  }
}
</script>

<template>
  <form @submit="onSubmit">
    <div class="flex items-center justify-center gap-5 flex-col mb-7.5">
      <AuthorityAvatar
        :address="authority.address"
        class="-mr-2"
      />
      <div class="dark:bg-gray-850 bg-slate-50 rounded-5 px-2.5 py-2 text-slate-400 flex items-center text-xs">
        {{ shortenHash(authority.address) }}
      </div>
      <h1 class="text-lg leading-5">
        Manage Networks
      </h1>
      <h2 class="text-slate-400 font-medium text-xs">
        Enable networks to grant access to Funds.
      </h2>
    </div>
    <div class="flex flex-col gap-2.5">
      <CommonInput
        name="Network Search"
        type="search"
        placeholder="Search name"
        input-classes="!py-3 text-sm"
        class="!rounded-[14px]"
      >
        <template #prefix>
          <SvgoSearch class="mr-2 shrink-0" />
        </template>
      </CommonInput>
      <div class="dark:bg-gray-850 bg-slate-50 px-5 py-4 rounded-5">
        <ul class="flex flex-col gap-5">
          <li v-for="network in availableNetworks" :key="network.chainId" class="flex items-center gap-3">
            <ChainLogo class="w-7 h-7" :chain="network.chainId" />
            {{ network.name }}

            <SvgoCheckCircle
              class="w-10 h-10 svg-circle darker"
            />
          </li>
        </ul>
      </div>
    </div>
  </form>
</template>
