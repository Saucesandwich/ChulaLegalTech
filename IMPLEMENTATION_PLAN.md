# Clickable UI implementation plan

## Goal and scope

Build a pitch-ready employer dashboard that demonstrates how a person’s application moves from referral through evidence review to a job start and follow-up. Use the attached brief as product context; the request is to plan a clickable frontend prototype with no backend.

Primary user: an employer’s HR coordinator. Start with one fictional employer hiring warehouse and manufacturing staff. Partner actions are simulated inside the demo rather than requiring a second portal.

Deliver three connected screens, realistic synthetic records, working filters and forms, and browser-local state. All legal findings, verification records, and deadlines are illustrative fixtures. The prototype does not determine legal eligibility or claim government verification.

## 1. Screen and navigation plan

| Screen | Contents | Clickable behavior |
| --- | --- | --- |
| Employer overview — `/overview` | Summary cards, priority action queue, application table, compact hiring funnel, upcoming data-handling tasks | Click a card or funnel stage to filter applications; search by name or application ID; filter by role, stage, and pending reason; open an application; open a deadline task drawer |
| Application detail — `/applications/:id` | Applicant summary, role and actual duties, skills, evidence, assessment findings, work arrangements, tasks, history | Switch tabs; preview sample evidence; request evidence; simulate a partner response; assign an owner; complete a review; change recruitment stage; record a job start |
| Results and outcomes — `/outcomes` | Completed assessments, turnaround, stage counts, job starts, distinct people placed, 30/90-day follow-up, pending reasons | Change date and role filters; inspect a chart segment’s underlying records; open the related application; record a follow-up |

Use a shared sidebar with Overview and Outcomes, plus a contextual breadcrumb on application detail. Preserve overview filters and scroll position when returning from a case. Support direct links, browser back/forward, and a useful unknown-application state.

Global controls: “Demo data” label, demo reference date, and “Reset demo.” Reset asks for confirmation, then restores all fixtures and counters.

## 2. Overview layout

Arrange the page in this order:

1. Page title, search, and filters.
2. Four actionable cards: open applications, evidence needed, reviews pending, and overdue tasks.
3. Priority queue showing the issue, next action, owner, and due date.
4. Application table with ID/name, job, recruitment stage, evidence status, review status, and next action.
5. Compact funnel and upcoming deadline list.

Prioritise overdue work, then upcoming tasks. Clicking a task opens the exact case tab or drawer required to act. Include clear-filter controls and a helpful empty state when no records match.

## 3. Application detail interactions

Use five tabs: Summary, Evidence, Assessment, Tasks, and History.

| Action | Form or interaction | Visible result |
| --- | --- | --- |
| Request evidence | Select the missing item, partner, owner, and due date | Create a local task and history event; show “Awaiting partner” |
| Simulate partner response | Explicit demo control adds a bundled sample document and response | Evidence becomes “Received, awaiting review”; request task completes; review task appears |
| Review evidence | Open the sample preview, then record a simulated reviewer and note | Show verification scope, fictional source, reviewer, and date; never mark the whole applicant “verified” |
| Record assessment | Review seeded findings, unresolved questions, and work arrangements; save a review note | Store a versioned simulated assessment and update the next action |
| Assign or complete task | Choose an owner or enter a completion note | Update queue, counts, and history immediately |
| Advance recruitment | Choose the next stage and enter required details | Update the application stage and funnel; an offer remains distinct from a job start |
| Record job start | Enter start date and job title | Add a placement and scheduled 30/90-day follow-ups; update outcomes |
| Record follow-up | Choose still employed, employment ended, or unknown; add a note | Update the outcome breakdown and history |
| Complete retention review | Open a seeded task and record a simulated disposition | Mark the demo task completed; explain that no real source records were deleted |

Validate required fields inline. Keep entered values when validation fails. Show success feedback and prevent duplicate submissions. Drawers and dialogs support Escape, keyboard focus management, and a clear cancel action.

Recruitment stages: Referral → Evidence ready → Assessment completed → Interview → Offer → Started, with a separate Closed state and reason. An assessment can be completed while identifying a restriction; it does not automatically approve recruitment progression.

Assessment findings use the brief’s labels: Further evidence required; Review required; Restriction identified; No restriction identified within reviewed rules; Outside reviewed scope. Keep legal findings, evidence completeness, skills, and scheduling constraints separate. Unresolved review cases stay pending in the scripted flow.

## 4. Mock data and local state

Prepare approximately 12 applications across 10 fictional people, three roles, two referral partners, and three task owners. Include missing evidence, unresolved hours, a restriction, an out-of-scope role, a completed review, and historical placements. Include at least one person with two applications to demonstrate the difference between people and applications.

Use small linked frontend records:

- Person, application, vacancy, and partner.
- Evidence reference and simulated assessment, including scope, rule version, and review date.
- Task and workflow event.
- Placement and follow-up.

Keep sample documents bundled with the frontend. Avoid collecting actual records or processing real uploads. Evidence previews use fictional content.

Maintain one shared client-side store. Derive cards, tables, charts, and outcomes from that store so every action produces consistent changes across screens. Persist synthetic state in browser local storage and provide a reset function. Store a fixture version and recover gracefully from missing or invalid saved state.

Use a fixed, visibly labelled demo reference date so deadlines and follow-up examples remain reproducible. Event timestamps and date comparisons should use that same demo clock.

## 5. Metrics and charts

- Summary cards count matching applications; show distinct people separately where relevant.
- The funnel shows the number of applications that reached each stage, based on history. Label current-stage counts separately.
- Turnaround measures referral to completed assessment for completed cases and states the included sample size.
- Pending-reason bars show why open applications are waiting and drill down to those cases.
- Count job starts from placement records, with protection against duplicate placements for the same application.
- For 30/90-day follow-up, include only placements old enough at the demo reference date. Show confirmed employed, known to have left, and unknown, with counts and the denominator. Due follow-ups without a recorded response count as unknown.
- Apply visible filters consistently and label whether an outcomes date filter refers to job-start date or assessment-completion date.

Use simple bars, a stage funnel, and an outcome breakdown with labels and counts. Provide equivalent record lists; avoid unexplained compliance or trust scores.

## 6. Visual direction

Use a calm, light dashboard: pale slate background, white cards, navy navigation, blue primary actions, and amber attention states. Use text labels and icons alongside status colours. The UI/UX search supports a data-dense dashboard style; omit its marketing-page pattern because this is an operational application.

Use a readable sans-serif font, 16px body text, consistent spacing, and restrained 150–200ms feedback. Keep one clear primary action per context. Use plain employer-facing language and sample IDs rather than sensitive personal details.

Desktop: sidebar and full tables. Tablet: collapsed navigation and simplified grids. Mobile: navigation drawer and stacked application cards. Check 375px, 768px, and 1440px layouts. Preserve visible focus, keyboard access, labelled inputs, 44px interaction targets, reduced-motion support, and at least 4.5:1 normal text contrast.

## 7. Build sequence

| Phase | Work | Completion check |
| --- | --- | --- |
| 1. Fixtures and structure | Define the synthetic cases, demo clock, routes, shared shell, visual tokens, and client state | All three screens load directly and show consistent fixture data |
| 2. Overview | Build cards, queue, table, filters, funnel, and task drawer | Every visible control works; filters combine and clear correctly |
| 3. Case workflow | Build tabs, evidence preview/request, simulated partner response, review forms, tasks, stage changes, and history | The flagship case progresses from missing evidence through assessment to a recorded start |
| 4. Outcomes | Connect charts, drilldowns, placement counts, and follow-up forms | A new start appears immediately; follow-up percentages use eligible placements |
| 5. Demo polish | Add persistence/reset, empty/error states, responsive layouts, and keyboard behavior | A fresh reset allows the full demo without manual data repair |

No framework is selected because the workspace has no existing application. This plan is framework-independent; choose the frontend stack when implementation begins. The structure needs routing, shared client state, reusable UI components, and local charts only.

## 8. Pitch walkthrough

1. Open Overview and select application A-014 from “Evidence needed.”
2. Open Evidence and request training confirmation from the fictional referral partner.
3. Use “Simulate partner response” to add the bundled confirmation.
4. Review that item, then save the prewritten simulated assessment with its scope and version visible.
5. Progress through interview and offer; record an actual start date using the form.
6. Open Outcomes and show the added job start and scheduled follow-ups. Use a historical placement to demonstrate a due 90-day follow-up.
7. Reset the demo and repeat from the same initial state.

Target a 3–5 minute walkthrough with no external accounts, network integrations, or real documents.

## 9. Acceptance checklist

- All navigation, tabs, forms, filters, dialogs, and chart drilldowns respond meaningfully; no dead primary buttons.
- Shared data remains consistent when switching screens and after refreshing.
- Reset restores the exact initial dataset.
- Missing fields, empty search results, invalid routes, and invalid saved state have usable feedback.
- An offer does not increase job-start counts; repeated saves do not duplicate placements or follow-ups.
- People and application counts remain distinct; unknown outcomes remain visible.
- Upload receipt does not automatically imply evidence verification or legal approval.
- The entire demo works with bundled fixtures and no application API calls.
- Complete manual checks of the walkthrough, back navigation, mobile layouts, keyboard dialogs, and date-boundary follow-up cases. Use focused automated checks only for shared metric calculations and duplicate-event prevention if implementing logic tests.

## 10. Thai and candidate experience extension

The prototype now uses the working name **ปาท่องโก๋** and supports Thai and English. Thai is the default language, while a persistent header control switches the primary navigation, employer workflow, application records, and candidate experience to English.

Add a candidate-facing “พื้นที่ของฉัน / My opportunity” workspace with:

- a plain-language readiness journey that shows completed and upcoming actions;
- job matches based on skills, location, and preferred working hours;
- saved jobs and clear second-chance-friendly employer signals;
- upcoming coaching and interview-preparation appointments;
- a privacy view explaining which employer can access which information; and
- direct access to a support coach when the person needs help.

Candidate wording should remain supportive and avoid labels that define a person by their conviction history. The operational data model should expose only the minimum information the candidate needs, and any future evidence upload or employer sharing action must include purpose, access, and withdrawal information appropriate to the applicable legal basis.

## 11. Deferred scope

Leave authentication, real partner portals, messaging, document storage, legal-rule engines, government integrations, real consent/retention enforcement, databases, Power BI services, and tax-rule calculations outside this prototype.

Tax benefits and employer cost savings may become an optional later UI scenario. They are not needed for the core pitch flow. Any later tax screen should display explicit illustrative assumptions and reviewed rule dates rather than promise eligibility.

This plan specifies mock legal and workflow content from the supplied brief; it does not independently validate the brief’s legal claims, survey figures, or competition dates.
