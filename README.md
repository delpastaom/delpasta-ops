# Del Pasta Ops

نظام تشغيل داخلي لـ Del Pasta: المخزون والوصفات (خطوات مصوّرة، تحجيم الإنتاج، تكلفة تلقائية، طباعة) بثلاث لغات (عربي/إنجليزي/سواحيلي).

Stack: React + TypeScript + Vite + Tailwind + Supabase (Postgres + Storage). نشر عبر GitHub Pages.

## الإعداد (مرة واحدة)

### 1. إنشاء مشروع Supabase
- أنشئ مشروعًا جديدًا على [supabase.com](https://supabase.com).
- من **SQL Editor** داخل المشروع: انسخ محتوى [`supabase/schema.sql`](supabase/schema.sql) وشغّله (ينشئ الجداول + صلاحيات الوصول + مخزن الصور).
- ثم انسخ محتوى [`supabase/seed.sql`](supabase/seed.sql) وشغّله (يضيف بيانات تجريبية: الفئات + مكوّنات + وصفة سمبوسة الجبن كاملة).
- من **Project Settings → API**: خذ قيمتي `Project URL` و `anon public key`.

### 2. متغيرات البيئة
```bash
cp .env.example .env.local
```
عدّل `.env.local` وضع فيه القيمتين من الخطوة السابقة:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. التشغيل محليًا
```bash
npm install
npm run dev
```
يفتح على http://localhost:3100

### 4. النشر على GitHub Pages
1. أنشئ مستودع (repository) فارغ جديد على GitHub.
2. من إعدادات المستودع: **Settings → Secrets and variables → Actions** أضف Secret باسم `VITE_SUPABASE_URL` وآخر باسم `VITE_SUPABASE_ANON_KEY` (نفس قيم `.env.local`).
3. من **Settings → Pages**: اختر Source = **GitHub Actions**.
4. اربط المستودع وارفع الكود:
   ```bash
   git remote add origin <رابط-المستودع-الفارغ>
   git add -A
   git commit -m "Initial commit"
   git push -u origin main
   ```
5. كل `git push` بعد ذلك يبني وينشر تلقائيًا عبر `.github/workflows/deploy.yml`.

## بنية المشروع
- `src/lib/db.ts` — كل عمليات القراءة/الكتابة إلى Supabase.
- `src/lib/i18n.tsx` — الترجمة الثلاثية (عربي/إنجليزي/سواحيلي) + `pickField()` لقراءة الحقول المترجمة.
- `src/lib/role.tsx` — الدور الحالي (مدير/موظف...)، تخزين محلي بدون تسجيل دخول حقيقي.
- `src/pages/` — Dashboard, Inventory, Recipes, Reports, Settings.
- `supabase/schema.sql` / `supabase/seed.sql` — قاعدة البيانات والبيانات التجريبية.

## ملاحظة أمنية
لا يوجد تسجيل دخول لكل مستخدم — أي شخص يملك رابط الموقع ومفتاح Supabase العام يقدر يكتب في البيانات. هذا مناسب لأداة تشغيل داخلية لفريق موثوق، لكن لا تشارك رابط المستودع أو الموقع علنًا بدون تفكير في إضافة تسجيل دخول لاحقًا.

## غير مبني بعد (المرحلة القادمة)
- وضع الموظفين (Staff Mode) المبسّط بخطوات تفاعلية على الجوال.
- قوائم المهام (Checklists) ومهام التحضير اليومية.
- معدات البوفيه (الأطباق، الأدوات...) وتتبع الفعاليات.
- مساعدة الذكاء الاصطناعي (ترجمة/تبسيط تلقائي) — تحتاج Supabase Edge Function بمفتاح Anthropic API لأنها لا يمكن أن تعمل من المتصفح مباشرة بأمان.
