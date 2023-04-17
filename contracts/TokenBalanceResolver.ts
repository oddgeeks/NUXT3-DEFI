/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "./common";

export declare namespace TokenBalanceResolver {
  export type TokenBalanceStruct = {
    balance: PromiseOrValue<BigNumberish>;
    success: PromiseOrValue<boolean>;
  };

  export type TokenBalanceStructOutput = [BigNumber, boolean] & {
    balance: BigNumber;
    success: boolean;
  };

  export type UserTokenBalancesStruct = {
    user: PromiseOrValue<string>;
    balances: TokenBalanceResolver.TokenBalanceStruct[];
  };

  export type UserTokenBalancesStructOutput = [
    string,
    TokenBalanceResolver.TokenBalanceStructOutput[]
  ] & {
    user: string;
    balances: TokenBalanceResolver.TokenBalanceStructOutput[];
  };

  export type TokenInfoStruct = {
    isToken: PromiseOrValue<boolean>;
    name: PromiseOrValue<string>;
    symbol: PromiseOrValue<string>;
    decimals: PromiseOrValue<BigNumberish>;
  };

  export type TokenInfoStructOutput = [boolean, string, string, number] & {
    isToken: boolean;
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface TokenBalanceResolverInterface extends utils.Interface {
  functions: {
    "getBalances(address,address[])": FunctionFragment;
    "getBalancesForMultipleUsers(address[],address[])": FunctionFragment;
    "getMultipleTokenInfo(address[])": FunctionFragment;
    "getTokenInfo(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "getBalances"
      | "getBalancesForMultipleUsers"
      | "getMultipleTokenInfo"
      | "getTokenInfo"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "getBalances",
    values: [PromiseOrValue<string>, PromiseOrValue<string>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getBalancesForMultipleUsers",
    values: [PromiseOrValue<string>[], PromiseOrValue<string>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getMultipleTokenInfo",
    values: [PromiseOrValue<string>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getTokenInfo",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(
    functionFragment: "getBalances",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getBalancesForMultipleUsers",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getMultipleTokenInfo",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getTokenInfo",
    data: BytesLike
  ): Result;

  events: {};
}

export interface TokenBalanceResolver extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: TokenBalanceResolverInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    getBalances(
      user: PromiseOrValue<string>,
      tokenAddresses: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getBalancesForMultipleUsers(
      users: PromiseOrValue<string>[],
      tokenAddresses: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getMultipleTokenInfo(
      tokens: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getTokenInfo(
      token: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  getBalances(
    user: PromiseOrValue<string>,
    tokenAddresses: PromiseOrValue<string>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getBalancesForMultipleUsers(
    users: PromiseOrValue<string>[],
    tokenAddresses: PromiseOrValue<string>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getMultipleTokenInfo(
    tokens: PromiseOrValue<string>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getTokenInfo(
    token: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    getBalances(
      user: PromiseOrValue<string>,
      tokenAddresses: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<TokenBalanceResolver.UserTokenBalancesStructOutput>;

    getBalancesForMultipleUsers(
      users: PromiseOrValue<string>[],
      tokenAddresses: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<TokenBalanceResolver.UserTokenBalancesStructOutput[]>;

    getMultipleTokenInfo(
      tokens: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<TokenBalanceResolver.TokenInfoStructOutput[]>;

    getTokenInfo(
      token: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<TokenBalanceResolver.TokenInfoStructOutput>;
  };

  filters: {};

  estimateGas: {
    getBalances(
      user: PromiseOrValue<string>,
      tokenAddresses: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getBalancesForMultipleUsers(
      users: PromiseOrValue<string>[],
      tokenAddresses: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getMultipleTokenInfo(
      tokens: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getTokenInfo(
      token: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    getBalances(
      user: PromiseOrValue<string>,
      tokenAddresses: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getBalancesForMultipleUsers(
      users: PromiseOrValue<string>[],
      tokenAddresses: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getMultipleTokenInfo(
      tokens: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getTokenInfo(
      token: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
