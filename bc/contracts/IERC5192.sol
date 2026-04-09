// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @dev EIP-5192: Minimal Soulbound NFT interface
interface IERC5192 {
    /// @notice Emitted when a token is locked.
    event Locked(uint256 tokenId);

    /// @notice Emitted when a token is unlocked.
    event Unlocked(uint256 tokenId);

    /// @notice Returns true if the token is soulbound / non-transferable.
    function locked(uint256 tokenId) external view returns (bool);
}
