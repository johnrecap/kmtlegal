import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

it("backfills paid invoices once and quarantines zero amounts and duplicate legacy receipts", async () => {
  const db = await PGlite.create();
  try {
    const names = (await readdir("prisma/migrations", { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name).sort();
    for (const name of names.filter(name => name < "20261009200000_payment_entries")) await db.exec(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
    const client = "55555555-5555-4555-8555-555555555555";
    await db.query('INSERT INTO clients (id, "fullName", phone, "updatedAt") VALUES ($1, $2, $3, NOW())', [client, "Synthetic legacy", "01000000000"]);
    for (const [id, status, amount] of [["11111111-1111-4111-8111-111111111111", "PAID", "100.25"], ["22222222-2222-4222-8222-222222222222", "PAID", "0"], ["33333333-3333-4333-8333-333333333333", "ISSUED", "250"]]) {
      await db.query('INSERT INTO payments (id, "invoiceNumber", "clientId", "issueDate", amount, currency, status, "updatedAt") VALUES ($1, $2, $3, NOW(), $4, \'EGP\', $5, NOW())', [id, `SYNTHETIC-${id}`, client, amount, status]);
    }
    // Deliberately model a legacy import with a missing receipt index; no real database is touched.
    await db.exec('DROP INDEX payments_manual_paid_receipt_number_unique_idx');
    for (const id of ["44444444-4444-4444-8444-444444444444", "66666666-6666-4666-8666-666666666666"]) await db.query('INSERT INTO payments (id, "invoiceNumber", "clientId", "issueDate", amount, currency, status, "receiptNumber", "paymentMethod", "updatedAt") VALUES ($1, $2, $3, NOW(), 200, \'EGP\', \'PAID\', \'DUPLICATE-SYNTHETIC\', \'CASH\', NOW())', [id, `SYNTHETIC-${id}`, client]);
    await db.exec(await readFile("prisma/migrations/20261009200000_payment_entries/migration.sql", "utf8"));
    const entries = await db.query<{ amount: string; kind: string }>('SELECT amount::text, kind FROM payment_entries');
    expect(entries.rows).toEqual([{ amount: "100.25", kind: "LEGACY" }]);
    const review = await db.query<{ id: string }>('SELECT id FROM payments WHERE "ledgerReviewRequired" = true');
    expect(review.rows).toHaveLength(3);
    expect(review.rows).toContainEqual({ id: "22222222-2222-4222-8222-222222222222" });
    await expect(db.exec('DELETE FROM payment_entries')).rejects.toThrow("append-only");
  } finally { await db.close(); }
}, 60_000);
