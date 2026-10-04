# Phố Việt — bản dành cho Render

Game 3D phố Việt, tên hiển thị, phòng tối đa 30 chỗ, 6 nhiệm vụ văn hóa và bảng xếp hạng theo phòng. Giao diện/font Noto Sans hỗ trợ tiếng Việt. Phiên chơi 6 phút cho buổi thuyết trình 10 phút.

Bản này chuyển từ Vinext/Cloudflare D1 sang Next.js chạy Node.js 24 và SQLite, giữ nội dung/đồ họa/gameplay. Không cần tài khoản Cloudflare hay khóa API. Đây là prototype 3D, không phải sản phẩm chất lượng AAA. Multiplayer dùng HTTP polling 350 ms, không dùng WebSocket. Phòng tự hết hạn sau 24 giờ; tạo phòng mới để chơi lại. Không tự chuyển dữ liệu phòng từ website cũ.

## Chạy trên máy

Cài Node.js 24, mở terminal tại thư mục chứa package.json:

```sh
npm ci --include=dev
npm run build
npm start
```

Mở http://localhost:3000. Khi sửa code: `npm run dev`.

Database tự tạo tại `data/pho-viet.sqlite`. Có thể đổi đường dẫn bằng biến môi trường DATABASE_PATH. Chạy một instance máy chủ; không chạy nhiều bản sao với các database độc lập.

## Deploy lên Render bằng giao diện

1. Giải nén ZIP. Lấy **nội dung bên trong thư mục pho-viet-render**, đưa lên một repository GitHub mới. Đặt `package.json`, `render.yaml`, `app/`, `game/`, `public/` ngay ở gốc repository. Dùng GitHub Desktop hoặc git; không chỉ upload file ZIP. Có thể dùng repository private rồi cấp Render quyền đọc repository đó.
2. Vào https://dashboard.render.com/, chọn **New → Web Service**, kết nối GitHub và chọn repository vừa tạo. Game có API multiplayer nên cần Web Service.
3. Điền cấu hình:

| Trường | Giá trị |
|---|---|
| Name | pho-viet hoặc tên khác còn trống |
| Language/Runtime | Node |
| Branch | main (hoặc nhánh bạn vừa push) |
| Region | Singapore nếu có trong danh sách |
| Root Directory | Để trống nếu package.json ở gốc repo |
| Build Command | npm ci --include=dev && npm run build |
| Start Command | npm start |
| Health Check Path | /api/health |
| Environment: NODE_VERSION | 24 |
| Environment: DATABASE_PATH | ./data/pho-viet.sqlite |

Nếu upload cả thư mục pho-viet-render vào repo, đặt Root Directory = pho-viet-render.

4. Chọn **Free** nếu chỉ thử, hoặc chọn gói trả phí và thiết lập disk theo phần sau nếu cần lưu dữ liệu. Xem mức phí được Render hiển thị trước khi xác nhận.
5. Chọn **Deploy Web Service**. Đợi trạng thái **Live**, mở URL `https://<tên-dịch-vụ>.onrender.com` mà Render cung cấp.
6. Mở URL trên hai thiết bị hoặc hai tab. Người đầu nhập tên → Tạo phòng; người thứ hai nhập tên → Vào phòng bằng mã. Chủ phòng nhấn bắt đầu. Kiểm tra thấy hai tên trên bảng và cùng trạng thái trận.
7. Gửi URL Render/mã phòng cho nhóm. Người chơi không cần tài khoản Render; tên hiển thị là tên khách. Trang Render này có thể truy cập công khai theo URL.

Máy chủ đã đọc PORT của Render và lắng nghe 0.0.0.0; không cần tự đặt PORT.

### Cách khác: Blueprint

Repo đã có render.yaml cho bản Free. Chọn **New → Blueprint**, kết nối repo và kiểm tra cấu hình trước khi deploy. File render.yaml cần ở gốc repo cho cách này. Hướng dẫn Web Service ở trên dễ chỉnh trực tiếp hơn.

## Giữ database qua restart/deploy

Render Free không hỗ trợ persistent disk. SQLite trên Free sẽ mất khi redeploy, restart hoặc ngủ; phòng và điểm hiện có sẽ mất. Free ngủ sau 15 phút không có traffic; lần truy cập tiếp theo thường cần khoảng một phút để khởi động. Render có thể restart Free bất cứ lúc nào.

Để giữ database:

1. Chọn một **paid instance** cho Web Service.
2. Trong **Disks**, thêm disk, mount path `/var/data`, ví dụ dung lượng 1 GB nếu có thể chọn.
3. Đặt `DATABASE_PATH=/var/data/pho-viet.sqlite`, rồi deploy lại.
4. Giữ **một instance**. File SQLite trong data/ cũ không tự chuyển sang disk mới; thay đường dẫn sẽ bắt đầu database mới.

Nếu quản lý bằng Blueprint, sửa render.yaml tương ứng trước khi đồng bộ lại:

```yaml
# Trong service hiện có, đổi plan và thêm disk:
plan: starter
disk:
  name: pho-viet-data
  mountPath: /var/data
  sizeGB: 1
# Đồng thời đổi envVars DATABASE_PATH thành /var/data/pho-viet.sqlite.
```

Disk/paid instance phát sinh phí theo giá Render tại thời điểm tạo. Gắn disk có thể gây gián đoạn khi deploy; tránh redeploy trong lúc trình bày. Để mở rộng nhiều instance cần chuyển sang database dùng chung, chưa có trong gói này.

## Chuẩn bị thuyết trình

- Trước giờ trình bày 10 phút, mở URL và thử bằng hai thiết bị. Nếu dùng Free, chờ máy chủ khởi động rồi tạo phòng mới.
- 0–1 phút: giới thiệu tên hiển thị/mã phòng và chủ đề giữ bản sắc, tiếp thu có chọn lọc.
- 1–7 phút: chủ phòng bắt đầu vòng chơi 6 phút; WASD/phím mũi tên di chuyển, kéo chuột xoay góc nhìn, E làm nhiệm vụ, F dùng xe.
- 7–10 phút: xem bảng điểm, mở nhật ký/giáo trình để liên hệ kiến thức.
- Giới hạn 30 chỗ/phòng là cấu hình; chưa đo tải 30 người thật trên Render. Nên diễn tập với thiết bị và mạng thực tế.

## Cấu trúc và kiểm chứng

- app/page.tsx: giao diện và đồng bộ người chơi.
- game/scene.ts: thế giới Three.js.
- game/world.ts: bản đồ, nhiệm vụ, nội dung học tập.
- game/server.ts: kiểm tra di chuyển, chủ phòng và điểm số.
- game/sqlite.ts: SQLite Node.js, tự khởi tạo schema.
- public/fonts/: Noto Sans và thông tin giấy phép.
- public/nguon/: các trang giáo trình đã dùng trong game; chỉ chia sẻ trong phạm vi bạn có quyền sử dụng.
- tests/http-check.mjs: kiểm tra API trên máy chủ đang chạy; `TEST_URL=http://localhost:3000 node tests/http-check.mjs` (Linux/macOS).

Đã kiểm tra production build/TypeScript, HTML và font được phục vụ, hai phiên người chơi dùng chung phòng, quyền chủ phòng, bắt đầu/tạm dừng đồng bộ, SQLite giữ dữ liệu qua tiến trình máy chủ mới. Chưa deploy thử vào tài khoản Render của bạn, chưa kiểm tra đồ họa bằng trình duyệt hay đo FPS trên Render. Cài dependency được khóa bởi package-lock.json; kiểm tra build dùng các dependency cục bộ tương ứng, chưa thực hiện tải mới toàn bộ từ npm.

## Lỗi thường gặp

- Không thấy package.json: sửa Root Directory cho đúng.
- Lỗi node:sqlite: kiểm tra NODE_VERSION=24, sau đó deploy lại.
- /api/health trả 503: xem Logs; kiểm tra quyền ghi và DATABASE_PATH/disk mount.
- Mất phòng sau restart trên Free: tạo phòng mới; dùng paid instance + disk nếu cần giữ dữ liệu.
- Deploy xong không vào lại phòng cũ: phòng trên website cũ không chuyển sang Render; tạo phòng mới trên URL Render.

Tài liệu Render đã đối chiếu ngày 04/10/2026:
- https://render.com/docs/deploy-nextjs-app
- https://render.com/docs/web-services
- https://render.com/docs/node-version
- https://render.com/docs/free
- https://render.com/docs/disks
