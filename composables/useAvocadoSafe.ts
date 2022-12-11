import { storeToRefs } from "pinia";
import { ethers } from "ethers"
import { Forwarder__factory, GaslessWallet__factory } from '~~/contracts';


export const useAvocadoSafe = () => {
    const { switchNetworkByChainId } = useNetworks()
    const { account, library } = useWeb3()

    // check if we have a cached safe address
    const { safeAddress, tokenBalances, totalBalance } = storeToRefs(useSafe())


    const sendTransaction = async (transaction: { to: string, value?: string, data?: string, chainId: string | number, dryRun?: boolean, waitForConfirmation?: boolean }) => {
        if (!account.value) return;
        if (!safeAddress.value) return;

        await switchNetworkByChainId(420);

        let targetProvider = getRpcProvider(transaction.chainId);

        const forwarderContract = Forwarder__factory.connect(
            "0xbECEC328B5EF45c6e41d3C15b2253236646eA8cF",
            targetProvider
        );

        const buildValidSignature = async (
            targets: string[], // the targets to execute the actions on
            datas: string[], // the data to be passed to the .call for each target
            values: number[] | any[], // the msg.value to be passed
            validUntil: number | any, // the highest block number the request can be forwarded in
            gas: number | any, // an amount of gas limit to set for the execution
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

                version = await gaslessWallet.domainSeparatorVersion();
                name = await gaslessWallet.domainSeparatorName();
            } catch (error) { }

            // Creating domain for signing using gasless wallet address as the verifying contract
            let domain = {
                name,
                version,
                chainId: '420',
                salt: ethers.utils.solidityKeccak256(["uint256"], [transaction.chainId]),
                verifyingContract: safeAddress.value,
            }

            // The named list of all type definitions
            let types = {
                Cast: [
                    { name: "targets", type: "address[]" },
                    { name: "datas", type: "bytes[]" },
                    { name: "values", type: "uint256[]" },
                    { name: "gswNonce", type: "uint256" },
                    { name: "validUntil", type: "uint256" },
                    { name: "gas", type: "uint256" },
                ],
            }

            // Adding values for types mentioned
            const value = {
                targets,
                datas,
                values,
                gswNonce,
                validUntil,
                gas,
            }

            return await signer._signTypedData(domain, types, value)
        }

        const gswNonce = await forwarderContract.gswNonce(account.value).then(String);

        const signatureData = {
            targets: [transaction.to],
            datas: [transaction.data || "0x"],
            values: [transaction.value || "0"],
            gswNonce,
            validUntil: "0",
            gas: "8000000",
        }

        const signature = await buildValidSignature(
            signatureData.targets,
            signatureData.datas,
            signatureData.values,
            signatureData.validUntil,
            signatureData.gas,
            library.value.getSigner(),
            signatureData.gswNonce,
        )

        // const { data: transactionHash } = await axios.post("https://avocado.api.instad.app/relay", {
        //     targetChainId: Number(transaction.chainId),
        //     signature: signature.toString(),
        //     signer: account.value,
        //     message: signatureData
        // })

        const avoProvider = getRpcProvider(420);

        let transactionHash = await avoProvider.send("txn_relay", [
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

        await switchNetworkByChainId(420);

        let targetProvider = getRpcProvider(chainId);

        const forwarderContract = Forwarder__factory.connect(
            "0xbECEC328B5EF45c6e41d3C15b2253236646eA8cF",
            targetProvider
        );

        const buildValidSignature = async (
            targets: string[], // the targets to execute the actions on
            datas: string[], // the data to be passed to the .call for each target
            values: number[] | any[], // the msg.value to be passed
            validUntil: number | any, // the highest block number the request can be forwarded in
            gas: number | any, // an amount of gas limit to set for the execution
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

                version = await gaslessWallet.domainSeparatorVersion();
                name = await gaslessWallet.domainSeparatorName();
            } catch (error) { }

            // Creating domain for signing using gasless wallet address as the verifying contract
            let domain = {
                name,
                version,
                chainId: '420',
                salt: ethers.utils.solidityKeccak256(["uint256"], [chainId]),
                verifyingContract: safeAddress.value,
            }

            // The named list of all type definitions
            let types = {
                Cast: [
                    { name: "targets", type: "address[]" },
                    { name: "datas", type: "bytes[]" },
                    { name: "values", type: "uint256[]" },
                    { name: "gswNonce", type: "uint256" },
                    { name: "validUntil", type: "uint256" },
                    { name: "gas", type: "uint256" },
                ],
            }

            // Adding values for types mentioned
            const value = {
                targets,
                datas,
                values,
                gswNonce,
                validUntil,
                gas,
            }

            return await signer._signTypedData(domain, types, value)
        }

        const gswNonce = await forwarderContract.gswNonce(account.value).then(String);

        const signatureData = {
            targets: transactions.map(t => t.to),
            datas: transactions.map(t => t.data || "0x"),
            values: transactions.map(t => t.value || "0"),
            gswNonce,
            validUntil: "0",
            gas: "8000000",
        }

        const signature = await buildValidSignature(
            signatureData.targets,
            signatureData.datas,
            signatureData.values,
            signatureData.validUntil,
            signatureData.gas,
            library.value.getSigner(),
            signatureData.gswNonce,
        )

        // const { data: transactionHash } = await axios.post("https://avocado.api.instad.app/relay", {
        //     targetChainId: Number(chainId),
        //     signature: signature.toString(),
        //     signer: account.value,
        //     message: signatureData
        // })

        let transactionHash = await getRpcProvider(420).send("txn_relay", [
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