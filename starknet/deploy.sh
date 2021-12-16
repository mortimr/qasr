#! /bin/bash

L1_ERC721_ADDRESS="$1"
L1_GATEWAY_ADDRESS="$2"

L2_ERC721_ADDRESS="$3"
L2_GATEWAY_ADDRESS="$4"

export STARKNET_NETWORK=alpha

starknet invoke \
    --address ${L2_GATEWAY_ADDRESS} \
    --abi ./starknet-artifacts/contracts/gateway.cairo/gateway_abi.json \
    --function initialize \
    --inputs "${L1_GATEWAY_ADDRESS}"

starknet invoke \
    --address ${L2_ERC721_ADDRESS} \
    --abi ./starknet-artifacts/contracts/bridged721.cairo/bridged721_abi.json \
    --function initialize \
    --inputs "${L1_ERC721_ADDRESS}" "${L2_GATEWAY_ADDRESS}"
