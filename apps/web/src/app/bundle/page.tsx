import type { Metadata } from "next";
import clsx from "clsx";
import Breadcrumbs from "@/components/Breadcrumbs";
import FluidContainer from "@/components/FluidContainer";
import reportJson from "@/generated/bundle-report.json";
import {
  formatBytes,
  formatDelta,
  moduleDeltas,
  routeDeltas,
  routeSizes,
  sharedChunks,
  sumChunks,
  MODULE_THRESHOLD_RAW,
  ROUTE_THRESHOLD_GZIP,
  type BundleReport,
  type Delta,
} from "@/lib/bundle-report";
import styles from "./styles.module.scss";

const report = reportJson as BundleReport;
const TOP_MODULES = 20;
// Developer tooling page: English only, so the copy lives here instead of in the Contentful translations.
const TEXT = {
  title: "Bundle report",
  noBaseline: "—",
  added: " (new)",
  removed: " (removed)",
  smaller: "smaller modules",
  shared: "Shared by every route",
  routes: "Routes",
  flaggedCount: "Flagged increases",
  route: "Route",
  firstLoad: "First load (gzip)",
  raw: "Raw",
  routeOnly: "Route-only (gzip)",
  deltaGzip: "Δ gzip",
  changedModules: "Changed modules",
  noChange: "No module changed size.",
  startTracking: "Commit this report to start tracking changes.",
  module: "Module",
  now: "Now",
  before: "Before",
  delta: "Δ",
  perRoute: "What each route loads",
  rawSuffix: "raw",
  onTop: "raw on top of shared",
  nothingExtra: "Nothing beyond the shared bundle.",
  gzip: "gzip",
};
const TOP_CHANGED = 40;

// Developer tooling, not content: keep it out of search (and it's not in the sitemap).
export const metadata: Metadata = {
  title: TEXT.title,
  robots: { index: false, follow: false },
};

function DeltaCell({ delta }: Readonly<{ delta: Delta }>) {
  if (delta.previous === null) {
    return <span className={styles.muted}>{TEXT.noBaseline}</span>;
  }
  return (
    <span
      className={clsx(delta.delta > 0 && styles.up, delta.delta < 0 && styles.down, delta.flagged && styles.flagged)}
    >
      {formatDelta(delta.delta)}
      {delta.previous === 0 && delta.size > 0 ? TEXT.added : ""}
      {delta.size === 0 ? TEXT.removed : ""}
    </span>
  );
}

/** Sorted horizontal bars: a lighter, JS-free stand-in for a treemap. */
function ModuleBars({ modules }: Readonly<{ modules: Record<string, number> }>) {
  const sorted = Object.entries(modules).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, TOP_MODULES);
  const rest = sorted.slice(TOP_MODULES).reduce((sum, [, bytes]) => sum + bytes, 0);
  const max = top[0]?.[1] ?? 1;
  return (
    <ol className={styles.bars}>
      {top.map(([name, bytes]) => (
        <li key={name} className={styles.bar}>
          <span className={styles["bar__label"]} title={name}>
            {name}
          </span>
          <span className={styles["bar__track"]}>
            <span className={styles["bar__fill"]} style={{ width: `${(bytes / max) * 100}%` }} />
          </span>
          <span className={styles["bar__value"]}>{formatBytes(bytes)}</span>
        </li>
      ))}
      {rest > 0 && (
        <li className={clsx(styles.bar, styles.muted)}>
          <span className={styles["bar__label"]}>{`${sorted.length - TOP_MODULES} ${TEXT.smaller}`}</span>
          <span />
          <span className={styles["bar__value"]}>{formatBytes(rest)}</span>
        </li>
      )}
    </ol>
  );
}

export default function BundlePage() {
  const { current, baseline } = report;
  const shared = sharedChunks(current);
  const sharedSizes = sumChunks(current, shared);
  const sizes = routeSizes(current);
  const routes = routeDeltas(report);
  const changedModules = moduleDeltas(report).filter((d) => d.delta !== 0);

  return (
    <div className={`page-scroll ${styles.page}`}>
      <Breadcrumbs items={[{ label: TEXT.title, href: "/bundle" }]} />
      <FluidContainer as="section" className={styles["page__body"]}>
        <h1 className={styles.title}>{TEXT.title}</h1>
        <p className={styles.muted}>
          {`First-load JavaScript per route from the production build of ${new Date(current.generatedAt).toUTCString()}`}
          {baseline ? `, compared with the build of ${new Date(baseline.generatedAt).toUTCString()}. ` : " (no baseline yet). "}
          {`Increases of ${formatBytes(ROUTE_THRESHOLD_GZIP)} gzip per route or ${formatBytes(MODULE_THRESHOLD_RAW)} per module are flagged. `}
          {"Module sizes are minified bytes attributed through source maps."}
        </p>

        <dl className={styles.stats}>
          <div>
            <dt>{TEXT.shared}</dt>
            <dd>{`${formatBytes(sharedSizes.gzip)} ${TEXT.gzip}`}</dd>
          </div>
          <div>
            <dt>{TEXT.routes}</dt>
            <dd>{sizes.size}</dd>
          </div>
          <div>
            <dt>{TEXT.flaggedCount}</dt>
            <dd>{routes.filter((d) => d.flagged).length + changedModules.filter((d) => d.flagged).length}</dd>
          </div>
        </dl>

        <h2 className={styles.heading}>{TEXT.routes}</h2>
        <div className={styles["table-wrap"]}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{TEXT.route}</th>
                <th scope="col">{TEXT.firstLoad}</th>
                <th scope="col">{TEXT.raw}</th>
                <th scope="col">{TEXT.routeOnly}</th>
                <th scope="col">{TEXT.deltaGzip}</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((delta) => {
                const size = sizes.get(delta.name);
                return (
                  <tr key={delta.name} className={clsx(delta.flagged && styles["row--flagged"])}>
                    <th scope="row">
                      <code>{delta.name}</code>
                    </th>
                    <td>{formatBytes(delta.size)}</td>
                    <td>{size ? formatBytes(size.raw) : TEXT.noBaseline}</td>
                    <td>{size ? formatBytes(size.gzip - sharedSizes.gzip) : TEXT.noBaseline}</td>
                    <td>
                      <DeltaCell delta={delta} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h2 className={styles.heading}>{TEXT.changedModules}</h2>
        {changedModules.length === 0 ? (
          <p className={styles.muted}>{baseline ? TEXT.noChange : TEXT.startTracking}</p>
        ) : (
          <div className={styles["table-wrap"]}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{TEXT.module}</th>
                  <th scope="col">{TEXT.now}</th>
                  <th scope="col">{TEXT.before}</th>
                  <th scope="col">{TEXT.delta}</th>
                </tr>
              </thead>
              <tbody>
                {changedModules.slice(0, TOP_CHANGED).map((delta) => (
                  <tr key={delta.name} className={clsx(delta.flagged && styles["row--flagged"])}>
                    <th scope="row">
                      <code>{delta.name}</code>
                    </th>
                    <td>{formatBytes(delta.size)}</td>
                    <td>{formatBytes(delta.previous ?? 0)}</td>
                    <td>
                      <DeltaCell delta={delta} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className={styles.heading}>{TEXT.perRoute}</h2>
        <details className={styles.details} open>
          <summary>
            {TEXT.shared} <span className={styles.muted}>{`${formatBytes(sharedSizes.raw)} ${TEXT.rawSuffix}`}</span>
          </summary>
          <ModuleBars modules={sharedSizes.modules} />
        </details>
        {current.routes.map(({ route, chunks }) => {
          const own = sumChunks(current, chunks.filter((c) => !shared.includes(c)));
          return (
            <details key={route} className={styles.details}>
              <summary>
                <code>{route}</code> <span className={styles.muted}>{`+${formatBytes(own.raw)} ${TEXT.onTop}`}</span>
              </summary>
              {own.raw ? <ModuleBars modules={own.modules} /> : <p className={styles.muted}>{TEXT.nothingExtra}</p>}
            </details>
          );
        })}
      </FluidContainer>
    </div>
  );
}
