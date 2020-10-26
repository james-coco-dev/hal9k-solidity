pragma solidity 0.6.12;

import './ERC1155Tradable.sol';

/**
 * @title MemeLtd
 * MemeLtd - Collect limited edition NFTs from HAL9KCard
 */
contract HAL9KCard is ERC1155Tradable {
	constructor(address _proxyRegistryAddress) public ERC1155Tradable("9KNFT", "9K", _proxyRegistryAddress) {
		_setBaseMetadataURI("https://api.hal9k.com/hal9ks");
	}

	function contractURI() public view returns (string memory) {
		return "https://api.hal9k.com/contract/hal9ks-erc1155";
	}
}