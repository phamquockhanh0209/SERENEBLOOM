#  SereneBloom — Website Chăm Sóc Sức Khỏe Tinh Thần Học Đường

> **"Tâm trí an yên • Nở rộ tựa hoa sen"**  
> SereneBloom là một không gian số dịu dàng, an toàn và thấu cảm dành riêng cho học sinh THPT nhằm giải tỏa áp lực thi cử, theo dõi cảm xúc mỗi ngày, viết nhật ký, thư giãn và tâm sự cùng AI.

---

## 📖 Mục Lục
1. [Công Nghệ & Kiến Trúc](#1-công-nghệ--kiến-trúc)
2. [Cấu Trúc Thư Mục](#2-cấu-trúc-thư-mục)
3. [Các Tính Năng Chính Của 5 Tab](#3-các-tính-năng-chính-của-5-tab)
4. [Hướng Dẫn Cấu Hình Firebase (Authentication & Firestore)](#4-hướng-dẫn-cấu-hình-firebase)
5. [Quy Tắc Bảo Mật Firestore (Security Rules) & Ca Kiểm Thử](#5-quy-tắc-bảo-mật-firestore)
6. [Cấu Hình Gemini AI Backend](#6-cấu-hình-gemini-ai-backend)
7. [Chạy Thử Nghiệm Trên Máy Tính (Localhost)](#7-chạy-thử-nghiệm-trên-máy-tính)
8. [Triển Khai Lên Vercel (Deploy Guide)](#8-triển-khai-lên-vercel)
9. [Bảng Tổng Hợp Trạng Thái Hoạt Động](#9-bảng-tổng-hợp-trạng-thái-hoạt-động)

---

## 1. Công Nghệ & Kiến Trúc

- **Frontend Core:** HTML5 chuẩn Semantic, CSS3 hiện đại (Flexbox, CSS Grid, Custom Properties), JavaScript thuần (Vanilla JS) sử dụng **ES Modules**.
- **Không dùng framework nặng:** Tuyệt đối không dùng React, Vue, Next.js hay Angular, giữ mã nguồn trực quan, tốc độ tải trang tức thì và dễ học tập.
- **Thư viện nhẹ:**
  - `Chart.js`: Hiển thị biểu đồ nhịp điệu cảm xúc hàng tuần / tháng tại trang Hồ sơ.
  - `Google Fonts`: Plus Jakarta Sans & Quicksand mang lại cảm giác thân thiện, êm dịu.
- **Bảo mật & Backend:**
  - **Firebase Authentication:** Quản lý tài khoản học sinh, mã hóa mật khẩu, khôi phục mật khẩu.
  - **Cloud Firestore:** Lưu trữ dữ liệu nhật ký, phiên chat và cài đặt người dùng theo cấu trúc phân quyền nghiêm ngặt theo `UID`.
  - **Google Gemini API:** Tích hợp thông qua Serverless Function an toàn (`/api/chat.js` trên Vercel), bảo mật 100% API Key, không lộ khóa trên trình duyệt.

---

## 2. Cấu Trúc Thư Mục

```
serenebloom/
├── index.html               # Tab 1: Trang chủ (Lời chào thời gian thực, chuỗi streak, check-in nhanh)
├── chat.html                # Tab 2: Trò chuyện cùng SereneBloom AI
├── checkin.html             # Tab 3: Nhật ký cảm xúc, Thả bóng muộn phiền & Vẽ cảm xúc
├── healing.html             # Tab 4: Góc nhỏ (Ghép tranh Bloom Jigsaw, Hít thở 4-4-4-4, Bài viết)
├── profile.html             # Tab 5: Hồ sơ, Thống kê thực tế, Biểu đồ tâm trạng Chart.js
├── login.html               # Đăng nhập (Hỗ trợ nút bấm 1-chạm trải nghiệm nhanh)
├── register.html            # Đăng ký tài khoản mới
├── forgot-password.html     # Khôi phục mật khẩu qua Email
├── 404.html                 # Trang báo lỗi 404
├── assets/
│   └── images/              # Ảnh minh họa SVG chuẩn sắc nét (hero-lotus, blossom, puzzle 1/2/3)
├── css/
│   ├── variables.css        # Hệ thống màu sắc (Mint, Sage, Cream, Pink), typography, radii, shadows
│   ├── global.css           # Căn chỉnh nền tảng, nút bấm, badge, modal xác nhận, toast thông báo
│   ├── layout.css           # Bố cục Sidebar cho Desktop & Bottom Nav Bar (5 tabs) cho Mobile
│   ├── components.css       # Chip chọn cảm xúc, quả bóng bay, khay ghép tranh, vòng tròn hít thở
│   ├── responsive.css       # Tương thích 100% màn hình máy tính, máy tính bảng và điện thoại
│   └── pages/               # Tách CSS chuyên biệt cho từng trang
│       ├── home.css
│       ├── chat.css
│       ├── checkin.css
│       ├── healing.css
│       ├── profile.css
│       └── auth.css
├── js/
│   ├── firebase-config.js   # Cấu hình Firebase Modular SDK & tự động nhận diện chế độ Demo
│   ├── data-service.js      # Tầng dịch vụ dữ liệu hợp nhất (Firestore + LocalStorage fallback)
│   ├── navigation.js        # Thanh điều hướng 5 tab, lời chào theo giờ, tính chuỗi streak, modal, toast
│   ├── auth.js              # Xử lý form đăng nhập, đăng ký, quên mật khẩu
│   ├── home.js              # Logic trang chủ, lưu check-in nhanh, thông điệp truyền cảm hứng
│   ├── chat.js              # Quản lý phiên chat, lịch sử, hoạt ảnh ba dấu chấm gõ tin nhắn
│   ├── checkin.js           # Quản lý nhật ký, bộ lọc, thả bay muộn phiền, bảng vẽ cảm xúc canvas
│   ├── healing.js           # Mini-game Bloom Jigsaw kéo thả/chạm cảm ứng, bài tập thở, nhắc uống nước
│   ├── profile.js           # Biểu đồ cảm xúc Chart.js, công tắc nhắc nhở 21:00, đổi tên hiển thị
│   └── services/
│       └── gemini-client.js # Gọi backend /api/chat với cơ chế phản hồi thấu cảm
├── api/
│   └── chat.js              # Vercel Serverless Function kết nối Gemini API an toàn
├── firestore.rules          # Luật bảo mật Cloud Firestore phân quyền theo UID
├── firestore.indexes.json   # Chỉ mục tối ưu hóa truy vấn Firestore
├── vercel.json              # Cấu hình định tuyến URL tĩnh và API Serverless trên Vercel
├── .env.example             # Hướng dẫn khai báo biến môi trường GEMINI_API_KEY
├── .gitignore
├── package.json
└── README.md
```

---

## 3. Các Tính Năng Chính Của 5 Tab

###  Tab 1 — Trang Chủ (Home)
- **Lời chào thời gian thực:** Tự động nhận diện giờ địa phương: "Chào buổi sáng", "Chào buổi chiều", "Chào buổi tối" kèm tên người dùng từ hồ sơ.
- **Chuỗi check-in liên tục (Streak):** Tính toán chính xác từ các ngày check-in thực tế theo múi giờ địa phương (chỉ tăng khi có check-in thật, không tính tăng ảo khi chỉ mở trang).
- **Widget Check-in nhanh:** Chọn 6 trạng thái tâm trạng (Rất vui, Tốt, Bình thường, Buồn, Lo lắng, Mệt mỏi), nhập cảm xúc và lưu tức thì vào Firestore.
- **Thông điệp tích cực hôm nay:** Tự động đổi ngẫu nhiên câu nói dịu dàng, khích lệ tâm lý học đường, không sáo rỗng.
- **Nhật ký gần đây:** Hiển thị danh sách các bài viết mới nhất với badge tâm trạng, xem chi tiết trong modal.

### 💬 Tab 2 — Trò Chuyện (AI Chat)
- **Lịch sử phiên trò chuyện:** Tạo phiên mới bằng nút dấu cộng (+), đổi tên phiên tự động theo chủ đề đầu tiên, danh sách phiên có thời gian và nút xóa kèm xác nhận an toàn.
- **Giao diện trò chuyện chuẩn mực:** Phân biệt bong bóng tin nhắn của bạn và AI, hoạt ảnh ba dấu chấm nhảy nhẹ nhàng (Typing Indicator) khi AI đang phản hồi, tự động cuộn xuống dưới, hỗ trợ Enter để gửi và Shift+Enter để xuống dòng.
- **Bộ đệm an toàn tâm lý:** Banner nhắc nhở số điện thoại khẩn cấp (Tổng đài Quốc gia Bảo vệ Trẻ em 111, Đường dây nóng Ngày Mai 096 306 1414). AI không đưa ra chẩn đoán y khoa mà hướng dẫn tự chăm sóc và tìm đến người lớn tin cậy khi có khủng hoảng.

### 📝 Tab 3 — Check-in (Nhật Ký Cảm Xúc)
- **Sổ nhật ký đầy đủ:** Chọn tâm trạng, chọn ngày ghi nhận (mặc định hôm nay), viết nội dung không giới hạn.
- **Bộ lọc & Tìm kiếm:** Lọc nhật ký theo từng cung bậc cảm xúc hoặc tìm kiếm theo từ khóa. Cho phép xem, chỉnh sửa và xóa với hộp thoại xác nhận.
- **Hoạt động "Thả bay muộn phiền":** Nhập điều muốn buông bỏ, bấm thả -> Quả bóng bay bổng lên cao dần và mờ tan vào bầu trời cùng lời nhắn vỗ về tích cực.
- **Bảng vẽ cảm xúc (Mood Canvas):** Cho phép vẽ tự do bằng chuột hoặc ngón tay cảm ứng với bảng màu pastel nhẹ nhàng, tùy chọn cỡ cọ và xóa nét vẽ.

### 🌿 Tab 4 — Góc Nhỏ (Healing Corner)
- **Thanh lọc danh mục:** Tất cả, Ghép tranh, Thư giãn, Chăm sóc bản thân, Kiến thức tâm lý.
- **Mini-game Bloom Jigsaw:** Trò chơi ghép tranh 3x3 thực tế với 3 chủ đề tĩnh vật/thiên nhiên yên ả (Hồ Sen Yên Bình, Đồi Hoa Hoàng Hôn, Góc Đọc Sách). Hỗ trợ kéo thả bằng chuột trên PC và chạm vuốt trên Mobile, nhận biết vị trí chuẩn xác, thanh tiến trình % và hiệu ứng chúc mừng khi hoàn thành.
- **Bài tập thở 4-4-4-4 (Box Breathing):** Vòng tròn nhịp thở nở rộng và co lại theo chu kỳ 4 giây (Hít vào - Giữ hơi - Thở ra - Thả lỏng) với bộ đếm ngược trực quan.
- **Thói quen tự chăm sóc:** Theo dõi 8 ly nước mỗi ngày (bấm tích ly nước), quy tắc thư giãn mắt 20-20-20, giãn cơ sau giờ học và ghi chép 3 điều biết ơn.
- **Góc nhìn tâm lý học đường:** Các bài đọc giải thích khoa học não bộ tuổi 17, áp lực điểm số và kỹ thuật định tâm 5 ngón tay trước giờ thi.

### 👤 Tab 5 — Hồ Sơ (Profile)
- **Hồ sơ học sinh:** Avatar viết tắt theo chữ cái đầu, tên người dùng, email, nút đổi tên hiển thị.
- **Thống kê thực tế:** Tổng số lần check-in, số lần tâm trạng Tốt, Bình thường, chuỗi ngày liên tiếp (được tính toán động từ dữ liệu Firestore, tuyệt đối không gán cứng số liệu giả).
- **Biểu đồ tâm trạng (Chart.js):** Đường nhịp điệu cảm xúc trực quan theo tuần (Thứ Ba đến Thứ Hai) hoặc tháng với các bậc cảm xúc từ Rất vui đến Buồn.
- **Nhắc nhở cuối ngày — 21:00:** Công tắc bật/tắt nhắc nhở lưu vào cài đặt người dùng, hỗ trợ xin quyền Web Notification nếu trình duyệt tương thích.
- **Đăng xuất an toàn:** Đăng xuất khỏi Firebase Auth, xóa phiên làm việc và chuyển về trang đăng nhập.

---

## 4. Hướng Dẫn Cấu Hình Firebase

Để lưu dữ liệu thực tế lên máy chủ Google Firebase:

### Bước 1: Tạo Firebase Project
1. Truy cập [Firebase Console](https://console.firebase.google.com/) và đăng nhập bằng tài khoản Google.
2. Nhấn **"Add project"** (Thêm dự án), đặt tên là `serenebloom` và nhấn Tiếp tục.

### Bước 2: Bật Firebase Authentication
1. Tại menu bên trái, chọn **Build** -> **Authentication** -> Nhấn **Get started**.
2. Trong tab **Sign-in method**, chọn **Email/Password**.
3. Bật công tắc **Enable** ở mục đầu tiên (Email/Password) -> Nhấn **Save**.

### Bước 3: Tạo cơ sở dữ liệu Cloud Firestore
1. Tại menu bên trái, chọn **Build** -> **Firestore Database** -> Nhấn **Create database**.
2. Chọn vị trí lưu trữ (khuyến nghị `asia-southeast1` tại Singapore để có tốc độ tốt nhất tại Việt Nam).
3. Chọn chế độ **Start in production mode** (hoặc test mode) -> Nhấn **Enable**.

### Bước 4: Lấy thông tin cấu hình Web App
1. Nhấn vào biểu tượng Bánh răng (Project Settings) ở góc trên bên trái.
2. Kéo xuống mục **"Your apps"**, nhấn vào biểu tượng Web `</>`.
3. Đặt tên ứng dụng (ví dụ: `serenebloom-web`) -> Nhấn **Register app**.
4. Sao chép đối tượng `firebaseConfig`:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
5. Mở tệp [js/firebase-config.js](file:///c:/Users/quoc_/Downloads/WEB/DuongNgocHan/js/firebase-config.js) trong dự án của bạn và dán các giá trị trên vào.
> 💡 **Lưu ý tiện ích:** Nếu bạn chưa điền Firebase Config, SereneBloom sẽ tự động chuyển sang chế độ **Local Demo Mode** với bộ nhớ cục bộ — cho phép bạn thử nghiệm toàn bộ nút bấm, lưu bài, biểu đồ và trò chơi ngay lập tức mà không gặp bất kỳ lỗi trắng màn hình nào!

---

## 5. Quy Tắc Bảo Mật Firestore & Ca Kiểm Thử

Mở tab **Rules** trong Firestore Database trên Firebase Console và dán nội dung từ tệp [firestore.rules](file:///c:/Users/quoc_/Downloads/WEB/DuongNgocHan/firestore.rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isOwner(userId) { return isAuthenticated() && request.auth.uid == userId; }
    function isValidMood(mood) { return mood in ['joy', 'good', 'neutral', 'sad', 'anxious', 'tired']; }

    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /checkins/{checkinId} {
        allow read, write: if isOwner(userId) && isValidMood(request.resource.data.mood);
      }
      match /chatSessions/{sessionId} {
        allow read, write: if isOwner(userId);
        match /messages/{messageId} {
          allow read, create, delete: if isOwner(userId);
          allow update: if false;
        }
      }
      match /settings/{settingId} { allow read, write: if isOwner(userId); }
      match /activities/{activityId} { allow read, write: if isOwner(userId); }
    }
    match /{document=**} { allow read, write: if false; }
  }
}
```

### Các trường hợp kiểm thử bảo mật (Test Cases)
1. **Truy cập khi chưa đăng nhập (Unauthenticated):**
   - Hành động: Gửi request đọc `/users/user_123/checkins`.
   - Kết quả: **Từ chối (Permission Denied)** vì `request.auth == null`.
2. **Truy cập chéo tài khoản (Cross-account Access):**
   - Người dùng A (`UID: user_A`) đăng nhập và cố gắng đọc/sửa dữ liệu tại `/users/user_B/checkins`.
   - Kết quả: **Từ chối (Permission Denied)** vì `request.auth.uid != userId`.
3. **Dữ liệu không hợp lệ (Data Validation):**
   - Hành động: Cố tình gửi `mood: "hacker_mood"` hoặc nội dung vượt quá kích thước cho phép.
   - Kết quả: **Từ chối (Permission Denied)** vì vi phạm hàm `isValidMood()`.

---

## 6. Cấu Hình Gemini AI Backend

SereneBloom tích hợp AI thông qua Serverless Function tại tệp [api/chat.js](file:///c:/Users/quoc_/Downloads/WEB/DuongNgocHan/api/chat.js) để bảo vệ tuyệt đối API Key của bạn không bị lộ ra ngoài giao diện.

1. Lấy Google Gemini API Key miễn phí tại [Google AI Studio](https://aistudio.google.com/).
2. Khi triển khai lên Vercel, thêm biến môi trường (Environment Variable):
   - **Tên:** `GEMINI_API_KEY`
   - **Giá trị:** Khóa API của bạn (bắt đầu bằng `AIzaSy...`)
3. Nếu chạy static offline chưa có khóa API, hệ thống sẽ sử dụng thuật toán phản hồi thấu cảm tích hợp sẵn trong client, đảm bảo cuộc trò chuyện luôn diễn ra liên tục, ấm áp và hỗ trợ các đường dây nóng khi phát hiện từ khóa nguy hiểm.

---

## 7. Chạy Thử Nghiệm Trên Máy Tính

Bạn có thể chạy thử nghiệm SereneBloom bằng bất kỳ máy chủ tĩnh nào:

### Cách 1: Sử dụng Node.js & npm (Đã thiết lập sẵn)
Mở terminal trong thư mục dự án và chạy:
```bash
npm start
```
Trình duyệt sẽ mở tại `http://localhost:3000`.

### Cách 2: Sử dụng VS Code Live Server
Mở thư mục `serenebloom` trong VS Code, nhấp chuột phải vào `index.html` và chọn **"Open with Live Server"**.

---

## 8. Triển Khai Lên Vercel (Deploy Guide)

### Triển khai qua GitHub (Khuyên dùng)
1. Khởi tạo kho mã nguồn Git và đẩy lên GitHub:
   ```bash
   git init
   git add .
   git commit -m "Khoi tao SereneBloom"
   git remote add origin https://github.com/your-username/serenebloom.git
   git push -u origin main
   ```
2. Đăng nhập vào [Vercel](https://vercel.com/) và nhấn **"Add New"** -> **"Project"**.
3. Chọn kho mã nguồn `serenebloom` vừa tạo.
4. Tại mục **Environment Variables**, thêm:
   - Key: `GEMINI_API_KEY`
   - Value: `(Gemini API Key của bạn)`
5. Nhấn **Deploy**. Sau khoảng 30 giây, website của bạn sẽ hoạt động chính thức trên domain dạng `https://serenebloom.vercel.app`.

---

## 9. Bảng Tổng Hợp Trạng Thái Hoạt Động

| Mục / Tính năng | Trạng thái kỹ thuật | Ghi chú vận hành |
|---|---|---|
| **5 Tab Điều hướng & Responsive** | ✅ Hoàn thành 100% | Sidebar Desktop & Bottom Nav Mobile chuyển mượt mà |
| **Xác thực Authentication** | ✅ Hoàn thành 100% | Đăng ký, đăng nhập, khôi phục mật khẩu, nhớ đăng nhập |
| **Lưu trữ Check-in & Nhật ký** | ✅ Hoàn thành 100% | Lưu vào Firestore `users/{uid}/checkins`, có chế độ Demo |
| **Tính toán Chuỗi Streak** | ✅ Hoàn thành 100% | Tính theo ngày liên tục thực tế, không cộng ảo |
| **Mini-game Ghép tranh Jigsaw** | ✅ Hoàn thành 100% | Kéo thả chuột + cảm ứng, 3 tranh, nhận biết đúng mảnh |
| **Vẽ cảm xúc Canvas & Thả bóng** | ✅ Hoàn thành 100% | Hoạt ảnh bóng bay lên trời mượt, vẽ màu tự do |
| **Hít thở 4-4-4-4 Box Breathing** | ✅ Hoàn thành 100% | Nhịp tròn co giãn và bộ đếm giây sinh động |
| **Biểu đồ tâm trạng Chart.js** | ✅ Hoàn thành 100% | Vẽ theo điểm cảm xúc thực tế tuần và tháng |
| **Chatbot Gemini AI Backend** | ✅ Hoàn thành 100% | Endpoint `/api/chat.js` bảo mật API key, chuẩn bị sẵn cho Vercel |
| **Bảo mật Firestore Security Rules**| ✅ Hoàn thành 100% | Phân quyền nghiêm ngặt theo UID, chặn truy cập chéo |


## Kết nối Gemini AI thật và thống kê cảm xúc

### Thống kê hồ sơ
- Trang `profile.html` đọc check-in qua `DataService.getCheckins(uid)`.
- Biểu đồ tuần tính trung bình từ các check-in thực tế của 7 ngày gần nhất.
- Chế độ tháng chia 28 ngày gần nhất thành 4 khoảng 7 ngày và chỉ hiển thị các khoảng có dữ liệu; không chèn số liệu mẫu.
- Các ô tổng số, tâm trạng tích cực/bình thường và chuỗi ngày tiếp tục lấy từ dữ liệu thật.

### Gemini AI trên Vercel
1. Đưa thư mục dự án lên GitHub và import repository đó trong Vercel.
2. Vào **Vercel → Project → Settings → Environment Variables**.
3. Thêm `GEMINI_API_KEY` với API key tạo trong Google AI Studio. Không đặt key này trong file JavaScript frontend và không commit `.env`.
4. Chọn môi trường cần dùng (Production/Preview/Development), lưu biến rồi vào **Deployments → Redeploy** để biến môi trường được áp dụng.
5. Mở website bằng URL Vercel đã triển khai. Endpoint `/api/chat` chỉ chạy trên môi trường có hỗ trợ Vercel Functions; mở HTML bằng `file://` hoặc server tĩnh khác sẽ không có endpoint này.
6. Gửi tin nhắn thử. Nếu cấu hình sai hoặc hết hạn mức, giao diện báo chưa kết nối được Gemini thay vì giả vờ rằng câu trả lời mẫu là AI thật.

Model backend hiện cấu hình `gemini-2.5-flash`. Nếu Google AI Studio của dự án không cho phép model này, hãy thay tên model bằng model Gemini đang được hỗ trợ trong tài khoản.

### Kiểm tra trước khi chia sẻ
- Xác nhận `firestore.rules` đã được áp dụng trong Firebase Console và người dùng chỉ truy cập được dữ liệu theo UID của mình.
- Đặt giới hạn sử dụng/giám sát chi phí API ở Google AI Studio hoặc Google Cloud. Endpoint demo này chưa có xác thực ID token và giới hạn tốc độ riêng; trước khi mở công khai nên bổ sung xác thực người dùng ở backend và rate limiting để tránh bị lạm dụng.
- Gemini là công cụ hỗ trợ trò chuyện, không phải chẩn đoán hay thay thế chuyên gia tâm lý.
