<script setup lang="ts">
import { useField, useForm } from "vee-validate";
import * as yup from "yup";
import { isAddress } from "@ethersproject/address";

const emit = defineEmits(["destroy"]);


const { account } = useWeb3();
const { switchNetworkByChainId } = useNetworks();
const { sendTransaction, safe } = useAvocadoSafe();
const { parseTransactionError } = useErrorHandler();

const { networks } = useNetworks();

const selectableChains = computed(() =>
  networks.filter(
    (c) => c.chainId !== 634
  )
);

const loading = ref(false);

const to = ref('')
const value = ref('0')
const operation = ref('0')
const id = ref('0')
const data = ref('0x')
const chainId = ref('137')



const sendingDisabled = computed(
  () => loading.value || !data.value || !to.value
);

const onSubmit = async () => {
  loading.value = false;

  if (sendingDisabled.value) return;

  loading.value = true;
  try {
    await switchNetworkByChainId(634);


    let transactionHash = await sendTransaction(
      {
        to: to.value,
        data: data.value,
        value: value.value,
        chainId: Number(chainId.value),
        operation: operation.value
      },{
        id: id.value
      }
    );

    console.log(transactionHash);


    emit("destroy");

    showPendingTransactionModal(transactionHash, chainId.value, "send");
  } catch (e: any) {
    const err = parseTransactionError(e);

    openSnackbar({
      message: err.formatted,
      type: "error",
    });

    logActionToSlack({
      message: err.formatted,
      action: "send",
      type: "error",
      account: account.value,
      errorDetails: err.parsed
    });
  }

  loading.value = false;
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="text-center flex gap-7.5 flex-col">
    <div class="flex justify-center flex-col items-center">
      <div class="flex flex-col gap-[14px]">
        <h2 class="text-lg leading-5 text-center">Custom Transaction</h2>
      </div>
    </div>

    <div class="space-y-5">

      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span class="text-sm">Network</span>
        </div>

        <CommonSelect v-model="chainId" value-key="chainId" label-key="name" :options="selectableChains">
          <template #button-prefix>
            <ChainLogo class="w-6 h-6" :chain="chainId" />
          </template>
          <template #item-prefix="{ value }">
            <ChainLogo class="w-6 h-6" :chain="value" />
          </template>
        </CommonSelect>
      </div>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span class="text-sm">To</span>
        </div>

        <CommonInput name="to" placeholder="Enter to" v-model="to">
        </CommonInput>
      </div>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span class="text-sm">Value</span>
        </div>
        <CommonInput type="numeric" name="value"
          placeholder="Enter value" v-model="value">
        </CommonInput>
      </div>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span class="text-sm">Operation</span>
        </div>
        <CommonInput type="numeric" name="operation"
          placeholder="Enter operation" v-model="operation">
        </CommonInput>
      </div>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span class="text-sm">ID</span>
        </div>
        <CommonInput type="numeric" name="id"
          placeholder="Enter id" v-model="id">
        </CommonInput>
      </div>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span class="text-sm">Data</span>
        </div>

        <CommonInput name="data" placeholder="Enter data"
          v-model="data">
        </CommonInput>
      </div>
    </div>

    <CommonButton type="submit" :disabled="sendingDisabled" :loading="loading" class="justify-center w-full" size="lg">
      Submit
    </CommonButton>
  </form>
</template>
