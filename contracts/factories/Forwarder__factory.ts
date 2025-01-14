/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { Forwarder, ForwarderInterface } from "../Forwarder";

const _abi = [
  {
    inputs: [
      {
        internalType: "contract IAvoFactory",
        name: "avoFactory_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AvoForwarder__InvalidParams",
    type: "error",
  },
  {
    inputs: [],
    name: "AvoForwarder__LegacyVersionNotDeployed",
    type: "error",
  },
  {
    inputs: [],
    name: "AvoForwarder__Unauthorized",
    type: "error",
  },
  {
    inputs: [],
    name: "AvoForwarder__VersionMismatch",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "avoSafeOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "avoSafeAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "source",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "metadata",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "string",
        name: "reason",
        type: "string",
      },
    ],
    name: "ExecuteFailed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "avoSafeOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "avoSafeAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "source",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "metadata",
        type: "bytes",
      },
    ],
    name: "Executed",
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
    name: "avoFactory",
    outputs: [
      {
        internalType: "contract IAvoFactory",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
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
    inputs: [
      {
        internalType: "address",
        name: "owner_",
        type: "address",
      },
    ],
    name: "avoSafeNonce",
    outputs: [
      {
        internalType: "uint88",
        name: "",
        type: "uint88",
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
    name: "avoWalletVersion",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
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
    name: "avoWalletVersionName",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
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
        name: "from_",
        type: "address",
      },
      {
        components: [
          {
            internalType: "address",
            name: "target",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
        ],
        internalType: "struct IAvoWalletV1.Action[]",
        name: "actions_",
        type: "tuple[]",
      },
      {
        internalType: "uint256",
        name: "validUntil_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "gas_",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "source_",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "metadata_",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "signature_",
        type: "bytes",
      },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from_",
        type: "address",
      },
      {
        components: [
          {
            internalType: "address",
            name: "target",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
        ],
        internalType: "struct IAvoWalletV1.Action[]",
        name: "actions_",
        type: "tuple[]",
      },
      {
        internalType: "uint256",
        name: "validUntil_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "gas_",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "source_",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "metadata_",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "signature_",
        type: "bytes",
      },
    ],
    name: "executeV1",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from_",
        type: "address",
      },
      {
        components: [
          {
            internalType: "address",
            name: "target",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "operation",
            type: "uint256",
          },
        ],
        internalType: "struct IAvoWalletV2.Action[]",
        name: "actions_",
        type: "tuple[]",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "validUntil",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "gas",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "source",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "metadata",
            type: "bytes",
          },
        ],
        internalType: "struct IAvoWalletV2.CastParams",
        name: "params_",
        type: "tuple",
      },
      {
        internalType: "bytes",
        name: "signature_",
        type: "bytes",
      },
    ],
    name: "executeV2",
    outputs: [],
    stateMutability: "payable",
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
        name: "from_",
        type: "address",
      },
      {
        components: [
          {
            internalType: "address",
            name: "target",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
        ],
        internalType: "struct IAvoWalletV1.Action[]",
        name: "actions_",
        type: "tuple[]",
      },
      {
        internalType: "uint256",
        name: "validUntil_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "gas_",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "source_",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "metadata_",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "signature_",
        type: "bytes",
      },
    ],
    name: "verify",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from_",
        type: "address",
      },
      {
        components: [
          {
            internalType: "address",
            name: "target",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
        ],
        internalType: "struct IAvoWalletV1.Action[]",
        name: "actions_",
        type: "tuple[]",
      },
      {
        internalType: "uint256",
        name: "validUntil_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "gas_",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "source_",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "metadata_",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "signature_",
        type: "bytes",
      },
    ],
    name: "verifyV1",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from_",
        type: "address",
      },
      {
        components: [
          {
            internalType: "address",
            name: "target",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "operation",
            type: "uint256",
          },
        ],
        internalType: "struct IAvoWalletV2.Action[]",
        name: "actions_",
        type: "tuple[]",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "validUntil",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "gas",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "source",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "metadata",
            type: "bytes",
          },
        ],
        internalType: "struct IAvoWalletV2.CastParams",
        name: "params_",
        type: "tuple",
      },
      {
        internalType: "bytes",
        name: "signature_",
        type: "bytes",
      },
    ],
    name: "verifyV2",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class Forwarder__factory {
  static readonly abi = _abi;
  static createInterface(): ForwarderInterface {
    return new utils.Interface(_abi) as ForwarderInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Forwarder {
    return new Contract(address, _abi, signerOrProvider) as Forwarder;
  }
}
