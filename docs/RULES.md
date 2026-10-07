# WaveDesk — rules for every AI task in this repo
## Scope (strict)
1. Do ONLY what the task says. Do not modify, refactor, rename, reformat or "improve" anything else: no unrelated UI, text, colors, spacing, workflow rules, permission logic, database logic, dependencies or config.
2. First read the current code of the parts you will touch; the code changes often.
3. Keep existing behavior, permissions and data formats unless the task explicitly changes them.
4. If you notice a bug or improvement outside the task, do NOT fix it. List it at the end under "Noticed but not changed".
5. Never add or upgrade a package (package.json stays unchanged) unless the owner approves after you name the package, its license (MIT or Apache only) and why. Write small features yourself.
6. Never commit or push. The owner does that.
## Database
7. Never run migrations or touch the live database. If the task needs database changes, write plain Postgres SQL in a new file sql/YYYY-MM-DD_<name>.sql (snake_case names, uuid primary key, created_at/updated_at, organization_id on every table, RLS policies included and commented) and tell the owner clearly that it must be run in the Supabase SQL editor.
## Django-ready (NEW code only; do not refactor existing code)
8. Pure business logic (slug generation, duration math, status and permission rules) goes in lib/ or utils/ as plain functions with no React and no DOM, each with 2-3 input->output examples in a comment.
9. New Supabase calls go in services/, not inside UI components.
10. Browser-only features (sound, teleprompter, themes, local drafts) go in their own plain JS module with a thin React wrapper.
11. Fixed numbers and labels go in utils/constants.js. Every new feature is registered in utils/features.js.
## Finish
12. At the end: list every changed or created file; run `npm run build`; run the undefined-name check below; report both results honestly. If something fails, fix only what you broke.
Undefined-name check: npm i --no-save eslint@8 eslint-plugin-react@7 eslint-plugin-react-hooks@4 && npx eslint --no-eslintrc -c docs/check-undefined.eslintrc.json app components lib services utils --ext .js   (must report 0 errors)
