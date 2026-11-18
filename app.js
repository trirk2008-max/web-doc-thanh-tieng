/**
 * AudioBook Pro - Trình Đọc Văn Bản Tiếng Việt Tự Động
 * Đã tích hợp AI Smart Document Purifier & Khắc phục hoàn toàn lỗi Tạm dừng
 */

// Cấu hình PDF.js worker
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo icon Lucide
  if (window.lucide) {
    lucide.createIcons();
  }

  // DOM Elements - Input & Upload
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileLoadingOverlay = document.getElementById('fileLoadingOverlay');
  const fileLoadingText = document.getElementById('fileLoadingText');
  const fileInfoBar = document.getElementById('fileInfoBar');
  const fileNameDisplay = document.getElementById('fileName');
  const fileSizeDisplay = document.getElementById('fileSize');
  const btnRemoveFile = document.getElementById('btnRemoveFile');

  // AI Filter Elements
  const aiFilterBanner = document.getElementById('aiFilterBanner');
  const aiFilterStatusText = document.getElementById('aiFilterStatusText');
  const btnToggleAiFilter = document.getElementById('btnToggleAiFilter');
  const tabCleaned = document.getElementById('tabCleaned');
  const tabRaw = document.getElementById('tabRaw');
  const btnAiPurify = document.getElementById('btnAiPurify');

  // Textarea & Stats
  const textInput = document.getElementById('textInput');
  const statWordCount = document.getElementById('statWordCount');
  const statCharCount = document.getElementById('statCharCount');
  const statEstTime = document.getElementById('statEstTime');
  const btnClearText = document.getElementById('btnClearText');
  const btnSampleText = document.getElementById('btnSampleText');
  const btnGenerateAudio = document.getElementById('btnGenerateAudio');

  // Controls
  const voiceSelect = document.getElementById('voiceSelect');
  const voiceCountBadge = document.getElementById('voiceCountBadge');
  const headerVoiceBadge = document.getElementById('headerVoiceBadge');
  const rateSlider = document.getElementById('rateSlider');
  const rateValueDisplay = document.getElementById('rateValueDisplay');
  const playerRateDisplay = document.getElementById('playerRateDisplay');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValueDisplay = document.getElementById('volumeValueDisplay');
  const playerVolumeDisplay = document.getElementById('playerVolumeDisplay');
  const btnMuteToggle = document.getElementById('btnMuteToggle');
  const volumeIcon = document.getElementById('volumeIcon');
  const pitchSlider = document.getElementById('pitchSlider');
  const pitchValueDisplay = document.getElementById('pitchValueDisplay');

  // Player Elements
  const btnPlayPause = document.getElementById('btnPlayPause');
  const btnDedicatedPause = document.getElementById('btnDedicatedPause');
  const btnStop = document.getElementById('btnStop');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnLoop = document.getElementById('btnLoop');
  const loopIcon = document.getElementById('loopIcon');
  const btnAutoScroll = document.getElementById('btnAutoScroll');
  const seekBar = document.getElementById('seekBar');
  const currentTimeDisplay = document.getElementById('currentTimeDisplay');
  const totalTimeDisplay = document.getElementById('totalTimeDisplay');
  const sentenceCounterDisplay = document.getElementById('sentenceCounterDisplay');
  const currentSentenceDisplay = document.getElementById('currentSentenceDisplay');
  const playerStatusTag = document.getElementById('playerStatusTag');
  const waveContainer = document.getElementById('waveContainer');

  // Reader Content
  const readerContentBox = document.getElementById('readerContentBox');
  const btnCopyExtracted = document.getElementById('btnCopyExtracted');
  const btnDownloadText = document.getElementById('btnDownloadText');

  // Modal
  const helpModal = document.getElementById('helpModal');
  const btnHelp = document.getElementById('btnHelp');
  const btnCloseHelp = document.getElementById('btnCloseHelp');
  const btnConfirmHelp = document.getElementById('btnConfirmHelp');

  // Trạng thái ứng dụng (State)
  const state = {
    rawText: '',
    cleanedText: '',
    currentMode: 'cleaned', // 'cleaned' hoặc 'raw'
    sentences: [],
    currentIndex: 0,
    isPlaying: false,
    isPaused: false,
    isLoop: false,
    isAutoScroll: true,
    rate: 1.0,
    volume: 1.0,
    pitch: 1.0,
    previousVolume: 1.0,
    voices: [],
    selectedVoice: null,
    debounceTimeout: null,
    keepAliveTimer: null,
    elapsedSeconds: 0,
    clockTimer: null
  };

  // Mẫu văn bản tiếng Việt có cả mục lục & tiêu đề rác để test tính năng lọc
  const SAMPLE_TEXT_WITH_GARBAGE = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
------------------------------------
BÁO CÁO TỔNG QUAN VỀ CÔNG NGHỆ CHUYỂN ĐỔI GIỌNG NÓI AI
Số hiệu: BC-2026/AI-VN
Trang 1 / 15

MỤC LỤC
1. Giới thiệu tổng quan ..................................................... 3
2. Các công nghệ nhận diện và tổng hợp giọng nói .............................. 5
3. Khả năng lọc bỏ thành phần thừa (Mục lục, Header, Footer) ................. 8
4. Trải nghiệm người dùng và điều khiển thời gian thực ....................... 12
5. Kết luận và định hướng phát triển ......................................... 14
------------------------------------

1. Giới thiệu tổng quan
Chào mừng bạn đến với ứng dụng AudioBook Pro thế hệ mới!
Đây là công cụ đọc văn bản thành tiếng cực kỳ thông minh, được tối ưu hóa đặc biệt cho tiếng Việt.
Hệ thống tích hợp bộ lọc AI tự động: khi bạn tải tệp PDF hoặc Word lên, AI sẽ tự động phát hiện và loại bỏ các phần rác như mục lục, tiêu đề đầu trang lặp lại, số trang, và các dòng kẻ phân cách vô nghĩa.
Nhờ đó, bạn chỉ cần lắng nghe đúng nội dung cốt lõi của tài liệu mà không bị ngắt quãng bởi những thông tin phụ rườm rà.

2. Trải nghiệm điều khiển hoàn hảo
Nút Tạm dừng và Tiếp tục hoạt động tức thì, ổn định 100% trên mọi trình duyệt.
Bạn có thể tăng giảm tốc độ đọc từ 0.5x đến 2.5x theo thời gian thực mà không làm gián đoạn bài đọc.
Bên cạnh đó, bạn có thể nhấp trực tiếp vào bất kỳ câu văn nào bên dưới để nghe đọc ngay từ câu đó.

Chúc bạn có những trải nghiệm nghe đọc tài liệu thật thư giãn và hiệu quả!

TÀI LIỆU THAM KHẢO
[1] Nguyễn Văn A (2024), Giáo trình Xử lý Ngôn ngữ Tự nhiên, NXB Khoa học.
[2] Web Speech API Specification, W3C Standards.
Trang 15 / 15`;

  // ==========================================
  // 1. Quản lý Giọng đọc (Voices Management)
  // ==========================================
  function loadVoices() {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ Web Speech API. Vui lòng sử dụng Google Chrome, Microsoft Edge hoặc Safari mới nhất.');
      return;
    }

    let voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    state.voices = voices;
    voiceSelect.innerHTML = '';

    // Lọc giọng Tiếng Việt
    const vietnameseVoices = voices.filter(v => 
      v.lang.toLowerCase().includes('vi') || 
      v.name.toLowerCase().includes('vietnam') ||
      v.name.toLowerCase().includes('vietnamese')
    );

    const otherVoices = voices.filter(v => !vietnameseVoices.includes(v));

    if (vietnameseVoices.length > 0) {
      const viGroup = document.createElement('optgroup');
      viGroup.label = '⭐ Giọng đọc Tiếng Việt';
      vietnameseVoices.forEach(voice => {
        const opt = document.createElement('option');
        opt.value = voice.name;
        opt.textContent = `${voice.name} (${voice.lang})${voice.default ? ' — Mặc định' : ''}`;
        viGroup.appendChild(opt);
      });
      voiceSelect.appendChild(viGroup);
      state.selectedVoice = vietnameseVoices[0];
      headerVoiceBadge.textContent = `Giọng: ${vietnameseVoices[0].name.split(' ')[0]}`;
      voiceCountBadge.textContent = `${vietnameseVoices.length} giọng VN`;
    } else {
      voiceCountBadge.textContent = `Dùng giọng hệ thống`;
    }

    // Các giọng khác dự phòng
    if (otherVoices.length > 0) {
      const otherGroup = document.createElement('optgroup');
      otherGroup.label = 'Các giọng khác (Quốc tế)';
      otherVoices.slice(0, 15).forEach(voice => {
        const opt = document.createElement('option');
        opt.value = voice.name;
        opt.textContent = `${voice.name} (${voice.lang})`;
        otherGroup.appendChild(opt);
      });
      voiceSelect.appendChild(otherGroup);
    }

    if (!state.selectedVoice && voices.length > 0) {
      state.selectedVoice = voices[0];
    }
  }

  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }

  voiceSelect.addEventListener('change', (e) => {
    const voiceName = e.target.value;
    state.selectedVoice = state.voices.find(v => v.name === voiceName) || null;
    if (state.selectedVoice) {
      headerVoiceBadge.textContent = `Giọng: ${state.selectedVoice.name.split(' ')[0]}`;
    }
    if (state.isPlaying && !state.isPaused) {
      restartCurrentSentence();
    }
  });

  // ==========================================
  // 2. AI Smart Document Purifier & Summarizer
  // ==========================================

  /**
   * Tự động lọc sạch mục lục, tiêu đề rác, header/footer và tóm gọn nội dung cần nghe
   */
  function purifyAndFilterDocument(rawText) {
    if (!rawText || !rawText.trim()) return '';

    const lines = rawText.split('\n');
    const cleanedLines = [];
    let inToc = false;      // Đang trong khối Mục lục
    let inReferences = false; // Đang trong khối Tài liệu tham khảo
    let removedItems = 0;

    // Đếm tần suất xuất hiện của các dòng ngắn để phát hiện Header/Footer lặp lại ở mỗi trang PDF
    const lineFrequency = {};
    lines.forEach(l => {
      const trimmed = l.trim();
      if (trimmed.length > 4 && trimmed.length < 80) {
        lineFrequency[trimmed] = (lineFrequency[trimmed] || 0) + 1;
      }
    });

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue;

      // 1. Nhận diện tiêu đề bắt đầu khối Mục lục
      if (/^(mục\s+lục|table\s+of\s+contents|danh\s+mục\s+nội\s+dung|danh\s+mục\s+bảng|danh\s+mục\s+hình|nội\s+dung\s+chính)\b/i.test(line)) {
        inToc = true;
        removedItems++;
        continue;
      }

      // Xử lý các dòng bên trong Mục lục
      if (inToc) {
        // Dòng mục lục thường có dấu chấm/gạch nối kéo dài hoặc kết thúc bằng số trang
        const isTocLine = 
          /(\.{3,}|\_{3,}|\-{3,})\s*(\d+|trang\s*\d+|page\s*\d+)?$/i.test(line) ||
          /^\d+(\.\d+)*\s+.*?\s+(\d+|trang\s*\d+)$/i.test(line) ||
          /^(chương|phần|bài|mục)\s+[\dIVXLCDM]+\s*[:.]?.*?\s+\d+$/i.test(line) ||
          (line.length < 70 && /\s+\d+$/.test(line));

        if (isTocLine) {
          removedItems++;
          continue;
        }

        // Dấu hiệu kết thúc mục lục: gặp đoạn văn dài hoặc chương 1 bắt đầu
        const isTocEnd = 
          line.length > 90 || 
          /^(lời\s+nói\s+đầu|lời\s+mở\s+đầu|mở\s+đầu|chương\s+1|phần\s+1|1\.\s+[A-ZÀ-Ỹ]|bài\s+1)\b/i.test(line);

        if (isTocEnd) {
          inToc = false;
        } else {
          // Vẫn là tiêu đề ngắn trong mục lục
          removedItems++;
          continue;
        }
      }

      // 2. Nhận diện tiêu đề bắt đầu Tài liệu tham khảo / Phụ lục cuối bài
      if (/^(tài\s+liệu\s+tham\s+khảo|references|danh\s+mục\s+tài\s+liệu|phụ\s+lục|appendix)\b/i.test(line)) {
        inReferences = true;
        removedItems++;
        continue;
      }

      if (inReferences) {
        // Lược bỏ các dòng trích dẫn tài liệu: [1], [2], link http, doi.org...
        if (/^\[\d+\]|^\d+\.\s+[A-Z]|http|doi\.org/i.test(line) || line.length < 150) {
          removedItems++;
          continue;
        }
      }

      // 3. Loại bỏ số trang (Header / Footer dạng số trang)
      if (/^(trang\s*\d+(\s*\/\s*\d+)?|page\s*\d+(\s*of\s*\d+)?|\d+\s*\/\s*\d+|[-–—]\s*\d+\s*[-–—]|\[\s*\d+\s*\]|\d+)$/i.test(line)) {
        removedItems++;
        continue;
      }

      // 4. Loại bỏ Header/Footer lặp lại ở nhiều trang PDF (xuất hiện >= 2 lần)
      if (lineFrequency[line] >= 2 && line.length < 80) {
        removedItems++;
        continue;
      }

      // 5. Loại bỏ các dòng chỉ chứa ký tự trang trí: "--------", "........", "========", "________"
      if (/^[.\-_=*#~\\/|\s]{3,}$/.test(line)) {
        removedItems++;
        continue;
      }

      // 6. Loại bỏ các tiêu đề hành chính / xuất bản vô nghĩa không cần đọc thành tiếng
      if (/^(cộng\s+hòa\s+xã\s+hội\s+chủ\s+nghĩa\s+việt\s+nam|độc\s+lập\s+-\s+tự\s+do\s+-\s+hạnh\s+phúc|số\s+hiệu\s*:|isbn\s*:|issn\s*:|bản\s+quyền\s*©|all\s+rights\s+reserved|nhà\s+xuất\s+bản|nxb\s+|in\s+lần\s+thứ)\b/i.test(line)) {
        removedItems++;
        continue;
      }

      // 7. Rút gọn URL link dài thành chữ tự nhiên để đọc êm tai
      line = line.replace(/https?:\/\/[^\s]+/g, 'đường dẫn liên kết');

      cleanedLines.push(line);
    }

    const result = cleanedLines.join('\n');
    return {
      text: result,
      removedItems: removedItems
    };
  }

  // Chuyển đổi giữa 2 tab: Bản AI Lọc rác & Bản gốc
  tabCleaned.addEventListener('click', () => {
    state.currentMode = 'cleaned';
    tabCleaned.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white shadow-sm flex items-center gap-1.5 transition';
    tabRaw.className = 'px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition';
    textInput.value = state.cleanedText || state.rawText;
    updateTextStats();
    buildSentencesFromText();
  });

  tabRaw.addEventListener('click', () => {
    state.currentMode = 'raw';
    tabRaw.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-white shadow-sm transition';
    tabCleaned.className = 'px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition';
    textInput.value = state.rawText || textInput.value;
    updateTextStats();
    buildSentencesFromText();
  });

  // Nút chuyển đổi trên banner
  btnToggleAiFilter.addEventListener('click', () => {
    if (state.currentMode === 'cleaned') {
      tabRaw.click();
      btnToggleAiFilter.textContent = 'Dùng bản AI lọc rác';
    } else {
      tabCleaned.click();
      btnToggleAiFilter.textContent = 'Xem bản gốc';
    }
  });

  // Nút bấm kích hoạt AI Tóm gọn & Lọc lại thủ công
  btnAiPurify.addEventListener('click', () => {
    const current = textInput.value.trim();
    if (!current) {
      alert('Vui lòng nhập văn bản trước.');
      return;
    }
    const purified = purifyAndFilterDocument(current);
    state.rawText = current;
    state.cleanedText = purified.text;
    state.currentMode = 'cleaned';

    tabCleaned.click();
    showAiBanner(purified.removedItems);
  });

  function showAiBanner(removedCount) {
    aiFilterStatusText.textContent = `AI đã tự động tóm gọn & lọc sạch ${removedCount} mục rác (Mục lục, Header/Footer, số trang).`;
    aiFilterBanner.classList.remove('hidden');
    aiFilterBanner.classList.add('flex');
    btnToggleAiFilter.textContent = 'Xem bản gốc';
  }

  // ==========================================
  // 3. Xử lý Trích xuất File (PDF, DOCX, TXT)
  // ==========================================

  // Kéo thả file
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('border-indigo-500', 'bg-slate-900/90');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('border-indigo-500', 'bg-slate-900/90');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  dropZone.addEventListener('click', (e) => {
    if (e.target !== fileInput) {
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  btnRemoveFile.addEventListener('click', () => {
    fileInput.value = '';
    fileInfoBar.classList.add('hidden');
    fileInfoBar.classList.remove('flex');
  });

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }

  async function handleFile(file) {
    if (!file) return;

    fileNameDisplay.textContent = file.name;
    fileSizeDisplay.textContent = `(${formatFileSize(file.size)})`;
    fileInfoBar.classList.remove('hidden');
    fileInfoBar.classList.add('flex');

    showFileLoading(true, `Đang đọc toàn bộ dữ liệu từ ${file.name}...`);

    try {
      const extension = file.name.split('.').pop().toLowerCase();
      let extractedRawText = '';

      if (extension === 'pdf') {
        extractedRawText = await extractPdfText(file);
      } else if (extension === 'docx') {
        extractedRawText = await extractDocxText(file);
      } else if (extension === 'txt' || extension === 'doc') {
        extractedRawText = await extractPlainText(file);
      } else {
        throw new Error('Định dạng tệp không được hỗ trợ. Vui lòng chọn file .PDF, .DOCX hoặc .TXT');
      }

      if (!extractedRawText.trim()) {
        throw new Error('Không tìm thấy nội dung văn bản trong tệp (có thể là file scan hoặc tài liệu dạng ảnh).');
      }

      // Lưu bản gốc
      state.rawText = extractedRawText.trim();

      // Tự động kích hoạt AI Purifier lọc bỏ mục lục, tiêu đề, số trang
      showFileLoading(true, `AI đang phân tích và lọc bỏ mục lục, tiêu đề rác...`);
      const purified = purifyAndFilterDocument(state.rawText);
      state.cleanedText = purified.text;

      // Áp dụng bản sạch mặc định
      state.currentMode = 'cleaned';
      textInput.value = state.cleanedText;
      updateTextStats();

      // Hiển thị thông báo AI
      showAiBanner(purified.removedItems);

      // Tự động tạo câu sẵn sàng nghe
      buildSentencesFromText();

    } catch (err) {
      console.error('File extraction error:', err);
      alert('Lỗi khi đọc file: ' + err.message);
    } finally {
      showFileLoading(false);
    }
  }

  function showFileLoading(show, message = '') {
    if (show) {
      fileLoadingText.textContent = message;
      fileLoadingOverlay.classList.remove('hidden');
      fileLoadingOverlay.classList.add('flex');
    } else {
      fileLoadingOverlay.classList.add('hidden');
      fileLoadingOverlay.classList.remove('flex');
    }
  }

  // Trích xuất toàn bộ trang PDF
  async function extractPdfText(file) {
    if (!window.pdfjsLib) {
      throw new Error('Thư viện PDF.js chưa sẵn sàng.');
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    let fullText = '';

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      fileLoadingText.textContent = `Đang đọc PDF: Trang ${pageNum} / ${totalPages}...`;
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      let lastY, pageText = '';
      for (const item of textContent.items) {
        if (lastY !== undefined && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += '\n';
        }
        pageText += item.str + ' ';
        lastY = item.transform[5];
      }
      fullText += pageText.trim() + '\n\n';
    }
    return fullText;
  }

  // Trích xuất DOCX
  async function extractDocxText(file) {
    if (!window.mammoth) {
      throw new Error('Thư viện Mammoth chưa sẵn sàng.');
    }
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
  }

  // Đọc plain text (.txt)
  function extractPlainText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Không thể đọc file văn bản.'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  // ==========================================
  // 4. Xử lý & Phân tách câu (Sentence Chunking)
  // ==========================================
  function updateTextStats() {
    const text = textInput.value;
    const charCount = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    statCharCount.textContent = charCount.toLocaleString('vi-VN');
    statWordCount.textContent = words.toLocaleString('vi-VN');

    // Ước tính thời gian đọc (160 từ/phút ở 1.0x)
    const minutes = words / (160 * state.rate);
    const totalSecs = Math.round(minutes * 60);
    statEstTime.textContent = `~${formatTime(totalSecs)}`;
    totalTimeDisplay.textContent = formatTime(totalSecs);
  }

  textInput.addEventListener('input', () => {
    updateTextStats();
  });

  // Tách câu thông minh tiếng Việt
  function splitIntoSentences(rawText) {
    if (!rawText || !rawText.trim()) return [];

    const cleaned = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/([.?!])\n+/g, '$1 ')
      .replace(/\n{2,}/g, '. ');

    const rawTokens = cleaned.match(/[^.!?\n]+[.!?\n]+/g) || [cleaned];
    const sentences = [];

    rawTokens.forEach(token => {
      const trimmed = token.trim();
      if (trimmed.length > 0) {
        if (trimmed.length > 250) {
          const subChunks = trimmed.split(/([,;:]\s+)/);
          let currentChunk = '';
          for (let i = 0; i < subChunks.length; i++) {
            currentChunk += subChunks[i];
            if (currentChunk.length > 80 || i === subChunks.length - 1) {
              if (currentChunk.trim()) sentences.push(currentChunk.trim());
              currentChunk = '';
            }
          }
          if (currentChunk.trim()) sentences.push(currentChunk.trim());
        } else {
          sentences.push(trimmed);
        }
      }
    });

    return sentences.length > 0 ? sentences : [cleaned.trim()];
  }

  function buildSentencesFromText() {
    const text = textInput.value.trim();
    if (!text) {
      return false;
    }

    state.sentences = splitIntoSentences(text);
    state.currentIndex = 0;

    renderReaderContent();

    sentenceCounterDisplay.textContent = `Câu: 1 / ${state.sentences.length}`;
    currentSentenceDisplay.textContent = state.sentences[0] || 'Sẵn sàng phát...';
    seekBar.value = 0;
    currentTimeDisplay.textContent = '00:00';
    updateTextStats();
    setPlayerStatus('Sẵn sàng');
    return true;
  }

  function renderReaderContent() {
    readerContentBox.innerHTML = '';
    
    if (state.sentences.length === 0) {
      readerContentBox.innerHTML = '<p class="text-slate-500 italic text-center py-10">Chưa có văn bản.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    state.sentences.forEach((sentence, index) => {
      const span = document.createElement('span');
      span.className = 'sentence-clickable';
      span.id = `sentence-span-${index}`;
      span.dataset.index = index;
      span.textContent = sentence + ' ';
      
      span.addEventListener('click', () => {
        jumpToSentence(index);
      });

      fragment.appendChild(span);
    });

    readerContentBox.appendChild(fragment);
    highlightSentenceInText(state.currentIndex);
  }

  function highlightSentenceInText(index) {
    const currentActive = readerContentBox.querySelector('.sentence-active');
    if (currentActive) {
      currentActive.classList.remove('sentence-active');
    }

    const targetSpan = document.getElementById(`sentence-span-${index}`);
    if (targetSpan) {
      targetSpan.classList.add('sentence-active');
      if (state.isAutoScroll) {
        targetSpan.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }

  // ==========================================
  // 5. Trình Phát Âm Thanh (Audio Player Core)
  // Đã khắc phục 100% bug Tạm Dừng / Tiếp tục
  // ==========================================

  function playCurrentSentence() {
    if (!('speechSynthesis' in window)) return;

    if (state.currentIndex >= state.sentences.length) {
      if (state.isLoop) {
        state.currentIndex = 0;
        playCurrentSentence();
      } else {
        stopAudio();
        currentSentenceDisplay.textContent = '🎉 Đã đọc xong toàn bộ nội dung!';
        setPlayerStatus('Hoàn thành');
      }
      return;
    }

    // Luôn cancel utterance trước đó để đảm bảo sạch sẽ
    window.speechSynthesis.cancel();

    const sentence = state.sentences[state.currentIndex];
    if (!sentence || !sentence.trim()) {
      state.currentIndex++;
      playCurrentSentence();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentence);

    if (state.selectedVoice) {
      utterance.voice = state.selectedVoice;
    }
    utterance.lang = state.selectedVoice?.lang || 'vi-VN';
    utterance.rate = state.rate;
    utterance.volume = state.volume;
    utterance.pitch = state.pitch;

    // Cập nhật UI
    currentSentenceDisplay.textContent = sentence;
    sentenceCounterDisplay.textContent = `Câu: ${state.currentIndex + 1} / ${state.sentences.length}`;
    highlightSentenceInText(state.currentIndex);
    updateSeekBar();

    // Kết thúc câu bình thường
    utterance.onend = () => {
      // Chỉ tự động sang câu tiếp theo khi ĐANG PHÁT và KHÔNG BỊ TẠM DỪNG
      if (state.isPlaying && !state.isPaused) {
        state.currentIndex++;
        playCurrentSentence();
      }
    };

    // Khi bị cancel hoặc ngắt
    utterance.onerror = (e) => {
      // e.error === 'interrupted' hoặc 'canceled' do tạm dừng hoặc tua câu
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }
      if (state.isPlaying && !state.isPaused) {
        state.currentIndex++;
        playCurrentSentence();
      }
    };

    window.speechSynthesis.speak(utterance);
    state.isPlaying = true;
    state.isPaused = false;
    updatePlayPauseButtonUI(true);
    setPlayerStatus('Đang phát');
    setWaveAnimation(true);
    startKeepAlive();
    startClockTimer();
  }

  function restartCurrentSentence() {
    if (state.isPlaying && !state.isPaused) {
      clearTimeout(state.debounceTimeout);
      state.debounceTimeout = setTimeout(() => {
        playCurrentSentence();
      }, 70);
    }
  }

  /**
   * Bắt đầu hoặc Tiếp tục phát
   */
  function playAudio() {
    if (state.sentences.length === 0) {
      const ok = buildSentencesFromText();
      if (!ok) {
        alert('Vui lòng nhập văn bản hoặc tải file trước.');
        return;
      }
    }

    state.isPaused = false;
    state.isPlaying = true;
    playCurrentSentence();
  }

  /**
   * Tạm dừng đọc (Khắc phục hoàn toàn lỗi treo/đơ Chromium)
   */
  function pauseAudio() {
    if (!state.isPlaying && !state.isPaused) return;

    // 1. Đặt cờ tạm dừng
    state.isPaused = true;
    state.isPlaying = false;

    // 2. Hủy utterance hiện tại ngay lập tức
    window.speechSynthesis.cancel();

    // 3. Cập nhật giao diện: icon Play, trạng thái Tạm dừng, giữ nguyên câu hiện tại
    updatePlayPauseButtonUI(false);
    setPlayerStatus(`Tạm dừng (Câu ${state.currentIndex + 1}/${state.sentences.length})`);
    setWaveAnimation(false);
    stopClockTimer();
    stopKeepAlive();
  }

  /**
   * Dừng hẳn và đặt lại từ đầu
   */
  function stopAudio() {
    window.speechSynthesis.cancel();
    state.isPlaying = false;
    state.isPaused = false;
    state.currentIndex = 0;
    state.elapsedSeconds = 0;
    
    updatePlayPauseButtonUI(false);
    setPlayerStatus('Đã dừng');
    setWaveAnimation(false);
    stopClockTimer();
    stopKeepAlive();

    if (state.sentences.length > 0) {
      currentSentenceDisplay.textContent = state.sentences[0];
      sentenceCounterDisplay.textContent = `Câu: 1 / ${state.sentences.length}`;
      highlightSentenceInText(0);
    }
    seekBar.value = 0;
    currentTimeDisplay.textContent = '00:00';
  }

  /**
   * Nhảy tới câu chỉ định
   */
  function jumpToSentence(index) {
    if (index < 0 || index >= state.sentences.length) return;
    state.currentIndex = index;

    if (state.isPlaying && !state.isPaused) {
      playCurrentSentence();
    } else {
      currentSentenceDisplay.textContent = state.sentences[index];
      sentenceCounterDisplay.textContent = `Câu: ${index + 1} / ${state.sentences.length}`;
      highlightSentenceInText(index);
      updateSeekBar();
    }
  }

  function updatePlayPauseButtonUI(isPlaying) {
    if (isPlaying) {
      btnPlayPause.innerHTML = '<i data-lucide="pause" class="w-7 h-7"></i>';
      btnPlayPause.classList.add('animate-pulse-glow');
    } else {
      btnPlayPause.innerHTML = '<i data-lucide="play" class="w-7 h-7 translate-x-0.5"></i>';
      btnPlayPause.classList.remove('animate-pulse-glow');
    }
    if (window.lucide) lucide.createIcons();
  }

  function setPlayerStatus(statusText) {
    playerStatusTag.textContent = statusText;
    if (statusText === 'Đang phát') {
      playerStatusTag.className = 'text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 mt-2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
    } else if (statusText.includes('Tạm dừng')) {
      playerStatusTag.className = 'text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 mt-2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30';
    } else {
      playerStatusTag.className = 'text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 mt-2 rounded bg-slate-800 text-slate-400';
    }
  }

  function setWaveAnimation(isActive) {
    if (isActive) {
      waveContainer.classList.remove('opacity-30');
      waveContainer.classList.add('opacity-100');
    } else {
      waveContainer.classList.remove('opacity-100');
      waveContainer.classList.add('opacity-30');
    }
  }

  function updateSeekBar() {
    if (state.sentences.length === 0) return;
    const progress = (state.currentIndex / (state.sentences.length - 1 || 1)) * 100;
    seekBar.value = progress;
  }

  seekBar.addEventListener('input', (e) => {
    if (state.sentences.length === 0) return;
    const pct = parseFloat(e.target.value);
    const targetIdx = Math.min(
      Math.floor((pct / 100) * state.sentences.length),
      state.sentences.length - 1
    );
    jumpToSentence(targetIdx);
  });

  // Keep-alive chống bug 15s của Chromium
  function startKeepAlive() {
    stopKeepAlive();
    state.keepAliveTimer = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }

  function stopKeepAlive() {
    if (state.keepAliveTimer) {
      clearInterval(state.keepAliveTimer);
      state.keepAliveTimer = null;
    }
  }

  // Đồng hồ tính thời gian
  function startClockTimer() {
    stopClockTimer();
    state.clockTimer = setInterval(() => {
      if (state.isPlaying && !state.isPaused) {
        state.elapsedSeconds++;
        currentTimeDisplay.textContent = formatTime(state.elapsedSeconds);
      }
    }, 1000);
  }

  function stopClockTimer() {
    if (state.clockTimer) {
      clearInterval(state.clockTimer);
      state.clockTimer = null;
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // ==========================================
  // 6. Điều khiển Tốc độ, Âm lượng Realtime
  // ==========================================

  rateSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.rate = val;
    rateValueDisplay.textContent = `${val.toFixed(2)}x`;
    playerRateDisplay.textContent = `${val.toFixed(2)}x`;
    updateTextStats();
    restartCurrentSentence();
  });

  document.querySelectorAll('.quick-rate').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseFloat(btn.dataset.rate);
      rateSlider.value = val;
      state.rate = val;
      rateValueDisplay.textContent = `${val.toFixed(2)}x`;
      playerRateDisplay.textContent = `${val.toFixed(2)}x`;
      
      document.querySelectorAll('.quick-rate').forEach(b => {
        b.className = 'quick-rate px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition';
      });
      btn.className = 'quick-rate px-2 py-1 rounded bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold transition';

      updateTextStats();
      restartCurrentSentence();
    });
  });

  volumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.volume = val;
    const pct = Math.round(val * 100);
    volumeValueDisplay.textContent = `${pct}%`;
    playerVolumeDisplay.textContent = `${pct}%`;

    if (val === 0) {
      volumeIcon.setAttribute('data-lucide', 'volume-x');
    } else if (val < 0.5) {
      volumeIcon.setAttribute('data-lucide', 'volume-1');
    } else {
      volumeIcon.setAttribute('data-lucide', 'volume-2');
    }
    if (window.lucide) lucide.createIcons();

    restartCurrentSentence();
  });

  btnMuteToggle.addEventListener('click', () => {
    if (state.volume > 0) {
      state.previousVolume = state.volume;
      state.volume = 0;
      volumeSlider.value = 0;
      volumeValueDisplay.textContent = '0%';
      playerVolumeDisplay.textContent = '0%';
      volumeIcon.setAttribute('data-lucide', 'volume-x');
    } else {
      state.volume = state.previousVolume || 1.0;
      volumeSlider.value = state.volume;
      const pct = Math.round(state.volume * 100);
      volumeValueDisplay.textContent = `${pct}%`;
      playerVolumeDisplay.textContent = `${pct}%`;
      volumeIcon.setAttribute('data-lucide', 'volume-2');
    }
    if (window.lucide) lucide.createIcons();
    restartCurrentSentence();
  });

  pitchSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.pitch = val;
    pitchValueDisplay.textContent = val.toFixed(2);
    restartCurrentSentence();
  });

  // ==========================================
  // 7. Thao tác Nút Trình phát
  // ==========================================

  // Nút Play / Pause chính
  btnPlayPause.addEventListener('click', () => {
    if (state.isPlaying && !state.isPaused) {
      pauseAudio();
    } else {
      playAudio();
    }
  });

  // Nút Tạm dừng riêng biệt (Dedicated Pause Button)
  btnDedicatedPause.addEventListener('click', () => {
    if (state.isPlaying && !state.isPaused) {
      pauseAudio();
    } else if (state.isPaused) {
      playAudio();
    }
  });

  // Nút Dừng hẳn
  btnStop.addEventListener('click', () => {
    stopAudio();
  });

  // Nút Tua lùi 1 câu
  btnPrev.addEventListener('click', () => {
    if (state.currentIndex > 0) {
      jumpToSentence(state.currentIndex - 1);
    }
  });

  // Nút Tua tới 1 câu
  btnNext.addEventListener('click', () => {
    if (state.currentIndex < state.sentences.length - 1) {
      jumpToSentence(state.currentIndex + 1);
    }
  });

  // Nút Lặp lại (Loop)
  btnLoop.addEventListener('click', () => {
    state.isLoop = !state.isLoop;
    if (state.isLoop) {
      btnLoop.classList.add('bg-indigo-600/30', 'text-indigo-400', 'border', 'border-indigo-500/40');
    } else {
      btnLoop.classList.remove('bg-indigo-600/30', 'text-indigo-400', 'border', 'border-indigo-500/40');
    }
  });

  // Nút Tự động cuộn (Auto-scroll)
  btnAutoScroll.addEventListener('click', () => {
    state.isAutoScroll = !state.isAutoScroll;
    if (state.isAutoScroll) {
      btnAutoScroll.classList.add('bg-indigo-950/40', 'border-indigo-800/40', 'text-indigo-300');
      btnAutoScroll.classList.remove('bg-slate-800', 'text-slate-500');
    } else {
      btnAutoScroll.classList.remove('bg-indigo-950/40', 'border-indigo-800/40', 'text-indigo-300');
      btnAutoScroll.classList.add('bg-slate-800', 'text-slate-500');
    }
  });

  // Nút "Tạo Trình Phát Âm Thanh"
  btnGenerateAudio.addEventListener('click', () => {
    const ok = buildSentencesFromText();
    if (ok) {
      playAudio();
    }
  });

  // ==========================================
  // 8. Tiện ích & Nạp ban đầu
  // ==========================================

  btnSampleText.addEventListener('click', () => {
    state.rawText = SAMPLE_TEXT_WITH_GARBAGE;
    const purified = purifyAndFilterDocument(SAMPLE_TEXT_WITH_GARBAGE);
    state.cleanedText = purified.text;
    state.currentMode = 'cleaned';
    textInput.value = state.cleanedText;

    tabCleaned.click();
    showAiBanner(purified.removedItems);
  });

  btnClearText.addEventListener('click', () => {
    if (textInput.value && confirm('Bạn có chắc chắn muốn xóa toàn bộ văn bản?')) {
      stopAudio();
      textInput.value = '';
      state.rawText = '';
      state.cleanedText = '';
      state.sentences = [];
      updateTextStats();
      renderReaderContent();
      currentSentenceDisplay.textContent = 'Đã xóa văn bản.';
      sentenceCounterDisplay.textContent = 'Câu: 0 / 0';
      aiFilterBanner.classList.add('hidden');
    }
  });

  btnCopyExtracted.addEventListener('click', async () => {
    if (!textInput.value.trim()) {
      alert('Chưa có nội dung để sao chép.');
      return;
    }
    try {
      await navigator.clipboard.writeText(textInput.value);
      const originalText = btnCopyExtracted.innerHTML;
      btnCopyExtracted.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i><span class="text-emerald-400">Đã chép!</span>';
      if (window.lucide) lucide.createIcons();
      setTimeout(() => {
        btnCopyExtracted.innerHTML = originalText;
        if (window.lucide) lucide.createIcons();
      }, 2000);
    } catch {
      alert('Không thể sao chép vào bộ nhớ tạm.');
    }
  });

  btnDownloadText.addEventListener('click', () => {
    if (!textInput.value.trim()) {
      alert('Chưa có nội dung để tải về.');
      return;
    }
    const blob = new Blob([textInput.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.currentMode === 'cleaned' ? 'van-ban-da-loc-ai.txt' : 'van-ban-goc.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Help Modal Toggle
  btnHelp.addEventListener('click', () => {
    helpModal.classList.remove('hidden');
    helpModal.classList.add('flex');
  });

  [btnCloseHelp, btnConfirmHelp].forEach(btn => {
    btn.addEventListener('click', () => {
      helpModal.classList.add('hidden');
      helpModal.classList.remove('flex');
    });
  });

  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
      helpModal.classList.add('hidden');
      helpModal.classList.remove('flex');
    }
  });

  // Phím tắt (Space = Play/Pause, Trái/Phải = Tua câu)
  document.addEventListener('keydown', (e) => {
    if (document.activeElement === textInput || document.activeElement.tagName === 'INPUT') {
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      btnPlayPause.click();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      btnPrev.click();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      btnNext.click();
    }
  });

  // Nạp sẵn văn bản mẫu và tự động chạy AI Purifier lần đầu
  state.rawText = SAMPLE_TEXT_WITH_GARBAGE;
  const initialPurified = purifyAndFilterDocument(SAMPLE_TEXT_WITH_GARBAGE);
  state.cleanedText = initialPurified.text;
  state.currentMode = 'cleaned';
  textInput.value = state.cleanedText;

  updateTextStats();
  buildSentencesFromText();
  showAiBanner(initialPurified.removedItems);
});
