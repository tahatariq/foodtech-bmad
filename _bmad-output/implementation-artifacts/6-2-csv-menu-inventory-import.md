# Story 6.2: CSV Menu & Inventory Import

Status: review

## Story

As **Alex (system admin)**,
I want to import menu items and inventory from a CSV file during onboarding,
So that restaurants don't have to manually enter hundreds of items.

## Acceptance Criteria (BDD)

**Given** Alex reaches step 4 (Menu Import) in the onboarding wizard
**When** he uploads a CSV file
**Then** the system parses the CSV via POST `/api/v1/admin/tenants/:tenantId/import/menu`, validates each row against the menu item Zod schema (name, category, stations, inventory_items), and displays a preview table showing valid rows (green) and invalid rows (red with error details)

**Given** the CSV preview is displayed
**When** Alex clicks "Import"
**Then** all valid rows are inserted as menu items linked to their inventory items, invalid rows are skipped with a downloadable error report (CSV), and the import count is displayed ("Imported 142 of 150 items")

**Given** the CSV contains inventory items
**When** imported
**Then** each item is created with default `reorder_threshold` and `reorder_quantity` values that Alex can adjust in step 5 (Inventory Thresholds)

## Tasks / Subtasks

### Task 1: CSV Upload & Parse API (AC: parse and validate)

- [ ] Create POST `/api/v1/admin/tenants/:tenantId/import/menu` endpoint
- [ ] Accept multipart file upload (CSV)
- [ ] Parse CSV using `papaparse` or `csv-parse` library
- [ ] Validate each row against Zod schema: `{ name: string, category: string, stations: string[], inventoryItems: string[] }`
- [ ] Return validation results: valid rows, invalid rows with per-field errors

### Task 2: Preview Table Component (AC: preview display)

- [ ] Create `frontend/src/views/AdminConsole/OnboardingWizard/MenuImportStep/CsvPreviewTable.tsx`
- [ ] Display valid rows with green indicator
- [ ] Display invalid rows with red indicator and error details per field
- [ ] Show summary: "142 valid, 8 invalid"
- [ ] "Import" button to proceed, "Download Errors" link for error report

### Task 3: Import Execution (AC: insert valid rows)

- [ ] Create POST `/api/v1/admin/tenants/:tenantId/import/menu/execute` endpoint
- [ ] Insert valid menu items linked to stations and inventory items
- [ ] Create inventory items with default `reorder_threshold` and `reorder_quantity`
- [ ] Skip invalid rows, generate error report CSV
- [ ] Return import summary: `{ imported: number, skipped: number, errorReportUrl: string }`

### Task 4: Error Report Download (AC: downloadable errors)

- [ ] Generate CSV of invalid rows with error column
- [ ] Serve via GET `/api/v1/admin/tenants/:tenantId/import/menu/errors/:reportId`
- [ ] Auto-cleanup error reports after 24 hours

### Task 5: Write Tests (AC: all)

- [ ] Unit tests for CSV parsing and validation
- [ ] Unit tests for CsvPreviewTable component
- [ ] Integration test: upload CSV → preview → import → verify database records
- [ ] Test with edge cases: empty CSV, all invalid, duplicate items

## Dev Notes

- CSV parsing happens server-side for security (don't trust client-parsed data)
- Zod schema shared between frontend preview and backend validation
- Default reorder thresholds editable in wizard step 5

### Project Structure Notes

- `frontend/src/views/AdminConsole/OnboardingWizard/MenuImportStep/` — upload + preview components
- `backend/src/admin/import.service.ts` — CSV parsing + validation + import
- `backend/src/admin/import.controller.ts` — file upload endpoints

### References

- [Source: epics.md#Story 6.2]
- [Source: prd.md#FR45]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
