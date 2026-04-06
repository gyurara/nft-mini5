// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ERC721} from "@openzeppelin/contracts@5.6.1/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts@5.6.1/token/ERC721/IERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts@5.6.1/token/ERC721/extensions/ERC721URIStorage.sol";

import {IERC5192} from "./IERC5192.sol";

/// @title MedicalPassportSBT
/// @notice Soulbound ERC-721 that stores a pet's longitudinal medical passport.
/// @dev One PetSBT token -> one MedicalPassportSBT. Hospitals append records to the same passport.
contract MedicalPassportSBT is ERC721URIStorage, IERC5192 {
    struct PassportInfo {
        uint256 linkedPetTokenId;
        uint64 createdAt;
        uint64 lastVisitDate;
        uint32 latestSchemaVersion;
        uint32 totalRecords;
    }

    struct Permission {
        bool allowed;
        uint64 validUntil; // 0 means no expiry
        uint32 remainingWrites; // type(uint32).max can be treated as unlimited
    }

    struct MedicalRecordEntry {
        address hospital;
        string recordURI;
        bytes32 dataHash;
        uint64 visitDate;
        uint32 schemaVersion;
        uint64 createdAt;
    }

    error ZeroAddress();
    error Soulbound();
    error ApprovalDisabled();
    error EmptySummaryURI();
    error EmptyRecordURI();
    error EmptyDataHash();
    error InvalidSchemaVersion();
    error InvalidVisitDate();
    error InvalidPetSBT();
    error PetSBTAlreadyLinked();
    error NotPetSBTHolder();
    error NotPassportOwner();
    error InvalidPermissionWindow();
    error InvalidRemainingWrites();
    error PermissionDenied();
    error RecordIndexOutOfBounds();

    /// @notice Address of the PetSBT contract used as the source of truth for pet ownership.
    IERC721 public immutable petSBT;

    uint256 private _nextTokenId;

    /// @notice petTokenId (from PetSBT) => medicalPassportSbtId
    mapping(uint256 => uint256) public medicalSbtByPetToken;

    mapping(uint256 => PassportInfo) private _passportInfoByTokenId;
    mapping(uint256 => mapping(address => Permission)) private _permissions;
    mapping(uint256 => mapping(uint256 => MedicalRecordEntry)) private _recordsByPassportAndIndex;

    event MedicalPassportMinted(
        address indexed passportOwner,
        uint256 indexed petTokenId,
        uint256 indexed medicalSbtId,
        string initialSummaryURI
    );

    event HospitalPermissionGranted(
        uint256 indexed medicalSbtId,
        address indexed grantor,
        address indexed hospital,
        uint64 validUntil,
        uint32 remainingWrites
    );

    event HospitalPermissionRevoked(
        uint256 indexed medicalSbtId,
        address indexed grantor,
        address indexed hospital
    );

    event MedicalRecordAppended(
        uint256 indexed medicalSbtId,
        uint256 indexed recordIndex,
        address indexed hospital,
        string recordURI,
        bytes32 dataHash,
        uint64 visitDate,
        uint32 schemaVersion,
        string updatedSummaryURI
    );

    constructor(address petSbtAddress) ERC721("Pet Medical Passport SBT", "PMPS") {
        if (petSbtAddress == address(0)) revert ZeroAddress();
        petSBT = IERC721(petSbtAddress);
    }

    /// @notice Mint one medical passport SBT for an existing PetSBT token.
    /// @dev The caller must own the linked PetSBT token.
    function mintMedicalPassport(uint256 petTokenId, string calldata initialSummaryURI)
        external
        returns (uint256 medicalSbtId)
    {
        if (bytes(initialSummaryURI).length == 0) revert EmptySummaryURI();
        if (medicalSbtByPetToken[petTokenId] != 0) revert PetSBTAlreadyLinked();

        address petOwner = _ownerOfPetSbt(petTokenId);
        if (petOwner != msg.sender) revert NotPetSBTHolder();

        medicalSbtId = ++_nextTokenId;
        _safeMint(msg.sender, medicalSbtId);
        _setTokenURI(medicalSbtId, initialSummaryURI);

        medicalSbtByPetToken[petTokenId] = medicalSbtId;
        _passportInfoByTokenId[medicalSbtId] = PassportInfo({
            linkedPetTokenId: petTokenId,
            createdAt: uint64(block.timestamp),
            lastVisitDate: 0,
            latestSchemaVersion: 0,
            totalRecords: 0
        });

        emit MedicalPassportMinted(msg.sender, petTokenId, medicalSbtId, initialSummaryURI);
        emit Locked(medicalSbtId);
    }

    /// @notice Passport owner grants a hospital wallet permission to append records.
    /// @param validUntil 0 = no expiry, otherwise unix timestamp cutoff.
    /// @param remainingWrites Number of records the hospital may append. Use type(uint32).max for unlimited.
    function grantHospitalPermission(
        uint256 medicalSbtId,
        address hospital,
        uint64 validUntil,
        uint32 remainingWrites
    ) external {
        if (hospital == address(0)) revert ZeroAddress();
        if (validUntil != 0 && validUntil < block.timestamp) revert InvalidPermissionWindow();
        if (remainingWrites == 0) revert InvalidRemainingWrites();

        _requirePassportOwner(medicalSbtId);

        _permissions[medicalSbtId][hospital] = Permission({
            allowed: true,
            validUntil: validUntil,
            remainingWrites: remainingWrites
        });

        emit HospitalPermissionGranted(medicalSbtId, msg.sender, hospital, validUntil, remainingWrites);
    }

    function revokeHospitalPermission(uint256 medicalSbtId, address hospital) external {
        _requirePassportOwner(medicalSbtId);
        delete _permissions[medicalSbtId][hospital];

        emit HospitalPermissionRevoked(medicalSbtId, msg.sender, hospital);
    }

    /// @notice Append one medical record entry to an existing passport.
    /// @dev The caller must be a hospital wallet that has active permission.
    function appendMedicalRecord(
        uint256 medicalSbtId,
        string calldata recordURI,
        bytes32 dataHash,
        uint64 visitDate,
        uint32 schemaVersion,
        string calldata updatedSummaryURI
    ) external returns (uint256 recordIndex) {
        ownerOf(medicalSbtId); // revert if passport doesn't exist
        if (bytes(recordURI).length == 0) revert EmptyRecordURI();
        if (dataHash == bytes32(0)) revert EmptyDataHash();
        if (visitDate == 0) revert InvalidVisitDate();
        if (schemaVersion == 0) revert InvalidSchemaVersion();
        if (!_canAppendRecord(medicalSbtId, msg.sender)) revert PermissionDenied();

        PassportInfo storage passport = _passportInfoByTokenId[medicalSbtId];
        recordIndex = passport.totalRecords;

        _recordsByPassportAndIndex[medicalSbtId][recordIndex] = MedicalRecordEntry({
            hospital: msg.sender,
            recordURI: recordURI,
            dataHash: dataHash,
            visitDate: visitDate,
            schemaVersion: schemaVersion,
            createdAt: uint64(block.timestamp)
        });

        passport.totalRecords += 1;
        passport.latestSchemaVersion = schemaVersion;
        if (visitDate > passport.lastVisitDate) {
            passport.lastVisitDate = visitDate;
        }

        if (bytes(updatedSummaryURI).length != 0) {
            _setTokenURI(medicalSbtId, updatedSummaryURI);
        }

        Permission storage permission = _permissions[medicalSbtId][msg.sender];
        if (permission.remainingWrites != type(uint32).max) {
            unchecked {
                permission.remainingWrites -= 1;
            }
            if (permission.remainingWrites == 0) {
                permission.allowed = false;
            }
        }

        emit MedicalRecordAppended(
            medicalSbtId,
            recordIndex,
            msg.sender,
            recordURI,
            dataHash,
            visitDate,
            schemaVersion,
            updatedSummaryURI
        );
    }

    function getPassportInfo(uint256 medicalSbtId) external view returns (PassportInfo memory) {
        ownerOf(medicalSbtId); // revert if passport doesn't exist
        return _passportInfoByTokenId[medicalSbtId];
    }

    function getRecordCount(uint256 medicalSbtId) external view returns (uint256) {
        ownerOf(medicalSbtId);
        return _passportInfoByTokenId[medicalSbtId].totalRecords;
    }

    function getRecord(uint256 medicalSbtId, uint256 recordIndex) external view returns (MedicalRecordEntry memory) {
        ownerOf(medicalSbtId);
        if (recordIndex >= _passportInfoByTokenId[medicalSbtId].totalRecords) revert RecordIndexOutOfBounds();
        return _recordsByPassportAndIndex[medicalSbtId][recordIndex];
    }

    function getPermission(uint256 medicalSbtId, address hospital) external view returns (Permission memory) {
        ownerOf(medicalSbtId);
        return _permissions[medicalSbtId][hospital];
    }

    function canAppendRecord(uint256 medicalSbtId, address hospital) external view returns (bool) {
        ownerOf(medicalSbtId);
        return _canAppendRecord(medicalSbtId, hospital);
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    function locked(uint256 tokenId) external view override returns (bool) {
        ownerOf(tokenId);
        return true;
    }

    function approve(address, uint256) public pure override(ERC721, IERC721) {
        revert ApprovalDisabled();
    }

    function setApprovalForAll(address, bool) public pure override(ERC721, IERC721) {
        revert ApprovalDisabled();
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address from) {
        from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }

    function _requirePassportOwner(uint256 medicalSbtId) internal view {
        if (ownerOf(medicalSbtId) != msg.sender) revert NotPassportOwner();
    }

    function _canAppendRecord(uint256 medicalSbtId, address hospital) internal view returns (bool) {
        Permission memory permission = _permissions[medicalSbtId][hospital];
        if (!permission.allowed) return false;
        if (permission.remainingWrites == 0) return false;
        if (permission.validUntil != 0 && block.timestamp > permission.validUntil) return false;
        return true;
    }

    function _ownerOfPetSbt(uint256 petTokenId) internal view returns (address) {
        try petSBT.ownerOf(petTokenId) returns (address owner_) {
            if (owner_ == address(0)) revert InvalidPetSBT();
            return owner_;
        } catch {
            revert InvalidPetSBT();
        }
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage) returns (bool) {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }
}
