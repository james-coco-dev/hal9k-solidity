const { ethers, Wallet, ContractFactory, Contract } = require("ethers");
const fs = require("fs");
require("dotenv").config();

//----------artifact path-------------
const proxyAdminArtifact = "./prodartifacts/ProxyAdmin.json";
const hal9kVaultArtifact = "./prodartifacts/Hal9kVault.json";
const hal9kArtifact = "./prodartifacts/HAL9K.json";
const adminUpgradeabilityProxyArtifact =
  "./prodartifacts/AdminUpgradeabilityProxy.json";
const feeApproverArtifact = "./prodartifacts/FeeApprover.json";
const hal9kv1RouterArtifact = "./prodartifacts/Hal9kv1Router.json";
const hal9kNFTPoolArtifact = "./prodartifacts/HAL9KNFTPool.json";
const UniswapV2Factory = "./prodartifacts/IUniswapV2Factory.json";

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

let provider, wethAddress;

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

const deployContract = async (contractABI, contractBytecode, args = []) => {
  try {
    const factory = new ContractFactory(
      contractABI,
      contractBytecode,
      connectedWallet
    );
    return await factory.deploy(...args);
  } catch (error) {
    console.log("deployContract ====>", error);
  }
};

const deploy = async (artifactPath, args) => {
  try {
    let tokenUnpacked = unpackArtifact(artifactPath);

    console.log(
      `${tokenUnpacked.contractName} \n Constructor: ${tokenUnpacked.constructor}`
    );
    const token = await deployContract(
      tokenUnpacked.abi,
      tokenUnpacked.bytecode,
      args
    );
    console.log(`⌛ Deploying ${tokenUnpacked.contractName}...`);

    await connectedWallet.provider.waitForTransaction(
      token.deployTransaction.hash
    );
    console.log(
      `✅ Deployed ${tokenUnpacked.contractName} to ${token.address}`
    );
  } catch (err) {
    console.log("deploy ======>", err);
  }
};

const initHal9kVault = async () => {
  try {
    let tokenUnpacked = unpackArtifact(hal9kVaultArtifact);
    let hal9kVault = new Contract(
      deployedHal9kVaultProxy,
      tokenUnpacked.abi,
      connectedWallet
    );
    let initTxn = await hal9kVault.initialize(
      hal9kTokenAddress,
      deployedHal9kNFTPoolProxy,
      devAddr,
      devAddr
    );
    console.log(`⌛ Initialize Hal9kVault...`);
    await connectedWallet.provider.waitForTransaction(initTxn.hash);
    console.log(`✅ Initialized Hal9kVault on token at ${hal9kVault.address}`);
  } catch (error) {
    console.log("initHal9kVault ====>", error);
  }
};

const initFeeApprover = async () => {
  try {
    let tokenUnpacked = unpackArtifact(feeApproverArtifact);
    let feeApprover = new Contract(
      deployedFeeApproverAddress,
      tokenUnpacked.abi,
      connectedWallet
    );
    let initTxn = await feeApprover.initialize(
      hal9kTokenAddress,
      wethAddress,
      process.env.UNISWAPFACTORY
    );

    console.log(`⌛ Initialize FeeApprover...`);
    await connectedWallet.provider.waitForTransaction(initTxn.hash);
    console.log(
      `✅ Initialized FeeApprover on token at ${feeApprover.address}`
    );
    let pauseTxn = await feeApprover.setPaused(false);

    console.log(`⌛ SetPaused FeeApprover...`);
    await connectedWallet.provider.waitForTransaction(pauseTxn.hash);
    console.log(`✅ SetPaused FeeApprover on token at ${feeApprover.address}`);

    let hal9kTokenUnpacked = unpackArtifact(hal9kArtifact);
    let token = new Contract(
      hal9kTokenAddress,
      hal9kTokenUnpacked.abi,
      connectedWallet
    );

    let setTransferCheckerResult = await token.setShouldTransferChecker(
      feeApprover.address
    );
    console.log(`⌛ setShouldTransferChecker...`);
    await connectedWallet.provider.waitForTransaction(
      setTransferCheckerResult.hash
    );
    console.log(
      `✅ Called setShouldTransferChecker(${feeApprover.address} on token at ${token.address})`
    );

    let setFeeDistributorResult = await token.setFeeDistributor(devAddr);
    console.log(`⌛ setFeeDistributor...`);
    await connectedWallet.provider.waitForTransaction(
      setFeeDistributorResult.hash
    );
    console.log(
      `✅ Called setFeeDistributor(${devAddr} on token at ${token.address})`
    );

    let setHal9kVaultAddressTxn = await feeApprover.setHal9kVaultAddress(
      deployedHal9kVaultProxy
    );

    console.log(`⌛ setHal9kVaultAddress FeeApprover...`);
    await connectedWallet.provider.waitForTransaction(
      setHal9kVaultAddressTxn.hash
    );
    console.log(
      `✅ setHal9kVaultAddress FeeApprover on token at ${feeApprover.address}`
    );
  } catch (err) {
    console.log("initFeeApprover ===>", err);
  }
};

const initHal9kNftPool = async () => {
  try {
    let tokenUnpacked = unpackArtifact(hal9kNFTPoolArtifact);
    let hal9knftpool = new Contract(
      deployedHal9kNFTPoolProxy,
      tokenUnpacked.abi,
      connectedWallet
    );
    let initTxn = await hal9knftpool.initialize(
      deployedHal9kLtdAddress,
      deployedHal9kVaultProxy,
      devAddr
    );
    console.log(`⌛ Initialize Hal9kNftPool...`);
    await connectedWallet.provider.waitForTransaction(initTxn.hash);
    console.log(
      `✅ Initialized Hal9kNftPool on token at ${hal9knftpool.address}`
    );
  } catch (error) {
    console.log("initHal9kNftPool ====>", error);
  }
};

const initV1Router = async () => {
  try {
    let tokenUnpacked = unpackArtifact(hal9kv1RouterArtifact);
    let hal9kV1Router = new Contract(
      deployedRouterAddress,
      tokenUnpacked.abi,
      connectedWallet
    );
    let initTxn = await hal9kV1Router.initialize(
      hal9kTokenAddress,
      wethAddress,
      process.env.UNISWAPFACTORY,
      deployedFeeApproverAddress,
      deployedHal9kVaultProxy
    );
    console.log(`⌛ Initialize Hal9kV1Router...`);
    await connectedWallet.provider.waitForTransaction(initTxn.hash);
    console.log(
      `✅ Initialized Hal9kV1Router on token at ${hal9kV1Router.address}`
    );
  } catch (error) {
    console.log("initHal9kV1Router ====>", error);
  }
};

const addHal9kETHPool = async () => {
  try {
    let tokenUnpacked = unpackArtifact(hal9kVaultArtifact);
    let hal9kVault = new Contract(
      deployedHal9kVaultProxy,
      tokenUnpacked.abi,
      connectedWallet
    );
    //get uniswap pair
    let uniswapFactoryUnpacked = unpackArtifact(UniswapV2Factory);
    let uniswapFactory = new Contract(
      process.env.UNISWAPFACTORY,
      uniswapFactoryUnpacked.abi,
      connectedWallet
    );
    const pairAddress = await uniswapFactory.getPair(
      wethAddress,
      hal9kTokenAddress
    );
    console.log("Uniswap Pair =====> ", pairAddress);
    let initTxn = await hal9kVault.add(100, pairAddress, true, true);
    console.log(`⌛ Adding Hal9k/Weth pool to Hal9kVault...`);
    await connectedWallet.provider.waitForTransaction(initTxn.hash);
    console.log(`✅ Added Hal9k/Weth pool to ${hal9kVault.address}`);
  } catch (error) {
    console.log("adding pool ====>", error);
  }
};
const devAddr = "0x5518876726C060b2D3fCda75c0B9f31F13b78D07";
//rinkby testnet addresses
const hal9kTokenAddress = "0x45961efFA758912036a5800C85182C00E93A609C";
const deployedProxyAdminAddress = "0x6D9C2681dd1b3509E0Db4394250e310B9fBFfEB4"; // No change after deploy

const deployedHal9kVaultAddress = "0xad7394775E8029E186F42aD0d365833514734648";
const deployedHal9kVaultProxy = "0xca26fa5af9E134D1a9317F67F6f30ad5b802b919"; // No change after deploy

const deployedFeeApproverAddress = "0x2884DaC5B2cA24f6e2619D7Ec56465aA09955f04";
//const deployedFeeApproverProxy = "0x43bc998E8553654774d974F6bbc5F738CeFeA255"; // No change after deploy

const deployedRouterAddress = "";
//const deployedRouterProxy = "0x197Bf37340Cf2b91F17159b7453B770fA8D891F2"; // No change after deploy

const deployedHal9kLtdAddress = "0xd4150399C55bf0405FBF3E47407cab6C9eA04B29";
const deployedHal9kNFTPoolAddress =
  "0x0F7453877CFc5b0B2d5E39a2923331F111A2b759";
const deployedHal9kNFTPoolProxy = "0xCbfB5DE22ec5376bd46d3C090B26BF5177372c6A";

const hal9kVaultInited = true;
const feeApproverInited = true;
const routerInited = true;
const hal9kNFTPoolInited = true;
const hal9kVaultPoolAdded = true;

// Step 1.
// Deploy proxy admin contract and get the address..

if (!deployedProxyAdminAddress) {
  deploy(proxyAdminArtifact);
  return;
}

// Step 2.
// Deploy the Hal9kVault logic

if (!deployedHal9kVaultAddress) {
  deploy(hal9kVaultArtifact);
  return;
}

// Step 3.
// Deploy the proxy for Hal9kVault logic

if (!deployedHal9kVaultProxy) {
  deploy(adminUpgradeabilityProxyArtifact, [
    deployedHal9kVaultAddress /*logic*/,
    deployedProxyAdminAddress /*admin*/,
    [],
  ]);
  return;
}

// Step 4.
// Deploy FeeApprover

if (!deployedFeeApproverAddress) {
  deploy(feeApproverArtifact);
  return;
}

// Step 5.
//Deploy FeeApproverProxy

// if (!deployedFeeApproverProxy) {
//   deploy(adminUpgradeabilityProxyArtifact, [
//     deployedFeeApproverAddress /*logic*/,
//     deployedProxyAdminAddress /*admin*/,
//     [],
//   ]);
//   return;
// }

//step 6
//deploy v1 router
if (!deployedRouterAddress) {
  deploy(hal9kv1RouterArtifact);
  return;
}

//step 7
//deploy v1 router proxy
// if (!deployedRouterProxy) {
//   deploy(adminUpgradeabilityProxyArtifact, [
//     deployedRouterAddress /*logic*/,
//     deployedProxyAdminAddress /*admin*/,
//     [],
//   ]);
//   return;
// }

// Step 8
// Deploy Hal9kNFTPool

if (!deployedHal9kNFTPoolAddress) {
  console.log("step 11");
  deploy(hal9kNFTPoolArtifact);
  return;
}

//Step 9
//Deploy hal9knft proxy
if (!deployedHal9kNFTPoolProxy) {
  deploy(adminUpgradeabilityProxyArtifact, [
    deployedHal9kNFTPoolAddress /*logic*/,
    deployedProxyAdminAddress /*admin*/,
    [],
  ]);
  return;
}

// Step 10
// Call initializer on the proxied Hal9kVault

if (!hal9kVaultInited) {
  initHal9kVault();
  return;
}

//Step 11
//Initalize the feeApprover

if (!feeApproverInited) {
  initFeeApprover();
  return;
}
//step 12
//Init v1 router
if (!routerInited) {
  initV1Router();
  return;
}

//Step 13
//Initialize the hal9knftpool
if (!hal9kNFTPoolInited) {
  initHal9kNftPool();
  return;
}

//add the pool to the hal9kvault

if (!hal9kVaultPoolAdded) {
  addHal9kETHPool();
}
