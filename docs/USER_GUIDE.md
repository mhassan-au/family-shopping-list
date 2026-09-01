# MyGrocery simple user guide

MyGrocery is a private household app for shopping, expenses, cash-flow forecasting, and personal-loan records. Only manually approved devices can use it.

## Getting access

1. Enter the family code, username, and password.
2. If the device is new, copy the displayed device ID.
3. The owner approves that device in Firebase.
4. Press **Check approval** and continue.

Contributors can use Shopping and Expenses. Owner-only areas include MyCashFlow, Settings, bank sync, audit reports, and Personal Loans.

## MyGrocery shopping list

- Add one item or several comma-separated items.
- Set its priority, shop, and category.
- Use Flat, Shop, or Category views and the priority filter.
- Edit or remove an active item.
- Tick an item when buying it, then enter quantity and price.
- The app remembers the latest item price and shows an expected price next time.
- The small summary at the top shows the date, items remaining, expected total, and sync state.
- The completed total appears below the list. Open it to clear completed items or transfer the total to Expenses before clearing.

## MyExpenses

- Add an expense with description, category, amount, and date.
- Similar same-day entries produce a duplicate warning before saving.
- Unusually large expenses are highlighted.
- Expense history is permanent. A correction creates an amendment instead of changing or deleting the original record.
- Use the report icon beside the weekly summary for daily, weekly, monthly, yearly, and category reports.

## Manual bank sync

Owner only:

1. Open **Settings** from the top menu.
2. Go to the bank-sync area and choose the account.
3. Press **Sync now**.
4. Review each pending transaction and Accept or Reject it.

Accepted transactions become Expenses. Rejected and already processed transactions are not offered again. The report icon shows the permanent sync-status history.

## MyCashFlow forecast

MyCashFlow estimates the balance for every day of the month.

### Set it up

1. Open **Settings → Forecast**.
2. Add recurring income and recurring expenses.
3. Use Australian dates: `dd/mm/yyyy`.
4. Edit a recurring entry to see its history or make it inactive. A reason is required.

Recurring entries cannot be deleted from Settings. If the value changes, make the old entry inactive and add a new one.

### Use the monthly forecast

- Set the month’s **Opening balance** to match the bank account.
- **Carried forward** comes from the previous month and cannot be edited.
- **Projected closing** is calculated automatically.
- Navigate from September 2026 up to 12 months ahead.
- Press **Today** to return to the current month and row.
- Use **+** to add one-off income or an unexpected expense.
- The low-balance summary shows the lowest projected amount, its date, and how much is needed to reach $0 or the configured safety buffer.

Future recurring activity affects the projection. Actual Expenses affect the forecast only when their date arrives.

### Adjust today’s Expenses total

1. Press the edit icon beside **Expenses section total**.
2. Review the individual transactions, including member and category.
3. Untick anything that should not affect your personal forecast.
4. Enter a reason and press the green save button.

The original Expense records are not changed. New transactions for that day are included automatically. Use the pencil option only when you need to lock a manual daily total.

### Exclude one recurring expense occurrence

For a recurring expense on today or a past date, press the trash icon beside its name and enter a reason. Only that occurrence is removed from the forecast. The recurring Settings entry and future dates remain unchanged.

### Audit trail

Open the audit icon in **Settings → Forecast** to review opening-balance edits, recurring-entry changes, daily transaction selections, manual locks, one-off entries, and excluded recurring occurrences.

## Personal Loans

Owner only:

- Open **Personal Loans** from the top menu.
- Record the lender, amount, date taken, and reason.
- Add each full or partial repayment with its actual payment date.
- Future repayment dates are blocked.
- Unpaid loans stay at the top.
- Fully paid loans move into a collapsed grey section at the bottom.

Loan and repayment history is permanent; outstanding balances are calculated automatically.

## Settings and logout

- Open the menu beside the username from any main section.
- Owners can manage shared shops, shopping categories, expense categories, Forecast setup, bank sync, reports, and Personal Loans.
- Choose **Logout** from the same menu and confirm in the app popup.

## Important reminders

- Keep `firestore.rules` published and aligned with the version of the app being used.
- Do not put bank tokens or household credentials in client code or Git.
- Bank sync is manual and owner-approved.
- Expense, audit, loan, repayment, and occurrence-exclusion history is not deleted or rewritten by normal app actions.
