<script setup lang="ts">
import Fuse from "fuse.js";
import SearchSVG from "~/assets/images/icons/search.svg?component";
import PlusSVG from "~/assets/images/icons/plus.svg?component";
import SVGX from "~/assets/images/icons/x.svg?component";

const { account } = useWeb3();
const { safeAddress } = useAvocadoSafe();
const { contacts, deleteContact } = useContacts();

const searchQuery = ref("");

useAccountTrack(undefined, () => {
  useEagerConnect();
});

const search = useDebounceFn((event: Event) => {
  searchQuery.value = (<HTMLInputElement>event.target).value;
}, 200);

const filteredTokens = computed(() => {
  if (!searchQuery.value) return data.value || [];

  const fuse = new Fuse(data.value || [], {
    keys: ["name", "symbol", "address"],
    threshold: 0.2,
  });

  return fuse.search(searchQuery.value).map((result) => result.item);
});

const filteredContacts = computed(() => {
  const _contacts = contacts.value[safeAddress.value];
  if (!_contacts) {
    return [];
  }

  if (!searchQuery.value || searchQuery.value.trim().length === 0) {
    return _contacts;
  }

  const fuse = new Fuse(_contacts, {
    keys: ["name", "address"],
    threshold: 0.2,
  });

  return fuse.search(searchQuery.value).map((result) => result.item);
});

const handleDeletingContact = async (contact: IContact) => {
  const { success } = await openDeleteContactModal();

  if (success) {
    deleteContact(contact);
  }
};

const { data: transferCounts } = useAsyncData(
  async () => {
    const _contacts = contacts.value[safeAddress.value];
    if (!_contacts || _contacts.length === 0) {
      return [];
    }

    let newContacts: IContact[] = _contacts;

    if (Array.isArray(transferCounts.value)) {
      newContacts = _contacts.filter(
        (contact) =>
          transferCounts.value.findIndex(
            (transfer) =>
              transfer.from === safeAddress.value &&
              transfer.to === contact.address.toLowerCase() &&
              transfer.chainId == contact.chainId
          ) === -1
      );
    }
    const res = await http("/api/transfers", {
      params: {
        from: safeAddress.value,
        to: newContacts.map((_contact) => _contact.address),
        chainIds: newContacts.map((_contact) => Number(_contact.chainId)),
      },
    });

    if (Array.isArray(transferCounts.value)) {
      return [...transferCounts.value, ...res];
    }

    return res;
  },
  {
    watch: [safeAddress, contacts],
  }
);

const getSentTimes = (contact: IContact) => {
  if (transferCounts.value && Array.isArray(transferCounts.value)) {
    const info = transferCounts.value.find(
      (item) =>
        item.to.toLowerCase() === contact.address.toLowerCase() &&
        item.chainId == contact.chainId
    );
    if (!info || info.transferCount === 0) {
      return "";
    }
    return `Sent ${info.transferCount} ${
      info.transferCount === 1 ? "time" : "times"
    }`;
  }
  return "";
};
</script>

<template>
  <div class="container flex flex-col gap-[30px] flex-1">
    <div class="flex gap-5 flex-col flex-1">
      <h2 class="sm:text-base text-sm font-semibold inline-flex items-center">
        Contacts
      </h2>
      <div
        class="flex sm:flex-row flex-col-reverse items-center gap-x-5 gap-y-7.5"
        :class="{ 'blur pointer-events-none': !account }"
      >
        <CommonInput
          class="flex-1 w-full"
          :class="{
            'hidden sm:block':
              !contacts[safeAddress] || contacts[safeAddress].length === 0,
          }"
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
          @click="openAddContactModal(searchQuery)"
        >
          <PlusSVG />
          Create Contact
        </CommonButton>
      </div>
      <div
        style="scrollbar-gutter: stable; overflow-y: overlay"
        class="overflow-y-auto overflow-x-auto dark:sm:bg-gray-850 sm:bg-slate-50 sm:rounded-[25px] md:overflow-x-hidden h-[530px] max-h-[530px] scroll-style flex flex-col gap-4"
        :class="{ '!overflow-hidden blur pointer-events-none': !account }"
      >
        <div
          v-if="account && filteredContacts.length === 0"
          class="w-full h-full flex items-center justify-center"
        >
          No contacts
        </div>
        <template v-else>
          <table class="hidden sm:table w-full">
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
                v-for="contact in filteredContacts"
                class="contact-row text-sm font-semibold cursor-pointer"
                @click="openSendModal(contact.chainId, undefined, contact)"
              >
                <td class="pl-7.5 text-sm">
                  {{ contact.name }}
                </td>
                <td class="flex items-center justify-between pr-10 py-6 gap-10">
                  <div class="flex items-center gap-2.5">
                    <ChainLogo
                      :stroke="false"
                      class="w-[22px] h-[22px]"
                      :chain="contact.chainId"
                    />
                    <span>{{ shortenHash(contact.address) }}</span>
                  </div>
                  <span class="text-slate-400">{{
                    getSentTimes(contact)
                  }}</span>
                  <button @click.stop="handleDeletingContact(contact)">
                    <SVGX class="text-slate-400" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div
            class="flex flex-col sm:hidden dark:bg-gray-850 bg-slate-50 px-5 pt-4 pb-4.5 rounded-[20px] gap-5"
            v-for="contact in filteredContacts"
          >
            <div class="flex justify-between">
              <span class="text-sm font-semibold text-slate-400">{{
                contact.name
              }}</span>
              <button @click="handleDeletingContact(contact)">
                <SVGX class="text-slate-400 w-4 h-4" />
              </button>
            </div>
            <div
              class="flex items-center gap-3 rounded-7.5 px-4.5 py-3 border-2 dark:border-slate-700"
            >
              <ChainLogo
                :stroke="false"
                class="w-6.5 h-6.5"
                :chain="contact.chainId"
              />
              <Copy :text="contact.address" class="flex-1 justify-between">
                <template #content>
                  <span class="dark:text-white text-slate-900">{{
                    shortenHash(contact.address)
                  }}</span>
                </template>
              </Copy>
            </div>
            <span class="text-slate-400" v-if="getSentTimes(contact) !== ''">{{
              getSentTimes(contact)
            }}</span>
            <div class="flex gap-2.5">
              <CommonButton
                color="white"
                class="flex-1 justify-center"
                @click="
                  openAddContactModal(
                    contact.name,
                    contact.address,
                    contact.chainId,
                    true
                  )
                "
              >
                Edit
              </CommonButton>
              <CommonButton
                class="flex-1 justify-center"
                @click="openSendModal(contact.chainId, undefined, contact)"
              >
                Send
              </CommonButton>
            </div>
          </div>
        </template>
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
