# BE 서비스 로직 분리 구현

이 디렉터리는 **서비스 로직 담당 영역만** 구현합니다.
지갑/세션 연결, 스마트 컨트랙트 구현, 실제 MetaMask 연동은 다른 팀원의 작업 영역으로 남겨 두고,
이곳에서는 그 구현체를 주입받아 동작하는 **애플리케이션 서비스 계층**만 제공합니다.

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

## 실행

```bash
cd be
npm test
npm run check
```
