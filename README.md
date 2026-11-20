# AudioBook Pro - Trình Đọc Văn Bản Tiếng Việt Tự Động

Ứng dụng web chuyển đổi tài liệu và văn bản thành giọng nói Tiếng Việt trực quan, chuyên nghiệp.

🔗 **Link Website Trực Tuyến**: [https://trirk2008-max.github.io/web-doc-thanh-tieng/](https://trirk2008-max.github.io/web-doc-thanh-tieng/)

---

## ✨ Tính Năng Nổi Bật

1. **Hỗ trợ tải lên đa định dạng (Trích xuất 100% full nội dung)**:
   - **File PDF**: Sử dụng PDF.js để trích xuất toàn bộ văn bản từ tất cả các trang.
   - **File Word (.docx)**: Sử dụng Mammoth.js để trích xuất văn bản từ tài liệu Word.
   - **File Text (.txt)** hoặc gõ/dán trực tiếp vào ô nhập liệu.

2. **Giao diện Trình phát đa phương tiện (Media Player) phong cách Video Player**:
   - **Nút Phát / Tạm dừng lớn** dạng toggle với hiệu ứng phát sáng.
   - **Nút Dừng hẳn** (Reset về câu đầu tiên).
   - **Tua câu trước / Tua câu sau** (`Skip Back` / `Skip Forward`).
   - **Thanh trượt tiến trình (Seekbar)**: Kéo thả hoặc nhấp để nhảy đến đoạn bất kỳ.
   - **Đồng hồ thời gian**: Hiển thị thời gian đã phát và tổng thời gian ước tính.
   - **Bộ đếm câu**: Biết chính xác đang ở câu số mấy trên tổng số câu.
   - **Hiệu ứng sóng âm thanh (Audio Wave Visualizer)** dao động sinh động khi đang đọc.

3. **Điều chỉnh Realtime (Thời gian thực)**:
   - **Tốc độ đọc (Speed / Rate)**: Tùy chỉnh mượt mà từ `0.5x` đến `2.5x`, có các nút chọn nhanh `0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`. Thay đổi áp dụng ngay lập tức mà không bị mất dấu vị trí.
   - **Âm lượng (Volume)**: Tùy chỉnh từ `0%` đến `100%`, có nút bật/tắt tiếng (`Mute`).
   - **Độ cao giọng (Pitch)**: Điều chỉnh giọng trầm hay thanh.

4. **Trải nghiệm đọc tương tác (Interactive Karaoke Reader)**:
   - Toàn bộ văn bản trích xuất được hiển thị rõ ràng và chia câu thông minh.
   - **Highlight câu đang đọc**: Câu đang phát sẽ sáng lên và tự động cuộn (`Auto-scroll`) vào giữa tầm nhìn.
   - **Nhấp vào câu để đọc**: Bạn có thể click vào bất kỳ câu nào trong bài để nhảy tới nghe câu đó ngay lập tức.
   - Nút sao chép văn bản và tải về file `.txt`.

---

## 🚀 Công Nghệ Sử Dụng

- **Frontend**: HTML5, Tailwind CSS, Lucide Icons
- **Core Engine**: Google Translate TTS qua Cloudflare Worker; văn bản cần đọc được gửi tới Google và cần có Internet
- **PDF Engine**: PDF.js (Mozilla)
- **DOCX Parser**: Mammoth.js
- **Hosting**: GitHub Pages

