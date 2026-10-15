## Export Software Frontend

Built on top of [fe-zen-arch](git@github.com:shivamkj/fe-zen-arch.git) — the core shared architecture for B2B SaaS frontends.

### Libraries

- **React** [Docs](https://react.dev/reference/react)
- **Tailwind CSS** [Docs](https://tailwindcss.com/docs/installation)
- **React Query** [Docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- **React Hook Form** [Docs](https://www.react-hook-form.com/get-started)
- **Zustand** [Docs](https://zustand.docs.pmnd.rs/)

### Setup

```bash
git submodule update --init   # fe-zen-arch (use an HTTPS URL if you have no GitHub SSH key)
pnpm install
pnpm dev                      # dev server on port 5173
pnpm lint                     # prettier + tsc + eslint (fe-zen-arch lint pipeline)
pnpm build                    # production build
```

### Notes

- `core`, `ui`, `auth`, `icons` are fe-zen-arch workspace packages, aliased via tsconfig paths & vite aliases.
- Forms are built directly with `useForm` from `core/form` + `Form` / `SubmitButton` from `core/form/components` — no generic form templates.
- Routing uses fe-zen-arch's zustand router: routes defined in `src/shared/routes.tsx`, paths in `src/shared/route-paths.ts`.
- Don't use react-query mutation for react-hook-form submit handler.
- For HMR (hot refresh), the file must export only react component, and not any other constant or object.
- While most input elements use `...register('name')`, custom elements like select require `<Select<T> name="name" />` instead.

---

## Refactoring overview

The starter had a single 1,760-line form component, two competing data sources (a localStorage "demo store" and a
service that called a LAN backend and silently fell back to a different seed list), hardcoded option arrays imported
straight into components, and two different payload mappers. The refactor keeps every user-facing feature and
reorganises the code into clear layers.

### Structure

```
src/
  services/                      ← the only data-access boundary the UI uses
    api-types.ts                   contracts (Exporter, ShippingBill, ShippingBillSummary, Option…)
    shipping-bill-service.ts       list / get / saveDraft / submit / flat file
    party-service.ts               exporters, businesses (by role), branches, create
    reference-data-service.ts      code lists, ports, document types, shipping marks
    shipping-bill-payload.ts       form values → backend request body (single mapper)
    query-keys.ts                  react-query cache keys
    mock-server/                   fake backend — never imported by UI code
      handlers.ts                  one function per endpoint (route noted above each)
      mock-request.ts              latency, failure injection, response cloning
      database.ts, seed.ts, data/  persisted tables + seed + customs code lists
      flat-file.ts                 .sb flat-file generation (a backend concern)
  shipping-bills/
    model/                         types, defaults, pure domain rules (no React, no I/O)
    queries.ts                     react-query hooks + option sources for searchable selects
    parties/party-dialogs.tsx      "add party" / "add branch" dialogs
    form/
      shipping-bill-page.tsx       route: loads the bill (loading / not found / error)
      shipping-bill-editor.tsx     form setup, tabs, draft save, submit
      bill-schema.ts               validation rules
      sections/                    details, invoices (+ charges, items), others
      components/                  SearchSelect, ReferenceSelect, DecimalInput, layout pieces
  dashboard/list-dashboard.tsx     list with loading / error / empty states, flat-file download
```

### Mock services (API-ready)

- Every service function is `async` and returns a Promise; the body is a one-liner such as
  `return mockRequest(() => api.listBills())`. Switching to a real backend means replacing that line with a call to
  `core/request` (e.g. `request<ShippingBillSummary[]>({ url: '/api/shipping-bills', method: 'GET' })`). Signatures and
  return types stay the same, so no component changes.
- `mockRequest` adds 175–525 ms latency, deep-clones responses (the UI can never mutate "server" state by reference) and
  can fail on purpose. Errors are `InternalError`s, so fe-zen-arch's retry rules and error rendering apply unchanged.
- Try the error states from the browser console, then reload:
  - `localStorage.setItem('mock-api:failure-rate', '0.5')` – fail half of all requests (`'1'` = always)
  - `localStorage.setItem('mock-api:latency-ms', '2000')` – slow network
  - `localStorage.removeItem('export-software-mock-db-v3')` – reset data to the seed
- Components read data only through react-query (`useQuery`) — loading, error (with retry) and empty states are handled
  in the dashboard, the bill page, every reference-data select and every searchable select.

### Form & state handling

- One react-hook-form instance per bill; sections read the fields they need with `useWatch` instead of watching the whole
  form at the top (the old editor re-rendered everything on every keystroke).
- All three tabs stay mounted (hidden) so the whole bill is validated on submit; on failure the editor jumps to the first
  tab with an error.
- "Save & Next" / "Previous" save an unvalidated **draft**; "Save changes" validates and saves a **complete** bill
  together with the backend payload.
- Fields whose options are still loading are not rendered yet (a read-only placeholder is shown), so saved values are
  never cleared by a temporarily disabled control.
- The party + branch pair (exporter, consignee, buyer, third parties) is one reusable `PartyFields` component that owns
  its "add new" dialogs; changing the party clears the branch.

### Domain assumptions and rules

- **Contract type ↔ charges**: customs value is assessed on FOB, so freight is required for CF/CIF and insurance for
  CI/CIF (as a % rate or an amount, never both). "Price includes" defaults from the contract type when left blank.
- **Weights**: net weight cannot exceed gross weight.
- **Items**: RITC (HS) code must be 8 digits; quantity and unit price > 0; item total defaults to quantity × price.
  Drawback details appear (and become required) only for schemes with drawback / RoDTEP / RoSCTL; taxable value and
  IGST amount only when IGST is paid.
- **Invoice total**: optional declared total; a warning (not an error) is shown when it differs from the sum of items.
- **Containers**: ISO 6346 format and check digit; a hint is shown when cargo is containerized but no container is
  listed. The number-of-containers field is derived from the list when containers are entered.
- **Ports**: loading ports are Indian; countries are derived from the port code prefix (UN/LOCODE); discharge port
  defaults to the destination.
- **Job number**: assigned by the server on first save when left blank; must be unique (409 otherwise).
- Backend field names in the payload (including spellings such as `packging_list`) are treated as an existing
  contract and kept as is.

### Bugs fixed along the way

- Decimal values (e.g. unit price `3.831`, rate `0.5`) were rejected by the browser's native `step=1` check on
  `type="number"` inputs, which silently blocked submit when the field was on a hidden tab → `DecimalInput`.
- Buyer and third-party pickers searched consignees; they now search businesses by role.
- "Unit of rate" placeholder read `items[invoiceIndex]` instead of `items[itemIndex]` (crash with fewer items than invoices).
- After saving an existing bill the form stayed disabled (`isSubmitSuccessful`); it is now reset with the saved values.
- Bills created in the form never appeared in the list (two separate stores).
- Starter TypeScript errors (`pnpm lint` failed before any change) are gone.

### Not done / next steps

- Unit tests for `model/calculations.ts`, `bill-schema.ts` and the payload mapper (no test runner is in the allowed
  dependencies, so I did not add one).
- Editing existing parties/branches (the starter had unused edit code paths, removed as dead code).

---

## AI Usage & Approach

- **Tools**: Claude Code (Anthropic) as a pair programmer in the terminal and its in-app browser for manual testing.
- **How I used it**: reading the starter and the fe-zen-arch sources to map out the problems, proposing the layering
  (services ↔ mock-server ↔ UI), drafting components, and running `tsc` / ESLint / Prettier plus click-through checks
  of the main flows (list, edit, draft save, submit, validation tab-jump, add branch dialog, error state via failure
  injection).
- **My judgment**: kept fe-zen-arch's conventions (schema-by-leaf-name, `Form` error handling, `withRetry`, no
  react-query mutation for the submit handler) instead of replacing them; avoided new dependencies; preferred a few
  focused components over a generic form builder; kept domain rules modest and documented the assumptions above.
- **Validation & learnings**: every flow above was exercised in the browser. The most useful finding was the hidden
  native-validation bug on decimal number inputs, which only showed up while testing — a reminder to verify behaviour
  in the running app rather than trusting that the code "looks right".
