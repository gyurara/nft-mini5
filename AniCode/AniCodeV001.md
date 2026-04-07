# AniCode / PetChain 기획서 V001

- 작성일: 2026-04-07
- 기준 문서: `AniCode/AniCode.md`, `AniCode/feedback.md`
- 코드 검토 기준: `feVite/`, `feHospital/`, `be/`, `backend/`, `bc/`
- 작성 원칙:
  - 피드백 **1번, 2번** 항목은 요청대로 placeholder만 남긴다.
  - 나머지 내용은 기존 문서 초안보다 **현재 코드 기준 구현 구조**에 맞춰 정리한다.
  - 코드로 확인 불가능한 외부 시장/경쟁 리서치는 본 버전에서 확정 서술하지 않는다.

---

## 1. 서비스 개요

### 1-1. 프로젝트 정의
**AniCode/PetChain**은 반려동물의 신원, 의료 기록 접근 권한, 기념 NFT 경험을 하나의 흐름으로 묶는 **하이브리드 Web2.5 서비스**이다.  
핵심은 다음 3가지를 분리해서 설계하는 데 있다.

1. **반려동물 신원 증명**: `PetSBT`로 보호자 지갑에 귀속되는 반려동물 식별 토큰 발급
2. **의료 기록 권한 관리**: `MedicalPassportSBT`와 병원 권한 부여 구조로 진료 기록 접근/추가 통제
3. **기념 자산 및 후속 혜택**: `MemoryNFT` 발행과 NFT 기반 굿즈/홀더 기능 연동

### 1-2. 해결하려는 문제
기존 반려동물 의료/신원 데이터는 병원, 보호자 메모, 영수증, 각종 앱에 분산되어 있어 아래 문제가 발생한다.

- 병원을 옮기면 과거 이력 전달이 번거롭다.
- 보호자가 데이터 주도권을 가지기 어렵다.
- 병원/제3자가 기록 위변조 여부를 독립적으로 검증하기 어렵다.
- 서비스형 굿즈/멤버십/NFT 경험이 진짜 반려동물 데이터와 느슨하게 연결된다.

### 1-3. 코드 기준 핵심 가치 제안
현재 코드 구조상 이 서비스의 가치 제안은 다음과 같이 정리할 수 있다.

- **보호자 지갑 중심 소유권**: PetSBT/MedicalPassportSBT 소유자가 권한의 출발점이 된다.
- **병원 접근 통제**: 병원은 임의 접근이 아니라 보호자 승인 이후에만 진료 기록을 추가할 수 있도록 설계되어 있다.
- **오프체인 민감정보 보호**: 진료 메모는 DB에 AES-256-CBC로 암호화 저장한다.
- **온체인 검증 가능성**: 토큰 소유권, 권한 상태, 기록 append 이력은 컨트랙트 기준으로 검증 가능하다.
- **서비스 확장성**: NFT 발행 후 굿즈, 다운로드, 멤버십 등으로 확장 가능한 구조를 이미 UI/백엔드 일부에 반영하고 있다.

---

## 2. 별도 조사/작성 예정 항목 (피드백 1번, 2번 반영)

> 아래 항목은 요청대로 본 문서에서 placeholder만 남긴다.

- **수익구조**: `<<수익구조 적는 곳>>`
- **타겟 사용자 상세 정의**: `<<타겟 사용자 상세 적는 곳>>`
- **시장규모 분석**: `<<시장규모 분석 적는 곳>>`
- **보호자 정보 제공 동의 절차 상세안**: `<<보호자 정보 제공 동의 절차 적는 곳>>`
- **MVP 명시화**: `<<MVP 범위 적는 곳>>`
- **시장 분석 기반 수익 추정**: `<<수익 추정 적는 곳>>`
- **PetChain 설명 보강본**: `<<PetChain 설명 보강 적는 곳>>`

---

## 3. 현재 코드 기준 서비스 범위

### 3-1. 사용자 유형

| 구분 | 코드상 역할 | 주요 행동 |
| --- | --- | --- |
| 보호자(User) | Node 세션 role=`USER` | 지갑 연결, 반려동물 등록, SBT 발급, NFT 발행, 병원 승인/거절 |
| 병원(Org) | Node 세션 role=`ORG` | 보호자에게 권한 요청, 의료 여권 조회, 진료기록 추가 |
| 서비스 운영자 | 컨트랙트 owner / 백엔드 운영자 | `mintPrice`, `maxSupply`, withdraw, 서버/DB/S3 운영 |

### 3-2. 현재 코드베이스 기준 제품 구성

| 레이어 | 구성 | 역할 |
| --- | --- | --- |
| 보호자 프론트 | `feVite/src/App.jsx`, `feVite/src/web3.js` | 반려동물 등록, SBT/NFT 민팅, 마이페이지, NFT 기반 굿즈 UI |
| 병원 프론트 | `feHospital/src/App.jsx`, `feHospital/src/hospital.jsx` | 병원 지갑 연결, 승인 요청, 의료 여권 조회, 진료기록 append |
| Node API | `be/server.js` | 세션/로그인, 프로필 저장, SBT/NFT 동기화, SSE 승인 플로우, 간단 의료기록 저장 |
| 서비스 로직 | `be/logic/src/**` | 반려동물 등록, SBT/NFT 발급 상태관리, 마이페이지, 굿즈 프리뷰 게이팅 |
| Spring API | `backend/src/main/java/**` | 반려동물/주문/진료기록 API, 외부 동물등록 API 연동, S3 업로드 |
| 스마트컨트랙트 | `bc/PetSBT.sol`, `bc/MedicalPassportSBT.sol`, `bc/MemoryNFT.sol` | 온체인 소유권/권한/기념 NFT 발행 |
| 데이터 저장소 | MySQL, S3, on-chain | 프로필/주문/권한요청/암호화기록/이미지/토큰 상태 저장 |

### 3-3. 현재 코드상 정의되는 핵심 기능

1. **반려동물 등록**
   - 보호자가 반려동물 이름, 종, 생년월일, 이미지 등을 등록
   - 서비스 로직은 입력 검증 후 오프체인 프로필 저장

2. **PetSBT 발급**
   - 보호자 지갑이 직접 서명하여 SBT 민팅
   - 발급 성공 후 DB에 tokenId/transactionHash/metadata를 동기화

3. **Medical Passport 권한 승인**
   - 병원이 보호자에게 진료 권한 요청
   - 보호자는 SSE 팝업을 통해 승인/거절
   - 승인 결과는 병원-보호자 연결 정보로 저장

4. **진료기록 추가**
   - 병원은 MedicalPassportSBT 권한이 있을 때만 온체인에 기록 append
   - 오프체인 DB에는 별도 암호화 기록 저장 구조도 존재

5. **MemoryNFT 발행**
   - PetSBT 보유자만 연결된 펫 기반 MemoryNFT를 민팅 가능
   - 컨트랙트에서 `mintPrice`를 요구하며 PetSBT 소유자 여부를 검증

6. **NFT 기반 굿즈/홀더 기능**
   - UI 상 NFT 보유자 전용 굿즈 미리보기/주문/다운로드 기능 존재
   - 일부 기능은 아직 백엔드 실연동보다 프로토타입 성격이 강함

---

## 4. Web2 구조와 Rebuild 구조 비교

### 4-1. 기존 Web2 방식의 한계

| 항목 | 일반적인 Web2 구조 | 한계 |
| --- | --- | --- |
| 신원 관리 | 병원/플랫폼 DB 중심 | 데이터 소유권이 플랫폼에 치우침 |
| 의료기록 | 병원별 EMR, 문서, 메모 분산 | 병원 간 이동 시 전달 불편 |
| 접근 권한 | 내부 관리자 권한 기반 | 외부 검증이 어려움 |
| 무결성 | DB 수정 로그 의존 | 제3자 검증에 한계 |
| 확장 서비스 | 멤버십/쿠폰 별도 시스템 | 신원/기록과 자산 경험이 분리됨 |

### 4-2. PetChain Rebuild 구조

| 항목 | 현재 코드 기준 Rebuild 방향 |
| --- | --- |
| 신원 | 보호자 지갑에 귀속되는 `PetSBT` 발급 |
| 의료 기록 권한 | `MedicalPassportSBT` + 병원 permission 구조 |
| 상세 데이터 | 오프체인 DB/S3 저장, 일부 필드는 AES 암호화 |
| 검증 포인트 | 토큰 소유권, 권한 상태, 기록 append 이력은 온체인 확인 가능 |
| 확장 | MemoryNFT, 굿즈, 다운로드, 멤버십형 기능으로 연결 |

### 4-3. 본 서비스가 취하는 현실적 구조
이 프로젝트는 **모든 데이터를 온체인에 넣는 구조가 아니라, 신뢰가 필요한 권한/소유권/기록 앵커만 온체인에 두고 상세 데이터는 오프체인에 두는 하이브리드 구조**를 택하고 있다.  
즉, “완전 탈중앙화”가 아니라 **검증이 필요한 최소 단위를 블록체인으로 끌어올리는 설계**다.

---

## 5. 토큰 설계

### 5-1. PetSBT
- 컨트랙트: `bc/PetSBT.sol`
- 표준: `ERC721URIStorage` 기반 + `IERC5192` 구현
- 역할: 반려동물 등록/식별용 SBT
- 특징:
  - `registerPet(tokenURI)`로 민팅
  - `approve`, `setApprovalForAll`, 일반 transfer 차단
  - `Locked(tokenId)` 이벤트 발생
  - 보호자 지갑 기준으로 tokenId 목록 조회 가능

### 5-2. MedicalPassportSBT
- 컨트랙트: `bc/MedicalPassportSBT.sol`
- 표준: `ERC721URIStorage` 기반 + `IERC5192` 구현
- 역할: 의료 여권 SBT
- 특징:
  - 하나의 owner SBT(`PetSBT`)에 하나의 의료 여권 매핑
  - 보호자만 병원 권한 부여/회수 가능
  - 병원은 허가 기간/허용 횟수 내에서만 기록 append 가능
  - 진료기록은 `recordURI`, `dataHash`, `visitDate`, `schemaVersion` 단위로 축적

### 5-3. MemoryNFT
- 컨트랙트: `bc/MemoryNFT.sol`
- 표준: 일반 `ERC721URIStorage`
- 역할: 반려동물 기반 기념 NFT
- 특징:
  - `petSbtId`를 참조하여 민팅
  - 호출자는 해당 PetSBT 소유자여야 함
  - `mintPrice`, `maxSupply` 존재
  - 컨트랙트 owner가 가격 변경 및 출금 가능
  - **양도 불가 토큰이 아니라 거래 가능한 ERC-721 구조**

### 5-4. 피드백 5번에 대한 코드 기준 정리
피드백에 있던 “ERC-5192만 사용하는가?”에 대한 코드 기준 답은 다음과 같다.

- **아니다.**
- `PetSBT`, `MedicalPassportSBT`는 **ERC-721 기반**이며, 여기에 **ERC-5192 인터페이스를 추가로 구현**해 soulbound 상태를 알린다.
- `MemoryNFT`는 **ERC-5192가 아닌 일반 ERC-721**이다.

즉, 본 서비스는 **“ERC-721 + 일부 토큰에 ERC-5192 soulbound 보강”** 구조라고 정리하는 것이 맞다.

---

## 6. Token Lifecycle 상세

### 6-1. PetSBT Lifecycle

| 단계 | 내용 | 코드 근거 |
| --- | --- | --- |
| 등록 | 보호자가 반려동물 프로필 입력/저장 | `be/logic/src/features/pet-registration/register-pet-service.js` |
| 민팅 요청 | 보호자가 지갑으로 `registerPet(tokenURI)` 실행 | `feVite/src/web3.js`, `bc/PetSBT.sol` |
| 성공 동기화 | tokenId, transactionHash, metadata를 DB에 저장 | `be/server.js` `/api/sync-sbt` |
| 보유 상태 | 마이페이지에서 hasSbt/토큰 정보 조회 | `be/logic/src/features/my-page/get-my-page-service.js` |
| 전송 | 불가 | `PetSBT._update`, approval 차단 |
| 소각/만료 | 현재 코드상 별도 burn/expire 없음 | 컨트랙트에 미구현 |

### 6-2. MedicalPassportSBT Lifecycle

| 단계 | 내용 | 코드 근거 |
| --- | --- | --- |
| 발급 조건 | 기존 PetSBT 소유자만 의료 여권 발급 가능 | `bc/MedicalPassportSBT.sol` |
| 권한 부여 | 보호자가 병원 주소에 유효기간/기록횟수 조건으로 권한 부여 | `grantHospitalPermission` |
| 기록 추가 | 허가 병원이 진료 기록 append | `appendMedicalRecord` |
| 권한 회수 | 보호자가 revoke 가능 | `revokeHospitalPermission` |
| 전송 | 불가 | soulbound 처리 |
| 종료 | 현재 burn 없음, 권한 회수 중심 운영 | 컨트랙트 기준 |

### 6-3. MemoryNFT Lifecycle

| 단계 | 내용 | 코드 근거 |
| --- | --- | --- |
| 발급 조건 | PetSBT 보유자 + mint fee 납부 | `bc/MemoryNFT.sol` |
| 민팅 | `mintMemoryNFT(petSbtId, tokenURI)` | `feVite/src/web3.js` |
| 동기화 | DB에 nft issuance, nft_count 반영 | `be/server.js` `/api/sync-nft` |
| 활용 | 마이페이지 전시, 굿즈/다운로드/홀더 기능 게이팅 | `feVite/src/App.jsx`, `be/logic/src/features/goods/get-goods-preview-service.js` |
| 전송 | 가능(일반 ERC-721) | transfer 차단 로직 없음 |
| 소각/만료 | 현재 없음 | 컨트랙트 미구현 |

### 6-4. 현재 설계상 유의점
기존 초안에서는 NFT를 “비거래형 쿠폰”처럼 설명한 부분이 있었지만, **실제 코드의 `MemoryNFT`는 거래 가능한 ERC-721**이다.  
따라서 문서에는 “NFT = 비거래형 쿠폰”으로 쓰기보다 아래처럼 정리하는 것이 맞다.

- **온체인 NFT 자산 자체**: 거래 가능한 기념 NFT
- **서비스 내 혜택 사용**: 현재는 백엔드 DB의 `nft_count` 차감 방식으로 별도 운영

즉, **기념 NFT와 혜택 소모권 개념이 현재 코드에서는 완전히 동일하지 않다.**

---

## 7. 시스템 구조

### 7-1. 전체 아키텍처

```text
[보호자 프론트 feVite] ─┬─> [Node API be/server.js] ─┬─> [MySQL]
                         │                            ├─> [SSE 승인 이벤트]
                         │                            └─> [서비스 로직 be/logic]
                         │
                         ├─> [Sepolia / Smart Contracts]
                         │      ├─ PetSBT
                         │      ├─ MedicalPassportSBT
                         │      └─ MemoryNFT
                         │
                         └─> [Spring API backend]
                                ├─ 동물등록 조회 API 연동
                                ├─ 진료기록 암호화 저장
                                ├─ 이미지 업로드(S3)
                                └─ 주문 API

[병원 프론트 feHospital] ─┬─> [Node API] 승인 요청/세션
                          └─> [Sepolia / MedicalPassportSBT] 기록 조회·추가
```

### 7-2. 구성요소별 책임

#### 보호자 프론트 (`feVite`)
- 지갑 연결
- 반려동물 등록
- SBT/NFT 민팅
- 마이페이지 조회
- 굿즈/다운로드 UI
- 병원 권한 요청 승인 팝업 수신

#### 병원 프론트 (`feHospital`)
- 병원 지갑 연결 및 ORG 세션 생성
- 보호자 승인 요청 전송
- Medical Passport 조회
- 기록 추가 시 온체인 append

#### Node 백엔드 (`be`)
- 세션 기반 로그인/지갑 로그인
- USER/ORG role 관리
- 반려동물 프로필, SBT/NFT 동기화 저장
- SSE 승인 요청 전달
- 병원-보호자 연결 상태 저장
- 간단 진료 기록 저장(`medical_records_simple`)

#### Spring 백엔드 (`backend`)
- 외부 동물등록 정보 조회
- 진료 기록 AES 암호화 저장(`medical_records`)
- 굿즈 주문 API
- 이미지 업로드 및 S3 URL 반환

#### 스마트컨트랙트 (`bc`)
- PetSBT: 신원
- MedicalPassportSBT: 의료 여권/권한/기록
- MemoryNFT: 기념 NFT 및 mint fee

---

## 8. 블록체인 사용 이유와 네트워크 명시

### 8-1. 왜 블록체인을 쓰는가
이 서비스는 모든 반려동물 데이터를 온체인에 저장하려는 것이 아니라, 아래 항목을 **검증 가능한 상태**로 만들기 위해 블록체인을 사용한다.

- 누가 해당 반려동물의 소유자/보호자인가
- 어떤 병원이 언제 어떤 권한을 받았는가
- 어떤 의료 기록이 어떤 순서로 append 되었는가
- 특정 NFT가 실제로 해당 반려동물 자산과 연결되는가

즉, 블록체인의 목적은 **무결성 검증, 권한 추적, 제3자 신뢰 확보**이다.

### 8-2. 현재 코드에 명시된 네트워크
현재 프론트 기본 설정은 아래와 같다.

- `VITE_CHAIN_ID=0xaa36a7`
- `VITE_CHAIN_NAME=Sepolia`
- `VITE_RPC_URL=https://rpc.sepolia.org`
- `VITE_BLOCK_EXPLORER_URL=https://sepolia.etherscan.io`

따라서 **현재 구현 기준 블록체인은 Ethereum 호환 테스트넷인 Sepolia**다.

### 8-3. 가스비/비용 정리
코드 기준으로 정리하면 다음과 같다.

| 작업 | 트랜잭션 발생 | 비용 부담 주체 | 비고 |
| --- | --- | --- | --- |
| PetSBT 발급 | 예 | 보호자 | 지갑 서명 필요 |
| MedicalPassportSBT 발급 | 예 | 보호자 | 병원 기록 구조 시작점 |
| 병원 권한 부여/회수 | 예 | 보호자 | 현재 병원 UI 설명은 “병원 부담” 문구가 있으나 온체인 최종 설계는 정리 필요 |
| 의료기록 append | 예 | 병원 | `appendMedicalRecord` 호출 |
| MemoryNFT 발급 | 예 | 보호자 | `mintPrice` 납부 필요 |
| 마이페이지 조회/권한 조회 | 아니오(view) | 없음 | RPC 조회 |

### 8-4. 비용 관점에서 문서에 명시해야 할 점
- 현재 코드는 **Sepolia 테스트넷 기준**이라 실사용 화폐 비용을 산정하는 단계는 아니다.
- 실제 운영 전환 시에는 **Ethereum mainnet vs L2**를 별도 비교해야 한다.
- 현재 저장소에는 가스 스냅샷 또는 함수별 실측 비용표가 없으므로, **운영용 정량 비용 추정은 배포 후 별도 측정 필요**라고 적는 것이 정확하다.

---

## 9. 사용자/병원 플로우

### 9-1. 보호자 플로우

```text
지갑 연결
→ 반려동물 정보 입력
→ (선택) 동물등록 조회 API로 기본정보 보강
→ 반려동물 등록 저장
→ PetSBT 발급
→ 마이페이지에서 보유 상태 확인
→ 병원 권한 요청 수신 시 승인/거절
→ 필요 시 MemoryNFT 발행
→ NFT 기반 굿즈/다운로드 기능 이용
```

### 9-2. 병원 플로우

```text
병원 지갑 연결 및 ORG 세션 생성
→ 보호자 지갑 주소 + 펫 SBT ID 입력
→ 보호자에게 권한 요청 전송
→ 보호자 승인 여부 확인
→ Medical Passport 조회
→ 권한이 있으면 진료기록 append
→ 이후 동일 권한 범위 내에서 기록 열람/추가
```

### 9-3. 피드백 6번 반영: 에러 처리 흐름

#### 보호자 측
- 지갑 미연결 시: 연결 요청 후 중단
- 반려동물 미등록 상태에서 SBT/NFT 요청 시: 발급 차단
- 이미 SBT 보유 시: 중복 발급 차단
- 온체인 민팅 실패 시: transaction status를 `failed`로 저장

#### 병원 측
- 보호자 주소/SBT ID 누락 시: 요청 전송 불가
- 이미 연결된 병원일 경우: 재요청 차단
- Medical Passport가 없으면 조회 실패 처리
- 권한 없는 병원은 기록 append 불가
- 권한 만료/횟수 초과 시 append 불가

### 9-4. 피드백 6번 반영: 권한 요청/응답 플로우

```text
병원 → /api/vet/request-approval
→ Node DB(vet_connection_requests)에 저장
→ 보호자 SSE 구독 채널로 요청 푸시
→ 보호자 팝업 승인/거절
→ /api/vet/respond-approval
→ hospital_connections 갱신
→ (동기화용) pet_vet_approvals 반영 시도
```

---

## 10. 메뉴 구조 및 화면 구조

### 10-1. 보호자 앱 메뉴
현재 `feVite/src/App.jsx` 기준 상단 메뉴는 다음과 같다.

| 메뉴 | 주요 기능 |
| --- | --- |
| 홈 | 서비스 소개, 가치 제안, 흐름 안내 |
| 등록 | 반려동물 정보 입력, 동물등록 조회 API, 이미지 업로드, 등록 저장 |
| 마이페이지 | 반려동물 카드, SBT/NFT 보유현황, 발급 모달, NFT 상세 보기 |
| 굿즈 | NFT 기반 굿즈 미리보기, 주문 폼, 주문내역 UI |

### 10-2. 병원 앱 주요 화면
현재 `feHospital/src/hospital.jsx` 기준 주요 화면은 다음과 같다.

| 화면 블록 | 기능 |
| --- | --- |
| 병원 지갑 연결 | ORG 세션 생성 |
| 보호자 권한 요청 | 펫 SBT ID, 보호자 주소, 요청 메시지 전송 |
| 연결 상태 확인 | 보호자-병원 연결 여부 조회 |
| 의료 여권 조회 | owner SBT 기준 medical passport 조회 |
| 진료기록 등록 | 진단/치료/병원/메모 입력 후 온체인 append |
| 기록 목록 | 기존 기록 열람 |

### 10-3. 마이페이지 핵심 UI 요소
- 반려동물 대표 카드
- SBT 발급 상태
- NFT 컬렉션 목록
- NFT 민팅 모달
- 병원 승인 팝업
- 굿즈/다운로드/홀더 기능 진입점

---

## 11. 권한 관리 및 접근 제어

### 11-1. 온체인 권한 관리

| 자산/기능 | 실행 주체 | 통제 방식 |
| --- | --- | --- |
| PetSBT 발급 | 보호자 | msg.sender가 직접 민팅 |
| PetSBT 전송 | 불가 | soulbound 처리 |
| MedicalPassport 발급 | PetSBT 소유자 | ownerSBT owner 검증 |
| 병원 권한 부여 | MedicalPassport 소유자 | `grantHospitalPermission` |
| 병원 권한 회수 | MedicalPassport 소유자 | `revokeHospitalPermission` |
| 진료기록 추가 | 허가된 병원 | 기간/횟수/허용 여부 검증 |
| MemoryNFT 발급 | PetSBT 소유자 | linked PetSBT owner 검증 + mint fee |

### 11-2. 오프체인 권한 관리

| 구간 | 현재 코드 기준 |
| --- | --- |
| 인증 방식 | Node 세션 + wallet login + USER/ORG role |
| 병원 기능 제한 | `requireOrg` 미들웨어 적용 |
| 보호자 팝업 수신 | 로그인 세션 + ownerAddress SSE 구독 |
| 병원 승인 상태 | `hospital_connections`, `vet_connection_requests` 테이블 |
| 민감정보 저장 | AES-256-CBC 암호화 저장 |

### 11-3. 피드백 7번 반영: 오프체인 접근 제어 명시
현재 코드 기준으로는 아래처럼 정리해야 한다.

1. **의도된 접근 모델**
   - 보호자만 병원 접근을 승인/회수한다.
   - 승인된 병원만 진료기록 추가 권한을 가진다.
   - 민감한 진료 내용은 오프체인 DB에 암호화 저장한다.

2. **현재 구현에서 확인된 보완 필요점**
   - Node의 `/api/medical/:account/:petSbtId`는 `requireLogin`까지만 있고, **실제 owner/승인된 vet인지 추가 검증이 없다.**
   - Spring의 `RecordController`는 현재 코드상 별도 인증/인가 필터가 보이지 않아 **추가 보완이 필요하다.**
   - 따라서 기획서에는 “현재 설계 의도는 보호자 승인 기반 접근 제어이며, 오프체인 API는 owner/vet 기반 세분 인가를 추가 구현해야 한다”고 적는 것이 정확하다.

즉, **온체인 권한 모델은 비교적 명확하지만, 오프체인 상세 데이터 접근 제어는 아직 강화가 필요한 상태**다.

---

## 12. 온체인 / 오프체인 데이터 구분

### 12-1. 온체인 데이터

| 데이터 | 저장 위치 | 이유 |
| --- | --- | --- |
| PetSBT 소유권/토큰ID/tokenURI | 온체인 | 신원과 소유권 검증 핵심 |
| MedicalPassportSBT 소유권 | 온체인 | 의료 여권의 주체 증명 |
| 병원 permission 상태 | 온체인 | 누가 기록을 추가할 수 있는지 검증 필요 |
| recordURI / dataHash / visitDate / schemaVersion | 온체인 | 기록 append 이력과 무결성 앵커 |
| MemoryNFT 소유권 / petSbtId 연결 / mintPrice | 온체인 | 기념 자산 증명 및 결제 검증 |

### 12-2. 오프체인 데이터

| 데이터 | 저장 위치 | 이유 |
| --- | --- | --- |
| 사용자 계정(role, email, wallet) | MySQL | 서비스 인증/운영 데이터 |
| 반려동물 프로필 JSON | MySQL | 빠른 조회 및 UI 조합 |
| NFT 발급 이력 / nft_count | MySQL | 서비스 기능 게이팅/주문 처리 |
| 병원 승인 요청 대기열 | MySQL | SSE 비동기 처리 |
| 병원-보호자 연결 이력 | MySQL | 서비스 레벨 승인 상태 관리 |
| 진단/치료/메모 | MySQL 암호화 | 민감정보 보호 + 가스비 절감 |
| 이미지 파일 | S3 또는 data URL | 용량 문제 때문에 온체인 부적합 |
| 굿즈 주문 상세 | MySQL | 배송/운영 프로세스 처리 |

### 12-3. 설계 포인트
- **블록체인에는 검증용 핵심 상태만 저장**
- **실제 개인정보/의료 상세는 오프체인 저장**
- **민감정보는 DB에 암호화 후 저장**
- **이미지/대용량 메타데이터는 S3 또는 URI 방식으로 분리**

---

## 13. 현재 구현 범위 기준 확인된 설계 이슈 및 정리 포인트

### 13-1. 다중 반려동물 지원 범위 불일치
- 프론트 내부 일부 로직은 **한 보호자가 여러 반려동물을 가질 수 있는 구조**를 염두에 두고 있다.
- 하지만 Node MySQL 저장소 `pet_profiles`는 **account 1개당 프로필 1개** 구조다.
- 따라서 V001 문서에서는 “현재 백엔드 저장 기준 MVP는 보호자당 대표 반려동물 1개 프로필”로 적는 편이 안전하다.

### 13-2. 동물등록 조회 API 연결 불일치
- 프론트는 `POST /api/animal/registration-number` 형태를 기대한다.
- Spring에는 현재 `GET /api/animal/info`가 구현되어 있다.
- 즉, 동물등록 조회 기능은 **기획 의도는 있으나 실제 인터페이스 정합화가 필요**하다.

### 13-3. 굿즈 주문 기능의 구현 단계 차이
- Spring에는 `GoodsOrderController`와 DB 저장 로직이 있다.
- 하지만 현재 보호자 프론트 굿즈 화면은 주문 내역을 로컬 state로 관리하는 비중이 크다.
- 따라서 기획서에는 “굿즈 주문은 UI/백엔드 골격이 모두 있으나 완전 연동 전 단계”라고 쓰는 것이 맞다.

### 13-4. 의료기록 저장 경로 이원화
- Node: `medical_records_simple`
- Spring: `medical_records`
- Hospital FE: 온체인 `MedicalPassportSBT` 직접 호출

즉, 현재는 **온체인 기록, Node 간이 기록, Spring 암호화 기록이 병존하는 상태**이므로, 운영 버전에서는 단일 기준 저장 전략이 필요하다.

### 13-5. 문서상 차별화 포인트로 가져갈 수 있는 부분
외부 경쟁사 비교표를 코드로 확정할 수는 없지만, 현재 코드만으로도 아래 차별 포인트는 분명하다.

- 보호자 지갑 중심 소유권 모델
- 병원 승인 요청을 실시간 SSE로 처리하는 UX
- 의료 권한을 “허용 여부 + 기간 + 횟수”로 통제하는 구조
- PetSBT / MedicalPassportSBT / MemoryNFT로 역할을 분리한 토큰 구조
- 굿즈/홀더 기능까지 이어지는 서비스 확장성

---

## 14. 결론

본 프로젝트는 단순히 “반려동물 NFT를 발행하는 서비스”가 아니라, 코드 기준으로 보면 아래 3층 구조를 가진다.

1. **PetSBT**: 반려동물 신원 증명
2. **MedicalPassportSBT**: 의료 권한과 기록 관리
3. **MemoryNFT**: 감성 자산 및 후속 서비스 연결

따라서 V001 문서의 핵심 메시지는 다음처럼 정리하는 것이 적절하다.

> **PetChain은 보호자 지갑을 기준으로 반려동물의 신원과 의료 접근 권한을 통제하고, 그 위에 기념 NFT와 서비스 혜택을 연결하는 하이브리드 Web3 반려동물 플랫폼이다.**

또한 문서에는 아래를 함께 명시하는 것이 현실적이다.

- 시장/수익/MVP는 별도 조사 및 팀 논의 후 보강
- 현재 구현은 Sepolia 테스트넷 기준
- 온체인 권한 모델은 비교적 명확하나, 오프체인 상세 접근 제어는 추가 보완 필요
- 굿즈/외부 API/다중 반려동물 지원은 차기 정합화 대상

