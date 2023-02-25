/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  AvoFactoryProxy,
  AvoFactoryProxyInterface,
} from "../AvoFactoryProxy";

const _abi = [
  {
    inputs: [
      {
        internalType: "contract IAvoVersionsRegistry",
        name: "avoVersionsRegistry_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AvoFactory__InvalidParams",
    type: "error",
  },
  {
    inputs: [],
    name: "AvoFactory__NotEOA",
    type: "error",
  },
  {
    inputs: [],
    name: "AvoFactory__Unauthorized",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "avoSafe",
        type: "address",
      },
    ],
    name: "AvoSafeDeployed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "version",
        type: "uint8",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    inputs: [],
    name: "avoSafeBytecode",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "avoVersionsRegistry",
    outputs: [
      {
        internalType: "contract IAvoVersionsRegistry",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "avoWalletImpl",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner_",
        type: "address",
      },
    ],
    name: "computeAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner_",
        type: "address",
      },
    ],
    name: "deploy",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "avoWalletImpl_",
        type: "address",
      },
    ],
    name: "setAvoWalletImpl",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class AvoFactoryProxy__factory {
  static readonly abi = _abi;
  static createInterface(): AvoFactoryProxyInterface {
    return new utils.Interface(_abi) as AvoFactoryProxyInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): AvoFactoryProxy {
    return new Contract(address, _abi, signerOrProvider) as AvoFactoryProxy;
  }
}
