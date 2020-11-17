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
      deployedFeeApproverProxy,
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
      deployedRouterProxy,
      tokenUnpacked.abi,
      connectedWallet
    );
    let initTxn = await hal9kV1Router.initialize(
      hal9kTokenAddress,
      wethAddress,
      process.env.UNISWAPFACTORY,
      deployedFeeApproverProxy,
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
const devAddr = "0x5518876726C060b2D3fCda75c0B9f31F13b78D07";
//rinkby testnet addresses
const hal9kTokenAddress = "0x80aCE96aB5a40F110c9477460c77004CA16669a2";
const deployedProxyAdminAddress = "0x6ea31a0ADEc3654F81EC7F3400dadD0D56eC3A2F"; // No change after deploy

const deployedHal9kVaultAddress = "0x79c31f05AF7898F91058f4A619f112221805222D";
const deployedHal9kVaultProxy = "0x95875951e653E0f37dA1d1e6E596ba4011192A78"; // No change after deploy

const hal9kVaultInited = true;

const deployedFeeApproverAddress = "0x40d268b5916EbA91B9CF3907b68379752e0346E3";
const deployedFeeApproverProxy = "0xBd78FAB43462837157E066b87808F79Cee122EC3"; // No change after deploy

const feeApproverInited = true;

const deployedRouterAddress = "0xe1F5d02796605ced3aB500D14Cb6C2D8930e9dBB";
const deployedRouterProxy = "0xe3400365f90cf5442F997Cf7E230334025889973"; // No change after deploy

const routerInited = true;

const deployedHal9kLtdAddress = "0x6aFb66f0D3188e400A4bBFA589CfF01E6c9F91b3";
const deployedHal9kNFTPoolAddress =
  "0x3536E583f7fA9395219A81580588b57dD6D0B13b";
const deployedHal9kNFTPoolProxy = "0x2e0Ee634bBF62dF4ad1B444Faf1163320Cbf81dF";

const hal9kNFTPoolInited = true;

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
// Call initializer on the proxied Hal9kVault

if (!hal9kVaultInited) {
  initHal9kVault();
  return;
}

// Step 5.
// Deploy FeeApprover

if (!deployedFeeApproverAddress) {
  deploy(feeApproverArtifact);
  return;
}

// Step 6.
//Deploy FeeApproverProxy

if (!deployedFeeApproverProxy) {
  deploy(adminUpgradeabilityProxyArtifact, [
    deployedFeeApproverAddress /*logic*/,
    deployedProxyAdminAddress /*admin*/,
    [],
  ]);
  return;
}

//Step 7.
//Initalize the feeApprover

if (!feeApproverInited) {
  initFeeApprover();
  return;
}
//step 8
//deploy v1 router
if (!deployedRouterAddress) {
  deploy(hal9kv1RouterArtifact);
  return;
}

//step 9
//deploy v1 router proxy
if (!deployedRouterProxy) {
  deploy(adminUpgradeabilityProxyArtifact, [
    deployedRouterAddress /*logic*/,
    deployedProxyAdminAddress /*admin*/,
    [],
  ]);
  return;
}

//step 10
//Init v1 router
if (!routerInited) {
  initV1Router();
  return;
}
// Step 11
// Deploy Hal9kNFTPool

if (!deployedHal9kNFTPoolAddress) {
  deploy(hal9kNFTPoolArtifact);
  return;
}

//Step 12
//Deploy hal9knft proxy
if (!deployedHal9kNFTPoolProxy) {
  deploy(adminUpgradeabilityProxyArtifact, [
    deployedHal9kNFTPoolAddress /*logic*/,
    deployedProxyAdminAddress /*admin*/,
    [],
  ]);
  return;
}

//Step 13
//Initialize the hal9knftpool
if (!hal9kNFTPoolInited) {
  initHal9kNftPool();
}
