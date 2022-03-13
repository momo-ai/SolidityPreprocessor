// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "UnstoppableLender.sol";
import "IERC20.sol";

/**
 * @title ReceiverUnstoppable
 * @author Damn Vulnerable DeFi (https://damnvulnerabledefi.xyz)
 */
contract ReceiverUnstoppable {

    UnstoppableLender private pool;
    address private owner;

    function v_get_pool() public view returns (UnstoppableLender) {
        return pool;
    }

    function v_set_pool(UnstoppableLender _pool) public {
        pool = _pool;
    }

    function v_get_owner() public view returns (address) {
        return owner;
    }

    function v_set_owner(address _owner) public {
        owner = _owner;
    }

    function v_msg_sender() public view returns (address) {
        return msg.sender;
    }

    function v_cast_address_UnstoppableLender(address addr) public pure returns (UnstoppableLender) {
        return UnstoppableLender(addr);
    }

    function v_cast_UnstoppableLender_address(UnstoppableLender lender) public pure returns (address) {
        return address(lender);
    } 

    function v_cast_address_IERC20(address addr) public pure returns (IERC20) {
        return IERC20(addr);
    }

    function v_eq(address a, address b) public pure returns (bool) {
        return a == b;
    }

    function v_require(bool cond, string memory message) public pure {
        require(cond, message);
    }

    function v_call_IERC20_transfer(IERC20 tok, address to, uint256 amt) public returns (bool) {
        return tok.transfer(to, amt);
    }

    function v_call_UnstoppableLender_flashLoan(UnstoppableLender lender, uint256 amount) public {
        lender.flashLoan(amount);
    }

    constructor(address poolAddress) {
        v_set_pool(v_cast_address_UnstoppableLender(poolAddress));
        v_set_owner(v_msg_sender());
    }

    // Pool will call this function during the flash loan
    function receiveTokens(address tokenAddress, uint256 amount) external {
        v_require(v_eq(v_msg_sender(), v_cast_UnstoppableLender_address(v_get_pool())), "Sender must be pool");
        // Return all tokens to the pool
        v_require(v_call_IERC20_transfer(v_cast_address_IERC20(tokenAddress), v_msg_sender(), amount), "Transfer of tokens failed");
    }

    function executeFlashLoan(uint256 amount) external {
        v_require(v_eq(v_msg_sender(), v_get_owner()), "Only owner can execute flash loan");
        v_call_UnstoppableLender_flashLoan(v_get_pool(), amount);
    }
}
