/**
 * AudioBook Pro - Trình Đọc Tiếng Việt AI Chuẩn & Hỗ Trợ Offline
 * - Giọng đọc Tiếng Việt AI (Google Cloud) tự nhiên, truyền cảm, tròn vành rõ chữ.
 * - Hỗ trợ giọng đọc Tiếng Việt thiết bị (Web Speech API) khi có sẵn trên máy.
 * - Đọc trọn câu, liền mạch 100%, tuyệt đối không ngắt vụn giữa từ.
 * - Bộ nhớ đệm âm thanh (Audio Cache) giúp nghe mượt mà không độ trễ, hỗ trợ Offline.
 * - Khôi phục và đồng bộ toàn bộ Kho sách & Khóa học đã lưu từ Cloudflare Worker.
 * - Hẹn giờ tắt (Sleep Timer) tự động dừng và lưu lại toàn bộ tiến độ.
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

  // AI Filter & Book Title
  const aiFilterBanner = document.getElementById('aiFilterBanner');
  const aiFilterStatusText = document.getElementById('aiFilterStatusText');
  const btnToggleAiFilter = document.getElementById('btnToggleAiFilter');
  const tabCleaned = document.getElementById('tabCleaned');
  const tabRaw = document.getElementById('tabRaw');
  const btnAiPurify = document.getElementById('btnAiPurify');
  const bookTitleInput = document.getElementById('bookTitleInput');
  const btnSaveBook = document.getElementById('btnSaveBook');
  const savedBooksList = document.getElementById('savedBooksList');
  const savedBooksStatus = document.getElementById('savedBooksStatus');
  const btnRefreshBooks = document.getElementById('btnRefreshBooks');
  const saveStatusIndicator = document.getElementById('saveStatusIndicator');

  // Textarea & Stats
  const textInput = document.getElementById('textInput');
  const statWordCount = document.getElementById('statWordCount');
  const statCharCount = document.getElementById('statCharCount');
  const statEstTime = document.getElementById('statEstTime');
  const btnClearText = document.getElementById('btnClearText');
  const btnSampleText = document.getElementById('btnSampleText');
  const btnGenerateAudio = document.getElementById('btnGenerateAudio');

  // Voice & Controls
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
  const autoScrollLabel = document.getElementById('autoScrollLabel');
  const seekBar = document.getElementById('seekBar');
  const currentTimeDisplay = document.getElementById('currentTimeDisplay');
  const totalTimeDisplay = document.getElementById('totalTimeDisplay');
  const sentenceCounterDisplay = document.getElementById('sentenceCounterDisplay');
  const currentSentenceDisplay = document.getElementById('currentSentenceDisplay');
  const playerStatusTag = document.getElementById('playerStatusTag');
  const waveContainer = document.getElementById('waveContainer');

  // Sleep Timer Elements
  const btnSleepTimer = document.getElementById('btnSleepTimer');
  const sleepTimerLabel = document.getElementById('sleepTimerLabel');
  const sleepTimerModal = document.getElementById('sleepTimerModal');
  const btnCloseSleepTimer = document.getElementById('btnCloseSleepTimer');
  const sleepTimerActiveBox = document.getElementById('sleepTimerActiveBox');
  const sleepTimerCountdown = document.getElementById('sleepTimerCountdown');
  const btnAdd5Min = document.getElementById('btnAdd5Min');
  const btnAdd15Min = document.getElementById('btnAdd15Min');
  const btnCancelSleepTimer = document.getElementById('btnCancelSleepTimer');
  const customTimerMinutes = document.getElementById('customTimerMinutes');
  const btnApplyCustomTimer = document.getElementById('btnApplyCustomTimer');

  // Toast Notification
  const toastNotification = document.getElementById('toastNotification');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');
  const btnCloseToast = document.getElementById('btnCloseToast');

  // Reader Content, Floating Resume Button & Precache Button
  const readerContentBox = document.getElementById('readerContentBox');
  const btnResumeScroll = document.getElementById('btnResumeScroll');
  const btnCopyExtracted = document.getElementById('btnCopyExtracted');
  const btnDownloadText = document.getElementById('btnDownloadText');
  const btnPrecacheAudio = document.getElementById('btnPrecacheAudio');
  const precacheLabel = document.getElementById('precacheLabel');

  // Help Modal
  const helpModal = document.getElementById('helpModal');
  const btnHelp = document.getElementById('btnHelp');
  const btnCloseHelp = document.getElementById('btnCloseHelp');
  const btnConfirmHelp = document.getElementById('btnConfirmHelp');

  // API & Storage Constants
  const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE_URL = IS_LOCAL ? '' : 'https://audiobook-vi-tts.trirk2008.workers.dev';
  const OWNER_STORAGE_KEY = 'audiobook-reader-owner-v1';
  const LOCAL_BOOKS_CACHE_KEY = 'audiobook_offline_books_cache_v3';
  const STORAGE_SESSION_KEY = 'audiobook_offline_session_v3';
  const STORAGE_TIMER_KEY = 'audiobook_sleep_target_v3';
  const AUDIO_CACHE_NAME = 'audiobook-tts-cache-v1';

  // Khởi tạo ownerId định danh duy nhất của trình duyệt để nạp sách đã lưu
  let ownerId = localStorage.getItem(OWNER_STORAGE_KEY);
  if (!ownerId || !/^[0-9a-f-]{36}$/i.test(ownerId)) {
    ownerId = crypto.randomUUID ? crypto.randomUUID() : 'dev-' + Date.now();
    localStorage.setItem(OWNER_STORAGE_KEY, ownerId);
  }

  // Application State
  const state = {
    rawText: '',
    cleanedText: '',
    currentMode: 'cleaned',
    currentBookId: null,
    currentBookTitle: '',
    bookDirty: false,
    sentences: [],
    currentIndex: 0,
    isPlaying: false,
    isPaused: false,
    isLoop: false,
    isAutoScroll: true,
    userScrolledAway: false,
    rate: 1.0,
    volume: 1.0,
    pitch: 1.0,
    previousVolume: 1.0,
    // Voice selection: 'online_google_vi' or Web Speech SpeechSynthesisVoice object
    selectedEngine: 'online_google_vi',
    selectedVoice: null,
    deviceVoices: [],
    // Audio engine state
    currentAudio: null,
    nextAudio: null,
    nextAudioPromise: null,
    prefetchingIndex: -1,
    prefetchGeneration: 0,
    prefetchedIndex: -1,
    audioRequestId: 0,
    audioContext: null,
    gainNodes: new WeakMap(),
    elapsedSeconds: 0,
    positionSeconds: 0,
    clockTimer: null,
    progressSaveTimer: null,
    isPrecaching: false
  };

  const SAMPLE_TEXT = `Chào mừng bạn đến với AudioBook Pro - Trình đọc tiếng Việt thông minh!

Hệ thống cung cấp giọng đọc tiếng Việt chuẩn, ấm áp, liền mạch và truyền cảm. Toàn bộ các câu văn đều được đọc trọn vẹn từ đầu đến cuối, không bao giờ bị cắt vụn ngang từ hay ngắt quãng khó chịu.

Các tính năng nổi bật:
1. Giọng Tiếng Việt AI Chuẩn: Giọng đọc tự nhiên, chuẩn ngữ điệu Việt Nam với công nghệ nạp trước (Preload) 0ms độ trễ.
2. Hỗ trợ Offline: Hệ thống tự động lưu bộ nhớ đệm âm thanh vào máy. Bạn có thể bấm "Tải trước âm thanh" để nghe trọn bài mà không cần kết nối mạng.
3. Đồng bộ Kho Sách & Khóa Học: Toàn bộ tài liệu bạn đã lưu trước đó đều được bảo toàn và tự động nạp lại.
4. Hẹn giờ thông minh: Đặt hẹn giờ 15 phút, 30 phút hay 1 tiếng trước khi đi ngủ. Ứng dụng sẽ tự dừng và lưu chính xác vị trí câu đang nghe.
5. Tự do cuộn trang: Bạn có thể lăn chuột lên xem lại bài thoải mái mà không bị giật màn hình.

Chúc bạn có những trải nghiệm nghe sách thật thư thái và hiệu quả!`;

  // ==========================================
  // 1. Quản lý Giọng đọc & Engine
  // ==========================================
  function initVoices() {
    voiceSelect.innerHTML = '';

    // Nhóm 1: Giọng đọc Tiếng Việt AI Chuẩn (Mặc định, luôn luôn có)
    const aiGroup = document.createElement('optgroup');
    aiGroup.label = '⭐ Giọng đọc Tiếng Việt AI (Khuyến nghị)';
    const optAi = document.createElement('option');
    optAi.value = 'online_google_vi';
    optAi.textContent = '⭐ Giọng Tiếng Việt AI Chuẩn (Tự nhiên, truyền cảm)';
    aiGroup.appendChild(optAi);
    voiceSelect.appendChild(aiGroup);

    // Nhóm 2: Giọng đọc trên thiết bị (Web Speech API)
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      state.deviceVoices = voices;

      const vietnameseDeviceVoices = voices.filter(v =>
        v.lang.toLowerCase().includes('vi') ||
        v.name.toLowerCase().includes('vietnam') ||
        v.name.toLowerCase().includes('vietnamese')
      );

      if (vietnameseDeviceVoices.length > 0) {
        const viGroup = document.createElement('optgroup');
        viGroup.label = '📱 Giọng Tiếng Việt trên thiết bị (Offline)';
        vietnameseDeviceVoices.forEach(voice => {
          const opt = document.createElement('option');
          opt.value = 'device_' + voice.name;
          opt.textContent = `${voice.name} (${voice.lang})`;
          viGroup.appendChild(opt);
        });
        voiceSelect.appendChild(viGroup);
      }

      const otherVoices = voices.filter(v => !vietnameseDeviceVoices.includes(v));
      if (otherVoices.length > 0) {
        const otherGroup = document.createElement('optgroup');
        otherGroup.label = 'Các giọng khác của hệ thống';
        otherVoices.slice(0, 10).forEach(voice => {
          const opt = document.createElement('option');
          opt.value = 'device_' + voice.name;
          opt.textContent = `${voice.name} (${voice.lang})`;
          otherGroup.appendChild(opt);
        });
        voiceSelect.appendChild(otherGroup);
      }
    }

    // Thiết lập mặc định
    voiceSelect.value = state.selectedEngine;
    updateVoiceBadge();
  }

  function updateVoiceBadge() {
    if (state.selectedEngine === 'online_google_vi') {
      headerVoiceBadge.textContent = 'Google Tiếng Việt AI';
      voiceCountBadge.textContent = 'Google AI (Chuẩn)';
    } else if (state.selectedVoice) {
      headerVoiceBadge.textContent = `${state.selectedVoice.name.split(' ')[0]} (Thiết bị)`;
      voiceCountBadge.textContent = 'Giọng thiết bị';
    }
  }

  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
      initVoices();
    };
  }
  initVoices();

  voiceSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'online_google_vi') {
      state.selectedEngine = 'online_google_vi';
      state.selectedVoice = null;
    } else if (val.startsWith('device_')) {
      const voiceName = val.replace('device_', '');
      state.selectedEngine = 'device';
      state.selectedVoice = state.deviceVoices.find(v => v.name === voiceName) || null;
    }
    updateVoiceBadge();
    if (state.isPlaying) {
      jumpToSentence(state.currentIndex);
    }
  });

  // ==========================================
  // 2. Tách Câu Thông Minh (CHỈ DỪNG Ở DẤU CHẤM, KHÔNG NGẮT Ở DẤU PHẨY/HAI CHẤM)
  // ==========================================
  function splitIntoSentences(rawText) {
    if (!rawText || !rawText.trim()) return [];

    const text = rawText
      .replace(/[\r\t\f\v]/g, ' ')
      .replace(/\u200B/g, '')
      .trim();

    const lines = text.split('\n');
    const blocks = [];
    let current = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Dòng trống (phân tách đoạn văn bản)
      if (!line) {
        if (current.trim() && /[.!?]["'”)]*$/.test(current.trim())) {
          blocks.push(current.trim());
          current = '';
        }
        continue;
      }

      // Kiểm tra mục số thứ tự mới (ví dụ "1. ", "2. ") hoặc gạch đầu dòng ("- ", "* ")
      const isNewItem = /^(\d+[\.\)]|[-*•])\s+/.test(line);
      const prevEndsWithColonOrComma = /[:\-,]$/.test(current.trim());

      // Nếu bắt đầu mục mới và đoạn trước không phải tiêu đề kết thúc bằng : thì chốt khối trước
      if (isNewItem && current.trim() && !prevEndsWithColonOrComma) {
        blocks.push(current.trim());
        current = '';
      }

      if (current) {
        current += ' ' + line;
      } else {
        current = line;
      }

      // Nếu đoạn đang kết thúc bằng dấu hai chấm ":", dấu phẩy ",", dấu gạch ngang "-", TUYỆT ĐỐI KHÔNG NGẮT
      if (/[:\-,]$/.test(current.trim())) {
        continue;
      }

      // Chỉ chốt khối khi gặp ranh giới đoạn hoặc gặp mục số mới VÀ câu đã kết thúc bằng dấu chấm (. ! ?)
      const nextLine = (i + 1 < lines.length) ? lines[i + 1].trim() : '';
      const nextIsBoundary = !nextLine || /^(\d+[\.\)]|[-*•])\s+/.test(nextLine);
      const endsWithPeriod = /[.!?]["'”)]*$/.test(current.trim());

      if (endsWithPeriod && (nextIsBoundary || current.length > 800)) {
        blocks.push(current.trim());
        current = '';
      }
    }

    if (current.trim() && /[a-zA-Z0-9à-ỹÀ-Ỹ]/.test(current)) {
      blocks.push(current.trim());
    }

    // Nếu có khối nào dài hơn 1200 ký tự (đoạn quá dài không xuống dòng), CHỈ TÁCH Ở DẤU CHẤM (.)
    const finalBlocks = [];
    for (const b of blocks) {
      if (b.length <= 1200) {
        finalBlocks.push(b);
      } else {
        const subRegex = /([^.!?]+[.!?]+["'”)]*)(?:\s+|$)/g;
        let match;
        let subAcc = '';
        while ((match = subRegex.exec(b)) !== null) {
          const piece = match[1].trim();
          if ((subAcc + ' ' + piece).length > 900 && subAcc) {
            finalBlocks.push(subAcc.trim());
            subAcc = piece;
          } else {
            subAcc = subAcc ? (subAcc + ' ' + piece) : piece;
          }
        }
        if (subAcc.trim()) {
          finalBlocks.push(subAcc.trim());
        }
      }
    }

    return finalBlocks.length > 0 ? finalBlocks : [text.trim()];
  }

  function updateTextStats() {
    const text = textInput.value;
    const charCount = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    statCharCount.textContent = charCount.toLocaleString('vi-VN');
    statWordCount.textContent = words.toLocaleString('vi-VN');

    const minutes = words / (150 * state.rate);
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
    if (!text) return false;

    state.sentences = splitIntoSentences(text);
    state.currentIndex = Math.min(state.currentIndex, Math.max(0, state.sentences.length - 1));
    state.userScrolledAway = false;
    btnResumeScroll.classList.add('hidden');

    renderReaderContent();

    sentenceCounterDisplay.textContent = `Câu: ${state.currentIndex + 1} / ${state.sentences.length}`;
    currentSentenceDisplay.textContent = state.sentences[state.currentIndex] || 'Sẵn sàng phát...';
    updateSeekBar();
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
        state.userScrolledAway = false;
        btnResumeScroll.classList.add('hidden');
        jumpToSentence(index);
      });

      fragment.appendChild(span);
    });

    readerContentBox.appendChild(fragment);
    highlightSentenceInText(state.currentIndex);
  }

  // Cuộn chuột thủ công không bị giật màn hình
  readerContentBox.addEventListener('wheel', (e) => {
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

  btnResumeScroll.addEventListener('click', () => {
    state.userScrolledAway = false;
    btnResumeScroll.classList.add('hidden');
    scrollReaderToCurrentSentence(true);
  });

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

  function scrollReaderToCurrentSentence(force = false) {
    if (!state.isAutoScroll) return;
    if (state.userScrolledAway && !force) return;

    const targetSpan = document.getElementById(`sentence-span-${state.currentIndex}`);
    if (!targetSpan) return;

    const container = readerContentBox;
    const spanOffsetTop = targetSpan.offsetTop - container.offsetTop;
    const containerScrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    const isInView = spanOffsetTop >= containerScrollTop && (spanOffsetTop + targetSpan.offsetHeight) <= (containerScrollTop + containerHeight);

    if (!isInView || force) {
      container.scrollTo({
        top: Math.max(0, spanOffsetTop - 80),
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
  // 3. Audio Cache & Preload Engine
  // ==========================================
    function prepareSpeechText(text) {
    return String(text ?? '')
      .replace(/,/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getVietnameseAudioUrl(text) {
    const params = new URLSearchParams({ q: prepareSpeechText(text), format: 'parts-v2' });
    return `${API_BASE_URL}/tts?${params.toString()}`;
  }

  async function getCachedAudioResponse(text) {
    const cacheUrl = new URL(getVietnameseAudioUrl(text), window.location.href).toString();
    let cache = null;

    if ('caches' in window) {
      try {
        cache = await caches.open(AUDIO_CACHE_NAME);
        const match = await cache.match(cacheUrl);
        if (match) return match;
      } catch (e) {
        console.warn('Không mở được bộ nhớ đệm audio:', e);
      }
    }

    const response = await fetch(cacheUrl, { referrerPolicy: 'no-referrer' });
    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new Error(message || 'Không tải được âm thanh tiếng Việt.');
    }
    if (cache) cache.put(cacheUrl, response.clone()).catch(() => {});
    return response;
  }

  function findSpeechBounds(buffer) {
    const frameSize = Math.max(1, Math.round(buffer.sampleRate * 0.01));
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
    const threshold = 0.001;
    let firstActive = -1;
    let lastActive = -1;

    for (let start = 0; start < buffer.length; start += frameSize) {
      const end = Math.min(buffer.length, start + frameSize);
      let sumSquares = 0;
      let count = 0;
      for (const channel of channels) {
        for (let sample = start; sample < end; sample++) {
          const value = channel[sample];
          sumSquares += value * value;
          count++;
        }
      }
      if (count && Math.sqrt(sumSquares / count) >= threshold) {
        if (firstActive < 0) firstActive = start;
        lastActive = end;
      }
    }

    if (firstActive < 0) return { start: 0, end: buffer.length };
    const padding = Math.round(buffer.sampleRate * 0.02);
    return {
      start: Math.max(0, firstActive - padding),
      end: Math.min(buffer.length, lastActive + padding)
    };
  }

  function resampleToMono(buffer, outputRate) {
    const bounds = findSpeechBounds(buffer);
    const sourceChannels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
    const ratio = buffer.sampleRate / outputRate;
    const outputLength = Math.max(1, Math.ceil((bounds.end - bounds.start) / ratio));
    const output = new Float32Array(outputLength);

    for (let index = 0; index < outputLength; index++) {
      const position = Math.min(bounds.end - 1, bounds.start + index * ratio);
      const left = Math.floor(position);
      const right = Math.min(bounds.end - 1, left + 1);
      const fraction = position - left;
      let value = 0;
      for (const channel of sourceChannels) {
        value += channel[left] + (channel[right] - channel[left]) * fraction;
      }
      output[index] = value / sourceChannels.length;
    }
    return output;
  }

  async function createSeamlessWav(response) {
    if (!response.ok) throw new Error('Không tải được âm thanh tiếng Việt.');
    const payload = await response.json();
    if (payload.format !== 'mp3-parts-v2' || !Array.isArray(payload.parts) || payload.parts.length === 0) {
      throw new Error(payload.error || 'Dữ liệu âm thanh không hợp lệ.');
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('Trình duyệt này không hỗ trợ xử lý âm thanh.');
    const context = new AudioContextClass();
    try {
      const buffers = await Promise.all(payload.parts.map(part => {
        const binary = atob(part.audio);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
        return context.decodeAudioData(bytes.buffer);
      }));
      const outputRate = Math.min(24000, buffers[0].sampleRate);
      const segments = buffers.map((buffer, index) => ({
        samples: resampleToMono(buffer, outputRate),
        pauseSamples: Math.round(Math.max(0, Number(payload.parts[index].pauseAfterMs) || 0) / 1000 * outputRate)
      }));
      const sampleCount = segments.reduce((total, segment) => total + segment.samples.length + segment.pauseSamples, 0);
      const wav = new ArrayBuffer(44 + sampleCount * 2);
      const view = new DataView(wav);
      const writeText = (offset, value) => {
        for (let index = 0; index < value.length; index++) view.setUint8(offset + index, value.charCodeAt(index));
      };

      writeText(0, 'RIFF');
      view.setUint32(4, 36 + sampleCount * 2, true);
      writeText(8, 'WAVE');
      writeText(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, outputRate, true);
      view.setUint32(28, outputRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeText(36, 'data');
      view.setUint32(40, sampleCount * 2, true);

      let offset = 44;
      for (const segment of segments) {
        for (const sample of segment.samples) {
          const clamped = Math.max(-1, Math.min(1, sample));
          view.setInt16(offset, clamped < 0 ? clamped * 32768 : clamped * 32767, true);
          offset += 2;
        }
        offset += segment.pauseSamples * 2;
      }
      return new Blob([wav], { type: 'audio/wav' });
    } finally {
      await context.close().catch(() => {});
    }
  }

  async function getCachedAudioUrl(text) {
    const response = await getCachedAudioResponse(text);
    const wavBlob = await createSeamlessWav(response);
    return URL.createObjectURL(wavBlob);
  }

  async function seekAudioToPosition(audio, seconds) {
    if (!(seconds > 0)) return false;

    if (audio.readyState < 1) {
      const hasMetadata = await new Promise(resolve => {
        let timer;
        const onMetadata = () => finish(true);
        const onError = () => finish(false);
        const finish = ready => {
          clearTimeout(timer);
          audio.removeEventListener('loadedmetadata', onMetadata);
          audio.removeEventListener('error', onError);
          resolve(ready);
        };
        audio.addEventListener('loadedmetadata', onMetadata, { once: true });
        audio.addEventListener('error', onError, { once: true });
        timer = setTimeout(() => finish(false), 1500);
        audio.load();
      });
      if (!hasMetadata) return false;
    }

    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return false;
    const target = Math.min(seconds, Math.max(0, audio.duration - 0.05));
    try {
      audio.currentTime = target;
    } catch {
      return false;
    }

    if (audio.seeking) {
      await new Promise(resolve => {
        let timer;
        const finish = () => {
          clearTimeout(timer);
          audio.removeEventListener('seeked', finish);
          resolve();
        };
        audio.addEventListener('seeked', finish, { once: true });
        timer = setTimeout(finish, 750);
      });
    }
    return Number.isFinite(audio.currentTime) && audio.currentTime > 0;
  }

  function createAudioElement(audioSrc) {
    const audio = new Audio();
    audio.referrerPolicy = 'no-referrer';
    audio.preload = 'auto';
    audio.playbackRate = state.rate;
    audio.volume = state.volume;
    audio.src = audioSrc;
    return audio;
  }

  async function preloadNextSentenceAudio(index) {
    if (index >= state.sentences.length || index < 0) return null;
    if (state.prefetchedIndex === index && state.nextAudio) return state.nextAudio;
    if (state.prefetchingIndex === index && state.nextAudioPromise) return state.nextAudioPromise;

    const generation = ++state.prefetchGeneration;
    const nextText = state.sentences[index];
    const loading = (async () => {
      let audio = null;
      try {
        const audioUrl = await getCachedAudioUrl(nextText);
        audio = createAudioElement(audioUrl);
        await new Promise(resolve => {
          if (audio.readyState >= 2) return resolve();
          let timer;
          const finish = () => {
            clearTimeout(timer);
            audio.removeEventListener('canplay', finish);
            audio.removeEventListener('error', finish);
            resolve();
          };
          audio.addEventListener('canplay', finish, { once: true });
          audio.addEventListener('error', finish, { once: true });
          timer = setTimeout(finish, 1200);
          audio.load();
        });

        const stillRelevant = generation === state.prefetchGeneration &&
          state.sentences[index] === nextText &&
          (index === state.currentIndex || index === state.currentIndex + 1);
        if (!stillRelevant) {
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
          return null;
        }

        if (state.nextAudio && state.nextAudio !== audio) {
          state.nextAudio.pause();
          state.nextAudio.removeAttribute('src');
          state.nextAudio.load();
        }
        state.nextAudio = audio;
        state.prefetchedIndex = index;
        return audio;
      } catch {
        if (audio) {
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
        }
        return null;
      }
    })();

    state.prefetchingIndex = index;
    state.nextAudioPromise = loading;
    try {
      return await loading;
    } finally {
      if (state.nextAudioPromise === loading) {
        state.nextAudioPromise = null;
        state.prefetchingIndex = -1;
      }
    }
  }

  function releaseCurrentAudio() {
    if (state.currentAudio) {
      state.currentAudio.onended = null;
      state.currentAudio.onerror = null;
      state.currentAudio.pause();
      state.currentAudio.removeAttribute('src');
      state.currentAudio.load();
      state.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // ==========================================
  // 4. Phát Âm Thanh Liền Mạch (Play, Pause, Resume, Stop)
  // ==========================================
  async function playCurrentSentence() {
    state.audioRequestId++;
    const requestId = state.audioRequestId;

    // Bỏ qua các câu trống trong 0ms
    while (state.currentIndex < state.sentences.length) {
      const s = state.sentences[state.currentIndex];
      if (s && /[a-zA-Z0-9à-ỹÀ-Ỹ]/.test(s)) break;
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

    // Tự động lưu tiến độ
    saveProgressDebounced();

    // Trường hợp 1: Dùng Giọng đọc Tiếng Việt AI (Google Cloud)
    if (state.selectedEngine === 'online_google_vi') {
      const previousAudio = state.currentAudio;
      if (previousAudio) {
        previousAudio.onended = null;
        previousAudio.ontimeupdate = null;
        previousAudio.onerror = null;
        previousAudio.pause();
        previousAudio.removeAttribute('src');
        previousAudio.load();
      }

      let audio = null;
      if (state.prefetchedIndex === state.currentIndex && state.nextAudio) {
        audio = state.nextAudio;
        state.nextAudio = null;
        state.prefetchedIndex = -1;
      } else {
        setPlayerStatus('Đang nạp giọng Việt...');
        let audioUrl;
        try {
          audioUrl = await getCachedAudioUrl(sentence);
        } catch (error) {
          if (requestId !== state.audioRequestId) return;
          console.warn('Không xử lý được giọng Việt:', error);
          const vietnameseVoice = state.deviceVoices.find(v => v.lang.toLowerCase().includes('vi'));
          if (vietnameseVoice) {
            showToast('Chuyển giọng thiết bị', 'Không tải được giọng Việt trực tuyến; chuyển sang giọng tiếng Việt có sẵn trên máy.');
            state.selectedEngine = 'device';
            state.selectedVoice = vietnameseVoice;
            playCurrentSentence();
          } else {
            setPlayerStatus('Chờ mạng...');
            showToast('Không tải được giọng Việt', 'Vui lòng kiểm tra kết nối rồi thử phát lại.');
            pauseAudio();
          }
          return;
        }
        if (requestId !== state.audioRequestId) return;
        audio = createAudioElement(audioUrl);
      }

      audio.playbackRate = state.rate;
      audio.volume = state.volume;
      state.currentAudio = audio;

      const resumePositionSeconds = Math.max(0, Number(state.positionSeconds) || 0);
      if (resumePositionSeconds > 0) {
        const restoredPosition = await seekAudioToPosition(audio, resumePositionSeconds);
        if (requestId !== state.audioRequestId) return;
        if (restoredPosition) state.positionSeconds = audio.currentTime;
      }

      let hasTriggeredNext = false;
      const triggerNextSentence = async () => {
        if (hasTriggeredNext || state.currentAudio !== audio || requestId !== state.audioRequestId) return;
        if (!state.isPlaying || state.isPaused) return;

        const nextIndex = state.currentIndex + 1;
        if (nextIndex < state.sentences.length &&
            !(state.prefetchedIndex === nextIndex && state.nextAudio)) {
          if (state.prefetchingIndex === nextIndex && state.nextAudioPromise) {
            await state.nextAudioPromise;
          } else {
            await preloadNextSentenceAudio(nextIndex);
          }
        }
        if (state.currentAudio !== audio || requestId !== state.audioRequestId ||
            !state.isPlaying || state.isPaused) return;

        hasTriggeredNext = true;
        state.positionSeconds = 0;
        state.currentIndex++;
        playCurrentSentence();
      };

      audio.onended = triggerNextSentence;

      audio.onerror = (e) => {
        if (state.currentAudio !== audio || requestId !== state.audioRequestId) return;
        console.warn('Lỗi phát giọng online:', e);
        // Fallback sang Web Speech API nếu thiết bị có giọng tiếng Việt
        if (state.deviceVoices.some(v => v.lang.toLowerCase().includes('vi'))) {
          showToast('Chuyển giọng thiết bị', 'Không có mạng: Chuyển sang giọng tiếng Việt có sẵn trên máy.');
          state.selectedEngine = 'device';
          state.selectedVoice = state.deviceVoices.find(v => v.lang.toLowerCase().includes('vi'));
          playCurrentSentence();
        } else {
          setPlayerStatus('Chờ mạng...');
          showToast('Mất kết nối', 'Vui lòng kiểm tra Internet hoặc bấm "Tải trước âm thanh" để nghe Offline.');
          pauseAudio();
        }
      };

      preloadNextSentenceAudio(state.currentIndex + 1);

      try {
        await audio.play();
        if (requestId !== state.audioRequestId || !state.isPlaying || state.isPaused) {
          audio.pause();
          return;
        }
        setPlayerStatus('Đang phát');
        setWaveAnimation(true);
        startClockTimer();

      } catch (err) {
        if (requestId !== state.audioRequestId) return;
        console.warn('Play error:', err);
      }

    } else {
      // Trường hợp 2: Dùng Web Speech API của thiết bị (OFFLINE)
      releaseCurrentAudio();

      const utterance = new SpeechSynthesisUtterance(prepareSpeechText(sentence));
      if (state.selectedVoice) {
        utterance.voice = state.selectedVoice;
      }
      utterance.lang = state.selectedVoice?.lang || 'vi-VN';
      utterance.rate = state.rate;
      utterance.volume = state.volume;
      utterance.pitch = state.pitch;

      utterance.onend = () => {
        if (requestId !== state.audioRequestId) return;
        if (state.isPlaying && !state.isPaused) {
          state.positionSeconds = 0;
          state.currentIndex++;
          playCurrentSentence();
        }
      };

      utterance.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        if (state.isPlaying && !state.isPaused) {
          state.positionSeconds = 0;
          state.currentIndex++;
          playCurrentSentence();
        }
      };

      window.speechSynthesis.speak(utterance);
      setPlayerStatus('Đang phát (Thiết bị)');
      setWaveAnimation(true);
      startClockTimer();
    }

    state.isPlaying = true;
    state.isPaused = false;
    updatePlayPauseButtonUI(true);
  }

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

  function pauseAudio() {
    if (!state.isPlaying && !state.isPaused) return;

    if (state.selectedEngine === 'online_google_vi' && state.currentAudio &&
        Number.isFinite(state.currentAudio.currentTime)) {
      state.positionSeconds = Math.max(0, state.currentAudio.currentTime);
    }

    state.isPaused = true;
    state.isPlaying = false;
    state.audioRequestId++;

    if (state.currentAudio) {
      state.currentAudio.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    updatePlayPauseButtonUI(false);
    setPlayerStatus(`Tạm dừng (Câu ${state.currentIndex + 1}/${state.sentences.length})`);
    setWaveAnimation(false);
    stopClockTimer();
    saveProgress(true);
  }

  function stopAudio({ resetProgress = true } = {}) {
    state.audioRequestId++;
    state.prefetchGeneration++;
    state.nextAudioPromise = null;
    state.prefetchingIndex = -1;

    if (state.selectedEngine === 'online_google_vi' && state.currentAudio &&
        Number.isFinite(state.currentAudio.currentTime)) {
      state.positionSeconds = Math.max(0, state.currentAudio.currentTime);
    }

    releaseCurrentAudio();
    if (state.nextAudio) {
      state.nextAudio.removeAttribute('src');
      state.nextAudio.load();
      state.nextAudio = null;
      state.prefetchedIndex = -1;
    }

    state.isPlaying = false;
    state.isPaused = false;
    if (resetProgress) {
      state.currentIndex = 0;
      state.elapsedSeconds = 0;
      state.positionSeconds = 0;
    }
    state.userScrolledAway = false;
    btnResumeScroll.classList.add('hidden');

    updatePlayPauseButtonUI(false);
    setPlayerStatus('Đã dừng');
    setWaveAnimation(false);
    stopClockTimer();

    if (state.sentences.length > 0) {
      const displayIndex = resetProgress ? 0 : Math.min(state.currentIndex, state.sentences.length - 1);
      currentSentenceDisplay.textContent = state.sentences[displayIndex];
      sentenceCounterDisplay.textContent = 'Câu: ' + (displayIndex + 1) + ' / ' + state.sentences.length;
      highlightSentenceInText(displayIndex);
    }
    if (resetProgress) seekBar.value = 0;
    else updateSeekBar();
    currentTimeDisplay.textContent = formatTime(state.elapsedSeconds);
    saveProgress(true);
  }

  function jumpToSentence(index) {
    if (index < 0 || index >= state.sentences.length) return;
    state.currentIndex = index;
    state.positionSeconds = 0;

    if (state.isPlaying && !state.isPaused) {
      playCurrentSentence();
    } else {
      currentSentenceDisplay.textContent = state.sentences[index];
      sentenceCounterDisplay.textContent = `Câu: ${index + 1} / ${state.sentences.length}`;
      highlightSentenceInText(index);
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
    if (statusText.includes('Đang phát')) {
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
        if (state.selectedEngine === 'online_google_vi' && state.currentAudio &&
            Number.isFinite(state.currentAudio.currentTime)) {
          state.positionSeconds = Math.max(0, state.currentAudio.currentTime);
        }
        currentTimeDisplay.textContent = formatTime(state.elapsedSeconds);
        if (state.elapsedSeconds % 5 === 0) saveProgress(false);
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
  // 5. Điều Khiển Realtime (Tốc độ, Âm lượng)
  // ==========================================
  rateSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.rate = val;
    rateValueDisplay.textContent = `${val.toFixed(2)}x`;
    playerRateDisplay.textContent = `${val.toFixed(2)}x`;
    if (state.currentAudio) state.currentAudio.playbackRate = val;
    if (state.nextAudio) state.nextAudio.playbackRate = val;
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
      if (state.nextAudio) state.nextAudio.playbackRate = val;

      document.querySelectorAll('.quick-rate').forEach(b => {
        b.className = 'quick-rate px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer';
      });
      btn.className = 'quick-rate px-2 py-1 rounded bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold transition cursor-pointer';

      updateTextStats();
    });
  });

  volumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.volume = val;
    if (state.currentAudio) state.currentAudio.volume = val;
    if (state.nextAudio) state.nextAudio.volume = val;
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
    if (state.nextAudio) state.nextAudio.volume = state.volume;
    if (window.lucide) lucide.createIcons();
  });

  pitchSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.pitch = val;
    pitchValueDisplay.textContent = val.toFixed(2);
  });

  btnPlayPause.addEventListener('click', () => {
    if (state.isPlaying && !state.isPaused) pauseAudio();
    else playAudio();
  });

  btnDedicatedPause.addEventListener('click', () => {
    if (state.isPlaying && !state.isPaused) pauseAudio();
    else if (state.isPaused) playAudio();
  });

  btnStop.addEventListener('click', stopAudio);

  btnPrev.addEventListener('click', () => {
    if (state.currentIndex > 0) jumpToSentence(state.currentIndex - 1);
  });

  btnNext.addEventListener('click', () => {
    if (state.currentIndex < state.sentences.length - 1) jumpToSentence(state.currentIndex + 1);
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
    if (ok) playAudio();
  });

  // ==========================================
  // 6. Tính năng Tải Trước Âm Thanh (OFFLINE CACHE)
  // ==========================================
  if (btnPrecacheAudio) {
    btnPrecacheAudio.addEventListener('click', async () => {
      if (state.isPrecaching) return;
      if (state.sentences.length === 0) {
        buildSentencesFromText();
        if (state.sentences.length === 0) {
          alert('Vui lòng nhập văn bản trước khi tải âm thanh.');
          return;
        }
      }

      state.isPrecaching = true;
      btnPrecacheAudio.disabled = true;
      const total = state.sentences.length;
      showToast('Đang tải trước âm thanh', `Bắt đầu nạp ${total} câu vào bộ nhớ đệm offline...`);

      let loaded = 0;
      for (let i = 0; i < total; i++) {
        precacheLabel.textContent = `Đang tải: ${i + 1}/${total}`;
        try {
          await getCachedAudioResponse(state.sentences[i]);
          loaded++;
        } catch (e) {
          console.warn('Lỗi cache câu:', i, e);
        }
      }

      state.isPrecaching = false;
      btnPrecacheAudio.disabled = false;
      precacheLabel.textContent = `Đã lưu offline (${loaded}/${total})`;
      showToast('Tải trước hoàn tất! 🎉', `Đã lưu ${loaded}/${total} câu vào máy. Giờ bạn có thể nghe khi không có mạng.`);
      setTimeout(() => {
        precacheLabel.textContent = 'Tải trước âm thanh (Offline)';
      }, 4000);
    });
  }

  // ==========================================
  // 7. Hẹn Giờ Dừng & Tự Động Lưu (SLEEP TIMER)
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
    toastHideTimeout = setTimeout(hideToast, 5000);
  }

  function hideToast() {
    if (!toastNotification) return;
    toastNotification.classList.add('-translate-y-24', 'opacity-0', 'pointer-events-none');
    toastNotification.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
  }

  if (btnCloseToast) btnCloseToast.addEventListener('click', hideToast);

  const sleepTimer = {
    intervalId: null,
    targetEndTime: null,
    initialMinutes: 0
  };

  function updateSleepTimerUI() {
    if (!btnSleepTimer || !sleepTimerLabel) return;

    if (!sleepTimer.targetEndTime) {
      btnSleepTimer.className = 'px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition text-xs flex items-center gap-1.5 cursor-pointer select-none';
      sleepTimerLabel.textContent = 'Hẹn giờ';
      if (sleepTimerActiveBox) {
        sleepTimerActiveBox.classList.add('hidden');
        sleepTimerActiveBox.classList.remove('flex');
      }
      return;
    }

    const now = Date.now();
    const remaining = Math.max(0, Math.round((sleepTimer.targetEndTime - now) / 1000));

    btnSleepTimer.className = 'px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold shadow-md shadow-cyan-500/30 transition text-xs flex items-center gap-1.5 cursor-pointer select-none animate-pulse';
    sleepTimerLabel.textContent = `⏱️ ${formatTimerDisplay(remaining)}`;
    if (sleepTimerCountdown) sleepTimerCountdown.textContent = formatTimerDisplay(remaining);
    if (sleepTimerActiveBox) {
      sleepTimerActiveBox.classList.remove('hidden');
      sleepTimerActiveBox.classList.add('flex');
    }
  }

  function formatTimerDisplay(totalSecs) {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function openSleepTimerModal() {
    if (!sleepTimerModal) return;
    updateSleepTimerUI();
    sleepTimerModal.classList.remove('hidden');
    sleepTimerModal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  }

  function closeSleepTimerModal() {
    if (!sleepTimerModal) return;
    sleepTimerModal.classList.add('hidden');
    sleepTimerModal.classList.remove('flex');
  }

  function startSleepTimer(minutes) {
    const mins = Number(minutes);
    if (!mins || mins <= 0) {
      alert('Vui lòng nhập số phút lớn hơn 0.');
      return;
    }

    if (sleepTimer.intervalId) {
      clearInterval(sleepTimer.intervalId);
      sleepTimer.intervalId = null;
    }

    sleepTimer.initialMinutes = mins;
    sleepTimer.targetEndTime = Date.now() + mins * 60 * 1000;
    localStorage.setItem(STORAGE_TIMER_KEY, String(sleepTimer.targetEndTime));

    updateSleepTimerUI();
    closeSleepTimerModal();

    showToast('Đã đặt hẹn giờ tắt', `Trình phát sẽ tự động dừng và lưu vị trí sau ${mins} phút nữa.`);

    sleepTimer.intervalId = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((sleepTimer.targetEndTime - now) / 1000));

      if (remaining <= 0) {
        stopSleepTimer(true);
        pauseAudio();
        saveProgress(true);
        showToast('⏱️ Đã đến giờ hẹn!', 'Trình phát đã tạm dừng và tự động lưu lại toàn bộ tiến độ.');
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
    if (clearStorage) localStorage.removeItem(STORAGE_TIMER_KEY);
    updateSleepTimerUI();
  }

  function addTimerMinutes(extra) {
    if (!sleepTimer.targetEndTime) {
      startSleepTimer(extra);
      return;
    }
    sleepTimer.targetEndTime += extra * 60 * 1000;
    localStorage.setItem(STORAGE_TIMER_KEY, String(sleepTimer.targetEndTime));
    updateSleepTimerUI();
    showToast('Đã cộng thêm giờ', `Đã cộng thêm ${extra} phút vào hẹn giờ.`);
  }

  if (btnSleepTimer) {
    btnSleepTimer.addEventListener('click', (e) => {
      e.stopPropagation();
      openSleepTimerModal();
    });
  }

  if (btnCloseSleepTimer) btnCloseSleepTimer.addEventListener('click', closeSleepTimerModal);

  if (sleepTimerModal) {
    sleepTimerModal.addEventListener('click', (e) => {
      if (e.target === sleepTimerModal) closeSleepTimerModal();
    });
  }

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
        alert('Vui lòng nhập số phút hợp lệ.');
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

  if (btnAdd5Min) btnAdd5Min.addEventListener('click', () => addTimerMinutes(5));
  if (btnAdd15Min) btnAdd15Min.addEventListener('click', () => addTimerMinutes(15));
  if (btnCancelSleepTimer) {
    btnCancelSleepTimer.addEventListener('click', () => {
      stopSleepTimer(true);
      showToast('Đã hủy hẹn giờ', 'Trình phát sẽ tiếp tục hoạt động bình thường.');
    });
  }

  // Khôi phục hẹn giờ nếu còn hiệu lực
  const savedTimer = localStorage.getItem(STORAGE_TIMER_KEY);
  if (savedTimer) {
    const target = Number(savedTimer);
    if (target > Date.now()) {
      sleepTimer.targetEndTime = target;
      updateSleepTimerUI();
      sleepTimer.intervalId = setInterval(() => {
        const remaining = Math.max(0, Math.round((sleepTimer.targetEndTime - Date.now()) / 1000));
        if (remaining <= 0) {
          stopSleepTimer(true);
          pauseAudio();
          saveProgress(true);
          showToast('⏱️ Đã đến giờ hẹn!', 'Trình phát đã tạm dừng và tự động lưu lại toàn bộ tiến độ.');
        } else {
          updateSleepTimerUI();
        }
      }, 1000);
    } else {
      localStorage.removeItem(STORAGE_TIMER_KEY);
    }
  }

  // ==========================================
  // 8. KHO SÁCH & TIẾN ĐỘ (ĐỒNG BỘ CLOUD & LOCAL CACHE)
  // ==========================================
  async function booksRequest(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${ownerId}`);
    if (options.body) headers.set('Content-Type', 'application/json');
    return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  }

  function getLocalCachedBooks() {
    try {
      const raw = localStorage.getItem(LOCAL_BOOKS_CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveLocalCachedBooks(books) {
    try {
      localStorage.setItem(LOCAL_BOOKS_CACHE_KEY, JSON.stringify(books));
    } catch (e) {
      console.warn('Lỗi lưu cache sách:', e);
    }
  }

  function renderSavedBooks(books) {
    savedBooksList.innerHTML = '';
    if (!books || books.length === 0) {
      savedBooksList.innerHTML = '<div class="text-xs text-slate-500 italic col-span-full py-4 text-center">Chưa có sách nào được lưu. Tài liệu bạn tải lên sẽ tự động lưu lại ở đây để nghe tiếp!</div>';
      savedBooksStatus.textContent = '0 sách';
      return;
    }

    savedBooksStatus.textContent = `${books.length} sách`;

    books.forEach(book => {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 flex flex-col justify-between gap-2.5 transition';

      const isCurrent = state.currentBookId === book.id;
      const progressIndex = Number(book.position_index) || 0;
      const progressText = progressIndex > 0 ? `Đang nghe câu ${progressIndex + 1}` : 'Chưa nghe';

      card.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="overflow-hidden min-w-0">
            <h4 class="font-semibold text-xs text-slate-200 truncate ${isCurrent ? 'text-indigo-400' : ''}">${escapeHtml(book.title || 'Sách không tên')}</h4>
            <p class="text-[11px] text-slate-400 mt-0.5">
              <span class="text-cyan-400 font-medium">${progressText}</span>
              ${book.elapsed_seconds ? ` • Đã nghe ${formatTime(book.elapsed_seconds)}` : ''}
            </p>
          </div>
          <button class="btn-delete-book text-slate-500 hover:text-rose-400 p-1 cursor-pointer flex-shrink-0" title="Xóa sách này">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
        <button class="btn-open-book w-full py-1.5 px-3 rounded-lg text-xs font-semibold ${isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'} flex items-center justify-center gap-1.5 transition cursor-pointer">
          <i data-lucide="play" class="w-3 h-3"></i>
          <span>${isCurrent ? 'Đang mở (Nghe tiếp)' : 'Mở sách này'}</span>
        </button>
      `;

      card.querySelector('.btn-open-book').addEventListener('click', () => {
        loadSavedBook(book.id, book);
      });

      card.querySelector('.btn-delete-book').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteBook(book.id, book.title);
      });

      savedBooksList.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  async function loadSavedBooks() {
    // 1. Nạp ngay từ Local Cache (0ms, không độ trễ, hỗ trợ Offline)
    const localBooks = getLocalCachedBooks();
    if (localBooks.length > 0) {
      renderSavedBooks(localBooks);
      savedBooksStatus.textContent = `${localBooks.length} sách (đang đồng bộ...)`;
    }

    // 2. Đồng bộ danh sách từ Cloudflare Worker DB
    try {
      const response = await booksRequest('/books');
      if (response.ok) {
        const cloudBooks = await response.json();
        // Hợp nhất dữ liệu local và cloud
        const mergedMap = new Map();
        localBooks.forEach(b => mergedMap.set(b.id, b));
        cloudBooks.forEach(b => {
          const local = mergedMap.get(b.id);
          if (!local || Number(b.updated_at || 0) >= Number(local.updated_at || 0)) {
            mergedMap.set(b.id, { ...local, ...b });
          }
        });
        const mergedBooks = Array.from(mergedMap.values());
        
        saveLocalCachedBooks(mergedBooks);
        renderSavedBooks(mergedBooks);
        savedBooksStatus.textContent = `${mergedBooks.length} sách (đã đồng bộ)`;
      } else {
        savedBooksStatus.textContent = `${localBooks.length} sách (Offline)`;
      }
    } catch (err) {
      console.warn('Lỗi đồng bộ sách từ cloud:', err);
      savedBooksStatus.textContent = `${localBooks.length} sách (Offline)`;
    }
  }

  if (btnRefreshBooks) {
    btnRefreshBooks.addEventListener('click', () => {
      showToast('Đang đồng bộ', 'Đang tải lại danh sách sách từ máy chủ...');
      loadSavedBooks();
    });
  }

  async function loadSavedBook(id, bookHint = null) {
    const previousBookId = state.currentBookId;
    if (state.selectedEngine === 'online_google_vi' && state.currentAudio &&
        Number.isFinite(state.currentAudio.currentTime)) {
      state.positionSeconds = Math.max(0, state.currentAudio.currentTime);
    }
    const currentProgress = previousBookId ? {
      position_index: state.currentIndex,
      position_seconds: state.positionSeconds,
      elapsed_seconds: state.elapsedSeconds,
      rate: state.rate
    } : null;
    stopAudio({ resetProgress: false });
    savedBooksStatus.textContent = 'Đang mở sách...';

    let book = bookHint;
    const localBook = getLocalCachedBooks().find(item => item.id === id);
    if (localBook && (!book || Number(localBook.updated_at || 0) >= Number(book.updated_at || 0))) {
      book = { ...book, ...localBook };
    }
    if (book && previousBookId === id && currentProgress) {
      book = { ...book, ...currentProgress };
    }
    // Nếu chưa có content trong hint, lấy từ server hoặc local cache
    if (!book || !book.content) {
      const localBooks = getLocalCachedBooks();
      book = localBooks.find(b => b.id === id) || book;
    }

    if (!book || !book.content) {
      try {
        const response = await booksRequest(`/books/${id}`);
        if (response.ok) {
          book = await response.json();
        }
      } catch (err) {
        console.warn('Lỗi tải nội dung sách từ cloud:', err);
      }
    }

    if (!book || !book.content) {
      alert('Không thể mở sách này (thiếu nội dung). Vui lòng thử lại.');
      return;
    }

    state.currentBookId = book.id;
    state.currentBookTitle = book.title || 'Sách đã lưu';
    state.bookDirty = false;
    bookTitleInput.value = state.currentBookTitle;

    state.rawText = book.content;
    state.cleanedText = book.content;
    state.currentMode = book.mode || 'cleaned';
    textInput.value = book.content;

    state.currentIndex = Math.max(0, Number(book.position_index) || 0);
    state.positionSeconds = Math.max(0, Number(book.position_seconds) || 0);
    state.elapsedSeconds = Math.max(0, Number(book.elapsed_seconds) || 0);

    if (Number(book.rate) > 0) {
      state.rate = Math.min(2.5, Math.max(0.5, Number(book.rate)));
      rateSlider.value = state.rate;
      rateValueDisplay.textContent = `${state.rate.toFixed(2)}x`;
      playerRateDisplay.textContent = `${state.rate.toFixed(2)}x`;
    }

    updateTextStats();
    buildSentencesFromText();
    currentTimeDisplay.textContent = formatTime(state.elapsedSeconds);
    saveProgress(true);
    renderSavedBooks(getLocalCachedBooks());
    showToast('Đã mở sách', `Đang tiếp tục "${book.title}" từ câu ${state.currentIndex + 1}.`);
  }

  async function saveCurrentBook() {
    const content = textInput.value.trim();
    if (!content) {
      alert('Vui lòng tải lên hoặc nhập văn bản trước khi lưu sách.');
      return;
    }
    if (state.selectedEngine === 'online_google_vi' && state.currentAudio &&
        Number.isFinite(state.currentAudio.currentTime)) {
      state.positionSeconds = Math.max(0, state.currentAudio.currentTime);
    }

    const title = bookTitleInput.value.trim() || 'Sách ' + new Date().toLocaleDateString('vi-VN');
    const id = state.currentBookId || (crypto.randomUUID ? crypto.randomUUID() : 'book_' + Date.now());
    state.currentBookId = id;
    state.currentBookTitle = title;
    state.bookDirty = false;

    const bookData = {
      id,
      title,
      content,
      mode: state.currentMode,
      position_index: state.currentIndex,
      position_seconds: state.positionSeconds,
      elapsed_seconds: state.elapsedSeconds,
      rate: state.rate,
      updated_at: Date.now()
    };

    // 1. Lưu vào Local Cache ngay lập tức
    const localBooks = getLocalCachedBooks();
    const existingIdx = localBooks.findIndex(b => b.id === id);
    if (existingIdx !== -1) {
      localBooks[existingIdx] = { ...localBooks[existingIdx], ...bookData };
    } else {
      localBooks.unshift(bookData);
    }
    saveLocalCachedBooks(localBooks);
    renderSavedBooks(localBooks);

    showToast('Đã lưu sách', `"${title}" đã được lưu thành công.`);

    // 2. Gửi đồng bộ lên Cloudflare Worker DB nếu có mạng
    try {
      await booksRequest(`/books/${id}`, {
        method: 'PUT',
        body: JSON.stringify(bookData)
      });
      savedBooksStatus.textContent = `${localBooks.length} sách (đã lưu)`;
    } catch (err) {
      console.warn('Lỗi lưu sách lên cloud:', err);
    }
  }

  btnSaveBook.addEventListener('click', saveCurrentBook);

  async function deleteBook(id, title) {
    if (!confirm(`Bạn có chắc chắn muốn xóa "${title}" khỏi danh sách?`)) return;

    // Xóa trong local cache
    const updated = getLocalCachedBooks().filter(b => b.id !== id);
    saveLocalCachedBooks(updated);
    if (state.currentBookId === id) state.currentBookId = null;
    renderSavedBooks(updated);
    showToast('Đã xóa sách', `"${title}" đã được xóa khỏi danh sách.`);
  }

  function saveProgressDebounced() {
    clearTimeout(state.progressSaveTimer);
    state.progressSaveTimer = setTimeout(() => {
      saveProgress(false);
    }, 2500);
  }

  async function saveProgress(immediate = false) {
    if (!state.currentBookId && !textInput.value.trim()) return;

    if (state.selectedEngine === 'online_google_vi' && state.currentAudio &&
        Number.isFinite(state.currentAudio.currentTime)) {
      state.positionSeconds = Math.max(0, state.currentAudio.currentTime);
    }

    // Cập nhật Local Cache
    if (state.currentBookId) {
      const localBooks = getLocalCachedBooks();
      const b = localBooks.find(item => item.id === state.currentBookId);
      if (b) {
        b.position_index = state.currentIndex;
        b.position_seconds = state.positionSeconds;
        b.elapsed_seconds = state.elapsedSeconds;
        b.updated_at = Date.now();
        saveLocalCachedBooks(localBooks);
      }
    }

    // Lưu session gần nhất
    const session = {
      bookId: state.currentBookId,
      title: bookTitleInput.value.trim() || state.currentBookTitle || 'Văn bản đang đọc',
      rawText: state.rawText || textInput.value,
      cleanedText: state.cleanedText || textInput.value,
      currentMode: state.currentMode,
      currentIndex: state.currentIndex,
      positionSeconds: state.positionSeconds,
      elapsedSeconds: state.elapsedSeconds,
      rate: state.rate,
      volume: state.volume,
      updatedAt: Date.now()
    };
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    } catch {}

    // Gửi cập nhật tiến độ lên Cloud nếu có id
    if (state.currentBookId) {
      try {
        booksRequest(`/books/${state.currentBookId}/progress`, {
          method: 'PATCH',
          keepalive: immediate,
          body: JSON.stringify({
            position_index: state.currentIndex,
            position_seconds: state.positionSeconds,
            elapsed_seconds: state.elapsedSeconds,
            rate: state.rate
          })
        }).catch(() => {});
      } catch {}
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  }

  // ==========================================
  // 9. AI Lọc Sạch Mục Lục, Header, Tiêu Đề Rác
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

        if (isTocEnd) inToc = false;
        else {
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

  tabCleaned.addEventListener('click', () => {
    state.currentMode = 'cleaned';
    tabCleaned.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer';
    tabRaw.className = 'px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer';
    textInput.value = state.cleanedText || state.rawText;
    updateTextStats();
    buildSentencesFromText();
  });

  tabRaw.addEventListener('click', () => {
    state.currentMode = 'raw';
    tabRaw.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-white shadow-sm transition cursor-pointer';
    tabCleaned.className = 'px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition cursor-pointer';
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
  // 10. Tải File PDF, Word, Text
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
    if (files.length > 0) handleFile(files[0]);
  });

  dropZone.addEventListener('click', (e) => {
    if (e.target !== fileInput) fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
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

    const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
    bookTitleInput.value = cleanTitle;
    state.currentBookTitle = cleanTitle;

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

      // Tự động lưu sách
      saveCurrentBook();

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
    if (!window.pdfjsLib) throw new Error('Thư viện PDF.js chưa sẵn sàng.');
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
    if (!window.mammoth) throw new Error('Thư viện Mammoth chưa sẵn sàng.');
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
  // 11. Tiện ích & Nạp ban đầu
  // ==========================================
  btnSampleText.addEventListener('click', () => {
    state.rawText = SAMPLE_TEXT;
    const purified = purifyAndFilterDocument(SAMPLE_TEXT);
    state.cleanedText = purified.text;
    state.currentMode = 'cleaned';
    textInput.value = state.cleanedText;
    bookTitleInput.value = 'Văn bản mẫu AudioBook Pro';
    state.currentBookTitle = 'Văn bản mẫu AudioBook Pro';
    state.currentBookId = null;

    tabCleaned.click();
    showAiBanner(purified.removedItems);
  });

  btnClearText.addEventListener('click', () => {
    if (textInput.value && confirm('Bạn có chắc chắn muốn xóa toàn bộ văn bản?')) {
      stopAudio();
      textInput.value = '';
      bookTitleInput.value = '';
      state.rawText = '';
      state.cleanedText = '';
      state.sentences = [];
      state.currentBookId = null;
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
    a.download = (bookTitleInput.value.trim() || 'van-ban-audiobook') + '.txt';
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
    if (document.activeElement === textInput || document.activeElement === bookTitleInput || document.activeElement.tagName === 'INPUT') {
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

  // Khôi phục phiên đọc gần nhất
  function restoreLastSession() {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.cleanedText) {
          const cachedBook = session.bookId
            ? getLocalCachedBooks().find(book => book.id === session.bookId)
            : null;
          state.currentBookId = session.bookId || null;
          state.rawText = session.rawText;
          state.cleanedText = session.cleanedText;
          state.currentMode = session.currentMode || 'cleaned';
          state.currentIndex = Math.max(0, Number(session.currentIndex ?? cachedBook?.position_index) || 0);
          state.elapsedSeconds = Math.max(0, Number(session.elapsedSeconds ?? cachedBook?.elapsed_seconds) || 0);
          state.positionSeconds = Math.max(0, Number(session.positionSeconds ?? cachedBook?.position_seconds) || 0);
          if (session.rate) {
            state.rate = session.rate;
            rateSlider.value = session.rate;
            rateValueDisplay.textContent = `${session.rate.toFixed(2)}x`;
            playerRateDisplay.textContent = `${session.rate.toFixed(2)}x`;
          }
          bookTitleInput.value = session.title || '';
          state.currentBookTitle = session.title || '';
          textInput.value = state.cleanedText;
          updateTextStats();
          buildSentencesFromText();
          currentTimeDisplay.textContent = formatTime(state.elapsedSeconds);
          return true;
        }
      }
    } catch (e) {
      console.warn('Lỗi khôi phục session:', e);
    }
    return false;
  }

  // Khởi động ứng dụng
  const restored = restoreLastSession();
  if (!restored) {
    state.rawText = SAMPLE_TEXT;
    const initialPurified = purifyAndFilterDocument(SAMPLE_TEXT);
    state.cleanedText = initialPurified.text;
    state.currentMode = 'cleaned';
    textInput.value = state.cleanedText;
    bookTitleInput.value = 'Văn bản mẫu AudioBook Pro';
    updateTextStats();
    buildSentencesFromText();
    showAiBanner(initialPurified.removedItems);
  }

  // Tải danh sách sách đã lưu
  loadSavedBooks();

  window.addEventListener('pagehide', () => {
    saveProgress(true);
  });
});
