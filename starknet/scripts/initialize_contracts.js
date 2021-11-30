const { spawn } = require("child_process");
const {
  readdirSync,
  fstat,
  existsSync,
  unlinkSync,
  writeFileSync,
} = require("fs");
const { BigNumber } = require("ethers");

async function main() {
  const l2GatewayAddress = require('../starknet-artifacts/contracts/gateway.cairo/gateway.summary.json').address;
  const l2ERC721Address = require('../starknet-artifacts/contracts/bridged721.cairo/bridged721.summary.json').address;
  const l1GatewayAddress = require('../../ethereum/deployments/goerli/Gateway.json').address;
  const l1ERC721Address = require('../../ethereum/deployments/goerli/FakeErc721.json').address;

  const child = spawn("./deploy.sh", [l1ERC721Address, l1GatewayAddress, l2ERC721Address, l2GatewayAddress]);

  for await (const data of child.stdout) {
    process.stdout.write(data.toString());
  }

  for await (const data of child.stderr) {
    process.stderr.write(data.toString());
  }

  console.log()
  console.log(`Visit bridge ui at: /${l1ERC721Address}/${l2ERC721Address}`)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
