/**
 *Submitted for verification at Etherscan.io on 2020-08-26
*/

pragma solidity 0.6.12;

import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol"; // for WETH
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import './ERC1155Tradable.sol';
import '../IHal9kVault.sol';
import "hardhat/console.sol";

contract HAL9KNFTPool is OwnableUpgradeSafe {
	ERC1155Tradable public hal9kLtd;
    IHal9kVault public hal9kVault;

    struct UserInfo {
        uint256 lastUpdateTime;
        uint256 stakeAmount;
        uint256 startTime;
        uint256 stage;
    }

    mapping(address => UserInfo) private lpUsers;

	// Events
	event stageUpdated(address addr, uint256 stage, uint256 lastUpdateTime);
	event vaultAddressChanged(address newAddress, address oldAddress);
	event didHal9kStaking(address addr, uint256 startedTime);
	event stakeAmountUpdated(address addr, uint256 newAmount);
	event minted(address addr, uint256 cardId, uint256 mintAmount);
	event burned(address addr, uint256 cardId, uint256 burnAmount);

	// functions
	function initialize(ERC1155Tradable _hal9kltdAddress, IHal9kVault _hal9kVaultAddress,address superAdmin) public initializer {
    	OwnableUpgradeSafe.__Ownable_init();
		_superAdmin = superAdmin;
		hal9kLtd = _hal9kltdAddress;
		hal9kVault = IHal9kVault(_hal9kVaultAddress);
	}

	// Change the hal9k vault address
    function changeHal9kVaultAddress(address _hal9kVaultAddress) external onlyOwner {
        address oldAddress = address(hal9kVault);
        hal9kVault = IHal9kVault(_hal9kVaultAddress);
        emit vaultAddressChanged(_hal9kVaultAddress, oldAddress);
    }
	function isHal9kStakingStarted(address sender) public view returns(bool started){
		if (lpUsers[sender].startTime > 0) return true;
		return false;
	}

	function doHal9kStaking(address sender, uint256 stakeAmount) public {
		require(hal9kVault == _msgSender(), "Caller is not Hal9kVault Contract");
		require(stakeAmount > 0, "Stake amount invalid");
		if (lpUsers[sender].startTime > 0) {
			lpUsers[sender].stakeAmount += stakeAmount;
		} else {
			lpUsers[sender].startTime = block.timestamp;
			lpUsers[sender].stakeAmount = stakeAmount;
			lpUsers[sender].lastUpdateTime = block.timestamp;
			lpUsers[sender].stage = 0;
		}
		emit didHal9kStaking(sender, block.timestamp);
	}

    function getDaysPassedAfterStakingStart() public view returns (uint256) {
        require(lpUsers[msg.sender].stakeAmount > 0, "Staking not started yet");
        return (block.timestamp - lpUsers[msg.sender].startTime) / 60 / 60 / 24;
    }

	function getDaysPassedAfterLastUpdateTime() public view returns (uint256) {
		require(lpUsers[msg.sender].stakeAmount > 0, "Staking not started yet");
        return (block.timestamp - lpUsers[msg.sender].lastUpdateTime) / 60 / 60 / 24;
	}

	function getCurrentStage() public view returns(uint256 stage) {
		require(lpUsers[msg.sender].stakeAmount > 0, "Staking not started yet");
		return lpUsers[msg.sender].stage;
	}

	function updateStakeAmount(uint256 newAmount) public {
		require(lpUsers[msg.sender].startTime > 0, "Staking not started yet");
		lpUsers[msg.sender].stakeAmount = newAmount;
		emit stakeAmountUpdated(msg.sender, newAmount);
	}

	// backOrForth : back if true, forward if false
	function moveStageBackOrForth(bool backOrForth) public { 
		require(lpUsers[msg.sender].startTime > 0 && lpUsers[msg.sender].stakeAmount > 0, "Staking not started yet");
		uint256 passedDays = (block.timestamp - lpUsers[msg.sender].lastUpdateTime) / 60 / 60 / 24;

		console.log("Passed days: ", passedDays);
		if (backOrForth == false) {	// If user moves to the next stage
			if (lpUsers[msg.sender].stage == 0 && passedDays >= 1) {
				lpUsers[msg.sender].stage = 1;
				lpUsers[msg.sender].lastUpdateTime = block.timestamp;
			} else if (lpUsers[msg.sender].stage >= 1 && passedDays >= 2) {
				lpUsers[msg.sender].stage += 1;
				lpUsers[msg.sender].lastUpdateTime = block.timestamp;
			}
		} else {	// If user decides to go one stage back
			if (lpUsers[msg.sender].stage == 0) {
				lpUsers[msg.sender].stage = 0;
			} else if (lpUsers[msg.sender].stage > 3) {
				lpUsers[msg.sender].stage = 3;
				lpUsers[msg.sender].lastUpdateTime = block.timestamp;
			} else {
				lpUsers[msg.sender].stage -= 1;
				lpUsers[msg.sender].lastUpdateTime = block.timestamp;
			}
		}

		console.log("Changed stage: ", lpUsers[msg.sender].stage);
		emit stageUpdated(msg.sender, lpUsers[msg.sender].stage, lpUsers[msg.sender].lastUpdateTime);
	}
	
	// Give NFT to User
	function mintCardForUser(uint256 _pid, uint256 _cardId, uint256 _cardCount) public {
		// Check if cards are available to be minted
		require(_cardCount > 0, "Mint amount should be more than 1");
		require(hal9kLtd._exists(_cardId) != false, "Card not found");
		require(hal9kLtd.totalSupply(_cardId) <= hal9kLtd.maxSupply(_cardId), "Max cards minted");
		
		// Validation
		uint256 stakeAmount = hal9kVault.getUserInfo(_pid, msg.sender);
		console.log("Mint Card For User (staked amount): ", stakeAmount, lpUsers[msg.sender].stakeAmount);
		console.log("Caller of MintCardForUser function: ", msg.sender, _cardCount);
		require(stakeAmount > 0 && stakeAmount == lpUsers[msg.sender].stakeAmount, "Invalid user");

		hal9kLtd.mint(msg.sender, _cardId, _cardCount, "");
		emit minted(msg.sender, _cardId, _cardCount);
	}

	// Burn NFT from user
	function burnCardForUser(uint256 _pid, uint256 _cardId, uint256 _cardCount) public {
		require(_cardCount > 0, "Burn amount should be more than 1");
		require(hal9kLtd._exists(_cardId) == true, "Card doesn't exist");
		require(hal9kLtd.totalSupply(_cardId) > 0, "No cards exist");

		uint256 stakeAmount = hal9kVault.getUserInfo(_pid, msg.sender);
		require(stakeAmount > 0 && stakeAmount == lpUsers[msg.sender].stakeAmount, "Invalid user");

		hal9kLtd.burn(msg.sender, _cardId, _cardCount);
		emit burned(msg.sender, _cardId, _cardCount);
	}

    address private _superAdmin;

    event SuperAdminTransfered(
        address indexed previousOwner,
        address indexed newOwner
    );

    modifier onlySuperAdmin() {
        require(
            _superAdmin == _msgSender(),
            "Super admin : caller is not super admin."
        );
        _;
    }
	
    function burnSuperAdmin() public virtual onlySuperAdmin {
        emit SuperAdminTransfered(_superAdmin, address(0));
        _superAdmin = address(0);
    }

    function newSuperAdmin(address newOwner) public virtual onlySuperAdmin {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        emit SuperAdminTransfered(_superAdmin, newOwner);
        _superAdmin = newOwner;
    }
}