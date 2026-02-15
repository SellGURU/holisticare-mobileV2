# بیلد اندروید و iOS با Capacitor

## نکته مهم دربارهٔ `.env`

**فایل `.env` داخل اپ موبایل کپی نمی‌شود و نباید برود.**

Vite موقع `npm run build` مقدارهای `VITE_ROOK_*` را **داخل فایل‌های JS** می‌نویسد. پس فقط لازم است **وقتی بیلد می‌گیری** این متغیرها در دسترس باشند.

---

## بیلد لوکال (روی سیستم خودت)

1. فایل `.env` یا `client/.env` را داشته باش با این دو خط:
   ```
   VITE_ROOK_CLIENT_UUID=...
   VITE_ROOK_PASSWORD=...
   ```
2. از **ریشه پروژه** اجرا کن:
   ```bash
   npm run build
   npx cap sync
   ```
3. بعد اندروید یا iOS را باز کن و از Android Studio / Xcode بیلد بگیر.

متغیرها داخل خروجی `dist/public` هستند؛ Capacitor همان پوشه را برای اپ استفاده می‌کند.

---

## بیلد در CI (مثلاً GitHub Actions)

فایل `.env` را کامیت نکن. به‌جایش در CI متغیرهای محیط را ست کن:

1. در GitHub: **Settings → Secrets and variables → Actions** دو تا Secret اضافه کن:
   - `VITE_ROOK_CLIENT_UUID`
   - `VITE_ROOK_PASSWORD`

2. در workflow قبل از `npm run build` این‌ها را به محیط بیلد بده، مثلاً:
   ```yaml
   - name: Build
     env:
       VITE_ROOK_CLIENT_UUID: ${{ secrets.VITE_ROOK_CLIENT_UUID }}
       VITE_ROOK_PASSWORD: ${{ secrets.VITE_ROOK_PASSWORD }}
     run: |
       npm run build
       npx cap sync
   ```

با این کار در CI هم بدون داشتن فایل `.env` در ریپو، خروجی اندروید/iOS درست کار می‌کند.
