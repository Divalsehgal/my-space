import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

/** A stand-in component that renders its props as JSON, for page-level tests. */
export function stub(name: string) {
  function Stub({ children, ...props }: { children?: ReactNode }) {
    return (
      <div data-testid={name} data-props={JSON.stringify(props)}>
        {children}
      </div>
    );
  }
  return { __esModule: true, default: Stub };
}

/** The props a stub was rendered with. */
export const stubProps = (el: HTMLElement) => JSON.parse(el.dataset.props ?? "{}");

/**
 * Server components can nest async components, which the test renderer can't
 * run. This awaits every async function component in the tree first.
 */
export async function resolveServer(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) {return Promise.all(node.map(resolveServer));}
  if (!isValidElement(node)) {return node;}
  const el = node as ReactElement<{ children?: ReactNode }>;
  if (typeof el.type === "function" && el.type.constructor.name === "AsyncFunction") {
    return resolveServer(await (el.type as (p: unknown) => Promise<ReactNode>)(el.props));
  }
  if (el.props?.children === undefined) {return el;}
  const children = await resolveServer(el.props.children);
  // Spread arrays back as positional children so React treats them as static (no key warnings).
  return Array.isArray(children) ? cloneElement(el, undefined, ...children) : cloneElement(el, undefined, children);
}
