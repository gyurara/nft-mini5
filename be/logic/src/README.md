# `be/logic/src` 구조 설명

이 디렉터리는 서비스 로직의 실제 코드가 들어있는 영역입니다.
구조를 크게 보면 **app이 전체를 조립하고, features가 비즈니스 로직을 수행하며, ports가 외부 의존성의 계약을 정의하고, repositories가 저장 구현을 제공**합니다.

## 한눈에 보는 구조

```text
src/
├─ app/            # 서비스 조립기
├─ features/       # 기능별 비즈니스 로직
├─ ports/          # 외부 의존성 인터페이스(계약)
├─ repositories/   # 저장소 구현체
├─ shared/         # 공통 유틸, 에러, 검증
└─ index.js        # 외부 공개 진입점
```

흐름은 대체로 아래와 같습니다.

```text
index.js
  ↓
app/create-pet-service-app.js
  ↓
features/* 서비스 생성
  ↓
ports/* 로 외부 의존성 계약 확인
  ↓
repositories/* 로 상태 저장
  ↓
shared/* 공통 유틸 사용
```

## 디렉터리별 역할

### `app/`
애플리케이션의 **조립 지점(composition root)** 입니다.

현재 핵심 파일은 `app/create-pet-service-app.js`이며, 여기서 다음 일을 합니다.

- `sessionGateway`, `contractGateway`, `petProfileRepository` 주입
- `ports/`의 검증 함수로 인터페이스가 맞는지 확인
- 각 feature 서비스를 생성
- 최종적으로 외부에서 사용할 앱 API 반환

반환되는 주요 API는 다음과 같습니다.

- `registerPet(input)`
- `issueSbt(account)`
- `issueNft(account)`
- `getMyPage(account)`
- `getGoodsPreview(account)`
- `getLatestTransaction(account, kind)`

즉, `app/`은 여러 기능과 의존성을 묶어서 **실행 가능한 서비스 객체로 만드는 곳**입니다.

### `ports/`
서비스 로직이 외부 시스템을 사용할 때 필요한 **인터페이스 계약**을 모아둔 디렉터리입니다.

여기에는 실제 구현이 아니라,
**“이 의존성은 어떤 메서드를 반드시 가져야 하는가?”** 가 정의되어 있습니다.

현재 파일은 다음과 같습니다.

- `ports/session-gateway.js`
  - 요구 메서드: `assertConnected`, `getTokenState`, `refreshTokenState`
- `ports/contract-gateway.js`
  - 요구 메서드: `mintSbt`, `mintNft`
- `ports/pet-profile-repository.js`
  - 요구 메서드:
    - `savePetProfile`
    - `getPetProfileByAccount`
    - `saveSbtIssuance`
    - `appendNftIssuance`
    - `saveTransaction`
    - `getLatestTransaction`

이 계약은 `app/create-pet-service-app.js`에서 검사됩니다.

즉, `ports/`는 **로직과 외부 구현 사이의 경계**입니다.
덕분에 로직은 특정 구현에 직접 묶이지 않고, 테스트용 mock/fake나 실제 구현체를 쉽게 바꿔 끼울 수 있습니다.

### `repositories/`
저장소의 **구현체**가 들어있는 디렉터리입니다.

현재는 `repositories/in-memory-pet-profile-repository.js` 하나가 있으며,
메모리 기반으로 아래 데이터를 저장합니다.

- 계정별 반려동물 프로필
- SBT 발급 정보
- NFT 발급 이력
- 최신 트랜잭션 상태

즉, 지금은 DB 대신 쓰는 **오프체인 임시 저장소 구현**입니다.
나중에 DB 기반 구현이 필요해지면, 같은 repository 계약을 만족하는 구현체를 추가하면 됩니다.

### `features/`
실제 **비즈니스 로직(유스케이스)** 이 들어있는 디렉터리입니다.
기능별로 서비스가 나뉘어 있습니다.

현재 포함된 기능은 다음과 같습니다.

- `features/pet-registration/register-pet-service.js`
  - 반려동물 등록/수정
- `features/sbt/issue-sbt-service.js`
  - SBT 발급
- `features/nft/issue-nft-service.js`
  - NFT 발급
- `features/my-page/get-my-page-service.js`
  - 마이페이지 조회
- `features/goods/get-goods-preview-service.js`
  - 굿즈 미리보기 가능 여부 조회

각 feature는 필요한 의존성만 받아서 `execute()`를 수행합니다.
예를 들어 SBT/NFT 발급 서비스는 다음 흐름을 가집니다.

1. 세션 연결 여부 확인
2. 반려동물 등록 여부 확인
3. 발급 가능 상태 확인
4. pending 트랜잭션 저장
5. 컨트랙트 mint 호출
6. 토큰 상태 갱신
7. 발급 정보 저장
8. success / failed 트랜잭션 저장

즉, 이 디렉터리는 프로젝트의 **핵심 업무 규칙이 모여 있는 곳**입니다.

### `shared/`
여러 feature에서 공통으로 쓰는 유틸리티가 들어있습니다.

현재 파일은 다음과 같습니다.

- `shared/errors.js`
  - `AppError`, `toAppError`
- `shared/pet-validation.js`
  - 반려동물 입력값 검증
- `shared/receipt.js`
  - mint 결과에서 `tokenId` 추출
- `shared/token-uri.js`
  - token URI / metadata 생성

즉, `shared/`는 특정 기능 하나에만 묶이지 않는 **공통 보조 로직**입니다.

### `index.js`
`src`의 **외부 공개 진입점**입니다.

현재 외부로 내보내는 값은 다음과 같습니다.

- `createPetServiceApp`
- `InMemoryPetProfileRepository`
- `AppError`

다른 코드에서 `logic/src`를 사용할 때 가장 먼저 보게 되는 파일입니다.

## 구조를 실무식으로 보면

이 구조는 아래처럼 이해하면 쉽습니다.

- `features/` = 유스케이스, 핵심 비즈니스 로직
- `ports/` = 외부 의존성에 대한 계약
- `repositories/` = 저장소 구현체
- `app/` = 의존성 조립 및 서비스 생성
- `shared/` = 공통 유틸

즉, 비즈니스 로직을 외부 구현으로부터 분리하려는 구조입니다.
이 덕분에 다음 장점이 있습니다.

- 테스트가 쉬움
- 구현 교체가 쉬움
- 로직과 인프라의 결합도가 낮아짐
- 세션/컨트랙트/저장소를 독립적으로 개발 가능

## `ports/`를 특히 이렇게 보면 됩니다

`ports/`는 “외부 세계와 연결되는 구멍”입니다.

예를 들어 서비스 로직은:

- 세션 연결 확인이 필요하고
- 현재 토큰 상태 조회가 필요하고
- 컨트랙트 mint 호출이 필요하고
- 저장소에 상태를 기록해야 합니다.

하지만 로직은 **MetaMask 구현, 체인 연결 구현, DB 구현 그 자체**를 알 필요가 없습니다.
대신 `ports/`가 정의한 메서드만 호출하면 됩니다.

그래서 `ports/`는 이 프로젝트에서
**로직 레이어가 외부 구현체를 받아들이기 위한 계약 지점**이라고 보면 됩니다.
