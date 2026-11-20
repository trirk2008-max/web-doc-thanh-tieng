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
   - **Nút Dừng hẳn** (Reset về đoạn đầu tiên).
   - **Tua đoạn trước / Tua đoạn sau** (`Skip Back` / `Skip Forward`).
   - **Thanh trượt tiến trình (Seekbar)**: Kéo thả hoặc nhấp để nhảy đến đoạn bất kỳ.
   - **Đồng hồ thời gian**: Hiển thị thời gian đã phát và tổng thời gian ước tính.
   - **Thanh tiến độ**: Tua trong nội dung và hiển thị thời gian đang nghe.
   - **Hiệu ứng sóng âm thanh (Audio Wave Visualizer)** dao động sinh động khi đang đọc.

3. **Điều chỉnh Realtime (Thời gian thực)**:
   - **Tốc độ đọc (Speed / Rate)**: Tùy chỉnh mượt mà từ `0.5x` đến `2.5x`, có các nút chọn nhanh `0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`. Thay đổi áp dụng ngay lập tức mà không bị mất dấu vị trí.
   - **Âm lượng (Volume)**: Tùy chỉnh từ `0%` đến `200%` bằng khuếch đại Web Audio, có nút bật/tắt tiếng (`Mute`).

4. **Đọc văn bản và phát lại đoạn chọn**:
   - Hiển thị toàn bộ văn bản dưới dạng văn bản thuần, không tô sáng và không tự cuộn theo câu.
   - Bôi đen đoạn cần nghe rồi bấm **Đọc phần đã chọn** để đọc hoặc nghe lại chính đoạn đó.
   - Worker tạo khúc âm thanh dài hơn, ghép các kết quả TTS ngắn thành một luồng và tải trước khúc kế tiếp để giảm khoảng ngắt.
   - Nút Play/Pause lưu vị trí theo giây trong khúc âm thanh; mở lại sách để tiếp tục từ vị trí đó.
   - Nút sao chép văn bản và tải về file `.txt`.

5. **Lưu sách**:
   - Đặt tên rồi bấm **Lưu sách** để lưu văn bản vào Cloudflare D1.
   - Tiến độ nghe được tự động lưu định kỳ, khi tạm dừng và khi kết thúc khúc.
   - Vị trí nghe và tốc độ đọc được lưu cùng sách để mở lại tiếp tục.
   - Sách được gắn với mã ẩn danh của trình duyệt hiện tại; mở lại trên trình duyệt đó để nghe tiếp.

---

## 🚀 Công Nghệ Sử Dụng

- **Frontend**: HTML5, Tailwind CSS, Lucide Icons
- **Core Engine**: Google Translate TTS qua Cloudflare Worker; cần Internet
- **Database**: Cloudflare D1 lưu tên sách, văn bản và tiến độ nghe
- **PDF Engine**: PDF.js (Mozilla)
- **DOCX Parser**: Mammoth.js
- **Hosting**: GitHub Pages và Cloudflare Worker

