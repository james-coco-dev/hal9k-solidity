const { ethers, Wallet, ContractFactory } = require("ethers");
const fs = require("fs");
require("dotenv").config();

const unpackArtifact = (artifactPath) => {
  let contractData = JSON.parse(fs.readFileSync(artifactPath));

  const contractBytecode = contractData["bytecode"];
  const contractABI = contractData["abi"];
  const constructorArgs = contractABI.filter((itm) => {
    return itm.type == "constructor";
  });

  let constructorStr;
  if (constructorArgs.length < 1) {
    constructorStr = "    -- No constructor arguments -- ";
  } else {
    constructorJSON = constructorArgs[0].inputs;
    constructorStr = JSON.stringify(
      constructorJSON.map((c) => {
        return {
          name: c.name,
          type: c.type,
        };
      })
    );
  }

  return {
    abi: contractABI,
    bytecode: contractBytecode,
    contractName: contractData.contractName,
    constructor: constructorStr,
  };
};

const deployContract = async (
  contractABI,
  contractBytecode,
  wallet,
  provider,
  args = []
) => {
  const factory = new ContractFactory(
    contractABI,
    contractBytecode,
    wallet.connect(provider)
  );
  return await factory.deploy(...args);
};

let provider;

if (process.env.NETWORK == "mainnet") {
  provider = ethers.getDefaultProvider("homestead");
  wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
} else if (process.env.NETWORK == "kovan") {
  provider = ethers.getDefaultProvider("kovan");
  wethAddress = "0xd0a1e359811322d97991e03f863a0c30c2cf029c";
} else if (process.env.NETWORK == "rinkeby") {
  provider = ethers.getDefaultProvider("rinkeby");
  wethAddress = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
}

let wallet, connectedWallet;
wallet = Wallet.fromMnemonic(process.env.MNEMONIC);
connectedWallet = wallet.connect(provider);

const deployHal9kToken = async () => {
  // Get the built metadata for our contracts
  let tokenUnpacked = unpackArtifact("./prodartifacts/HAL9K.json");
  console.log(
    `${tokenUnpacked.contractName} \n Constructor: ${tokenUnpacked.constructor}`
  );

  const args = [process.env.UNISWAPROUTER, process.env.UNISWAPFACTORY];

  const token = await deployContract(
    tokenUnpacked.abi,
    tokenUnpacked.bytecode,
    wallet,
    provider,
    args
  );

  console.log(`⌛ Deploying ${tokenUnpacked.contractName}...`);
  await connectedWallet.provider.waitForTransaction(
    token.deployTransaction.hash
  );
  console.log(`✅ Deployed ${tokenUnpacked.contractName} to ${token.address}`);
};

const deployHal9kLtd = async (address) => {
  // Get the built metadata for our contracts
  let tokenUnpacked = unpackArtifact("./prodartifacts/HAL9KLtd.json");
  console.log(
    `${tokenUnpacked.contractName} \n Constructor: ${tokenUnpacked.constructor}`
  );

  const args = [address];

  const token = await deployContract(
    tokenUnpacked.abi,
    tokenUnpacked.bytecode,
    wallet,
    provider,
    args
  );

  console.log(`⌛ Deploying ${tokenUnpacked.contractName}...`);
  await connectedWallet.provider.waitForTransaction(
    token.deployTransaction.hash
  );
  console.log(`✅ Deployed ${tokenUnpacked.contractName} to ${token.address}`);
};

deployHal9kToken();
deployHal9kLtd(process.env.OPENSEAPROXY);
