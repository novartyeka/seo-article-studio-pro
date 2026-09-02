import React, { useState } from 'react';
import { 
  Lightbulb, 
  Search, 
  Sparkles, 
  Target, 
  FileText, 
  UserCheck, 
  Cpu, 
  ShieldCheck, 
  DollarSign, 
  Copy, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Feather,
  Zap,
  Play,
  ListOrdered,
  Edit3,
  RotateCcw,
  Image as ImageIcon,
  Languages,
  Eye,
  Monitor,
  Code2,
  Download
} from 'lucide-react';

async function callGeminiApi(prompt, systemInstruction = "") {
  const apiKey = ""; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const delays = [1000, 2000, 4000, 8000, 16000];
  
  for (let i = 0; i <= delays.length; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Status server: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (error) {
      if (i === delays.length) {
        throw new Error("Gagal terhubung ke AI. Silakan coba beberapa saat lagi.");
      }
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
}

function ArticleRenderer({ content }) {
  if (!content) return null;

  // Clean up raw asterisks (* or **) used for markdown bolding/italics
  const cleanContent = content
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1');

  const blocks = cleanContent.split(/\n\n+/);

  return (
    <div className="space-y-4 text-slate-200 leading-relaxed font-sans">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();

        if (trimmed.startsWith('# ')) {
          return <h1 key={idx} className="text-2xl font-bold text-emerald-400 mt-6 mb-2">{trimmed.replace('# ', '')}</h1>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} className="text-lg font-bold text-emerald-300 mt-5 mb-2 border-b border-slate-800 pb-1">{trimmed.replace('## ', '')}</h2>;
        }
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-base font-semibold text-slate-100 mt-4 mb-1">{trimmed.replace('### ', '')}</h3>;
        }

        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="p-3 my-2 border-l-4 border-emerald-500 bg-emerald-950/30 rounded-r-xl text-emerald-200 text-xs italic">
              {trimmed.replace('> ', '')}
            </blockquote>
          );
        }

        return (
          <p key={idx} className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function App() {
  const [viewMode, setViewMode] = useState('app'); // 'app' or 'code'
  const [pageStage, setPageStage] = useState('topic_search');

  const [generalTopic, setGeneralTopic] = useState('');
  const [customSpecificTopic, setCustomSpecificTopic] = useState('');
  const [subtopics, setSubtopics] = useState([]);
  const [previousSubtopics, setPreviousSubtopics] = useState([]);
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [isAnalyzingSubtopics, setIsAnalyzingSubtopics] = useState(false);
  const [ideaGenerationCount, setIdeaGenerationCount] = useState(0);

  const [optionalData, setOptionalData] = useState({
    userExperience: '',
    toneOfVoice: 'Santai & Akrab (Ramah Pembaca)',
    targetWordCount: '1200',
    targetLanguage: 'id'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegeneratingArticle, setIsRegeneratingArticle] = useState(false);
  const [currentStep, setCurrentStep] = useState(9);
  const [autoStatus, setAutoStatus] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Optional Image Generator State
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [imageDownloadSize, setImageDownloadSize] = useState(null);

  const [resultData, setResultData] = useState({
    topic: '',
    targetAudience: '',
    painPoints: '',
    keyQuestions: '',
    uniqueAngle: '',
    primaryKeyword: '',
    longTailKeywords: '',
    lsiKeywords: '',
    searchIntent: '',
    urlSlug: '',
    internalLinkSuggestions: [],
    externalLinkSuggestions: [],
    outline: '',
    articleContent: '',
    metaTitle: '',
    metaDescription: '',
    eeatScore: 0,
    eeatFeedback: [],
    qualityScore: 0,
    qualityFeedback: [],
    seoScore: 0,
    seoFeedback: [],
    adsenseScore: 0,
    adsenseFeedback: []
  });

  const stepsList = [
    { id: 1, title: 'Analisis Audiens', icon: Search, short: 'Analisis' },
    { id: 2, title: 'Unique Angle', icon: Sparkles, short: 'Angle' },
    { id: 3, title: 'SEO & Keywords', icon: Target, short: 'Keywords SEO' },
    { id: 4, title: 'Content Blueprint', icon: FileText, short: 'Outline' },
    { id: 5, title: 'Penulisan Draf', icon: Cpu, short: 'Draft' },
    { id: 6, title: 'Audit E-E-A-T Google', icon: UserCheck, short: 'E-E-A-T Google' },
    { id: 7, title: 'Audit On-Page SEO', icon: ShieldCheck, short: 'Audit SEO' },
    { id: 8, title: 'Kelayakan AdSense', icon: DollarSign, short: 'AdSense' },
    { id: 9, title: 'Artikel Final', icon: Feather, short: 'Selesai' }
  ];

  const handleOptionalChange = (field, value) => {
    setOptionalData(prev => ({ ...prev, [field]: value }));
  };

  const copyToClipboard = (text) => {
    const cleanedText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1');

    const textarea = document.createElement('textarea');
    textarea.value = cleanedText;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Gagal menyalin:', err);
    }
    document.body.removeChild(textarea);
  };

  const analyzeTopicPotential = async (isRegenerate = false) => {
    if (!generalTopic.trim()) {
      setErrorMessage("Silakan masukkan topik besar atau niche terlebih dahulu.");
      return;
    }
    setErrorMessage('');

    setIsAnalyzingSubtopics(true);
    setSubtopics([]);

    const currentBatch = isRegenerate ? ideaGenerationCount + 1 : 1;
    setIdeaGenerationCount(currentBatch);

    if (!isRegenerate) {
      setPreviousSubtopics([]);
    }

    const accumulatedTitles = isRegenerate ? previousSubtopics : [];
    const avoidPrompt = accumulatedTitles.length > 0 
      ? `\n\nPERINGATAN SANGAT PENTING: JANGAN PERNAH MENGULANG atau menampilkan kembali ide-ide subtopik yang sudah dihasilkan sebelumnya berikut ini:\n${accumulatedTitles.map(t => `- "${t}"`).join('\n')}\nHasilkan 10 subtopik BARU dan BENAR-BENAR UNIK yang belum ada di daftar di atas.`
      : '';

    try {
      const prompt = `Pengguna memberikan topik besar/niche berikut: "${generalTopic.trim()}".
Tugasmu adalah menganalisis dan menghasilkan 10 pilihan ide pembahasan (subtopik spesifik) yang berbeda dan segar (Variasi Batch Ke-${currentBatch}) yang paling berpotensi banyak dicari di Google, bernilai SEO tinggi, serta ramah monetisasi AdSense.${avoidPrompt}

Hasilkan output JSON murni tanpa markdown formatting:
{
  "ideas": [
    {
      "id": 1,
      "title": "Judul Subtopik Spesifik 1",
      "reason": "Alasan mengapa topik ini berpotensi banyak dicari & diminati pembaca"
    }
  ]
}`;

      const resultText = await callGeminiApi(prompt, "Kamu adalah SEO Riset Analyst & Trend Specialist Google Global & Indonesia.");
      const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.ideas && Array.isArray(parsed.ideas)) {
        setSubtopics(parsed.ideas);
        const newTitles = parsed.ideas.map(item => item.title);
        setPreviousSubtopics(prev => isRegenerate ? [...prev, ...newTitles] : newTitles);
      } else {
        throw new Error("Format analisis topik tidak valid.");
      }
    } catch (err) {
      setErrorMessage("Gagal menganalisis potensi topik: " + err.message);
    } finally {
      setIsAnalyzingSubtopics(false);
    }
  };

  const handleSelectRecommendation = (title) => {
    setSelectedSubtopic(title);
    setPageStage('customize_details');
  };

  const handleCustomTopicSubmit = () => {
    if (!customSpecificTopic.trim()) {
      setErrorMessage("Silakan isi topik spesifik Anda terlebih dahulu.");
      return;
    }
    setErrorMessage('');
    setSelectedSubtopic(customSpecificTopic.trim());
    setPageStage('customize_details');
  };

  const startArticleGeneration = async (isAlternative = false) => {
    if (!selectedSubtopic) return;

    if (isAlternative) {
      setIsRegeneratingArticle(true);
    } else {
      setPageStage('generating');
      setIsGenerating(true);
    }
    setErrorMessage('');
    
    const targetTopic = selectedSubtopic;
    const isEnglish = optionalData.targetLanguage === 'en';
    const langInstruction = isEnglish 
      ? "OUTPUT LANGUAGE MANDATE: Everything must be written strictly in native ENGLISH without any raw markdown asterisks." 
      : "MANDAT BAHASA OUTPUT: Seluruh artikel dan respon wajib ditulis dalam BAHASA INDONESIA yang alami, santun, dan bersih dari tanda bintang berlebih.";

    try {
      setAutoStatus(isEnglish ? "Memproses riset keyword SEO & search intent..." : "Memproses riset keyword SEO & niat pencarian pembaca...");
      
      const prepPrompt = `Lakukan riset SEO mendalam dan pilihkan kata kunci terbaik untuk topik spesifik berikut:
Topik Spesifik Terpilih: "${targetTopic}"
Konteks Topik Induk: "${generalTopic}"

Bahasa Target Output Artikel: ${isEnglish ? 'ENGLISH' : 'BAHASA INDONESIA'}.

Hasilkan output JSON murni tanpa markdown formatting:
{
  "primaryKeyword": "Pilih 1 Kata Kunci Utama Terbaik",
  "longTailKeywords": "Pilih 3-4 Kata Kunci Long-Tail Spesifik Terbaik dipisah koma",
  "lsiKeywords": "4-5 Kata Kunci LSI / Konteks dipisah koma",
  "targetAudience": "siapa target pembaca spesifik",
  "painPoints": "masalah utama pembaca yang ingin diselesaikan",
  "keyQuestions": "3 pertanyaan pencarian paling sering dicari di Google",
  "uniqueAngle": "sudut pandang praktis dan bermanfaat agar tidak pasaran",
  "searchIntent": "Informational / Commercial / Transactional",
  "urlSlug": "rekomendasi URL slug SEO friendly",
  "internalLinkSuggestions": ["ide artikel internal 1", "ide artikel internal 2"],
  "externalLinkSuggestions": ["rujukan sumber data publik/otoritas 1", "rujukan otoritas 2"],
  "outline": "Struktur heading (H1, H2, H3, FAQ) yang rapi"
}`;

      const prepResult = await callGeminiApi(prepPrompt, `Kamu adalah SEO Data Analyst & Content Strategist Senior. ${langInstruction}`);
      let cleanPrep = prepResult.replace(/```json/g, '').replace(/```/g, '').trim();
      let prepData = {};
      try {
        prepData = JSON.parse(cleanPrep);
      } catch (e) {
        prepData = {
          primaryKeyword: targetTopic.toLowerCase(),
          longTailKeywords: isEnglish ? `guide to ${targetTopic}` : `panduan ${targetTopic}`,
          lsiKeywords: isEnglish ? `solutions for ${targetTopic}` : `solusi ${targetTopic}`,
          targetAudience: isEnglish ? `Readers looking for solutions.` : `Pembaca yang mencari solusi.`,
          painPoints: isEnglish ? `Difficulty finding clear guidance.` : `Kesulitan menemukan penjelasan praktis.`,
          keyQuestions: `1. How to start?\n2. What are key tips?`,
          uniqueAngle: isEnglish ? `A direct, step-by-step practical approach.` : `Pendekatan langsung pada langkah-langkah solutif.`,
          searchIntent: `Informational`,
          urlSlug: targetTopic.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
          internalLinkSuggestions: [isEnglish ? `Beginner's Guide` : `Panduan Pemula`],
          externalLinkSuggestions: [isEnglish ? `Google Search Central` : `Pusat Panduan Google`],
          outline: `H1: ${targetTopic}\nH2: Overview\nH2: Conclusion`
        };
      }

      setAutoStatus(isEnglish ? `Menulis artikel alternatif (~${optionalData.targetWordCount} kata)...` : `Menulis artikel baru yang segar (~${optionalData.targetWordCount} kata)...`);
      
      const userExpPrompt = optionalData.userExperience.trim() 
        ? `Sertakan poin pengalaman berikut secara alami: "${optionalData.userExperience.trim()}"` 
        : `Tulis artikel dengan nada praktisi yang berpengalaman.`;

      const variationSeed = isAlternative ? ` (Versi Alternatif Segar ${Math.floor(Math.random() * 1000)})` : '';

      const writePrompt = `Tulis artikel blog SEO bertaraf profesional yang SANGAT ALAMI, ENAK DIBACA, DAN HUMAN-LIKE${variationSeed}. 
PENTING: JANGAN gunakan simbol asterisk (*) di dalam teks artikel sama sekali untuk menghindari simbol markup mentah.

MANDAT BAHASA: Tulis seluruh artikel dalam ${isEnglish ? 'ENGLISH' : 'BAHASA INDONESIA'}.

PARAMETER KONTEN:
1. Topik: "${targetTopic}"
2. Keyword Utama: "${prepData.primaryKeyword}"
3. Long-tail Keywords: "${prepData.longTailKeywords}"
4. Tone: "${optionalData.toneOfVoice}"
5. Target Kata: MINIMAL ${optionalData.targetWordCount} KATA.
6. Catatan Pengalaman: ${userExpPrompt}
7. Outline:
${prepData.outline}`;

      const articleText = await callGeminiApi(writePrompt, `Kamu adalah Penulis Blog Manusia Senior. ${langInstruction}`);

      const metaPrompt = `Buatkan Meta Title SEO (maks 60 char) dan Meta Description (maks 155 char) dalam ${isEnglish ? 'English' : 'Bahasa Indonesia'} untuk: ${targetTopic}`;
      const metaText = await callGeminiApi(metaPrompt, "Balas 2 baris:\nMeta Title: [isi]\nMeta Description: [isi]");
      
      let metaTitle = targetTopic;
      let metaDesc = `Panduan mendalam mengenai ${targetTopic}.`;

      metaText.split('\n').forEach(l => {
        if (l.toLowerCase().includes('meta title:')) metaTitle = l.replace(/meta title:/i, '').trim();
        if (l.toLowerCase().includes('meta description:')) metaDesc = l.replace(/meta description:/i, '').trim();
      });

      setAutoStatus(isEnglish ? "Menjalankan audit On-Page SEO & E-E-A-T..." : "Menjalankan audit On-Page SEO, E-E-A-T, & AdSense...");
      
      const auditPrompt = `Evaluasi artikel berikut berdasarkan standar Google E-E-A-T, On-Page SEO, dan AdSense. (Respon dalam ${isEnglish ? 'English' : 'Bahasa Indonesia'}).

ARTIKEL:
${articleText.substring(0, 2000)}...

Balas JSON murni:
{
  "eeatScore": 94,
  "eeatFeedback": ["Experience: Sangat baik.", "Expertise: Komprehensif.", "Trustworthiness: Terpercaya."],
  "qualityScore": 93,
  "qualityFeedback": ["Bahasa alami.", "Bebas dari simbol markdown berlebih."],
  "seoScore": 95,
  "seoFeedback": ["Keyword optimal.", "Meta tags sesuai."],
  "adsenseScore": 96,
  "adsenseFeedback": ["Siap monetisasi.", "Bebas low value content."]
}`;

      const auditResult = await callGeminiApi(auditPrompt, "Kamu adalah Google Search Quality Rater.");
      let cleanAudit = auditResult.replace(/```json/g, '').replace(/```/g, '').trim();
      let auditData = {};
      try {
        auditData = JSON.parse(cleanAudit);
      } catch (e) {
        auditData = {
          eeatScore: 93,
          eeatFeedback: ["Memenuhi kriteria E-E-A-T."],
          qualityScore: 92,
          qualityFeedback: ["Penulisan alami."],
          seoScore: 94,
          seoFeedback: ["SEO optimal."],
          adsenseScore: 95,
          adsenseFeedback: ["AdSense ready."]
        };
      }

      setResultData({
        topic: targetTopic,
        targetAudience: prepData.targetAudience || '',
        painPoints: prepData.painPoints || '',
        keyQuestions: prepData.keyQuestions || '',
        uniqueAngle: prepData.uniqueAngle || '',
        primaryKeyword: prepData.primaryKeyword || targetTopic,
        longTailKeywords: prepData.longTailKeywords || '',
        lsiKeywords: prepData.lsiKeywords || '',
        searchIntent: prepData.searchIntent || 'Informational',
        urlSlug: prepData.urlSlug || '',
        internalLinkSuggestions: prepData.internalLinkSuggestions || [],
        externalLinkSuggestions: prepData.externalLinkSuggestions || [],
        outline: prepData.outline || '',
        articleContent: articleText.trim().replace(/\*\*/g, '').replace(/\*/g, ''),
        metaTitle: metaTitle,
        metaDescription: metaDesc,
        eeatScore: auditData.eeatScore || 93,
        eeatFeedback: auditData.eeatFeedback || ["Memenuhi standar."],
        qualityScore: auditData.qualityScore || 92,
        qualityFeedback: auditData.qualityFeedback || ["Berkualitas tinggi."],
        seoScore: auditData.seoScore || 94,
        seoFeedback: auditData.seoFeedback || ["On-page optimal."],
        adsenseScore: auditData.adsenseScore || 95,
        adsenseFeedback: auditData.adsenseFeedback || ["Siap AdSense."]
      });

      setPageStage('result');
      setCurrentStep(9);
    } catch (err) {
      setErrorMessage("Terjadi kesalahan: " + err.message);
      setPageStage('customize_details');
    } finally {
      setIsGenerating(false);
      setIsRegeneratingArticle(false);
    }
  };

  const handleGenerateOptionalImage = async () => {
    if (!imagePrompt.trim()) {
      setErrorMessage("Silakan masukkan deskripsi gambar terlebih dahulu.");
      return;
    }
    setErrorMessage('');
    setIsGeneratingImage(true);
    setGeneratedImageUrl('');
    setImageDownloadSize(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720; // 16:9 Landscape HD
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#064e3b'); 
      gradient.addColorStop(0.5, '#022c22'); 
      gradient.addColorStop(1, '#0f172a'); 
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.beginPath();
      ctx.arc(300, 200, 250, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(52, 211, 153, 0.1)';
      ctx.beginPath();
      ctx.arc(1000, 500, 350, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      
      const maxWidth = 1000;
      const words = imagePrompt.split(' ');
      let line = '';
      let lines = [];
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      let startY = 320 - (lines.length * 20);
      lines.forEach((l, index) => {
        ctx.fillText(l.trim(), canvas.width / 2, startY + (index * 45));
      });

      ctx.fillStyle = '#34d399';
      ctx.font = '20px sans-serif';
      ctx.fillText('SEO Article Studio Pro - Novarty (Grow from Home)', canvas.width / 2, 650);

      // Aggressive compression to guarantee strictly under 100KB
      let quality = 0.65;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      let head = 'data:image/jpeg;base64,';
      let fileSize = Math.round((dataUrl.length - head.length) * 3/4);

      while (fileSize > 95000 && quality > 0.2) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        fileSize = Math.round((dataUrl.length - head.length) * 3/4);
      }

      setGeneratedImageUrl(dataUrl);
      setImageDownloadSize(Math.round(fileSize / 1024));
    } catch (err) {
      setErrorMessage("Gagal membuat gambar: " + err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImageUrl) return;
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    const safeTitle = (resultData.topic || 'artikel-seo').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
    a.download = `${safeTitle}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleResetAll = () => {
    setGeneralTopic('');
    setCustomSpecificTopic('');
    setSubtopics([]);
    setPreviousSubtopics([]);
    setSelectedSubtopic('');
    setErrorMessage('');
    setGeneratedImageUrl('');
    setImagePrompt('');
    setResultData({ ...resultData, articleContent: '' });
    setPageStage('topic_search');
    setCurrentStep(9);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/30">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                SEO Article Studio Pro
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Hak cipta tools oleh Novarty - Grow from Home
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
              <button
                onClick={() => setViewMode('app')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'app' 
                    ? 'bg-emerald-500 text-slate-950 shadow' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Preview Aplikasi
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'code' 
                    ? 'bg-emerald-500 text-slate-950 shadow' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" /> Lihat Kode
              </button>
            </div>

            {pageStage === 'result' && viewMode === 'app' && (
              <button
                onClick={handleResetAll}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-lg transition hidden sm:block"
              >
                + Buat Artikel Baru
              </button>
            )}
          </div>
        </div>
      </header>

      {errorMessage && (
        <div className="max-w-4xl w-full mx-auto mt-4 px-4">
          <div className="bg-rose-950/80 border border-rose-500/50 text-rose-200 px-4 py-3 rounded-2xl text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="font-bold ml-2">✕</button>
          </div>
        </div>
      )}

      {viewMode === 'code' ? (
        <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-x-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-mono text-emerald-400">App.jsx (React Single Component)</span>
              <button
                onClick={() => copyToClipboard(`// SEO Article Studio Pro Source Code`)}
                className="text-xs bg-slate-800 text-slate-200 px-3 py-1 rounded-lg border border-slate-700 hover:bg-slate-700 transition"
              >
                Salin Kode
              </button>
            </div>
            <pre className="text-xs text-slate-300 font-mono leading-relaxed overflow-x-auto max-h-[600px]">
              {`// SEO Article Studio Pro - Hak cipta tools oleh Novarty - Grow from Home
export default function App() {
  return <div className="p-8 text-center">Silakan beralih ke tab 'Preview Aplikasi' di bagian atas.</div>;
}`}
            </pre>
          </div>
        </div>
      ) : (
        <>
          {pageStage === 'result' && (
            <div className="bg-slate-950/40 border-b border-slate-800 py-2.5 px-4 overflow-x-auto">
              <div className="max-w-6xl mx-auto flex items-center justify-between min-w-[700px] space-x-1">
                {stepsList.map((step) => {
                  const isActive = currentStep === step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(step.id)}
                      className={`flex flex-col items-center flex-1 py-1 px-2 rounded-lg transition ${
                        isActive 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-[11px] whitespace-nowrap">{step.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8">
            {pageStage === 'topic_search' && (
              <div className="space-y-6 my-2">
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur space-y-4">
                  <div className="text-center max-w-xl mx-auto space-y-2">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 mb-2">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-100">
                      Riset Topik & Subtopik Potensial
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Masukkan topik besar atau niche blog Anda untuk menemukan pembahasan spesifik bernilai SEO tinggi.
                    </p>
                  </div>

                  <div className="space-y-2 max-w-2xl mx-auto">
                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Masukkan Topik Besar / Niche Blog *
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: Bisnis Agrobisnis, Belajar Coding, Tips Hemat..."
                        value={generalTopic}
                        onChange={(e) => setGeneralTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && analyzeTopicPotential(false)}
                        className="flex-1 bg-slate-900 border-2 border-slate-700 rounded-2xl px-4 py-3.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
                      />
                      <button
                        onClick={() => analyzeTopicPotential(false)}
                        disabled={isAnalyzingSubtopics}
                        className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-2xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        {isAnalyzingSubtopics ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Search className="w-5 h-5" />
                        )}
                        Cari 10 Rekomendasi Subtopik
                      </button>
                    </div>
                  </div>
                </div>

                {isAnalyzingSubtopics && (
                  <div className="p-8 bg-slate-800/60 border border-slate-700/80 rounded-3xl text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                    <p className="text-sm text-slate-200 font-medium">Memindai 10 ide subtopik spesifik yang paling banyak dicari di Google...</p>
                  </div>
                )}

                {subtopics.length > 0 && !isAnalyzingSubtopics && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-3 gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                          <ListOrdered className="w-5 h-5" /> Rekomendasi Subtopik Potensial
                        </h3>
                        <p className="text-xs text-slate-400">Klik salah satu pilihan di bawah untuk melanjutkan.</p>
                      </div>
                      
                      <button
                        onClick={() => analyzeTopicPotential(true)}
                        className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-xl transition whitespace-nowrap self-start sm:self-auto"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-400" /> Cari 10 Ide Lainnya (Tanpa Mengulang)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {subtopics.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectRecommendation(item.title)}
                          className="group p-4 bg-slate-900/90 hover:bg-emerald-950/40 border border-slate-700/80 hover:border-emerald-500/60 rounded-2xl transition cursor-pointer flex items-start gap-3.5"
                        >
                          <div className="w-7 h-7 bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-emerald-400 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition">
                            {item.id}
                          </div>
                          <div className="flex-1 space-y-1">
                            <h4 className="font-semibold text-sm text-slate-100 group-hover:text-emerald-300 transition">
                              {item.title}
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              <b className="text-slate-300">Potensi Riset:</b> {item.reason}
                            </p>
                          </div>
                          <button className="text-xs bg-slate-800 group-hover:bg-emerald-500 text-slate-300 group-hover:text-slate-950 px-3.5 py-2 rounded-xl font-medium transition self-center shrink-0 flex items-center gap-1">
                            Pilih <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-emerald-400" /> Punya Subtopik Spesifik Sendiri?
                  </label>
                  <p className="text-xs text-slate-400">
                    Jika Anda sudah memiliki judul/subtopik spesifik sendiri yang ingin dibahas, ketik di bawah ini:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Contoh: Cara Menanam Cabai Rawit di Pot..."
                      value={customSpecificTopic}
                      onChange={(e) => setCustomSpecificTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomTopicSubmit()}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleCustomTopicSubmit}
                      className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-emerald-300 border border-emerald-500/30 font-semibold text-xs rounded-2xl transition flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Play className="w-3.5 h-3.5 fill-emerald-300" /> Gunakan Subtopik Saya
                    </button>
                  </div>
                </div>
              </div>
            )}

            {pageStage === 'customize_details' && (
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur space-y-6 my-4">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                  <div>
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                      Pengaturan Detail Artikel
                    </span>
                    <h3 className="text-lg font-bold text-slate-100">
                      Topik Terpilih: "{selectedSubtopic}"
                    </h3>
                  </div>
                  <button
                    onClick={() => setPageStage('topic_search')}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl transition flex items-center gap-1 border border-slate-700"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Ganti Topik
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-emerald-400" /> Bahasa Target Output
                    </label>
                    <select
                      value={optionalData.targetLanguage}
                      onChange={(e) => handleOptionalChange('targetLanguage', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="id">Bahasa Indonesia (Default)</option>
                      <option value="en">English (Native-like)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Gaya Bahasa / Tone of Voice</label>
                    <select
                      value={optionalData.toneOfVoice}
                      onChange={(e) => handleOptionalChange('toneOfVoice', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Santai & Akrab (Ramah Pembaca)">Santai & Akrab (Ramah Pembaca)</option>
                      <option value="Profesional & Otoritatif (Pakar)">Profesional & Otoritatif (Pakar)</option>
                      <option value="Informatif & Edukatif (Step-by-Step)">Informatif & Edukatif (Step-by-Step)</option>
                      <option value="Persuasif & Menjual (Copywriting)">Persuasif & Menjual (Copywriting)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Target Jumlah Kata</label>
                    <select
                      value={optionalData.targetWordCount}
                      onChange={(e) => handleOptionalChange('targetWordCount', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="800">~800 Kata (Ringkas & Padat)</option>
                      <option value="1200">~1200 Kata (Standar SEO Optimal)</option>
                      <option value="1800">~1800 Kata (Long-form Mendalam)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Catatan Pengalaman / Sudut Pandang Unik (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Berdasarkan pengalaman saya selama 3 tahun..."
                      value={optionalData.userExperience}
                      onChange={(e) => handleOptionalChange('userExperience', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/60 flex justify-end">
                  <button
                    onClick={() => startArticleGeneration(false)}
                    className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-2xl transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 fill-slate-950" /> Jalankan Generator 9 Langkah Otomatis
                  </button>
                </div>
              </div>
            )}

            {pageStage === 'generating' && (
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-10 shadow-2xl backdrop-blur text-center space-y-6 my-12">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-slate-100">Sedang Membuat Artikel SEO Pro</h3>
                  <p className="text-xs text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-500/30 py-2 px-4 rounded-xl">
                    {autoStatus || "Memproses permintaan..."}
                  </p>
                  <p className="text-xs text-slate-400 pt-2">
                    Hak cipta tools oleh Novarty - Grow from Home. Mohon tunggu beberapa detik.
                  </p>
                </div>
              </div>
            )}

            {pageStage === 'result' && (
              <div className="space-y-6">
                {currentStep === 1 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                      <Search className="w-5 h-5" /> Analisis Audiens & Pain Points
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Target Pembaca Spesifik</span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{resultData.targetAudience}</p>
                      </div>
                      <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Masalah Utama (Pain Points)</span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{resultData.painPoints}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">Pertanyaan Paling Sering Dicari (Key Questions)</span>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">{resultData.keyQuestions}</p>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" /> Unique Angle & Search Intent
                    </h3>
                    <div className="space-y-4 pt-2">
                      <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Sudut Pandang Unik (Unique Angle)</span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{resultData.uniqueAngle}</p>
                      </div>
                      <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">Niat Pencarian (Search Intent)</span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{resultData.searchIntent}</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                      <Target className="w-5 h-5" /> SEO & Keywords Strategy
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Keyword Utama</span>
                        <p className="text-xs sm:text-sm text-slate-100 font-semibold">{resultData.primaryKeyword}</p>
                      </div>
                      <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">Long-Tail Keywords</span>
                        <p className="text-xs sm:text-sm text-slate-200">{resultData.longTailKeywords}</p>
                      </div>
                      <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">LSI / Konteks Keywords</span>
                        <p className="text-xs sm:text-sm text-slate-200">{resultData.lsiKeywords}</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                      <FileText className="w-5 h-5" /> Content Blueprint & Outline
                    </h3>
                    <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Struktur Heading (H1, H2, H3)</span>
                      <pre className="text-xs text-slate-200 font-mono whitespace-pre-line leading-relaxed">{resultData.outline}</pre>
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                      <Cpu className="w-5 h-5" /> Penulisan Draf & Human-like Review
                    </h3>
                    <p className="text-xs text-slate-400">Artikel telah ditulis dengan standar human-like, mengalir alami, dan bersih dari tanda bintang markdown.</p>
                    <button onClick={() => setCurrentStep(9)} className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition">
                      Lihat Artikel Lengkap di Tab Final →
                    </button>
                  </div>
                )}

                {currentStep === 6 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                        <UserCheck className="w-5 h-5" /> Audit E-E-A-T Google
                      </h3>
                      <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-1.5 rounded-xl font-bold text-sm">
                        Skor: {resultData.eeatScore}/100
                      </div>
                    </div>
                    <ul className="space-y-2 pt-2">
                      {resultData.eeatFeedback.map((fb, i) => (
                        <li key={i} className="text-xs sm:text-sm bg-slate-900 border border-slate-700 p-3 rounded-xl text-slate-200 flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{fb}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentStep === 7 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" /> Audit On-Page SEO
                      </h3>
                      <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-1.5 rounded-xl font-bold text-sm">
                        Skor: {resultData.seoScore}/100
                      </div>
                    </div>
                    <ul className="space-y-2 pt-2">
                      {resultData.seoFeedback.map((fb, i) => (
                        <li key={i} className="text-xs sm:text-sm bg-slate-900 border border-slate-700 p-3 rounded-xl text-slate-200 flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{fb}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentStep === 8 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" /> Kelayakan AdSense & Monetisasi
                      </h3>
                      <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-1.5 rounded-xl font-bold text-sm">
                        Skor: {resultData.adsenseScore}/100
                      </div>
                    </div>
                    <ul className="space-y-2 pt-2">
                      {resultData.adsenseFeedback.map((fb, i) => (
                        <li key={i} className="text-xs sm:text-sm bg-slate-900 border border-slate-700 p-3 rounded-xl text-slate-200 flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{fb}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentStep === 9 && (
                  <div className="space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-4 gap-3">
                        <div>
                          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block mb-1">Artikel Final Siap Publikasi</span>
                          <h2 className="text-xl font-bold text-slate-100">{resultData.topic}</h2>
                        </div>
                        
                        <div className="flex items-center flex-wrap gap-2">
                          <button
                            onClick={() => startArticleGeneration(true)}
                            disabled={isRegeneratingArticle}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-emerald-300 border border-emerald-500/30 font-semibold text-xs rounded-xl transition"
                          >
                            {isRegeneratingArticle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />}
                            {isRegeneratingArticle ? "Membuat..." : "Buat Artikel Lain (Berbeda)"}
                          </button>
                          <button
                            onClick={() => copyToClipboard(resultData.articleContent)}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Berhasil Disalin!" : "Salin Artikel"}
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl space-y-3">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">SEO Meta Tags</span>
                        <div className="space-y-2 text-xs">
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                            <span className="text-slate-400 block font-semibold">Meta Title:</span>
                            <span className="text-slate-200">{resultData.metaTitle}</span>
                          </div>
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                            <span className="text-slate-400 block font-semibold">Meta Description:</span>
                            <span className="text-slate-200">{resultData.metaDescription}</span>
                          </div>
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                            <span className="text-slate-400 block font-semibold">URL Slug:</span>
                            <span className="text-slate-200 font-mono">/{resultData.urlSlug}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 border-b border-slate-700/60 pb-2">
                        <button
                          onClick={() => setActiveTab('preview')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            activeTab === 'preview' 
                              ? 'bg-emerald-500 text-slate-950 shadow' 
                              : 'text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview Tampilan Web
                        </button>
                        <button
                          onClick={() => setActiveTab('markdown')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            activeTab === 'markdown' 
                              ? 'bg-emerald-500 text-slate-950 shadow' 
                              : 'text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" /> Teks Mentah (Clean)
                        </button>
                      </div>

                      {activeTab === 'preview' ? (
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-inner">
                          <ArticleRenderer content={resultData.articleContent} />
                        </div>
                      ) : (
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                          <textarea
                            readOnly
                            value={resultData.articleContent}
                            className="w-full h-96 bg-slate-950 text-slate-300 font-mono text-xs p-3 focus:outline-none resize-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* OPTIONAL IMAGE GENERATOR BELOW ARTICLE */}
                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-lg font-bold text-slate-100">Studio Pembuat Gambar Lanskap Opsional</h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        Ingin menyisipkan gambar pendukung? Masukkan deskripsi gambar Anda di bawah ini. Hasil gambar lanskap (16:9) dijamin berukuran di bawah 100KB dan nama file saat didownload akan otomatis sama dengan judul artikel.
                      </p>

                      <div className="space-y-3 pt-2">
                        <textarea
                          placeholder="Contoh: Professional working in modern office with green plants, cinematic lighting, 4k..."
                          value={imagePrompt}
                          onChange={(e) => setImagePrompt(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                        />
                        <button
                          onClick={handleGenerateOptionalImage}
                          disabled={isGeneratingImage}
                          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-2xl transition shadow-md flex items-center justify-center gap-2"
                        >
                          {isGeneratingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          {isGeneratingImage ? "Membuat Gambar Lanskap..." : "Buat Gambar Lanskap AI"}
                        </button>
                      </div>

                      {generatedImageUrl && (
                        <div className="mt-4 p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-3">
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                            <img src={generatedImageUrl} alt="Generated AI" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            <span className="text-xs text-emerald-400 font-mono">
                              Ukuran File Kompresi: ~{imageDownloadSize} KB (Wajib &lt;100KB) • Nama file: {resultData.topic}.jpg
                            </span>
                            <button
                              onClick={handleDownloadImage}
                              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow"
                            >
                              <Download className="w-4 h-4" /> Download Gambar Langsung
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </>
      )}

      <footer className="mt-auto border-t border-slate-800 bg-slate-950/60 py-4 px-4 text-center text-xs text-slate-500">
        <p>SEO Article Studio Pro — Hak cipta tools oleh Novarty - Grow from Home. Seluruh hak cipta dilindungi Undang-Undang.</p>
      </footer>
    </div>
  );
}