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

const deployToken = async () => {
  // Get the built metadata for our contracts
  let tokenUnpacked = unpackArtifact("./prodartifacts/HAL9K.json");
  console.log(`${tokenUnpacked.contractName} \n Constructor: ${tokenUnpacked.constructor}`);

  let provider;

  if (process.env.NETWORK == "mainnet") {
    provider = ethers.getDefaultProvider("homestead");
    wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  } else {
    provider = ethers.getDefaultProvider("kovan");
    wethAddress = "0xd0a1e359811322d97991e03f863a0c30c2cf029c";
  }

  let wallet, connectedWallet;
  wallet = Wallet.fromMnemonic(process.env.MNEMONIC);
  connectedWallet = wallet.connect(provider);

  const args=[process.env.UNISWAPROUTER, process.env.UNISWAPFACTORY];

  const token = await deployContract(
    tokenUnpacked.abi,
    tokenUnpacked.bytecode,
    wallet,
    provider,
    args
  );

  console.log(`⌛ Deploying ${tokenUnpacked.contractName}...`);
  await connectedWallet.provider.waitForTransaction(token.deployTransaction.hash);
  console.log(`✅ Deployed ${tokenUnpacked.contractName} to ${token.address}`);
  
  // console.log(`⌛ calling createUniswapPairMainnet...`);
  // let tx = await token.createUniswapPairMainnet();
  // console.log(`⌛ createUniswapPairMainnet...`);
  // await connectedWallet.provider.waitForTransaction(tx.hash);
  // console.log(`✅ Called createUniswapPairMainnet() on token at ${token.address}`);

  // const feeApproverArgs = [token.address, wethAddress, uniswapFactoryAddress];
  // // Now, the fee approver contract
  // const feeApprover = await deployContract(
  //   feeApproverUnpacked.abi,
  //   feeApproverUnpacked.bytecode,
  //   wallet,
  //   provider,
  //   feeApproverArgs
  // );

  // console.log(`⌛ Deploying feeApprover...`);
  // await connectedWallet.provider.waitForTransaction(feeApprover.deployTransaction.hash);
  // console.log(`✅ Deployed feeApprover.`);

  // // Now update the token to refer to the fee approver
  // let setTransferCheckerResult = await token.setShouldTransferChecker(feeApprover.address);

  // console.log(`⌛ setShouldTransferChecker...`);
  // await connectedWallet.provider.waitForTransaction(setTransferCheckerResult.hash);
  // console.log(`✅ Called setShouldTransferChecker(${feeApprover.address} on token at ${token.address}`);
  
  // let setFeeBearerResult = await token.setFeeBearer(wallet.address);
  // console.log(`⌛ setFeeBearer...`);
  // await connectedWallet.provider.waitForTransaction(setFeeBearerResult.hash);
  // console.log(`✅ Called setFeeBearer(${wallet.address} on token at ${token.address})`);

  // console.log(setTransferCheckerResult);
  // console.log(setFeeBearerResult);
  // console.log("All done!");
};

deployToken();