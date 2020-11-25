echo "Verifying contracts"
echo "⌛ Verifying Hal9k Token"
npx hardhat verify --network rinkeby 0xf16447C1FD9BADEfa795Ab4EBF9b72DCBd91EF2B '0x7a250d5630b4cf539739df2c5dacb4c659f2488d' '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
echo "⌛ Verifying Hal9k Ltd"
npx hardhat verify --network rinkeby 0xeBB4e3EF1F7DaF0F241fc6e005562470cB8c7620 '0xf57b2c51ded3a29e6891aba85459d600256cf317'
echo "⌛ Verifying Hal9k Vault"
npx hardhat verify --network rinkeby 0x18642D8Ba0FAAfE02913B8DA6b2D793EbF7e017b
echo "⌛ Verifying Fee Approver"
npx hardhat verify --network rinkeby 0x40d268b5916EbA91B9CF3907b68379752e0346E3
echo "⌛ Verifying Hal9kv1Router"
npx hardhat verify --network rinkeby 0xe1F5d02796605ced3aB500D14Cb6C2D8930e9dBB
echo "⌛ Verifying Hal9kNftPool"
npx hardhat verify --network rinkeby 0x68F4A16efcc5201111a298e60F7183dADd45780d
echo "✅ Verification Done!"
