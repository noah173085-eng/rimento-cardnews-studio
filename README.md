# 리멘토 카드뉴스 스튜디오 V2

리멘토 24~29호의 반복되는 시각 문법을 하나의 디자인 시스템으로 정리한 **HR 매거진형 카드뉴스 제작 도구**입니다. V2에서는 리멘토 28호의 강한 헤드라인, 크림/퍼플/오렌지 조합, 유기적 도형, 사례·대화·진단 결과 표현 방식을 중심으로 시각 완성도를 높였고, 총 30개의 카드뉴스 템플릿을 탑재했습니다.

## V2 핵심 기능
- 1080×1350 카드뉴스 기본 지원, 1080×1080 지원
- **30개 템플릿 라이브러리** 및 카테고리 필터/검색
- 현재 페이지의 내용은 유지한 채 템플릿만 즉시 변경
- 원고 붙여넣기 → 페이지 자동 분할 → 내용 유형 기반 자동 디자인
- 5개 브랜드 테마: Rimento Purple / Insight Teal / Binder Blue / Browser Blue / Mono Sticky
- 긴 제목/본문에 대한 자동 글자 크기 보정
- 페이지별 이미지 업로드, cover/contain 전환
- 페이지별 포인트 컬러 변경
- 페이지 복제/삭제/순서 변경
- 현재 페이지 PNG 저장
- 전체 페이지 PNG → ZIP 일괄 저장
- JSON 프로젝트 저장/불러오기
- localStorage 자동 저장

## 30개 템플릿
### 표지
1. Hero Cover
2. Why? Cover
3. Browser Cover
4. Binder Cover

### 스토리
5. Editorial Lead
6. Opening Question
7. 3 Key Questions
8. Case Story
9. Dialogue
10. Quote Focus

### 정보
11. Numbered List
12. 3 Pillars
13. 4 Blocks
14. Checklist
15. Insight Box
16. Program Info

### 데이터
17. Metric Grid
18. Big Number
19. Score Profile
20. Bar Profile

### 프로세스
21. Vertical Process
22. Timeline
23. Step Cards

### 비교
24. Split Compare
25. Before → After
26. 2×2 Matrix
27. Framework Wheel

### 마무리
28. Testimonial
29. CTA / Contact
30. Closing Manifesto

## 실행
```bash
npm install
npm run dev
```

## Netlify 배포
1. 현재 Netlify 사이트와 연결된 Git 저장소에 이 폴더의 소스를 반영합니다.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. `netlify.toml` 포함

## 입력 규칙
항목은 한 줄에 하나씩 입력합니다. `라벨|설명` 형식을 사용하면 템플릿이 두 위계로 나누어 보여줍니다.

```text
꼼꼼함|9
신중함|8
권한위임|2
```

프로세스형 예시:
```text
현재 이해|진단 결과와 실제 경험 연결
의미화|강점과 리스크가 나타나는 조건 확인
행동 설계|현업 대안 행동 구체화
실행·회고|현업 적용 후 피드백
```

## 참고
V2 소스는 사용자 제공 리멘토 샘플에서 **브랜드의 반복 원리**를 추출해 재구성한 것이며, 특정 페이지를 픽셀 단위로 복제하는 구조는 아닙니다. 페이지 내용이 바뀌어도 반복 활용할 수 있도록 템플릿/테마/콘텐츠를 분리했습니다.
