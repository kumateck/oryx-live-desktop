# Module report and KPI catalogue

First source-based pass, 2026-11-02. Proposed reporting contracts for business
review; this is not an implementation commitment. See the [study rules](README.md)
and [existing source inventory](source-inventory.md). A suggested column is not
asserted to be populated until the selected report's joins are traced and tested.

Status legend: **W** existing desktop workbench option; **S** supporting workflow,
DTO or backend report exists in source, dedicated report still needs review;
**L** local implementation, deployment not established; **P** proposed query or
metric; **G** unresolved evidence/definition gap. Combined labels are intentional.
No label means verified customer deployment. Date bases below must be named in
the eventual UI; snapshot means at the stated supported as-of instant.

Every KPI needs its numerator/denominator counts, drill-through detail and missing
evidence count. Rates with zero denominators are N/A. No targets are set here.

## 01. Quality assurance

Owns BMR/BPR issue, product ATR oversight, QA decisions, formula governance and
legacy OOS disposition. QC testing and audit CAPA remain separately owned.
[Detailed first-module review](modules/01-quality-assurance.md).

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| QA-01 BMR issued | L/G | BMR | Issued date, issued by, batch number, manufacturing date, expiry date, batch size/unit, product name/code, department | Issue date range; department | Print grouping agreed; classify imported issue stamps before claiming QA-only issuance. |
| QA-02 BMR awaiting issue | S/P | Requested unissued BMR | Request reference, product/code, batch number if assigned, department, requested at/by, current step, waiting days | Snapshot; department; age band | Include older still-open requests; active queue alone is not historical backlog. |
| QA-03 Batch quality release/decision | S/G | Final quality decision on batch | Product/code, batch, stage, decision, decision date/person, evidence reference, rejection reason, source engine/version | Quality-decision date; department; stage; outcome | Separate QC release from BMR issue; final decision timestamp/authority needs tracing. |
| QA-04 ATR lifecycle register | S/P | ATR and stage | ATR/AR/issue reference, product, batch, stage, requested, sampled, assigned, tested, released, owners, status, retest indicator, turnaround | Select named event date; department; stage; status | Different stages/retests cannot be collapsed into one result per batch. |
| QA-05 QA approval workload | S/P | Required approval stage on a document revision | Document/type/reference, revision, department, submitted time, required reviewer, current status, decision time/person, waiting age | Snapshot or decision period; type; reviewer; department | Old/replaced approvals must not authorize or double-count current content. |
| QA-06 OOS QA disposition | S/G | Investigation/case | Case, engine, batch/material/product, test/stage, opened, submitted to QA, reviewer, decision, decision time, reason, linked retest | Opened or disposition date; outcome; department; engine | Legacy investigations and worksheet OOS cases are distinct until mapped. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| BMRs issued | Distinct BMR IDs with qualifying issue evidence inside period | QA-01, L/G; import provenance must be decided; not the QC-approved count. |
| Median request-to-issue time | Median of issue minus valid request time for BMRs issued in period | P; retain missing/negative timestamp exceptions and component count. |
| Unissued backlog and oldest age | Open request count at snapshot; maximum snapshot minus request time | P; true historical state required for earlier snapshots. |
| Quality decision outcomes | Released / (released + rejected), on an agreed final-decision cohort | G; do not reuse the misleading `Issued` property in the current release-rate DTO. |

Sources: backend `BatchManufacturingRecord`, `AnalyticalTestRequest`,
`OosInvestigation`, `QcWorksheets/OosCase`, approval entities and
`ReportRepository.GetQaDashboardReport` / `GetBmrReleaseRate`; desktop
`issue-bmr`, `analytical-test-requests`, `formula-reviews`, `formula-approvals`.

## 02. Quality control

Owns material/product testing, analysts, specifications/STP/ARD/worksheet versions,
monitoring, water-quality results and certificates. Legacy and rebuilt QC must
retain distinct identity until their live boundaries are verified.

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| QC-01 Material testing register | S/P | Material batch test request | Material/code/kind, batch, GRN, AR, receipt, sampling, assignment, analyst, test completion, decision, unit, specification/version | Receipt/sample/test/decision selector; material; department; status | Batch status alone does not provide every lifecycle timestamp. |
| QC-02 Product stage test results | S/P | Batch × request × stage/attempt | Product/code, batch, intermediate/bulk/finished stage, AR, worksheet/ARD version, analyst, result, OOS link, tested/released timestamps | Test completion or release; product; stage; engine | Dynamic result fields require stable field keys/versioned specifications, not column positions. |
| QC-03 Analyst work queue | S/P | Assigned request/worksheet | Analyst, request, subject, batch, assigned time, status, completed time, waiting age, reassignment evidence | Snapshot or completion period; analyst; test kind | Personal allocation counts are not measured analyst hours/productivity. |
| QC-04 Monitoring and water quality | S/P | Sampling point × scheduled occurrence | Program, point, water/type, scheduled date, pulled/sample time, test reference, result, alert/action limit, period validity, hold status | Due/sample/result date; site; point; program | Separate missed sampling from failed results; never count a held water period as usable. |
| QC-05 Quality master/document coverage | W/S/P | Material/product × required definition | Material/product/code, department, specification, STP, ARD/worksheet, revision/status, effective date, missing prerequisite | Current snapshot; subject type; department | Product readiness exists; complete material and controlled-version coverage needs review. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| Testing turnaround | Median and P90 of sampled/received-to-approved-result, per test family | P; choose one start event and consistent completed cohort. |
| Testing backlog | Open sampled/assigned/testing requests, with age bands and oldest timestamp | S/P; current ATR backlog exists but engine/status/date coverage needs verification. |
| Confirmed OOS rate | Confirmed valid OOS attempts / evaluable completed attempts | G; distinguish suspected, invalidated and confirmed OOS; retain retests separately. |
| On-time scheduled sampling | Occurrences sampled by due time / evaluable scheduled occurrences due in period | P; monitoring occurrence/due evidence, not count of forms submitted. |

Sources: backend `QcWorksheets/{TestRequest,WorksheetTemplate,Specification,OosCase,Coa,MonitoringProgram,WaterQuality}`,
legacy ARD/specification/STP entities, `ReportRepository.GetQcDashboardReport`;
desktop `qc-*`, material/product STP/specification/ARD and analytical requests.

## 03. Production planning and execution

Flow: product definitions → schedule/batch → copied steps and material planning →
BMR/ATR/stock operations → final packing → FGTN. A schedule header, its product
batch, activity, stage and final-packing line have different grains.

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| PD-01 Plan and readiness | W | Planned product/market/packing grouping with batch IDs | Schedule, department, product/code, market, packing, full/half batch equivalents, expected yield, packs/shippers/loose, definition checks | Schedule-overlap range or month; department | Configuration readiness is not available-stock or approval readiness. |
| PD-02 Batch and step progress | S/P | Batch × activity step | Schedule/batch/product, operation/order, assigned people/resources, planned start/end, actual start/end, current status, delay, blockers | Schedule/completion period or snapshot; department; operation | Do not join step rows then sum batch output repeatedly. |
| PD-03 Material requirement reconciliation | S/G | Batch × material × allocation | Configuration/version, required quantity/unit, selected substitute, reserved quantity/location, requisition/revision, issued, consumed, returned, remaining variance | Snapshot or named movement period; batch; material kind | Reconcile all sources first; repair snapshots/release markers are a separate rollout dependency. |
| PD-04 Yield and final packing | S/G | Final-packing event × batch/packing | Product/batch, full/half, expected basis, actual packed, samples, gain/loss, unit, conversion, variance, packing time | Final-packing event date; product; department; style | Current yield query uses packing masters; pin expected basis and confirm half-batch/pack units. |
| PD-05 Extra materials and returns | S/P | Extra issue/return line | Batch, material, request/reason, approved amount, issued amount/unit, returned amount, return type, stock/warehouse references, people/times | Issue or return date; department; material; reason | Returned stock is not automatically usable until its own acceptance workflow. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| On-time batch completion | Completed activities ending by scheduled deadline / evaluable completed activities in completion period | S; existing schedule-adherence query; assess rescheduling/history and cancelled scope. |
| Output volume | Packed output by product and compatible unit in packing period | S; preserve batch IDs and avoid company-wide mixed-unit totals. |
| Yield attainment | Actual usable packed amount / pinned expected amount for the same batches | G; expected baseline, allowance, half batch, samples and pack conversion must reconcile. |
| Material variance | Issued minus accepted returns minus accounted consumption/output usage, per material/unit/batch | G; define all ledger relationships before expressing a loss rate. |

Sources: `ProductionSchedule`, `ProductionActivity/Step`, `FinalPacking`,
requisitions/transfers/returns; backend production KPI queries and
`ProductionScheduleRepository`; desktop `schedules`, `activities`, `production-transfers`.

## 04. Warehouse materials

Flow: receiving/checklist → GRN/quarantine → QC decision → distribution → shelf
putaway → reservation/issue/transfer → returns/adjustments/expiry. Stock status,
physical shelf quantity and commitment quantity must stay distinct.

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| WH-01 Material stock and valuation | W/S | Material/batch/shelf, or declared summary | Material/code, batch, department/warehouse/location, stock status, on hand, reserved, available-to-promise, unit, cost/currency/basis | Current or supported historical snapshot; type; material; warehouse | Existing quantity/value outputs need unit/cost-source reconciliation; do not value using selling price. |
| WH-02 Expiry and retest exposure | S/P | Batch/shelf | Material/code, batch, warehouse/shelf, expiry/retest dates, days remaining, usable quantity/unit, risk band, value if supported | Snapshot; expiry range; material kind; warehouse | Unknown expiry is its own exception; expired and quarantined are not available supply. |
| WH-03 Receiving and putaway register | S | Receipt/checklist/batch/putaway event | Delivery/GRN, material/batch, arrival, checklist, QC release, distributed, shelf assigned, quantity/unit, locations, responsible users | Named receiving/putaway event; warehouse; stage | Arrival→GRN is receiving time; arrival→usable shelf is a different duration. |
| WH-04 Stock movement and traceability | S | Ledger movement | Material/batch, source document, movement kind, event time, source/destination, in/out quantity/unit, balance, actor, reversal/reference | Movement date; material/batch; warehouse; kind | Require running-balance opening position and exact posted/reversed semantics. |
| WH-05 Commitments, issues and adjustments | S/G | Reservation/issue/adjustment line | Batch/material, physical allocation, reserved, issue/approval evidence, counted/corrected quantities, reasons, release/consumption marker | Snapshot or issue/adjustment event; department; stock kind | Legacy reservation deletion is ambiguous; source data and repair rollout must be reconciled. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| Shelf occupancy | Shelves with qualifying stock / eligible shelf slots at snapshot | S; existing capacity KPI measures occupied shelves, not mass/volume capacity. |
| Receipt-to-usable-stock time | Median/P90 of usable shelf timestamp minus arrival timestamp | P/G; inspect available QC and shelf event evidence and current overload semantics. |
| Expiry exposure | Distinct at-risk batches and quantities/value by expiry band, material and unit/currency | S; never pool unlike quantities into one risk amount. |
| Inventory accuracy | Counted stock matching tolerance / independently counted eligible lines | G; a stock balance or adjustment alone is not proof of a physical count. |

Sources: material batches/shelves/reservations, bin cards, GRNs, stock issues and
adjustments; `WarehouseStockReports`, `WarehouseDashboardKpiDto`,
`ReportRepository` warehouse detail/KPI queries; desktop warehouse feature modules.

## 05. Procurement and supplier relationships

Flow: requisition → sourcing/RFQ → quotations/comparison → approved PO →
invoicing/receipt. Supplier qualification/performance is separate from vendors
used by general stores/services.

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| PR-01 Requisition-to-order funnel | S/P | Requisition line with linked PO lines | Request/reference/date, department, material/unit, required, sourced, ordered, received, outstanding, supplier, approval/status/times | Request/order period or open snapshot; supplier; kind; department | Partial orders/receipts need line-level reconciliation; PO headers are not demand quantities. |
| PR-02 Supplier/material qualification | W/S | Supplier × manufacturer × material mapping | Supplier/manufacturer, material/code, pack/unit options, approval/requalification/certificate expiry, contact/address | Snapshot; supplier; manufacturer; material; validity | Missing validity is unknown; do not equate manufacturer and supplier qualification. |
| PR-03 Supplier delivery and quality scorecard | S/G | Supplier × evaluation period, with delivery/batch detail | Eligible deliveries, promised/actual date, on-time count, evaluated/rejected batches, component rates, weights, score, data warnings | Receipt/delivery evaluation period; supplier; material | Existing performance source exposes components; promised-date changes and denominator completeness need review. |
| PR-04 PO and supplier spend | W/S | PO/invoice line and supplier/currency summary | Supplier, PO, material/unit, ordered/invoiced/received quantity, unit price, currency, value, date, approved settlement links | Declare PO, invoice or payment date; supplier; currency | Ordered, invoiced and paid spend are separate measures; no cross-currency sum without valid FX. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| Procurement lead time | Median approved-demand-to-PO and PO-to-receipt durations, separately | P; authoritative approval/receipt timestamps and partial fulfilment policy. |
| Supplier on-time delivery | On-time evaluated deliveries / eligible deliveries with valid promised and actual dates | S/G; expose excluded/missing-date count; do not silently grade missing dates as late. |
| Supplier batch rejection | Rejected evaluated batches / eligible finally decided batches | S/G; batch denominator, quality outcome and period must match; not quantity-based rejection. |

Sources: requisitions, sourcing/quotation/PO models; supplier certification,
pricing/performance records; supplier spend/performance controller endpoints;
desktop procurement and supplier-compliance modules.

## 06. Inbound logistics

Flow: supplier invoice → foreign shipment or local waybill → clearance/billing
sheet → arrival → material distribution/warehouse receipt.

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| LG-01 Shipment and waybill register | W/S | Delivery document | Invoice/PO references, supplier, foreign/local, delivery ref, current stage, arrival/clearance dates, materials, quantities/units, destination | Named stage date or snapshot; supplier; status; route | One delivery can cover several lines; status and physical receipt are distinct. |
| LG-02 Clearance charges and payments | S/P | Billing-sheet charge | Shipment/billing sheet, charge type, amount/currency, free-time dates, payment reference/date/status, outstanding | Charge or approved payment date; shipment; currency; type | Pending payment approval is not settled; currencies remain separate. |
| LG-03 Transit and clearance delays | S/P | Delivery/stage interval | Delivery, stage start/end, expected deadline, free days, actual duration, delay, owner, missing timestamps | Arrival/clearance period or open snapshot; foreign/local; supplier | Complete stage history and expected-date evidence must be confirmed. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| Transit/clearance duration | Median/P90 per completed named stage interval | P; incomplete stages appear as age/backlog, not completed duration. |
| Demurrage paid/accrued | Qualifying demurrage charges by currency and approved settlement status | P; distinguish recorded charges from forecast exposure. |
| Inbound completion | Fully physically received eligible delivery lines / lines due in agreed cohort | G; Arrived status alone does not establish complete receipt. |

Sources: shipment invoices/documents, waybills, billing sheets/charges/payments,
checklists/GRNs; `ShipmentReportDto`, logistics dashboard; inbound logistics docs.

## 07. Finished goods, customer orders and CRM

Flow: final packing → accepted FGTN → stock → customer order/quotation →
allocation/packing list → invoice → loading/delivery → receipt settlement.

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| FG-01 Product stock and expiry | W | Product/batch/location | Product/code, batch, warehouse/department, accepted on hand, allocated, remaining, unit/pack style, manufacturing/expiry | Current/supported snapshot; product; warehouse; expiry | Pack/shipper/loose definitions must reconcile before combining stock. |
| FG-02 Production-to-FG transfer | W/S | FGTN line/batch | FGTN, product/batch, from/to department/warehouse, quantity/unit, packing, created/accepted dates, approval status | FGTN creation or acceptance date; product; warehouse | Approved/accepted transfer and generated final packing are separate events. |
| FG-03 Customer order fulfilment/dispatch | W/S/P | Order line × allocation | Customer/order, product/packing, ordered, allocated, packed, invoiced, loaded, delivered, balance, due/actual dates, invoice refs | Agreed order/due/dispatch/delivery period; customer; status | Separate partial allocations and delivery confirmation; avoid duplicate order totals across batches. |
| FG-04 Customer pricing and quotation coverage | S/P | Customer × product × packing agreement/quote line | Customer, product/code, packing, source agreement/list price, currency, validity, discounts, quote status, resolved price | Active-on snapshot or quotation period; customer; currency | Retain applied price/source evidence; current price is not necessarily historical invoice price. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| Customer on-time delivery | Eligible orders/lines delivered by committed deadline / eligible delivered cohort | P/G; agree order versus line and validate promised/actual dates. |
| Fill rate | Delivered compatible quantity / requested quantity at agreed service deadline | P; per product/unit and partial-delivery policy, not allocated quantity alone. |
| Accepted output awaiting dispatch | Accepted usable FG less qualifying allocations/dispatch, by product/unit | S/P; prove inventory/dispatch quantities reconcile. |

Sources: FGTN/product stock and invoiced-product report DTOs, production-order
allocation models, customer quotations/agreements, invoices and packing lists.

## 08. Finance, cashflow and costing

Current costing primarily manages product selling prices and agreements. It is
not evidence of a complete manufacturing cost or general-ledger subsystem.

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| FI-01 Payment/receipt register | S | Payment/receipt | Reference, payable type/document, party, direction, payment date, amount/currency, method, status, approval/reversal, base conversion evidence | Payment date; direction; party; status; currency | Posted/approved versus pending/rejected amounts must be separate. |
| FI-02 AP and AR ageing | S | Outstanding document/party/currency | Document, party, due date, original amount, approved settlements, outstanding, currency, rate/date/base amount, ageing band, warnings | Explicit supported as-of; party; currency; payable type | Unknown due dates/rates retain their exception buckets; not zero debt. |
| FI-03 Projected cashflow | S | Due bucket × direction/currency | Due bucket, receivable/payable balance, overdue, 7/30/60/90-day amounts, FX evidence, unknown due dates | Supported as-of; direction; currency | Existing summary is projected outstanding inflow/outflow, not bank balance or realized cash. |
| FI-04 Selling-price history | S | Product price or customer agreement version | Product/code, customer/packing if applicable, price, currency, effective date/validity, source, changed person if captured | Effective-on or change period; product; customer; currency | Gross margin needs independent cost-of-sales evidence; do not infer it from list prices. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| Overdue receivables/payables | Outstanding finally recognized balances past valid due date, by currency/base with valid FX | S; retain unknown due/rate warnings. |
| Approved cash in/out | Sum qualifying approved receipt/payment amounts in payment period | P; establish exact posting/reversal/approval semantics first. |
| Forecast coverage | Due balances with valid due date and usable currency rate / eligible outstanding balances | P; expose original-currency components and denominator. |

Sources: `Payments/{PaymentReports,PaymentRegister,PaymentDtos}`, payment controller,
customer/supplier balances, `Costing/ListPrice`, finance-costing and cashflow docs.

## 09. General inventory and stores

Stores/Vendors/Items form a distinct stock subsystem from production materials.
Reports must not join them by names or reuse material-batch status meanings.

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| ST-01 Item stock and reorder | W/S | Item × store/location | Item/code, store, classification/category, unit, on hand, reserved if supported, reorder/minimum, shortfall, last movement | Current/supported snapshot; store; item; classification | Confirm current versus available quantity; retain recoverable/nonrecoverable scope. |
| ST-02 Store procurement and issue ledger | S/P | Item receipt/issue/return movement | Request/PO/GRN/issue refs, item, vendor, department/employee, quantity/unit, balance, movement date/person, approved state | Movement date; store; item; department; vendor | Purchases, requests and physical movements have separate grains. |
| ST-03 Recoverable item custody | S/P | Issue/custody line | Item/asset identifier if stored, issued-to person/department, issued/returned quantity, dates, condition, due date if captured, outstanding | Snapshot or issue/return date; holder; store | Quantity tracking does not prove per-asset serial/location history or a return deadline. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| Items below reorder | Eligible stock lines at/below threshold at snapshot | S; component quantity/unit and threshold visible. |
| Outstanding recoverables | Issued less accepted returns at custody-line grain | P; trace issue/return links before summing. |
| Physical-count accuracy | Correct independently counted lines / eligible count lines | G; requires counted quantity, count time and tolerance evidence. |

Sources: items/general inventory, item procurement/GRN/transaction/stock requisition,
recoverable-item reports; desktop `general-inventory`, `store-*`, `return-items`.

## 10. Services and work execution

Flow: service memo/job request → quotations/proforma/comparison/award → assigned
execution → acknowledgement/start/completion → verification/approval and costs.

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| SV-01 Service/work register | S/P | Job request/execution | Job reference, service, requester/department, assigned employee/contractor, assigned/acknowledged/start/completed dates, status, verification/approval | Named request/completion date or snapshot; service; assignee; department | A completed job may still await verification or approval. |
| SV-02 Quote and award comparison | S/P | Vendor quote line linked to award | Memo/request, service, vendor, quoted/awarded amount, currency, terms, approval, award reference/date | Quote/award date; service; vendor; currency | Lowest price only within comparable currencies/scope; retain reasons and actual award. |
| SV-03 Job consumption and cost | S/P | Job × consumed item/approved charge | Job, item/quantity/unit, labour evidence if present, approved vendor charge, currency, total by component, verification | Consumption/approved charge period; job; service | Do not manufacture labour cost from assignment durations or unverified estimates. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| Work cycle time | Median assignment/start-to-completion and completion-to-verification, separately | P; consistent completed cohort and missing-date counts. |
| Verification backlog | Completed executions awaiting required verification/approval at snapshot | S/P; workflow eligibility determines open status. |
| Preventive/reactive work mix | Qualifying planned/reactive jobs / categorized eligible jobs | G; category and planned-work evidence must be confirmed before this KPI. |

Sources: service memos/proformas/quotations, job requests/orders/executions,
consumed items, contractors and services dashboard DTOs.

## 11. HR, attendance and leave

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| HR-01 Workforce/headcount | W/S | Employee and declared department summary | Staff number, name, department, employment/active status, type/grade, designation, hire/exit date, snapshot count | Supported snapshot; department; employment type; status | Employee master current status does not by itself reconstruct historical headcount. |
| HR-02 Attendance and shift exceptions | W/S | Employee × scheduled work date/shift | Staff number/name, department, schedule/shift, expected hours, recorded in/out/hours, absence/leave, exception reason | Work date; department; shift | Expected worker/shift population, not all active employees, is the denominator. |
| HR-03 Leave and overtime | W/S | Leave/overtime request/period line | Employee, type, entitlement/requested/approved/used/balance hours/days, request dates, approval/person/status | Leave/work/decision date selector; department; type; status | Pending requests are not leave used or approved overtime payable. |
| HR-04 Hiring, exits and turnover | W/S | Employee employment movement | Staff number, department, joined/exited date, recorded movement kind, employment type, period counts | Hire/exit period; department; employment type | Define opening/closing workforce and rehire/transfer policy; avoid exposing unnecessary sensitive reasons. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| Active headcount | Distinct qualifying employees at supported snapshot | S; employer/site/employment rules and historical coverage required. |
| Attendance rate | Attended eligible shifts / scheduled eligible shifts | S/G; review existing calculation against shift/leave/holiday definitions. |
| Turnover | Eligible exits / average eligible opening and closing headcount | S/P; business agreement on exits and denominator; N/A if history absent. |

Sources: employee, attendance, shift, leave/overtime and staff requisition models;
HR report/KPI DTOs and existing HR workbench; restricted employee permissions.

## 12. Payroll and performance workflows

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| PY-01 Payroll register and bank advice | S | Employee payslip within run | Payroll period/run, staff number/name/department, basic, allowances/additions, gross, statutory contributions, tax, deductions, net, approval/status | Payroll period; run; department; status | Use frozen run/payslip amounts; bank identifiers stay restricted to authorized bank advice. |
| PY-02 Payroll run reconciliation | S/P | Run with employee-detail drill-through | Run/period, headcount, gross/net, PAYE/SSNIT/tier components, additions/deductions, approval stages and time, variances | Run period/approval date; status | Reconcile details to header totals; legacy `PayrollRuns` and `HrPayrollRuns` are different systems. |
| PY-03 Goals and review completion | S/P | Employee × cycle/review | Cycle, employee/manager, goals/weights, due dates if captured, self/manager submission, status, approved outcome if authorized | Review cycle; department; manager; status | Protect individual ratings/comments; workflow completion is not a model-derived judgement of employee worth. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| Approved payroll totals | Sum frozen approved run amounts by period and component | S; separate draft/approved populations and currency where applicable. |
| Payroll reconciliation exceptions | Mismatched run/detail totals and missing required setup rows | P; do not silently exclude people with calculation errors. |
| Review completion | Finally completed required reviews / eligible required reviews in cycle | P; define eligible roster and final status; not average individual performance. |

Sources: payroll run/payslip/compensation DTOs, payroll register/bank-advice
endpoints, performance cycles/goals/reviews; HR payroll migration guide.

## 13. Research and development

Backend source includes projects, formulations, trials, analytical methods,
stability studies and technology transfers. Do not infer full desktop coverage
from the R&D navigation group or historical design briefs.

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| RD-01 Project portfolio | S/P | R&D project | Code/title, product, department, requester, status, target launch, approval, linked formulation/trial/transfer, open blockers | Current snapshot or approved milestone event; department; status | Actual milestone history and baseline target changes need tracing. |
| RD-02 Formulation and trial register | S/P | Trial batch × formulation version | Project/product, formulation/version, trial reference/quantity/unit, execution dates, status, outcomes, analytical method/specification, review | Trial/review period; project; product; version | No pooled trial yield or first-pass success without a defined pass criterion. |
| RD-03 Stability pulls and transfer readiness | S/P | Study pull point; separate transfer detail | Project/trial/study, chamber, start, timepoint, due/pulled date, result summary, status; transfer reference/check outcomes separately | Pull due/sample date; chamber; project; study | Pull-point due dates exist; analytical results and transfer completion are different grains. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| Overdue stability pulls | Due occurrences not fulfilled by valid pull event at snapshot | P; overdue occurrence grain, not count of whole studies. |
| Trial first-pass success | Successful first attempts / eligible completed trials | G; needs accepted criteria and ordered attempt history. |
| Technology-transfer throughput | Distinct finally accepted transfers in completion period | P; confirm final acceptance event and required evidence. |

Sources: backend `RndProjects`, `RndFormulations`, `RndTrialBatches`,
`RndAnalyticalMethods`, `RndStabilityStudies`, `RndTechnologyTransfers` and controllers.

## 14. Quality audits and CAPA

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| AU-01 Audit register | S | Quality audit | Audit reference/type/focus, department/site, planned/actual dates if stored, team/owner, status, closure evidence, finding counts | Planned/executed/closed selector; department; type | An audit PDF exists; a date-range cross-audit register is separate. |
| AU-02 Findings and corrective actions | S/P | Finding linked to CAPA | Audit, finding/title/clause/severity, raised person/time, status, root cause, action, responsible person, due/closed dates, overdue age | Raised/due/closed date or snapshot; severity; owner | Count findings and actions separately; one finding can have dependent action evidence. |
| AU-03 CAPA effectiveness | S/P | Corrective action effectiveness decision | CAPA/finding/audit, action owner, closure time, effectiveness outcome, verified person/date, notes/evidence | Effectiveness decision period; owner; outcome | Closed is not automatically verified effective. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| Overdue CAPA | Eligible open actions past due at snapshot | P; exclude finally closed actions, retain missing due-date exceptions. |
| Finding/CAPA closure time | Median/P90 valid close minus raised time, at matching grain | P; define reopening policy and completed cohort. |
| Verified effectiveness | Actions explicitly verified effective / evaluated effectiveness decisions | P; pending verification stays outside denominator and visible separately. |

Sources: `QualityAudits/{QualityAudit,AuditFinding,AuditCorrectiveAction}` DTOs,
audit report endpoint and quality-audit workflow/migration guide.

## 15. IT support, users and access

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| IT-01 Ticket service register | S/P | Ticket | Ticket/title, category/priority, requester/department/site, assigned to/time, due, done/closed times, status, reopen count | Opened/done/closed or snapshot; priority; assignee; site | Done and closed differ; distinguish first versus final resolution after reopen. |
| IT-02 User/role access matrix | S/P | User × role × permission/action | User ID/name, enabled state, department, role, permission key/module, granted types, effective scope, provenance if captured | Current snapshot; user; role; department | Role names never prove access; do not export secrets or infer absent grant history. |
| IT-03 Application activity and approvals audit | S/P | Recorded event | Event/time, actor, module/action, document/reference, outcome, revision/correlation, changed field evidence where captured | Event date; module; action; actor | Activity logs are not proof of complete security telemetry or every database write. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| Ticket resolution time | Median/P90 created-to-defined done/closed event in completed cohort | P; final versus first completion must be explicit. |
| Reopened ticket rate | Tickets with recorded reopen in cohort / eligible resolved tickets | P; current reopen count needs event history for period attribution. |
| Account/access review exceptions | Enabled accounts without required ownership/department or agreed access review evidence | P/G; classify exceptions for human review, no automatic permission removal. |

Sources: ticket DTO/activity, users/roles/permission types, approval stages,
activity-log controller and desktop access-management/support modules.

## 16. Master data, controlled setup and system settings

This is a supporting review area, not a licence to put confidential setup into
the broad Reports permission. Domain owners retain their configuration decisions.

| ID / report | Status | One row | Columns to agree/use | Date basis and filters | Gap or governing rule |
| --- | --- | --- | --- | --- | --- |
| MD-01 Product/material definition readiness | W/S | Subject × required definition/version | Code/name, owning department, unit, BOM/packaging/procedure, specification/STP/ARD, effective/version status, missing checks | Current or captured-version snapshot; kind; department | Presence, approval, effective status and operational applicability are separate checks. |
| MD-02 Partner qualification expiry | S/P | Supplier/manufacturer certificate/qualification | Party/type, material scope, approval, validity/requalification, certificate/type/reference, expiry, owner, days remaining | Snapshot or validity range; party; type | Do not merge supplier/manufacturer/vendor identities by name. |
| MD-03 Controlled configuration changes | S/G | Recorded version/change decision | Subject/type, old/new version/hash, authored/reviewed/approved/effective times and people, reason, impacted batches if linked | Change/approval/effective period; domain; actor | Historical values/impact links may not exist; never backfill attribution from the current editor. |

| KPI candidate | Definition and basis | Evidence/readiness |
| --- | --- | --- |
| Definition completeness | Subjects satisfying an agreed required checklist / eligible in-scope subjects | W/P; distinguish configured, approved/effective and could-not-verify. |
| Qualifications nearing expiry | Distinct active qualification records within agreed window | S/P; unknown validity separately counted, thresholds chosen by business. |
| Change traceability coverage | Controlled changes with required before/after/reason/approvals / known controlled changes | G; denominator requires a trustworthy change event population. |

Sources: product/material masters, procedures, units, supplier/manufacturer
qualification, controlled STP/formula/worksheet revisions, approval settings and
activity history. See the [module manifest register](source-inventory.md).

## Cross-module reports to defer until source reconciliation

| Candidate | Required joins | Why not implement first |
| --- | --- | --- |
| Batch genealogy and material-to-customer trace | Saved batch configuration → physical material lots/issues/consumption → tests/decisions → final packing → FGTN → customer allocation/dispatch | Grain, unit, substitute, return, repair and reversal lineage must be demonstrated per module. |
| Order-to-cash cycle | Accepted order/quote → allocation → dispatch/delivery → invoice → approved receipt | Partial orders, due-date baselines, FX and settlement allocation change both duration and amounts. |
| Manufacturing margin / inventory turns / OEE | Reconciled inventory and production plus actual cost ledger, baseline values, runtime/downtime and ideal-cycle evidence | Current pricing, stock snapshots and assignments do not establish these inputs. Treat as data-gap studies, not ready KPIs. |

## Next module review

Start with QA-01 through QA-06 and their detailed specification. Agree which
reports users need first, exact period/event meanings and restricted columns.
Only accepted reports move to implementation. Keep the remaining catalogue as
a source-anchored backlog and expand its specifications as each module is studied.
