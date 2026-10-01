# Header search

One search box in the header serves the whole workspace.

- **On a list page** it filters that page's records. The page opts in with `const term = usePageSearch("users", busy)` and passes `term` to its query (server lists) or filter (client lists). The header then reads "Search users" and shows a spinner while the page is fetching.
- **On any page** it also lists matching pages to open.
- **Shortcuts:** Ctrl/Cmd+K, or `/` when not typing in a field, focuses it. Escape clears the term, then closes the box.

The term lives in the address as `?q=`. A search therefore survives a reload, can be shared as a link, works with back and forward, and disappears when the user opens another page. Other address parameters, such as a status tab, are kept. Server lists pass the term as `resetKey` to `useServerTable`, so the first request after a change already asks for page 1.

## Compared with Oryx Next

| Oryx Next | Desktop |
| --- | --- |
| One global value in the store, read by every page | The open page registers; a page that takes no search is never filtered and the address is left alone |
| The term stayed when moving to another page, filtering it unexpectedly | The term belongs to the address of the page it was typed on |
| Needed 6 characters before searching | Any length; short codes can be searched |
| Lost on reload | Kept in the address |
| "Searching" inferred by scanning every request's arguments for the term | The page reports its own busy state |
| No way to jump to a page | Matching pages are offered in the same box |
| No keyboard shortcut | Ctrl/Cmd+K and `/` |
