# BUTWIN TRIP — LocalHub

> 지역 관광 데이터와 생성형 AI를 결합한 여행 정보 웹 서비스

**Live Demo:** https://butwintrip.netlify.app/  
**Source Code:** https://github.com/leetin234/butwin_tpj/tree/master/LocalHub_Vue3_Vite

## 프로젝트 소개

BUTWIN TRIP(LocalHub)은 지역 관광 정보를 지도와 콘텐츠로 탐색하고, 생성형 AI 챗봇을 통해 사용자의 질문에 맞는 여행 정보를 확인할 수 있도록 만든 Vue 기반 웹 프로젝트입니다.

SSAFY 과정에서 제작한 프로젝트로, 단순한 관광지 목록 제공을 넘어 **관광 데이터 + 사용자 게시글 + AI 질의응답**을 하나의 화면에서 연결하는 것을 목표로 구현했습니다.

## AI 활용

- OpenAI 모델을 활용한 지역 여행 정보 챗봇
- 관광지 JSON과 커뮤니티 게시글을 context로 전달해 답변 생성
- 데이터에 없는 운영시간·가격·일정은 추측하지 않도록 system prompt 구성
- API 사용이 불가능한 환경에서는 키워드 기반 로컬 검색으로 fallback

즉, AI가 임의의 여행 정보를 생성하도록 두기보다 **현재 서비스가 가진 데이터 안에서 사용자의 질문과 관련된 정보를 찾아 설명하도록 구성**했습니다.

## 주요 기능

- 지역별 관광지 탐색 및 지도 시각화
- Leaflet 기반 관광지 위치 확인
- 생성형 AI 여행 정보 챗봇
- 관광·지역 커뮤니티 게시판
- 게시글 검색 / 작성 / 수정 / 삭제 / 북마크
- 다국어 UI
- 모바일 반응형 화면
- Netlify 배포

## Tech Stack

- Vue 3
- Vite
- Vue Router
- vue-i18n
- Leaflet
- OpenAI API
- Netlify

## 데이터

관광 콘텐츠는 한국관광공사 Tour API 기반 제공 JSON을 사용하며, 서비스 내부 데이터와 사용자 게시글을 AI 답변의 참고 정보로 활용합니다.

## 참고

이 프로젝트는 교육 목적으로 제작되었습니다. 현재 저장소의 AI 호출 방식은 과제 조건에 맞춘 브라우저 기반 구조이며, 실제 상용 서비스로 확장할 경우 API 키 보호를 위해 서버 또는 Serverless Function을 통한 호출 구조로 변경하는 것이 적절합니다.
