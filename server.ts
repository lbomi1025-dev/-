import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON body limits for base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve API Routes before Vite Middleware
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Classification structure prompt to supply to Gemini
const CLASSIFICATION_PROMPT = `당신은 대한민국 중등 사서교사 임용시험의 출제 기준 및 평가 영역 총괄표에 통달한 최고의 전문가이자 채점/분류관입니다.
전달받은 이미지는 사서교사 임용시험 전공 기출문제의 한 페이지 혹은 일부 단면입니다.
이미지를 정밀하게 판독하여, 출제된 내용 요소를 개별 문제 단위로 쪼개어 가장 잘 부합하는 [과목 - 평가 영역 - 평가 내용 요소 - 문제 유형]을 정립해 분류해 주세요.

[실제 기출 형식과 분류 기준 정보]
1. 시험 구분: 전공A 및 전공B로 분할 출제됩니다.
2. 문항 번호와 배점: 각 문항은 고유 번호(예: 1번~11번)와 배점(2점 혹은 4점)이 부여되어 있습니다.
3. 다과목 복합(융합) 문항 패턴과 문제 유형 분류: 하나의 지문이나 문제 하부에서도 여러 과목이 융합되거나, 질문 유형이 다를 수 있습니다. 각 세부 하부 문제 요소를 '객관식', '단답형', '서술형', '풀이 실습'의 문제 유형 중 하나로 정확히 일치시켜 분류해야 합니다.
   - '객관식': 보기나 사지/오지택일형 선택지가 제공되어 정답을 고르는 문제
   - '단답형': 괄호 넣기, 간단한 핵심 명칭/용어를 채우는 형태의 수치 혹은 어휘 단답문제
   - '서술형': 어떠한 이점, 특징 및 이유를 긴 글로 조리있게 서술하거나 논술할 것을 요구하는 문제
   - '풀이 실습': 직접적인 부출 분개, 도서분류기호 조합(조기율 적용 등), KORMARC 디렉토리 태그 작성, 웹 배제 규약 마크업 등 실전적인 조작과 원리 풀이를 적용하는 실습 형태의 문제

[과목별 평가 영역 및 내용 요소 안내]
반드시 아래의 분류 기준에 있는 문구와 완벽히(글자 하나 틀리지 않게) 일치시켜 분류하세요:

1) 과목: "분류학"
   - 평가 영역: "분류이론 및 역사"
     * 내용 요소: "분류의 개념과 원리", "분류의 종류와 필요성", "분류표의 요건과 종류", "분류 작업과 분류 규정", "동서양의 자료 분류사"
   - 평가 영역: "주요 분류법"
     * 내용 요소: "KDC, DDC, LCC, UDC, CC 등의 발전, 기호법, 구성, 특징 및 평가"
   - 평가 영역: "청구기호"
     * 내용 요소: "청구기호의 개념, 기능, 구성 및 적용"
   - 평가 영역: "분류의 실제"
     * 내용 요소: "KDC, DDC의 본표 및 보조표의 적용"

2) 과목: "목록학"
   - 평가 영역: "목록학 일반"
     * 내용 요소: "목록의 특성, 종류, 역사", "목록규칙의 발달 및 동향", "서지제어 (bibliographic control) 활동"
   - 평가 영역: "기술목록과 표목, 주제명 목록"
     * 내용 요소: "서지기술과 저록의 특성", "KCR, ISBD, AACR의 특성", "표목의 기능 및 형식, 선정 등", "주제명목록의 구조 및 주제명표목표의 이해"
   - 평가 영역: "한국목록규칙"
     * 내용 요소: "한국목록규칙의 이해 및 적용"
   - 평가 영역: "목록의 실제"
     * 내용 요소: "KCR과 KORMARC 형식의 이해 및 적용"

3) 과목: "도서관전산화"
   - 평가 영역: "디지털도서관 구축"
     * 내용 요소: "도서관전산화시스템의 역사", "도서관전산화시스템의 기능(수서, 목록, 대출, 연간물 관리 시스템, 상호대차 등)", "도서관전산화시스템의 분석 및 설계", "디지털도서관의 개념과 구성(운영 기술, C/S, DBMS 등)"
   - 평가 영역: "디지털 장서관리"
     * 내용 요소: "디지털 장서의 의의", "구축 원리와 개발 정책", "디지털 장서 개발(선정, 수집, 보존 및 아카이빙 등)", "디지털 자료의 종류와 특징(텍스트, 이미지, 사운드, 동영상, 멀티미디어 등)", "디지털도서관과 저작권(관련기법 및 DRM 등)"
   - 평가 영역: "디지털 장서조직 (메타데이터)"
     * 내용 요소: "메타데이터의 개념과 의의", "메타데이터의 유형과 특징", "더블린 코어와 MODS의 이해와 적용", "메타데이터의 구문과 작성(HTML, SGML, XML, RDF 등)"
   - 평가 영역: "디지털도서관 네트워크 기술"
     * 내용 요소: "인터넷과 정보통신 일반", "디지털 객체 기술(OAI, DOI 등)", "디지털도서관과 기본 프로토콜(OSI, TCP/IP, Z39.50 등)", "라이브러리 2.0 관련 기술(시맨틱 웹, RSS 등)"

4) 과목: "정보검색"
   - 평가 영역: "정보검색과 시스템 일반"
     * 내용 요소: "정보검색의 개념", "정보검색의 발전", "정보검색의 내용", "정보검색의 구분", "정보검색시스템의 유형", "온라인검색시스템의 종류와 특징", "인터넷 정보검색시스템(검색엔진의 원리, 종류, 특성, 발달과정)"
   - 평가 영역: "주제분석 및 색인"
     * 내용 요소: "주제분석", "색인의 기능과 역할", "색인의 종류와 특징(주제 및 비주제, 자연어·통제어, 전조합·후조합, 인용색인)", "색인언어", "시소러스", "자동색인(언어적 기법, 통계적 기법, 문헌구조적 기법)", "초록", "자동분류(범주화, 군집화)"
   - 평가 영역: "정보의 축적"
     * 내용 요소: "정보 소장장치의 종류와 특징(자기테이프, 자기디스크, 광디스크 등)", "레코드의 구조와 형식(고정길이, 가변길이 등)", "데이터베이스의 종류"
   - 평가 영역: "정보검색의 실제"
     * 내용 요소: "정보검색의 제단계", "정보탐색 면담", "정보탐색 방법 및 데이터베이스 of 선정", "정보탐색 전략 수립 및 수정 과정", "정보검색 기법(불리언 검색, 가중치검색, 인접연산검색, 용어절단검색, 제한검색 등)", "재탐색", "브라우징 탐색"
   - 평가 영역: "정보검색시스템 평가"
     * 내용 요소: "정보검색시스템 평가의 기준", "적합성", "검색효율척도", "검색효율성 측정(재현율, 정확률, 누락률, 잡음률)"

5) 과목: "정보봉사론"
   - 평가 영역: "정보봉사 일반"
     * 내용 요소: "정보봉사의 개념", "정보봉사의 필요성", "정보봉사의 기능 및 유형", "정보봉사의 이론과 발전", "참고사서"
   - 평가 영역: "정보봉사의 평가"
     * 내용 요소: "정보봉사의 평가기준", "정보봉사 평가의 유형과 방법"
   - 평가 영역: "정보봉사 과정"
     * 내용 요소: "정보요구의 형성", "참고질문", "참고면담", "이용자의 정보요구와 이용행태", "탐색결과 제공", "적합성 및 관련성 평가"
   - 평가 영역: "참고정보원"
     * 내용 요소: "참고정보원의 정의", "일차자료와 이차자료", "주요 참고자료", "주제별 서지", "온라인 정보원", "네트워크와 인터넷", "정보서비스 기관", "참고정보원의 평가"
   - 평가 영역: "이용자 교육"
     * 내용 요소: "이용자 교육의 의의", "이용자 교육의 유형", "이용자 교육의 방법", "이용자 교육 프로그램 운영", "이용자 교육 평가"
   - 평가 영역: "디지털 정보봉사"
     * 내용 요소: "상호대차와 원문서비스", "도서관네트워크(OCLC, KOLIS-NET 등)", "디지털 참고봉사(digital reference service)의 개념", "디지털 참고봉사의 유형 및 특징"

6) 과목: "학교도서관운영"
   - 평가 영역: "학교도서관 일반"
     * 내용 요소: "학교도서관의 사명 및 목적", "학교도서관의 역할과 기능", "학교도서관 관련 법규, 제도, 기구 등", "학교도서관과 교육", "학교도서관 경영계획", "학교도서관 시설관리(DLS 포함)", "학교도서관 예산관리", "정보윤리와 저작권"
   - 평가 영역: "학교도서관장서 관리"
     * 내용 요소: "장서개발정책", "자료선택, 수집", "장서평가", "장서보존", "장서점검", "제적 및 폐기 등"
   - 평가 영역: "학교도서관 인적자원 및 조직관리"
     * 내용 요소: "인적자원의 원리", "인적자원 기준", "조직의 원리", "조직구조의 유형", "학교도서관 조직관리", "리더십과 커뮤니케이션"
   - 평가 영역: "학교도서관의 봉사"
     * 내용 요소: "학교도서관 서비스의 원리", "자료제공서비스(열람, 대출반납)", "학교도서관 정보서비스(원리, 기능, 과정, 도구작성, 디지털정보서비스)", "학교도서관과 지역사회 협력(도서관 협력, 지역사회 협력)", "홍보와 마케팅 of 원리", "학교도서관 마케팅 전략", "학교도서관 마케팅 도구"
   - 평가 영역: "학교도서관의 교육"
     * 내용 요소: "학교도서관 교육서비스의 원리", "독서교육", "도서관이용지도", "정보활용교육", "도서관활용수업", "도서관협력수업", "교수-학습의 원리"
   - 평가 영역: "학교도서관 경영통제 및 평가"
     * 내용 요소: "경영통제의 원리", "학교도서관 평가의 원리", "학교도서관 평가 방법", "학교도서관 평가 기준"

7) 과목: "정보매체론"
   - 평가 영역: "정보매체와 교수매체 일반"
     * 내용 요소: "정보매체와 교수매체의 특성", "커뮤니케이션과 교수매체", "교수매체의 교육적 효과"
   - 평가 영역: "교수매체와 학교도서관"
     * 내용 요소: "교수매체센터로서의 학교도서관", "교수매체센터로서의 학교도서관 시설"
   - 평가 영역: "교수매체의 종류와 특성"
     * 내용 요소: "교수매체 구분", "매체별 특성과 교육적 효과(인쇄자료, 녹음자료, 화상자료, 영상자료, 전자자료)"
   - 평가 영역: "교수매체와 교수설계"
     * 내용 요소: "교수매체 수업모형", "교수전략", "교수설계"
   - 평가 영역: "교수매체 활용 교육"
     * 내용 요소: "교수매체 활용교육의 의의", "교수매체 활용 교육의 과정", "자원기반학습의 원리와 방법(도서관활용수업과 도서관협력수업)"

8) 과목: "독서지도론"
   - 평가 영역: "독서의 본질과 독서심리"
     * 내용 요소: "독서의 개념", "독서의 유형", "독서의 심리적 기초(독서레디네스, 독서능력, 독서흥미, 독서위생 등)"
   - 평가 영역: "독서자료와 학습독서"
     * 내용 요소: "독서자료 선택", "독서자료 안내(storytelling, book talk, 필독도서 등)", "독해전략", "학습과제 해결과 독서자료"
   - 평가 영역: "독서지도"
     * 내용 요소: "독서지도관", "독서지도자", "독서지도계획", "독서지도 방법"
   - 평가 영역: "독서상담과 독서요법"
     * 내용 요소: "독서상담", "독서문제아", "독서요법"
   - 평가 영역: "독서표현, 독서활동 및 평가"
     * 내용 요소: "독서기록", "독서감상의 표현", "독서토론", "독서행사", "독서회", "독서학교와 독서캠프", "독서조사", "독서평가"
`;

app.post("/api/classify", async (req, res) => {
  const { imageBase64, yearContext, examTypeContext, defaultQuestionNum } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "이미지 데이터(imageBase64)가 전송되지 않았습니다." });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey || geminiApiKey === "MY_GEMINI_API_KEY") {
    // API Key is not configured yet - return clean fallback mock data with instructions
    console.warn("GEMINI_API_KEY is not defined. Returning smart mock classifications.");
    return res.json({
      fallback: true,
      message: "Gemini API 키가 아직 설정되지 않아 분석 시뮬레이션 데이터를 반환합니다. Secrets 패널에서 API 키를 설정하면 실시간 Vision 분석을 체험해볼 수 있습니다.",
      subItems: [
        {
          id: "mock-" + Date.now() + "-1",
          year: yearContext ? Number(yearContext) : 2024,
          examType: examTypeContext || "전공 A",
          questionNum: defaultQuestionNum ? Number(defaultQuestionNum) : 8,
          score: 4,
          questionType: "풀이 실습",
          subject: "분류학",
          evaluationArea: "주요 분류법",
          evaluationElement: "KDC, DDC, LCC, UDC, CC 등의 발전, 기호법, 구성, 특징 및 평가",
          passageContext: "[판독 완료] KDC 6판의 지리 구분 및 유적 관련 분류표를 인용한 지문입니다.\n[작성방법] KDC 6판에서 가야 역사서의 지역 지수 결합 원리를 기재할 것."
        },
        {
          id: "mock-" + Date.now() + "-2",
          year: yearContext ? Number(yearContext) : 2024,
          examType: examTypeContext || "전공 A",
          questionNum: defaultQuestionNum ? Number(defaultQuestionNum) : 8,
          score: 4,
          questionType: "서술형",
          subject: "목록학",
          evaluationArea: "한국목록규칙",
          evaluationElement: "한국목록규칙의 이해 및 적용",
          passageContext: "[판독 완료] 한국목록규칙(KCR 4판) 기본 표목 설정 기준에 대한 내용입니다.\n[작성방법] 저자 3인 공저 시 서지 데이터 제1 표명 기술 방식을 쓰시오."
        }
      ]
    });
  }

  try {
    // Initialize the GoogleGenAI SDK server-side
    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    // Strip the data URL prefix if present
    const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: "image/png",
        data: base64Clean,
      },
    };

    const textPart = {
      text: `${CLASSIFICATION_PROMPT}
      
      사용자 참고 콘텍스트 (추론 시 참고하되 실제 이미지 내용과 다르면 이미지 텍스트 내용을 최우선하십시오):
      - 추정 연도: ${yearContext || "지정되지 않음 (이미지에서 직접 파악)"}
      - 추정 시험 구분: ${examTypeContext || "지정되지 않음 (전공 A 혹은 전공 B)"}
      - 기본 문항 번호: ${defaultQuestionNum || "지정되지 않음"}

      반드시 명시된 JSON 스키마를 만족하며, 과목과 평가 영역 및 내용 요소를 임의로 지어내지 말고 알려드린 가이드라인 항목 그대로 완벽하게 맵핑하여 분류하십시오.`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subItems: {
              type: Type.ARRAY,
              description: "이미지에서 추출 및 분류한 하위 작성방법 단위 문제 목록",
              items: {
                type: Type.OBJECT,
                properties: {
                  year: { type: Type.INTEGER, description: "기출문제 연도 (예: 2024)" },
                  examType: { type: Type.STRING, description: "시험 구분: '전공 A' 또는 '전공 B'" },
                  questionNum: { type: Type.INTEGER, description: "문항의 번호 (예: 9)" },
                  score: { type: Type.INTEGER, description: "해당 전공 문항의 전체 배점 (예: 4)" },
                  questionType: { type: Type.STRING, description: "문제 유형: 정확하게 '객관식', '단답형', '서술형', '풀이 실습' 중 하나 선택" },
                  subject: { 
                    type: Type.STRING, 
                    description: "다음 중 정확히 일치하는 과목 선택: '분류학', '목록학', '도서관전산화', '정보검색', '정보봉사론', '학교도서관운영', '정보매체론', '독서지도론'" 
                  },
                  evaluationArea: { 
                    type: Type.STRING, 
                    description: "가이드라인에서 정한 정확한 평가 영역 명칭" 
                  },
                  evaluationElement: { 
                    type: Type.STRING, 
                    description: "가이드라인에서 정한 정확한 평가 내용 요소 문자열" 
                  },
                  passageContext: { 
                    type: Type.STRING, 
                    description: "이미지에서 추출한 실제 지문 텍스트 조각 및 문제 정답 유추 단서 내용 요약" 
                  }
                },
                required: ["year", "examType", "questionNum", "score", "questionType", "subject", "evaluationArea", "evaluationElement", "passageContext"]
              }
            }
          },
          required: ["subItems"]
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Gemini API에서 텍스트 수신 실패");
    }

    const resultData = JSON.parse(outputText.trim());
    res.json(resultData);

  } catch (err: any) {
    console.error("AI Classification Error: ", err);
    res.status(500).json({ error: "기출문제를 분석하여 분류하는 도중 에러가 발생했습니다.", details: err.message });
  }
});

// Configure Vite and static assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
