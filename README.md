# 우리 동네 모임 React

Vanilla JS 애플리케이션을 React, Vite, React Router 기반으로 마이그레이션한 결과물입니다.

## 실행

```bash
npm install
npm run dev
```

기본 API 주소는 `.env`의 `VITE_API_BASE_URL=http://localhost:8080`입니다.

## 검증

```bash
npm run lint
npm run build
```

구현 route는 `/login`, `/register`, `/posts`, `/posts/new`, `/posts/:postId`, `/posts/:postId/edit`, `/profile`, `/profile/password`입니다. 모든 API 실패는 공통 Toast 또는 복구 가능한 Dialog로 표시되며, field helper는 클라이언트 입력 검증에만 사용합니다.
