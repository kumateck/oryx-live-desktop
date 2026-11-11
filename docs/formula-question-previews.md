# Approved formula previews

Questions and the template question picker show the effective approved formula
returned by the backend library read. Percentage formulas include the saved
multiplication by 100, matching the editor. The shared preview parser supports
the current percentageResults flag and the legacy percent flag. An explicit
current false value takes precedence over the legacy flag.

A successful approval refreshes the shared question list cache used by Questions
and the template picker. A refused approval keeps the previous preview. Draft editing still uses the revision editor. Deploy the
companion backend before activating this desktop release.

After rollout, open Settings → Questions and search for the question. Compare its
configuration with the approved revision in Edit. Approval does not change the
original creation date used by the list's default ordering.

This change keeps the existing question, template and formula approval access
rules and API contract. It performs no stock, answer, approval or historical
snapshot repair. The backend implementation report describes the read projection
and its PostgreSQL regression checks.
