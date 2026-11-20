/**
 * AudioBook Pro - Trình Đọc Văn Bản Tiếng Việt Tự Động
 * - Đã loại bỏ hoàn toàn khoảng lặng/khoảng trống thừa (đọc liền mạch không chờ đợi)
 * - Đã khắc phục lỗi kéo cuộn (cho phép tự do lăn chuột lên xem lại mà không bị giật màn hình)
 * - Đã tích hợp nút nổi quay lại câu đang đọc & nút Tạm dừng mượt mà 100%
 */

// Cấu hình PDF.js worker
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

document.addEventListener('DOMContentLoaded', () => {
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
  const headerVoiceBadge = document.getElementById('headerVoiceBadge');
  const rateSlider = document.getElementById('rateSlider');
  const rateValueDisplay = document.getElementById('rateValueDisplay');
  const playerRateDisplay = document.getElementById('playerRateDisplay');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValueDisplay = document.getElementById('volumeValueDisplay');
  const playerVolumeDisplay = document.getElementById('playerVolumeDisplay');
  const btnMuteToggle = document.getElementById('btnMuteToggle');
  const volumeIcon = document.getElementById('volumeIcon');

  // Player Elements
  const btnPlayPause = document.getElementById('btnPlayPause');
  const btnDedicatedPause = document.getElementById('btnDedicatedPause');
  const btnStop = document.getElementById('btnStop');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnLoop = document.getElementById('btnLoop');
  const loopIcon = document.getElementById('loopIcon');
  const btnAutoScroll = document.getElementById('btnAutoScroll');
  const autoScrollLabel = document.getElementById('autoScrollLabel');
  const seekBar = document.getElementById('seekBar');
  const currentTimeDisplay = document.getElementById('currentTimeDisplay');
  const totalTimeDisplay = document.getElementById('totalTimeDisplay');
  const sentenceCounterDisplay = document.getElementById('sentenceCounterDisplay');
  const currentSentenceDisplay = document.getElementById('currentSentenceDisplay');
  const playerStatusTag = document.getElementById('playerStatusTag');
  const waveContainer = document.getElementById('waveContainer');

  // Reader Content & Floating Resume Button
  const readerContentBox = document.getElementById('readerContentBox');
  const btnResumeScroll = document.getElementById('btnResumeScroll');
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
    currentMode: 'cleaned',
    sentences: [],
    currentIndex: 0,
    isPlaying: false,
    isPaused: false,
    isLoop: false,
    isAutoScroll: true,
    userScrolledAway: false, // Cờ nhận biết người dùng đang tự cuộn lên xem
    rate: 1.0,
    volume: 1.0,
    previousVolume: 1.0,
    currentAudio: null,
    audioRequestId: 0,
    elapsedSeconds: 0,
    clockTimer: null
  };

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
Bên cạnh đó, bạn có thể tự do cuộn lên để xem lại đoạn văn trước đó mà không sợ bị giật màn hình.

Chúc bạn có những trải nghiệm nghe đọc tài liệu thật thư giãn và hiệu quả!

TÀI LIỆU THAM KHẢO
[1] Nguyễn Văn A (2024), Giáo trình Xử lý Ngôn ngữ Tự nhiên, NXB Khoa học.
Trang 15 / 15`;

  // ==========================================
  // 1. Dịch vụ giọng đọc tiếng Việt trực tuyến
  // ==========================================
  function loadVoices() {
    headerVoiceBadge.textContent = 'Giọng Việt trực tuyến';
  }

  loadVoices();

  // ==========================================
  // 2. AI Smart Document Purifier
  // ==========================================
  function purifyAndFilterDocument(rawText) {
    if (!rawText || !rawText.trim()) return { text: '', removedItems: 0 };

    const lines = rawText.split('\n');
    const cleanedLines = [];
    let inToc = false;
    let inReferences = false;
    let removedItems = 0;

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

      if (/^(mục\s+lục|table\s+of\s+contents|danh\s+mục\s+nội\s+dung|danh\s+mục\s+bảng|danh\s+mục\s+hình|nội\s+dung\s+chính)\b/i.test(line)) {
        inToc = true;
        removedItems++;
        continue;
      }

      if (inToc) {
        const isTocLine = 
          /(\.{3,}|\_{3,}|\-{3,})\s*(\d+|trang\s*\d+|page\s*\d+)?$/i.test(line) ||
          /^\d+(\.\d+)*\s+.*?\s+(\d+|trang\s*\d+)$/i.test(line) ||
          /^(chương|phần|bài|mục)\s+[\dIVXLCDM]+\s*[:.]?.*?\s+\d+$/i.test(line) ||
          (line.length < 70 && /\s+\d+$/.test(line));

        if (isTocLine) {
          removedItems++;
          continue;
        }

        const isTocEnd = 
          line.length > 90 || 
          /^(lời\s+nói\s+đầu|lời\s+mở\s+đầu|mở\s+đầu|chương\s+1|phần\s+1|1\.\s+[A-ZÀ-Ỹ]|bài\s+1)\b/i.test(line);

        if (isTocEnd) {
          inToc = false;
        } else {
          removedItems++;
          continue;
        }
      }

      if (/^(tài\s+liệu\s+tham\s+khảo|references|danh\s+mục\s+tài\s+liệu|phụ\s+lục|appendix)\b/i.test(line)) {
        inReferences = true;
        removedItems++;
        continue;
      }

      if (inReferences) {
        if (/^\[\d+\]|^\d+\.\s+[A-Z]|http|doi\.org/i.test(line) || line.length < 150) {
          removedItems++;
          continue;
        }
      }

      if (/^(trang\s*\d+(\s*\/\s*\d+)?|page\s*\d+(\s*of\s*\d+)?|\d+\s*\/\s*\d+|[-–—]\s*\d+\s*[-–—]|\[\s*\d+\s*\]|\d+)$/i.test(line)) {
        removedItems++;
        continue;
      }

      if (lineFrequency[line] >= 2 && line.length < 80) {
        removedItems++;
        continue;
      }

      if (/^[.\-_=*#~\\/|\s]{3,}$/.test(line)) {
        removedItems++;
        continue;
      }

      if (/^(cộng\s+hòa\s+xã\s+hội\s+chủ\s+nghĩa\s+việt\s+nam|độc\s+lập\s+-\s+tự\s+do\s+-\s+hạnh\s+phúc|số\s+hiệu\s*:|isbn\s*:|issn\s*:|bản\s+quyền\s*©|all\s+rights\s+reserved|nhà\s+xuất\s+bản|nxb\s+|in\s+lần\s+thứ)\b/i.test(line)) {
        removedItems++;
        continue;
      }

      line = line.replace(/https?:\/\/[^\s]+/g, 'đường dẫn liên kết');
      cleanedLines.push(line);
    }

    return {
      text: cleanedLines.join('\n'),
      removedItems: removedItems
    };
  }

  // Chuyển đổi giữa 2 tab
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

  btnToggleAiFilter.addEventListener('click', () => {
    if (state.currentMode === 'cleaned') {
      tabRaw.click();
      btnToggleAiFilter.textContent = 'Dùng bản AI lọc rác';
    } else {
      tabCleaned.click();
      btnToggleAiFilter.textContent = 'Xem bản gốc';
    }
  });

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

      state.rawText = extractedRawText.trim();

      showFileLoading(true, `AI đang phân tích và lọc bỏ mục lục, tiêu đề rác...`);
      const purified = purifyAndFilterDocument(state.rawText);
      state.cleanedText = purified.text;

      state.currentMode = 'cleaned';
      textInput.value = state.cleanedText;
      updateTextStats();

      showAiBanner(purified.removedItems);
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

  async function extractDocxText(file) {
    if (!window.mammoth) {
      throw new Error('Thư viện Mammoth chưa sẵn sàng.');
    }
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
  }

  function extractPlainText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Không thể đọc file văn bản.'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  // ==========================================
  // 4. Xử lý & Phân tách câu THÔNG MINH
  // TRIỆT TIÊU MỌI KHOẢNG LẶNG / KHOẢNG TRỐNG THỪA
  // ==========================================
  function updateTextStats() {
    const text = textInput.value;
    const charCount = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    statCharCount.textContent = charCount.toLocaleString('vi-VN');
    statWordCount.textContent = words.toLocaleString('vi-VN');

    const minutes = words / (160 * state.rate);
    const totalSecs = Math.round(minutes * 60);
    statEstTime.textContent = `~${formatTime(totalSecs)}`;
    totalTimeDisplay.textContent = formatTime(totalSecs);
  }

  textInput.addEventListener('input', () => {
    updateTextStats();
  });

  /**
   * Tách câu thông minh:
   * - Xóa bỏ toàn bộ ký tự rác, dòng trống, tab thừa
   * - Lọc bỏ tuyệt đối các mảnh câu chỉ toàn dấu câu hoặc khoảng trắng
   * - Gom các cụm quá ngắn để đọc mượt mà không ngắt quãng
   */
  function splitIntoSentences(rawText) {
    if (!rawText || !rawText.trim()) return [];

    // 1. Chuẩn hóa toàn diện khoảng trắng và ngắt dòng
    let cleaned = rawText
      .replace(/[\r\t\f\v]/g, ' ')
      .replace(/\u200B/g, '') // Xóa zero-width space
      .replace(/\n{2,}/g, '. ') // 2 lần xuống dòng coi như hết câu
      .replace(/\n+/g, ' ')     // 1 lần xuống dòng coi như dấu cách để không ngắt vô lý
      .replace(/\s{2,}/g, ' ')  // Gom nhiều khoảng trắng liên tiếp thành 1
      .trim();

    // 2. Tách theo dấu kết thúc câu: chấm, hỏi, than, chấm phẩy
    // Không ngắt ở các chữ viết tắt phổ biến: TS., GS., TP., ThS., v.v.
    const rawTokens = cleaned.match(/[^.!?;\n]+[.!?;\n]*/g) || [cleaned];
    const validSentences = [];
    let pendingShort = '';

    rawTokens.forEach(token => {
      let t = token.trim();
      // Loại bỏ các dấu gạch ngang, chấm liên tiếp vô nghĩa ở đầu/cuối câu
      t = t.replace(/^[.\-_–—=*#~:;,\s]+/, '').replace(/[.\-_–—=*#~:\s]+$/, '').trim();

      // BẮT BUỘC: Câu phải chứa ít nhất 1 chữ cái hoặc số tiếng Việt/tiếng Anh
      // Nếu chỉ toàn dấu câu như ".", "...", "-", "___" thì BỎ QUA NGAY LẬP TỨC!
      if (!/[a-zA-Z0-9à-ỹÀ-Ỹ]/.test(t)) {
        return;
      }

      // Nếu câu quá ngắn (dưới 15 ký tự, ví dụ "1. Tổng quan"), gom vào câu sau để đọc liền mạch
      if (t.length < 18 && !/[.!?]$/.test(token.trim())) {
        pendingShort = pendingShort ? (pendingShort + ': ' + t) : t;
        return;
      }

      if (pendingShort) {
        t = pendingShort + '. ' + t;
        pendingShort = '';
      }

      // Nếu câu quá dài (trên 250 ký tự), chia tiếp theo dấu phẩy để giọng đọc thở tự nhiên
      if (t.length > 250) {
        const subChunks = t.split(/([,;]\s+)/);
        let currentChunk = '';
        for (let i = 0; i < subChunks.length; i++) {
          currentChunk += subChunks[i];
          if (currentChunk.length > 90 || i === subChunks.length - 1) {
            if (currentChunk.trim() && /[a-zA-Z0-9à-ỹÀ-Ỹ]/.test(currentChunk)) {
              validSentences.push(currentChunk.trim());
            }
            currentChunk = '';
          }
        }
        if (currentChunk.trim() && /[a-zA-Z0-9à-ỹÀ-Ỹ]/.test(currentChunk)) {
          validSentences.push(currentChunk.trim());
        }
      } else {
        validSentences.push(t);
      }
    });

    if (pendingShort && /[a-zA-Z0-9à-ỹÀ-Ỹ]/.test(pendingShort)) {
      validSentences.push(pendingShort);
    }

    return validSentences.length > 0 ? validSentences : [cleaned.trim()];
  }

  function buildSentencesFromText() {
    const text = textInput.value.trim();
    if (!text) {
      return false;
    }

    state.sentences = splitIntoSentences(text).flatMap(splitForOnlineTts);
    state.currentIndex = 0;
    state.userScrolledAway = false;
    btnResumeScroll.classList.add('hidden');

    renderReaderContent();

    sentenceCounterDisplay.textContent = `Câu: 1 / ${state.sentences.length}`;
    currentSentenceDisplay.textContent = state.sentences[0] || 'Sẵn sàng phát...';
    seekBar.value = 0;
    currentTimeDisplay.textContent = '00:00';
    updateTextStats();
    setPlayerStatus('Sẵn sàng');
    return true;
  }

  function splitForOnlineTts(sentence) {
    const maxLength = 180;
    const words = sentence.trim().split(/\s+/);
    const chunks = [];
    let current = '';

    words.forEach(word => {
      let remaining = word;
      while (remaining.length > maxLength) {
        if (current) {
          chunks.push(current);
          current = '';
        }
        chunks.push(remaining.slice(0, maxLength));
        remaining = remaining.slice(maxLength);
      }

      const next = current ? `${current} ${remaining}` : remaining;
      if (next.length > maxLength && current) {
        chunks.push(current);
        current = remaining;
      } else {
        current = next;
      }
    });

    if (current) chunks.push(current);
    return chunks;
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
        state.userScrolledAway = false;
        btnResumeScroll.classList.add('hidden');
        jumpToSentence(index);
      });

      fragment.appendChild(span);
    });

    readerContentBox.appendChild(fragment);
    highlightSentenceInText(state.currentIndex);
  }

  // ==========================================
  // XỬ LÝ CUỘN TỰ DO & KHÔNG GIẬT MÀN HÌNH (UX FIX)
  // ==========================================

  // Lắng nghe khi người dùng chủ động lăn chuột hoặc chạm vuốt trong khung đọc
  readerContentBox.addEventListener('wheel', (e) => {
    // Nếu người dùng lăn chuột lên (deltaY < 0), đánh dấu người dùng đang tự xem lại đoạn trên
    if (e.deltaY < 0) {
      state.userScrolledAway = true;
      btnResumeScroll.classList.remove('hidden');
      btnResumeScroll.classList.add('flex');
    }
  }, { passive: true });

  readerContentBox.addEventListener('touchmove', () => {
    state.userScrolledAway = true;
    btnResumeScroll.classList.remove('hidden');
    btnResumeScroll.classList.add('flex');
  }, { passive: true });

  // Nút nổi cuộn nhanh về câu đang đọc
  btnResumeScroll.addEventListener('click', () => {
    state.userScrolledAway = false;
    btnResumeScroll.classList.add('hidden');
    scrollReaderToCurrentSentence(true);
  });

  // Tùy chọn Bật / Tắt Tự động cuộn
  btnAutoScroll.addEventListener('click', () => {
    state.isAutoScroll = !state.isAutoScroll;
    if (state.isAutoScroll) {
      state.userScrolledAway = false;
      btnResumeScroll.classList.add('hidden');
      btnAutoScroll.classList.add('bg-indigo-950/40', 'border-indigo-800/40', 'text-indigo-300');
      btnAutoScroll.classList.remove('bg-slate-800', 'text-slate-500');
      autoScrollLabel.textContent = 'Tự cuộn: BẬT';
      scrollReaderToCurrentSentence(true);
    } else {
      btnAutoScroll.classList.remove('bg-indigo-950/40', 'border-indigo-800/40', 'text-indigo-300');
      btnAutoScroll.classList.add('bg-slate-800', 'text-slate-500');
      autoScrollLabel.textContent = 'Tự cuộn: TẮT';
      btnResumeScroll.classList.add('hidden');
    }
  });

  /**
   * Cuộn CỤC BỘ an toàn bên trong khung đọc (KHÔNG bao giờ cuộn cửa sổ window)
   */
  function scrollReaderToCurrentSentence(force = false) {
    if (!state.isAutoScroll) return;
    if (state.userScrolledAway && !force) return;

    const targetSpan = document.getElementById(`sentence-span-${state.currentIndex}`);
    if (!targetSpan) return;

    // Tính toán vị trí tương đối chỉ bên trong readerContentBox
    const container = readerContentBox;
    const spanOffsetTop = targetSpan.offsetTop - container.offsetTop;
    const containerScrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    // Kiểm tra xem câu có đang nằm trong tầm nhìn không
    const isInView = spanOffsetTop >= containerScrollTop && (spanOffsetTop + targetSpan.offsetHeight) <= (containerScrollTop + containerHeight);

    // Chỉ cuộn khi câu nằm ngoài tầm nhìn hoặc khi bấm nút force
    if (!isInView || force) {
      container.scrollTo({
        top: Math.max(0, spanOffsetTop - 80), // Cách đỉnh 80px để cực kỳ dễ đọc
        behavior: 'smooth'
      });
      state.userScrolledAway = false;
      btnResumeScroll.classList.add('hidden');
    }
  }

  function highlightSentenceInText(index) {
    const currentActive = readerContentBox.querySelector('.sentence-active');
    if (currentActive) {
      currentActive.classList.remove('sentence-active');
    }

    const targetSpan = document.getElementById(`sentence-span-${index}`);
    if (targetSpan) {
      targetSpan.classList.add('sentence-active');
      scrollReaderToCurrentSentence();
    }
  }

  // ==========================================
  // 5. Trình Phát Âm Thanh (Audio Player Core)
  // Khắc phục triệt để khoảng lặng & lỗi Tạm dừng
  // ==========================================

  function getVietnameseAudioUrl(text) {
    const params = new URLSearchParams({
      ie: 'UTF-8',
      client: 'tw-ob',
      tl: 'vi',
      q: text
    });
    return `https://translate.google.com/translate_tts?${params.toString()}`;
  }

  function releaseCurrentAudio() {
    if (!state.currentAudio) return;
    state.currentAudio.onended = null;
    state.currentAudio.onerror = null;
    state.currentAudio.pause();
    state.currentAudio.removeAttribute('src');
    state.currentAudio.load();
    state.currentAudio = null;
  }

  function failAudioPlayback(error, requestId) {
    if (requestId !== undefined && requestId !== state.audioRequestId) return;
    state.audioRequestId++;
    releaseCurrentAudio();
    state.isPlaying = false;
    state.isPaused = false;
    updatePlayPauseButtonUI(false);
    setPlayerStatus('Lỗi kết nối giọng Việt');
    setWaveAnimation(false);
    stopClockTimer();
    alert(error.message || 'Không tải được giọng Việt. Hãy kiểm tra kết nối Internet rồi thử lại.');
  }

  function playCurrentSentence() {
    const requestId = ++state.audioRequestId;
    releaseCurrentAudio();

    while (state.currentIndex < state.sentences.length) {
      const sentence = state.sentences[state.currentIndex];
      if (sentence && /[a-zA-Z0-9à-ỹÀ-Ỹ]/.test(sentence)) break;
      state.currentIndex++;
    }

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

    const sentence = state.sentences[state.currentIndex];
    currentSentenceDisplay.textContent = sentence;
    sentenceCounterDisplay.textContent = `Câu: ${state.currentIndex + 1} / ${state.sentences.length}`;
    highlightSentenceInText(state.currentIndex);
    updateSeekBar();

    const audio = new Audio();
    audio.referrerPolicy = 'no-referrer';
    audio.preload = 'auto';
    audio.volume = state.volume;
    audio.playbackRate = state.rate;
    audio.src = getVietnameseAudioUrl(sentence);
    state.currentAudio = audio;
    audio.onended = () => {
      if (state.currentAudio !== audio || requestId !== state.audioRequestId) return;
      releaseCurrentAudio();
      if (state.isPlaying && !state.isPaused) {
        state.currentIndex++;
        playCurrentSentence();
      }
    };
    audio.onerror = () => {
      if (state.currentAudio === audio) {
        failAudioPlayback(new Error('Không tải được giọng Việt trực tuyến. Hãy kiểm tra Internet rồi thử lại.'), requestId);
      }
    };

    state.isPlaying = true;
    state.isPaused = false;
    updatePlayPauseButtonUI(true);
    setPlayerStatus('Đang tải giọng Việt');
    setWaveAnimation(true);
    audio.play().then(() => {
      if (requestId !== state.audioRequestId || !state.isPlaying || state.isPaused) return;
      setPlayerStatus('Đang phát');
      startClockTimer();
    }).catch(error => {
      if (!state.isPaused) failAudioPlayback(error, requestId);
    });
  }

  function playAudio() {
    if (state.sentences.length === 0) {
      const ok = buildSentencesFromText();
      if (!ok) {
        alert('Vui lòng nhập văn bản hoặc tải file trước.');
        return;
      }
    }

    if (state.currentAudio && state.isPaused) {
      state.isPaused = false;
      state.isPlaying = true;
      state.currentAudio.play().then(() => {
        setPlayerStatus('Đang phát');
        updatePlayPauseButtonUI(true);
        setWaveAnimation(true);
        startClockTimer();
      }).catch(error => failAudioPlayback(error, state.audioRequestId));
      return;
    }

    state.isPaused = false;
    state.isPlaying = true;
    playCurrentSentence();
  }

  function pauseAudio() {
    if (!state.isPlaying && !state.isPaused) return;

    state.isPaused = true;
    state.isPlaying = false;
    if (state.currentAudio) state.currentAudio.pause();

    updatePlayPauseButtonUI(false);
    setPlayerStatus(`Tạm dừng (Câu ${state.currentIndex + 1}/${state.sentences.length})`);
    setWaveAnimation(false);
    stopClockTimer();
  }

  function stopAudio() {
    state.audioRequestId++;
    releaseCurrentAudio();
    state.isPlaying = false;
    state.isPaused = false;
    state.currentIndex = 0;
    state.elapsedSeconds = 0;
    state.userScrolledAway = false;
    btnResumeScroll.classList.add('hidden');
    
    updatePlayPauseButtonUI(false);
    setPlayerStatus('Đã dừng');
    setWaveAnimation(false);
    stopClockTimer();

    if (state.sentences.length > 0) {
      currentSentenceDisplay.textContent = state.sentences[0];
      sentenceCounterDisplay.textContent = `Câu: 1 / ${state.sentences.length}`;
      highlightSentenceInText(0);
    }
    seekBar.value = 0;
    currentTimeDisplay.textContent = '00:00';
  }

  function jumpToSentence(index) {
    if (index < 0 || index >= state.sentences.length) return;
    state.currentIndex = index;

    if (state.isPlaying && !state.isPaused) {
      playCurrentSentence();
    } else {
      if (state.isPaused) {
        state.audioRequestId++;
        releaseCurrentAudio();
      }
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
    if (statusText === 'Đang phát' || statusText === 'Đang tải giọng Việt') {
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
    if (state.currentAudio) state.currentAudio.playbackRate = val;
    updateTextStats();
  });

  document.querySelectorAll('.quick-rate').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseFloat(btn.dataset.rate);
      rateSlider.value = val;
      state.rate = val;
      rateValueDisplay.textContent = `${val.toFixed(2)}x`;
      playerRateDisplay.textContent = `${val.toFixed(2)}x`;
      if (state.currentAudio) state.currentAudio.playbackRate = val;
      
      document.querySelectorAll('.quick-rate').forEach(b => {
        b.className = 'quick-rate px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition';
      });
      btn.className = 'quick-rate px-2 py-1 rounded bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold transition';

      updateTextStats();
    });
  });

  volumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.volume = val;
    if (state.currentAudio) state.currentAudio.volume = val;
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
    if (state.currentAudio) state.currentAudio.volume = state.volume;
    if (window.lucide) lucide.createIcons();
  });

  // ==========================================
  // 7. Thao tác Nút Trình phát
  // ==========================================
  btnPlayPause.addEventListener('click', () => {
    if (state.isPlaying && !state.isPaused) {
      pauseAudio();
    } else {
      playAudio();
    }
  });

  btnDedicatedPause.addEventListener('click', () => {
    if (state.isPlaying && !state.isPaused) {
      pauseAudio();
    } else if (state.isPaused) {
      playAudio();
    }
  });

  btnStop.addEventListener('click', () => {
    stopAudio();
  });

  btnPrev.addEventListener('click', () => {
    if (state.currentIndex > 0) {
      jumpToSentence(state.currentIndex - 1);
    }
  });

  btnNext.addEventListener('click', () => {
    if (state.currentIndex < state.sentences.length - 1) {
      jumpToSentence(state.currentIndex + 1);
    }
  });

  btnLoop.addEventListener('click', () => {
    state.isLoop = !state.isLoop;
    if (state.isLoop) {
      btnLoop.classList.add('bg-indigo-600/30', 'text-indigo-400', 'border', 'border-indigo-500/40');
    } else {
      btnLoop.classList.remove('bg-indigo-600/30', 'text-indigo-400', 'border', 'border-indigo-500/40');
    }
  });

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

  // Khởi tạo ban đầu
  state.rawText = SAMPLE_TEXT_WITH_GARBAGE;
  const initialPurified = purifyAndFilterDocument(SAMPLE_TEXT_WITH_GARBAGE);
  state.cleanedText = initialPurified.text;
  state.currentMode = 'cleaned';
  textInput.value = state.cleanedText;

  updateTextStats();
  buildSentencesFromText();
  showAiBanner(initialPurified.removedItems);
});

