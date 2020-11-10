/**
 *Submitted for verification at Etherscan.io on 2020-08-26
*/

pragma solidity 0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol"; // for WETH
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import './ERC1155Tradable.sol';
import '../IHal9kVault.sol';

contract HAL9KCardPool is Ownable {
	ERC1155Tradable public hal9kCards;
    IHal9kVault public hal9kVault;

    struct UserInfo {
        uint256 lastStageChangeTime;
        uint256 stakedAmount;
        uint256 startTime;
        uint256 stage;
        bool claimed;
    }

    mapping(address => UserInfo) private lpUsers;
	address[] public lpUserAddress;

	// Events
	event stageUpdated(address addr, uint256 stage);
	event vaultAddressChanged(address newAddress, address oldAddress);

	// functions
	constructor(ERC1155Tradable _hal9kCardsAddress, IHal9kVault _hal9kVaultAddress) public{
		hal9kCards = _hal9kCardsAddress;
		hal9kVault = IHal9kVault(_hal9kVaultAddress);
	}

	// Change the hal9k vault address
    function changeHal9kVaultAddress(address _hal9kVaultAddress) external onlyOwner {
        address oldAddress = address(hal9kVault);
        hal9kVault = IHal9kVault(_hal9kVaultAddress);

        emit vaultAddressChanged(_hal9kVaultAddress, oldAddress);
    }
	
	function startReceivingHal9K() public {
		lpUsers[msg.sender].startTime = block.timestamp;
		lpUsers[msg.sender].lastStageChangeTime = block.timestamp;
		lpUsers[msg.sender].claimed = true;
		lpUsers[msg.sender].stage = 0;
	}

    function getDaysPassedAfterStakingStart() public view returns (uint256) {
        require(lpUsers[msg.sender].claimed != false, "LP token hasn't claimed yet");
        return (block.timestamp - lpUsers[msg.sender].startTime) / 60 / 60 / 24;
    }

	// backOrForth : back if true, forward if false
	function oneStageBack(bool backOrForth) public { 
		require(lpUsers[msg.sender].claimed != false, "LP token hasn't claimed yet");
		uint256 passedDays = (block.timestamp - lpUsers[msg.sender].lastStageChangeTime) / 60 / 60 / 24;

		if (backOrForth == false) {	// If user moves to the next stage
			if (lpUsers[msg.sender].stage == 0 && passedDays >= 1) {
				lpUsers[msg.sender].stage = 1;
				lpUsers[msg.sender].lastStageChangeTime = block.timestamp;
			} 
			if (lpUsers[msg.sender].stage > 2) {
				lpUsers[msg.sender].stage += 1;
				lpUsers[msg.sender].lastStageChangeTime = block.timestamp;
			}
		} else {	// If user decides to go one stage back
			if (lpUsers[msg.sender].stage > 3) {
				lpUsers[msg.sender].stage = 3;
				lpUsers[msg.sender].lastStageChangeTime = block.timestamp;
			} else if(lpUsers[msg.sender].stage == 1) {
				lpUsers[msg.sender].stage = 1;
				lpUsers[msg.sender].lastStageChangeTime = block.timestamp;
			} else {
				lpUsers[msg.sender].stage -= 1;
				lpUsers[msg.sender].lastStageChangeTime = block.timestamp;
			}
		}
		emit stageUpdated(msg.sender, lpUsers[msg.sender].stage);
	}
	
	// Give NFT to User
	function mintCardForUser(uint256 _pid, uint256 _stakedAmount, uint256 _cardId, uint256 _cardCount) public {
		// Check if cards are available to be minted
		require(_cardCount > 0, "Mint amount should be more than 1");
		require(hal9kCards._exists(_cardId) != false, "Card not found");
		require(hal9kCards.totalSupply(_cardId) <= hal9kCards.maxSupply(_cardId), "Max cards minted");
		
		// Validation
		uint256 stakedAmount = hal9kVault.getUserInfo(_pid, msg.sender);
		require(stakedAmount > 0 && stakedAmount == _stakedAmount, "Invalid user");
		hal9kCards.mint(msg.sender, _cardId, 1, "");
	}

	// Burn NFT from user
	function burnCardForUser(uint256 _pid, uint256 _stakedAmount, uint256 _cardId, uint256 _cardCount) public {
		require(_cardCount > 0, "Burn amount should be more than 1");
		require(hal9kCards._exists(_cardId) == true, "Card doesn't exist");
		require(hal9kCards.totalSupply(_cardId) > 0, "No cards exist");

		uint256 stakedAmount = hal9kVault.getUserInfo(_pid, msg.sender);
		require(stakedAmount > 0 && stakedAmount == _stakedAmount, "Invalid user");
		hal9kCards.burn(msg.sender, _cardId, 1);
	}
}