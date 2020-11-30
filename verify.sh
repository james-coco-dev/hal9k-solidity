echo "Verifying contracts"
echo "⌛ Verifying Hal9k Token"
npx hardhat verify --network rinkeby 0x53dEf6252a3b5e3f5aea8009B6Da528DA02D7a65 '0x7a250d5630b4cf539739df2c5dacb4c659f2488d' '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
echo "⌛ Verifying Hal9k Ltd"
npx hardhat verify --network rinkeby 0xA1A94F6348E18C9c70b41B7803c1a0fAceCEdDBf '0xf57b2c51ded3a29e6891aba85459d600256cf317'
echo "⌛ Verifying Hal9k Vault"
npx hardhat verify --network rinkeby 0x7E3DCb513DAdF5c304d443af3F9103E6261Bb74C
echo "⌛ Verifying Fee Approver"
npx hardhat verify --network rinkeby 0x2AA789429adFf434Fdd9968B88c63995293089Ab
echo "⌛ Verifying Hal9kv1Router"
npx hardhat verify --network rinkeby 0x880307AD33CB38895c1AB242dF76fDd6Ce1435BA
echo "⌛ Verifying Hal9kNftPool"
npx hardhat verify --network rinkeby 0x8E9Da33B8FfC02881d6DAd73F159075C3013b352
echo "✅ Verification Done!"
