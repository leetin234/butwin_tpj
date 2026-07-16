# LocalHub — 대전·충청

PDF 개발 의뢰서 기준에 맞춰 구성한 **Vue.js 3 + Vite 정적 SPA**입니다. 기존 단일 HTML 시안의 색상, 카드, 배너, 게시판, 플로팅 챗봇 디자인을 Vue 컴포넌트 구조로 옮겼습니다.

## 구현 범위

- Vue 3 + Vite + Vue Router
- 대전·충청 1개 권역 선정
- `public/data/daejeon.json`을 프론트엔드에서 직접 로드
- 익명 게시판 CRUD: 목록·검색·상세·작성·수정·삭제
- 게시글 및 수정용 비밀번호 `localStorage` 저장·비교
- 조회수, 북마크, 검색 기능
- Leaflet 기반 관광지 지도 핀 시각화
- OpenAI API 직접 호출형 플로팅 챗봇
- 모바일 반응형 UI
- Netlify SPA 리다이렉트 설정

## 실행

```bash
npm install
cp .env.example .env
npm run dev
```

Windows PowerShell에서는 다음처럼 복사할 수 있습니다.

```powershell
Copy-Item .env.example .env
npm run dev
```

## OpenAI 환경변수

`.env`에 아래 값을 입력합니다.

```env
VITE_OPENAI_API_KEY=발급받은_사용량_제한_키
VITE_OPENAI_MODEL=gpt-4o-mini
```

이 구조는 과제 문서가 요구하는 브라우저 직접 호출 방식입니다. `VITE_` 환경변수는 빌드 결과에 포함되므로 실제 서비스에서는 비밀키를 안전하게 보호할 수 없습니다. 반드시 사용량 제한이 걸린 교육용 키를 사용하고 `.env`는 Git에 올리지 마세요. 키가 비어 있어도 JSON·게시글 키워드를 활용한 로컬 답변이 동작합니다.

## Finder 탭 (CCTV · 실종자 정보)

`/finder` 경로에 지도 기반 CCTV 뷰어 + 대전시 경고 안내 + 실종아동/실종자 정보 갤러리를 제공합니다.

- **CCTV**: 국가교통정보센터(ITS) 오픈API(`VITE_ITS_API_KEY`)를 사용합니다. 고속도로·국도 CCTV만 제공하며, 얼굴 인식이나 실내 추적 기능은 없습니다(도로 상황 확인용).
- **실종자 정보**: 경찰청 실종아동정보 서비스(안전Dream, `VITE_SAFE182_ESNTL_ID`/`VITE_SAFE182_AUTH_KEY`)를 사용합니다.
- 두 키 모두 `.env`에 비어 있으면 `src/data/finderSampleData.js`의 샘플 데이터로 화면이 채워지고, 실종자 카드에는 "샘플" 배지가 표시됩니다.
- **CORS 주의**: 두 공공API 모두 브라우저 직접 호출이 막혀 있을 수 있습니다. 막히면 `netlify.toml`에 Netlify Functions 프록시를 하나 추가해 그 안에서 fetch하는 구조로 바꿔야 합니다.
- **필드명 검증 필요**: `src/services/its.js`, `src/services/safe182.js`의 응답 파싱 부분은 공개된 카탈로그 설명만으로 구성했습니다. 실제 키를 발급받으면 응답 JSON을 콘솔에 찍어 필드명이 맞는지 꼭 확인하세요.
- 실제 실종자 정보는 이 데모가 아니라 반드시 [안전Dream 공식 사이트](https://www.safe182.go.kr)에서 확인해야 합니다.

## Netlify 배포

1. GitLab 저장소에 이 프로젝트를 push합니다.
2. Netlify에서 저장소를 연결합니다.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Site configuration의 환경변수에 `VITE_OPENAI_API_KEY`를 등록합니다.

## 데이터

- 파일: `public/data/daejeon.json`
- 원출처 표기: 한국관광공사 Tour API 기반 제공 JSON
- 이미지: 제공 JSON에 포함된 한국관광공사 이미지 URL
- 본 프로젝트에서는 제공된 JSON을 재수집하지 않고 프론트엔드에서 직접 읽습니다.

## 교육용 저장 구조 주의

게시글과 비밀번호는 사용자의 현재 브라우저에만 저장됩니다. 다른 기기나 브라우저 사용자와 실제로 공유되지 않으며 비밀번호도 암호화되지 않습니다. 이는 PDF 가이드에 명시된 교육 목적의 구조입니다.

## npm 설치 오류가 날 때

이 프로젝트는 공식 npm 공개 레지스트리를 사용합니다. 이전 설치가 중단되었다면 `node_modules`를 삭제한 뒤 다시 설치하세요.

```bash
rm -rf node_modules
npm cache verify
npm install
npm run dev
```

Windows에서 파일 잠금 오류가 계속되면 VS Code와 실행 중인 Node 프로세스를 종료한 뒤 다시 시도하세요.

## 게시글 이미지 첨부

글쓰기/수정 화면에서 게시글당 이미지 1장을 첨부할 수 있습니다. JPG, PNG, WEBP, GIF 형식을 선택할 수 있으며, 원본 파일은 최대 8MB까지 허용됩니다. 선택한 이미지는 브라우저 저장공간 사용량을 줄이기 위해 최대 1600px로 축소·압축된 뒤 게시글과 함께 localStorage에 저장됩니다.

별도 서버가 없는 구조이므로 첨부 이미지는 작성한 브라우저와 기기에서만 유지됩니다. 저장공간이 부족하면 더 작은 이미지를 사용하거나 기존 게시글의 첨부 이미지를 삭제해 주세요.
