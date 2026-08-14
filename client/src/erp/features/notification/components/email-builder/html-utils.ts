import type { EmailElement } from './EmailBuilderContext'
import type { TemplateSettings } from './EmailBuilderContext'

function stylesToString(styles?: Record<string, string>): string {
  if (!styles) return ''
  return Object.entries(styles)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ')
}

/**
 * Generates a full HTML email document from an array of EmailElements.
 * Uses table-based layout for email client compatibility and inline styles.
 */
export function generateEmailHtml(
  elements: EmailElement[],
  templateSettings?: Partial<TemplateSettings>
): string {
  const elementsHTML = elements.map(element => {
    switch (element.type) {
      case 'heading':
        return `<h2 style="${stylesToString(element.styles)}">${element.content || 'Heading'}</h2>`
      case 'text':
        return `<div style="${stylesToString(element.styles)}">${element.content || 'Text content'}</div>`
      case 'image': {
        const imgHref = element.properties?.href
        const imgTag = `<img src="${element.content || 'https://via.placeholder.com/600x300'}" alt="${element.properties?.alt || 'Email image'}" style="${stylesToString(element.styles)}" />`
        return imgHref ? `<a href="${imgHref}">${imgTag}</a>` : imgTag
      }
      case 'button':
        return `<div style="text-align: center; padding: 10px 20px;"><a href="${element.properties?.href || '#'}" target="${element.properties?.target || '_blank'}" style="${stylesToString(element.styles)}">${element.content || 'Button'}</a></div>`
      case 'divider':
        return `<hr style="${stylesToString(element.styles)}" />`
      case 'spacer':
        return `<div style="${stylesToString(element.styles)}"></div>`
      case 'social': {
        const platforms = element.properties?.platforms || []
        const socialLinks = platforms.map((platform: string) =>
          `<a href="#" style="display: inline-block; width: 32px; height: 32px; background-color: #007bff; border-radius: 50%; text-align: center; line-height: 32px; color: white; text-decoration: none; margin: 0 5px;">${platform.charAt(0).toUpperCase()}</a>`
        ).join('')
        return `<div style="${stylesToString(element.styles)}"><div style="margin-bottom: 10px;">${element.content}</div><div style="text-align: center;">${socialLinks}</div></div>`
      }
      case 'footer':
        return `<div style="${stylesToString(element.styles)}">${element.content || 'Footer content'}</div>`
      default:
        return ''
    }
  }).join('\n          ')

  const subject = templateSettings?.subject || 'Email Template'

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <tr>
              <td>
                ${elementsHTML}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/**
 * Parses previously generated email HTML to extract the EmailElement array.
 * HTML parsing is complex — the jsonContent approach should be used instead.
 * Returns null as a stub; callers should prefer JSON-based round-tripping.
 */
export function parseEmailHtml(_html: string): EmailElement[] | null {
  return null
}
