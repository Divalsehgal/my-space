import React from "react";

interface GTMNoScriptProps {
  gtmId?: string;
}

export default function GTMNoScript({ gtmId }: GTMNoScriptProps) {
  if (!gtmId || !gtmId.startsWith("GTM-")) {
    return null;
  }

  return (
    <noscript>
      <iframe
        title="Google Tag Manager"
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
