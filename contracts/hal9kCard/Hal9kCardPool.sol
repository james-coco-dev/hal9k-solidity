/**
 *Submitted for verification at Etherscan.io on 2020-08-26
*/

pragma solidity 0.6.12;

import './Ownable.sol';
import './IERC20.sol';
import './SafeMath.sol';
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

	function stake(uint256 amount) public {
		_totalSupply = _totalSupply.add(amount);
		_balances[msg.sender] = _balances[msg.sender].add(amount);
		HAL9K.transferFrom(msg.sender, address(this), amount);
	}

	function withdraw(uint256 amount) public {
		_totalSupply = _totalSupply.sub(amount);
		_balances[msg.sender] = _balances[msg.sender].sub(amount);
		HAL9K.transfer(msg.sender, amount);
	}
}

contract HAL9KCardPool is HAL9KTokenWrapper, Ownable {
	ERC1155Tradable public hal9kCards;

	mapping(address => uint256) public lastUpdateTime;
	mapping(address => uint256) public points;
	mapping(uint256 => uint256) public cards;

	event CardAdded(uint256 card, uint256 points);
	event Staked(address indexed user, uint256 amount);
	event Withdrawn(address indexed user, uint256 amount);
	event Redeemed(address indexed user, uint256 amount);

	modifier updateReward(address account) {
		if (account != address(0)) {
			points[account] = earned(account);
			lastUpdateTime[account] = block.timestamp;
		}
		_;
	}

	constructor(ERC1155Tradable _hal9kCardsAddress, IERC20 _HAL9KAddress) public HAL9KTokenWrapper(_HAL9KAddress) {
		hal9kCards = _hal9kCardsAddress;
	}

	function addCard(uint256 cardId, uint256 amount) public onlyOwner {
		cards[cardId] = amount;
		emit CardAdded(cardId, amount);
	}

	function earned(address account) public view returns (uint256) {
		uint256 blockTime = block.timestamp;
		return
			points[account].add(
				blockTime.sub(lastUpdateTime[account]).mul(1e18).div(86400).mul(balanceOf(account).div(1e8))
			);
	}

	// stake visibility is public as overriding HAL9KTokenWrapper's stake() function
	function stake(uint256 amount) public updateReward(msg.sender) {
		require(amount.add(balanceOf(msg.sender)) <= 500000000, "Cannot stake more than 5 HAL9K");

		super.stake(amount);
		emit Staked(msg.sender, amount);
	}

	function withdraw(uint256 amount) public updateReward(msg.sender) {
		require(amount > 0, "Cannot withdraw 0");

		super.withdraw(amount);
		emit Withdrawn(msg.sender, amount);
	}

	function exit() external {
		withdraw(balanceOf(msg.sender));
	}

	function redeem(uint256 card) public updateReward(msg.sender) {
		require(cards[card] != 0, "Card not found");
		require(points[msg.sender] >= cards[card], "Not enough points to redeem for card");
		require(hal9kCards.totalSupply(card) < hal9kCards.maxSupply(card), "Max cards minted");

		points[msg.sender] = points[msg.sender].sub(cards[card]);
		hal9kCards.mint(msg.sender, card, 1, "");
		emit Redeemed(msg.sender, cards[card]);
	}
}