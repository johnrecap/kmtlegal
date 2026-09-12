# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: batch9-documents.spec.ts >> Batch 9 isolated document acceptance >> requires keyboard confirmation, sends one delete, hides the row, and preserves bytes
- Location: tests\e2e\batch9-documents.spec.ts:270:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('details:visible').filter({ hasText: '[BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] ui-delete.pdf' }).first().locator('form').filter({ has: locator('input[name="confirmDelete"]') })
Expected: visible
Received: hidden
Timeout:  10000ms

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('details:visible').filter({ hasText: '[BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] ui-delete.pdf' }).first().locator('form').filter({ has: locator('input[name="confirmDelete"]') })
    22 × locator resolved to <form class="mt-3 space-y-3 rounded border border-kmt-danger-border bg-kmt-danger-surface p-3">…</form>
       - unexpected value "hidden"

```

```yaml
- banner:
  - button "فتح قائمة الإدارة"
  - paragraph: لوحة المكتب
  - heading "مستندات المكتب" [level=1]
  - group
  - text: "[BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] office"
  - button "تسجيل الخروج"
- main:
  - search "فلاتر المستندات":
    - text: البحث في المستندات
    - searchbox "البحث في المستندات": "[BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] ui-delete.pdf"
    - text: الحالة
    - combobox "الحالة":
      - option "كل الحالات" [selected]
      - option "جديد"
      - option "قيد المراجعة"
      - option "يحتاج توضيح"
      - option "مقبول"
      - option "مرفوض"
    - text: التصنيف
    - combobox "التصنيف":
      - option "كل التصنيفات" [selected]
      - option "عقد"
      - option "ملف محكمة"
      - option "هوية"
      - option "دليل"
      - option "دفع"
      - option "أخرى"
    - text: الظهور
    - combobox "الظهور":
      - option "كل مستويات الظهور" [selected]
      - option "مرئي للعميل"
      - option "فريق العمل فقط"
      - option "داخلي فقط"
    - text: العميل
    - combobox "العميل":
      - option "كل العملاء" [selected]
      - option "[BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] other"
      - option "[BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] owner"
      - option "شركة النهضة التجارية"
      - option "عميل تجريبي"
    - text: الترتيب
    - combobox "الترتيب":
      - option "تاريخ الرفع" [selected]
      - option "آخر تحديث"
      - option "اسم الملف"
      - option "الحالة"
      - option "التصنيف"
    - text: الاتجاه
    - combobox "الاتجاه":
      - option "تنازلي" [selected]
      - option "تصاعدي"
    - button "تطبيق"
  - paragraph: 1 مستند داخل الفلاتر الحالية
  - paragraph: صفحة 1 من 1
  - table "قائمة المستندات":
    - caption: قائمة المستندات
    - rowgroup:
      - row "الملف المالك / القضية التصنيف الحالة الظهور الرفع":
        - columnheader "الملف"
        - columnheader "المالك / القضية"
        - columnheader "التصنيف"
        - columnheader "الحالة"
        - columnheader "الظهور"
        - columnheader "الرفع"
    - rowgroup:
      - row "[BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] ui-delete.pdf 43 B · application/pdf غير محدد B9-T-68decc5a98cf428484 أخرى جديد مرئي للعميل [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] office ١٢‏/٠٩‏/٢٠٢٦، ١١:٤٣ م":
        - cell "[BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] ui-delete.pdf 43 B · application/pdf":
          - link "[BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] ui-delete.pdf":
            - /url: /api/files/11b396be-5163-458d-90c1-5a15347d70d3/download
          - paragraph: 43 B · application/pdf
        - cell "غير محدد B9-T-68decc5a98cf428484":
          - paragraph: غير محدد
          - link "B9-T-68decc5a98cf428484":
            - /url: /admin/cases/777fa162-e35b-43a1-b8f1-ba7aa9672c37?tab=documents
        - cell "أخرى"
        - cell "جديد"
        - cell "مرئي للعميل"
        - cell "[BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] office ١٢‏/٠٩‏/٢٠٢٦، ١١:٤٣ م":
          - paragraph: "[BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] office"
          - paragraph: ١٢‏/٠٩‏/٢٠٢٦، ١١:٤٣ م
  - group:
    - link "[BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] ui-delete.pdf":
      - /url: /api/files/11b396be-5163-458d-90c1-5a15347d70d3/download
    - paragraph: 43 B · بدون عميل مالك · [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] office
    - text: جديد مرئي للعميل
  - link "مسح الفلاتر":
    - /url: /admin/documents
  - heading "رفع مستند" [level=3]
  - paragraph: "الرفع يستخدم عقد PLAN-07: تخزين VPS خاص، حد 5MB، وتنزيل عبر الخادم بعد فحص الصلاحيات."
  - text: القضية
  - combobox "القضية":
    - option "بدون قضية" [selected]
    - option "B9-T-68decc5a98cf428484 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] target"
    - option "B9-O-68decc5a98cf428484 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] other case"
    - option "B9-68decc5a98cf428484-1 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 1"
    - option "B9-68decc5a98cf428484-2 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 2"
    - option "B9-68decc5a98cf428484-3 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 3"
    - option "B9-68decc5a98cf428484-4 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 4"
    - option "B9-68decc5a98cf428484-5 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 5"
    - option "B9-68decc5a98cf428484-6 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 6"
    - option "B9-68decc5a98cf428484-7 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 7"
    - option "B9-68decc5a98cf428484-8 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 8"
    - option "B9-68decc5a98cf428484-9 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 9"
    - option "B9-68decc5a98cf428484-10 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 10"
    - option "B9-68decc5a98cf428484-11 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 11"
    - option "B9-68decc5a98cf428484-12 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 12"
    - option "B9-68decc5a98cf428484-13 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 13"
    - option "B9-68decc5a98cf428484-14 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 14"
    - option "B9-68decc5a98cf428484-15 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 15"
    - option "B9-68decc5a98cf428484-16 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 16"
    - option "B9-68decc5a98cf428484-17 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 17"
    - option "B9-68decc5a98cf428484-18 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 18"
    - option "B9-68decc5a98cf428484-19 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 19"
    - option "B9-68decc5a98cf428484-20 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 20"
    - option "B9-68decc5a98cf428484-21 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 21"
    - option "B9-68decc5a98cf428484-22 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 22"
    - option "B9-68decc5a98cf428484-23 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 23"
    - option "B9-68decc5a98cf428484-24 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 24"
    - option "B9-68decc5a98cf428484-25 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 25"
    - option "B9-68decc5a98cf428484-26 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 26"
    - option "B9-68decc5a98cf428484-27 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 27"
    - option "B9-68decc5a98cf428484-28 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 28"
    - option "B9-68decc5a98cf428484-29 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 29"
    - option "B9-68decc5a98cf428484-30 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 30"
    - option "B9-68decc5a98cf428484-31 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 31"
    - option "B9-68decc5a98cf428484-32 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 32"
    - option "B9-68decc5a98cf428484-33 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 33"
    - option "B9-68decc5a98cf428484-34 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 34"
    - option "B9-68decc5a98cf428484-35 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 35"
    - option "B9-68decc5a98cf428484-36 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 36"
    - option "B9-68decc5a98cf428484-37 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 37"
    - option "B9-68decc5a98cf428484-38 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 38"
    - option "B9-68decc5a98cf428484-39 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 39"
    - option "B9-68decc5a98cf428484-40 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 40"
    - option "B9-68decc5a98cf428484-41 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 41"
    - option "B9-68decc5a98cf428484-42 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 42"
    - option "B9-68decc5a98cf428484-43 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 43"
    - option "B9-68decc5a98cf428484-44 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 44"
    - option "B9-68decc5a98cf428484-45 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 45"
    - option "B9-68decc5a98cf428484-46 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 46"
    - option "B9-68decc5a98cf428484-47 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 47"
    - option "B9-68decc5a98cf428484-48 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 48"
    - option "B9-68decc5a98cf428484-49 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 49"
    - option "B9-68decc5a98cf428484-50 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 50"
    - option "B9-68decc5a98cf428484-51 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 51"
    - option "B9-68decc5a98cf428484-52 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 52"
    - option "B9-68decc5a98cf428484-53 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 53"
    - option "B9-68decc5a98cf428484-54 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 54"
    - option "B9-68decc5a98cf428484-55 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 55"
    - option "B9-68decc5a98cf428484-56 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 56"
    - option "B9-68decc5a98cf428484-57 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 57"
    - option "B9-68decc5a98cf428484-58 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 58"
    - option "B9-68decc5a98cf428484-59 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 59"
    - option "B9-68decc5a98cf428484-60 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 60"
    - option "B9-68decc5a98cf428484-61 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 61"
    - option "B9-68decc5a98cf428484-62 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 62"
    - option "B9-68decc5a98cf428484-63 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 63"
    - option "B9-68decc5a98cf428484-64 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 64"
    - option "B9-68decc5a98cf428484-65 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 65"
    - option "B9-68decc5a98cf428484-66 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 66"
    - option "B9-68decc5a98cf428484-67 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 67"
    - option "B9-68decc5a98cf428484-68 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 68"
    - option "B9-68decc5a98cf428484-69 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 69"
    - option "B9-68decc5a98cf428484-70 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 70"
    - option "B9-68decc5a98cf428484-71 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 71"
    - option "B9-68decc5a98cf428484-72 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 72"
    - option "B9-68decc5a98cf428484-73 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 73"
    - option "B9-68decc5a98cf428484-74 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 74"
    - option "B9-68decc5a98cf428484-75 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 75"
    - option "B9-68decc5a98cf428484-76 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 76"
    - option "B9-68decc5a98cf428484-77 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 77"
    - option "B9-68decc5a98cf428484-78 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 78"
    - option "B9-68decc5a98cf428484-79 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 79"
    - option "B9-68decc5a98cf428484-80 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 80"
    - option "B9-68decc5a98cf428484-81 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 81"
    - option "B9-68decc5a98cf428484-82 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 82"
    - option "B9-68decc5a98cf428484-83 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 83"
    - option "B9-68decc5a98cf428484-84 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 84"
    - option "B9-68decc5a98cf428484-85 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 85"
    - option "B9-68decc5a98cf428484-86 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 86"
    - option "B9-68decc5a98cf428484-87 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 87"
    - option "B9-68decc5a98cf428484-88 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 88"
    - option "B9-68decc5a98cf428484-90 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 90"
    - option "B9-68decc5a98cf428484-91 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 91"
    - option "B9-68decc5a98cf428484-92 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 92"
    - option "B9-68decc5a98cf428484-93 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 93"
    - option "B9-68decc5a98cf428484-94 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 94"
    - option "B9-68decc5a98cf428484-95 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 95"
    - option "B9-68decc5a98cf428484-96 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 96"
    - option "B9-68decc5a98cf428484-97 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 97"
    - option "B9-68decc5a98cf428484-98 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 98"
    - option "B9-68decc5a98cf428484-99 - [BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] newer 99"
  - text: العميل المالك
  - combobox "العميل المالك":
    - option "غير محدد" [selected]
    - option "[BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] other"
    - option "[BATCH9:68decc5a-98cf-4284-84a4-dcc39c3a5274] owner"
    - option "شركة النهضة التجارية"
    - option "عميل تجريبي"
  - text: التصنيف
  - combobox "التصنيف":
    - option "عقد"
    - option "ملف محكمة"
    - option "هوية"
    - option "دليل"
    - option "دفع"
    - option "أخرى" [selected]
  - text: الظهور
  - combobox "الظهور":
    - option "مرئي للعميل"
    - option "فريق العمل فقط" [selected]
    - option "داخلي فقط"
  - text: الملف
  - button "الملف"
  - paragraph: "الحد الأقصى 5MB. الأنواع المسموحة: PDF, DOC, DOCX, JPG, PNG."
  - button "رفع المستند"
- alert
```

# Test source

```ts
  192 |         await expect(ownerPage.getByText(staff.fileName, { exact: true })).toHaveCount(0);
  193 |         const otherPage = await contexts[4].newPage(); await otherPage.goto("/client/files", { waitUntil: "domcontentloaded" });
  194 |         await expect(otherPage.getByText(visible.fileName, { exact: true })).toHaveCount(0);
  195 |         expect((await contexts[1].request.get(`/api/files/${visible.id}/download`)).status()).toBe(200);
  196 |       } finally { await prisma.legalCase.update({ where: { id: fixture.targetCase.id }, data: { deletedAt: null } }); }
  197 |     } finally { await Promise.all(contexts.map((context) => context.close())); }
  198 |   });
  199 |
  200 |   test("serializes update-first, delete-first, and double-delete outcomes with one audit per success", async ({ page }) => {
  201 |     await loginPage(page, fixture.office.email, "/admin/documents");
  202 |     const valid = { status: "ACCEPTED", category: "OTHER", visibility: "CLIENT_VISIBLE" };
  203 |     const first = await createDocument({ name: "update-first", caseId: fixture.targetCase.id, visibility: "CLIENT_VISIBLE" });
  204 |     let releaseFirst!: () => void;
  205 |     let firstLocked!: () => void;
  206 |     const firstLockedPromise = new Promise<void>((done) => { firstLocked = done; });
  207 |     const releaseFirstPromise = new Promise<void>((done) => { releaseFirst = done; });
  208 |     const firstBlocker = prisma.$transaction(async (tx) => {
  209 |       await tx.$queryRaw`SELECT id FROM documents WHERE id = ${first.id}::uuid FOR UPDATE`;
  210 |       firstLocked();
  211 |       await releaseFirstPromise;
  212 |     }, { timeout: 30_000 });
  213 |     const firstRequests: Array<Promise<APIResponse>> = [];
  214 |     let firstCoordinationError: unknown;
  215 |     try {
  216 |       await firstLockedPromise;
  217 |       firstRequests.push(page.request.patch(`/api/admin/documents/${first.id}`, { data: valid }));
  218 |       await waitForBlockedDocumentWrites(1);
  219 |       firstRequests.push(page.request.post(`/api/admin/documents/${first.id}/delete`, { data: { confirmDelete: true } }));
  220 |       await waitForBlockedDocumentWrites(2);
  221 |     } catch (error) {
  222 |       firstCoordinationError = error;
  223 |     } finally {
  224 |       releaseFirst();
  225 |       await firstBlocker;
  226 |       if (firstCoordinationError) await Promise.allSettled(firstRequests);
  227 |     }
  228 |     if (firstCoordinationError) throw firstCoordinationError;
  229 |     const [updateFirst, deleteSecond] = await Promise.all(firstRequests);
  230 |     expect(updateFirst.status()).toBe(200);
  231 |     expect((await updateFirst.json()).data).toMatchObject({ id: first.id, status: "ACCEPTED" });
  232 |     expect(deleteSecond.status()).toBe(200);
  233 |     expect((await deleteSecond.json()).data).toMatchObject({ id: first.id, status: "DELETED" });
  234 |     expect(await prisma.auditLog.count({ where: { documentId: first.id, action: "document.update" } })).toBe(1);
  235 |     expect(await prisma.auditLog.count({ where: { documentId: first.id, action: "document.delete" } })).toBe(1);
  236 |     expect((await prisma.document.findUniqueOrThrow({ where: { id: first.id } })).deletedAt).not.toBeNull();
  237 |     const second = await createDocument({ name: "delete-first", caseId: fixture.targetCase.id, visibility: "CLIENT_VISIBLE" });
  238 |     let locked!: () => void; let release!: () => void;
  239 |     const lockedPromise = new Promise<void>((done) => { locked = done; });
  240 |     const releasePromise = new Promise<void>((done) => { release = done; });
  241 |     const blocker = prisma.$transaction(async (tx) => { await tx.$queryRaw`SELECT id FROM documents WHERE id = ${second.id}::uuid FOR UPDATE`; locked(); await releasePromise; }, { timeout: 30_000 });
  242 |     const secondRequests: Array<Promise<APIResponse>> = [];
  243 |     let secondCoordinationError: unknown;
  244 |     try {
  245 |       await lockedPromise;
  246 |       secondRequests.push(page.request.post(`/api/admin/documents/${second.id}/delete`, { data: { confirmDelete: true } }));
  247 |       await waitForBlockedDocumentWrites(1);
  248 |       secondRequests.push(page.request.patch(`/api/admin/documents/${second.id}`, { data: valid }));
  249 |       await waitForBlockedDocumentWrites(2);
  250 |     } catch (error) {
  251 |       secondCoordinationError = error;
  252 |     } finally {
  253 |       release();
  254 |       await blocker;
  255 |       if (secondCoordinationError) await Promise.allSettled(secondRequests);
  256 |     }
  257 |     if (secondCoordinationError) throw secondCoordinationError;
  258 |     const [deleteFirst, updateSecond] = await Promise.all(secondRequests);
  259 |     expect(deleteFirst.status()).toBe(200);
  260 |     expect((await deleteFirst.json()).data).toMatchObject({ id: second.id, status: "DELETED" });
  261 |     expect(updateSecond.status()).toBe(404);
  262 |     expect(await prisma.auditLog.count({ where: { documentId: second.id, action: "document.update" } })).toBe(0);
  263 |     expect(await prisma.auditLog.count({ where: { documentId: second.id, action: "document.delete" } })).toBe(1);
  264 |     const third = await createDocument({ name: "double-delete", caseId: fixture.targetCase.id, visibility: "CLIENT_VISIBLE" });
  265 |     const deletes = await Promise.all([1, 2].map(() => page.request.post(`/api/admin/documents/${third.id}/delete`, { data: { confirmDelete: true } })));
  266 |     expect(deletes.map((response) => response.status()).sort()).toEqual([200, 404]);
  267 |     expect(await prisma.auditLog.count({ where: { documentId: third.id, action: "document.delete" } })).toBe(1);
  268 |   });
  269 |
  270 |   test("requires keyboard confirmation, sends one delete, hides the row, and preserves bytes", async ({ page }, testInfo) => {
  271 |     const document = await createDocument({ name: "ui-delete", caseId: fixture.targetCase.id, visibility: "CLIENT_VISIBLE" });
  272 |     let deleteRequests = 0;
  273 |     page.on("request", (request) => { if (request.method() === "POST" && new URL(request.url()).pathname === `/api/admin/documents/${document.id}/delete`) deleteRequests += 1; });
  274 |     await loginPage(page, fixture.office.email, `/admin/documents?q=${encodeURIComponent(document.fileName)}`);
  275 |     await page.setViewportSize({ width: 390, height: 844 });
  276 |     const card = page.locator("details:visible").filter({ hasText: document.fileName }).first();
  277 |     await card.locator("summary").click();
  278 |     const deleteForm = card.locator('form').filter({ has: page.locator('input[name="confirmDelete"]') });
  279 |     const checkbox = deleteForm.locator('input[name="confirmDelete"]');
  280 |     await deleteForm.locator('button[type="submit"]').click();
  281 |     await expect(checkbox).toBeFocused();
  282 |     expect(deleteRequests).toBe(0);
  283 |     expect((await prisma.document.findUniqueOrThrow({ where: { id: document.id } })).deletedAt).toBeNull();
  284 |     await checkbox.press("Space"); await expect(checkbox).toBeChecked();
  285 |     await deleteForm.screenshot({ path: testInfo.outputPath("delete-confirmation-390.png") });
  286 |     await card.locator("summary").click();
  287 |     await expect(deleteForm).toBeHidden();
  288 |     expect(deleteRequests).toBe(0);
  289 |     expect((await prisma.document.findUniqueOrThrow({ where: { id: document.id } })).deletedAt).toBeNull();
  290 |     await card.locator("summary").click();
  291 |     await page.setViewportSize({ width: 768, height: 1024 });
> 292 |     await expect(deleteForm).toBeVisible();
      |                              ^ Error: expect(locator).toBeVisible() failed
  293 |     await checkbox.focus();
  294 |     await checkbox.press("Space");
  295 |     await expect(checkbox).toBeChecked();
  296 |     await deleteForm.screenshot({ path: testInfo.outputPath("delete-confirmation-768.png") });
  297 |     const response = page.waitForResponse((candidate) => new URL(candidate.url()).pathname === `/api/admin/documents/${document.id}/delete`);
  298 |     await deleteForm.locator('button[type="submit"]').click();
  299 |     expect((await response).status()).toBe(200);
  300 |     expect(deleteRequests).toBe(1);
  301 |     await expect(page.getByRole("link", { name: document.fileName, exact: true })).toHaveCount(0);
  302 |     const deleted = await prisma.document.findUniqueOrThrow({ where: { id: document.id } });
  303 |     expect(deleted.deletedAt).not.toBeNull();
  304 |     expect(await fs.readFile(resolve(storageRoot, deleted.fileKey))).toEqual(pdf);
  305 |     expect((await page.request.get(`/api/files/${document.id}/download`)).status()).toBe(404);
  306 |   });
  307 | });
  308 |
```
