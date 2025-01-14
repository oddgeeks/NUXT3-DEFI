/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
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

export declare namespace Resolver {
  export type BalanceReturnDataStruct = {
    owner: PromiseOrValue<string>;
    balances: PromiseOrValue<BigNumberish>[];
  };

  export type BalanceReturnDataStructOutput = [string, BigNumber[]] & {
    owner: string;
    balances: BigNumber[];
  };

  export type BalanceDataStruct = {
    owner: PromiseOrValue<string>;
    tokens: PromiseOrValue<string>[];
  };

  export type BalanceDataStructOutput = [string, string[]] & {
    owner: string;
    tokens: string[];
  };

  export type TokenDataStruct = {
    isToken: PromiseOrValue<boolean>;
    name: PromiseOrValue<string>;
    symbol: PromiseOrValue<string>;
    decimals: PromiseOrValue<BigNumberish>;
  };

  export type TokenDataStructOutput = [boolean, string, string, BigNumber] & {
    isToken: boolean;
    name: string;
    symbol: string;
    decimals: BigNumber;
  };
}

export interface BalanceResolverInterface extends utils.Interface {
  functions: {
    "getAllowances(address,address,address[])": FunctionFragment;
    "getBalances(address,address[])": FunctionFragment;
    "getBalancesOfOwners(address[],address[])": FunctionFragment;
    "getBalancesOfOwnersWithTokens((address,address[])[])": FunctionFragment;
    "getTokenDetails(address[])": FunctionFragment;
    "name()": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "getAllowances"
      | "getBalances"
      | "getBalancesOfOwners"
      | "getBalancesOfOwnersWithTokens"
      | "getTokenDetails"
      | "name"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "getAllowances",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>[]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "getBalances",
    values: [PromiseOrValue<string>, PromiseOrValue<string>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getBalancesOfOwners",
    values: [PromiseOrValue<string>[], PromiseOrValue<string>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getBalancesOfOwnersWithTokens",
    values: [Resolver.BalanceDataStruct[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getTokenDetails",
    values: [PromiseOrValue<string>[]]
  ): string;
  encodeFunctionData(functionFragment: "name", values?: undefined): string;

  decodeFunctionResult(
    functionFragment: "getAllowances",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getBalances",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getBalancesOfOwners",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getBalancesOfOwnersWithTokens",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getTokenDetails",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;

  events: {};
}

export interface BalanceResolver extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: BalanceResolverInterface;

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
    getAllowances(
      owner: PromiseOrValue<string>,
      spender: PromiseOrValue<string>,
      tknAddress: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<[BigNumber[]]>;

    getBalances(
      owner: PromiseOrValue<string>,
      tknAddress: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<[BigNumber[]]>;

    getBalancesOfOwners(
      owners: PromiseOrValue<string>[],
      tokens: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<[Resolver.BalanceReturnDataStructOutput[]]>;

    getBalancesOfOwnersWithTokens(
      datas: Resolver.BalanceDataStruct[],
      overrides?: CallOverrides
    ): Promise<[Resolver.BalanceReturnDataStructOutput[]]>;

    getTokenDetails(
      tknAddress: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<[Resolver.TokenDataStructOutput[]]>;

    name(overrides?: CallOverrides): Promise<[string]>;
  };

  getAllowances(
    owner: PromiseOrValue<string>,
    spender: PromiseOrValue<string>,
    tknAddress: PromiseOrValue<string>[],
    overrides?: CallOverrides
  ): Promise<BigNumber[]>;

  getBalances(
    owner: PromiseOrValue<string>,
    tknAddress: PromiseOrValue<string>[],
    overrides?: CallOverrides
  ): Promise<BigNumber[]>;

  getBalancesOfOwners(
    owners: PromiseOrValue<string>[],
    tokens: PromiseOrValue<string>[],
    overrides?: CallOverrides
  ): Promise<Resolver.BalanceReturnDataStructOutput[]>;

  getBalancesOfOwnersWithTokens(
    datas: Resolver.BalanceDataStruct[],
    overrides?: CallOverrides
  ): Promise<Resolver.BalanceReturnDataStructOutput[]>;

  getTokenDetails(
    tknAddress: PromiseOrValue<string>[],
    overrides?: CallOverrides
  ): Promise<Resolver.TokenDataStructOutput[]>;

  name(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    getAllowances(
      owner: PromiseOrValue<string>,
      spender: PromiseOrValue<string>,
      tknAddress: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<BigNumber[]>;

    getBalances(
      owner: PromiseOrValue<string>,
      tknAddress: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<BigNumber[]>;

    getBalancesOfOwners(
      owners: PromiseOrValue<string>[],
      tokens: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<Resolver.BalanceReturnDataStructOutput[]>;

    getBalancesOfOwnersWithTokens(
      datas: Resolver.BalanceDataStruct[],
      overrides?: CallOverrides
    ): Promise<Resolver.BalanceReturnDataStructOutput[]>;

    getTokenDetails(
      tknAddress: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<Resolver.TokenDataStructOutput[]>;

    name(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    getAllowances(
      owner: PromiseOrValue<string>,
      spender: PromiseOrValue<string>,
      tknAddress: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getBalances(
      owner: PromiseOrValue<string>,
      tknAddress: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getBalancesOfOwners(
      owners: PromiseOrValue<string>[],
      tokens: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getBalancesOfOwnersWithTokens(
      datas: Resolver.BalanceDataStruct[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getTokenDetails(
      tknAddress: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    name(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    getAllowances(
      owner: PromiseOrValue<string>,
      spender: PromiseOrValue<string>,
      tknAddress: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getBalances(
      owner: PromiseOrValue<string>,
      tknAddress: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getBalancesOfOwners(
      owners: PromiseOrValue<string>[],
      tokens: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getBalancesOfOwnersWithTokens(
      datas: Resolver.BalanceDataStruct[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getTokenDetails(
      tknAddress: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    name(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
