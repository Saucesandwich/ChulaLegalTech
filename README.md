# ปาท่องโก๋ prototype

This bilingual Thai/English prototype connects an employer hiring workspace with a candidate-facing opportunity portal for second-chance employment. All people, metrics, organisations, and records shown in the UI are synthetic.

Open the [ปาท่องโก๋ demo](https://pathongko-jobs.k-patrick2549.chatgpt.site) and select Company or Applicant. The shared demo accounts use the usernames `company-demo` and `applicant-demo`. Ask the demo owner for the passwords. Each portal requires the matching server-verified session.

To run locally with Node 22+, configure `COMPANY_DEMO_PASSWORD`, `APPLICANT_DEMO_PASSWORD`, and a randomly generated `DEMO_SESSION_SECRET` in an ignored `.env` file. Run `node scripts/build-demo.mjs`, then `node --env-file=.env scripts/serve-demo.mjs` and open the URL printed by the server.

The local server uses an in-memory SQLite demo database. The hosted Worker uses D1. Test the hiring workflow with `node scripts/check-hiring.mjs` after building.

To demonstrate the workflow, post a vacancy as the company, then sign in as the applicant and request verification for the required evidence. Return to the company to record the demo verification. For positions marked for occupational review, the applicant requests a case review before applying. Both sides can read the data-use notice for the vacancy. Closing selection starts the retention clock for the application and review statuses. Expired records are purged on the next workflow request.

The prototype includes:

- Employer overview and prioritised action queue
- Searchable/filterable application workspace
- Application detail drawer with evidence provenance and assessment scope
- Data-handling deadlines and retention tasks
- Hiring funnel and employment outcome reporting
- Candidate readiness journey, matched jobs, appointments, privacy controls, and coach support
- Thai/English language switching
- Responsive layouts for desktop and mobile

See `IMPLEMENTATION_PLAN.md` for the product workflow, interaction specification, synthetic data model, build sequence, pitch walkthrough, and acceptance checklist.
