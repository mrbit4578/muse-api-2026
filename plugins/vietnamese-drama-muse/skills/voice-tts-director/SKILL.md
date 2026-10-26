---
name: voice-tts-director
description: Đạo diễn âm thanh, giọng đọc lồng tiếng và nhịp điệu phát âm tiếng Việt cho Drama Muse. Quản lý hệ thống Voice Lock, tính toán chính xác thời lượng đọc ~135 từ/phút, và tự động tạo file phụ đề SRT chuẩn giờ.
---

# VOICE & TTS DIRECTOR — ĐẠO DIỄN ÂM THANH & LỒNG TIẾNG

Kỹ năng chuyên sâu về kiểm soát âm thanh, thiết kế giọng đọc lồng tiếng (Voice-Over) và đồng bộ nhịp điệu phát thanh cho video Drama recap Việt Nam.

## 1. Hệ thống Khóa Giọng (Voice Registry & Lock System)

Để video có tính nhất quán và chuyên nghiệp, toàn bộ các giọng đọc phải được đăng ký mã định danh duy nhất:

| Định danh giọng | Đặc tính âm sắc | Vùng miền / Độ tuổi | Vai trò trong phim |
| :--- | :--- | :--- | :--- |
| `NARRATOR_001` | Trầm ấm, sâu lắng, nhịp điệu điềm tĩnh | Bắc Bộ / Nam ~45 tuổi | Người dẫn chuyện chính (Mặc định) |
| `NARRATOR_002` | Truyền cảm, tâm sự, giàu tính tự sự | Nam Bộ / Nam ~40 tuổi | Người dẫn chuyện phóng sự / đời thường |
| `VOICE_001` | Giọng nữ nghẹn ngào, uất ức | Bắc Bộ / Nữ ~28 tuổi | Nữ chính (Người chịu oan / vươn lên) |
| `VOICE_002` | Giọng nam gay gắt, gia trưởng | Bắc Bộ / Nam ~32 tuổi | Chồng / Kẻ phản bội |
| `VOICE_003` | Giọng nữ trung niên sắc sảo | Bắc Bộ / Nữ ~55 tuổi | Mẹ chồng / Bà trùm |

> **Nguyên tắc bất di bất dịch:** Trong suốt một tập phim, không bao giờ được phép trôi giọng hoặc đổi vùng miền của `NARRATOR_001`. Nếu đã chọn Bắc Bộ thì 100% lời dẫn phải là Bắc Bộ.

---

## 2. Công thức đo lường tốc độ phát âm tiếng Việt (Speech Timing Engine)

- **Tốc độ đọc chuẩn tự nhiên:** `125 - 140 từ tiếng Việt / phút` (tương đương `2.1 - 2.3 từ / giây`).
- **Phân bổ thời gian trong 1 clip 15 giây:**
  * Giây 00:00 - 00:02: Khoảng lặng thiết lập không khí hoặc tiếng động môi trường (Foley/SFX).
  * Giây 00:02 - 00:09: Lời bình MC (~14 - 16 từ).
  * Giây 00:09 - 00:10: Khoảng ngắt nghỉ tâm lý (1 giây).
  * Giây 00:10 - 00:14: Thoại nhân vật dồn nén (~6 - 8 từ).
  * Giây 00:14 - 00:15: Nhịp nhạc cao trào dẫn sang phân cảnh tiếp theo.

---

## 3. Chế độ âm thanh (Audio Modes)

- **Audio Mode A (Tích hợp trong Muse):** Yêu cầu Muse AI tự sinh âm thanh dựa trên prompt phân vai. Thích hợp để xem nhanh ý tưởng.
- **Audio Mode B (Tách lớp hậu kỳ chuyên nghiệp - Khuyên dùng):** 
  - Muse chỉ tập trung sinh hình ảnh đẹp nhất (không méo tiếng, không lo lỗi AI đọc sai ngữ điệu).
  - Xuất riêng kịch bản lời thoại thành file audio riêng biệt (qua các công cụ TTS tiếng Việt chất lượng cao như Vbee, FPT.AI, ElevenLabs).
  - Tạo file phụ đề `.srt` đồng bộ từng mili-giây để kéo thả thẳng vào CapCut hoặc Premiere.

---

## 4. Cấu trúc file phụ đề chuẩn SRT (SubRip Subtitle Format)

File `.srt` tự động tính toán timestamp theo clip để khớp chuẩn khung hình:

```text
1
00:00:02,000 --> 00:00:09,000
Năm năm hy sinh vì gia đình chồng, Lan chưa từng nghĩ sự thật lại cay đắng đến thế.

2
00:00:10,000 --> 00:00:14,000
Anh giải thích đi... Đứa bé này rốt cuộc là con của ai?
```
