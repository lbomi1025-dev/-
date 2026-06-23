import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Upload, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  FileUp, 
  Download, 
  Plus, 
  Search, 
  Filter, 
  Info, 
  RefreshCw, 
  BarChart3, 
  HelpCircle,
  Play,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ChevronRight,
  BookOpen,
  Lightbulb
} from "lucide-react";
import { ExamQuestionSubItem, AttachedFile, KeyConcept } from "./types";
import { SUBJECT_STANDARDS, MOCK_QUESTIONS } from "./data";
import { KEY_CONCEPTS_LIST } from "./conceptsData";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [subItems, setSubItems] = useState<ExamQuestionSubItem[]>(() => {
    try {
      const saved = localStorage.getItem("librarian_sub_items");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Self-heal/migrate any legacy stored items that might be missing the questionType field
          return parsed.map((item: any) => {
            if (!item.questionType) {
              item.questionType = item.subItemSymbol ? "서술형" : "서술형";
            }
            return item;
          }) as ExamQuestionSubItem[];
        }
      }
    } catch (e) {
      console.error("Local storage sub-items parsing failed:", e);
    }
    return MOCK_QUESTIONS;
  });

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(() => {
    try {
      const saved = localStorage.getItem("librarian_attached_files");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed as AttachedFile[];
        }
      }
    } catch (e) {
      console.error("Local storage attached files parsing failed:", e);
    }
    return [
      {
        id: "sample-pdf",
        name: "[예시] 2024학년도_사서교사_임용기출.pdf",
        size: 1424050,
        uploadedAt: "2026-06-23",
        pageCount: 4,
        status: "done"
      }
    ];
  });

  // Recent AI Analysis Logs history state
  const [analysisLogs, setAnalysisLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("librarian_analysis_logs");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Local storage analysis logs parsing failed:", e);
    }
    return [
      {
        id: "log-1",
        timestamp: "2026-06-23 08:30:15",
        fileName: "[예시] 2024학년도_사서교사_임용기출.pdf",
        pageRange: "1 페이지",
        status: "success",
        itemCount: 2
      }
    ];
  });

  // State for rendering pages of a selected file
  const [selectedFileId, setSelectedFileId] = useState<string | null>("sample-pdf");
  const [pdfPages, setPdfPages] = useState<{ pageNumber: number; dataUrl: string }[]>([]);
  const [renderingPages, setRenderingPages] = useState(false);
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);

  // States for drop zones & drags
  const [dragOverUpload, setDragOverUpload] = useState(false);
  const [dragOverTrash, setDragOverTrash] = useState(false);
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterExamType, setFilterExamType] = useState("");

  // Grid Sort state
  const [sortField, setSortField] = useState<keyof ExamQuestionSubItem>("year");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Inline Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ExamQuestionSubItem>>({});

  // Manual Creation Modal/Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFormExamType, setNewFormExamType] = useState<'전공 A' | '전공 B'>('전공 A');
  const [newFormItem, setNewFormItem] = useState<{
    year: number;
    questionNum: number;
    score: number;
    questionType: '객관식' | '단답형' | '서술형' | '풀이 실습';
    subject: string;
    evaluationArea: string;
    evaluationElement: string;
    passageContext: string;
  }>({
    year: 2024,
    questionNum: 1,
    score: 4,
    questionType: "서술형",
    subject: "분류학",
    evaluationArea: "분류이론 및 역사",
    evaluationElement: "분류의 개념과 원리",
    passageContext: ""
  });

  // Analysis contextual overrides for uploading/extracting
  const [analysisYearContext, setAnalysisYearContext] = useState<number>(2024);
  const [analysisTypeContext, setAnalysisTypeContext] = useState<'전공 A' | '전공 B'>('전공 A');
  const [analysisStartNum, setAnalysisStartNum] = useState<number>(1);
  const [analyzingPageNum, setAnalyzingPageNum] = useState<number | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Tabs for interactive standard guideline viewer or raw statistics selector
  const [activeTab, setActiveTab] = useState<'results' | 'statistics' | 'curriculum' | 'concepts'>('results');
  const [statsViewMode, setStatsViewMode] = useState<'subject' | 'area' | 'element'>('subject');
  const [selectedConceptId, setSelectedConceptId] = useState<string>("ddc");

  // Sidebar expand states
  const [showGuideInfo, setShowGuideInfo] = useState(true);

  // Persist state in localStorage
  useEffect(() => {
    localStorage.setItem("librarian_sub_items", JSON.stringify(subItems));
  }, [subItems]);

  useEffect(() => {
    localStorage.setItem("librarian_attached_files", JSON.stringify(attachedFiles));
  }, [attachedFiles]);

  useEffect(() => {
    localStorage.setItem("librarian_analysis_logs", JSON.stringify(analysisLogs));
  }, [analysisLogs]);

  // Load PDF.js dynamically from CDN to parse real PDF page images on-the-fly!
  useEffect(() => {
    if ((window as any).pdfjsLib) {
      setPdfLibLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    script.onload = () => {
      try {
        if ((window as any).pdfjsLib) {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
          setPdfLibLoaded(true);
          // Pre-render sample files page placeholders if chosen
          renderSamplePdfPlaceholders();
        }
      } catch (err) {
        console.error("Failed to initialize PDF.js:", err);
      }
    };
    script.onerror = (e) => {
      console.error("PDF.js CDN load failed:", e);
    };
    document.head.appendChild(script);
  }, []);

  // When selected file changes, load raw pages
  useEffect(() => {
    if (selectedFileId === "sample-pdf") {
      renderSamplePdfPlaceholders();
    } else if (selectedFileId) {
      const fileRecord = attachedFiles.find(f => f.id === selectedFileId);
      // Note: we can't easily parse file object if stored as text in localStorage, 
      // but if the user has uploaded it in this session we parse the stored File object
      const fileObj = (window as any)[`file_object_${selectedFileId}`] as File;
      if (fileObj && pdfLibLoaded) {
        renderRealPdfPages(fileObj);
      } else {
        setPdfPages([]);
      }
    } else {
      setPdfPages([]);
    }
  }, [selectedFileId, pdfLibLoaded]);

  // Custom pre-rendered mock pages for the introductory sample past exam file
  const renderSamplePdfPlaceholders = () => {
    setRenderingPages(true);
    // Let's draw some beautiful past exam sample page representations in virtual canvas cards!
    const pages = [];
    const pageTitles = [
      "1페이지: 2024 전공A 1~4번 (분류기호 940, SERVQUAL 만족도 설문, KCR 규칙 비교)",
      "2페이지: 2024 전공A 5~9번 (DDC 본표 조기성, KORMARC 필드 분석, 학교도서관 DLS)",
      "3페이지: 2024 전공B 1~4번 (Big6 정보 가이드라인, Lexile 척도 분석, 독서요법 원인)",
      "4페이지: 2024 전공B 5~8번 (웹 아카이빙 로봇 표준, 멀티미디어 저작권 면담)"
    ];

    setTimeout(() => {
      for (let i = 1; i <= 4; i++) {
        const canvas = document.createElement("canvas");
        canvas.width = 450;
        canvas.height = 600;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, 450, 600);
          
          // Outer Border
          ctx.strokeStyle = "#e2e8f0";
          ctx.lineWidth = 10;
          ctx.strokeRect(0, 0, 450, 600);
          
          // Header Accent
          ctx.fillStyle = "#f1f5f9";
          ctx.fillRect(10, 10, 430, 40);
          
          ctx.fillStyle = "#475569";
          ctx.font = "bold 13px 'Space Grotesk', sans-serif";
          ctx.fillText(`2024학년도 중등교사 임용후보자 선정경쟁시험 [사서]`, 25, 34);

          // Watermark
          ctx.fillStyle = "#f8fafc";
          ctx.font = "bold 44px sans-serif";
          ctx.fillText("기출 SAMPLE", 80, 280);

          // Drawing text blocks to look like actual exam printout
          ctx.fillStyle = "#0f172a";
          ctx.font = "14px sans-serif";
          ctx.fillText(`[문항 ${i * 2 + 1}] 다음 지문을 조망하고 물음에 답하시오.`, 30, 90);
          
          // Passage box
          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(30, 110, 390, 180);
          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 1;
          ctx.strokeRect(30, 110, 390, 180);

          ctx.fillStyle = "#334155";
          ctx.font = "11px 'JetBrains Mono', monospace";
          ctx.fillText("S도서관은 이용자 요구 및 전산 설비를 종합 진단하였다...", 45, 135);
          ctx.fillText("㉠ SERVQUAL 평가지수를 통해 사서교사의 신뢰성을 측정하고,", 45, 160);
          ctx.fillText("본표 전개 및 ㉡ KDC 6판 본표 전개 규칙을 점검한다.", 45, 185);
          ctx.fillText("또한, ㉢ 전자 매체별 이용 빈도를 조사하여 예산을 집행한다.", 45, 210);

          // Write methods block
          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 12px sans-serif";
          ctx.fillText("[작성방법]", 30, 315);
          ctx.font = "11px sans-serif";
          ctx.fillText("- ㉠ SERVQUAL 신뢰성 지표가 정의하는 핵심 역량을 제시하시오.", 40, 340);
          ctx.fillText("- ㉡ KDC 6판 조기표 배정 규정을 본표와 관련지어 서술하시오.", 40, 365);
          ctx.fillText("- ㉢ 미디어 이용 촉진을 위해 정보매체론 관점에서 장점을 기술하시오.", 40, 390);

          // Footer info
          ctx.fillStyle = "#64748b";
          ctx.font = "11px sans-serif";
          ctx.fillText(`배점: 4점 | ${pageTitles[i - 1]}`, 30, 560);
        }
        pages.push({
          pageNumber: i,
          dataUrl: canvas.toDataURL("image/png")
        });
      }
      setPdfPages(pages);
      setRenderingPages(false);
    }, 450);
  };

  // Convert real user-uploaded PDF file pages to image canvases
  const renderRealPdfPages = async (file: File) => {
    setRenderingPages(true);
    setPdfPages([]);
    try {
      const fileReader = new FileReader();
      fileReader.onload = async function () {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) return;

        try {
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          const pagesCount = Math.min(pdf.numPages, 10); // Limit to first 10 pages to avoid intensive client-side processing
          const loadedPages: { pageNumber: number; dataUrl: string }[] = [];

          for (let pNum = 1; pNum <= pagesCount; pNum++) {
            const page = await pdf.getPage(pNum);
            const scale = 1.2;
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
              await page.render({ canvasContext: context, viewport }).promise;
              loadedPages.push({
                pageNumber: pNum,
                dataUrl: canvas.toDataURL("image/png")
              });
            }
          }

          setPdfPages(loadedPages);
          
          // Update file record page count
          setAttachedFiles(prev => prev.map(f => {
            if (f.id === selectedFileId) {
              return { ...f, pageCount: pdf.numPages, status: "done" };
            }
            return f;
          }));

        } catch (innerErr: any) {
          console.error("PDF page render inner error:", innerErr);
          setAnalysisError("PDF 페이지를 렌더링하는 데 실패했습니다. 파일 형식을 복합 점검해 주세요.");
        } finally {
          setRenderingPages(false);
        }
      };
      fileReader.readAsArrayBuffer(file);
    } catch (err: any) {
      console.error("PDF load error:", err);
      setRenderingPages(false);
      setAnalysisError("PDF 파일을 처리하는 도중 문제가 생겼습니다.");
    }
  };

  // Drag & drop file handlers
  const handleDragOverUpload = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverUpload(true);
  };

  const handleDragLeaveUpload = () => {
    setDragOverUpload(false);
  };

  const handleDropUpload = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverUpload(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const processUploadedFile = (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      alert("사서교사 기출문제는 PDF 파일 형식으로 첨부해 주세요.");
      return;
    }

    const newId = `pdf-${Date.now()}`;
    const newRecord: AttachedFile = {
      id: newId,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString().split('T')[0],
      status: "processing",
      progress: 0
    };

    // Store File reference on global window dynamically to retrieve when selecting
    (window as any)[`file_object_${newId}`] = file;

    setAttachedFiles(prev => [newRecord, ...prev]);
    setSelectedFileId(newId);
  };

  // Drag to delete handlers for attachments
  const handleFileDragStart = (e: React.DragEvent, fileId: string) => {
    setDraggedFileId(fileId);
    e.dataTransfer.setData("text/plain", fileId);
    // Make dragged effect custom
    e.dataTransfer.effectAllowed = "move";
  };

  const handleFileDragEnd = () => {
    setDraggedFileId(null);
    setDragOverTrash(false);
  };

  const handleTrashDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTrash(true);
  };

  const handleTrashDragLeave = () => {
    setDragOverTrash(false);
  };

  const handleTrashDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTrash(false);
    const fileId = e.dataTransfer.getData("text/plain") || draggedFileId;
    if (fileId) {
      deleteAttachedFile(fileId);
    }
  };

  const deleteAttachedFile = (fileId: string) => {
    if (fileId === "sample-pdf") {
      if (!confirm("기본 제공되는 학습 샘플 가상 PDF를 삭제하시겠습니까?")) return;
    }
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId(null);
      setPdfPages([]);
    }
    // Cleanup window record
    delete (window as any)[`file_object_${fileId}`];
  };

  // Trigger Gemini AI Vision Multi-Modal Classification Api call on backend 
  const runAiVisionClassification = async (pageNumber: number, dataUrl: string) => {
    setAnalyzingPageNum(pageNumber);
    setAnalysisError(null);

    const fileRecord = attachedFiles.find(f => f.id === selectedFileId);
    const fileName = fileRecord ? fileRecord.name : "알 수 없는 기출 PDF";

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: dataUrl,
          yearContext: analysisYearContext,
          examTypeContext: analysisTypeContext,
          defaultQuestionNum: analysisStartNum + (pageNumber - 1)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "분류 서버 통신 장애가 발생했습니다.");
      }

      const result = await response.json();
      
      if (result.subItems && Array.isArray(result.subItems)) {
        // Map unique client ids to new sub items
        const subItemsWithId: ExamQuestionSubItem[] = result.subItems.map((item: any, idx: number) => ({
          ...item,
          id: `extracted-${Date.now()}-${pageNumber}-${idx}`,
          // Fill fallback elements safely if undefined
          passageContext: item.passageContext || "지문 내용 판별중...",
          year: Number(item.year) || analysisYearContext,
          examType: item.examType || analysisTypeContext,
          questionNum: Number(item.questionNum) || (analysisStartNum + pageNumber - 1),
          score: Number(item.score) || 4,
          questionType: item.questionType || "서술형"
        }));

        setSubItems(prev => {
          // Filter out items of the same year/examType/questionNumber to prevent exact duplicate analysis
          const filtered = prev.filter(p => !(p.year === analysisYearContext && p.examType === analysisTypeContext && p.questionNum === (analysisStartNum + pageNumber - 1)));
          return [...subItemsWithId, ...filtered];
        });

        // Save progress to logs
        const successLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          fileName: fileName,
          pageRange: `${pageNumber} 페이지`,
          status: 'success' as const,
          itemCount: subItemsWithId.length
        };
        setAnalysisLogs(prev => [successLog, ...prev]);

        if (result.fallback) {
          alert(`💡 ${result.message}`);
        } else {
          alert(`🎉 [페이지 ${pageNumber}] 분석 성공! 총 ${subItemsWithId.length}개의 하위 구분 항목이 신규 분류 표에 성공적으로 자동 맵핑·기록되었습니다.`);
        }
      } else {
        throw new Error("올바른 기출 분류 규격 데이터를 응답받지 못했습니다.");
      }

    } catch (err: any) {
      console.error("AI classify error:", err);
      const errorMsg = err.message || "서버 혹은 AI 파트 네트워크 장애가 의심됩니다.";
      setAnalysisError(errorMsg);

      // Save failure progress to logs
      const failedLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        fileName: fileName,
        pageRange: `${pageNumber} 페이지`,
        status: 'failed' as const,
        itemCount: 0,
        message: errorMsg
      };
      setAnalysisLogs(prev => [failedLog, ...prev]);
    } finally {
      setAnalyzingPageNum(null);
    }
  };

  // Preset Reset/Helper
  const loadDefaultMockPreset = () => {
    if (confirm("분류 표를 최초 예시용 모범 기출문제 데이터셋으로 복원하시겠습니까? (현재 데이터는 교체됩니다)")) {
      setSubItems(MOCK_QUESTIONS);
    }
  };

  const clearAllClassifications = () => {
    if (confirm("분류된 모든 기출목록을 소거하시겠습니까?")) {
      setSubItems([]);
    }
  };

  // Sort logic for items
  const handleSort = (field: keyof ExamQuestionSubItem) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedSubItems = [...subItems].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal);
    const bStr = String(bVal);
    return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  // Filter logic
  const filteredSubItems = sortedSubItems.filter(item => {
    const matchesSearch = 
      item.passageContext.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.evaluationArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.evaluationElement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = filterSubject ? item.subject === filterSubject : true;
    const matchesYear = filterYear ? item.year.toString() === filterYear : true;
    const matchesExamType = filterExamType ? item.examType === filterExamType : true;

    return matchesSearch && matchesSubject && matchesYear && matchesExamType;
  });

  // Excel Download logic using xlsx
  const handleExportExcel = () => {
    if (filteredSubItems.length === 0) {
      alert("출력할 기출 분류 데이터가 존재하지 않습니다.");
      return;
    }

    const excelRows = filteredSubItems.map((item, index) => ({
      "번호": index + 1,
      "연도": item.year,
      "전공 구분": item.examType,
      "문항 번호": `${item.questionNum}번`,
      "배점": `${item.score}점`,
      "문제 유형": item.questionType,
      "과목": item.subject,
      "평가 영역": item.evaluationArea,
      "평가 내용 요소": item.evaluationElement,
      "핵심 지문 조각": item.passageContext
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "사서교사 임용 기출분류");

    // Dynamic width calculation
    const maxCols = [{"wch": 6}, {"wch": 8}, {"wch": 12}, {"wch": 10}, {"wch": 8}, {"wch": 15}, {"wch": 18}, {"wch": 30}, {"wch": 45}, {"wch": 60}];
    worksheet["!cols"] = maxCols;

    XLSX.writeFile(workbook, `사서교사_임용기출_분류분석표_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Inline Editing CRUD Functions
  const startEditing = (item: ExamQuestionSubItem) => {
    setEditingId(item.id);
    setEditFormData({ ...item });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const saveEditing = (id: string) => {
    setSubItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, ...editFormData } as ExamQuestionSubItem;
      }
      return item;
    }));
    setEditingId(null);
    setEditFormData({});
  };

  const deleteRow = (id: string) => {
    if (confirm("해당 기출 작성방법 분석 행을 삭제하시겠습니까?")) {
      setSubItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Add Manual classification record
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `manual-${Date.now()}`;
    const itemToAdd: ExamQuestionSubItem = {
      id: newId,
      year: Number(newFormItem.year),
      examType: newFormExamType,
      questionNum: Number(newFormItem.questionNum),
      score: Number(newFormItem.score),
      questionType: newFormItem.questionType,
      subject: newFormItem.subject,
      evaluationArea: newFormItem.evaluationArea,
      evaluationElement: newFormItem.evaluationElement,
      passageContext: newFormItem.passageContext || "수동 입력 지문 및 출제 정황"
    };

    setSubItems(prev => [itemToAdd, ...prev]);
    setShowAddForm(false);
    // Reset form safely but preserve year context
    setNewFormItem(prev => ({
      ...prev,
      questionNum: prev.questionNum + 1,
      passageContext: ""
    }));
  };

  // Sync evaluation areas and elements on manual form dropdown switch
  const handleFormSubjectChange = (subjectName: string) => {
    const std = SUBJECT_STANDARDS.find(s => s.subject === subjectName);
    if (std && std.areas.length > 0) {
      const firstArea = std.areas[0];
      setNewFormItem(prev => ({
        ...prev,
        subject: subjectName,
        evaluationArea: firstArea.area,
        evaluationElement: firstArea.elements[0] || ""
      }));
    }
  };

  const handleFormAreaChange = (areaName: string) => {
    const std = SUBJECT_STANDARDS.find(s => s.subject === newFormItem.subject);
    if (std) {
      const areaObj = std.areas.find(a => a.area === areaName);
      if (areaObj && areaObj.elements.length > 0) {
        setNewFormItem(prev => ({
          ...prev,
          evaluationArea: areaName,
          evaluationElement: areaObj.elements[0]
        }));
      }
    }
  };

  const handleEditFormSubjectChange = (subjectName: string) => {
    const std = SUBJECT_STANDARDS.find(s => s.subject === subjectName);
    if (std && std.areas.length > 0) {
      const firstArea = std.areas[0];
      setEditFormData(prev => ({
        ...prev,
        subject: subjectName,
        evaluationArea: firstArea.area,
        evaluationElement: firstArea.elements[0] || ""
      }));
    }
  };

  const handleEditFormAreaChange = (areaName: string) => {
    const std = SUBJECT_STANDARDS.find(s => s.subject === editFormData.subject);
    if (std) {
      const areaObj = std.areas.find(a => a.area === areaName);
      if (areaObj && areaObj.elements.length > 0) {
        setEditFormData(prev => ({
          ...prev,
          evaluationArea: areaName,
          evaluationElement: areaObj.elements[0]
        }));
      }
    }
  };

  // Compile statistics maps for reporting charts
  const getStatisticsData = () => {
    const totalCount = subItems.length;
    if (totalCount === 0) return [];

    if (statsViewMode === 'subject') {
      // Group by Subject
      const counts: Record<string, number> = {};
      subItems.forEach(item => {
        counts[item.subject] = (counts[item.subject] || 0) + 1;
      });
      return Object.entries(counts).map(([name, count]) => ({
        name,
        count,
        percentage: ((count / totalCount) * 100).toFixed(1)
      })).sort((a, b) => b.count - a.count);
    } else if (statsViewMode === 'area') {
      // Group by Evaluation Area
      const counts: Record<string, { subject: string; count: number }> = {};
      subItems.forEach(item => {
        const key = `${item.subject} > ${item.evaluationArea}`;
        counts[key] = {
          subject: item.subject,
          count: (counts[key]?.count || 0) + 1
        };
      });
      return Object.entries(counts).map(([name, data]) => ({
        name,
        subject: data.subject,
        count: data.count,
        percentage: ((data.count / totalCount) * 100).toFixed(1)
      })).sort((a, b) => b.count - a.count);
    } else {
      // Group by Evaluation Element
      const counts: Record<string, { subject: string; area: string; count: number }> = {};
      subItems.forEach(item => {
        const key = item.evaluationElement;
        counts[key] = {
          subject: item.subject,
          area: item.evaluationArea,
          count: (counts[key]?.count || 0) + 1
        };
      });
      return Object.entries(counts).map(([name, data]) => ({
        name,
        details: `${data.subject} | ${data.area}`,
        count: data.count,
        percentage: ((data.count / totalCount) * 100).toFixed(1)
      })).sort((a, b) => b.count - a.count);
    }
  };

  const statItems = getStatisticsData();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Premium Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight text-slate-900 flex items-center gap-2">
                사서교사 임용 기출문제 분류기
                <span className="text-xs bg-slate-100 text-slate-600 font-mono font-normal px-2 py-0.5 rounded-full border border-slate-200">
                  v1.5 Premium Core
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-sans">
                과목별 평가 영역과 내용 요소를 바탕으로 ㉠㉡㉢ 작성방법 문항 단위를 완벽히 필터링&분류하는 지능형 대시보드
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={loadDefaultMockPreset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors border border-slate-200 cursor-pointer"
              title="초기 샘플 데이터셋으로 분류 리스트를 전면 초기화합니다."
            >
              <RefreshCw className="w-3.5 h-3.5" />
              샘플 프리셋 복원
            </button>
            <button 
              onClick={clearAllClassifications}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-lg transition-colors border border-red-100 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              전체 데이터 소거
            </button>
          </div>
        </div>
      </header>

      {/* Actual Exam Explanation Section (collapsible) */}
      <section className="bg-indigo-900 text-white border-b border-indigo-950 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-display font-semibold text-sm tracking-wide text-indigo-200">
              <Info className="w-4.5 h-4.5 text-blue-300" />
              대한민국 사서교사 임용 전공시험 출제 방식 가이드라인
            </span>
            <button 
              onClick={() => setShowGuideInfo(!showGuideInfo)}
              className="text-xs text-indigo-300 hover:text-white px-2 py-1 rounded hover:bg-indigo-850 transition"
            >
              {showGuideInfo ? "접기 ▲" : "자세히 보기 ▼"}
            </button>
          </div>

          <AnimatePresence>
            {showGuideInfo && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 overflow-hidden text-xs text-indigo-150 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-indigo-800 pt-3"
              >
                <div className="space-y-1 bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-800">
                  <h4 className="font-semibold text-blue-300 font-display flex items-center gap-1">
                    <span>1. 전공 A/B 및 문항 구조</span>
                  </h4>
                  <p className="leading-relaxed">
                    시험은 전공A와 전공B 단계로 진행되며 기입형(2점) 및 서술형(4점) 고유 문항 번호 단위로 출제됩니다. 총점 범위와 제한시간이 설정되며 서답형 지필로 정밀 평가됩니다.
                  </p>
                </div>
                <div className="space-y-1 bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-800">
                  <h4 className="font-semibold text-blue-300 font-display flex items-center gap-1">
                    <span>2. 복합 융합 출제 유형 패턴</span>
                  </h4>
                  <p className="leading-relaxed">
                    예시로 9번 문항 하나에서 <strong>정보봉사(SERVQUAL)</strong>와 <strong>도서관전산화(웹 아카이빙)</strong>, <strong>정보매체론(학습매체)</strong>이 동시에 출제되는 식의 다과목 중복 융합 경향이 짙습니다.
                  </p>
                </div>
                <div className="space-y-1 bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-800">
                  <h4 className="font-semibold text-blue-300 font-display flex items-center gap-1">
                    <span>3. 항목(㉠㉡㉢) 단위 정밀 추출</span>
                  </h4>
                  <p className="leading-relaxed">
                    단순 문항 단위로 묶을 경우 정확한 과목 통계 왜곡이 발생하므로 본 프로그램은 각 문항 내부의 <strong>작성방법 하위 구문 기호(㉠, ㉡, ㉢) 단위</strong>로 독립적인 평가 영역을 매칭해 통계를 냅니다.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Main Container Dashboard */}
      <main className="max-w-7xl mx-auto p-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Hand: Cockpit Sidebar (Uploads / Trashes / PDF Extractor view) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* File Upload Zone */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 relative overflow-hidden">
            <h3 className="font-semibold text-sm font-display text-slate-900 mb-3 flex items-center gap-1.5">
              <FileUp className="w-4 h-4 text-blue-600" />
              1단계: 기출 PDF 첨부 및 관리
            </h3>

            {/* Drag & Drop Zone */}
            <div 
              onDragOver={handleDragOverUpload}
              onDragLeave={handleDragLeaveUpload}
              onDrop={handleDropUpload}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all relative ${
                dragOverUpload ? "border-blue-500 bg-blue-50/50 scale-98" : "border-slate-350 hover:border-slate-400 bg-slate-50"
              }`}
            >
              <Upload className="w-8 h-8 text-slate-400 mb-2 animate-bounce-subtle" />
              <p className="text-xs text-slate-700 font-semibold mb-1">
                사서교사 기출 PDF 파일을 드래그해서 첨부
              </p>
              <p className="text-[10px] text-slate-400">
                또는 컴퓨터에서 파일 수동 선택
              </p>
              <input 
                type="file" 
                accept="application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleFileSelectChange}
              />
            </div>

            {/* Drag to delete receptor zone */}
            <div 
              onDragOver={handleTrashDragOver}
              onDragLeave={handleTrashDragLeave}
              onDrop={handleTrashDrop}
              className={`mt-4 border border-dashed rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${
                dragOverTrash 
                  ? "border-red-600 bg-red-100 text-red-700 scale-102 font-bold shadow-md shadow-red-200" 
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700 hover:border-red-200 hover:bg-red-50/30"
              }`}
              title="파일 카드를 이 구역으로 마우스 드래그하여 지울 수 있습니다."
            >
              <Trash2 className={`w-4 h-4 ${dragOverTrash ? "animate-pulse" : ""}`} />
              <span className="text-[11px] font-medium">
                {dragOverTrash ? "마우스를 놓아 즉시 가열 유기" : "파일 카드를 여기에 드래그하여 삭제"}
              </span>
            </div>

            {/* Attached files list */}
            {attachedFiles.length > 0 && (
              <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  등록된 기출파일 라이브러리 ({attachedFiles.length}개)
                </p>
                {attachedFiles.map(file => {
                  const isSelected = selectedFileId === file.id;
                  return (
                    <div 
                      key={file.id}
                      draggable="true"
                      onDragStart={(e) => handleFileDragStart(e, file.id)}
                      onDragEnd={handleFileDragEnd}
                      onClick={() => setSelectedFileId(file.id)}
                      className={`group p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-grab active:cursor-grabbing hover:shadow-xs ${
                        isSelected 
                          ? "border-blue-500 bg-blue-50/50 text-blue-900" 
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className={`w-4.5 h-4.5 shrink-0 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                        <div className="truncate text-left">
                          <p className="text-xs font-medium truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.uploadedAt}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAttachedFile(file.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="삭제하기 (파일을 휴지통에 드래그해도 됩니다)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? "text-blue-600" : "text-slate-350"}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>



          {/* Recent Analysis Logs Sidebar Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 relative overflow-hidden text-left">
            <h3 className="font-semibold text-sm font-display text-slate-900 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                최근 AI 분석 이력 (Recent Logs)
              </span>
              <button
                onClick={() => {
                  if (confirm("분석 이력을 삭제하시겠습니까?")) {
                    setAnalysisLogs([]);
                  }
                }}
                className="text-[10px] text-red-500 hover:text-red-700 hover:underline cursor-pointer"
              >
                비우기
              </button>
            </h3>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {analysisLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs border border-dashed rounded-xl">
                  AI 분석 내역이 아직 존재하지 않습니다.
                </div>
              ) : (
                analysisLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-left text-xs transition hover:bg-slate-100/75">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === "success" 
                          ? "bg-green-100 text-green-800 border border-green-200" 
                          : "bg-red-50 text-red-700 border border-red-100"
                      }`}>
                        {log.status === "success" ? "성공" : "실패"}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 leading-tight mb-1 truncate" title={log.fileName}>
                      {log.fileName}
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                      <span>범위: {log.pageRange}</span>
                      <span className="text-blue-600">감지 문항: <strong className="font-bold">{log.itemCount}개</strong></span>
                    </div>
                    {log.message && (
                      <p className="mt-1.5 text-[10px] text-red-600 bg-red-50/50 p-1 border border-red-100/50 rounded leading-relaxed">
                        {log.message}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Hand: Central Stage Dashboard (Database Grid, Statistics, Excel download) */}
        <div className="lg:col-span-8 flex flex-col gap-6 text-left">
          
          {/* Main Action Toolbar & Tab Navigation */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-3 mb-4">
              {/* Tab Selector */}
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto whitespace-nowrap">
                <button
                  onClick={() => setActiveTab('results')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'results' 
                      ? "bg-white text-slate-900 shadow-xs" 
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  기출 분석 데이터 표 ({filteredSubItems.length}건)
                </button>
                <button
                  onClick={() => setActiveTab('concepts')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'concepts' 
                      ? "bg-white text-slate-900 shadow-xs animate-pulse-once" 
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-100" />
                  빈출 주요 개념 분석
                </button>
                <button
                  onClick={() => setActiveTab('statistics')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'statistics' 
                      ? "bg-white text-slate-900 shadow-xs" 
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  출제 빈도 통계 분석
                </button>
                <button
                  onClick={() => setActiveTab('curriculum')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'curriculum' 
                      ? "bg-white text-slate-900 shadow-xs" 
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  8대 과목 기준표
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  수동 기출 행 추가
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-205 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  엑셀 파일로 다운로드
                </button>
              </div>
            </div>

            {/* Results Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="텍스트 지문, 영역 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:ring-1 focus:ring-blue-500 outline-hidden font-medium"
                />
              </div>

              <div>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold text-slate-700"
                >
                  <option value="">과목 필터 (전체)</option>
                  {SUBJECT_STANDARDS.map(s => (
                    <option key={s.subject} value={s.subject}>{s.subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold text-slate-700"
                >
                  <option value="">출제연도 필터 (전체)</option>
                  <option value="2024">2024학년도</option>
                  <option value="2023">2023학년도</option>
                  <option value="2022">2022학년도</option>
                </select>
              </div>

              <div>
                <select
                  value={filterExamType}
                  onChange={(e) => setFilterExamType(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold text-slate-700"
                >
                  <option value="">전공 구분 (전체)</option>
                  <option value="전공 A">전공 A</option>
                  <option value="전공 B">전공 B</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tab Content 1: Main Classification database table */}
          {activeTab === 'results' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              
              {/* Dynamic Add Form Inside View (if toggled) */}
              {showAddForm && (
                <div className="bg-slate-50 p-5 border-b border-slate-200 text-left">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-sm text-slate-950 font-display flex items-center gap-1">
                      <Plus className="w-4 h-4 text-blue-600" />
                      신규 기출 작성방법 분석 행 직접 기술하기
                    </h4>
                    <button 
                      onClick={() => setShowAddForm(false)} 
                      className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddNewItem} className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">연도</label>
                        <input 
                          type="number" 
                          required
                          value={newFormItem.year}
                          onChange={(e) => setNewFormItem(prev => ({ ...prev, year: Number(e.target.value) }))}
                          className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">시험 구분</label>
                        <select
                          value={newFormExamType}
                          onChange={(e) => setNewFormExamType(e.target.value as any)}
                          className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold"
                        >
                          <option value="전공 A">전공 A</option>
                          <option value="전공 B">전공 B</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">문항 번호</label>
                        <input 
                          type="number" 
                          required
                          value={newFormItem.questionNum}
                          onChange={(e) => setNewFormItem(prev => ({ ...prev, questionNum: Number(e.target.value) }))}
                          className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">배점</label>
                        <input 
                          type="number" 
                          required
                          value={newFormItem.score}
                          onChange={(e) => setNewFormItem(prev => ({ ...prev, score: Number(e.target.value) }))}
                          className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">문제 유형</label>
                        <select
                          value={newFormItem.questionType}
                          onChange={(e) => setNewFormItem(prev => ({ ...prev, questionType: e.target.value as any }))}
                          className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold text-slate-700"
                        >
                          <option value="객관식">객관식</option>
                          <option value="단답형">단답형</option>
                          <option value="서술형">서술형</option>
                          <option value="풀이 실습">풀이 실습</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">과목 선택 (임의 배제 규칙)</label>
                        <select
                          value={newFormItem.subject}
                          onChange={(e) => handleFormSubjectChange(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold text-slate-700"
                        >
                          {SUBJECT_STANDARDS.map(s => (
                            <option key={s.subject} value={s.subject}>{s.subject}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">평가 영역</label>
                        <select
                          value={newFormItem.evaluationArea}
                          onChange={(e) => handleFormAreaChange(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold text-slate-700"
                        >
                          {SUBJECT_STANDARDS.find(s => s.subject === newFormItem.subject)?.areas.map(a => (
                            <option key={a.area} value={a.area}>{a.area}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">평가 내용 요소</label>
                        <select
                          value={newFormItem.evaluationElement}
                          onChange={(e) => setNewFormItem(prev => ({ ...prev, evaluationElement: e.target.value }))}
                          className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 focus:ring-1 focus:ring-blue-500 outline-hidden font-semibold text-slate-700"
                        >
                          {SUBJECT_STANDARDS.find(s => s.subject === newFormItem.subject)
                            ?.areas.find(a => a.area === newFormItem.evaluationArea)
                            ?.elements.map(el => (
                              <option key={el} value={el}>{el}</option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">해당 지문 / 기술 내용</label>
                      <textarea
                        value={newFormItem.passageContext}
                        onChange={(e) => setNewFormItem(prev => ({ ...prev, passageContext: e.target.value }))}
                        rows={2}
                        placeholder="이론 제시 구절 또는 문항 작성조건의 전문을 복사하여 작성하세요..."
                        className="w-full text-xs bg-white border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-500 outline-hidden font-medium"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-slate-250">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 active:bg-slate-100"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                      >
                        신규 레코드 추가
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Grid Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("year")}>
                        연도 {sortField === "year" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="py-3 px-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("examType")}>
                        시험 {sortField === "examType" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="py-3 px-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("questionNum")}>
                        문항 {sortField === "questionNum" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="py-3 px-2 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("questionType")}>
                        문제 유형 {sortField === "questionType" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("subject")}>
                        과목 {sortField === "subject" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("evaluationArea")}>
                        평가 영역 {sortField === "evaluationArea" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="py-3 px-4">평가 내용 요소 (공식)</th>
                      <th className="py-3 px-4 w-[250px]">핵심 지문 구절</th>
                      <th className="py-3 px-4 text-center">동작</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredSubItems.length > 0 ? (
                      filteredSubItems.map((item) => {
                        const isEditing = editingId === item.id;
                        return (
                          <tr key={item.id} className={`hover:bg-slate-50/55 transition-colors ${isEditing ? "bg-blue-50/20" : ""}`}>
                            
                            {/* Year Cell */}
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {isEditing ? (
                                <input 
                                  type="number"
                                  value={editFormData.year || 2024}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
                                  className="w-14 p-1 border rounded bg-white font-mono"
                                />
                              ) : (
                                `${item.year}학년도`
                              )}
                            </td>

                            {/* Exam Type Cell */}
                            <td className="py-3 px-3">
                              {isEditing ? (
                                <select
                                  value={editFormData.examType || "전공 A"}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, examType: e.target.value as any }))}
                                  className="p-1 border rounded bg-white text-[11px]"
                                >
                                  <option value="전공 A">전공 A</option>
                                  <option value="전공 B">전공 B</option>
                                </select>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.examType === "전공 A" ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"
                                }`}>
                                  {item.examType}
                                </span>
                              )}
                            </td>

                            {/* Question Number & Score Cell */}
                            <td className="py-3 px-3 font-medium">
                              {isEditing ? (
                                <div className="flex gap-1 items-center">
                                  <input 
                                    type="number"
                                    value={editFormData.questionNum || 1}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, questionNum: Number(e.target.value) }))}
                                    className="w-10 p-1 border rounded bg-white font-mono"
                                  />
                                  <span className="text-[10px] text-slate-400">번</span>
                                </div>
                              ) : (
                                `${item.questionNum}번 (${item.score}점)`
                              )}
                            </td>

                            {/* Question Type Cell */}
                            <td className="py-3 px-2 text-center">
                              {isEditing ? (
                                <select
                                  value={editFormData.questionType || "서술형"}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, questionType: e.target.value as any }))}
                                  className="p-1 border rounded bg-white text-xs font-semibold text-slate-700"
                                >
                                  <option value="객관식">객관식</option>
                                  <option value="단답형">단답형</option>
                                  <option value="서술형">서술형</option>
                                  <option value="풀이 실습">풀이 실습</option>
                                </select>
                              ) : (
                                <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-100 font-semibold text-center rounded-lg text-[11px] whitespace-nowrap">
                                  {item.questionType}
                                </span>
                              )}
                            </td>

                            {/* Subject Cell */}
                            <td className="py-3 px-4 font-semibold">
                              {isEditing ? (
                                <select
                                  value={editFormData.subject || ""}
                                  onChange={(e) => handleEditFormSubjectChange(e.target.value)}
                                  className="p-1 border rounded bg-white text-[11px] font-bold text-blue-900"
                                >
                                  {SUBJECT_STANDARDS.map(s => (
                                    <option key={s.subject} value={s.subject}>{s.subject}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-slate-900">{item.subject}</span>
                              )}
                            </td>

                            {/* Evaluation Area Cell */}
                            <td className="py-3 px-4 text-slate-600">
                              {isEditing ? (
                                <select
                                  value={editFormData.evaluationArea || ""}
                                  onChange={(e) => handleEditFormAreaChange(e.target.value)}
                                  className="p-1 border rounded bg-white text-[11px] max-w-[140px]"
                                >
                                  {SUBJECT_STANDARDS.find(s => s.subject === editFormData.subject)?.areas.map(a => (
                                    <option key={a.area} value={a.area}>{a.area}</option>
                                  ))}
                                </select>
                              ) : (
                                item.evaluationArea
                              )}
                            </td>

                            {/* Evaluation Element Cell */}
                            <td className="py-3 px-4 text-slate-500 font-sans max-w-[150px] truncate" title={item.evaluationElement}>
                              {isEditing ? (
                                <select
                                  value={editFormData.evaluationElement || ""}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, evaluationElement: e.target.value }))}
                                  className="p-1 border rounded bg-white text-[11px] max-w-[150px]"
                                >
                                  {SUBJECT_STANDARDS.find(s => s.subject === editFormData.subject)
                                    ?.areas.find(a => a.area === editFormData.evaluationArea)
                                    ?.elements.map(el => (
                                      <option key={el} value={el}>{el}</option>
                                    ))}
                                </select>
                              ) : (
                                item.evaluationElement
                              )}
                            </td>

                            {/* Passage Context Cell */}
                            <td className="py-3 px-4 text-slate-600 max-w-[250px]">
                              {isEditing ? (
                                <textarea
                                  value={editFormData.passageContext || ""}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, passageContext: e.target.value }))}
                                  className="w-full p-1 border rounded bg-white text-[11px] font-sans"
                                  rows={2}
                                />
                              ) : (
                                <p className="line-clamp-2 leading-relaxed" title={item.passageContext}>
                                  {item.passageContext}
                                </p>
                              )}
                            </td>

                            {/* Action Operations Column */}
                            <td className="py-3 px-4 text-center">
                              {isEditing ? (
                                <div className="flex gap-1 justify-center">
                                  <button
                                    onClick={() => saveEditing(item.id)}
                                    className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg"
                                    title="저장"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg"
                                    title="취소"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-1 justify-center">
                                  <button
                                    onClick={() => startEditing(item)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                                    title="수정하기"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteRow(item.id)}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                                    title="삭제하기"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>

                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 bg-slate-50/50">
                          <p className="font-semibold text-slate-500 mb-1">매치되는 분류 데이터가 존재하지 않습니다.</p>
                          <p className="text-[11px] text-slate-400">검색 필터를 완화하거나 좌측 Vision 분석기를 기동하여 목록을 생성하세요.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* Tab Content: Frequent Key Concepts Analyser */}
          {activeTab === 'concepts' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Side: Interactive Bento Grid of Concepts */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-left">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-1.5">
                        <Lightbulb className="w-4.5 h-4.5 text-amber-500 fill-amber-100" />
                        임용 기출 주요 개념 (총 {KEY_CONCEPTS_LIST.length}개)
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1">
                        전공 사서 임용고시의 8대 핵심과목에서 가장 반복 출제되는 주요 빈출 개념군입니다. 클릭 시 상세 요약과 실제 기출 지문을 확인하실 수 있습니다.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {KEY_CONCEPTS_LIST.map((concept) => {
                      const matchedItems = subItems.filter(item => {
                        const textToSearch = `${item.subject} ${item.evaluationArea} ${item.evaluationElement} ${item.passageContext}`.toLowerCase();
                        return concept.keywords.some(kw => textToSearch.includes(kw.toLowerCase()));
                      });
                      const freqCount = matchedItems.length;
                      const isSelected = selectedConceptId === concept.id;

                      // Calculate relative density
                      const maxCount = Math.max(...KEY_CONCEPTS_LIST.map(c => {
                        return subItems.filter(item => {
                          const textToSearch = `${item.subject} ${item.evaluationArea} ${item.evaluationElement} ${item.passageContext}`.toLowerCase();
                          return c.keywords.some(kw => textToSearch.includes(kw.toLowerCase()));
                        }).length;
                      }), 1);
                      const densityRatio = Math.min((freqCount / maxCount) * 100, 100);

                      return (
                        <button
                          key={concept.id}
                          onClick={() => setSelectedConceptId(concept.id)}
                          className={`w-full p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                            isSelected
                              ? "bg-blue-50/80 border-blue-250 ring-1 ring-blue-400/20"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="inline-block px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded text-[9px] font-bold mb-1">
                                {concept.category}
                              </span>
                              <h4 className={`text-xs font-bold leading-snug ${isSelected ? "text-blue-950" : "text-slate-800"}`}>
                                {concept.name}
                              </h4>
                            </div>
                            <div className="shrink-0 flex flex-col items-end">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                freqCount > 0 
                                  ? isSelected 
                                    ? "bg-blue-600 text-white" 
                                    : "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-slate-100 text-slate-400 border border-slate-150"
                              }`}>
                                {freqCount}회 출제
                              </span>
                            </div>
                          </div>

                          {/* Relative weight bar */}
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${isSelected ? "bg-blue-600" : "bg-slate-400"}`}
                              style={{ width: `${densityRatio}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Side: High-Fidelity Study Card & Questions list */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                {(() => {
                  const activeConcept = KEY_CONCEPTS_LIST.find(c => c.id === selectedConceptId) || KEY_CONCEPTS_LIST[0];
                  const matchedItems = subItems.filter(item => {
                    const textToSearch = `${item.subject} ${item.evaluationArea} ${item.evaluationElement} ${item.passageContext}`.toLowerCase();
                    return activeConcept.keywords.some(kw => textToSearch.includes(kw.toLowerCase()));
                  });

                  return (
                    <motion.div 
                      key={activeConcept.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex-1 flex flex-col gap-5 text-left"
                    >
                      {/* Concept Header */}
                      <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold rounded-md">
                            {activeConcept.category}
                          </span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-[11px] text-slate-500 font-medium">검색 키워드: {activeConcept.keywords.join(", ")}</span>
                        </div>
                        <h2 className="text-lg font-black text-slate-900 font-display">
                          {activeConcept.name}
                        </h2>
                        <p className="text-xs text-slate-600 leading-relaxed mt-2.5 bg-slate-50 border border-slate-100 rounded-xl p-3">
                          {activeConcept.description}
                        </p>
                      </div>

                      {/* Study Guide Content */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2.5 uppercase tracking-wider">
                          <span className="w-1.5 h-3.5 bg-blue-600 rounded-sm inline-block"></span>
                          핵심 출제 포인트 가이드 (Study Guide)
                        </h4>
                        <ul className="space-y-2">
                          {activeConcept.corePoints.map((point, i) => (
                            <li key={i} className="flex gap-2.5 items-start text-xs text-slate-700 leading-relaxed">
                              <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                {i + 1}
                              </span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Matched Questions Section */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                            <span className="w-1.5 h-3.5 bg-indigo-500 rounded-sm inline-block"></span>
                            실제 출제된 연계 기출 ({matchedItems.length}건)
                          </h4>
                          {matchedItems.length > 0 && (
                            <button
                              onClick={() => {
                                // Filter in main table
                                setFilterSubject("");
                                setFilterYear("");
                                setFilterExamType("");
                                setSearchQuery(activeConcept.keywords[0]);
                                setActiveTab("results");
                              }}
                              className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              메인 데이터 표에서 상세 보기
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {matchedItems.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 text-xs border border-dashed rounded-xl flex-1 flex flex-col justify-center items-center gap-2">
                            <Info className="w-6 h-6 text-slate-300" />
                            <p className="font-semibold text-slate-500">현재 수록된 데이터 중 직접 연계된 문항이 없습니다.</p>
                            <p className="text-[10px] max-w-xs text-slate-400">
                              상단 PDF 패널을 통해 기출문제를 스캔하거나 직접 수동 문항을 등록하면 실시간으로 해당 개념 분류 목록에 맵핑됩니다.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                            {matchedItems.map((item) => (
                              <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs hover:bg-slate-100/50 transition">
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-800">{item.year}학년도</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-slate-600">{item.examType} {item.questionNum}번</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] rounded font-bold">{item.questionType}</span>
                                  </div>
                                  <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded font-mono font-bold">
                                    {item.score}점
                                  </span>
                                </div>
                                <p className="font-bold text-slate-800 mb-1">
                                  [평가영역] {item.evaluationArea} &gt; {item.evaluationElement}
                                </p>
                                <div className="bg-white border border-slate-150 rounded-lg p-2.5 text-slate-600 leading-relaxed font-mono text-[11px] whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                                  {item.passageContext}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Tab Content 2: Frequency statistics on Subjects, Areas, and Elements */}
          {activeTab === 'statistics' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-display">
                    분류 기준별 출제 빈도 분석 통계
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    현재 등록된 기출문제를 분석하여 산출한 과목, 평가 영역, 평가 내용 요소 단위 누적 분석표입니다.
                  </p>
                </div>

                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
                  <button
                    onClick={() => setStatsViewMode('subject')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                      statsViewMode === 'subject' ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    1. 과목별 빈도
                  </button>
                  <button
                    onClick={() => setStatsViewMode('area')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                      statsViewMode === 'area' ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    2. 평가영역별 빈도
                  </button>
                  <button
                    onClick={() => setStatsViewMode('element')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                      statsViewMode === 'element' ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    3. 내용요소별 빈도
                  </button>
                </div>
              </div>

              {subItems.length > 0 ? (
                <div className="space-y-4">
                  {statItems.map((stat, idx) => {
                    return (
                      <div key={idx} className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-left transition-all hover:bg-slate-100/60">
                        <div className="flex justify-between items-center mb-2">
                          <div className="pr-4">
                            <span className="text-xs font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded font-bold mr-2">
                              RANK {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800 font-display">
                              {stat.name}
                            </span>
                            {(stat as any).details && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {(stat as any).details}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-slate-800 font-mono">
                              {stat.count}회 출제
                            </p>
                            <p className="text-[10px] text-blue-600 font-bold">
                              점유율 {stat.percentage}%
                            </p>
                          </div>
                        </div>

                        {/* Custom Visual Range Bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p className="font-semibold text-slate-500 mb-1">통계를 작성할 기출 정보가 없습니다.</p>
                  <p className="text-[11px]">기출 항목을 등록하면 실시간 순위와 점유율이 시각화 리포트로 작성됩니다.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab Content 3: Full Curriculum Reference taxonomy (from attached PDF) */}
          {activeTab === 'curriculum' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 mb-6 text-left">
                <h3 className="font-bold text-slate-900 text-base font-display">
                  중등 사서교사 임용시험 평가 영역 총괄 가이드라인 조견표
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  첨부해 주신 평가 영역 총괄표의 공식 8대 과목 분류 기준입니다. 임의의 명칭으로 구분하지 않고, 해당 명칭으로 철저히 분류됩니다.
                </p>
              </div>

              <div className="space-y-6">
                {SUBJECT_STANDARDS.map((s, sIdx) => (
                  <div key={sIdx} className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/50">
                    <h4 className="font-bold text-sm text-slate-950 font-display border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                      {s.subject}
                    </h4>

                    <div className="space-y-3.5 pl-3">
                      {s.areas.map((a, aIdx) => (
                        <div key={aIdx} className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                          <div className="font-bold text-slate-700 font-display">
                            {a.area}
                          </div>
                          <div className="md:col-span-3 text-slate-500 font-sans pl-1 border-l-2 border-slate-200">
                            {a.elements.join(" / ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Decorative footer as required strictly matching craft and humble tone */}
      <footer className="bg-slate-900 text-slate-450 text-xs py-8 border-t border-slate-950 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-2">
          <p className="font-medium">
            사서교사 임용 기출문제 분류 대시보드
          </p>
          <p className="text-slate-500">
            한국도서관협회 및 평가총괄 기준표 기반 | 본 프로그램은 교육연구 가치 제고를 위해 제작되었습니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
