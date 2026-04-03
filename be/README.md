# BE 서비스 로직 분리 구현

이 디렉터리는 **서비스 로직 담당 영역만** 구현합니다.
지갑/세션 연결, 스마트 컨트랙트 구현, 실제 MetaMask 연동은 다른 팀원의 작업 영역으로 남겨 두고,
이곳에서는 그 구현체를 주입받아 동작하는 **애플리케이션 서비스 계층**만 제공합니다.

## 한눈에 보기

- 백엔드 전체 기준점: `be/`
- 서비스 로직 구현 위치: `be/logic/`
- 다른 팀원이 붙일 경계: `be/logic/src/ports/**`
- 현재 저장 방식: 메모리 기반 오프체인 저장소
- 실행 기준: `cd be`

## 팀 충돌 방지 원칙

- `logic/src/features/**`: 서비스 로직 전용 기능별 모듈
- `logic/src/ports/**`: 다른 팀원이 연결할 인터페이스 경계
- `logic/src/repositories/**`: 오프체인 상태 저장소
- `logic/test/**`: 서비스 로직 검증

즉, 아래 항목은 **여기서 구현하지 않습니다.**

- MetaMask 연결 및 세션 복원
- 계정 변경 감지
- 실제 스마트 컨트랙트 ABI/배포/체인 연결
- Solidity 코드 변경

## 폴더 구조

```text
be/
├─ package.json                # 백엔드 루트 실행 기준점
├─ logic/
│  ├─ src/
│  │  ├─ app/                  # 서비스 조합기
│  │  ├─ features/             # 기능별 서비스 로직
│  │  │  ├─ pet-registration/
│  │  │  ├─ sbt/
│  │  │  ├─ nft/
│  │  │  ├─ my-page/
│  │  │  └─ goods/
│  │  ├─ ports/                # 타 팀 구현체가 맞춰야 할 경계
│  │  ├─ repositories/         # 오프체인 상태 저장소
│  │  └─ shared/               # 공용 유틸/에러/검증
│  └─ test/
```

## 통합 전략

- `be`는 **백엔드 전체 루트**로 유지합니다.
- `logic`는 **서비스 로직 전용 하위 모듈**입니다.
- 지갑/세션, 컨트랙트 연결, API 서버가 추가되더라도 `be` 아래에 병렬로 붙이면 됩니다.
- 따라서 팀원들은 실행 기준을 `be`로 맞추고, 서비스 로직 연동만 `be/logic/src/ports/**`에 연결하면 됩니다.

예시:

```text
be/
├─ logic/
├─ adapters/
│  ├─ session/
│  └─ contract/
├─ api/
└─ config/
```

## 구현된 서비스 로직

### 1) 반려동물 등록
- 파일: `logic/src/features/pet-registration/register-pet-service.js`
- 입력값:
  - `account`
  - `name`
  - `species`
  - `birthDate`
- 역할:
  - 입력값 검증
  - 계정별 반려동물 프로필 저장
  - 재등록 시 기존 pet id 유지

### 2) SBT 발급
- 파일: `logic/src/features/sbt/issue-sbt-service.js`
- 역할:
  - 지갑 연결 여부 확인
  - 반려동물 등록 여부 확인
  - SBT 중복 발급 차단
  - `mintSbt(tokenUri)` 실행
  - receipt/event에서 `tokenId` 추출
  - pending / success / failed 상태 저장

### 3) NFT 발급
- 파일: `logic/src/features/nft/issue-nft-service.js`
- 역할:
  - 지갑 연결 여부 확인
  - 반려동물 등록 여부 확인
  - SBT 보유 여부 검사
  - `mintNft(tokenUri)` 실행
  - receipt/event에서 `tokenId` 추출
  - NFT 발급 이력 및 트랜잭션 상태 저장

### 4) 마이페이지 조회
- 파일: `logic/src/features/my-page/get-my-page-service.js`
- 반환:
  - 반려동물 정보
  - SBT / NFT 보유 상태
  - 발급 정보
  - UI 제어용 플래그

### 5) 굿즈 미리보기 게이팅
- 파일: `logic/src/features/goods/get-goods-preview-service.js`
- 역할:
  - NFT 보유자 여부 기준으로 미리보기 허용 여부 반환
  - 버튼 활성/비활성 판단용 데이터 제공

## 서비스 흐름

```text
반려동물 등록
  ↓
SBT 발급 가능 여부 확인
  ↓
SBT 발급
  ↓
NFT 발급 가능 여부 확인 (SBT 필요)
  ↓
NFT 발급
  ↓
마이페이지 / 굿즈 미리보기 제어
```

## 외부 의존 인터페이스

### sessionGateway
- `assertConnected(account)`
- `getTokenState(account)` → `{ hasSbt, hasNft, nftBalance }`
- `refreshTokenState(account)` → `{ hasSbt, hasNft, nftBalance }`

### contractGateway
- `mintSbt({ account, tokenUri })`
- `mintNft({ account, tokenUri })`

각 mint 결과는 아래 형태를 따르는 객체면 됩니다.

```js
{
  hash: '0x...',
  tokenId: 1,
  eventName: 'SBTMinted' // 또는 NFTMinted
}
```

또는 `receipt.events` 배열을 포함하는 객체도 허용됩니다.

## 제공 서비스

- `registerPet(input)`
- `issueSbt(account)`
- `issueNft(account)`
- `getMyPage(account)`
- `getGoodsPreview(account)`
- `getLatestTransaction(account, kind)`

## 오프체인 저장 데이터

현재는 `logic/src/repositories/in-memory-pet-profile-repository.js`에서 다음 데이터를 저장합니다.

- 계정별 반려동물 프로필
- SBT 발급 정보
- NFT 발급 이력
- 최신 트랜잭션 상태

추후 DB가 필요해지면 repository 구현체만 교체하면 됩니다.

## 사용 예시

```js
const { createPetServiceApp } = require('./logic/src');

const app = createPetServiceApp({
  sessionGateway,
  contractGateway,
});

await app.registerPet({
  account: '0xabc123',
  name: '나비',
  species: '고양이',
  birthDate: '2023-01-01',
});

await app.issueSbt('0xabc123');
await app.issueNft('0xabc123');

const myPage = await app.getMyPage('0xabc123');
```

## 테스트 범위

- 등록 → SBT → NFT → 마이페이지 정상 흐름
- SBT 없이 NFT 발급 차단
- SBT 중복 발급 차단
- 지갑 미연결 차단
- mint 실패 시 failed 상태 저장

## 실행

```bash
cd be
npm test
npm run check
```
