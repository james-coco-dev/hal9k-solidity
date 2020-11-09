pragma solidity 0.6.12;

import './ERC1155Tradable.sol';

/**
 * @title MemeLtd
 * MemeLtd - Collect limited edition NFTs from HAL9KCard
 */
contract HAL9KCard is ERC1155Tradable {
	constructor(address _proxyRegistryAddress) public ERC1155Tradable("H9KNFT", "H9K", _proxyRegistryAddress) {
		_setBaseMetadataURI("https://api.hal9k.ai/hals");
	}

	function contractURI() public view returns (string memory) {
		return "https://api.hal9k.ai/contract/hal9k-erc1155";
	}
}