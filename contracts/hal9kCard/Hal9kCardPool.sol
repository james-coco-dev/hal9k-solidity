/**
 *Submitted for verification at Etherscan.io on 2020-08-26
*/

pragma solidity 0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol"; // for WETH
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import './ERC1155Tradable.sol';

contract HAL9KTokenWrapper {
	using SafeMath for uint256;
	IERC20 public HAL9K;

	constructor(IERC20 _HAL9KAddress) public {
		HAL9K = IERC20(_HAL9KAddress);
	}

	uint256 private _totalSupply;
	mapping(address => uint256) private _balances;

	function totalSupply() public view returns (uint256) {
		return _totalSupply;
	}

	function balanceOf(address account) public view returns (uint256) {
		return _balances[account];
	}
}

contract HAL9KCardPool is HAL9KTokenWrapper, Ownable {
	ERC1155Tradable public hal9kCards;

    struct UserInfo {
        uint256 lastStageChangeTime;
		uint256 claimedLpAmount;
		uint256 lpClaimedTime;
		uint256 stage;
        bool claimed;
    }

    mapping(address => UserInfo) private lpUsers;
	address[] public lpUserAddress;

	// Events
	event stageUpdated(address addr, uint256 stage);

	// functions
	constructor(ERC1155Tradable _hal9kCardsAddress, IERC20 _HAL9KAddress) public HAL9KTokenWrapper(_HAL9KAddress) {
		hal9kCards = _hal9kCardsAddress;
	}

	function startReceivingHal9K() external public {
		lpUsers[msg.sender].lpClaimedTime = block.timestamp;
		lpUsers[msg.sender].lastStageChangeTime = block.timestamp;
		lpUsers[msg.sender].claimed = true;
		lpUsers[msg.sender].stage = 0;
	}

    function getDaysPassedAfterLPClaim() public view returns (uint256) {
        require(lpUsers[msg.sender].claimed != false, "LP token hasn't claimed yet");
		uint256 days = (block.timestamp - lpUsers[msg.sender].lpClaimedTime) / 60 / 60 / 24;
		return days;
    }

	// backOrForth : back if true, forward if false
	function oneStageBack(bool backOrForth) public { 
		require(lpUsers[msg.sender].claimed != false, "LP token hasn't claimed yet");
		uint256 days = (block.timestamp - lpUsers[msg.sender].lastStageChangeTime) / 60 / 60 / 24;

		if (backOrForth == false) {	// If user moves to the next stage
			if (lpUsers[msg.sender].stage == 0 && days >= 1) {
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
		
        emit stageUpdated(msg.sender, lpUsers[userAddr].stage);
	}
	
	// Give NFT to User
	function addHal9kRewardForUser(uint256 cardId) public {
		// Check if cards are available to be minted
		require(hal9kCards._exists(cardId) != false, "Card not found");
		require(hal9kCards.totalSupply(cardId) < hal9kCards.maxSupply(card), "Max cards minted");
		hal9kCards.mint(msg.sender, cardId, 1, "");
	}

}