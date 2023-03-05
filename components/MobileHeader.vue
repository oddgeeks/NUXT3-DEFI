<script lang="ts" setup>
import Avocado from '@/assets/images/icons/avocado.svg?component';
import Hamburger from '@/assets/images/icons/hamburger.svg?component';
import InstadappSVG from '@/assets/images/logo/instadapp.svg?component';
import PowerOnSVG from '@/assets/images/icons/power-on.svg?component';
import PowerOffSVG from '@/assets/images/icons/power-off.svg?component';
import Calendar from '@/assets/images/icons/calendar.svg?component';

const { active, account, connector, deactivate } = useWeb3();
const ensName = ref();
const { trackingAccount } = useAccountTrack();
const [hovered, toggle] = useToggle(false);
const opened = ref(false);
const { setConnectorName } = useConnectors();

const addressLabel = computed(() => trackingAccount.value ? `Tracking: ${shortenHash(account.value, 4)}` : (ensName.value || shortenHash(account.value, 4)))

whenever(account, async () => {
  ensName.value = await getRpcProvider(1).lookupAddress(account.value)
}, { immediate: true });

const closeConnection = async () => {
  opened.value = false;
  const { success } = await openDisconnectWalletModal();

  if (success) {
    trackingAccount.value = null;
    setConnectorName(null);
    if (connector.value) {
      deactivate();
    }
  }
};

watch(opened, val => {
  if (val) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
});

const wrapperRef = ref<HTMLElement>();
onClickOutside(
  wrapperRef,
  (event: any) => {
    if (event.currentTarget) {
      const targetModalId = event.target?.dataset?.modalId;

      if (targetModalId === 'nav') {
        opened.value = false;
      }
    }
  },
  {
    ignore: [".modal-content-wrapper"],
  }
);
</script>

<template>
  <header class="flex flex-col transition-transform">
    <div class="flex justify-between items-center">
      <NuxtLink to="/" class="flex items-center">
        <Avocado />
        <span class="ml-2" v-if="!active">Avocado</span>
      </NuxtLink>

      <GasButton v-if="active" />

      <div v-if="active" role="button" tabindex="0" @click="opened = !opened">
        <Hamburger />
      </div>

      <div v-if="!active">
        <Web3Button />
      </div>
    </div>
    <TransitionRoot appear as="template" :show="opened">
      <Teleport to="body">
        <div data-modal-id="nav"
          class="fixed modal backrop-animation inset-0 z-40 overflow-y-hidden bg-slate-200/20 backdrop-filter backdrop-blur-[4px]">
          <div data-modal-id="nav" class="flex items-start sm:items-center justify-center text-center">
            <TransitionChild as="template" enter="ease-out duration-300"
              enter-from="opacity-0 -translate-y-96 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-300"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 -translate-y-96 sm:translate-y-0 sm:scale-95">
              <div
                class="inline-block relative w-full sm:my-6 dark:bg-gray-850 bg-white rounded-b-7.5 sm:rounded-7.5 text-left align-middle transition-all transform sm:max-w-[460px]"
                role="dialog" aria-modal="true">
                <div ref="wrapperRef"
                  class="modal-content-wrapper max-h-[640px] overflow-auto rounded-[inherit] relative md:px-[50px] px-6 py-8 md:py-10 w-full">
                  <div class="flex flex-col items-center mb-7.5">
                    <figure
                      class="flex gap-3 items-center border-2 border-slate-100 dark:border-slate-800 rounded-full py-2 px-4">
                      <figcaption class="text-xs text-slate-400">
                        Built by
                      </figcaption>
                      <a target="_blank" href="https://instadapp.io/">
                        <InstadappSVG />
                      </a>
                    </figure>

                    <nav class="flex gap-10 text-xs text-slate-400 mt-5">
                      <a target="_blank" href="https://help.avocado.instadapp.io">Help</a>
                      <a href="mailto:info@instadapp.io">Email</a>
                      <a rel="noopener noreferrer" target="_blank" href="https://twitter.com/instadapp">Twitter</a>
                      <a rel="noopener noreferrer" target="_blank" href="https://discord.com/invite/C76CeZc">Discord</a>
                    </nav>

                    <div v-show="active" class="flex w-full justify-between items-center mt-7.5">
                      <div role="button" tabindex="0"
                        class="bg-slate-100 dark:bg-slate-800 w-11 h-11 flex justify-center items-center rounded-full">
                        <ColorModeSwitcher />
                      </div>

                      <button @mouseenter="toggle(true)" @mouseleave="toggle(false)" @click="closeConnection"
                        class="dark:bg-slate-800 bg-slate-100 py-3 leading-5 justify-between pr-12 relative flex rounded-7.5 items-center px-4 gap-x-3">
                        {{ addressLabel }}
                        <PowerOffSVG v-if="hovered" class="pointer-events-none absolute right-0" />
                        <PowerOnSVG v-else class="pointer-events-none absolute right-0" />
                      </button>

                      <NuxtLink role="button" tabindex="0"
                        class="bg-slate-100 dark:bg-slate-800 w-11 h-11 flex justify-center items-center rounded-full"
                        :to="{
                          path: `/address/${account}`,
                        }" @click="opened = false">
                        <Calendar color="blue" />
                      </NuxtLink>
                    </div>
                  </div>
                  <div class="flex justify-between items-center px-4">
                    <NuxtLink to="/" @click="opened = false" class="flex items-center">
                      <Avocado />
                      <span class="ml-2" v-if="!active">Avocado</span>
                    </NuxtLink>

                    <GasButton v-if="active" />

                    <div v-if="active" role="button" tabindex="0" @click="opened = !opened">
                      <Hamburger />
                    </div>

                    <div v-if="!active">
                      <Web3Button @click="opened = false" />
                    </div>
                  </div>
                </div>
                <CommonModalSnack />
              </div>
            </TransitionChild>
          </div>
        </div>
      </Teleport>
    </TransitionRoot>
  </header>
</template>