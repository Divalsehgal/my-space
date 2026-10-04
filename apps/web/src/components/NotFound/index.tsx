import StatusPage from "@/components/StatusPage";
import Button from "@dival-sehgal/ui/button";
import { ArticleIcon, HomeIcon } from "@dival-sehgal/ui/icons";
import { getT } from "@/i18n/server";

export default function NotFoundComponent() {
  const t = getT();
  return (
    <StatusPage
      watermark="404"
      title={t("notFound.title")}
      description={t("notFound.description")}
      actions={
        <>
          <Button href="/" size="large" startIcon={<HomeIcon />}>
            {t("notFound.home")}
          </Button>
          <Button href="/blogs" size="large" variant="outlined" startIcon={<ArticleIcon />}>
            {t("notFound.blog")}
          </Button>
        </>
      }
    />
  );
}
