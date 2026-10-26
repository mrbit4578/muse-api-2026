---
name: muse-prompt-optimizer
description: Chuyên gia tối ưu hóa Prompt video và hình ảnh cho Muse AI (Meta Muse / Muse Spark). Chuyển hóa kịch bản thành các câu lệnh độc lập, chuẩn điện ảnh, góc máy chuyển động mượt mà và negative prompt khắt khe.
---

# MUSE PROMPT OPTIMIZER — TỐI ƯU HÓA PROMPT CHO MUSE AI

Kỹ năng chuyên sâu đảm bảo mỗi phân đoạn video được tạo ra từ Muse AI đạt chuẩn hình ảnh điện ảnh cao nhất, không bị lỗi méo hình, không bị lệch tiếng và tuân thủ tuyệt đối cơ chế **IVS (Independent Visual Storytelling)**.

## 1. Công thức cấu trúc Prompt Muse chuẩn (Standard Muse Prompt Anatomy)

Mỗi prompt là một khối văn bản duy nhất trên 1 dòng vật lý, phân tách bằng dấu gạch đứng `|`:

```text
PROMPT [Số thứ tự] | SCENE: [Ý đồ phân cảnh ngắn gọn] | VISUAL: [Mô tả chi tiết chủ thể, phục trang, đạo cụ và bối cảnh đậm nét văn hóa Việt] | ACTION: [Chuyển động duy nhất, tự nhiên, chậm rãi của chủ thể] | CAMERA: [Loại góc máy, tiêu cự lens và hướng di chuyển camera] | LIGHTING: [Ánh sáng điện ảnh, nhiệt độ màu, nguồn sáng thực tế] | AUDIO MODE=[A/B] | [NARRATOR VOICE LOCK] | [AUDIO TIMELINE] | AMBIENCE: [Âm thanh môi trường và nhạc nền] | SPEAKER FIREWALL: [Rào cản độc quyền giọng nói] | IVS: [Xác nhận cảnh độc lập, không phụ thuộc khuôn mặt cảnh trước] | NEGATIVE: [Tập hợp từ phủ định chống lỗi]
```

---

## 2. Các nguyên tắc vàng khi viết Prompt Muse

### A. IVS (Independent Visual Storytelling)
- Tuyệt đối **không cố gắng tạo khuôn mặt cận cảnh giống hệt nhau** qua các clip độc lập (tránh lỗi ảo giác biến dạng khuôn mặt của AI).
- **Ưu tiên các góc quay điện ảnh giàu biểu cảm:**
  * Góc quay bàn tay tương tác với đồ vật (nhẫn cưới rơi, bàn tay ký đơn ly hôn, ly nước vỡ).
  * Góc quay sau lưng (Rear view / Over-the-shoulder), bóng lưng đơn độc bước đi dưới mưa.
  * Góc toàn cảnh thiết lập không gian (Establishing shot: Ngõ nhỏ phố cổ, chung cư sáng đèn trong đêm, cánh đồng quê hoàng hôn).
  * Góc cận đạo cụ mang tính biểu tượng (Chiếc phong bì niêm phong, chiếc đồng hồ dừng kim, bó hoa cưới bị bỏ quên).

### B. Kỹ thuật chuyển động Camera điện ảnh (Motivated Camera Motion)
- `Slow push-in on [subject]`: Máy quay từ từ tiến sát vào chủ thể tạo cảm giác hồi hộp.
- `Slow pull-back revealing [environment]`: Máy quay lùi xa dần để hé lộ không gian cô độc.
- `Subtle lateral tracking shot`: Máy quay trượt ngang theo bước chân nhân vật.
- `Static locked shot with shallow depth of field`: Khung hình tĩnh, lấy nét nông vào đạo cụ, hậu cảnh mờ ảo.
- **Tránh:** Máy quay lia quá nhanh (fast whip pan), zoom giật cục hoặc góc quay bất khả thi về mặt vật lý.

### C. Ánh sáng & Bối cảnh Việt Nam (Cinematic Lighting & Vietnamese Atmosphere)
- `Warm tungsten practical lights from an old wooden living room in Hanoi`: Ánh đèn vàng ấm cúng pha chút cổ kính.
- `Cold neon blue backlighting through rain-streaked window`: Ánh sáng neon xanh lạnh lẽo xuyên qua cửa sổ mưa.
- `Golden hour natural sunlight filtering through banana leaves in a quiet Vietnamese village`: Nắng chiều vàng rực rỡ len qua vườn chuối làng quê thanh bình.

---

## 3. Bộ lọc Negative Prompt chuẩn mực (Mandatory Negative Filter)

Luôn đặt ở cuối mỗi prompt để loại bỏ hoàn toàn các lỗi thường gặp:

```text
NEGATIVE: no on-screen speech, no visible mouth movement, no lip-sync, no morphing, no floating objects, no extra limbs, no duplicated people, no warped geometry, no low resolution, no blurry textures, no video artifacts, no subtitles, no watermarks, no split screen, no rapid camera jumps.
```
