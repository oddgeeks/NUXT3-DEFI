import { storeToRefs } from "pinia";
import { ethers } from "ethers"
import { Forwarder__factory, GaslessWallet__factory } from '~~/contracts';
import { IGaslessSmartWallet } from "~~/contracts/Forwarder";


export const useAvocadoSafe = () => {
    const { switchNetworkByChainId } = useNetworks()
    const { account, library } = useWeb3()

    // check if we have a cached safe address
    const { safeAddress, tokenBalances, totalBalance } = storeToRefs(useSafe())


    const sendTransaction = async (transaction: { to: string, value?: string, data?: string, chainId: string | number, dryRun?: boolean, waitForConfirmation?: boolean }) => {
        if (!account.value) return;
        if (!safeAddress.value) return;

        await switchNetworkByChainId(75);

        let targetProvider = getRpcProvider(transaction.chainId);

        const forwarderContract = Forwarder__factory.connect(
            "0x52f30c01795e84e5c12fa29345f1274d517FB865",
            targetProvider
        );

        const buildValidSignature = async (
            actions: IGaslessSmartWallet.ActionStruct[],
            validUntil: number | any, // the highest block number the request can be forwarded in
            gas: number | any, // an amount of gas limit to set for the execution
            source: string,
            metadata: string,
            signer: any, // user signing the txn
            gswNonce: any // gasless wallet nonce
        ) => {

            let name = "Instadapp-Gasless-Smart-Wallet";
            let version = "1.0.0";

            try {
                let gaslessWallet = GaslessWallet__factory.connect(
                    safeAddress.value,
                    getRpcProvider(Number(transaction.chainId)),
                );

                version = await gaslessWallet.DOMAIN_SEPARATOR_VERSION();
                name = await gaslessWallet.DOMAIN_SEPARATOR_VERSION();
            } catch (error) {
                version = await forwarderContract.gswVersion("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
                name = await forwarderContract.gswVersionName("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
            }

            // Creating domain for signing using gasless wallet address as the verifying contract
            let domain = {
                name,
                version,
                chainId: '75',
                salt: ethers.utils.solidityKeccak256(["uint256"], [transaction.chainId]),
                verifyingContract: safeAddress.value,
            }

            // The named list of all type definitions
            const types = {
                Cast: [
                    { name: "actions", type: "Action[]" },
                    { name: "validUntil", type: "uint256" },
                    { name: "gas", type: "uint256" },
                    { name: "source", type: "address" },
                    { name: "metadata", type: "bytes" },
                    { name: "gswNonce", type: "uint256" },
                ],
                Action: [
                    { name: "target", type: "address" },
                    { name: "data", type: "bytes" },
                    { name: "value", type: "uint256" },
                ],
            };

            // Adding values for types mentioned
            const value = {
                actions,
                validUntil,
                gas,
                source,
                metadata,
                gswNonce,
            }

            console.log({domain, types, value})
            return await signer._signTypedData(domain, types, value)
        }

        const gswNonce = await forwarderContract.gswNonce(account.value).then(String);

        const signatureData = {
            actions: [
                {
                    target: transaction.to,
                    data: transaction.data || "0x",
                    value: transaction.value || "0",
                }
            ],
            metadata: '0x',
            source: "0x0000000000000000000000000000000000000001",
            gswNonce,
            validUntil: "0",
            gas: "8000000",
        }

        const signature = await buildValidSignature(
            signatureData.actions,
            signatureData.validUntil,
            signatureData.gas,
            signatureData.source,
            signatureData.metadata,
            library.value.getSigner(),
            signatureData.gswNonce,
        )

        // const { data: transactionHash } = await axios.post("https://avocado.api.instad.app/relay", {
        //     targetChainId: Number(transaction.chainId),
        //     signature: signature.toString(),
        //     signer: account.value,
        //     message: signatureData
        // })

        const avoProvider = getRpcProvider(75);

        let transactionHash = await avoProvider.send("txn_broadcast", [
            signature,
            signatureData, // signature
            account.value, //signer 
            String(transaction.chainId), // targetChainId
            transaction.dryRun ? transaction.dryRun : false,
        ])

        if (transactionHash === "0x") {
            throw Error("Tx failed!")
        }

        if (transaction.waitForConfirmation) {
            await avoProvider.waitForTransaction(transactionHash, 0, 60_000)

            return transactionHash;
        }

        return transactionHash
    }

    const estimateGas = async (transaction: { to: string, value?: string, data?: string, chainId: string | number }) => {
        return await sendTransaction({ ...transaction, dryRun: true })
    }

    const sendTransactions = async (transactions: { to: string, value?: string, data?: string }[], chainId: string | number, dryRun: boolean = false) => {
        if (!account.value) return;
        if (!safeAddress.value) return;

        await switchNetworkByChainId(75);

        let targetProvider = getRpcProvider(chainId);

        const forwarderContract = Forwarder__factory.connect(
            "0x52f30c01795e84e5c12fa29345f1274d517FB865",
            targetProvider
        );
        const buildValidSignature = async (
            actions: IGaslessSmartWallet.ActionStruct[],
            validUntil: number | any, // the highest block number the request can be forwarded in
            gas: number | any, // an amount of gas limit to set for the execution
            source: string,
            metadata: string,
            signer: any, // user signing the txn
            gswNonce: any // gasless wallet nonce
        ) => {

            let name = "Instadapp-Gasless-Smart-Wallet";
            let version = "1.0.0";

            try {
                let gaslessWallet = GaslessWallet__factory.connect(
                    safeAddress.value,
                    getRpcProvider(Number(chainId)),
                );

                version = await gaslessWallet.DOMAIN_SEPARATOR_VERSION();
                name = await gaslessWallet.DOMAIN_SEPARATOR_VERSION();
            } catch (error) {
                version = await forwarderContract.gswVersion("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
                name = await forwarderContract.gswVersionName("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
            }

            // Creating domain for signing using gasless wallet address as the verifying contract
            let domain = {
                name,
                version,
                chainId: '75',
                salt: ethers.utils.solidityKeccak256(["uint256"], [chainId]),
                verifyingContract: safeAddress.value,
            }

            // The named list of all type definitions
            let types = {
                Cast: [
                    { name: "actions", type: "Action[]" },
                    { name: "validUntil", type: "uint256" },
                    { name: "gas", type: "uint256" },
                    { name: "source", type: "address" },
                    { name: "metadata", type: "bytes" },
                    { name: "gswNonce", type: "uint256" },
                ],
                Action: [
                    { name: "target", type: "address" },
                    { name: "data", type: "bytes" },
                    { name: "value", type: "uint256" },
                ],
            }

            // Adding values for types mentioned
            const value = {
                actions,
                validUntil,
                gas,
                source,
                metadata,
                gswNonce,
            }

            return await signer._signTypedData(domain, types, value)
        }

        const gswNonce = await forwarderContract.gswNonce(account.value).then(String);

        const signatureData = {
            actions: transactions.map(transaction => ({
                target: transaction.to,
                data: transaction.data || "0x",
                value: transaction.value || "0",
            })),
            metadata: '0x',
            source: '0x0000000000000000000000000000000000000001',
            gswNonce,
            validUntil: "0",
            gas: "8000000",
        }

        const signature = await buildValidSignature(
            signatureData.actions,
            signatureData.validUntil,
            signatureData.gas,
            signatureData.source,
            signatureData.metadata,
            library.value.getSigner(),
            signatureData.gswNonce,
        )

        // const { data: transactionHash } = await axios.post("https://avocado.api.instad.app/relay", {
        //     targetChainId: Number(chainId),
        //     signature: signature.toString(),
        //     signer: account.value,
        //     message: signatureData
        // })

        let transactionHash = await getRpcProvider(75).send("txn_broadcast", [
            signature,
            signatureData, // signature
            account.value, //signer 
            String(chainId), // targetChainId
            dryRun,
        ])

        if (transactionHash === "0x") {
            throw Error("Tx failed!")
        }

        return transactionHash
    }

    return {
        tokenBalances,
        totalBalance,
        safeAddress,
        estimateGas,
        sendTransaction,
        sendTransactions,
    }
}