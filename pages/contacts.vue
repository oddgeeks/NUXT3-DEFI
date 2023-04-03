<script setup lang="ts">
import SearchSVG from "~/assets/images/icons/search.svg?component";
import PlusSVG from "~/assets/images/icons/plus.svg?component";
import SVGX from "~/assets/images/icons/x.svg?component";

const { account } = useWeb3();
const { safeAddress } = useAvocadoSafe();
const contacts = useLocalStorage("contacts", {});

useAccountTrack(undefined, () => {
  useEagerConnect();
});
</script>

<template>
  <div class="container flex flex-col gap-[30px] flex-1">
    <div class="flex gap-5 flex-col flex-1">
      <h2 class="font-semibold inline-flex items-center">Contacts</h2>
      <div class="flex items-center gap-5">
        <CommonInput
          class="flex-1"
          v-if="account"
          name="Contact Search"
          @input="search"
          type="search"
          placeholder="Search name"
        >
          <template #prefix>
            <SearchSVG class="shrink-0 mr-2" />
          </template>
        </CommonInput>
        <CommonButton
          :disabled="!safeAddress"
          size="lg"
          class="flex items-center justify-center gap-2 px-5 w-full sm:w-fit"
          @click="openAddContactModal()"
        >
          <PlusSVG />
          Create Contract
        </CommonButton>
      </div>
      <div
        style="scrollbar-gutter: stable; overflow-y: overlay"
        class="overflow-y-auto overflow-x-auto dark:bg-gray-850 bg-slate-50 rounded-[25px] md:overflow-x-hidden max-h-[530px] hidden sm:flex scroll-style"
        :class="{ '!overflow-hidden': !account }"
      >
        <table
          class="table w-full"
          :class="{ 'blur pointer-events-none': !account }"
        >
          <thead>
            <tr
              class="text-left text-sm text-gray-400 font-medium border-b border-slate-150 dark:border-slate-800"
            >
              <th class="text-left py-6 pl-7.5">Name</th>
              <th class="pr-10">Address</th>
            </tr>
          </thead>
          <tbody class="divide-y dark:divide-slate-800 divide-slate-150">
            <tr
              v-for="contact in contacts[safeAddress]"
              class="contact-row text-sm font-semibold cursor-pointer"
            >
              <td class="pl-7.5 text-sm">{{ contact.name }}</td>
              <td class="flex items-center justify-between pr-10 py-6">
                <div class="flex items-center gap-2.5">
                  <ChainLogo
                    :stroke="false"
                    class="w-[22px] h-[22px]"
                    :chain="contact.chainId"
                  />
                  <span>{{ shortenHash(contact.address) }}</span>
                </div>

                <SVGX />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contact-row > td > a {
  @apply py-2 w-full inline-flex;
}

.contact-row > td:first-child {
  @apply pl-7.5;
}

.contact-row > td > a {
  @apply py-[18.5px] relative;
}

.contact-row > td {
  transform-style: preserve-3d;
  white-space: nowrap;
  @apply md:pl-0 pl-4;
}

.contact-row:hover > td::before {
  content: "";
  transform: translateZ(-1px) translateX(-50%) translateY(-50%);
  @apply absolute top-1/2 left-1/2 dark:bg-slate-800 bg-slate-150 pointer-events-none;
  width: calc(100% + 1px);
  height: calc(100% - 16px);
}

.contact-row:hover > td:first-child:before {
  @apply rounded-l-5 ml-2.5;
}

.contact-row:hover > td:last-child:before {
  @apply rounded-r-5;
  translate: -10px 0;
}
</style>
