# ปาท่องโก๋ prototype

This bilingual Thai/English prototype connects an employer hiring workspace with a candidate-facing opportunity portal for second-chance employment. All people, metrics, organisations, and records shown in the UI are synthetic.

Open the [ปาท่องโก๋ demo](https://restart-ready-chula.k-patrick2549.chatgpt.site) and select Company or Applicant. The shared demo accounts use the usernames `company-demo` and `applicant-demo`. Ask the demo owner for the passwords. Each portal and its script require the matching server-verified session.

To run locally with Node 22+, configure `COMPANY_DEMO_PASSWORD`, `APPLICANT_DEMO_PASSWORD`, and a randomly generated `DEMO_SESSION_SECRET` in an ignored `.env` file. Run `node scripts/build-demo.mjs`, then `node --env-file=.env scripts/serve-demo.mjs` and open the URL printed by the server.

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
