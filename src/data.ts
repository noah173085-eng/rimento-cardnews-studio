import { CardProject } from './types'

const id = () => crypto.randomUUID()

export const sampleProject: CardProject = {
  title: '리멘토 카드뉴스',
  issueLabel: '리멘토 30호',
  brandName: 'Leaders Insight',
  handle: '@leadersinsightgroup',
  footerText: 'Leaders Insight',
  theme: 'purple',
  aspect: '4:5',
  logo: 'none',
  footerLogo: 'none',
  pages: [
    {
      id:id(), template:'cover-question', eyebrow:'HR INSIGHT',
      title:'Why?\n잘하던 방식이\n더 이상 통하지 않는 이유',
      body:'리더의 강점은 사라진 것이 아니라, 역할이 달라지며 영향이 달라질 수 있습니다.',
      items:['Leadership','Behavior','Context'], note:'The same strength, a different impact',
    },
    {
      id:id(), template:'opening-question', eyebrow:'OPENING',
      title:'우리는 종종 결과만 보고\n리더의 행동을 판단합니다',
      body:'“위임을 못한다”, “결정이 느리다”라는 평가 뒤에는 실제로 어떤 행동과 맥락이 있었을까요?',
      items:['왜 같은 강점이 다른 평가를 만들까?','역할이 바뀌면 어떤 행동을 조정해야 할까?','진단은 무엇을 보여줄 수 있을까?'], note:'핵심 질문 3가지',
    },
    {
      id:id(), template:'story', eyebrow:'CASE 01',
      title:'꼼꼼함이 강점이었던 A 팀장',
      body:'실무자 시절에는 보고서를 두 번, 세 번 검토했고 놓치는 일이 거의 없었습니다. 팀장이 된 뒤에도 그는 같은 방식으로 모든 결과물을 직접 확인했습니다.',
      items:['실무자 시절|높은 품질과 신뢰를 만든 행동','팀장 이후|세부 확인이 구성원의 자율성을 줄이는 행동으로 해석'], note:'강점은 같지만 역할이 달라졌습니다.',
    },
    {
      id:id(), template:'dialogue', eyebrow:'CASE 01 · FEEDBACK',
      title:'의도와 영향 사이에\n간극이 생겼습니다',
      body:'팀장과 구성원이 같은 장면을 전혀 다르게 경험하고 있었습니다.',
      items:['“팀장님은 너무 사소한 것까지 다 확인하세요.”','“저는 품질을 지키려고 한 건데요.”','“더블 체크했다고 말씀드려도 다시 보세요.”'], note:'좋은 의도만으로 좋은 영향이 보장되지는 않습니다.',
    },
    {
      id:id(), template:'score-profile', eyebrow:'QP RESULT',
      title:'A 팀장의 대표 성격 특성',
      body:'점수 자체보다, 어떤 상황에서 이 특성이 강점과 부담으로 작동하는지 해석하는 것이 중요합니다.',
      items:['꼼꼼함|9','신중함|8','권한위임|2'], note:'실무자 시절: 높은 품질 → 팀장 이후: 위임 부담',
    },
    {
      id:id(), template:'cards-3', eyebrow:'INSIGHT',
      title:'리더십 개발은\n세 가지를 함께 봅니다',
      body:'좋은 특성을 더 많이 가지는 것보다, 현재 역할에서 어떻게 발휘되는지를 이해하는 것이 핵심입니다.',
      items:['자기인식|나는 어떤 방식으로 일하는가','영향 파악|내 행동이 타인과 조직에 어떤 영향을 주는가','행동 조정|강점은 유지하고 발휘 방식을 바꾸는가'], note:'Strength × Role × Context',
    },
    {
      id:id(), template:'before-after', eyebrow:'BEHAVIOR SHIFT',
      title:'강점은 그대로 두고,\n발휘 방식을 바꿉니다',
      body:'꼼꼼함을 버리는 것이 아니라 역할에 맞는 행동으로 전환합니다.',
      items:['BEFORE|모든 세부사항을 직접 다시 확인한다','AFTER|기준을 먼저 명확히 하고 핵심 포인트만 점검한다'], note:'좋은 리더십은 강점의 양보다 발휘 방식에 가깝습니다.',
    },
    {
      id:id(), template:'process', eyebrow:'HOW TO',
      title:'진단에서 행동 변화까지\n4단계로 연결합니다',
      body:'인사이트가 행동으로 이어지도록 단계마다 산출물을 남깁니다.',
      items:['01 현재 이해|진단 결과와 실제 경험을 연결','02 의미화|강점과 리스크가 나타나는 조건 확인','03 행동 설계|역할에 맞는 대안 행동 구체화','04 실행·회고|현업 적용 후 피드백으로 보완'], note:'DIAGNOSE → INTERPRET → DESIGN → PRACTICE',
    },
    {
      id:id(), template:'checklist', eyebrow:'PRACTICE',
      title:'이번 주 바로 확인할\n리더십 행동 4가지',
      body:'한 번에 성격을 바꾸기보다 작은 행동을 바꾸는 편이 현실적입니다.',
      items:['업무를 맡길 때 결과 기준을 먼저 합의했는가?','피드백에서 사람과 행동을 구분했는가?','팀원이 스스로 판단할 여지를 남겼는가?','결정 후 결과와 과정을 함께 회고했는가?'], note:'SAVE & TRY',
    },
    {
      id:id(), template:'testimonial', eyebrow:'VOICE',
      title:'참여자는 이렇게\n변화를 설명했습니다',
      body:'좋은 교육은 “알았다”보다 “다르게 해보겠다”는 문장을 남깁니다.',
      items:['“내 강점을 버릴 필요가 아니라, 상황에 맞게 쓰는 법이 필요하다는 걸 알았습니다.”|팀장 과정 참여자','“피드백을 점수가 아니라 행동의 단서로 보기 시작했습니다.”|리더십 워크숍 참여자'], note:'Voice of Participant',
    },
    {
      id:id(), template:'cta', eyebrow:'CONTACT',
      title:'리더의 변화가\n조직의 변화를 만듭니다',
      body:'진단·교육·코칭을 조직의 실제 행동 변화와 연결합니다.',
      items:['02-734-8200','open1@leadersinsight.co.kr','leadersinsight.co.kr'], note:'리멘토 구독하기',
    },
  ],
}
