/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  AvoMultisigFactoryProxy,
  AvoMultisigFactoryProxyInterface,
} from "../AvoMultisigFactoryProxy";

const _abi = [
  {
    inputs: [
      {
        internalType: "contract IAvoRegistry",
        name: "avoRegistry_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AvoFactory__ImplementationNotDefined",
    type: "error",
  },
  {
    inputs: [],
    name: "AvoFactory__IndexNonSequential",
    type: "error",
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
        internalType: "uint32",
        name: "index",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "avoType",
        type: "uint16",
      },
      {
        indexed: true,
        internalType: "address",
        name: "avocado",
        type: "address",
      },
    ],
    name: "AvocadoDeployed",
    type: "event",
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
        indexed: false,
        internalType: "uint32",
        name: "index",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "avoType",
        type: "uint16",
      },
      {
        indexed: true,
        internalType: "address",
        name: "avocado",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "version",
        type: "address",
      },
    ],
    name: "AvocadoDeployedWithVersion",
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
    name: "avoImpl",
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
    inputs: [],
    name: "avoRegistry",
    outputs: [
      {
        internalType: "contract IAvoRegistry",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "avocadoBytecode",
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
    name: "avocadoCreationCode",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
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
      {
        internalType: "uint32",
        name: "index_",
        type: "uint32",
      },
    ],
    name: "computeAvocado",
    outputs: [
      {
        internalType: "address",
        name: "computedAddress_",
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
      {
        internalType: "uint32",
        name: "index_",
        type: "uint32",
      },
    ],
    name: "deploy",
    outputs: [
      {
        internalType: "address",
        name: "deployedAvocado_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner_",
        type: "address",
      },
      {
        internalType: "uint32",
        name: "index_",
        type: "uint32",
      },
      {
        internalType: "address",
        name: "avoVersion_",
        type: "address",
      },
    ],
    name: "deployWithVersion",
    outputs: [
      {
        internalType: "address",
        name: "deployedAvocado_",
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
        name: "avoSmartWallet_",
        type: "address",
      },
    ],
    name: "isAvocado",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "avoImpl_",
        type: "address",
      },
    ],
    name: "setAvoImpl",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "transientDeployData",
    outputs: [
      {
        internalType: "address",
        name: "version_",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "data_",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export class AvoMultisigFactoryProxy__factory {
  static readonly abi = _abi;
  static createInterface(): AvoMultisigFactoryProxyInterface {
    return new utils.Interface(_abi) as AvoMultisigFactoryProxyInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): AvoMultisigFactoryProxy {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as AvoMultisigFactoryProxy;
  }
}