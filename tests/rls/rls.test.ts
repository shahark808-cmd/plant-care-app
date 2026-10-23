import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import fs from "node:fs";
import path from "node:path";

const url = process.env.TEST_DATABASE_URL;
const describeDb = url ? describe : describe.skip;

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const C = "33333333-3333-3333-3333-333333333333"; // לא חבר/ה במשק הבית

let admin: Client;
let household: string;

/** מריץ שאילתות בהקשר של משתמש authenticated (כמו PostgREST). */
async function asUser<T>(uid: string, fn: (c: Client) => Promise<T>): Promise<T> {
  await admin.query("begin");
  try {
    await admin.query("set local role authenticated");
    await admin.query("select set_config('request.jwt.claim.sub', $1, true)", [uid]);
    return await fn(admin);
  } finally {
    await admin.query("rollback");
  }
}

/** כמו asUser אבל עם commit, לצורך הכנת נתונים דרך המסלול האמיתי (RPC / RLS). */
async function asUserCommit<T>(uid: string, fn: (c: Client) => Promise<T>): Promise<T> {
  await admin.query("begin");
  try {
    await admin.query("set local role authenticated");
    await admin.query("select set_config('request.jwt.claim.sub', $1, true)", [uid]);
    const result = await fn(admin);
    await admin.query("commit");
    return result;
  } catch (e) {
    await admin.query("rollback");
    throw e;
  }
}

beforeAll(async () => {
  if (!url) return;
  admin = new Client({ connectionString: url });
  await admin.connect();
  await admin.query(fs.readFileSync(path.join(__dirname, "shim.sql"), "utf8"));
  const dir = path.join(__dirname, "../../supabase/migrations");
  for (const file of fs.readdirSync(dir).sort()) {
    await admin.query(fs.readFileSync(path.join(dir, file), "utf8"));
  }
  for (const [id, email] of [[A, "a@x.com"], [B, "b@x.com"], [C, "c@x.com"]]) {
    await admin.query("insert into auth.users (id, email) values ($1, $2)", [id, email]);
  }

  household = (await asUserCommit(A, (c) => c.query("select public.create_household('בית') as id"))).rows[0].id;
  const code = (await admin.query("select invite_code from public.households where id = $1", [household])).rows[0].invite_code;
  await asUserCommit(B, (c) => c.query("select public.join_household($1)", [code]));

  const [cat] = (await admin.query("select id from public.categories where household_id = $1 limit 1", [household])).rows;
  await asUserCommit(A, (c) =>
    c.query(
      `insert into public.transactions (household_id, amount, type, category_id, visibility, note) values
       ($1, 10000, 'expense', $2, 'private', 'A-private'),
       ($1, 20000, 'expense', $2, 'shared', 'A-shared')`,
      [household, cat.id],
    ),
  );
  await asUserCommit(B, (c) =>
    c.query(
      `insert into public.transactions (household_id, amount, type, category_id, visibility, note) values
       ($1, 30000, 'expense', $2, 'private', 'B-private')`,
      [household, cat.id],
    ),
  );
});

afterAll(async () => {
  await admin?.end();
});

describeDb("RLS: transactions privacy", () => {
  it("owner sees own private and shared rows", async () => {
    const rows = await asUser(A, (c) => c.query("select note from public.transactions order by note"));
    expect(rows.rows.map((r) => r.note)).toEqual(["A-private", "A-shared"]);
  });

  it("partner sees only the shared row of the other user, never the private one", async () => {
    const rows = await asUser(B, (c) => c.query("select note from public.transactions order by note"));
    expect(rows.rows.map((r) => r.note)).toEqual(["A-shared", "B-private"]);
  });

  it("partner cannot read private data via aggregates or counts", async () => {
    const r = await asUser(B, (c) =>
      c.query("select count(*)::int as n, coalesce(sum(amount),0)::bigint as s from public.transactions where owner_id = $1", [A]),
    );
    expect(r.rows[0].n).toBe(1); // רק ה-shared
    expect(Number(r.rows[0].s)).toBe(20000); // לא 30000
  });

  it("partner cannot fetch a private row directly by id", async () => {
    const [{ id }] = (await admin.query("select id from public.transactions where note = 'A-private'")).rows;
    const r = await asUser(B, (c) => c.query("select * from public.transactions where id = $1", [id]));
    expect(r.rowCount).toBe(0);
  });

  it("outsider sees nothing", async () => {
    const r = await asUser(C, (c) => c.query("select * from public.transactions"));
    expect(r.rowCount).toBe(0);
  });

  it("partner cannot update or delete the other user's shared row", async () => {
    const upd = await asUser(B, (c) => c.query("update public.transactions set amount = 1 where note = 'A-shared'"));
    expect(upd.rowCount).toBe(0);
    const del = await asUser(B, (c) => c.query("delete from public.transactions where note = 'A-shared'"));
    expect(del.rowCount).toBe(0);
  });

  it("user cannot insert a row owned by someone else", async () => {
    await expect(
      asUser(B, (c) =>
        c.query("insert into public.transactions (household_id, owner_id, amount, type) values ($1, $2, 100, 'expense')", [household, A]),
      ),
    ).rejects.toThrow();
  });

  it("user cannot insert into a household they do not belong to", async () => {
    await expect(
      asUser(C, (c) => c.query("insert into public.transactions (household_id, amount, type) values ($1, 100, 'expense')", [household])),
    ).rejects.toThrow();
  });

  it("user cannot flip a private row to someone else's ownership", async () => {
    await expect(asUser(A, (c) => c.query("update public.transactions set owner_id = $1 where note = 'A-private'", [B]))).rejects.toThrow();
  });

  it("anon role has no access", async () => {
    await admin.query("begin");
    try {
      await admin.query("set local role anon");
      await expect(admin.query("select * from public.transactions")).rejects.toThrow();
    } finally {
      await admin.query("rollback");
    }
  });
});

describeDb("RLS: other tables and RPCs", () => {
  it("private accounts are invisible to the partner", async () => {
    await asUserCommit(A, (c) => c.query("insert into public.accounts (household_id, name, kind) values ($1, 'A-bank', 'bank')", [household]));
    const r = await asUser(B, (c) => c.query("select * from public.accounts"));
    expect(r.rowCount).toBe(0);
  });

  it("private budgets/goals are invisible to the partner, shared ones are visible", async () => {
    await asUserCommit(A, (c) =>
      c.query(
        `insert into public.goals (household_id, visibility, name, target_amount) values
         ($1, 'private', 'secret', 100), ($1, 'shared', 'vacation', 100)`,
        [household],
      ),
    );
    const r = await asUser(B, (c) => c.query("select name from public.goals"));
    expect(r.rows.map((x) => x.name)).toEqual(["vacation"]);
  });

  it("household rows and member list are invisible to outsiders", async () => {
    expect((await asUser(C, (c) => c.query("select * from public.households"))).rowCount).toBe(0);
    expect((await asUser(C, (c) => c.query("select * from public.household_members"))).rowCount).toBe(0);
    expect((await asUser(C, (c) => c.query("select * from public.categories"))).rowCount).toBe(0);
  });

  it("outsider cannot read partner profiles, but members can", async () => {
    expect((await asUser(C, (c) => c.query("select * from public.profiles where id = $1", [A]))).rowCount).toBe(0);
    expect((await asUser(B, (c) => c.query("select * from public.profiles where id = $1", [A]))).rowCount).toBe(1);
  });

  it("helper RPCs only report membership for the caller, no data leak", async () => {
    const r = await asUser(C, (c) => c.query("select public.is_household_member($1) as m", [household]));
    expect(r.rows[0].m).toBe(false);
  });

  it("household is capped at two members", async () => {
    const code = (await admin.query("select invite_code from public.households where id = $1", [household])).rows[0].invite_code;
    await expect(asUser(C, (c) => c.query("select public.join_household($1)", [code]))).rejects.toThrow(/full/);
  });

  it("settlements are only visible to members", async () => {
    await asUserCommit(A, (c) => c.query("insert into public.settlements (household_id, paid_by, paid_to, amount) values ($1, $2, $3, 500)", [household, A, B]));
    expect((await asUser(B, (c) => c.query("select * from public.settlements"))).rowCount).toBe(1);
    expect((await asUser(C, (c) => c.query("select * from public.settlements"))).rowCount).toBe(0);
  });
});

describeDb("Stage 2: recurring rules, buckets, budgets", () => {
  it("new households get categories with 50/30/20 buckets including savings", async () => {
    const r = await admin.query("select distinct bucket from public.categories where household_id = $1 and bucket is not null order by bucket", [household]);
    expect(r.rows.map((x) => x.bucket)).toEqual(["needs", "savings", "wants"]);
  });

  it("materialize_recurring creates due transactions once, under the owner's RLS", async () => {
    const [cat] = (await admin.query("select id from public.categories where household_id = $1 and kind = 'expense' limit 1", [household])).rows;
    await asUserCommit(A, (c) =>
      c.query(
        `insert into public.recurring_rules (household_id, visibility, category_id, amount, type, day_of_month, note, is_subscription)
         values ($1, 'private', $2, 4500, 'expense', 1, 'rent-test', true)`,
        [household, cat.id],
      ),
    );
    // כלל שנוצר "אתמול" כדי שהיום הראשון של החודש יחשב כבר שהגיע
    await admin.query("update public.recurring_rules set created_at = now() - interval '70 days' where note = 'rent-test'");
    const first = await asUserCommit(A, (c) => c.query("select public.materialize_recurring(current_date) as n"));
    expect(first.rows[0].n).toBeGreaterThanOrEqual(2);
    const again = await asUserCommit(A, (c) => c.query("select public.materialize_recurring(current_date) as n"));
    expect(again.rows[0].n).toBe(0);
    const rows = await admin.query("select source, owner_id, visibility from public.transactions where note = 'rent-test'");
    expect(rows.rowCount).toBeGreaterThanOrEqual(2);
    expect(rows.rows.every((r) => r.source === "recurring" && r.owner_id === A && r.visibility === "private")).toBe(true);
  });

  it("partner cannot see private recurring-generated rows or rules", async () => {
    const tx = await asUser(B, (c) => c.query("select * from public.transactions where note = 'rent-test'"));
    expect(tx.rowCount).toBe(0);
    const rules = await asUser(B, (c) => c.query("select * from public.recurring_rules"));
    expect(rules.rowCount).toBe(0);
  });

  it("materialize_recurring only touches the caller's own rules", async () => {
    const before = (await admin.query("select count(*)::int as n from public.transactions where source = 'recurring'")).rows[0].n;
    await asUserCommit(B, (c) => c.query("select public.materialize_recurring(current_date)"));
    const after = (await admin.query("select count(*)::int as n from public.transactions where source = 'recurring'")).rows[0].n;
    expect(after).toBe(before);
  });

  it("anon cannot call materialize_recurring", async () => {
    await admin.query("begin");
    try {
      await admin.query("set local role anon");
      await expect(admin.query("select public.materialize_recurring(current_date)")).rejects.toThrow();
    } finally {
      await admin.query("rollback");
    }
  });

  it("budgets: one row per owner/category/period/visibility, private to the owner", async () => {
    const [cat] = (await admin.query("select id from public.categories where household_id = $1 and kind = 'expense' limit 1", [household])).rows;
    await asUserCommit(A, (c) => c.query("insert into public.budgets (household_id, category_id, period_start, amount) values ($1, $2, '2026-03-10', 100000)", [household, cat.id]));
    await expect(
      asUserCommit(A, (c) => c.query("insert into public.budgets (household_id, category_id, period_start, amount) values ($1, $2, '2026-03-10', 5)", [household, cat.id])),
    ).rejects.toThrow();
    expect((await asUser(B, (c) => c.query("select * from public.budgets"))).rowCount).toBe(0);
  });
});
