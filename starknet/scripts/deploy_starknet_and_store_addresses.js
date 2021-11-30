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
  console.log(
    "Running starknet-compile + starknet-deploy and storing addresses in artifacts"
  );
  console.log();

  const childCompile = spawn("npx", ["hardhat", "starknet-compile"]);

  console.log(`Compiling ...`);
  let err = false;
  for await (const data of childCompile.stderr) {
    process.stderr.write(data.toString());
    err = true;
  }
  if (err) {
    process.exit(1);
  }
  console.log(`Compiled`);

  const childDeploy = spawn(
    "npx",
    ["hardhat", "starknet-deploy", "--starknet-network", "alpha"],
    { detached: true }
  );

  let allData = Buffer.from("");

  console.log(`Deploying ...`);
  err = false;
  for await (const data of childDeploy.stderr) {
    process.stderr.write(data.toString());
    err = true;
  }
  if (err) {
    process.exit(1);
  }
  for await (const data of childDeploy.stdout) {
    // process.stdout.write(data.toString());
    allData = Buffer.concat([allData, data]);
  }
  console.log("Deployed");

  const contracts = readdirSync("./contracts").sort();
  const contractIndexes = [];

  for (const contract of contracts) {
    contractIndexes.push(allData.indexOf(contract));
  }

  const contractOutput = [];

  let startIdx = 0;

  for (let idx = 1; idx < contractIndexes.length; ++idx) {
    contractOutput.push(
      allData.slice(startIdx, contractIndexes[idx]).toString()
    );
    startIdx = contractIndexes[idx];
  }
  contractOutput.push(allData.slice(startIdx).toString());

  for (let idx = 0; idx < contractOutput.length; ++idx) {
    const address = contractOutput[idx].match(
      /Contract address: (0x[a-fA-F0-9]+)/
    )[1];
    const txHash = contractOutput[idx].match(
      /Transaction hash: (0x[a-fA-F0-9]+)/
    )[1];
    const shortName = contracts[idx].split(".").slice(0, -1).join(".");

    console.log(`Contract ${contracts[idx]} summary:`);
    console.log(`Deployed at https://voyager.online/contract/${address}`);
    console.log(`With tx https://voyager.online/tx/${txHash}`);
    console.log(
      `Saving to ./starknet-artifacts/contracts/${contracts[idx]}/${contracts[idx]}.summary.json`
    );
    if (
      existsSync(
        `./starknet-artifacts/contracts/${contracts[idx]}/${shortName}.summary.json`
      )
    ) {
      unlinkSync(
        `./starknet-artifacts/contracts/${contracts[idx]}/${shortName}.summary.json`
      );
    }
    writeFileSync(
      `./starknet-artifacts/contracts/${contracts[idx]}/${shortName}.summary.json`,
      JSON.stringify(
        {
          address,
          txHash,
        },
        null,
        4
      )
    );
    console.log();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
