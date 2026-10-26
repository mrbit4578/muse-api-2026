# ⚡ API Muse 2026

> **OpenAI-Compatible Gateway & Auto Token Extractor for Muse AI**  
> Dự án cổng kết nối API chuẩn OpenAI cho Muse AI, tích hợp bảng điều khiển Web Online sẵn sàng triển khai trên Vercel và tiện ích mở rộng Chrome Extension tự động bắt token.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mrbit4578/muse-api-2026)
![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![OpenAI](https://img.shields.io/badge/OpenAI-Compatible-orange.svg)
![Vercel](https://img.shields.io/badge/Vercel-Serverless-black.svg)

---

## 🌟 Tính năng nổi bật

1. **Auto Login & Trích xuất API Muse**:
   - Chỉ cần nhập Email/Mật khẩu hoặc OTP tài khoản Muse, hệ thống tự động authenticate và bóc tách toàn bộ bộ token (`hatch_sess`, `hatch_gw`, `hatch_vml`, `hatch_native_auth_device`).
   - Cung cấp API Key định dạng chuẩn `sk-muse-...` để sử dụng ở mọi nơi.
2. **Cổng API Chuẩn OpenAI 100% & Ma Trận Giải Mã Stanford CS229**:
   - `POST /v1/chat/completions`: Hỗ trợ **Streaming SSE** lẫn Non-Streaming.
   - **Stanford CS229 Decoding Strategies**: Hỗ trợ đầy đủ $T \in [0.1, 2.0]$, Nucleus Sampling Top-$p \in [0.05, 1.0]$, và 3 Presets chuẩn hóa:
     * `deterministic` ($T=0.1, P=0.1$): Triệt tiêu ảo giác (Code, Schema, Data Extraction).
     * `balanced` ($T=0.7, P=0.9$): Hội thoại tự nhiên, linh hoạt.
     * `creative` ($T=1.1, P=0.95$): Tăng entropy phân phối Softmax cho biên kịch và nghệ thuật.
   - **BPE Subword Token Estimation**: Thuật toán ước lượng token tối ưu cho Tiếng Việt có dấu (UTF-8 multi-byte) và cú pháp lập trình.
   - **Bảo vệ Attention $O(T^2)$**: Cơ chế Sliding-Window Context Pruning giữ System Prompt và tối đa 20 lượt trao đổi gần nhất để ngăn chặn quá tải KV-Cache.
   - **5 Chuyên gia AI Persona**:
     * `muse-coder`: Senior Software Architect & Code Optimizer ($T=0.1, P=0.1$).
     * `muse-analyst`: Senior Quantitative Data Analyst ($T=0.2, P=0.2$).
     * `muse-assistant`: Universal Executive Assistant ($T=0.7, P=0.9$).
     * `muse-creative`: Master Creative Director & Screenwriter ($T=1.1, P=0.95$).
     * `muse-researcher`: Principal Research Scientist ($T=0.3, P=0.4$).
   - `POST /v1/images/generations`: Tạo ảnh nghệ thuật độ phân giải cao.
   - `POST /v1/videos` & `GET /v1/videos/{task_id}`: Chuẩn OpenAI Video API sinh video nghệ thuật.
   - `GET /v1/models`: Danh sách các model nền tảng và 5 AI Personas kèm siêu dữ liệu cấu hình giải mã.
   - Tương thích lập tức với **NextChat**, **LobeChat**, **Cherry Studio**, **TypingMind**, **Cursor**, **OpenAI Python/Node SDK**.
3. **Giữ Phiên 48h & Đánh Thức Cloud VM (Kế thừa từ Muse2API)**:
   - Tự động gọi `/api/session` và `/api/hatch/vm/wake` gia hạn token `hatch_vml` (+48h) và `hatch_sess` (+30d).
   - Đảm bảo máy ảo làm việc (Cloud Workspace VM) luôn ở trạng thái `RUNNING`, không bị ngắt kết nối.
4. **Tạo Email Ảo & Bắt Mã OTP Tự Động (Mail.tm)**:
   - Tích hợp giao thức Mail.tm: Tự sinh email tạm thời với 1 click, tự động lắng nghe và trích xuất mã OTP từ Muse mà không cần tạo email thủ công.
5. **Đồng Bộ Cookie Đa Nền Tảng (Tampermonkey UserScript & Extension)**:
   - Cung cấp script Tampermonkey (`/muse_cookie_importer.user.js`) hiển thị nút nổi trên `muse.ai` để đẩy token về Gateway.
   - Tiện ích Chrome Extension v5.0.0 Pro quét cookie chỉ bằng 1 click.
6. **Xưởng Phim Vietnamese Drama Muse Studio Pro**:
   - Tự động sản xuất kịch bản 3 hồi, 20+ Prompts IVS, phụ đề SRT chuẩn millisecond, Storyboard keyframes và xuất video hoàn chỉnh kèm giọng lồng tiếng AI.
7. **Triển khai Web Online trên Vercel**:
   - File cấu hình `vercel.json` tối ưu cho Serverless Functions và CORS.
   - Giao diện Dashboard Web hiện đại (Dark Glassmorphism, Responsive, tiếng Việt / English).
   - Tích hợp sẵn **AI Playground** để trò chuyện trực tiếp và sinh ảnh ngay trên trình duyệt.

---

## 📂 Cấu trúc thư mục dự án

```text
api-muse-2026/
├── api/                             # Vercel Serverless Functions
│   ├── auth/
│   │   ├── login.js                 # API Đăng nhập tài khoản Muse & tạo API Key
│   │   ├── extract-session.js       # API Bóc tách cookie string/json
│   │   └── status.js                # API Kiểm tra trạng thái tài khoản & quota
│   ├── v1/
│   │   ├── chat/completions.js      # Chuẩn OpenAI: Chat Completions (Stream & Non-Stream)
│   │   ├── images/generations.js    # Chuẩn OpenAI: Image Generations (Sinh ảnh)
│   │   └── models.js                # Chuẩn OpenAI: Models List
│   ├── accounts.js                  # Quản lý Account Pool (Thêm/xóa/đổi key)
│   └── proxy-check.js               # Kiểm tra IP outbound & độ trễ
├── public/                          # Frontend Web Dashboard (Chạy online Vercel)
│   ├── index.html                   # Giao diện chính Dashboard & AI Playground
│   ├── app.js                       # Logic xử lý giao diện, SSE reader, copy API
│   ├── style.css                    # Thiết kế giao diện Glassmorphism cao cấp
│   └── icons/                       # Biểu tượng dự án
├── plugins/                         # Vietnamese Drama Muse Plugin & Skills
│   └── vietnamese-drama-muse/
│       ├── skills/                  # 5 Kỹ năng AI Drama (Recap, Script, Prompt, Voice, Storyboard)
│       ├── scripts/                 # CLI Drama Generator & Muse API Bridge
│       ├── studio/                  # Standalone Drama Studio Viewer
│       └── export/                  # Thư mục xuất kịch bản, prompt, SRT
├── extension/                       # Chrome Extension MV3 Companion
│   ├── manifest.json                # Cấu hình Manifest V3 sạch sẽ
│   ├── background.js                # Service worker bắt cookie muse.ai & quản lý proxy
│   ├── popup.html                   # Giao diện 1-click Auto Grab Muse & Proxy
│   ├── popup.js                     # Xử lý sự kiện popup (đã mở khóa vĩnh viễn)
│   ├── popup.css                    # Giao diện popup
│   └── icons/                       # Icon extension
├── vercel.json                      # Cấu hình deploy Vercel (Routes, CORS, MaxDuration)
├── server.js                        # Máy chủ chạy thử nghiệm cục bộ (Node.js thuần)
├── package.json                     # Thông tin gói dự án
├── .env.example                     # Biến môi trường mẫu
├── .gitignore                       # Danh sách tệp loại trừ của Git
└── README.md                        # Hướng dẫn chi tiết
```

---

## 🚀 Hướng dẫn Triển khai Online trên Vercel

### Cách 1: Triển khai 1-Click qua Vercel Dashboard (Khuyên dùng)
1. Truy cập [Vercel](https://vercel.com) và đăng nhập bằng tài khoản GitHub.
2. Bấm **Add New** > **Project** > Chọn repository `mrbit4578/muse-api-2026`.
3. Giữ nguyên cấu hình mặc định (Root Directory `./`, Framework Preset: `Other`).
4. Bấm **Deploy**.
5. Sau 1 phút, bạn sẽ nhận được đường link online (ví dụ: `https://api-muse-2026.vercel.app`).

### Cách 2: Triển khai bằng Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 💻 Chạy thử nghiệm trên máy cục bộ (Local)

Dự án sử dụng Node.js thuần (không yêu cầu cài thêm thư viện cồng kềnh):

```bash
# Khởi động server
npm start
# hoặc
node server.js
```

- Mở trình duyệt truy cập: `http://localhost:3000`
- Cổng OpenAI API: `http://localhost:3000/v1`

---

## 🔌 Hướng dẫn Tích hợp vào các phần mềm AI

Sau khi triển khai lên Vercel, bạn điền cấu hình vào các ứng dụng như sau:

### 1. NextChat (ChatGPT-Next-Web)
* **API Proxy URL:** `https://your-domain.vercel.app/v1`
* **API Key:** `sk-muse-...` (Lấy tại Tab 1 sau khi đăng nhập)
* **Custom Models:** `muse-spark-1.1,muse-chat-v2,gpt-4o-muse`

### 2. LobeChat
* **AI Provider:** Chọn `OpenAI`
* **API Proxy Address:** `https://your-domain.vercel.app/v1`
* **API Key:** `sk-muse-...`

### 3. Cherry Studio / TypingMind / Cursor
* **Base URL:** `https://your-domain.vercel.app/v1`
* **API Key:** `sk-muse-...`

### 4. Gọi bằng cURL
```bash
curl https://your-domain.vercel.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-muse-your-api-key" \
  -d '{
    "model": "muse-spark-1.1",
    "messages": [
      {"role": "user", "content": "Xin chào Muse AI, hãy viết một bài thơ ngắn về công nghệ!"}
    ],
    "stream": true
  }'
```

---

## 🧩 Cài đặt Chrome Extension Companion

1. Mở trình duyệt Chrome, gõ vào thanh địa chỉ: `chrome://extensions/`
2. Bật công tắc **Developer mode** ở góc phải trên.
3. Bấm **Load unpacked** (Tải tiện ích đã giải nén).
4. Chọn thư mục `extension` trong dự án.
5. Mở tab `https://muse.ai` và đăng nhập tài khoản.
6. Mở extension lên, nhấn nút **"⚡ Auto Lấy API Muse từ trình duyệt"** để bắt nhanh bộ token!

---

## 🛠️ Báo cáo Audit & Khắc phục Lỗi (Audit Summary)

Dự án ban đầu (`thangdgm_proxy_ex_v1.1.0`) đã được audit và xử lý triệt để:

| Hạng mục | Thực trạng ban đầu | Giải pháp Kaizen |
| :--- | :--- | :--- |
| **Bẫy Anti-debug** | `setInterval` chạy `debugger;` mỗi 25s làm treo DevTools | **Đã xóa bỏ 100%**, code chạy mượt mà, minh bạch |
| **Khóa License cứng** | Gọi xác thực về `ver.thangdgm.io.vn`, khóa tính năng | **Mở khóa vĩnh viễn (Pro Active Lifetime)**, độc lập hoàn toàn |
| **Mã hóa obfuscation** | Dùng hàm giải mã XOR `_s(...)` che giấu chuỗi | **Deobfuscated & Cleaned**, chuẩn hóa code chuẩn sạch |
| **Giao diện Web** | Chỉ có Extension cục bộ, không chạy online được | **Xây dựng trọn bộ Web App + Vercel Serverless Ready** |
| **Tính năng Muse AI** | Chưa có bất kỳ module nào về Muse | **Tích hợp đầy đủ Auto Login, Token Extractor & OpenAI Gateway** |

---

## 📄 Bản quyền & Tác giả

Phát triển và tối ưu bởi **Mr.Bit25**.  
Mã nguồn mở theo giấy phép [MIT](LICENSE).
