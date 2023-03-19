import { acceptHMRUpdate, defineStore } from "pinia";
import WalletConnect from "@walletconnect/client";
import { IClientMeta } from "@walletconnect/types";
import { signingMethods } from "@walletconnect/utils";
import { RPC_URLS } from "~~/connectors";
import { v4 as uuidv4 } from "uuid";
import { ethers } from "ethers";

const clientMeta = {
  description: "Instadapp Avocado - Safe",
  url: "https://avocado.instadapp.io",
  icons: ["https://walletconnect.org/walletconnect-logo.png"],
  name: "Instadapp Avocado",
};

export const useWalletConnect = defineStore("wallet_connect", () => {
  const safe = useAvocadoSafe();
  const { library, account } = useWeb3();
  const { parseTransactionError } = useErrorHandler();
  const { switchToAvocadoNetwork, switchNetworkByChainId } = useNetworks();
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
            signingMethods: [
              ...signingMethods,
              "eth_sendAvocadoTransaction",
              "eth_sendAvocadoTransactions",
              "eth_getBalance",
              "avocado_sendTransaction",
              "avocado_sendTransactions",
            ],
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

            triggerRef(sessions);
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
              } else if (
                [
                  "eth_sendAvocadoTransaction",
                  "eth_sendAvocadoTransactions",
                  "avocado_sendTransaction",
                  "avocado_sendTransactions",
                ].includes(payload.method)
              ) {
                try {
                  const metadata = encodeDappMetadata({
                    name: wc.peerMeta?.name!,
                    url: wc.peerMeta?.url!,
                  });

                  const { success, payload: msg } =
                    await openWCTransactionModal({
                      modalId: wc.peerId,
                      chainId: String(wc.chainId),
                      payload,
                      wc,
                      metadata,
                    });

                  if (!success) {
                    wc.rejectRequest({
                      id: payload.id,
                      error: {
                        code: -32603,
                        message: msg,
                      },
                    });
                  }
                } catch (error: any) {
                  const err = parseTransactionError(error);

                  wc.rejectRequest({
                    id: payload.id,
                    error: {
                      code: error.code || -32603,
                      message: err,
                    },
                  });
                }
              } else if (payload.method === "eth_sendTransaction") {
                const metadata = encodeDappMetadata({
                  name: wc.peerMeta?.name!,
                  url: wc.peerMeta?.url!,
                });

                const { success, payload: msg } = await openWCTransactionModal({
                  modalId: wc.peerId,
                  chainId: String(wc.chainId),
                  payload,
                  wc,
                  metadata,
                });

                if (!success) {
                  wc.rejectRequest({
                    id: payload.id,
                    error: {
                      code: -32603,
                      message: msg,
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

                triggerRef(sessions);
              } else if (
                payload.method === "eth_signTypedData_v4" &&
                String(payload.params[0]).toLowerCase() ===
                  String(safe.safeAddress.value).toLowerCase()
              ) {
                const params = payload.params;
                const eip712Data = JSON.parse(params[1]);
                if (
                  eip712Data.domain.verifyingContract.toLowerCase() ===
                  "0x000000000022d473030f116ddee9f6b43ac78ba3"
                ) {
                  await switchToAvocadoNetwork();
                  delete eip712Data.types.EIP712Domain;

                  const permit2ABI = [
                    "function approve(address token, address spender, uint160 amount, uint48 expiration) external",
                  ];
                  const approvePermit2Calldata = new ethers.utils.Interface(
                    permit2ABI
                  ).encodeFunctionData("approve", [
                    eip712Data.message.details.token,
                    eip712Data.message.spender,
                    eip712Data.message.details.amount,
                    eip712Data.message.details.expiration,
                  ]);
                  const actions = [
                    {
                      // Permit2 Allowance
                      to: eip712Data.domain.verifyingContract.toLowerCase(),
                      data: approvePermit2Calldata,
                      operation: "0",
                      value: "0",
                    },
                  ];

                  try {
                    const metadata = encodeWCSignMetadata({
                      amount: eip712Data.message.details.amount,
                      token: eip712Data.message.details.token,
                      spender: eip712Data.message.spender,
                      expiration: eip712Data.message.details.expiration,
                    });

                    payload.params = actions;

                    const { success, payload: msg } =
                      await openWCTransactionModal({
                        modalId: wc.peerId,
                        chainId: String(wc.chainId),
                        payload,
                        wc,
                        metadata,
                        isSign: true,
                        signMessageDetails: eip712Data.message.details,
                      });

                    if (!success) {
                      wc.rejectRequest({
                        id: payload.id,
                        error: {
                          code: -32603,
                          message: msg,
                        },
                      });
                    }
                  } catch (error: any) {
                    const err = parseTransactionError(error);

                    wc.rejectRequest({
                      id: payload.id,
                      error: {
                        code: error.code || -32603,
                        message: error,
                      },
                    });

                    notify({
                      type: "error",
                      title: "Transaction sign failed",
                    });
                  }
                } else {
                  // throw not allowed
                }
              } else if (
                signingMethods.includes(payload.method)
                // payload.method === "personal_signx"
              ) {
                await switchNetworkByChainId(wc.chainId);

                let params = payload.params;

                try {
                  const result = await library.value.send(
                    payload.method,
                    params
                  );

                  wc.approveRequest({
                    id: payload.id,
                    result,
                  });
                } catch (error: any) {
                  wc.rejectRequest({
                    id: payload.id,
                    error: {
                      code: error.code || -32603,
                      message: error.message,
                    },
                  });
                }
              } else {
                const resp = await http(RPC_URLS[wc.chainId], {
                  method: "POST",
                  body: {
                    payload,
                  },
                });

                wc.approveRequest({
                  id: payload.id,
                  result: resp.result,
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
          signingMethods: [
            ...signingMethods,
            "eth_sendAvocadoTransaction",
            "eth_sendAvocadoTransactions",
            "eth_getBalance",
            "avocado_sendTransaction",
            "avocado_sendTransactions",
          ],
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
    let storageId = (connector as any)._sessionStorage.storageId;
    try {
      await connector.killSession();
    } catch (error) {}

    storage.value.keys[safe.safeAddress.value] = storage.value.keys[
      safe.safeAddress.value
    ].filter((key) => key !== storageId);

    try {
      window.localStorage.removeItem(storageId);
    } catch (error) {}
  };

  const prepareAndConnect = async (uri: string) => {
    const result = await prepareConnection(uri);

    console.log(result);

    await connect(result.connector, result.storageId, result.chainId);
  };

  const clearWalletConnectStorage = () => {
    window.localStorage.removeItem("wallet_connect");

    Object.keys(window.localStorage).filter((key) => {
      if (key.startsWith("wc_")) {
        window.localStorage.removeItem(key);
      }
    });
  };

  const disconnectAll = async () => {
    for (let connector of sessions.value) {
      await disconnect(connector);
    }
    clearWalletConnectStorage();
  };

  return {
    sessions,
    disconnect,
    prepareConnection,
    connect,
    prepareAndConnect,
    disconnectAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWalletConnect, import.meta.hot));
}
