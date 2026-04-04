# nft-mini5

반려동물의 신분증 역할을 하는 SBT를 발급하고, 기념일마다 사용자가 추억 NFT를 발행할 수 있도록 구성한 프로젝트입니다.

## 프로젝트 목적

이 프로젝트의 핵심 목표는 아래와 같습니다.

- 반려동물 정보를 등록한다.
- 반려동물의 신분증 역할을 하는 SBT를 발급한다.
- 사용자가 반려동물의 기념일마다 NFT를 발행한다.
- 온체인 자산과 서비스 로직을 연결해 반려동물 중심의 Web3 경험을 제공한다.

## 주요 구성

- `bc/`: 반려동물 SBT 및 기념 NFT 스마트 컨트랙트
- `be/`: 반려동물 등록, 발급 조건 검사, 상태 조회를 담당하는 Node.js 백엔드 (포트 4000)
- `backend/`: Spring Boot 기반 Animal API 백엔드 — SBT/NFT/수의사 승인/진료기록 API 제공 (포트 8080)
- `feVite/`: Vite 기반 프론트엔드 (구 CRA `fe/`는 더 이상 사용하지 않습니다)

## 실행 전 준비

프로젝트를 제대로 사용하려면 **스마트 컨트랙트 배포가 먼저 필요합니다.**

- `bc/PetSBT.sol`: 반려동물 신분증 SBT 컨트랙트
- `bc/MemoryNFT.sol`: 기념일 NFT 컨트랙트

컨트랙트가 배포되어 있어야 프론트엔드와 백엔드에서 발급 및 조회 기능을 정상적으로 연결할 수 있습니다.

## 실행 방법

### 프론트엔드 실행

프론트엔드는 **`feVite`** 디렉토리에서 Vite로 실행합니다.

```bash
cd feVite
npm install
npm run dev
```

`.env` 설정 예시는 `feVite/.env.example`를 참고해 `VITE_` 접두어로 복사/수정하세요. `VITE_API_BASE_URL`은 Node API(`be/`), `VITE_ANIMAL_API_BASE_URL`은 Spring Animal API(`backend/`)를 가리킵니다. 개발 시 `npm run dev`는 `/api` 요청을 기본적으로 `http://localhost:4000`으로 프록시합니다.

### 백엔드 실행 — Node.js (`be/`, 포트 4000)

MySQL 연동이 필요합니다. 서버 시작 시 `pawchain` 데이터베이스와 테이블이 자동으로 생성됩니다.

1. 환경변수 파일 생성

```bash
cp be/.env.example be/.env
```

2. `be/.env` 파일을 열어 MySQL 비밀번호 입력

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=비밀번호
DB_NAME=pawchain
```

3. 서버 실행

```bash
cd be
npm install
npm start
```

### 백엔드 실행 — Spring Boot (`backend/`, 포트 8080)

MySQL 연동이 필요합니다. 서버 시작 시 `pawchain` 데이터베이스와 테이블이 자동으로 생성됩니다.

`backend/src/main/resources/application.properties`에서 비밀번호를 직접 설정하거나, 환경변수로 전달합니다.

```properties
spring.datasource.password=비밀번호
```

**Gradle이 설치된 경우**

```bash
cd backend
gradle bootRun
```

**Gradle Wrapper를 생성해서 실행 (권장)**

```bash
cd backend
gradle wrapper
./gradlew bootRun
```

**VS Code Spring Boot Extension 사용**

[PawchainApplication.java](backend/src/main/java/com/example/pawchain/PawchainApplication.java) 파일을 열고 상단 `Run` 버튼 클릭

## 백엔드 검증

```bash
cd be
npm test
npm run check
```

## 서비스 흐름

1. 사용자가 반려동물 정보를 등록합니다.
2. 반려동물 신분증 SBT를 발급합니다.
3. 기념일 조건이 충족되면 사용자가 NFT를 발행합니다.
4. 마이페이지 등에서 SBT/NFT 보유 상태를 조회합니다.
