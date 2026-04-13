/**
 * Branded HTML email wrapper for marketing campaigns.
 * Clean, personal style — max-width 600px, system fonts, optional hero image.
 */

interface WrapOptions {
  /** Campaign body HTML */
  bodyHtml: string;
  /** Optional hero image URL (full-width, from R2/images.macalister.nz) */
  heroImageUrl?: string;
  /** Unsubscribe URL (signed JWT link) */
  unsubscribeUrl: string;
}

export function wrapCampaignEmail({ bodyHtml, heroImageUrl, unsubscribeUrl }: WrapOptions): string {
  const heroBlock = heroImageUrl
    ? `<tr><td style="padding:0">
        <img src="${heroImageUrl}" alt="" style="display:block;width:100%;max-width:600px;height:auto;border-radius:4px 4px 0 0" />
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Macalister Photography</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;line-height:1.6">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f4">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:4px;overflow:hidden">
          ${heroBlock}
          <tr>
            <td style="padding:32px 32px 24px 32px">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px 32px;border-top:1px solid #e5e5e5">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#737373;text-align:center">
                    <p style="margin:0 0 8px 0;font-weight:600;color:#1a1a1a">Macalister Photography</p>
                    <p style="margin:0 0 4px 0">hello@macalister.nz</p>
                    <p style="margin:0 0 16px 0">Wellington, New Zealand</p>
                    <p style="margin:0">
                      <a href="${unsubscribeUrl}" style="color:#737373;text-decoration:underline;font-size:12px">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate a plain-text version from HTML body for multipart emails.
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
