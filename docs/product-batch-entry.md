# Product batch entry and specification selection

Set **Batch stem** in Product Info to prefill the start of the batch number in
Issue BMR. For a stem of `LJK`, enter `098` to issue `LJK098`. The confirmation
shows the full number. Clear the stem in Product Info to return to the regular
batch number field for future issues. Product edit and BMR issue use their
existing permissions. Apply the backend's `AddProductBatchStem` migration and
deploy that backend before activating the desktop release.

In **New product specification**, the Products field shows the full name of
each selected product. The field expands when names wrap. Browser checks used
two long selections at 1366, 1280 and 420 pixels.
