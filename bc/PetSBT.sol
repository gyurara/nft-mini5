// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ERC721} from "@openzeppelin/contracts@5.6.1/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts@5.6.1/token/ERC721/IERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts@5.6.1/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts@5.6.1/access/Ownable.sol";

import {IERC5192} from "./IERC5192.sol";

/// @title PetSBT
/// @notice Soulbound ERC-721 used as the pet registration token.
contract PetSBT is ERC721URIStorage, Ownable, IERC5192 {
    error Soulbound();
    error ApprovalDisabled();
    error EmptyTokenURI();

    uint256 private _nextTokenId;
    mapping(address => uint256[]) private _ownerPetTokenIds;

    event PetRegistered(address indexed owner, uint256 indexed tokenId, string tokenURI);

    constructor() ERC721("Cattery Pet Registration SBT", "CPET") Ownable(msg.sender) {}

    /// @notice Registers a pet and mints a non-transferable SBT to msg.sender.
    function registerPet(string calldata tokenURI) external returns (uint256 tokenId) {
        if (bytes(tokenURI).length == 0) revert EmptyTokenURI();

        tokenId = ++_nextTokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        _ownerPetTokenIds[msg.sender].push(tokenId);

        emit PetRegistered(msg.sender, tokenId, tokenURI);
        emit Locked(tokenId);
    }

    /// @notice Returns true if the address owns at least one pet SBT.
    function hasPetSBT(address owner) external view returns (bool) {
        return balanceOf(owner) > 0;
    }

    /// @notice Frontend helper for listing a wallet's pet token IDs.
    function getPetTokenIds(address owner) external view returns (uint256[] memory) {
        return _ownerPetTokenIds[owner];
    }

    /// @notice Number of SBTs minted so far.
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    /// @inheritdoc IERC5192
    function locked(uint256 tokenId) external view override returns (bool) {
        ownerOf(tokenId); // reverts if token doesn't exist
        return true;
    }

    /// @notice Disable single-token approvals.
    function approve(address, uint256) public pure override(ERC721, IERC721) {
        revert ApprovalDisabled();
    }

    /// @notice Disable operator approvals.
    function setApprovalForAll(address, bool) public pure override(ERC721, IERC721) {
        revert ApprovalDisabled();
    }

    /// @dev OpenZeppelin 5.x uses _update for ERC721 transfer customization.
    /// Minting (from == address(0)) is allowed, but normal transfers are blocked.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address from) {
        from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage) returns (bool) {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }
}
