React 19 rendering control means separating urgent user input from expensive UI work so interaction latency does not inherit render latency.

## Transitions (priority)
Attack: Synchronous fan-out — every keystroke drives expensive filtering, navigation, or hydration-sensitive UI at input priority.
Fix: Keep the input update urgent and move derived work into a transition.

```js
// ❌ input and expensive work share priority
setQuery(next);
setResults(searchIndex(next));

// ✅ input stays urgent, results can be interrupted
setQuery(next);
startTransition(() => {
  setResults(searchIndex(next));
});
```

| **Concept** | **Notes** |
|---|---|
| Urgent update | Text input, pointer state, focus, selection |
| Transition update | Search results, route views, expensive tabs |
| Interruption | React can abandon stale transition work |

**`useTransition`** — marks non-urgent rendering, not non-urgent data correctness.

**Input state** — keep it outside the transition so typing never waits on derived UI.

**Derived UI** — safe to defer when stale intermediate states are acceptable.

## Actions (lifecycle)
Attack: Split form state — pending, error, success, and response data drift because each is updated manually.
Fix: Put the mutation lifecycle behind `useActionState` so the action result is the source of truth.

```js
// ❌ lifecycle can desync
setPending(true);
const result = await submit(formData);
setError(result.error);
setPending(false);

// ✅ lifecycle is coupled to the action
const [state, action, pending] = useActionState(submit, initialState);
return <form action={action} />;
```

| **State** | **Owner** | **Failure mode** |
|---|---|---|
| `pending` | React | Double-submit windows shrink |
| `state` | Action result | UI reflects server outcome |
| `formData` | Browser | No JSON mirror required |

**Action result** — return serializable state the UI can render directly.

**Pending flag** — use it for disabling submit paths, not for hiding validation.

**Server boundary** — validate again inside the action; client state is advisory.

## Status (composition)
Attack: Prop-drilled pending — submit buttons and nested fields depend on manually threaded loading props.
Fix: Read form status at the component that needs it.

```js
// ❌ every parent must forward pending
function SubmitButton({ pending }) {
  return <button disabled={pending}>Save</button>;
}

// ✅ status comes from the nearest form
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Save</button>;
}
```

| **Component** | **Dependency** | **Result** |
|---|---|---|
| Form shell | Owns action | Small public API |
| Button | Reads status | No prop chain |
| Fieldset | Reads status | Local disabled state |

**Nearest form** — `useFormStatus` resolves against the enclosing form, not a global store.

**Reusable controls** — status-aware controls can move between forms without new props.

**Pending scope** — one form submission should not freeze unrelated forms.

## Context (consumption)
Attack: Hook rigidity — context reads are wrapped in extra components or custom hooks only to satisfy top-level hook constraints.
Fix: Use React's `use` where conditional resource consumption makes the component simpler.

```js
// ❌ wrapper exists only to read context
function ToastGate(props) {
  const toast = useContext(ToastContext);
  return props.enabled ? <Child toast={toast} /> : null;
}

// ✅ consume where the branch needs it
if (enabled) {
  const toast = use(ToastContext);
  toast.success("Saved");
}
```

| **Token** | **Notes** |
|---|---|
| `useContext` | Standard context read, hook rules apply |
| `use` | Can read supported resources in conditional paths |
| Suspense | Promise reads still need a boundary |

**Conditional read** — use it only when the condition is part of the component contract.

**Promise read** — do not create fresh promises during render.

**Context shape** — keep provider values stable or memoized when consumers are broad.

## Critical Chain
Order matters because responsiveness fails when urgent state, deferred state, and mutation lifecycle all share one implicit lane.

    Keystroke updates expensive derived state synchronously
      -> render work blocks the main interaction path
      -> pending state is managed by hand
      -> submit controls drift from real form status
      -> users retry because the UI looks idle
      -> duplicate work reaches the server
