# Syncing & Deployment Rule
When completing a feature implementation or finalizing changes, you must ALWAYS ensure the entire ecosystem is synchronized simultaneously. After making your code changes, you must:

1. **Localhost**: Ensure the local dev server is restarted if required. (Note: `package.json` now uses `tsx watch` for auto-reloading, but if modifying config files, restart it using the `manage_task` tool).
2. **MongoDB**: Ensure any required database schemas or seed data are updated in `api/index.ts`.
3. **GitHub**: Run `git add .`, `git commit -m "[Brief summary of changes]"`, and `git push` to sync the repository.
4. **Vercel**: Deploy the changes to Vercel using `npx vercel --prod --yes` (ensure the `PATH` is exported appropriately for the node version if required).
5. **Mobile/Capacitor**: Sync the Capacitor Android project by running `npx cap sync android`.
6. Explicitly inform the user that all 5 of these syncs/deployments have been fully completed.

- After completing any task or making code changes in the Swamidatta-APP, you must automatically commit the changes and push them to the GitHub repository.
