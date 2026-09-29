# Rimento Template Guide (57)

> 이 파일은 `npm run check:templates` 가 src/templateLibrary.ts 에서 자동 생성합니다. 직접 수정하지 마세요.
> 새 템플릿 추가 절차: .claude/skills/add-template/SKILL.md

템플릿 선택 시 기존 페이지 내용은 유지되고 시각 구조만 바뀝니다.

| No | Template ID | 이름 | 분류 | 설명 | 입력 가이드 |
|---:|---|---|---|---|---|
| 01 | cover | Hero Cover | 표지 | 큰 헤드라인과 유기적 도형을 활용한 리멘토형 표지 | 제목 1~3줄 + 짧은 서브카피 |
| 02 | cover-question | Why? Cover | 표지 | Why/Question 훅을 전면에 내세운 강한 표지 | 질문형 제목에 적합 |
| 03 | cover-browser | Browser Cover | 표지 | 브라우저 창 프레임을 활용한 매거진형 표지 | 브랜드/특집/인터뷰형 |
| 04 | cover-binder | Binder Cover | 표지 | 과정 안내·리스트업에 강한 바인더형 표지 | 과정명·라인업·오픈 안내 |
| 05 | editorial | Editorial Lead | 스토리 | 제목+본문+핵심 요약을 안정적으로 배치 | 오프닝·문제 제기 |
| 06 | opening-question | Opening Question | 스토리 | 질문 한 문장을 크게 던지고 맥락을 설명 | 독자의 문제의식 환기 |
| 07 | key-questions | 3 Key Questions | 스토리 | 핵심 질문 3~5개를 번호로 구조화 | 목차·읽을거리 예고 |
| 08 | story | Case Story | 스토리 | 사례 서사를 문단과 강조문으로 전개 | 상황-문제-전환점 |
| 09 | dialogue | Dialogue | 스토리 | 말풍선으로 이해관계자의 대화를 표현 | 갈등·피드백 사례 |
| 10 | quote-focus | Quote Focus | 스토리 | 한 문장을 중심으로 메시지를 각인 | 고객 발언·핵심 문장 |
| 11 | list | Numbered List | 정보 | 번호와 짧은 설명을 카드형으로 정리 | 3~6개 포인트 |
| 12 | cards-3 | 3 Pillars | 정보 | 세 가지 핵심 축을 동일 위계로 제시 | 3대 효과·3대 원칙 |
| 13 | cards-4 | 4 Blocks | 정보 | 네 개 정보를 2×2 카드로 시각화 | 4가지 방법·역량 |
| 14 | checklist | Checklist | 정보 | 실행 항목을 체크박스로 제시 | 실무 팁·행동 점검 |
| 15 | insight | Insight Box | 정보 | 결론과 이유를 위계감 있게 강조 | 핵심 인사이트·해석 |
| 16 | program-info | Program Info | 정보 | 일시·대상·비용·안내를 정보표로 구성 | 교육/행사 안내 |
| 17 | stats | Metric Grid | 데이터 | 2~6개 핵심 수치를 카드 그리드로 표시 | 성과·조사 결과 |
| 18 | stat-focus | Big Number | 데이터 | 핵심 숫자 하나를 압도적으로 강조 | 대표 KPI·핵심 수치 |
| 19 | score-profile | Score Profile | 데이터 | 특성 점수를 점 배열로 보여주는 프로필형 | 진단 결과 3개 |
| 20 | bar-profile | Bar Profile | 데이터 | 여러 지표를 가로 막대로 비교 | 역량·설문·비율 |
| 21 | process | Vertical Process | 프로세스 | 단계별 흐름을 세로로 안정적으로 표현 | 3~5단계 과정 |
| 22 | timeline | Timeline | 프로세스 | 시간 또는 순서를 가로 타임라인으로 표현 | 로드맵·일정 |
| 23 | step-cards | Step Cards | 프로세스 | 단계를 독립 카드로 나눠 읽기 쉽게 구성 | 4단계 방법론 |
| 24 | comparison | Split Compare | 비교 | 좌우 두 관점을 명확히 대비 | A/B·장점/리스크 |
| 25 | before-after | Before → After | 비교 | 행동의 전환을 화살표 흐름으로 표현 | 변화 전/후 |
| 26 | matrix | 2×2 Matrix | 비교 | 네 개 영역을 한 화면에 배치하는 프레임워크형 | 4유형·우선순위 |
| 27 | wheel | Framework Wheel | 비교 | 중심 개념과 주변 요소를 방사형으로 표현 | 역할·역량 체계 |
| 28 | testimonial | Testimonial | 마무리 | 후기·인터뷰·고객 코멘트를 신뢰감 있게 제시 | 후기 2~3개 |
| 29 | cta | CTA / Contact | 마무리 | 연락처와 행동 유도 문구를 명확히 구성 | 문의·신청·구독 |
| 30 | closing | Closing Manifesto | 마무리 | 브랜드 문장과 메시지로 여운 있게 종료 | 브랜드 미션·마지막 한마디 |
| 31 | cover-type | Bold Type Cover | 표지 | 초대형 타이포가 화면을 채우는 강한 표지 | 짧은 제목 2~3줄 · 항목=목차 3개 |
| 32 | cover-swipe | Swipe Cover | 표지 | 다음 장으로 이어지는 도형으로 스와이프를 유도 | 메모=스와이프 문구 · 항목=태그 |
| 33 | cover-book | Book Cover | 표지 | 책 표지처럼 제목을 오브젝트 안에 담은 표지 | 시리즈·가이드북 · 메모=저자/브랜드 |
| 34 | cover-photo | Photo Cover | 표지 | 어두운 사진 위 헤드라인, 마지막 줄 강조 | 이미지 업로드 권장 · 마지막 줄이 강조됨 |
| 35 | cover-issue | Issue Split Cover | 표지 | 호수 숫자와 이번 호 목차를 분할 배치 | 메모=호수 숫자 · 항목=목차 3~5개 |
| 36 | persona | Persona Profile | 정보 | 인물 슬롯·속성·태그로 구성한 페르소나 카드 | 항목=라벨\|값 4개 · 메모=태그(쉼표 구분) |
| 37 | card-stack | Card Stack Index | 정보 | 겹쳐 쌓인 컬러 카드로 목차·토픽을 소개 | 항목=제목\|설명 3~5개 |
| 38 | tool-fan | Tool Card Fan | 정보 | 부채꼴로 펼친 도구 카드 3장과 설명 | 항목=도구명\|설명 3개 |
| 39 | bingo | Practice Bingo | 정보 | 실천 과제를 3×3 빙고판으로 제시 | 완료 칸은 "v\|텍스트" · 최대 9개 |
| 40 | news-brief | News Brief | 정보 | 헤드 블록 아래 3개 뉴스 카드를 배치 | 항목=제목\|설명 3개 · 첫 카드에 이미지 |
| 41 | bento | Bento Topics | 정보 | 크기가 다른 타일로 토픽을 모아 보여주는 대시보드형 | 항목=카테고리\|헤드라인 5개 |
| 42 | expert-profile | Expert Profile | 스토리 | 사선 흑백 패널의 전문가·강사 소개 | 제목=이름 · 소분류=직함 · 항목=전문분야\|설명 |
| 43 | series-progress | Series Progress | 스토리 | 상단 진행 바로 시리즈 흐름을 보여주는 본문 | 항목=포인트\|설명 · 메모=다음 장 예고 |
| 44 | post-mock | Social Post | 스토리 | SNS 게시물 프레임으로 한 문장을 전달 | 항목=해시태그 · 이미지 선택 |
| 45 | donut | Donut Ratio | 데이터 | 도넛 차트와 범례로 응답 비율을 표시 | 항목=라벨\|값 2~4개 |
| 46 | decision-flow | Decision Flow | 프로세스 | 질문에서 예/아니오로 갈라지는 분기 흐름 | 본문=질문 · 항목1·2=분기 · 항목3·4=후속 |
| 47 | swimlane | Role Swimlane | 프로세스 | 역할별 레인에 단계를 배치한 협업 프로세스 | 항목=역할\|단계1>단계2>단계3 |
| 48 | empathy-map | Empathy Map | 비교 | 중심 인물의 말·생각·행동·감정을 4방향으로 정리 | 항목=SAYS\|내용 4개 · 메모=인물 |
| 49 | csd-board | CSD Board | 비교 | 확실한 것·가정·의문을 3열 포스트잇으로 정리 | 항목=C\|내용, S\|내용, D\|내용 |
| 50 | cover-newsletter | Newsletter Cover | 표지 | 강한 배경색 위 초대형 제목과 호수 표기의 뉴스레터형 표지 | 제목 2~3줄 · 상단 라벨=VOL · 메모=발행월 · 이미지(일러스트) 선택 |
| 51 | browser-columns | Browser Columns | 정보 | 브라우저 창 안에 챕터 칩·제목·아이콘 카드 2열을 배치 | 항목=카드 제목\|설명 2개(최대 4) · 상단 라벨=챕터 |
| 52 | keyword-scatter | Keyword Map | 정보 | 크기가 다른 키워드 태그를 흩어 배치하고 핵심 키워드를 강조 | 항목=키워드 5~7개(첫 번째가 가장 크게) · 본문=하단 설명 |
| 53 | sticker-flow | Sticker Flow | 프로세스 | 스티커형 원 아이콘 단계와 아래 태그 목록으로 흐름을 표현 | 항목=단계명\|태그1, 태그2 3개 · 상단 라벨=섹션명 |
| 54 | arc-steps | Arc Steps | 프로세스 | 반원 아크 안의 핵심 문장과 STEP 열별 불릿 정리 | 항목=단계 제목\|내용1 / 내용2 3개 · 메모=아크 위 소제목 |
| 55 | step-detail | Step Detail | 프로세스 | STEP 번호·큰 제목·설명 아래 확인 포인트 카드 3개 | 상단 라벨=STEP 01 · 메모=말풍선 · 항목=포인트\|설명 3개 |
| 56 | before-after-list | Before After List | 비교 | BEFORE·AFTER 박스를 위아래로 놓고 불릿으로 비교 | 항목=B\|개선 전 내용, A\|개선 후 내용 (표시 없으면 앞 절반=BEFORE) |
| 57 | save-card | Save Summary | 마무리 | 저장 유도형 핵심 요약과 하단 액션 바 | 항목=요약\|설명 3~5개 · 메모=저장 문구 |
