#! /bin/bash

echo "Installing dependencies"
cd starknet && yarn > /dev/null 2>/dev/null && cd ../ethereum && yarn > /dev/null 2>/dev/null && cd ..
echo "Installed dependencies"

echo;echo

echo "Deploying Starknet Contracts"
cd starknet && yarn deploy && cd ..
echo "Deployed Starknet Contracts"

echo;echo

echo "Deploying Ethereum Contracts"
cd ethereum && yarn deploy && cd ..
echo "Deployed Ethereum Contracts"

echo;echo

echo "Initializing Starknet Contracts"
cd starknet && yarn init_contracts && cd ..