# IT Admin Database Structure and Backups Demo Guide

## Purpose
This section is an audit-style admin log for database structure tracking and backup configuration records. It is meant to stay empty until a real admin creates records.

## What the page does
The tab lets an IT administrator:
- create schema history entries
- track migration labels and rollback notes
- mark one schema as the current baseline
- create backup records
- store backup type, retention, storage, and status
- edit or delete records later

## Why it can be blank
A blank state is correct when no one has added records yet.
It should not auto-fill fake schema or backup rows, because this would make the log less trustworthy.

## How the flow works
1. Open the IT Administrator dashboard.
2. Switch to the Database Structure and Backups tab.
3. Add a structure record or backup record using the form.
4. The record is saved to the backend database.
5. The table below refreshes and shows the saved row.
6. Use Edit to update a record or Delete to remove it.

## Field-by-field explanation

### Database Structure Registry
- Record name: A readable label for the schema entry.
- Schema version: The version identifier for the schema state.
- Migration label: The migration name or release tag.
- Change summary: A short description of what changed in that version.
- Rollback script notes: Notes about how to revert the change if needed.
- Applied date-time: When the schema change was applied.
- Mark as current schema: Marks this row as the active baseline.

### Backup Lifecycle Records
- Backup name: The label for the backup plan or backup run.
- Backup type: Full, incremental, or schema-only.
- Environment: Where the backup belongs, such as production or staging.
- Storage location: The storage target path, bucket, or server location.
- Retention days: How long the backup should be kept.
- Size (MB): Backup size metadata.
- Status: Planned, running, completed, or failed.
- Backup started date-time: When the backup began.
- Backup completed date-time: When the backup finished.
- Notes: Extra operational notes.

## Demo script for step 3
Use this when presenting the page:

"This tab is intentionally empty at first because it is an audit log, not sample data. I can create real records here when a migration is applied or when a backup policy is defined. The structure section stores schema version details and lets me mark one entry as the current baseline. The backup section stores the backup plan, status, storage location, and retention policy. Once I save a record, it appears in the table below and can be edited or deleted later."

## What to point out in a demo
- The empty-state message shows the page is waiting for real records.
- Creating a structure record immediately adds traceable schema history.
- Marking a structure as current automatically keeps only one current baseline.
- Backup records track policy and lifecycle, not just a list of files.
- Edit and Delete prove this is a real CRUD admin tool, not a static page.

## Best practice
If you want a demo dataset, create it only in development so the production page stays truthful.
