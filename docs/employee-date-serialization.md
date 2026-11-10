# Employee calendar dates

Employee profile edits send calendar dates as ISO strings with a four digit
year and UTC midnight. This preserves existing year-one values such as
`0001-01-01T00:00:00Z` when the user saves the profile in Africa/Accra.

The editor regression opens an existing profile with year-one birth and
employment dates and asserts the exact dates in its update request. Run
from `apps/web`:

```sh
TZ=Africa/Accra bun x vitest run src/modules/employees/employee-integrity.test.ts src/modules/employees/employee-editor.test.tsx
```

The existing `CanUpdateEmployeeInfo` permission covers the save. The fix
requires no backend migration and no stored employee date rewrite.
