
echo "Verifying contracts"
# Hal9k Token
npx hardhat verify --network rinkeby 0x80aCE96aB5a40F110c9477460c77004CA16669a2 "0x7a250d5630b4cf539739df2c5dacb4c659f2488d" "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
# Hal9k Vault
npx hardhat verify --network rinkeby 0x79c31f05AF7898F91058f4A619f112221805222D 
# Fee Approver
npx hardhat verify --network rinkeby 0x40d268b5916EbA91B9CF3907b68379752e0346E3
# Fee Hal9kLtd
npx hardhat verify --network rinkeby 0x6aFb66f0D3188e400A4bBFA589CfF01E6c9F91b3
# deployedHal9kNFTPoolAddress
npx hardhat verify --network rinkeby 0x0042f940a3a4d2b4cEcdD9dC80D17ef69f6e529C
echo "Verification Done!"