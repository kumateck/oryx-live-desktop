# Saved drafts required for test submission

ATR, material-batch, and rework test entry share the same submission gate.
Every field, including fields assigned to other analysts and fields marked
optional in the template, must have a complete saved answer before submission.
This retains the existing worksheet-wide completion requirement and adds an
explicit save requirement. Submit results no longer saves drafts implicitly.

The button stays disabled for incomplete answers, unsaved edits, pending saves,
or failed saves. Its adjacent message identifies the first field that needs
attention. The validated submit callback repeats the checks, so keyboard or
programmatic form submission cannot bypass the button. Clearing a previously
saved text answer is incomplete; the old saved value does not satisfy the
current answer. Controls are disabled during final submission.

A nonempty formula JSON string alone is insufficient. The input checks cover
configured weights, sample inputs, reading rows/cells, manual variable values,
simple formula variables, and the selected uniformity mode's inputs. Zero is
valid input. Optional labels and unused uniformity result properties may be
empty. Table questions require their configured input/select cells. These are
completeness checks; governed formula execution and approval stay authoritative
on the backend.

Successful draft acknowledgments remain scoped to the form and response
context. A missing/null response ID is a failed acknowledgment. Saved file
metadata satisfies a file answer without restoring the browser file input or
uploading the same attachment again. Edits during an upload remain unsaved.

Backend finalization validates saved values before formula execution or
workflow status updates. Its legacy direct-submit endpoint validates input
completeness before storing files or creating response records. Partial drafts
remain saveable, and validation failures preserve them for correction. No API
shape or database migration changes are needed. Deploy both frontend and
backend changes for full enforcement.
