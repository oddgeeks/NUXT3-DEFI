import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from '@web3-react/abstract-connector'
import invariant from 'tiny-invariant'
import { CustomNodeConfiguration } from '@magic-sdk/types'
import { ConnectExtension } from "@magic-ext/connect";

interface MagicConnectorArguments {
    apiKey: string
    network: CustomNodeConfiguration
    email: string
}

export class UserRejectedRequestError extends Error {
    public constructor() {
        super()
        this.name = this.constructor.name
        this.message = 'The user rejected the request.'
    }
}

export class FailedVerificationError extends Error {
    public constructor() {
        super()
        this.name = this.constructor.name
        this.message = 'The email verification failed.'
    }
}

export class MagicLinkRateLimitError extends Error {
    public constructor() {
        super()
        this.name = this.constructor.name
        this.message = 'The Magic rate limit has been reached.'
    }
}

export class MagicLinkExpiredError extends Error {
    public constructor() {
        super()
        this.name = this.constructor.name
        this.message = 'The Magic link has expired.'
    }
}

export class CustomMagicConnector extends AbstractConnector {
    private readonly apiKey: string
    private readonly network: CustomNodeConfiguration
    private readonly email: string

    public magic: any

    constructor({ apiKey, network, email }: MagicConnectorArguments) {
        invariant(email && email.includes('@'), `Invalid email: ${email}`)
        super({ supportedChainIds: [network.chainId!] })

        this.apiKey = apiKey
        this.network = network
        this.email = email
    }

    public async activate(): Promise<ConnectorUpdate> {
        const MagicSDK = await import('magic-sdk').then(m => m?.default ?? m)
        const { Magic, RPCError, RPCErrorCode } = MagicSDK

        if (!this.magic) {
            this.magic = new Magic(this.apiKey, {
                network: this.network, extensions: [
                    new ConnectExtension()
                ]
            })
        }

        // const isLoggedIn = await this.magic.user.isLoggedIn()
        // const loggedInEmail = isLoggedIn ? (await this.magic.user.getMetadata()).email : null

        // if (isLoggedIn && loggedInEmail !== this.email) {
        //     await this.magic.user.logout()
        // }

        // if (!isLoggedIn) {
        //     try {
        //         await this.magic.auth.loginWithMagicLink({ email: this.email })
        //     } catch (err) {
        //         if (!(err instanceof RPCError)) {
        //             throw err
        //         }
        //         if (err.code === RPCErrorCode.MagicLinkFailedVerification) {
        //             throw new FailedVerificationError()
        //         }
        //         if (err.code === RPCErrorCode.MagicLinkExpired) {
        //             throw new MagicLinkExpiredError()
        //         }
        //         if (err.code === RPCErrorCode.MagicLinkRateLimited) {
        //             throw new MagicLinkRateLimitError()
        //         }
        //         // This error gets thrown when users close the login window.
        //         // -32603 = JSON-RPC InternalError
        //         if (err.code === -32603) {
        //             throw new UserRejectedRequestError()
        //         }
        //     }
        // }

        const provider = this.magic.rpcProvider
        const account = await provider.enable().then((accounts: string[]): string => accounts[0])

        return { provider, chainId: this.network.chainId, account }
    }

    public async getProvider(): Promise<any> {
        return this.magic.rpcProvider
    }

    public async getChainId(): Promise<number | string> {
        return this.network.chainId!
    }

    public async getAccount(): Promise<null | string> {
        return this.magic.rpcProvider.send('eth_accounts').then((accounts: string[]): string => accounts[0])
    }

    public deactivate() { }

    public async close() {
        await this.magic.user.logout()
        this.emitDeactivate()
    }
}