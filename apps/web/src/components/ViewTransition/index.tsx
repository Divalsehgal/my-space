import * as React from "react";

/**
 * React's <ViewTransition> (shipped in the React canary Next bundles). Falls
 * back to a plain fragment where it is missing — e.g. Jest on stable React —
 * so the markup is identical and only the animation is lost.
 */
type Props = Readonly<{ children: React.ReactNode; name?: string; share?: string }>;

const Native = (React as unknown as { ViewTransition?: React.ComponentType<Props> }).ViewTransition;

export default function ViewTransition({ children, ...props }: Props) {
  return Native ? <Native {...props}>{children}</Native> : <>{children}</>;
}
