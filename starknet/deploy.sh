#! /bin/bash

L1_ERC721_ADDRESS="0xb1F60446003ff4165c0729f2B2A32A5505fc4FBe"
L1_GATEWAY_ADDRESS="0x2F6c417C31f5Df3b86DDC9ECC59c33A0b9343062"

L2_ERC721_ADDRESS="0x06318dd3a9aae3706cfc5c565fe1da5ce997ded76c6caf6d3bc9dc9d28428582"
L2_GATEWAY_ADDRESS="0x0270aa8821fe19cbd2b43a519382b9ff13ee95c042af4e9e21c9e6a3312a0849"

export STARKNET_NETWORK=alpha

starknet invoke \
    --address ${L2_GATEWAY_ADDRESS} \
    --abi ./starknet-artifacts/contracts/gateway.cairo/gateway_abi.json \
    --function initialize \
    --inputs "${L1_GATEWAY_ADDRESS}"

starknet invoke \
    --address ${L2_ERC721_ADDRESS} \
    --abi ./starknet-artifacts/contracts/warped721.cairo/warped721_abi.json \
    --function initialize \
    --inputs "${L1_ERC721_ADDRESS}" "${L2_GATEWAY_ADDRESS}"
