// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "IERC20.sol";
import "ReentrancyGuard.sol";

interface IReceiver {
    function receiveTokens(address tokenAddress, uint256 amount) external;
}

/**
 * @title UnstoppableLender
 * @author Damn Vulnerable DeFi (https://damnvulnerabledefi.xyz)
 */
contract UnstoppableLender is ReentrancyGuard {

    IERC20 public damnValuableToken;
    uint256 public poolBalance;

    function v_set_damnValuableToken(IERC20 token) public {
        damnValuableToken = token;
    }

    function v_get_damnValuableToken() public view returns (IERC20) {
        return damnValuableToken;
    }

    function v_set_poolBalance(uint256 bal) public {
        poolBalance = bal;
    }

    function v_get_poolBalance() public view returns (uint256) {
        return poolBalance;
    }

    function v_null() public pure returns (address) {
        return address(0);
    }

    function v_cast_address_IReceiver(address addr) public pure returns (IReceiver) {
        return IReceiver(addr);
    }

    function v_cast_UnstoppableLender_address(UnstoppableLender lender) public pure returns (address) {
        return address(lender);
    }

    function v_cast_IERC20_address(IERC20 token) public pure returns (address) {
        return address(token);
    }

    function v_cast_address_IERC20(address addr) public pure returns (IERC20) {
        return IERC20(addr);
    }

    function v_neq(address a, address b) public pure returns (bool) {
        return a != b;
    }

    function v_eq(uint256 a, uint256 b) public pure returns (bool) {
        return a == b;
    }
    
    function v_gt(uint256 a, uint256 b) public pure returns (bool) {
        return a > b;
    }

    function v_geq(uint256 a, uint256 b) public pure returns (bool) {
        return a >= b;
    }

    function v_add(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;
    }


    function v_call_IERC20_transferFrom(IERC20 token, address from, address to, uint256 amt) public returns (bool) {
        return token.transferFrom(from, to, amt);
    }

    function v_call_IERC20_transfer(IERC20 token, address to, uint256 amt) public returns (bool) {
        return token.transfer(to, amt);
    }

    function v_call_IERC20_balanceOf(IERC20 token, address addr) public view returns (uint256) {
        return token.balanceOf(addr);
    }

    function v_call_IReceiver_receiveTokens(IReceiver receiver, address addr, uint256 amt) public {
        receiver.receiveTokens(addr, amt);
    }

    function v_msg_sender() public view returns (address) {
        return msg.sender;
    }

    function v_this() public view returns (UnstoppableLender) {
        return this;
    }

    function v_assert(bool cond) public pure {
        assert(cond);
    }


    constructor(address tokenAddress) {
        v_require(v_neq(tokenAddress, v_null()), "Token address cannot be zero");
        v_set_damnValuableToken(v_cast_address_IERC20(tokenAddress));
    }

    function depositTokens(uint256 amount) external nonReentrant {
        v_require(v_gt(amount, 0), "Must deposit at least one token");
        // Transfer token from sender. Sender must have first approved them.
        //damnValuableToken.transferFrom(msg.sender, address(this), amount);
        v_call_IERC20_transferFrom(v_get_damnValuableToken(), v_msg_sender(), v_cast_UnstoppableLender_address(v_this()), amount);
        v_set_poolBalance(v_add(v_get_poolBalance(), amount));
    }

    function flashLoan(uint256 borrowAmount) external nonReentrant {
        v_require(v_gt(borrowAmount, 0), "Must borrow at least one token");

        //uint256 balanceBefore = damnValuableToken.balanceOf(v_cast_UnstoppableLender_address(v_this()));
        uint256 balanceBefore = v_call_IERC20_balanceOf(v_get_damnValuableToken(), v_cast_UnstoppableLender_address(v_this()));
        v_require(v_geq(balanceBefore, borrowAmount), "Not enough tokens in pool");

        // Ensured by the protocol via the `depositTokens` function
        v_assert(v_eq(v_get_poolBalance(), balanceBefore));
        
        //damnValuableToken.transfer(msg.sender, borrowAmount);
        v_call_IERC20_transfer(v_get_damnValuableToken(), v_msg_sender(), borrowAmount);
        
        //IReceiver(v_msg_sender()).receiveTokens(v_cast_IERC20_address(v_get_damnValuableToken()), borrowAmount);
        v_call_IReceiver_receiveTokens(v_cast_address_IReceiver(v_msg_sender()), v_cast_IERC20_address(v_get_damnValuableToken()), borrowAmount);
        
        //uint256 balanceAfter = damnValuableToken.balanceOf(address(v_this));
        uint256 balanceAfter = v_call_IERC20_balanceOf(v_get_damnValuableToken(), v_cast_UnstoppableLender_address(v_this()));
        v_require(v_geq(balanceAfter, balanceBefore), "Flash loan hasn't been paid back");
    }
}
