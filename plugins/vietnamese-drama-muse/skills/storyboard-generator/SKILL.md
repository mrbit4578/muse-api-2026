---
name: storyboard-generator
description: Trực quan hóa kịch bản Drama thành chuỗi hình ảnh Storyboard (Keyframes). Tự động tạo prompt sinh ảnh chất lượng cao và kết nối trực tiếp với cổng API Muse để vẽ phác thảo phân cảnh trước khi dựng video.
---

# STORYBOARD GENERATOR — TRỰC QUAN HÓA PHÂN CẢNH DRAMA

Kỹ năng phác thảo trực quan toàn bộ diễn biến bộ phim drama thông qua chuỗi khung hình then chốt (Keyframe Storyboard), giúp đạo diễn và người dựng phim hình dung rõ ràng bối cảnh, ánh sáng, góc máy trước khi render video bằng Muse AI.

## 1. Vai trò của Storyboard trong sản xuất Drama bằng AI

1. **Khóa tạo hình bối cảnh (Environment Locking):** Định hình trước màu sắc, phong cách kiến trúc (phòng trọ bình dân, biệt thự xa hoa, bệnh viện đêm khuya, đình làng Bắc Bộ).
2. **Kiểm soát nhịp độ thị giác (Visual Rhythm):** Đảm bảo sự cân bằng giữa các cảnh toàn (Wide), cảnh trung (Medium) và cảnh đặc tả đạo cụ (Macro/Insert).
3. **Tiết kiệm chi phí & thời gian render:** Xem trước ảnh tĩnh keyframe trước khi chạy video động trên Muse.

---

## 2. Tiêu chuẩn viết Prompt sinh ảnh Storyboard

Mỗi prompt sinh ảnh tập trung vào các yếu tố nhiếp ảnh điện ảnh (Cinematic Photography):

- **Tỷ lệ khung hình:** Chuẩn 16:9 điện ảnh (`--ar 16:9`) hoặc 9:16 video ngắn TikTok/Reels.
- **Ống kính & Máy ảnh:** `Shot on Arri Alexa, 35mm anamorphic lens, shallow depth of field, f/1.8`.
- **Màu sắc & Ánh sáng:** `Moody color grading, volumetric smoke, cinematic chiaroscuro lighting, subtle grain`.
- **Chủ thể:** Tập trung vào hành động đặc tả hoặc góc khuất để bảo toàn tính độc lập của cảnh (IVS).

### Ví dụ Prompt Storyboard mẫu:
```text
Cinematic still, dramatic Vietnamese family drama, close-up shot of a worn wedding ring placed on top of a signed divorce agreement on an old wooden table, faint rainy window in background, cold moody blue and warm desk lamp lighting, 35mm photography, 8k resolution, highly detailed --ar 16:9
```

---

## 3. Tích hợp trực tiếp với API Muse 2026

Kỹ năng này tự động chuyển đổi các phân cảnh thành request gửi đến endpoint:
`POST /v1/images/generations` của hệ thống **API Muse 2026 Gateway** để nhận về ảnh minh họa tức thì.
