/**
 * AudioBook Pro - Trình Đọc Văn Bản Tiếng Việt Tự Động
 * - Chia văn bản thành các đoạn dài hơn để giảm số lần tải âm thanh
 * - Hiển thị văn bản thuần và cho phép phát lại đoạn được chọn
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
  const bookTitleInput = document.getElementById('bookTitleInput');
  const btnSaveBook = document.getElementById('btnSaveBook');
  const savedBooksList = document.getElementById('savedBooksList');
  const savedBooksStatus = document.getElementById('savedBooksStatus');

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
  const btnStop = document.getElementById('btnStop');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnLoop = document.getElementById('btnLoop');
  const loopIcon = document.getElementById('loopIcon');

  // Sleep Timer Elements
  const btnSleepTimer = document.getElementById('btnSleepTimer');
  const sleepTimerLabel = document.getElementById('sleepTimerLabel');
  const sleepTimerIcon = document.getElementById('sleepTimerIcon');
  const sleepTimerDropdown = document.getElementById('sleepTimerDropdown');
  const btnCloseSleepTimer = document.getElementById('btnCloseSleepTimer');
  const sleepTimerActiveBox = document.getElementById('sleepTimerActiveBox');
  const sleepTimerCountdown = document.getElementById('sleepTimerCountdown');
  const btnAdd5Min = document.getElementById('btnAdd5Min');
  const btnAdd15Min = document.getElementById('btnAdd15Min');
  const btnCancelSleepTimer = document.getElementById('btnCancelSleepTimer');
  const customTimerMinutes = document.getElementById('customTimerMinutes');
  const btnApplyCustomTimer = document.getElementById('btnApplyCustomTimer');
  const toastNotification = document.getElementById('toastNotification');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');
  const btnCloseToast = document.getElementById('btnCloseToast');
  const seekBar = document.getElementById('seekBar');
  const currentTimeDisplay = document.getElementById('currentTimeDisplay');
  const totalTimeDisplay = document.getElementById('totalTimeDisplay');
  const sentenceCounterDisplay = document.getElementById('sentenceCounterDisplay');
  const currentSentenceDisplay = document.getElementById('currentSentenceDisplay');
  const playerStatusTag = document.getElementById('playerStatusTag');
  const waveContainer = document.getElementById('waveContainer');

  // Reader Content
  const readerContentBox = document.getElementById('readerContentBox');
  const btnReadSelection = document.getElementById('btnReadSelection');
  const btnCopyExtracted = document.getElementById('btnCopyExtracted');
  const btnDownloadText = document.getElementById('btnDownloadText');

  // Modal
  const helpModal = document.getElementById('helpModal');
  const btnHelp = document.getElementById('btnHelp');
  const btnCloseHelp = document.getElementById('btnCloseHelp');
  const btnConfirmHelp = document.getElementById('btnConfirmHelp');

  const BOOKS_API_URL = 'https://audiobook-vi-tts.trirk2008.workers.dev';
  const OWNER_STORAGE_KEY = 'audiobook-reader-owner-v1';
  let ownerId = localStorage.getItem(OWNER_STORAGE_KEY);
  if (!ownerId || !/^[0-9a-f-]{36}$/i.test(ownerId)) {
    ownerId = crypto.randomUUID();
    localStorage.setItem(OWNER_STORAGE_KEY, ownerId);
  }

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
    rate: 1.0,
    volume: 1.0,
    previousVolume: 1.0,
    audioContext: null,
    gainNodes: new WeakMap(),
    currentAudio: null,
    prefetchedAudio: null,
    prefetchedIndex: -1,
    prefetchedAudioPromise: null,
    selectedText: '',
    audioRequestId: 0,
    elapsedSeconds: 0,
    completedAudioSeconds: 0,
    resumeSeconds: 0,
    clockTimer: null,
    bookId: null,
    bookDirty: false,
    progressSaveInFlight: false,
    progressSavePromise: null,
    isSelectionPlayback: false,
    playlistBeforeSelection: null
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

    const previousSave = saveCurrentBookBeforeLeaving();
    stopAudio();
    await previousSave;
    state.bookId = null;
    state.bookDirty = true;
    bookTitleInput.value = file.name.replace(/\.[^.]+$/, '');
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
      showFileLoading(true, 'Đang lưu sách vào kho…');
      await saveCurrentBook();

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
    state.bookDirty = true;
    updateTextStats();
  });

  function buildSentencesFromText() {
    const text = textInput.value.trim();
    if (!text) {
      return false;
    }

    stopAudio();
    state.sentences = splitForOnlineTts(text);
    state.currentIndex = 0;
    state.resumeSeconds = 0;
    state.elapsedSeconds = 0;
    state.completedAudioSeconds = 0;
    state.isSelectionPlayback = false;
    state.selectedText = '';
    btnReadSelection.disabled = true;

    renderReaderContent();

    sentenceCounterDisplay.textContent = 'Tiến độ: 0%';
    currentSentenceDisplay.textContent = state.sentences[0] || 'Sẵn sàng phát...';
    seekBar.value = 0;
    currentTimeDisplay.textContent = '00:00';
    updateTextStats();
    setPlayerStatus('Sẵn sàng');
    return true;
  }

  function splitForOnlineTts(sentence) {
    const maxLength = 1800;
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
    const text = textInput.value.trim();
    readerContentBox.textContent = text || 'Chưa có văn bản.';
    readerContentBox.classList.toggle('text-slate-500', !text);
  }

  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    const isInsideReader = selection?.rangeCount && readerContentBox.contains(selection.anchorNode) && readerContentBox.contains(selection.focusNode);
    state.selectedText = isInsideReader ? selection.toString().trim() : '';
    btnReadSelection.disabled = !state.selectedText;
  });

  btnReadSelection.addEventListener('mousedown', (event) => event.preventDefault());
  btnReadSelection.addEventListener('click', () => {
    if (!state.selectedText) return;
    saveProgress(true);
    state.playlistBeforeSelection = {
      sentences: state.sentences.slice(),
      currentIndex: state.currentIndex,
      positionSeconds: state.currentAudio?.currentTime ?? state.resumeSeconds,
      completedAudioSeconds: state.completedAudioSeconds,
      elapsedSeconds: state.completedAudioSeconds + (state.currentAudio?.currentTime ?? state.resumeSeconds)
    };
    stopAudio();
    state.isSelectionPlayback = true;
    state.sentences = splitForOnlineTts(state.selectedText);
    state.currentIndex = 0;
    state.resumeSeconds = 0;
    state.elapsedSeconds = 0;
    state.completedAudioSeconds = 0;
    sentenceCounterDisplay.textContent = 'Tiến độ: 0%';
    playAudio();
  });

  async function booksRequest(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${ownerId}`);
    if (options.body) headers.set('Content-Type', 'application/json');
    return fetch(`${BOOKS_API_URL}${path}`, { ...options, headers });
  }

  function setSavedBooksStatus(message, isError = false) {
    savedBooksStatus.textContent = message;
    savedBooksStatus.classList.toggle('text-rose-300', isError);
    savedBooksStatus.classList.toggle('text-slate-400', !isError);
  }

  function renderSavedBooks(books) {
    savedBooksList.replaceChildren();
    if (!books.length) {
      const empty = document.createElement('p');
      empty.className = 'text-sm text-slate-500';
      empty.textContent = 'Chưa có sách đã lưu.';
      savedBooksList.append(empty);
      return;
    }

    for (const book of books) {
      const item = document.createElement('div');
      item.className = 'flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800';
      const details = document.createElement('div');
      details.className = 'min-w-0';
      const title = document.createElement('p');
      title.className = 'font-semibold text-sm text-slate-200 truncate';
      title.textContent = book.title;
      const progress = document.createElement('p');
      progress.className = 'text-xs text-slate-500 mt-1';
      progress.textContent = `Nghe tiếp từ ${formatTime(book.elapsed_seconds || 0)}`;
      details.append(title, progress);

      const open = document.createElement('button');
      open.className = 'flex-shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold';
      open.textContent = 'Mở sách';
      open.addEventListener('click', () => loadSavedBook(book.id));
      item.append(details, open);
      savedBooksList.append(item);
    }
  }

  async function loadSavedBooks() {
    try {
      const response = await booksRequest('/books');
      if (!response.ok) throw new Error('Không tải được danh sách sách đã lưu.');
      const books = await response.json();
      renderSavedBooks(books);
      setSavedBooksStatus(`${books.length} sách`);
    } catch {
      setSavedBooksStatus('Không kết nối được kho sách. Thử tải lại trang.', true);
    }
  }

  async function saveCurrentBook({ keepalive = false, refreshList = true } = {}) {
    const content = textInput.value.trim();
    if (!content) {
      setSavedBooksStatus('Hãy tải hoặc nhập văn bản trước khi lưu.', true);
      return;
    }

    const id = state.bookId || crypto.randomUUID();
    const title = bookTitleInput.value.trim() || content.split(/\r?\n/).find(line => line.trim())?.trim().slice(0, 120) || 'Sách mới';
    const positionSeconds = state.currentAudio?.currentTime ?? state.resumeSeconds;
    btnSaveBook.disabled = true;
    setSavedBooksStatus('Đang lưu sách…');
    try {
      const response = await booksRequest(`/books/${id}`, {
        method: 'PUT',
        keepalive,
        body: JSON.stringify({
          title,
          content,
          mode: state.currentMode,
          position_index: state.currentIndex,
          position_seconds: positionSeconds,
          elapsed_seconds: state.completedAudioSeconds + positionSeconds,
          rate: state.rate
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không lưu được sách.');
      state.bookId = id;
      state.bookDirty = false;
      bookTitleInput.value = title;
      setSavedBooksStatus('Đã lưu sách và vị trí nghe.');
      if (refreshList) await loadSavedBooks();
    } catch (error) {
      setSavedBooksStatus(error.message, true);
    } finally {
      btnSaveBook.disabled = false;
    }
  }

  function saveCurrentBookBeforeLeaving() {
    if (state.bookDirty && textInput.value.trim()) return saveCurrentBook();
    return saveProgress(true);
  }

  async function loadSavedBook(id) {
    setSavedBooksStatus('Đang mở sách…');
    try {
      const previousSave = saveCurrentBookBeforeLeaving();
      stopAudio();
      await previousSave;
      const response = await booksRequest(`/books/${id}`);
      const book = await response.json();
      if (!response.ok) throw new Error(book.error || 'Không mở được sách.');
      state.bookId = book.id;
      state.bookDirty = false;
      state.currentMode = book.mode || 'cleaned';
      state.rawText = book.content;
      state.cleanedText = book.content;
      textInput.value = book.content;
      bookTitleInput.value = book.title;
      if (book.mode === 'raw') tabRaw.click();
      else tabCleaned.click();
      state.bookId = book.id;
      state.bookDirty = false;
      const savedIndex = Math.max(0, Math.floor(Number(book.position_index) || 0));
      const finished = savedIndex >= state.sentences.length;
      state.currentIndex = finished ? 0 : savedIndex;
      state.resumeSeconds = finished ? 0 : Math.max(0, Number(book.position_seconds) || 0);
      state.elapsedSeconds = finished ? 0 : Math.max(0, Number(book.elapsed_seconds) || 0);
      state.completedAudioSeconds = Math.max(0, state.elapsedSeconds - state.resumeSeconds);
      if (Number(book.rate) > 0) {
        state.rate = Math.min(2.5, Math.max(0.5, Number(book.rate)));
        rateSlider.value = state.rate;
        rateValueDisplay.textContent = `${state.rate.toFixed(2)}x`;
        playerRateDisplay.textContent = `${state.rate.toFixed(2)}x`;
      }
      updateTextStats();
      currentSentenceDisplay.textContent = state.sentences[state.currentIndex] || 'Sẵn sàng phát...';
      currentTimeDisplay.textContent = formatTime(state.elapsedSeconds);
      sentenceCounterDisplay.textContent = `Tiến độ: ${Math.round((state.currentIndex / Math.max(1, state.sentences.length)) * 100)}%`;
      updateSeekBar();
      setSavedBooksStatus('Đã mở sách. Bấm Phát để nghe tiếp đúng vị trí đã lưu.');
    } catch (error) {
      setSavedBooksStatus(error.message, true);
    }
  }

  function saveProgress(force = false) {
    if (!state.bookId || state.bookDirty || state.isSelectionPlayback) return Promise.resolve();
    if (state.progressSaveInFlight && !force) return state.progressSavePromise || Promise.resolve();
    const bookId = state.bookId;
    const positionSeconds = state.currentAudio?.currentTime ?? state.resumeSeconds;
    const progress = {
      position_index: state.currentIndex,
      position_seconds: positionSeconds,
      elapsed_seconds: state.completedAudioSeconds + positionSeconds,
      rate: state.rate
    };
    const previous = state.progressSavePromise || Promise.resolve();
    const request = previous.catch(() => {}).then(() => booksRequest(`/books/${bookId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(progress),
      keepalive: force
    })).then(response => {
      if (!response.ok) throw new Error('Không lưu được tiến độ.');
    }).catch(() => {
      setSavedBooksStatus('Chưa lưu được tiến độ; kiểm tra Internet.', true);
    });
    const tracked = request.finally(() => {
      if (state.progressSavePromise === tracked) {
        state.progressSavePromise = null;
        state.progressSaveInFlight = false;
      }
    });
    state.progressSaveInFlight = true;
    state.progressSavePromise = tracked;
    return tracked;
  }

  // ==========================================
  // 5. Trình Phát Âm Thanh (Audio Player Core)
  // Khắc phục triệt để khoảng lặng & lỗi Tạm dừng
  // ==========================================

  function getVietnameseAudioUrl(text) {
    const params = new URLSearchParams({
      q: text
    });
    return `https://audiobook-vi-tts.trirk2008.workers.dev/tts?${params.toString()}`;
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

  function releasePrefetchedAudio() {
    if (!state.prefetchedAudio) return;
    state.prefetchedAudio.pause();
    state.prefetchedAudio.removeAttribute('src');
    state.prefetchedAudio.load();
    state.prefetchedAudio = null;
    state.prefetchedIndex = -1;
  }

  function createAudio(text) {
    const audio = new Audio();
    audio.referrerPolicy = 'no-referrer';
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.volume = 1;
    audio.playbackRate = state.rate;
    try {
      if (!state.audioContext) state.audioContext = new AudioContext();
      const gain = state.audioContext.createGain();
      const source = state.audioContext.createMediaElementSource(audio);
      source.connect(gain);
      gain.connect(state.audioContext.destination);
      gain.gain.value = state.volume;
      state.gainNodes.set(audio, gain);
      if (state.audioContext.state === 'suspended') state.audioContext.resume().catch(() => {});
    } catch (error) {
      console.warn('Không bật được khuếch đại âm thanh:', error);
    }
    audio.src = getVietnameseAudioUrl(text);
    return audio;
  }

  function setAudioVolume(audio) {
    const gain = state.gainNodes.get(audio);
    if (gain) gain.gain.value = state.volume;
    else audio.volume = Math.min(1, state.volume);
  }

  function prefetchNextAudio(index) {
    const nextIndex = index < state.sentences.length ? index : state.isLoop ? 0 : -1;
    if (nextIndex < 0 || state.prefetchedIndex === nextIndex) return;
    releasePrefetchedAudio();
    state.prefetchedAudio = createAudio(state.sentences[nextIndex]);
    state.prefetchedIndex = nextIndex;
  }

  function failAudioPlayback(error, requestId) {
    if (requestId !== undefined && requestId !== state.audioRequestId) return;
    state.audioRequestId++;
    releaseCurrentAudio();
    releasePrefetchedAudio();
    state.isPlaying = false;
    state.isPaused = false;
    updatePlayPauseButtonUI(false);
    setPlayerStatus('Lỗi kết nối giọng Việt');
    setWaveAnimation(false);
    stopClockTimer();
    if (state.isSelectionPlayback) restorePlaylistAfterSelection();
    alert(error.message || 'Không tải được giọng Việt. Hãy kiểm tra kết nối Internet rồi thử lại.');
  }

  function restorePlaylistAfterSelection() {
    const playlist = state.playlistBeforeSelection;
    if (!playlist) return;
    state.sentences = playlist.sentences;
    state.currentIndex = playlist.currentIndex;
    state.resumeSeconds = playlist.positionSeconds;
    state.completedAudioSeconds = playlist.completedAudioSeconds;
    state.elapsedSeconds = playlist.elapsedSeconds;
    state.playlistBeforeSelection = null;
    state.isSelectionPlayback = false;
    state.isPlaying = false;
    state.isPaused = false;
    currentSentenceDisplay.textContent = state.sentences[state.currentIndex] || 'Sẵn sàng phát...';
    currentTimeDisplay.textContent = formatTime(state.elapsedSeconds);
    updateSeekBar();
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
        state.isPlaying = false;
        state.isPaused = false;
        state.resumeSeconds = 0;
        updatePlayPauseButtonUI(false);
        setWaveAnimation(false);
        stopClockTimer();
        updateSeekBar();
        currentSentenceDisplay.textContent = '🎉 Đã đọc xong toàn bộ nội dung!';
        setPlayerStatus('Hoàn thành');
        if (state.isSelectionPlayback) {
          restorePlaylistAfterSelection();
          setPlayerStatus('Đã đọc xong phần đã chọn');
        } else {
          saveProgress(true);
        }
      }
      return;
    }

    const sentence = state.sentences[state.currentIndex];
    currentSentenceDisplay.textContent = sentence;
    updateSeekBar();

    const audio = state.prefetchedIndex === state.currentIndex ? state.prefetchedAudio : createAudio(sentence);
    if (state.prefetchedIndex === state.currentIndex) {
      state.prefetchedAudio = null;
      state.prefetchedIndex = -1;
    } else {
      releasePrefetchedAudio();
    }
    setAudioVolume(audio);
    audio.playbackRate = state.rate;
    state.currentAudio = audio;
    if (state.resumeSeconds > 0) {
      const resumeAt = state.resumeSeconds;
      const seekToSavedTime = () => {
        if (state.currentAudio !== audio || requestId !== state.audioRequestId) return;
        if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(resumeAt, Math.max(0, audio.duration - 0.1));
        state.resumeSeconds = 0;
      };
      if (audio.readyState >= 1) seekToSavedTime();
      else audio.addEventListener('loadedmetadata', seekToSavedTime, { once: true });
    }
    audio.ontimeupdate = () => {
      if (state.currentAudio !== audio || requestId !== state.audioRequestId) return;
      state.elapsedSeconds = state.completedAudioSeconds + audio.currentTime;
      currentTimeDisplay.textContent = formatTime(state.elapsedSeconds);
      updateSeekBar();
    };
    audio.onended = () => {
      if (state.currentAudio !== audio || requestId !== state.audioRequestId) return;
      state.completedAudioSeconds += Number.isFinite(audio.duration) ? audio.duration : audio.currentTime;
      state.elapsedSeconds = state.completedAudioSeconds;
      releaseCurrentAudio();
      if (state.isPlaying && !state.isPaused) {
        state.currentIndex++;
        state.resumeSeconds = 0;
        saveProgress(true);
        playCurrentSentence();
      } else {
        saveProgress(true);
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
    prefetchNextAudio(state.currentIndex + 1);
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

    if (state.currentIndex >= state.sentences.length) {
      state.currentIndex = 0;
      state.resumeSeconds = 0;
      state.elapsedSeconds = 0;
      state.completedAudioSeconds = 0;
    }

    state.isPaused = false;
    state.isPlaying = true;
    playCurrentSentence();
  }

  function pauseAudio() {
    if (!state.isPlaying && !state.isPaused) return;

    state.isPaused = true;
    state.isPlaying = false;
    if (state.currentAudio) {
      state.currentAudio.pause();
      state.resumeSeconds = state.currentAudio.currentTime;
      state.elapsedSeconds = state.completedAudioSeconds + state.resumeSeconds;
      currentTimeDisplay.textContent = formatTime(state.elapsedSeconds);
    }

    updatePlayPauseButtonUI(false);
    setPlayerStatus(`Tạm dừng tại ${formatTime(state.elapsedSeconds)}`);
    setWaveAnimation(false);
    stopClockTimer();
    saveProgress(true);
  }

  function stopAudio() {
    const wasSelectionPlayback = state.isSelectionPlayback;
    state.audioRequestId++;
    releaseCurrentAudio();
    releasePrefetchedAudio();
    state.isPlaying = false;
    state.isPaused = false;
    state.currentIndex = 0;
    state.elapsedSeconds = 0;
    state.completedAudioSeconds = 0;
    state.resumeSeconds = 0;
    
    updatePlayPauseButtonUI(false);
    setPlayerStatus('Đã dừng');
    setWaveAnimation(false);
    stopClockTimer();

    if (state.sentences.length > 0) {
      currentSentenceDisplay.textContent = state.sentences[0];
      sentenceCounterDisplay.textContent = 'Tiến độ: 0%';
    }
    seekBar.value = 0;
    currentTimeDisplay.textContent = '00:00';
    if (wasSelectionPlayback) restorePlaylistAfterSelection();
  }

  function jumpToSentence(index) {
    if (index < 0 || index >= state.sentences.length) return;
    state.currentIndex = index;
    state.resumeSeconds = 0;
    state.completedAudioSeconds = state.sentences.slice(0, index).reduce((sum, text) => sum + Math.max(1, text.split(/\s+/).length) / (160 * state.rate) * 60, 0);
    state.elapsedSeconds = state.completedAudioSeconds;

    if (state.isPlaying && !state.isPaused) {
      playCurrentSentence();
    } else {
      if (state.isPaused) {
        state.audioRequestId++;
        releaseCurrentAudio();
      }
      currentSentenceDisplay.textContent = state.sentences[index];
      updateSeekBar();
      saveProgress(true);
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
    if (state.sentences.length === 0) {
      seekBar.value = 0;
      sentenceCounterDisplay.textContent = 'Tiến độ: 0%';
      return;
    }
    const duration = state.currentAudio?.duration;
    const currentTime = state.currentAudio?.currentTime ?? state.resumeSeconds;
    const withinBlock = Number.isFinite(duration) && duration > 0 ? currentTime / duration : 0;
    const progress = Math.min(100, ((state.currentIndex + withinBlock) / state.sentences.length) * 100);
    seekBar.value = progress;
    sentenceCounterDisplay.textContent = `Tiến độ: ${Math.round(progress)}%`;
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
      if (state.isPlaying && !state.isPaused) saveProgress();
    }, 5000);
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
    if (state.prefetchedAudio) state.prefetchedAudio.playbackRate = val;
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
      if (state.prefetchedAudio) state.prefetchedAudio.playbackRate = val;
      
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
    if (state.currentAudio) setAudioVolume(state.currentAudio);
    if (state.prefetchedAudio) setAudioVolume(state.prefetchedAudio);
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
    if (state.currentAudio) setAudioVolume(state.currentAudio);
    if (state.prefetchedAudio) setAudioVolume(state.prefetchedAudio);
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

  // ==========================================
  // Xử lý Hẹn Giờ Dừng & Lưu Tiến Độ (Sleep Timer)
  // ==========================================
  let toastHideTimeout = null;
  function showToast(title, message) {
    if (!toastNotification) return;
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toastNotification.classList.remove('-translate-y-24', 'opacity-0', 'pointer-events-none');
    toastNotification.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
    if (window.lucide) lucide.createIcons();
    clearTimeout(toastHideTimeout);
    toastHideTimeout = setTimeout(() => {
      hideToast();
    }, 5500);
  }

  function hideToast() {
    if (!toastNotification) return;
    toastNotification.classList.add('-translate-y-24', 'opacity-0', 'pointer-events-none');
    toastNotification.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
  }

  if (btnCloseToast) {
    btnCloseToast.addEventListener('click', hideToast);
  }

  const sleepTimer = {
    intervalId: null,
    targetEndTime: null,
    initialMinutes: 0
  };

  function formatTimerDisplay(totalSecs) {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateSleepTimerUI() {
    if (!btnSleepTimer || !sleepTimerLabel) return;

    if (!sleepTimer.targetEndTime) {
      btnSleepTimer.className = 'px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition text-xs flex items-center gap-1.5 cursor-pointer';
      sleepTimerLabel.textContent = 'Hẹn giờ';
      if (sleepTimerActiveBox) {
        sleepTimerActiveBox.classList.add('hidden');
        sleepTimerActiveBox.classList.remove('flex');
      }
      return;
    }

    const now = Date.now();
    const remaining = Math.max(0, Math.round((sleepTimer.targetEndTime - now) / 1000));

    btnSleepTimer.className = 'px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold shadow-md shadow-cyan-500/30 transition text-xs flex items-center gap-1.5 cursor-pointer animate-pulse';
    sleepTimerLabel.textContent = `⏱️ ${formatTimerDisplay(remaining)}`;
    if (sleepTimerCountdown) {
      sleepTimerCountdown.textContent = formatTimerDisplay(remaining);
    }
    if (sleepTimerActiveBox) {
      sleepTimerActiveBox.classList.remove('hidden');
      sleepTimerActiveBox.classList.add('flex');
    }
  }

  function startSleepTimer(minutes) {
    const mins = Number(minutes);
    if (!mins || mins <= 0) {
      alert('Vui lòng nhập số phút hợp lệ lớn hơn 0.');
      return;
    }

    if (sleepTimer.intervalId) {
      clearInterval(sleepTimer.intervalId);
      sleepTimer.intervalId = null;
    }

    sleepTimer.initialMinutes = mins;
    sleepTimer.targetEndTime = Date.now() + mins * 60 * 1000;
    localStorage.setItem('audiobook_sleep_target', String(sleepTimer.targetEndTime));

    updateSleepTimerUI();
    if (sleepTimerDropdown) {
      sleepTimerDropdown.classList.add('hidden');
      sleepTimerDropdown.classList.remove('flex');
    }

    showToast('Đã đặt hẹn giờ dừng', `Trình phát sẽ tự động dừng và lưu vị trí sau ${mins} phút nữa.`);

    sleepTimer.intervalId = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((sleepTimer.targetEndTime - now) / 1000));

      if (remaining <= 0) {
        stopSleepTimer(true);
        pauseAudio();
        try {
          saveProgress(true);
          saveCurrentBookBeforeLeaving();
        } catch (err) {
          console.warn('Lỗi khi lưu tự động:', err);
        }
        showToast('⏱️ Đã đến giờ hẹn!', 'Trình phát đã tạm dừng và tự động lưu lại toàn bộ tiến độ của bạn.');
      } else {
        updateSleepTimerUI();
      }
    }, 1000);
  }

  function stopSleepTimer(clearStorage = true) {
    if (sleepTimer.intervalId) {
      clearInterval(sleepTimer.intervalId);
      sleepTimer.intervalId = null;
    }
    sleepTimer.targetEndTime = null;
    if (clearStorage) {
      localStorage.removeItem('audiobook_sleep_target');
    }
    updateSleepTimerUI();
  }

  function addTimerMinutes(extraMinutes) {
    if (!sleepTimer.targetEndTime) {
      startSleepTimer(extraMinutes);
      return;
    }
    sleepTimer.targetEndTime += extraMinutes * 60 * 1000;
    localStorage.setItem('audiobook_sleep_target', String(sleepTimer.targetEndTime));
    updateSleepTimerUI();
    showToast('Đã thêm thời gian', `Đã cộng thêm ${extraMinutes} phút vào hẹn giờ tắt.`);
  }

  if (btnSleepTimer) {
    btnSleepTimer.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!sleepTimerDropdown) return;
      const isHidden = sleepTimerDropdown.classList.contains('hidden');
      if (isHidden) {
        sleepTimerDropdown.classList.remove('hidden');
        sleepTimerDropdown.classList.add('flex');
        if (window.lucide) lucide.createIcons();
      } else {
        sleepTimerDropdown.classList.add('hidden');
        sleepTimerDropdown.classList.remove('flex');
      }
    });
  }

  if (btnCloseSleepTimer) {
    btnCloseSleepTimer.addEventListener('click', (e) => {
      e.stopPropagation();
      sleepTimerDropdown.classList.add('hidden');
      sleepTimerDropdown.classList.remove('flex');
    });
  }

  document.addEventListener('click', (e) => {
    if (sleepTimerDropdown && !sleepTimerDropdown.contains(e.target) && e.target !== btnSleepTimer && !btnSleepTimer?.contains(e.target)) {
      sleepTimerDropdown.classList.add('hidden');
      sleepTimerDropdown.classList.remove('flex');
    }
  });

  document.querySelectorAll('.timer-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = Number(btn.dataset.minutes);
      if (mins) startSleepTimer(mins);
    });
  });

  if (btnApplyCustomTimer) {
    btnApplyCustomTimer.addEventListener('click', () => {
      const mins = Number(customTimerMinutes?.value);
      if (mins && mins > 0) {
        startSleepTimer(mins);
        if (customTimerMinutes) customTimerMinutes.value = '';
      } else {
        alert('Vui lòng nhập số phút lớn hơn 0.');
      }
    });
  }

  if (customTimerMinutes) {
    customTimerMinutes.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        btnApplyCustomTimer?.click();
      }
    });
  }

  if (btnAdd5Min) {
    btnAdd5Min.addEventListener('click', () => addTimerMinutes(5));
  }
  if (btnAdd15Min) {
    btnAdd15Min.addEventListener('click', () => addTimerMinutes(15));
  }
  if (btnCancelSleepTimer) {
    btnCancelSleepTimer.addEventListener('click', () => {
      stopSleepTimer(true);
      showToast('Đã hủy hẹn giờ', 'Trình phát sẽ tiếp tục hoạt động bình thường.');
    });
  }

  const savedTarget = localStorage.getItem('audiobook_sleep_target');
  if (savedTarget) {
    const targetTime = Number(savedTarget);
    if (targetTime > Date.now()) {
      sleepTimer.targetEndTime = targetTime;
      updateSleepTimerUI();
      sleepTimer.intervalId = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.round((sleepTimer.targetEndTime - now) / 1000));
        if (remaining <= 0) {
          stopSleepTimer(true);
          pauseAudio();
          try {
            saveProgress(true);
            saveCurrentBookBeforeLeaving();
          } catch (e) {}
          showToast('⏱️ Đã đến giờ hẹn!', 'Trình phát đã tạm dừng và tự động lưu lại toàn bộ tiến độ của bạn.');
        } else {
          updateSleepTimerUI();
        }
      }, 1000);
    } else {
      localStorage.removeItem('audiobook_sleep_target');
    }
  }

  btnGenerateAudio.addEventListener('click', () => {
    if (state.sentences.length > 0 && !state.bookDirty) {
      playAudio();
      return;
    }
    const ok = buildSentencesFromText();
    if (ok) {
      playAudio();
    }
  });

  // ==========================================
  // 8. Tiện ích & Nạp ban đầu
  // ==========================================
  btnSampleText.addEventListener('click', async () => {
    const previousSave = saveCurrentBookBeforeLeaving();
    stopAudio();
    await previousSave;
    state.bookId = null;
    state.bookDirty = true;
    bookTitleInput.value = 'Văn bản mẫu';
    state.rawText = SAMPLE_TEXT_WITH_GARBAGE;
    const purified = purifyAndFilterDocument(SAMPLE_TEXT_WITH_GARBAGE);
    state.cleanedText = purified.text;
    state.currentMode = 'cleaned';
    textInput.value = state.cleanedText;

    tabCleaned.click();
    showAiBanner(purified.removedItems);
  });

  btnSaveBook.addEventListener('click', saveCurrentBook);

  btnClearText.addEventListener('click', async () => {
    if (textInput.value && confirm('Bạn có chắc chắn muốn xóa toàn bộ văn bản?')) {
      const previousSave = saveCurrentBookBeforeLeaving();
      stopAudio();
      await previousSave;
      textInput.value = '';
      state.rawText = '';
      state.cleanedText = '';
      state.sentences = [];
      state.bookId = null;
      state.bookDirty = true;
      bookTitleInput.value = '';
      updateTextStats();
      renderReaderContent();
      state.selectedText = '';
      btnReadSelection.disabled = true;
      currentSentenceDisplay.textContent = 'Đã xóa văn bản.';
      sentenceCounterDisplay.textContent = 'Tiến độ: 0%';
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
  loadSavedBooks();
  window.addEventListener('pagehide', () => {
    if (state.bookDirty && textInput.value.trim()) {
      saveCurrentBook({ keepalive: true, refreshList: false });
    } else {
      saveProgress(true);
    }
  });
});

