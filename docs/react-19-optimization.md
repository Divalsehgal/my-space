React 19 rendering control means separating urgent user input from expensive UI work so interaction latency does not inherit render latency.

## Transitions (priority)
Attack: Synchronous fan-out — every keystroke drives expensive filtering, navigation, or hydration-sensitive UI at input priority.
Fix: Keep input state urgent and move derived work into a transition.

```js
// ❌ input and expensive work share priority
setQuery(next);
setResults(searchIndex(next));

// ✅ results can be interrupted
setQuery(next);
startTransition(() => setResults(searchIndex(next)));
```

| **Concept** | **Notes** |
|---|---|
| Urgent update | Text input, focus, pointer state |
| Transition update | Search results, route views, expensive tabs |
| Interruption | Stale render work can be abandoned |

**`useTransition`** — marks render work as non-urgent, not optional.

**Input state** — keep it outside the transition.

**Derived UI** — defer it only when intermediate stale states are acceptable.

## Actions (lifecycle)
Attack: Split form state — pending, error, success, and response data drift because each is updated manually.
Fix: Put the mutation lifecycle behind `useActionState`.

```js
// ❌ lifecycle can desync
setPending(true);
const result = await submit(formData);
setError(result.error);
setPending(false);

// ✅ lifecycle follows the action
const [state, action, pending] = useActionState(submit, initialState);
return <form action={action} />;
```

| **State** | **Owner** | **Failure mode** |
|---|---|---|
| `pending` | React | Double-submit windows shrink |
| `state` | Action result | UI reflects server outcome |
| `formData` | Browser | No JSON mirror required |

**Action result** — return serializable state the UI can render directly.

**Pending flag** — disable submit paths, not validation visibility.

**Server boundary** — validate again inside the action.

## Status (composition)
Attack: Prop-drilled pending — nested controls depend on manually threaded loading props.
Fix: Read form status at the component that needs it.

```js
// ❌ every parent forwards pending
function SubmitButton({ pending }) {
  return <button disabled={pending}>Save</button>;
}

// ✅ nearest form provides status
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Save</button>;
}
```

| **Component** | **Dependency** | **Result** |
|---|---|---|
| Form shell | Owns action | Smaller public API |
| Button | Reads status | No prop chain |
| Fieldset | Reads status | Local disabled state |

**Nearest form** — status is scoped to the enclosing form.

**Reusable control** — the button can move between forms without new props.

**Pending scope** — one form should not freeze unrelated forms.

## Context (consumption)
Attack: Hook rigidity — context reads create wrapper components only to satisfy top-level hook constraints.
Fix: Use React's `use` where conditional resource consumption simplifies the component.

```js
// ❌ wrapper exists only to read context
function Gate(props) {
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
| `useContext` | Standard context read |
| `use` | Can read supported resources conditionally |
| Suspense | Promise reads still need a boundary |

**Conditional read** — use it only when the branch is part of the component contract.

**Promise read** — do not create fresh promises during render.

**Provider value** — keep broad context values stable.

## Critical Chain
Order matters because responsiveness fails when urgent state, deferred state, and mutation lifecycle all share one implicit lane.

    Keystroke updates expensive derived state synchronously
      -> render work blocks the interaction path
      -> form lifecycle is tracked by hand
      -> submit controls drift from real status
      -> users retry because the UI looks idle
      -> duplicate work reaches the server
