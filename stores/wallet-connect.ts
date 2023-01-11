import { acceptHMRUpdate, defineStore } from "pinia";
import WalletConnect from "@walletconnect/client";
import { IClientMeta } from "@walletconnect/types";
import { signingMethods } from "@walletconnect/utils";
import { RPC_URLS } from "~~/connectors";
import { v4 as uuidv4 } from "uuid";

const clientMeta = {
  description: "Instadapp Avocado - Safe",
  url: "https://avocado.link",
  icons: ["https://walletconnect.org/walletconnect-logo.png"],
  name: "Instadapp Avocado",
};

export const useWalletConnect = defineStore("wallet_connect", () => {
  const selfDisconnect = ref(false);
  const safe = useAvocadoSafe();
  const { library, account } = useWeb3();
  const storage = useLocalStorage<{ keys: Record<string, string[]> }>(
    "wallet_connect",
    {
      keys: {},
    }
  );

  const sessions = computed(() => {
    if (!storage.value.keys[safe.safeAddress.value]) {
      storage.value.keys[safe.safeAddress.value] = [];
      return [];
    }

    const ids = storage.value.keys[safe.safeAddress.value];

    return ids
      .map((id: string) => {
        try {
          let wc = new WalletConnect({
            storageId: id,
            session: JSON.parse(localStorage.getItem(id)!),
            signingMethods: [...signingMethods, "eth_getBalance"],
          });

          wc.networkId = wc.chainId;
          wc.rpcUrl = RPC_URLS[wc.chainId];

          wc.updateSession({
            chainId: wc.chainId,
            networkId: wc.chainId,
            rpcUrl: RPC_URLS[wc.chainId],
            accounts: [safe.safeAddress.value],
          });

          wc.on("session_request", (error, payload) => {
            console.log("session_request", error, payload);
            if (error) {
              throw error;
            }

            wc.approveSession({
              chainId: wc.chainId,
              networkId: wc.chainId,
              rpcUrl: RPC_URLS[wc.chainId],
              accounts: [safe.safeAddress.value],
            });
          });

          wc.on("call_request", async (error, payload) => {
            if (error) {
              throw error;
            }
            console.log(payload);

            if (payload.method) {
              if (payload.method === "eth_getBalance") {
                wc.approveRequest({
                  id: payload.id,
                  result: "0x0de0b6b3a7640000",
                });
              } else if (payload.method === "eth_requestAccounts") {
                wc.approveRequest({
                  id: payload.id,
                  result: [safe.safeAddress.value],
                });
              } else if (payload.method === "eth_sendTransaction") {
                try {
                  let hash = await safe.sendTransaction({
                    ...payload.params[0],
                    chainId: wc.chainId,
                  });

                  wc.approveRequest({
                    id: payload.id,
                    result: hash,
                  });
                } catch (error: any) {
                  wc.rejectRequest({
                    id: payload.id,
                    error: {
                      code: -32603,
                      message: error.message,
                    },
                  });
                }
              } else if (payload.method === "wallet_switchEthereumChain") {
                let chainId = toBN(payload.params[0].chainId).toNumber();

                // wc.chainId
                // wc.networkId = chainId;
                // wc.rpcUrl = RPC_URLS[chainId]

                wc.updateSession({
                  chainId: chainId,
                  networkId: chainId,
                  rpcUrl: RPC_URLS[chainId],
                  accounts: [safe.safeAddress.value],
                });

                wc.approveRequest({
                  id: payload.id,
                  result: payload.params[0].chainId,
                });
              } else if (
                // signingMethods.includes(payload.method)
                payload.method === "personal_sign"
              ) { // broken code

                let params = payload.params;

                params[1] = account.value;

                const result = await library.value.send(payload.method, payload.params);

                wc.approveRequest({
                  id: payload.id,
                  result,
                });

              } else {
                const { data } = await http.post(RPC_URLS[wc.chainId], payload);

                wc.approveRequest({
                  id: payload.id,
                  result: data.result,
                });
              }
            }
          });

          wc.on("disconnect", async (error, payload) => {
            if (error) {
              throw error;
            }

            storage.value.keys[safe.safeAddress.value] = storage.value.keys[
              safe.safeAddress.value
            ].filter((key) => key !== id);

            if (!selfDisconnect.value) {
              openDialogModal({
                title: "Connected Failed",
                content: `This WalletConnect link is expired or timed out or this dapp cannot be connected! Try again with a new link!`,
                type: "error",
                buttonText: "Try Again",
                callback: () => {
                  setTimeout(() => {
                    openWalletConnectModal();
                  }, 10);
                },
              });
            }

            selfDisconnect.value = false;
          });

          return wc;
        } catch (error) {
          storage.value.keys[safe.safeAddress.value] = storage.value.keys[
            safe.safeAddress.value
          ].filter((key) => key !== id);
          return null;
        }
      })
      .filter(Boolean) as WalletConnect[];
  });

  const prepareConnection = async (
    uri: string
  ): Promise<{
    connector: WalletConnect;
    chainId: number;
    peerMeta: IClientMeta;
    storageId: string;
  }> => {
    let storageId = `wc_${safe.safeAddress.value}_${uuidv4()}`;

    //@ts-ignore
    return await Promise.race([
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("NOPE"));
        }, 5000);
      }),
      new Promise<{
        connector: WalletConnect;
        chainId: number;
        peerMeta: IClientMeta;
        storageId: string;
      }>((resolve, reject) => {
        const connector = new WalletConnect({
          uri: uri,
          clientMeta,
          storageId,
          signingMethods: [...signingMethods, "eth_getBalance"],
        });

        connector.on("session_request", (error, payload) => {
          console.log("session_request", error, payload);
          if (error) {
            throw error;
          }

          resolve({
            storageId,
            connector,
            chainId: payload.params[0].chainId || 137,
            peerMeta: payload.params[0].peerMeta,
          });
        });
      }),
    ]);
  };

  const connect = async (
    connector: WalletConnect,
    storageKey: string,
    chainId: number
  ) => {
    if (!connector.connected) {
      connector.approveSession({
        chainId: chainId,
        networkId: chainId,
        rpcUrl: RPC_URLS[chainId],
        accounts: [safe.safeAddress.value],
      });
    }

    if (!storage.value.keys[safe.safeAddress.value]) {
      storage.value.keys[safe.safeAddress.value] = [];
    }

    storage.value.keys[safe.safeAddress.value] = [
      ...new Set([...storage.value.keys[safe.safeAddress.value], storageKey]),
    ];
  };

  const disconnect = async (connector: WalletConnect) => {
    selfDisconnect.value = true;
    let storageId = (connector as any)._sessionStorage.storageId;
    try {
      await connector.killSession();
    } catch (error) { }

    storage.value.keys[safe.safeAddress.value] = storage.value.keys[
      safe.safeAddress.value
    ].filter((key) => key !== storageId);

    try {
      window.localStorage.removeItem(storageId)
    } catch (error) {
    }
  };

  const prepareAndConnect = async (uri: string) => {
    const result = await prepareConnection(uri);

    console.log(result);

    await connect(result.connector, result.storageId, result.chainId);
  };

  return {
    sessions,
    disconnect,
    prepareConnection,
    connect,
    prepareAndConnect,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWalletConnect, import.meta.hot));
}
