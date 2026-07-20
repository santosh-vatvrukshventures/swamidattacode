# Swamidatta App Ecosystem Rules

## Syncing & Deployment Rule
When completing a feature implementation or finalizing changes, you must ALWAYS ensure the entire ecosystem is synchronized simultaneously. After making your code changes, you must:

1. **Localhost**: Ensure the local dev server is restarted if required. (Note: `package.json` now uses `tsx watch` for auto-reloading, but if modifying config files, restart it using the `manage_task` tool).
2. **MongoDB**: Ensure any required database schemas or seed data are updated in `api/index.ts`. Do not automatically inject seed data if the database is intentionally empty.
3. **GitHub**: Run `git add .`, `git commit -m "[Brief summary of changes]"`, and `git push` to sync the repository automatically.
4. **Vercel**: Deploy the changes to Vercel using `npx vercel --prod --yes` (ensure the `PATH` is exported appropriately for the node version if required).
5. **Mobile/Capacitor**: Sync the Capacitor Android project by running `npx cap sync android` to ensure mobile SDKs are up to date.
6. Explicitly inform the user that all 5 of these syncs/deployments have been fully completed.

## Financial & Accounting Architecture
- The app strictly follows an **accrual-based revenue model**.
- All product costs and rates are inclusive of taxes (GST/VAT). Do not separate tax components.
- Profit margins are derived strictly from `Revenue - COGS - Expenses`. 
- COGS must be locked dynamically at the time of sale using `purchase_cost_at_time`.
- Any destroyed inventory (wastage) or unpaid credit sales (bad debt) must be logged as a formal Expense to keep the Net Profit mathematically perfect.

## Web App Tech Stack & UI
- **Tech Stack**: React, TypeScript, HTML/CSS, TailwindCSS, Vite (local dev), Vercel (production), and Capacitor (mobile SDK).
- **Mobile Experience**: UI must include `safe-area-insets` for notch/status-bar protection. The Capacitor `@capacitor/app` SDK must be used to handle hardware back-button events to gracefully close modals instead of crashing the app.
- **Visual Design**: The UI must use rich aesthetics (dark mode, glassmorphism, micro-animations, curated harmonious colors) to feel extremely premium and state-of-the-art. Avoid generic MVP designs.