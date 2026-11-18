/**
 * AudioBook Pro - Trình Đọc Văn Bản Tiếng Việt Tự Động
 * Công nghệ: Web Speech API, PDF.js, Mammoth.js
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

  // DOM Elements
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileLoadingOverlay = document.getElementById('fileLoadingOverlay');
  const fileLoadingText = document.getElementById('fileLoadingText');
  const fileInfoBar = document.getElementById('fileInfoBar');
  const fileNameDisplay = document.getElementById('fileName');
  const fileSizeDisplay = document.getElementById('fileSize');
  const btnRemoveFile = document.getElementById('btnRemoveFile');

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
  const playPauseIcon = document.getElementById('playPauseIcon');
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
    text: '',
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
    currentUtterance: null,
    debounceTimeout: null,
    keepAliveTimer: null,
    startTime: 0,
    estimatedTotalSeconds: 0,
    elapsedSeconds: 0,
    clockTimer: null
  };

  // Mẫu văn bản tiếng Việt
  const SAMPLE_TEXT = `Chào mừng bạn đến với ứng dụng AudioBook Pro! 

Đây là công cụ đọc văn bản thành tiếng cực kỳ mạnh mẽ, được tối ưu riêng cho Tiếng Việt. 

Bạn có thể tải lên toàn bộ tài liệu từ các tệp PDF nhiều trang, văn bản Word (.docx) hoặc sao chép và dán trực tiếp bất kỳ bài viết nào vào đây. Hệ thống sẽ trích xuất trọn vẹn toàn bộ nội dung và phân tích từng câu một cách thông minh.

Trong quá trình nghe, bạn hoàn toàn có thể:
1. Nhấp trực tiếp vào bất cứ câu văn nào bên dưới để nghe đọc ngay từ câu đó.
2. Tăng giảm tốc độ đọc từ 0.5x đến 2.5x theo thời gian thực mà không bị gián đoạn.
3. Thay đổi âm lượng và cao độ giọng đọc một cách linh hoạt.
4. Tạm dừng, tiếp tục hoặc kéo thanh trượt tiến trình như khi xem video.

Chúc bạn có những phút giây trải nghiệm nghe đọc tài liệu thật hiệu quả và thư giãn!`;

  // ==========================================
  // 1. Quản lý Giọng đọc (Voices Management)
  // ==========================================
  function loadVoices() {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ Web Speech API. Vui lòng sử dụng Google Chrome, Microsoft Edge hoặc Safari phiên bản mới nhất.');
      return;
    }

    let voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      return;
    }

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

    // Các giọng khác (dự phòng)
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

  // Lắng nghe sự kiện nạp giọng
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
    // Nếu đang đọc, áp dụng ngay giọng mới cho câu hiện tại
    if (state.isPlaying && !state.isPaused) {
      restartCurrentSentence();
    }
  });

  // ==========================================
  // 2. Xử lý Trích xuất File (PDF, DOCX, TXT)
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

    showFileLoading(true, `Đang xử lý ${file.name}...`);

    try {
      const extension = file.name.split('.').pop().toLowerCase();
      let extractedText = '';

      if (extension === 'pdf') {
        extractedText = await extractPdfText(file);
      } else if (extension === 'docx') {
        extractedText = await extractDocxText(file);
      } else if (extension === 'txt' || extension === 'doc') {
        extractedText = await extractPlainText(file);
      } else {
        throw new Error('Định dạng tệp không được hỗ trợ. Vui lòng chọn file .PDF, .DOCX hoặc .TXT');
      }

      if (!extractedText.trim()) {
        throw new Error('Không tìm thấy nội dung văn bản trong tệp (có thể là file scan hoặc tài liệu dạng ảnh).');
      }

      textInput.value = extractedText.trim();
      updateTextStats();
      
      // Tự động phân tích và tạo trình phát
      buildSentencesFromText();
      
      // Cuộn nhẹ tới nút bắt đầu
      playerContainer.scrollIntoView({ behavior: 'smooth' });

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

  // Trích xuất toàn bộ PDF
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

  // Trích xuất Word (.docx)
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
  // 3. Xử lý & Phân tách câu (Sentence Chunking)
  // ==========================================
  function updateTextStats() {
    const text = textInput.value;
    const charCount = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    statCharCount.textContent = charCount.toLocaleString('vi-VN');
    statWordCount.textContent = words.toLocaleString('vi-VN');

    // Ước tính thời gian đọc: trung bình 160 từ/phút ở tốc độ 1.0x
    const minutes = words / (160 * state.rate);
    const totalSecs = Math.round(minutes * 60);
    state.estimatedTotalSeconds = totalSecs;
    statEstTime.textContent = `~${formatTime(totalSecs)}`;
    totalTimeDisplay.textContent = formatTime(totalSecs);
  }

  textInput.addEventListener('input', () => {
    updateTextStats();
  });

  // Tách câu thông minh tiếng Việt
  function splitIntoSentences(rawText) {
    if (!rawText || !rawText.trim()) return [];

    // Chuẩn hóa khoảng trắng & ngắt dòng
    const cleaned = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/([.?!])\n+/g, '$1 ')
      .replace(/\n{2,}/g, '. ');

    // Regex tách câu: nhận biết dấu . ? ! hoặc xuống dòng nhưng không tách số thập phân 1.5 hay viết tắt P. Q. v.v.
    const rawTokens = cleaned.match(/[^.!?\n]+[.!?\n]+/g) || [cleaned];
    const sentences = [];

    rawTokens.forEach(token => {
      const trimmed = token.trim();
      if (trimmed.length > 0) {
        // Nếu câu quá dài (trên 250 ký tự), chia tiếp theo dấu phẩy hoặc chấm phẩy để đọc trôi chảy
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
      alert('Vui lòng nhập văn bản hoặc tải file lên trước.');
      return false;
    }

    state.text = text;
    state.sentences = splitIntoSentences(text);
    state.currentIndex = 0;

    // Render danh sách câu vào Reader Content
    renderReaderContent();

    // Cập nhật thông số hiển thị
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
    // Xóa active cũ
    const currentActive = readerContentBox.querySelector('.sentence-active');
    if (currentActive) {
      currentActive.classList.remove('sentence-active');
    }

    // Đánh dấu active mới
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
  // 4. Trình Phát Âm Thanh (Audio Player Core)
  // ==========================================

  function playCurrentSentence() {
    if (!('speechSynthesis' in window)) return;

    if (state.currentIndex >= state.sentences.length) {
      // Đã đọc xong toàn bộ văn bản
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

    // Dừng utterance cũ trước khi phát câu mới
    window.speechSynthesis.cancel();

    const sentence = state.sentences[state.currentIndex];
    if (!sentence || !sentence.trim()) {
      state.currentIndex++;
      playCurrentSentence();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    state.currentUtterance = utterance;

    // Cài đặt giọng, tốc độ, âm lượng, cao độ
    if (state.selectedVoice) {
      utterance.voice = state.selectedVoice;
    }
    utterance.lang = state.selectedVoice?.lang || 'vi-VN';
    utterance.rate = state.rate;
    utterance.volume = state.volume;
    utterance.pitch = state.pitch;

    // Cập nhật giao diện
    currentSentenceDisplay.textContent = sentence;
    sentenceCounterDisplay.textContent = `Câu: ${state.currentIndex + 1} / ${state.sentences.length}`;
    highlightSentenceInText(state.currentIndex);
    updateSeekBar();

    // Sự kiện khi đọc xong câu
    utterance.onend = () => {
      if (state.isPlaying && !state.isPaused) {
        state.currentIndex++;
        playCurrentSentence();
      }
    };

    // Sự kiện lỗi
    utterance.onerror = (e) => {
      console.warn('Speech synthesis event:', e.error);
      if (e.error === 'interrupted' || e.error === 'canceled') {
        // Bị ngắt do chuyển câu hoặc đổi slider, không coi là lỗi
        return;
      }
      // Thử đọc tiếp câu sau
      if (state.isPlaying && !state.isPaused) {
        state.currentIndex++;
        playCurrentSentence();
      }
    };

    // Bắt đầu đọc
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
      }, 80);
    }
  }

  function playAudio() {
    if (state.sentences.length === 0) {
      const ok = buildSentencesFromText();
      if (!ok) return;
    }

    if (state.isPaused) {
      window.speechSynthesis.resume();
      state.isPaused = false;
      state.isPlaying = true;
      updatePlayPauseButtonUI(true);
      setPlayerStatus('Đang phát');
      setWaveAnimation(true);
      startClockTimer();
    } else {
      state.isPlaying = true;
      state.isPaused = false;
      playCurrentSentence();
    }
  }

  function pauseAudio() {
    if (state.isPlaying && !state.isPaused) {
      window.speechSynthesis.pause();
      state.isPaused = true;
      updatePlayPauseButtonUI(false);
      setPlayerStatus('Tạm dừng');
      setWaveAnimation(false);
      stopClockTimer();
    }
  }

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

  function jumpToSentence(index) {
    if (index < 0 || index >= state.sentences.length) return;
    state.currentIndex = index;

    if (state.isPlaying) {
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
      playerStatusTag.className = 'text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 mt-2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
    } else if (statusText === 'Tạm dừng') {
      playerStatusTag.className = 'text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 mt-2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30';
    } else {
      playerStatusTag.className = 'text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 mt-2 rounded bg-slate-800 text-slate-400';
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

  // Seekbar change
  seekBar.addEventListener('input', (e) => {
    if (state.sentences.length === 0) return;
    const pct = parseFloat(e.target.value);
    const targetIdx = Math.min(
      Math.floor((pct / 100) * state.sentences.length),
      state.sentences.length - 1
    );
    jumpToSentence(targetIdx);
  });

  // Keep-alive cho Chromium
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
  // 5. Điều khiển Tốc độ, Âm lượng Realtime
  // ==========================================

  // Tốc độ (Speed / Rate)
  rateSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.rate = val;
    rateValueDisplay.textContent = `${val.toFixed(2)}x`;
    playerRateDisplay.textContent = `${val.toFixed(2)}x`;
    updateTextStats();
    restartCurrentSentence();
  });

  // Nút chỉnh nhanh tốc độ
  document.querySelectorAll('.quick-rate').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const val = parseFloat(btn.dataset.rate);
      rateSlider.value = val;
      state.rate = val;
      rateValueDisplay.textContent = `${val.toFixed(2)}x`;
      playerRateDisplay.textContent = `${val.toFixed(2)}x`;
      
      // Update active style
      document.querySelectorAll('.quick-rate').forEach(b => {
        b.className = 'quick-rate px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition';
      });
      btn.className = 'quick-rate px-2 py-1 rounded bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold transition';

      updateTextStats();
      restartCurrentSentence();
    });
  });

  // Âm lượng (Volume)
  volumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.volume = val;
    const pct = Math.round(val * 100);
    volumeValueDisplay.textContent = `${pct}%`;
    playerVolumeDisplay.textContent = `${pct}%`;

    // Cập nhật icon âm lượng
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

  // Mute / Unmute
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

  // Cao độ (Pitch)
  pitchSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.pitch = val;
    pitchValueDisplay.textContent = val.toFixed(2);
    restartCurrentSentence();
  });

  // ==========================================
  // 6. Nút Thao tác Trình phát
  // ==========================================

  // Play / Pause Toggle
  btnPlayPause.addEventListener('click', () => {
    if (state.isPlaying && !state.isPaused) {
      pauseAudio();
    } else {
      playAudio();
    }
  });

  // Stop Button
  btnStop.addEventListener('click', () => {
    stopAudio();
  });

  // Previous Button
  btnPrev.addEventListener('click', () => {
    if (state.currentIndex > 0) {
      jumpToSentence(state.currentIndex - 1);
    }
  });

  // Next Button
  btnNext.addEventListener('click', () => {
    if (state.currentIndex < state.sentences.length - 1) {
      jumpToSentence(state.currentIndex + 1);
    }
  });

  // Repeat / Loop Toggle
  btnLoop.addEventListener('click', () => {
    state.isLoop = !state.isLoop;
    if (state.isLoop) {
      btnLoop.classList.add('bg-indigo-600/30', 'text-indigo-400', 'border', 'border-indigo-500/40');
    } else {
      btnLoop.classList.remove('bg-indigo-600/30', 'text-indigo-400', 'border', 'border-indigo-500/40');
    }
  });

  // Auto Scroll Toggle
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

  // Nút "Tạo Trình Phát Âm Thanh" chính
  btnGenerateAudio.addEventListener('click', () => {
    const ok = buildSentencesFromText();
    if (ok) {
      playAudio();
    }
  });

  // ==========================================
  // 7. Các tiện ích phụ (Văn bản mẫu, Xóa, Copy, Download)
  // ==========================================

  btnSampleText.addEventListener('click', () => {
    textInput.value = SAMPLE_TEXT;
    updateTextStats();
    buildSentencesFromText();
  });

  btnClearText.addEventListener('click', () => {
    if (textInput.value && confirm('Bạn có chắc chắn muốn xóa toàn bộ văn bản?')) {
      stopAudio();
      textInput.value = '';
      state.sentences = [];
      updateTextStats();
      renderReaderContent();
      currentSentenceDisplay.textContent = 'Đã xóa văn bản.';
      sentenceCounterDisplay.textContent = 'Câu: 0 / 0';
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
    a.download = 'van-ban-trich-xuat.txt';
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

  // Phím tắt điều khiển (Space để Play/Pause, Mũi tên trái/phải để tua câu)
  document.addEventListener('keydown', (e) => {
    if (document.activeElement === textInput || document.activeElement.tagName === 'INPUT') {
      return; // Không can thiệp khi đang gõ chữ
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

  // Nạp sẵn văn bản mẫu khi vào trang lần đầu
  textInput.value = SAMPLE_TEXT;
  updateTextStats();
  buildSentencesFromText();
});
