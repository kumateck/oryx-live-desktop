# Unique BMR batch numbers

Saving a BMR number already held by another record reports “Batch number …
already exists”. The confirmation stays open with the server's error, all entered
details are retained, and issue is not called. Cancel the confirmation, enter a
different number and confirm again. Surrounding spaces and case do not bypass
the backend check; numbers are limited to 100 characters.

A record may keep its own number. A previous number is released only when the
old BMR is retired by the activated full-production-return workflow, with a
cancelled production batch and matching full-return evidence. Partial returns,
deletion or cancellation alone do not release it. Warehouse receipt completion
is separate from activation. Once another BMR claims it, it cannot be used again
unless that production also goes through full return.

The backend checks create, edit and issue under a shared transaction lock and
preserves prior BMR/return history. No existing batch is automatically renumbered.
