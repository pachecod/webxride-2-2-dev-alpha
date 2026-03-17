## Pending Bugs / Follow‑ups

- **Admin notification clear-all not persistent**
  - **Symptom**: In Chrome as admin, clicking "Clear All Notifications" in `/admin-tools/submissions` clears the badge temporarily, but after reload pending submissions still contribute to the admin notification count.
  - **Expected**: Once cleared, those specific submissions should no longer count toward the admin badge until new submissions arrive.

- **React render warning in Sidebar when templates refresh**
  - **Symptom**: Warning in console: "Cannot update a component (`Sidebar`) while rendering a different component (`App`)."
  - **Expected**: No render-phase state updates; template refresh logic should be moved to an effect or callback that runs outside of render.

- **Supabase template listing duplication / noisy logs**
  - **Symptom**: Multiple repeated "Processing folder ..." and "Found metadata ..." logs for the same template folders during startup.
  - **Expected**: Each template folder processed once per refresh; logs should reflect single-pass behavior.

