# Proof Server Collab Notes

## Scope

This folder owns Proof’s server runtime, including live collab persistence and fragment-to-markdown projection (`collab.ts`).

## Critical Compatibility Rule

- Projection derivation must accept both Milkdown snake_case node names and Tiptap camelCase node names.
- Current normalization path lives in `deriveMarkdownProjectionFromFragment` via `getMilkdownCompatibleProjectionFragment`.
- Required mappings include at least:
  - `orderedList -> ordered_list`
  - `bulletList -> bullet_list`
  - `listItem -> list_item`
  - `taskList -> bullet_list`
  - `taskItem -> list_item`

## Why This Exists

- Tiptap and Milkdown use different node names for several block types.
- Without normalization, `yXmlFragmentToProseMirrorRootNode` drops unknown nodes during projection.
- Symptom pattern: `Projection markdown shrank by >80%` or `Projection markdown emptied unexpectedly` after list/task input (for example `1.` + space).

## Regression Safety

- `src/tests/collab-tiptap-node-name-compat.test.ts` validates fragment projection for camelCase list nodes.
- If list/task projection regresses, inspect:
  - `deriveMarkdownProjectionFromFragment`
  - `TIPTAP_TO_MILKDOWN_NODE_NAME`
  - any schema or parser changes in `server/milkdown-headless.ts`.
