import type { Metadata } from "next";
import { cookies } from "next/headers";
import StatusPage from "@/components/StatusPage";
import styles from "./styles.module.scss";
import Button from "@dival-sehgal/ui/button";
import TextField from "@dival-sehgal/ui/text-field";
import { disableOwnerMode, enableOwnerMode } from "@/actions/owner-mode";
import { getT } from "@/i18n/server";
import { OWNER_SESSION_COOKIE, isOwnerModeConfigured, isOwnerSession } from "@/lib/owner";

export function generateMetadata(): Metadata {
  return { title: getT()("meta.ownerTitle"), robots: { index: false, follow: false } };
}

/**
 * Private sign-in for owner mode (not linked anywhere). Plain forms posting to
 * Server Actions: no client JavaScript, and the secret only ever goes to the server.
 */
export default async function OwnerPage({ searchParams }: Readonly<{ searchParams: Promise<{ error?: string }> }>) {
  const t = getT();
  const { error } = await searchParams;
  const signedIn = isOwnerSession((await cookies()).get(OWNER_SESSION_COOKIE)?.value);

  if (!isOwnerModeConfigured()) {
    return <StatusPage title={t("owner.title")} description={t("owner.notConfigured")} />;
  }

  return (
    <StatusPage
      title={t("owner.title")}
      description={signedIn ? t("owner.descriptionOn") : t("owner.descriptionOff")}
      actions={
        signedIn ? (
          <form action={disableOwnerMode} className={styles["owner-form"]}>
            <Button type="submit" size="large" variant="outlined">
              {t("owner.signOut")}
            </Button>
          </form>
        ) : (
          <form action={enableOwnerMode} className={styles["owner-form"]}>
            <TextField
              label={t("owner.secret")}
              name="secret"
              type="password"
              required
              autoComplete="current-password"
              error={Boolean(error)}
              helperText={error ? t("owner.error") : undefined}
            />
            <Button type="submit" size="large">
              {t("owner.signIn")}
            </Button>
          </form>
        )
      }
    />
  );
}
