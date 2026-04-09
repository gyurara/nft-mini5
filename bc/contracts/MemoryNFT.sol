// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {PetSBT} from "./PetSBT.sol";

/// @title MemoryNFT
/// @notice Tradable commemorative NFT contract tied to an existing PetSBT.
contract MemoryNFT is ERC721URIStorage, Ownable {
    error ZeroAddress();
    error EmptyTokenURI();
    error InvalidPetSBT();
    error NotPetOwner();
    error MaxSupplyReached();
    error InvalidMaxSupply();
    error InsufficientMintFee(uint256 required, uint256 sent);
    error WithdrawalFailed();

    PetSBT public immutable petSBT;
    uint256 private _nextTokenId;
    uint256 public mintPrice;
    uint256 public maxSupply;

    /// @notice Maps commemorative NFT tokenId => underlying PetSBT tokenId.
    mapping(uint256 => uint256) public memoryTokenToPetSbtId;

    event MemoryNFTMinted(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 indexed petSbtId,
        string tokenURI,
        uint256 paid
    );
    event MintPriceUpdated(uint256 newMintPrice);
    event MaxSupplyUpdated(uint256 newMaxSupply);
    event Withdrawal(address indexed to, uint256 amount);

    constructor(address petSBTAddress, uint256 initialMintPrice, uint256 initialMaxSupply)
        ERC721("Cattery Memory NFT", "CMEM")
        Ownable(msg.sender)
    {
        if (petSBTAddress == address(0)) revert ZeroAddress();
        if (initialMaxSupply == 0) revert InvalidMaxSupply();

        petSBT = PetSBT(petSBTAddress);
        mintPrice = initialMintPrice;
        maxSupply = initialMaxSupply;
    }

    /// @notice Mints a commemorative NFT tied to a registered PetSBT.
    /// @dev Caller must own the referenced PetSBT.
    function mintMemoryNFT(uint256 petSbtId, string calldata tokenURI) external payable returns (uint256 tokenId) {
        if (bytes(tokenURI).length == 0) revert EmptyTokenURI();
        if (_nextTokenId >= maxSupply) revert MaxSupplyReached();
        if (msg.value < mintPrice) revert InsufficientMintFee(mintPrice, msg.value);
        if (!_existsPetSBT(petSbtId)) revert InvalidPetSBT();
        if (petSBT.ownerOf(petSbtId) != msg.sender) revert NotPetOwner();

        tokenId = ++_nextTokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        memoryTokenToPetSbtId[tokenId] = petSbtId;

        emit MemoryNFTMinted(msg.sender, tokenId, petSbtId, tokenURI, msg.value);
    }

    /// @notice Returns true if the address owns at least one commemorative NFT.
    function hasMemoryNFT(address owner) external view returns (bool) {
        return balanceOf(owner) > 0;
    }

    /// @notice Number of commemorative NFTs minted so far.
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    function setMintPrice(uint256 newMintPrice) external onlyOwner {
        mintPrice = newMintPrice;
        emit MintPriceUpdated(newMintPrice);
    }

    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        if (newMaxSupply == 0 || newMaxSupply < _nextTokenId) revert InvalidMaxSupply();
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        (bool success,) = payable(owner()).call{value: amount}("");
        if (!success) revert WithdrawalFailed();
        emit Withdrawal(owner(), amount);
    }

    function _existsPetSBT(uint256 petSbtId) internal view returns (bool) {
        try petSBT.ownerOf(petSbtId) returns (address owner_) {
            return owner_ != address(0);
        } catch {
            return false;
        }
    }
}
