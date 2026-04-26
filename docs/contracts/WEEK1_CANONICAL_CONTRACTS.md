# Week 1 Canonical Contracts (Checklist, Logs, Corrective Actions, Specs)

Purpose: define one stable data contract for operations workflows before building Week 2 UI flows.

Status: draft v1, ready for implementation work.

Last updated: 2026-04-25

## Scope

This pack defines canonical documents for:

- Checklist definition
- Checklist log entry
- Corrective action
- Spec document

It does not replace existing entities (ingredients, vendors, recipes). It links to them through references.

## Canonical Firestore Paths

- `projects/{projectId}/checklist_definitions/{checklistId}`
- `projects/{projectId}/checklist_logs/{logId}`
- `projects/{projectId}/corrective_actions/{actionId}`
- `projects/{projectId}/spec_documents/{specId}`

## Contract Principles

- `id`: stable string id per document.
- `projectId`: always present and must match path project id.
- `status`: constrained enum values.
- `createdAt`, `updatedAt`: ISO timestamp strings.
- `createdBy`, `updatedBy`: actor ids/emails from auth context.
- `version`: integer for non-breaking evolutions.
- Soft links to domain entities via `entityRefs[]`.

## 1) Checklist Definition

File: `checklist-definition.schema.json`

Use for repeatable templates like opening line check, receiving checklist, close-down.

Key fields:

- `name`, `frequency`, `roleScope`
- `items[]` with pass/fail/range/boolean style inputs
- `severityOnFail` for escalation behavior

## 2) Checklist Log Entry

File: `checklist-log-entry.schema.json`

Use for a single run of a checklist.

Key fields:

- `checklistId`, `shiftContext`, `startedAt`, `completedAt`
- `responses[]` aligned to definition item ids
- `resultSummary` (`passed`, `failed`, `needs_review`)
- `linkedCorrectiveActionIds[]`

## 3) Corrective Action

File: `corrective-action.schema.json`

Use for tracked remediation generated from checklist/log failures.

Key fields:

- `sourceType`, `sourceId`, `checklistLogId`
- `priority`, `status`, `dueAt`, `owner`
- `resolutionNotes`, `resolvedAt`, `resolvedBy`

## 4) Spec Document

File: `spec-document.schema.json`

Use for ingredient/vendor/product specification records.

Key fields:

- `entityRefs[]` linking vendor, ingredient, and optional vendor-product rows
- `specUrl`, `specType`, `attributes` key-value pairs
- `complianceTags[]`, `effectiveDate`, `expiryDate`, `reviewStatus`

## Entity Reference Format

All contracts may use:

```json
{
  "type": "ingredient",
  "id": "ing_123",
  "name": "Heavy Cream"
}
```

Allowed `type`: `ingredient`, `vendor`, `vendor_product`, `recipe`, `menu_item`, `checklist`.

## Minimal Validation Rules

- Reject writes without `projectId`.
- Reject writes where `projectId` does not match path segment.
- Reject unknown enum values.
- Require `updatedAt` on each write.
- Require `completedAt` when checklist log status is `completed`.
- Require `resolvedAt` and `resolvedBy` when corrective action status is `resolved`.

## Migration Notes

- Legacy checklist docs under `projects/{projectId}/checklists/*` can be read and mapped into:
  - `checklist_definitions` (template-like docs)
  - `checklist_logs` (execution entries)
- Keep compatibility adapter in client until old readers are removed.

