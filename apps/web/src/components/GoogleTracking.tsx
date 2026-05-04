import Script from "next/script";

interface GoogleTrackingProps {
  gaId?: string;
  adsId?: string;
  gtmId?: string;
}

export default function GoogleTracking({ gaId, adsId, gtmId }: GoogleTrackingProps) {
  return (
    <>
      {(gaId || adsId) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId || adsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              ${gaId ? `gtag('config', '${gaId}', { page_path: window.location.pathname, send_page_view: true });` : ""}
              ${adsId ? `gtag('config', 'AW-${adsId.includes("-") ? adsId.split("-")[1] : adsId}');` : ""}
            `}
          </Script>
        </>
      )}
      {gtmId && gtmId.startsWith("GTM-") && (
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}
        </Script>
      )}
    </>
  );
}
