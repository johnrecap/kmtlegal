import { expect, it } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

it("upgrades historical assistant and inbox messages without changing their identity, content or timestamps", async () => {
  const db = await PGlite.create();
  const migration = "20261016010000_independent_assistant_office_recipients";
  try {
    const names = (await readdir("prisma/migrations", { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name).sort();
    for (const name of names.filter(name => name < migration)) await db.exec(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
    const session = randomUUID(), thread = randomUUID();
    await db.query('INSERT INTO conversation_threads(id,"updatedAt") VALUES ($1, NOW())', [thread]);
    await db.query('INSERT INTO assistant_sessions(id,"capabilityHash","conversationThreadId","expiresAt","updatedAt") VALUES ($1,$2,$3,NOW()+INTERVAL \'7 days\',NOW())', [session, randomUUID(), thread]);
    for (const status of ["HUMAN", "COMPLETED", "FAILED"]) {
      const id = randomUUID();
      await db.query('INSERT INTO assistant_turns(id,"sessionId","messageId","userText",status,"updatedAt") VALUES ($1,$2,$3,$4,$5,NOW())', [id, session, randomUUID(), `Original ${status}`, status]);
      const hex = createHash("sha256").update(`kmt-transcript:${id}:user`).digest("hex");
      const transcriptId = `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
      await db.query('INSERT INTO conversation_messages(id,"threadId","senderType",body) VALUES ($1,$2,\'CLIENT\',$3)', [transcriptId, thread, `Original ${status}`]);
    }
    const before = (await db.query('SELECT id,body,"createdAt" FROM conversation_messages ORDER BY body')).rows;
    await db.exec(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    expect((await db.query('SELECT id,body,"createdAt" FROM conversation_messages ORDER BY body')).rows).toEqual(before);
    expect((await db.query('SELECT status,recipient FROM assistant_turns ORDER BY status')).rows).toEqual([
      { status: "COMPLETED", recipient: "ASSISTANT" }, { status: "FAILED", recipient: "ASSISTANT" }, { status: "HUMAN", recipient: "OFFICE" }
    ]);
    expect((await db.query('SELECT body,recipient FROM conversation_messages ORDER BY body')).rows).toEqual([
      { body: "Original COMPLETED", recipient: "ASSISTANT" }, { body: "Original FAILED", recipient: "ASSISTANT" }, { body: "Original HUMAN", recipient: "OFFICE" }
    ]);
    await expect(db.query('UPDATE assistant_sessions SET "officePhone"=\'+201000000000\' WHERE id=$1', [session])).rejects.toThrow();
    await expect(db.query('UPDATE assistant_turns SET recipient=\'OTHER\' WHERE "sessionId"=$1', [session])).rejects.toThrow();
  } finally { await db.close(); }
}, 60_000);
