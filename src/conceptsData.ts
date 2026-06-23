import { KeyConcept } from "./types";

export const KEY_CONCEPTS_LIST: KeyConcept[] = [
  {
    id: "ddc",
    name: "DDC (듀이십진분류법)",
    category: "분류학",
    keywords: ["DDC", "Dewey", "듀이", "십진분류"],
    description: "전세계적으로 가장 널리 사용되는 현대적 십진분류법입니다. 조기성과 분석 합성식 특징 및 체계적인 아라비아 숫자 기호법을 제공합니다.",
    corePoints: [
      "본표(Schedule)와 상관색인(Relative Index)의 유기적인 연계 구조 이해",
      "공통보조표(Table 1 ~ Table 6)의 분류 기호 합성 메커니즘 분석",
      "소수점 이하 기호법의 전개 원리와 조분(Mnemonic) 성질 파악",
      "DDC 23판 등 최신 개정판에서의 주요 변경 유목 식별"
    ]
  },
  {
    id: "kdc",
    name: "KDC (한국십진분류법)",
    category: "분류학",
    keywords: ["KDC", "한국십진", "조선십진"],
    description: "DDC의 기본 이념과 기술적 체계를 수용하여, 한국의 학문 현실과 문헌 출판 상황에 맞추어 독자적으로 편찬된 대한민국 대표 표준 분류표입니다.",
    corePoints: [
      "한국 관련 학문 영역(역사, 어학, 문학, 종교 등)의 독자적 유목 배치 방식 및 분류적 특징",
      "본표 기호와 표준구분표, 지역구분표, 국어구분표, 문학구분표 등 6종 보조표의 기호 합성 공식",
      "KDC 6판의 특징 및 어학/문학 등 주요 개정 사항 분석",
      "한국 도서관 실무에서의 다국어 문헌 및 동서양 고서 분류 규정 이해"
    ]
  },
  {
    id: "kormarc",
    name: "KORMARC & MARC 형식",
    category: "목록학 / 도서관전산화",
    keywords: ["MARC", "KORMARC", "가독목록", "필드", "지시기호", "식별기호"],
    description: "컴퓨터가 서지 데이터를 식별, 판독하고 도서관 간에 상호 교환할 수 있도록 규격화된 기계가독형 목록 형식의 국가 표준입니다.",
    corePoints: [
      "리더(Leader), 디렉토리(Directory) 및 제어필드(001, 005, 007, 008 등)의 고정 길이 데이터 구조",
      "가변길이 데이터 필드들의 지시기호(Indicator)와 식별기호(Subfield Code, $)의 문맥적 쓰임",
      "대표적인 가변필드 맵핑(1XX 기본표목, 245 본표제/책임표시, 260/264 발행사항, 300 형태기술, 490 총서명, 6XX 주제명표목, 7XX 부출표목)",
      "전집, 다권본 및 분석 저록 등의 고도화된 KORMARC 서지 기술 양식 적용"
    ]
  },
  {
    id: "kcr",
    name: "KCR (한국목록규칙)",
    category: "목록학",
    keywords: ["KCR", "목록규칙", "한국목록"],
    description: "우리나라 서지 환경에 적용하기 위한 목록 작성 지침입니다. 국제 표준서지기술법(ISBD)의 원칙을 적극 수용하여 데이터 기술의 표준화를 이룹니다.",
    corePoints: [
      "ISBD의 기술 영역 구성을 반영한 KCR 4판의 8대 기술 영역 체계와 구두점 규칙",
      "본표제, 대등표제, 아표제 및 책임표시 기술 시 소스(정보원) 선정 우선순위",
      "양서 및 동양서 목록 작성 시 자격 조건에 따른 기술 수위 조절",
      "기본 저록 및 부출 저록 요소 선정과 전거 통제(Authority Control) 적용 원칙"
    ]
  },
  {
    id: "frbr_rda",
    name: "FRBR & RDA 개념 모델",
    category: "목록학",
    keywords: ["FRBR", "RDA", "기능요건", "저작", "표현물", "체현물", "개체"],
    description: "이용자의 검색 요구에 맞추어 서지 우주를 개체-관계(E-R) 모델로 재구조화한 FRBR 모델과, 이를 실무에 투영한 차세대 국제 서지 기술 표준인 RDA입니다.",
    corePoints: [
      "FRBR 제1집단 개체의 계층적 개념: 저작(Work - 지적 창작물), 표현물(Expression - 영적/기호적 실현), 체현물(Manifestation - 물리적 캐리어), 개체(Item - 단일 사본)",
      "FRBR 제2집단(개인, 단체) 및 제3집단(개념, 장소, 대상)과의 관계 맵핑",
      "이용자의 4대 서지 탐색 과업: 찾기(Find), 식별하기(Identify), 선택하기(Select), 획득하기(Obtain)",
      "RDA의 관계형 데이터 모델링 및 링크드 데이터(Linked Data)로의 발전 원리"
    ]
  },
  {
    id: "dublincore",
    name: "더블린 코어 (Dublin Core)",
    category: "도서관전산화 / 메타데이터",
    keywords: ["Dublin Core", "더블린", "더블린코어", "메타데이터", "DC", "MODS"],
    description: "웹상의 다양한 디지털 자원을 쉽고 빠르게 기술하여 상호운용성을 극대화하기 위해 설계된 15개 핵심 요소 중심의 단순 메타데이터 형식입니다.",
    corePoints: [
      "15개 기본 엘리먼트 세트(Title, Creator, Subject, Description, Publisher, Contributor, Date, Type, Format, Identifier, Source, Language, Relation, Coverage, Rights)의 명칭 및 기술 의미",
      "더블린 코어의 4대 핵심 원칙: 단순성(Simplicity), 의미적 확장성(Semantic Extensibility), 국제성(Internationality), 선택성/반복성",
      "한정 더블린 코어(Qualified DC)에서의 요소 세분화(Element Refinement)와 인코딩 스키마(Encoding Scheme)의 도입",
      "XML 및 RDF 기반 메타데이터 작성과 타 포맷(MARC, MODS 등)과의 상호 전환(Crosswalk)"
    ]
  },
  {
    id: "servqual",
    name: "SERVQUAL (서비스 품질 평가)",
    category: "정보봉사론",
    keywords: ["SERVQUAL", "서브퀄", "서비스품질", "품질측정", "LibQUAL", "리브퀄"],
    description: "고객이 인지하는 서비스 품질을 기대(Expectation)와 성과(Performance) 간의 차이(Gap)를 기준으로 평가하는 도구로, 도서관 마케팅과 평가의 기반이 됩니다.",
    corePoints: [
      "SERVQUAL 5대 평가 차원의 정의: 유형성(Tangibles), 신뢰성(Reliability), 반응성(Responsiveness), 확신성(Assurance), 공감성(Empathy)",
      "이용자 기대-성과 갭 모델(P - E 계산 방식)과 서비스 한계선(Zone of Tolerance) 분석",
      "도서관 맞춤형 품질 평가 모델인 LibQUAL+의 3대 차원(서비스 영향력, 정보 제어력, 라이브러리 플레이스) 발전 양상",
      "정량적 조사 결과에 기반한 학교도서관 이용 만족도 제고 및 마케팅 전략 수립"
    ]
  },
  {
    id: "seeking_models",
    name: "정보추구 및 탐색행동 모델",
    category: "정보봉사론",
    keywords: ["Kuhlthau", "쿨타우", "Ellis", "엘리스", "탐색행동", "정보추구", "정보탐색", "Taylor", "테일러"],
    description: "사용자가 자신의 정보 요구를 충족해 나가는 인지적, 심리적 흐름과 실제 행동 특성을 학술적 단계로 규명한 주요 모델군입니다.",
    corePoints: [
      "Kuhlthau의 정보탐색과정(ISP) 6단계: 시작(Initiation) - 선택(Selection) - 탐색(Exploration) - 포뮬레이션(Formulation) - 수집(Collection) - 제시(Presentation)의 감정적/인지적 변화",
      "Taylor의 정보 요구 4단계 발전과정: 의식 전 요구(Q1) - 의식적 요구(Q2) - 정형화된 요구(Q3) - 타협된 요구(Q4)의 이해",
      "Ellis의 정보 추구 행동 특징 8가지 범주(출발, 연계, 훑어보기, 차별화, 모니터링, 추출, 검증, 종결)",
      "다양한 정보추구 행동 모델이 사서교사의 정보 길잡이(Pathfinder) 개발 및 참고면담 전략에 미치는 영향"
    ]
  },
  {
    id: "retrieval_eval",
    name: "정보검색 효율성 (재현율과 정밀도)",
    category: "정보봉사론 / 도서관전산화",
    keywords: ["정밀도", "재현율", "Precision", "Recall", "색인", "불리언", "F-measure"],
    description: "정보검색 시스템의 탐색 정확도와 누설율을 정량화하여 분석하는 필수 평가지표로, 두 지표 사이에는 트레이드오프(역관계)가 성립합니다.",
    corePoints: [
      "재현율(Recall = 검색된 적합문헌 / 전체 적합문헌)과 정밀도(Precision = 검색된 적합문헌 / 전체 검색문헌)의 연산식 및 오차 분석",
      "두 지표의 상충 관계 원인과 이를 조화 평균한 F-measure(F-Score) 산출식",
      "질의어 확장(Query Expansion), 절단 탐색(Truncation), 불리언 연산자(AND, OR, NOT) 조정을 통한 재현율/정밀도 향상 기법",
      "적합성 피드백(Relevance Feedback)과 시스템 성능의 다이나믹 평가 지표 이해"
    ]
  },
  {
    id: "bibliotherapy",
    name: "독서요법 (Bibliotherapy)",
    category: "독서지도론",
    keywords: ["독서요법", "독서상담", "치료", "요법", "독서치료"],
    description: "학생들의 정서 발달과 당면한 정서적, 행동적 부적응 문제를 도울 목적으로, 엄선된 독서 자료를 활용하여 사서교사와 학생 간에 역동적 상호작용을 일으키는 전문 지도 기법입니다.",
    corePoints: [
      "독서요법의 3단계 심리 역동 작용: 동일시(Identification - 등장인물과 자신을 일치), 카타르시스(Catharsis - 감정 정화), 통찰(Insight - 자신의 문제 객관화 및 해법 발견)",
      "독서요법 진행 절차: 준비 - 자료 선정 - 자료 제시 - 이해 심화 - 추후 활동 및 평가",
      "상담 기법과 독서 지도의 융합 및 발달적 독서요법과 임상적 독서요법의 차이",
      "상담 문제 유형(교우관계, 학업 스트레스, 자아존중감 등)에 부합하는 서지 테라피 리스트 구성법"
    ]
  },
  {
    id: "booktalk_strategies",
    name: "북토크 및 독서활동 전략",
    category: "독서지도론",
    keywords: ["북토크", "book talk", "독서지도", "스토리텔링", "독서회", "독서캠프"],
    description: "독서 동기를 강하게 자극하기 위한 일종의 도서 광고 및 활성화 마케팅 기법입니다. 책의 줄거리를 모두 알려주지 않고 절정 부분에서 멈춰 학생들의 호기심을 유도합니다.",
    corePoints: [
      "성공적인 북토크를 위한 3대 구성 요소: Hook(오프닝 주의 환기), Book(도서의 매력적인 핵심 소개), Look(참고 가이드 및 유인책 제공)",
      "학생의 독서 수준(독서 흥미, 독서 레디네스 등) 분석에 따른 도서 매칭 및 난이도 조절 기법",
      "독서토론 및 독서 감상문 지도를 위한 단계적 질문 작성법(사실적 질문, 해석적 질문, 평가적 질문)",
      "스토리텔링과 북토크를 연계한 학기 초 도서관 이용 지도 및 교과 연계 독서활동 연간 계획 수립"
    ]
  },
  {
    id: "collection_mgmt",
    name: "장서 개발 및 제적·폐기 정책",
    category: "학교도서관운영",
    keywords: ["장서개발", "제적", "폐기", "장서평가", "수집", "선택", "도서선정", "장서점검"],
    description: "학교 교육과정 지원이라는 특수한 사명에 부합하여 도서관 장서의 신선도와 적합성을 최상으로 유지하기 위해 수립하는 장서 수명 주기 정책입니다.",
    corePoints: [
      "장서개발 정책서의 필수 구성 요소와 학교도서관운영위원회의 심의 절차",
      "제적 및 폐기(Weeding)의 타당성 기준(물리적 훼손, 정보의 시효 만료, 교육과정 부적합성, 가치 상실 등)",
      "도서관법 및 국가 표준 가이드라인에 규정된 연간 자료 폐기 한도 비율(일반적으로 연간 수서량의 7% 이내 등 법적 조항)",
      "장서점검(Inventory)의 세부 프로세스 및 DLS/바코드 연계 자동 점검 기법"
    ]
  }
];
