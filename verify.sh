echo "Verifying contracts"
# Hal9k Token
npx hardhat --show-stack-traces verify --network rinkeby 0x80aCE96aB5a40F110c9477460c77004CA16669a2 '0x7a250d5630b4cf539739df2c5dacb4c659f2488d' '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
# Hal9k Vault
npx hardhat --show-stack-traces verify --network rinkeby 0x79c31f05AF7898F91058f4A619f112221805222D
# Fee Approver
npx hardhat --show-stack-traces verify --network rinkeby 0x40d268b5916EbA91B9CF3907b68379752e0346E3
# Fee Hal9kLtd
npx hardhat --show-stack-traces verify --network rinkeby 0x6aFb66f0D3188e400A4bBFA589CfF01E6c9F91b3 '0xf57b2c51ded3a29e6891aba85459d600256cf317'
# deployedHal9kNFTPoolAddress
npx hardhat --show-stack-traces verify --network rinkeby 0x0042f940a3a4d2b4cEcdD9dC80D17ef69f6e529C
# deployedHal9kVaultProxy  '0x79c31f05AF7898F91058f4A619f112221805222D' '0x6ea31a0ADEc3654F81EC7F3400dadD0D56eC3A2F' 
npx truffle run verify 0x95875951e653E0f37dA1d1e6E596ba4011192A78 --network rinkeby 
# deployedFeeApproverProxy  '0x40d268b5916EbA91B9CF3907b68379752e0346E3' '0x6ea31a0ADEc3654F81EC7F3400dadD0D56eC3A2F'
npx truffle run verify 0xBd78FAB43462837157E066b87808F79Cee122EC3 --network rinkeby 
# deployedHal9kNFTPoolProxy '0x0042f940a3a4d2b4cEcdD9dC80D17ef69f6e529C' '0x6ea31a0ADEc3654F81EC7F3400dadD0D56eC3A2F'
npx truffle run verify 0x2e0Ee634bBF62dF4ad1B444Faf1163320Cbf81dF  --network rinkeby 
echo "Verification Done!"