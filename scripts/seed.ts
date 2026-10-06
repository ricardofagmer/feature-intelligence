/**
 * Demo fixture data for local development only (`npm run seed`). Wipes every
 * table and inserts a realistic, already-triaged corpus so the board, themes,
 * review queue and retriage flow all have something to show without an API key.
 * Never point this at a database holding real data.
 */
import { getDb } from "../src/lib/db";

type SeedStatus = "triaged" | "merged" | "planned" | "declined" | "pending_triage";

interface SeedTheme {
  key: string;
  name: string;
  summary: string;
  status: "confirmed" | "proposed";
}

interface SeedRequest {
  key: string;
  title: string;
  description: string;
  requester: string;
  status: SeedStatus;
  daysAgo: number;
  votes: number;
  theme?: string;
  mergedInto?: string;
  triage?: {
    problemStatement: string;
    persona: string;
    productArea: string;
    priorityScore: number;
    priorityRationale: string;
  };
}

const THEMES: SeedTheme[] = [
  { key: "reporting", name: "Reporting & analytics gaps", status: "confirmed", summary: "Customers cannot get data out of the product in the shape and cadence their stakeholders need, so they rebuild reports in spreadsheets." },
  { key: "onboarding", name: "Onboarding friction", status: "confirmed", summary: "New teams stall in the first week: empty workspaces, manual imports and one-by-one invites delay time-to-value." },
  { key: "permissions", name: "Permissions & access control", status: "confirmed", summary: "Admins at larger customers need granular roles, SSO and auditability before they can roll the product out company-wide." },
  { key: "integrations", name: "Integrations", status: "confirmed", summary: "Work happens in Slack, Salesforce and internal tools; without first-class integrations the product becomes another silo." },
  { key: "mobile", name: "Mobile experience", status: "proposed", summary: "Field and on-call users need to read and update work from their phones, including with poor connectivity." },
];

const REQUESTS: SeedRequest[] = [
  {
    key: "pdfExport", title: "Scheduled PDF export of dashboards", requester: "Dana Kim (Northwind)", status: "triaged", daysAgo: 41, votes: 12, theme: "reporting",
    description: "Every Monday I screenshot five dashboards and paste them into a slide for our leadership sync. I want to schedule a PDF export of a dashboard and have it emailed to a list of people automatically.",
    triage: { problemStatement: "Managers cannot share dashboard insights with stakeholders who never log in, so they rebuild reports manually every week.", persona: "Team lead / manager", productArea: "Reporting", priorityScore: 84, priorityRationale: "High demand (12 supporters plus a merged duplicate), directly serves the mid-market reporting goal, moderate effort reusing the existing render pipeline." },
  },
  {
    key: "weeklyEmail", title: "Email a weekly report to stakeholders automatically", requester: "Luis Ortega (Contoso)", status: "merged", daysAgo: 30, votes: 5, theme: "reporting", mergedInto: "pdfExport",
    description: "Our execs do not have accounts. It would save me an hour a week if the product could email them a summary report every Friday.",
    triage: { problemStatement: "Stakeholders without accounts need periodic report delivery without a manual export step.", persona: "Team lead / manager", productArea: "Reporting", priorityScore: 80, priorityRationale: "Same underlying need as scheduled dashboard exports; consolidated into that request." },
  },
  {
    key: "dateRanges", title: "Custom date ranges on analytics charts", requester: "Priya Natarajan (Globex)", status: "triaged", daysAgo: 37, votes: 9, theme: "reporting",
    description: "Charts only offer last 7/30/90 days. Our fiscal quarters do not line up with that, so I export to CSV and redo the chart in Excel.",
    triage: { problemStatement: "Analysts cannot align charts with their own fiscal periods, forcing exports to spreadsheets for basic reporting.", persona: "Operations analyst", productArea: "Reporting", priorityScore: 72, priorityRationale: "Solid demand, low effort (query layer already supports arbitrary ranges), supports the reporting goal." },
  },
  {
    key: "csvExport", title: "Export raw data to CSV from any report", requester: "Tom Becker (Initech)", status: "triaged", daysAgo: 22, votes: 6, theme: "reporting",
    description: "Finance wants the underlying rows, not the chart. A CSV download button on every report would unblock them.",
    triage: { problemStatement: "Finance teams need row-level data from reports to reconcile against their own systems.", persona: "Finance / operations analyst", productArea: "Reporting", priorityScore: 66, priorityRationale: "Moderate demand, low effort, partially overlaps with scheduled exports." },
  },
  {
    key: "checklist", title: "Guided setup checklist for new workspaces", requester: "Sofia Rossi (Acme)", status: "triaged", daysAgo: 35, votes: 14, theme: "onboarding",
    description: "When we signed up we did not know what to configure first. A checklist with the five things to set up would have saved us a week and two support tickets.",
    triage: { problemStatement: "New self-serve teams do not know which setup steps unlock value, so they stall or open support tickets in week one.", persona: "Workspace admin (new customer)", productArea: "Onboarding", priorityScore: 88, priorityRationale: "Top demand, directly serves self-serve adoption and support-load goals, low-to-moderate effort." },
  },
  {
    key: "trelloImport", title: "Import existing projects from Trello and Asana", requester: "Ken Watanabe (Umbrella)", status: "triaged", daysAgo: 28, votes: 10, theme: "onboarding",
    description: "We have three years of boards in Trello. Re-creating them by hand is the main reason our team has not switched yet.",
    triage: { problemStatement: "Teams with history in another tool cannot switch without losing or manually re-entering their existing work.", persona: "Workspace admin (evaluating)", productArea: "Onboarding", priorityScore: 79, priorityRationale: "Strong demand and a direct conversion blocker for self-serve; higher effort due to per-source mapping." },
  },
  {
    key: "bulkInvite", title: "Invite teammates in bulk via CSV", requester: "Amara Okafor (Stark Retail)", status: "triaged", daysAgo: 19, votes: 4, theme: "onboarding",
    description: "Inviting 60 people one email at a time is painful. Let me upload a CSV with names, emails and roles.",
    triage: { problemStatement: "Admins rolling out to a whole department waste time inviting users one by one.", persona: "Workspace admin", productArea: "Onboarding", priorityScore: 61, priorityRationale: "Moderate demand, low effort, helps larger self-serve rollouts." },
  },
  {
    key: "sampleData", title: "Sample data in new accounts so the product is not empty", requester: "Jonas Berg (Wayne Labs)", status: "triaged", daysAgo: 15, votes: 3, theme: "onboarding",
    description: "The first screen after signup is completely empty. Some example projects would help people understand what the product does.",
    triage: { problemStatement: "Evaluators cannot picture the product's value from an empty workspace.", persona: "Trial user", productArea: "Onboarding", priorityScore: 54, priorityRationale: "Low demand so far but cheap and aligned with self-serve adoption." },
  },
  {
    key: "rbac", title: "Role-based permissions per project", requester: "Rachel Green (Hooli)", status: "triaged", daysAgo: 44, votes: 13, theme: "permissions",
    description: "Contractors should only see the two projects they work on. Today everyone in the workspace sees everything, which blocks our security review.",
    triage: { problemStatement: "Organizations cannot restrict project visibility per user, which fails security reviews and blocks wider rollout.", persona: "IT / security admin", productArea: "Permissions", priorityScore: 92, priorityRationale: "Highest demand including a merged duplicate, named blocker in mid-market deals, high strategic fit despite moderate-high effort." },
  },
  {
    key: "customRoles", title: "Custom roles with granular permissions", requester: "Omar Haddad (Vandelay)", status: "merged", daysAgo: 26, votes: 6, theme: "permissions", mergedInto: "rbac",
    description: "We need to define our own roles, for example a reviewer who can comment but not edit, and assign them per project.",
    triage: { problemStatement: "Admins need to scope what each user can do per project beyond the built-in roles.", persona: "IT / security admin", productArea: "Permissions", priorityScore: 88, priorityRationale: "Same underlying need as per-project role-based permissions; consolidated." },
  },
  {
    key: "sso", title: "SAML SSO with Okta", requester: "Elena Petrova (Massive Dynamic)", status: "planned", daysAgo: 50, votes: 11, theme: "permissions",
    description: "Our IT policy requires SSO for every SaaS tool. Without Okta SAML we cannot buy more than the current 20 seats.",
    triage: { problemStatement: "Companies with SSO mandates cannot expand usage because identity is not centrally managed.", persona: "IT / security admin", productArea: "Permissions", priorityScore: 81, priorityRationale: "Hard procurement blocker for mid-market expansion; well-understood effort." },
  },
  {
    key: "auditLog", title: "Audit log of permission changes", requester: "Marcus Lee (Cyberdyne)", status: "triaged", daysAgo: 18, votes: 5, theme: "permissions",
    description: "Compliance asks who granted access to what and when. We need an exportable log of every permission change.",
    triage: { problemStatement: "Compliance teams cannot prove who changed access and when, which fails audits.", persona: "Compliance officer", productArea: "Permissions", priorityScore: 58, priorityRationale: "Moderate demand, required for regulated mid-market buyers, moderate effort." },
  },
  {
    key: "settingsHistory", title: "Let admins see who changed what in workspace settings", requester: "Hannah Schulz (Soylent)", status: "triaged", daysAgo: 6, votes: 2, theme: "permissions",
    description: "Someone turned off two-factor enforcement last month and nobody knows who. A history of settings changes would help.",
    triage: { problemStatement: "Admins cannot trace configuration changes back to the person who made them.", persona: "Workspace admin", productArea: "Permissions", priorityScore: 52, priorityRationale: "Low demand alone; overlaps heavily with the audit log request." },
  },
  {
    key: "slack", title: "Two-way Slack integration for notifications", requester: "Chris Morgan (Pied Piper)", status: "triaged", daysAgo: 33, votes: 10, theme: "integrations",
    description: "I want updates posted to a Slack channel and to be able to change status from Slack without opening the app.",
    triage: { problemStatement: "Teams living in Slack miss updates and context-switch to act on them.", persona: "Individual contributor", productArea: "Integrations", priorityScore: 74, priorityRationale: "High demand, reduces 'did you see my update' support pings, moderate effort." },
  },
  {
    key: "salesforce", title: "Native Salesforce sync for account data", requester: "Grace Park (Initrode)", status: "triaged", daysAgo: 24, votes: 7, theme: "integrations",
    description: "Our account managers want to see which customer requested which work, pulled from Salesforce accounts.",
    triage: { problemStatement: "Customer-facing teams cannot connect delivery work to the accounts that asked for it.", persona: "Account manager", productArea: "Integrations", priorityScore: 69, priorityRationale: "Valued by mid-market sales-led customers; high effort." },
  },
  {
    key: "webhooks", title: "Webhooks when an item changes status", requester: "Ivan Novak (Tyrell)", status: "triaged", daysAgo: 12, votes: 4, theme: "integrations",
    description: "We run internal automations. A webhook on status changes would let us connect our deployment tooling.",
    triage: { problemStatement: "Engineering teams cannot trigger their own automations from product events.", persona: "Developer / platform engineer", productArea: "Integrations / API", priorityScore: 63, priorityRationale: "Moderate demand, unlocks many integrations at once, low-moderate effort." },
  },
  {
    key: "zapier", title: "Zapier integration", requester: "Mia Johnson (Gringotts)", status: "declined", daysAgo: 47, votes: 1, theme: "integrations",
    description: "A Zapier app would let us connect to tools you do not support natively.",
    triage: { problemStatement: "Non-technical users want no-code automation with long-tail tools.", persona: "Operations generalist", productArea: "Integrations", priorityScore: 35, priorityRationale: "Low demand; webhooks cover the same need with less maintenance. Declined in favor of webhooks." },
  },
  {
    key: "offline", title: "Offline mode for the mobile app", requester: "Diego Alvarez (Oceanic)", status: "triaged", daysAgo: 4, votes: 3, theme: "mobile",
    description: "Our field technicians lose signal on site. They need to read and update tasks offline and sync later.",
    triage: { problemStatement: "Field workers cannot record work where connectivity is poor, so updates are lost or delayed.", persona: "Field technician", productArea: "Mobile", priorityScore: 47, priorityRationale: "Emerging demand from a new segment; high effort; weak fit with current goals." },
  },
  {
    key: "darkMode", title: "Dark mode for the web app", requester: "anonymous", status: "pending_triage", daysAgo: 1, votes: 0,
    description: "Working late with a bright white UI is rough on the eyes. Please add a dark theme that follows the OS setting.",
  },
];

const VOTERS = [
  "ana.silva@northwind.example", "ben.cho@contoso.example", "carla.diaz@globex.example",
  "dev.patel@initech.example", "eva.muller@acme.example", "farid.khan@umbrella.example",
  "gina.rossi@hooli.example", "hugo.martin@vandelay.example", "isla.brown@stark.example",
  "jack.wu@wayne.example", "kira.ivanova@cyberdyne.example", "leo.santos@soylent.example",
  "maya.cohen@piedpiper.example", "nils.berg@initrode.example", "olga.smirnova@tyrell.example",
  "paul.adams@gringotts.example", "quinn.lee@oceanic.example",
];

// Supporters who only backed a duplicate, so merging visibly adds demand to the canonical.
const DUPLICATE_ONLY_VOTERS = [
  "rosa.vega@contoso.example", "sam.taylor@vandelay.example", "tara.nolan@contoso.example",
  "umar.aziz@vandelay.example", "vera.lind@contoso.example", "will.chen@vandelay.example",
];

// Pairs of [request, related request] the AI linked as related (not duplicates).
const RELATED_LINKS: Array<[string, string, number]> = [
  ["csvExport", "pdfExport", 0.71],
  ["sampleData", "checklist", 0.68],
];

const MERGE_CONFIDENCE: Record<string, number> = { weeklyEmail: 0.91, customRoles: 0.93 };

function isoDaysAgo(daysAgo: number, offsetSeconds = 0): string {
  const millis = Date.now() - daysAgo * 86_400_000 + offsetSeconds * 1000;
  return new Date(millis).toISOString().replace(/\.\d{3}Z$/, "Z");
}

function seed(): void {
  const db = getDb();
  const themeIds = new Map<string, number>();
  const requestIds = new Map<string, number>();
  const idOf = (key: string): number => {
    const id = requestIds.get(key);
    if (id === undefined) throw new Error(`Seed references unknown request "${key}"`);
    return id;
  };
  let voteCount = 0;

  db.transaction(() => {
    db.prepare("DELETE FROM review_items").run();
    db.prepare("DELETE FROM briefs").run();
    db.prepare("DELETE FROM votes").run();
    db.prepare("DELETE FROM request_links").run();
    db.prepare("DELETE FROM ai_calls").run();
    db.prepare("UPDATE requests SET canonical_request_id = NULL").run();
    db.prepare("DELETE FROM requests").run();
    db.prepare("DELETE FROM themes").run();
    db.prepare("DELETE FROM sqlite_sequence").run();

    const insertTheme = db.prepare<[string, string, string, string]>(
      "INSERT INTO themes (name, summary, status, created_at) VALUES (?, ?, ?, ?)",
    );
    for (const [index, theme] of THEMES.entries()) {
      const createdAt = isoDaysAgo(theme.status === "proposed" ? 4 : 60 - index);
      themeIds.set(theme.key, Number(insertTheme.run(theme.name, theme.summary, theme.status, createdAt).lastInsertRowid));
    }

    const insertRequest = db.prepare<
      [string, string, string, string, string | null, string | null, string | null, number | null, string | null, number | null, string, string | null]
    >(
      `INSERT INTO requests (title, description, requester, status, problem_statement, persona, product_area,
         priority_score, priority_rationale, theme_id, created_at, triaged_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const request of REQUESTS) {
      const themeId = request.theme ? (themeIds.get(request.theme) ?? null) : null;
      const result = insertRequest.run(
        request.title,
        request.description,
        request.requester,
        request.status,
        request.triage?.problemStatement ?? null,
        request.triage?.persona ?? null,
        request.triage?.productArea ?? null,
        request.triage?.priorityScore ?? null,
        request.triage?.priorityRationale ?? null,
        themeId,
        isoDaysAgo(request.daysAgo),
        request.triage ? isoDaysAgo(request.daysAgo, 18) : null,
      );
      requestIds.set(request.key, Number(result.lastInsertRowid));
    }

    const insertLink = db.prepare<[number, number, string, number]>(
      "INSERT INTO request_links (request_id, related_request_id, kind, confidence, decided_by) VALUES (?, ?, ?, ?, 'ai')",
    );
    const setCanonical = db.prepare<[number, number]>("UPDATE requests SET canonical_request_id = ? WHERE id = ?");
    for (const request of REQUESTS) {
      if (!request.mergedInto) continue;
      const confidence = MERGE_CONFIDENCE[request.key] ?? 0.9;
      insertLink.run(idOf(request.key), idOf(request.mergedInto), "duplicate", confidence);
      setCanonical.run(idOf(request.mergedInto), idOf(request.key));
    }
    for (const [from, to, confidence] of RELATED_LINKS) {
      insertLink.run(idOf(from), idOf(to), "related", confidence);
    }

    const insertVote = db.prepare<[number, string, string]>(
      "INSERT INTO votes (request_id, voter, created_at) VALUES (?, ?, ?)",
    );
    for (const [index, request] of REQUESTS.entries()) {
      for (let n = 0; n < request.votes; n += 1) {
        // Duplicates draw mostly from their own pool plus one shared voter, to show distinct-voter consolidation.
        const voter = request.mergedInto
          ? (n === 0 ? VOTERS[index % VOTERS.length] : DUPLICATE_ONLY_VOTERS[(n - 1) % DUPLICATE_ONLY_VOTERS.length])
          : VOTERS[(index * 5 + n) % VOTERS.length];
        insertVote.run(idOf(request.key), voter, isoDaysAgo(Math.max(request.daysAgo - n, 0), 60 + n));
        voteCount += 1;
      }
    }

    const insertReview = db.prepare<[string, number, string, string]>(
      "INSERT INTO review_items (kind, request_id, payload, status, created_at) VALUES (?, ?, ?, 'open', ?)",
    );
    insertReview.run(
      "merge",
      idOf("settingsHistory"),
      JSON.stringify({
        kind: "merge",
        targetRequestId: idOf("auditLog"),
        targetRequestTitle: "Audit log of permission changes",
        confidence: 0.72,
        reasoning: "Both ask for a record of who changed access-related settings and when. The audit log request is narrower (permissions only) while this one covers all workspace settings, so the overlap is strong but not exact.",
      }),
      isoDaysAgo(6, 20),
    );
    insertReview.run(
      "new_theme",
      idOf("offline"),
      JSON.stringify({
        kind: "new_theme",
        name: "Mobile experience",
        summary: "Field and on-call users need to read and update work from their phones, including with poor connectivity.",
      }),
      isoDaysAgo(4, 20),
    );

    // External-content FTS index: rebuild once instead of trusting trigger order during the bulk load.
    db.prepare("INSERT INTO requests_fts(requests_fts) VALUES ('rebuild')").run();
  })();

  const count = (sql: string): number => db.prepare<[], { n: number }>(sql).get()?.n ?? 0;
  console.log("Seeded demo data:");
  console.log(`  themes:        ${count("SELECT COUNT(*) AS n FROM themes")} (${count("SELECT COUNT(*) AS n FROM themes WHERE status = 'proposed'")} proposed)`);
  console.log(`  requests:      ${count("SELECT COUNT(*) AS n FROM requests")}`);
  console.log(`    merged:      ${count("SELECT COUNT(*) AS n FROM requests WHERE status = 'merged'")}`);
  console.log(`    pending:     ${count("SELECT COUNT(*) AS n FROM requests WHERE status = 'pending_triage'")}`);
  console.log(`  links:         ${count("SELECT COUNT(*) AS n FROM request_links")}`);
  console.log(`  votes:         ${voteCount}`);
  console.log(`  review items:  ${count("SELECT COUNT(*) AS n FROM review_items WHERE status = 'open'")} open`);
}

seed();
