"use client";

import StatusPage from "@/components/StatusPage";
import Button from "@dival-sehgal/ui/button";
import { ErrorIcon, RefreshIcon } from "@dival-sehgal/ui/icons";
import { useT } from "@/i18n/client";

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useT();
  return (
    <StatusPage
      icon={<ErrorIcon fontSize="inherit" />}
      title={t("error.title")}
      description={t("error.description")}
      actions={
        <Button size="large" onClick={() => reset()} startIcon={<RefreshIcon />}>
          {t("error.retry")}
        </Button>
      }
      debug={process.env.NODE_ENV === "development" ? error.stack || error.message : undefined}
    />
  );
}
