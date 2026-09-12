# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: batch9-documents.spec.ts >> Batch 9 isolated document acceptance >> requires keyboard confirmation, sends one delete, hides the row, and preserves bytes
- Location: tests\e2e\batch9-documents.spec.ts:230:7

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Error: locator.screenshot: Test timeout of 180000ms exceeded.
Call log:
  - taking element screenshot
  - waiting for fonts to load...
  - fonts loaded
  - attempting scroll into view action
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
    - waiting 20ms
    2 × waiting for element to be stable
      - element is not visible
    - retrying scroll into view action
      - waiting 100ms
    322 × waiting for element to be stable
        - element is not visible
      - retrying scroll into view action
        - waiting 500ms

```

# Test source

```ts
  147 |     const clientContext = await page.context().browser()!.newContext({ baseURL: origin });
  148 |     try {
  149 |       await loginRequest(clientContext.request, fixture.ownerUser.email);
  150 |       const foreign = await clientContext.request.post("/api/files/upload", { multipart: { file: { name: `${marker} foreign.pdf`, mimeType: "application/pdf", buffer: pdf }, caseId: fixture.otherCase.id, category: "OTHER", visibility: "CLIENT_VISIBLE" } });
  151 |       expect(foreign.status()).toBe(403);
  152 |     } finally { await clientContext.close(); }
  153 |     expect(await prisma.document.count({ where: { fileName: { startsWith: marker } } })).toBe(beforeRows);
  154 |     expect(await fileCount()).toBe(beforeFiles);
  155 |   });
  156 |
  157 |   test("enforces independent office, lawyer, client, and guest document scopes", async ({ browser }) => {
  158 |     const visible = await createDocument({ name: "case-visible", caseId: fixture.targetCase.id, visibility: "CLIENT_VISIBLE" });
  159 |     const staff = await createDocument({ name: "case-staff", ownerClientId: fixture.owner.id, caseId: fixture.targetCase.id, visibility: "STAFF_ONLY" });
  160 |     const other = await createDocument({ name: "other-visible", caseId: fixture.otherCase.id, visibility: "CLIENT_VISIBLE" });
  161 |     const sessions: Array<{ name: string; email?: string; list: number; visible: number; staff: number; mutate: number }> = [
  162 |       { name: "office", email: fixture.office.email, list: 200, visible: 200, staff: 200, mutate: 200 },
  163 |       { name: "assigned lawyer", email: fixture.lawyer.email, list: 200, visible: 200, staff: 200, mutate: 403 },
  164 |       { name: "other lawyer", email: fixture.otherLawyer.email, list: 200, visible: 403, staff: 403, mutate: 403 },
  165 |       { name: "owner client", email: fixture.ownerUser.email, list: 403, visible: 200, staff: 403, mutate: 403 },
  166 |       { name: "other client", email: fixture.otherUser.email, list: 403, visible: 403, staff: 403, mutate: 403 },
  167 |       { name: "guest", list: 401, visible: 401, staff: 401, mutate: 401 }
  168 |     ];
  169 |     const contexts: BrowserContext[] = [];
  170 |     try {
  171 |       for (const expected of sessions) {
  172 |         const context = await contextFor(browser, expected.email); contexts.push(context);
  173 |         const list = await context.request.get("/api/admin/documents?pageSize=80");
  174 |         expect(list.status(), `${expected.name} list`).toBe(expected.list);
  175 |         if (expected.list === 200) {
  176 |           const ids = ((await list.json()).data.items as Array<{ id: string }>).map((item) => item.id);
  177 |           expect(ids.includes(visible.id), `${expected.name} target scope`).toBe(expected.name !== "other lawyer");
  178 |           expect(ids.includes(other.id), `${expected.name} other scope`).toBe(expected.name !== "assigned lawyer");
  179 |         }
  180 |         expect((await context.request.get(`/api/files/${visible.id}/download`)).status(), `${expected.name} visible download`).toBe(expected.visible);
  181 |         expect((await context.request.get(`/api/files/${staff.id}/download`)).status(), `${expected.name} staff download`).toBe(expected.staff);
  182 |         if (expected.name !== "office") {
  183 |           expect((await context.request.patch(`/api/admin/documents/${visible.id}`, { data: { status: "ACCEPTED", category: "OTHER", visibility: "CLIENT_VISIBLE" } })).status(), `${expected.name} patch`).toBe(expected.mutate);
  184 |           expect((await context.request.post(`/api/admin/documents/${visible.id}/delete`, { data: { confirmDelete: true } })).status(), `${expected.name} delete`).toBe(expected.mutate);
  185 |         }
  186 |       }
  187 |       expect((await prisma.document.findUniqueOrThrow({ where: { id: visible.id } })).deletedAt).toBeNull();
  188 |       await prisma.legalCase.update({ where: { id: fixture.targetCase.id }, data: { deletedAt: new Date() } });
  189 |       try {
  190 |         const ownerPage = await contexts[3].newPage(); await ownerPage.goto("/client/files", { waitUntil: "domcontentloaded" });
  191 |         await expect(ownerPage.getByRole("link", { name: visible.fileName, exact: true }).first()).toBeVisible();
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
  204 |     expect((await page.request.patch(`/api/admin/documents/${first.id}`, { data: valid })).status()).toBe(200);
  205 |     expect((await page.request.post(`/api/admin/documents/${first.id}/delete`, { data: { confirmDelete: true } })).status()).toBe(200);
  206 |     expect(await prisma.auditLog.count({ where: { documentId: first.id, action: "document.update" } })).toBe(1);
  207 |     expect(await prisma.auditLog.count({ where: { documentId: first.id, action: "document.delete" } })).toBe(1);
  208 |     expect((await prisma.document.findUniqueOrThrow({ where: { id: first.id } })).deletedAt).not.toBeNull();
  209 |     const second = await createDocument({ name: "delete-first", caseId: fixture.targetCase.id, visibility: "CLIENT_VISIBLE" });
  210 |     let locked!: () => void; let release!: () => void;
  211 |     const lockedPromise = new Promise<void>((done) => { locked = done; });
  212 |     const releasePromise = new Promise<void>((done) => { release = done; });
  213 |     const blocker = prisma.$transaction(async (tx) => { await tx.$queryRaw`SELECT id FROM documents WHERE id = ${second.id}::uuid FOR UPDATE`; locked(); await releasePromise; }, { timeout: 30_000 });
  214 |     await lockedPromise;
  215 |     const deleteRequest = page.request.post(`/api/admin/documents/${second.id}/delete`, { data: { confirmDelete: true } });
  216 |     await waitForBlockedDocumentWrites(1);
  217 |     const updateRequest = page.request.patch(`/api/admin/documents/${second.id}`, { data: valid });
  218 |     await waitForBlockedDocumentWrites(2);
  219 |     release(); await blocker;
  220 |     expect((await deleteRequest).status()).toBe(200);
  221 |     expect((await updateRequest).status()).toBe(404);
  222 |     expect(await prisma.auditLog.count({ where: { documentId: second.id, action: "document.update" } })).toBe(0);
  223 |     expect(await prisma.auditLog.count({ where: { documentId: second.id, action: "document.delete" } })).toBe(1);
  224 |     const third = await createDocument({ name: "double-delete", caseId: fixture.targetCase.id, visibility: "CLIENT_VISIBLE" });
  225 |     const deletes = await Promise.all([1, 2].map(() => page.request.post(`/api/admin/documents/${third.id}/delete`, { data: { confirmDelete: true } })));
  226 |     expect(deletes.map((response) => response.status()).sort()).toEqual([200, 404]);
  227 |     expect(await prisma.auditLog.count({ where: { documentId: third.id, action: "document.delete" } })).toBe(1);
  228 |   });
  229 |
  230 |   test("requires keyboard confirmation, sends one delete, hides the row, and preserves bytes", async ({ page }, testInfo) => {
  231 |     const document = await createDocument({ name: "ui-delete", caseId: fixture.targetCase.id, visibility: "CLIENT_VISIBLE" });
  232 |     let deleteRequests = 0;
  233 |     page.on("request", (request) => { if (request.method() === "POST" && new URL(request.url()).pathname === `/api/admin/documents/${document.id}/delete`) deleteRequests += 1; });
  234 |     await loginPage(page, fixture.office.email, `/admin/documents?q=${encodeURIComponent(document.fileName)}`);
  235 |     await page.setViewportSize({ width: 390, height: 844 });
  236 |     const card = page.locator("details").filter({ hasText: document.fileName }).first();
  237 |     await card.locator("summary").click();
  238 |     const deleteForm = card.locator('form').filter({ has: page.locator('input[name="confirmDelete"]') });
  239 |     const checkbox = deleteForm.locator('input[name="confirmDelete"]');
  240 |     await deleteForm.locator('button[type="submit"]').click();
  241 |     await expect(checkbox).toBeFocused();
  242 |     expect(deleteRequests).toBe(0);
  243 |     expect((await prisma.document.findUniqueOrThrow({ where: { id: document.id } })).deletedAt).toBeNull();
  244 |     await checkbox.press("Space"); await expect(checkbox).toBeChecked();
  245 |     await deleteForm.screenshot({ path: testInfo.outputPath("delete-confirmation-390.png") });
  246 |     await page.setViewportSize({ width: 768, height: 1024 });
> 247 |     await deleteForm.screenshot({ path: testInfo.outputPath("delete-confirmation-768.png") });
      |                      ^ Error: locator.screenshot: Test timeout of 180000ms exceeded.
  248 |     const response = page.waitForResponse((candidate) => new URL(candidate.url()).pathname === `/api/admin/documents/${document.id}/delete`);
  249 |     await deleteForm.locator('button[type="submit"]').click();
  250 |     expect((await response).status()).toBe(200);
  251 |     expect(deleteRequests).toBe(1);
  252 |     await expect(page.getByRole("link", { name: document.fileName, exact: true })).toHaveCount(0);
  253 |     const deleted = await prisma.document.findUniqueOrThrow({ where: { id: document.id } });
  254 |     expect(deleted.deletedAt).not.toBeNull();
  255 |     expect(await fs.readFile(resolve(storageRoot, deleted.fileKey))).toEqual(pdf);
  256 |     expect((await page.request.get(`/api/files/${document.id}/download`)).status()).toBe(404);
  257 |   });
  258 | });
  259 |
```
