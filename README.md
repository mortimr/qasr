# Qasr:

[Qasr](https://en.wikipedia.org/wiki/Qasr_El_Nil_Bridge) is a simple NFT bridge for Starknet.

Here's the flow:

- On L1 we create a gateway (you will find it in ethereum/contracts/Gateway.sol).
- On L2 we create another gateway (you will find it in starknet/contracts/gateway.cairo).
- On L2 we create a mirror NFT contract of the NFT we wish to bridge (this should be done once, by the creator of the NFT on L1).
- We then take our NFT on L1 and send it to our L1 gateway by calling the "warptoStarknet" method.
- The L1 gateway send a message to the L2 gateway
- The L2 gateway receives the message and handles it in `bridge_from_mainnet`. The gateway creates `mint credits` corresponding to a right to claim an NFT.
- The L2 user can now go and "claim" his NFT to the L2 gateway with `consume_mint_credits`. The gateway will call the L2 smart-contract and mint the appropriate NFT (see function `create_token`).

<!-- Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
``` -->
