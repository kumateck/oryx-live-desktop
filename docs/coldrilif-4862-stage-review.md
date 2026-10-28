# Coldrilif Syrup batch 4862: stage mapping review

Read-only inspection on 2026-10-28 of the configured shared Oryx database
`164.90.142.68:5433/entrancedb`. Initial inspection made no changes; the later
configuration repair is recorded below. The user initially
selected Intermediate, requested review after the conflicting history below was
discovered, then explicitly confirmed **Finished for step 12**. The stage choice is
settled. The user identified Eunice Lariba Adams
(`019bd60d-3436-7d71-b2cc-c50664866c49`) as the audit operator. Live preview verified
her active planning grant and product department. No approval to alter released
test history is implied.

## Confirmed records

| Record | ID |
| --- | --- |
| Product | `01997392-3ca0-7158-aefc-a22aeb7031f8` |
| Activity | `01a1757c-7819-7e2f-ad68-d5e10a1a35cf` |
| Schedule product | `01a17321-484a-7395-bf1b-ed0275084c69` |
| BMR | `01a1757c-78ca-7c17-84d8-5283466316a9` |
| Step 6 | `01a1757c-781d-77a1-acf6-6a3e8a35b8df` |
| Step 12 | `01a1757c-781c-7645-8e24-b59cb885944e` |
| Step 6 procedure route | `01a1757b-83ff-7805-9d29-1122eb3010b7` |
| Step 12 procedure route | `01a1757b-83ff-7614-92eb-4fbb7b5808c2` |
| Existing released ATR | `01a17581-8a72-747e-8b66-9b5b1f8f0ebf` |

The schedule product's batch number is null. The active BMR identifies batch
**4862**, manufactured October 2026, expiring October 2031, with status Approved.
The repair validates the unique active BMR's batch number and refuses a different
non-empty schedule batch number; it does not fill or change either number.

## Mapping at initial inspection

| Step | Procedure instructions | Activity and test history |
| --- | --- | --- |
| 6 — Intermediate granules sampling and release by QA. Testing by QC. | General Manager Production → Finished; QA Manager → Bulk; QC Manager → Intermediate | Nine assignments point to Finished and two to Intermediate. The step completed on 2026-10-26. Its ATR is **Finished**, status Released, with the Finished Chemical ARD pinned. |
| 12 — Finished product Sampling, Collection of Retain Samples, Testing by QA. | All three roles have ATR instructions with no ARD | All 11 existing ATR assignments have no ARD. No ATR exists for this step. All 11 users are active. |

Available active verified Chemical ARDs for this product:

| Stage | Specification | ARD ID |
| --- | --- | --- |
| Intermediate (`0`) | `NMP/IPC/SPC/005` | `fb400e49-394f-408f-897f-a068939e5130` |
| Bulk (`1`) | `NMP/B/SPC/012` | `780b16a7-6fbd-4ec2-b63d-afe34c4a65c4` |
| Finished (`2`) | `NMP/FP/SPC/009` | `8a251957-e50e-4b94-a4fd-c2a931ca2912` |

Roles above describe stored configuration; they do not imply permissions.

## What the implementation explains

`ProductionScheduleRepository` builds a single action/ARD entry per `(user, step
order)`. An explicit user assignment wins over roles; among roles, the first match
wins for a user who belongs to more than one role. It then copies that selection
into the activity. Thus different stages on the same procedure step can result in
a different mixed set of stages on the activity. The three configured role stages
do not produce three independent test checkpoints.

The desktop's `configuredTestStage` takes the **first** ATR assignment with a valid
stage. A mixed step can therefore produce a stage determined by response order.
This is consistent with the observed Finished ATR at step 6, but the historical
request payload/order was not available to prove the exact originating client path.

The backend rejects a second ATR for the same BMR, schedule product and stage,
including deleted history. Simply assigning Finished to step 12 would remove its
“Not set” warning and then encounter an existing Finished-test conflict. Assigning
Intermediate to step 12 merely to avoid that conflict would place an Intermediate
request at a step labelled Finished; it is not an approved correction.

## Proposed mapping for QA review

Based on the operation names and the user's initial Intermediate selection, the
candidate master mapping is:

- Step 6: all ATR instructions use **Intermediate**.
- Step 12: all ATR instructions use **Finished**.
- Bulk: no separate Bulk ATR checkpoint exists in this product's current procedure.
  An available Bulk ARD alone does not establish that an additional test is required.

The user has confirmed **Finished for step 12**. Step 6 remains a proposal to
confirm against the product's approved BMR/procedure. The operation name “Intermediate granules” also merits
review for a syrup; do not rename a shared operation as part of this data repair.

For **future batches**, correcting the master procedure is a separate, auditable
configuration change. The initial null-link repair deliberately refuses step 6's
conflicting existing ARDs and does not replace them.

For **batch 4862**, QA must review the existing Finished test's sampling, results,
worksheet responses and release to decide what the evidence actually supports and
whether a new Finished test is needed. Do not relabel/move the released ATR, delete
its history, reopen the completed step, or release a different stage automatically.
A history correction or additional-test path needs a separate reviewed workflow.

## Applied configuration repair

A later live preview found the master procedure had already been replaced and
corrected to Finished independently of this repair. The current matching route is
`01a1843b-7416-7928-aafc-6e1b83470b09`. Only the 11 copied activity assignments still
had missing links, so the applied command omitted `--repair-procedure`.

On 2026-10-28, the configuration-only repair set those **11 activity links** to
Finished ARD `8a251957-e50e-4b94-a4fd-c2a931ca2912`, attributed to Eunice Lariba Adams.
Repair ID: `fb00a099-3529-421f-92f0-8335e7a4320d`. Full before/after evidence and the
known existing-stage conflict are recorded in `public."_ProductionAtrRepairs"`,
with a matching normal production activity log.

The existing Finished ATR remains Released at step 6. No procedure, ATR, response,
release or step status was written by this repair. Step 12 still requires normal
workflow processing, and the backend still refuses a second Finished ATR. QA
history reconciliation remains necessary before a new request can be raised.

The exact command below defaults to a read-only preview; applying used the same
arguments plus `--apply`:

```sh
bun scripts/repairs/production-atr/index.ts repair \
  --host "$PGHOST" --port "$PGPORT" --database "$PGDATABASE" \
  --activity 01a1757c-7819-7e2f-ad68-d5e10a1a35cf \
  --step 01a1757c-781c-7645-8e24-b59cb885944e \
  --product 01997392-3ca0-7158-aefc-a22aeb7031f8 --batch 4862 \
  --ard 8a251957-e50e-4b94-a4fd-c2a931ca2912 --stage finished \
  --actor 019bd60d-3436-7d71-b2cc-c50664866c49 \
  --expected-assignments 11 --configuration-only \
  --existing-stage-request 01a17581-8a72-747e-8b66-9b5b1f8f0ebf \
  --reason 'Configuration only: restore Finished ATR links for Coldrilif Syrup batch 4862 step 12; preserve existing released ATR and all workflow states'
```

This is a preview; it does not include `--apply`. The default repair refuses the
existing Finished ATR. The configuration-only command accepts only the exact named,
still-Released other-step request and records that new-request creation remains
blocked. It never changes any release, approval, timing, status, inventory or
financial record. See
[maintenance commands](production-activity-repairs.md).

Independent post-commit verification checked all 11 assignments link to Finished
and carry Eunice's `LastUpdatedById`, and that the durable audit has 11 before/after
rows and a corresponding activity log. Local PostgreSQL tests passed 42 checks;
root TypeScript and diff whitespace checks passed. Browser confirmation was not
performed because the board session required sign-in.
