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
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "./common";

export declare namespace IAvoWalletV1 {
  export type ActionStruct = {
    target: PromiseOrValue<string>;
    data: PromiseOrValue<BytesLike>;
    value: PromiseOrValue<BigNumberish>;
  };

  export type ActionStructOutput = [string, string, BigNumber] & {
    target: string;
    data: string;
    value: BigNumber;
  };
}

export declare namespace IAvoWalletV2 {
  export type ActionStruct = {
    target: PromiseOrValue<string>;
    data: PromiseOrValue<BytesLike>;
    value: PromiseOrValue<BigNumberish>;
    operation: PromiseOrValue<BigNumberish>;
  };

  export type ActionStructOutput = [string, string, BigNumber, BigNumber] & {
    target: string;
    data: string;
    value: BigNumber;
    operation: BigNumber;
  };

  export type CastParamsStruct = {
    validUntil: PromiseOrValue<BigNumberish>;
    gas: PromiseOrValue<BigNumberish>;
    source: PromiseOrValue<string>;
    id: PromiseOrValue<BigNumberish>;
    metadata: PromiseOrValue<BytesLike>;
  };

  export type CastParamsStructOutput = [
    BigNumber,
    BigNumber,
    string,
    BigNumber,
    string
  ] & {
    validUntil: BigNumber;
    gas: BigNumber;
    source: string;
    id: BigNumber;
    metadata: string;
  };
}

export interface ForwarderInterface extends utils.Interface {
  functions: {
    "avoFactory()": FunctionFragment;
    "avoSafeBytecode()": FunctionFragment;
    "avoSafeNonce(address)": FunctionFragment;
    "avoWalletVersion(address)": FunctionFragment;
    "avoWalletVersionName(address)": FunctionFragment;
    "computeAddress(address)": FunctionFragment;
    "execute(address,(address,bytes,uint256)[],uint256,uint256,address,bytes,bytes)": FunctionFragment;
    "executeV1(address,(address,bytes,uint256)[],uint256,uint256,address,bytes,bytes)": FunctionFragment;
    "executeV2(address,(address,bytes,uint256,uint256)[],(uint256,uint256,address,uint256,bytes),bytes)": FunctionFragment;
    "initialize()": FunctionFragment;
    "verify(address,(address,bytes,uint256)[],uint256,uint256,address,bytes,bytes)": FunctionFragment;
    "verifyV1(address,(address,bytes,uint256)[],uint256,uint256,address,bytes,bytes)": FunctionFragment;
    "verifyV2(address,(address,bytes,uint256,uint256)[],(uint256,uint256,address,uint256,bytes),bytes)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "avoFactory"
      | "avoSafeBytecode"
      | "avoSafeNonce"
      | "avoWalletVersion"
      | "avoWalletVersionName"
      | "computeAddress"
      | "execute"
      | "executeV1"
      | "executeV2"
      | "initialize"
      | "verify"
      | "verifyV1"
      | "verifyV2"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "avoFactory",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "avoSafeBytecode",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "avoSafeNonce",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "avoWalletVersion",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "avoWalletVersionName",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "computeAddress",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "execute",
    values: [
      PromiseOrValue<string>,
      IAvoWalletV1.ActionStruct[],
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<string>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BytesLike>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "executeV1",
    values: [
      PromiseOrValue<string>,
      IAvoWalletV1.ActionStruct[],
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<string>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BytesLike>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "executeV2",
    values: [
      PromiseOrValue<string>,
      IAvoWalletV2.ActionStruct[],
      IAvoWalletV2.CastParamsStruct,
      PromiseOrValue<BytesLike>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "verify",
    values: [
      PromiseOrValue<string>,
      IAvoWalletV1.ActionStruct[],
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<string>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BytesLike>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "verifyV1",
    values: [
      PromiseOrValue<string>,
      IAvoWalletV1.ActionStruct[],
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<string>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BytesLike>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "verifyV2",
    values: [
      PromiseOrValue<string>,
      IAvoWalletV2.ActionStruct[],
      IAvoWalletV2.CastParamsStruct,
      PromiseOrValue<BytesLike>
    ]
  ): string;

  decodeFunctionResult(functionFragment: "avoFactory", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "avoSafeBytecode",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "avoSafeNonce",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "avoWalletVersion",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "avoWalletVersionName",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "computeAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "execute", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "executeV1", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "executeV2", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "verify", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "verifyV1", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "verifyV2", data: BytesLike): Result;

  events: {
    "ExecuteFailed(address,address,address,bytes,string)": EventFragment;
    "Executed(address,address,address,bytes)": EventFragment;
    "Initialized(uint8)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "ExecuteFailed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Executed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Initialized"): EventFragment;
}

export interface ExecuteFailedEventObject {
  avoSafeOwner: string;
  avoSafeAddress: string;
  source: string;
  metadata: string;
  reason: string;
}
export type ExecuteFailedEvent = TypedEvent<
  [string, string, string, string, string],
  ExecuteFailedEventObject
>;

export type ExecuteFailedEventFilter = TypedEventFilter<ExecuteFailedEvent>;

export interface ExecutedEventObject {
  avoSafeOwner: string;
  avoSafeAddress: string;
  source: string;
  metadata: string;
}
export type ExecutedEvent = TypedEvent<
  [string, string, string, string],
  ExecutedEventObject
>;

export type ExecutedEventFilter = TypedEventFilter<ExecutedEvent>;

export interface InitializedEventObject {
  version: number;
}
export type InitializedEvent = TypedEvent<[number], InitializedEventObject>;

export type InitializedEventFilter = TypedEventFilter<InitializedEvent>;

export interface Forwarder extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ForwarderInterface;

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
    avoFactory(overrides?: CallOverrides): Promise<[string]>;

    avoSafeBytecode(overrides?: CallOverrides): Promise<[string]>;

    avoSafeNonce(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    avoWalletVersion(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    avoWalletVersionName(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    computeAddress(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    execute(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    executeV1(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    executeV2(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV2.ActionStruct[],
      params_: IAvoWalletV2.CastParamsStruct,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    initialize(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    verify(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    verifyV1(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    verifyV2(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV2.ActionStruct[],
      params_: IAvoWalletV2.CastParamsStruct,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  avoFactory(overrides?: CallOverrides): Promise<string>;

  avoSafeBytecode(overrides?: CallOverrides): Promise<string>;

  avoSafeNonce(
    owner_: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  avoWalletVersion(
    owner_: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string>;

  avoWalletVersionName(
    owner_: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string>;

  computeAddress(
    owner_: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string>;

  execute(
    from_: PromiseOrValue<string>,
    actions_: IAvoWalletV1.ActionStruct[],
    validUntil_: PromiseOrValue<BigNumberish>,
    gas_: PromiseOrValue<BigNumberish>,
    source_: PromiseOrValue<string>,
    metadata_: PromiseOrValue<BytesLike>,
    signature_: PromiseOrValue<BytesLike>,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  executeV1(
    from_: PromiseOrValue<string>,
    actions_: IAvoWalletV1.ActionStruct[],
    validUntil_: PromiseOrValue<BigNumberish>,
    gas_: PromiseOrValue<BigNumberish>,
    source_: PromiseOrValue<string>,
    metadata_: PromiseOrValue<BytesLike>,
    signature_: PromiseOrValue<BytesLike>,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  executeV2(
    from_: PromiseOrValue<string>,
    actions_: IAvoWalletV2.ActionStruct[],
    params_: IAvoWalletV2.CastParamsStruct,
    signature_: PromiseOrValue<BytesLike>,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  initialize(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  verify(
    from_: PromiseOrValue<string>,
    actions_: IAvoWalletV1.ActionStruct[],
    validUntil_: PromiseOrValue<BigNumberish>,
    gas_: PromiseOrValue<BigNumberish>,
    source_: PromiseOrValue<string>,
    metadata_: PromiseOrValue<BytesLike>,
    signature_: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  verifyV1(
    from_: PromiseOrValue<string>,
    actions_: IAvoWalletV1.ActionStruct[],
    validUntil_: PromiseOrValue<BigNumberish>,
    gas_: PromiseOrValue<BigNumberish>,
    source_: PromiseOrValue<string>,
    metadata_: PromiseOrValue<BytesLike>,
    signature_: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  verifyV2(
    from_: PromiseOrValue<string>,
    actions_: IAvoWalletV2.ActionStruct[],
    params_: IAvoWalletV2.CastParamsStruct,
    signature_: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    avoFactory(overrides?: CallOverrides): Promise<string>;

    avoSafeBytecode(overrides?: CallOverrides): Promise<string>;

    avoSafeNonce(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    avoWalletVersion(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;

    avoWalletVersionName(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;

    computeAddress(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;

    execute(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    executeV1(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    executeV2(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV2.ActionStruct[],
      params_: IAvoWalletV2.CastParamsStruct,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    initialize(overrides?: CallOverrides): Promise<void>;

    verify(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    verifyV1(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    verifyV2(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV2.ActionStruct[],
      params_: IAvoWalletV2.CastParamsStruct,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<boolean>;
  };

  filters: {
    "ExecuteFailed(address,address,address,bytes,string)"(
      avoSafeOwner?: PromiseOrValue<string> | null,
      avoSafeAddress?: PromiseOrValue<string> | null,
      source?: PromiseOrValue<string> | null,
      metadata?: null,
      reason?: null
    ): ExecuteFailedEventFilter;
    ExecuteFailed(
      avoSafeOwner?: PromiseOrValue<string> | null,
      avoSafeAddress?: PromiseOrValue<string> | null,
      source?: PromiseOrValue<string> | null,
      metadata?: null,
      reason?: null
    ): ExecuteFailedEventFilter;

    "Executed(address,address,address,bytes)"(
      avoSafeOwner?: PromiseOrValue<string> | null,
      avoSafeAddress?: PromiseOrValue<string> | null,
      source?: PromiseOrValue<string> | null,
      metadata?: null
    ): ExecutedEventFilter;
    Executed(
      avoSafeOwner?: PromiseOrValue<string> | null,
      avoSafeAddress?: PromiseOrValue<string> | null,
      source?: PromiseOrValue<string> | null,
      metadata?: null
    ): ExecutedEventFilter;

    "Initialized(uint8)"(version?: null): InitializedEventFilter;
    Initialized(version?: null): InitializedEventFilter;
  };

  estimateGas: {
    avoFactory(overrides?: CallOverrides): Promise<BigNumber>;

    avoSafeBytecode(overrides?: CallOverrides): Promise<BigNumber>;

    avoSafeNonce(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    avoWalletVersion(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    avoWalletVersionName(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    computeAddress(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    execute(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    executeV1(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    executeV2(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV2.ActionStruct[],
      params_: IAvoWalletV2.CastParamsStruct,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    initialize(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    verify(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    verifyV1(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    verifyV2(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV2.ActionStruct[],
      params_: IAvoWalletV2.CastParamsStruct,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    avoFactory(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    avoSafeBytecode(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    avoSafeNonce(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    avoWalletVersion(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    avoWalletVersionName(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    computeAddress(
      owner_: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    execute(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    executeV1(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    executeV2(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV2.ActionStruct[],
      params_: IAvoWalletV2.CastParamsStruct,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    initialize(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    verify(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    verifyV1(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV1.ActionStruct[],
      validUntil_: PromiseOrValue<BigNumberish>,
      gas_: PromiseOrValue<BigNumberish>,
      source_: PromiseOrValue<string>,
      metadata_: PromiseOrValue<BytesLike>,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    verifyV2(
      from_: PromiseOrValue<string>,
      actions_: IAvoWalletV2.ActionStruct[],
      params_: IAvoWalletV2.CastParamsStruct,
      signature_: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
