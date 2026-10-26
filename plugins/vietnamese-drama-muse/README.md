# 🎬 Vietnamese Drama Muse Studio Pro (V5.2)

> **Hệ sinh thái sản xuất video Drama Recap Việt Nam bằng Muse AI**  
> Kết hợp biên kịch 3 hồi kịch tính, chuẩn hóa Prompt Muse IVS, đạo diễn âm thanh TTS, tự động xuất phụ đề SRT và đấu nối trực tiếp với cổng **API Muse 2026 Gateway**.

---

## 🌟 Hệ sinh thái 5 Kỹ năng (5-Skill Architecture)

Dự án đã được Kaizen và mở rộng từ 1 kỹ năng đơn lẻ thành hệ sinh thái **5 kỹ năng chuyên biệt hóa**:

1. **`drama-recap` (Master Director V5.2)**: 
   - Điều phối tổng thể toàn bộ quy trình từ ý tưởng đến chuỗi prompt Muse hoàn chỉnh.
   - Quản lý timeline, quy tắc IVS (Independent Visual Storytelling) và kiểm soát định dạng chuẩn.
2. **`drama-scriptwriter` (Chuyên gia Biên kịch Drama)**:
   - Xây dựng cấu trúc kịch bản 3 hồi kịch tính: Hook 15s đầu cực cuốn, nút thắt cao trào và Midpoint Reversal đảo chiều.
   - Chuẩn hóa văn phong hội thoại thuần Việt theo đúng tôn ti trật tự và ngữ cảnh đời sống.
3. **`muse-prompt-optimizer` (Tối ưu Prompt Muse AI)**:
   - Chuyển thể phân cảnh thành câu lệnh Muse AI chuẩn điện ảnh.
   - Định dạng góc máy tracking, tiêu cự lens, motivated lighting và bộ lọc Negative Prompt chống biến dạng.
4. **`voice-tts-director` (Đạo diễn Âm thanh & Lồng tiếng)**:
   - Quản lý hệ thống Voice Lock (`NARRATOR_001` Nam/Nữ Bắc Bộ & Nam Bộ).
   - Đo lường chính xác tốc độ đọc chuẩn `125 - 140 từ/phút`.
   - Tự động tính toán timestamp và xuất file phụ đề `.srt` đồng bộ từng mili-giây.
5. **`storyboard-generator` (Trực quan hóa Storyboard)**:
   - Tạo phác thảo keyframe cho từng phân cảnh.
   - Đấu nối trực tiếp với cổng **API Muse 2026** để tự động vẽ ảnh minh họa phân cảnh.

---

## 🚀 Đấu nối với Cổng API Muse 2026 Gateway

Dự án tích hợp sẵn module `scripts/muse_api_bridge.js` kết nối trực tiếp với cổng API Muse 2026 (`thangdgm_proxy_ex_v1.1.0` / Vercel):
- **Chat Completions:** Gọi model `muse-spark-1.1` hoặc `muse-chat-v2` để tự động hóa khâu biên kịch.
- **Images Generations:** Gọi endpoint `/v1/images/generations` để sinh ảnh Storyboard minh họa trực quan.

---

## 💻 Hướng dẫn Sử dụng

### 1. Khởi động Web Studio trực quan (Khuyên dùng)
```bash
cd "D:\AI\API muse\Vietnamese_Drama_Muse_Plugin_V5_1\vietnamese-drama-muse"
npm run studio
```
- Mở trình duyệt truy cập: **`http://localhost:3001`**
- Chọn thể loại, thời lượng, giọng MC, nhập ý tưởng (hoặc bấm AI Gợi ý).
- Bấm **"🎬 BẮT ĐẦU SẢN XUẤT DRAMA"** để xem và copy toàn bộ prompt, kịch bản và tải file phụ đề `.srt`.

### 2. Sử dụng bằng dòng lệnh CLI
```bash
node scripts/drama_generator.js --duration 5 --clip 15 --accent "Nam Bắc Bộ 45" --idea "Nàng dâu nghèo bị đuổi khỏi nhà hóa ra là ái nữ hào môn trở về tiếp quản công ty"
```

---

## 📦 Bộ tệp Xuất bản Sản xuất (Production Package)

Sau khi tạo xong, hệ thống tự động xuất 4 tệp sẵn sàng sản xuất vào thư mục `export/`:

| Tên tệp | Định dạng | Công dụng |
| :--- | :--- | :--- |
| `drama_story.md` | Markdown | Toàn văn câu chuyện, tóm tắt cốt truyện và bảng phân vai giọng đọc. |
| `muse_prompts.txt` | Text | Toàn bộ các dòng prompt Muse chuẩn cú pháp IVS, chỉ cần copy dán vào Muse AI để tạo video. |
| `subtitles.srt` | SubRip | File phụ đề chuẩn giờ phút giây để kéo thả thẳng vào CapCut / Premiere. |
| `production_sheet.json` | JSON | Hồ sơ cấu trúc phân cảnh đầy đủ dùng cho tích hợp API hoặc tự động hóa render. |

---

## 📄 Thông tin Plugin

- **Tên:** `vietnamese-drama-muse`
- **Phiên bản:** `5.2.0 Pro`
- **Tác giả:** Afanta Studio & Mr.Bit25
- **Giấy phép:** MIT
