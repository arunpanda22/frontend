/**
 * Parses the `image_guidelines` and `a_plus_brief` markdown strings
 * from the catalog generation response into structured per-section data.
 *
 * Both fields use numbered `## Image Prompt N:` / `### N.` headers.
 * We extract headline, sub-headline, image description, and labels per section.
 */

export interface ParsedImageSection {
  index: number        // 1-based, matches section card id
  headline: string
  subheadline: string
  imageDescription: string
  labels: string[]
  styleKeywords: string
  fullPrompt: string   // assembled prompt string to send to API
}

// ─── image_guidelines parser ────────────────────────────────────────────────

/**
 * Splits on `## Image Prompt N:` headers and parses each block.
 */
export function parseImageGuidelines(raw: string): ParsedImageSection[] {
  if (!raw?.trim()) return []

  // Split on top-level image prompt headers
  const blocks = raw
    .split(/^## Image Prompt \d+[:\s]/m)
    .slice(1) // discard text before first header

  return blocks.map((block, i) => {
    const index = i + 1

    const headline     = extractField(block, "Headline")
    const subheadline  = extractField(block, "Sub headline") || extractField(block, "Subheadline") || extractField(block, "Sub-headline")
    const imageDesc    = extractField(block, "Image description") || extractField(block, "Image Description")
    const styleKw      = extractField(block, "Style keywords") || extractField(block, "Style Keywords")
    const labels       = extractLabels(block)

    const fullPrompt = buildImagePrompt({ headline, subheadline, imageDesc, styleKw, labels })

    return { index, headline, subheadline, imageDescription: imageDesc, labels, styleKeywords: styleKw, fullPrompt }
  })
}

// ─── a_plus_brief parser ─────────────────────────────────────────────────────

/**
 * Splits on `### N.` headers and parses each block.
 */
export function parseAplusBrief(raw: string): ParsedImageSection[] {
  if (!raw?.trim()) return []

  // Split on numbered section headers like "### 1. Hero Brand Banner"
  const blocks = raw
    .split(/^### \d+\./m)
    .slice(1)

  return blocks.map((block, i) => {
    const index = i + 1

    const headline     = extractField(block, "Headline")
    const subheadline  = extractField(block, "Description") // a_plus uses "Description" as subtitle
    const imageDesc    = extractNestedField(block, "Image Description") || extractNestedField(block, "Image description")
    const styleKw      = ""
    const labels       = extractOverlayLabels(block)

    const fullPrompt = buildBannerPrompt({ headline, subheadline, imageDesc, labels })

    return { index, headline, subheadline, imageDescription: imageDesc, labels, styleKeywords: styleKw, fullPrompt }
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extracts a bold-label field value: `**Label:** value`
 */
function extractField(block: string, label: string): string {
  const re = new RegExp(`\\*\\*${label}[:\\s*]+\\*\\*[:\\s]*(.+?)(?=\\n|$)`, "i")
  const m = block.match(re)
  if (m) return m[1].replace(/^[""]|[""]$/g, "").trim()

  // Also try without bold: `- **Label**: value` or `- Label: value`
  const re2 = new RegExp(`[-*]?\\s*\\*?\\*?${label}\\*?\\*?[:\\s]+(.+?)(?=\\n|$)`, "i")
  const m2 = block.match(re2)
  return m2 ? m2[1].replace(/^[""]|[""]$/g, "").trim() : ""
}

/**
 * Extracts a nested bullet field value from Design Guidance sub-bullets.
 */
function extractNestedField(block: string, label: string): string {
  // Look for "- Label:" pattern in nested list
  const re = new RegExp(`-\\s+${label}[:\\s]+(.+?)(?=\\n\\s+-|\\n#{1,3}|$)`, "is")
  const m = block.match(re)
  return m ? m[1].replace(/\n\s+-\s+/g, "; ").replace(/\s+/g, " ").trim() : ""
}

/**
 * Extracts `- "Label text"` items from the "Labels on the image" bullet list.
 */
function extractLabels(block: string): string[] {
  // Find the Labels on the image section
  const labelSection = block.match(/\*\*Labels on the image[:\*]+\*\*?([\s\S]*?)(?=\n##|\n\d+\.|\n\*\*|$)/i)
  if (!labelSection) return []

  return labelSection[1]
    .split("\n")
    .map((l) => {
      let text = l.replace(/^\s*[-*]\s*/, "").trim()
      // Extract only the quoted label text if present: "Label text" position context
      const quoted = text.match(/^[""](.+?)[""]/)
      if (quoted) return quoted[1].trim()
      // Otherwise strip trailing position context after a dash or " near"
      return text.replace(/\s+(near|over|above|below|next to|pointing|with an arrow).+$/i, "").trim()
    })
    .filter(Boolean)
}

/**
 * Extracts overlay labels from a_plus_brief sections.
 * Handles both `- **Overlay Labels**: x | y` and `- **Overlay Text**: x | y`
 */
function extractOverlayLabels(block: string): string[] {
  const field = extractField(block, "Overlay Labels") || extractField(block, "Overlay Text") || extractField(block, "Overlay labels")
  if (!field) return []
  return field.split(/[|,]/).map((s) => s.trim()).filter(Boolean)
}

// ─── Prompt builders ─────────────────────────────────────────────────────────

interface PromptParts {
  headline: string
  subheadline: string
  imageDesc: string
  styleKw?: string
  labels: string[]
}

function buildImagePrompt({ headline, subheadline, imageDesc, styleKw, labels }: PromptParts): string {
  const parts: string[] = []
  if (headline)    parts.push(`Headline: "${headline}"`)
  if (subheadline) parts.push(`Subheadline: "${subheadline}"`)
  if (imageDesc)   parts.push(imageDesc)
  if (styleKw)     parts.push(`Style: ${styleKw}`)
  if (labels.length) parts.push(`Include labels: ${labels.join(", ")}`)
  return parts.filter(Boolean).join(". ")
}

function buildBannerPrompt({ headline, subheadline, imageDesc, labels }: Omit<PromptParts, "styleKw">): string {
  const parts: string[] = []
  if (headline)    parts.push(`Banner headline: "${headline}"`)
  if (subheadline) parts.push(subheadline)
  if (imageDesc)   parts.push(imageDesc)
  if (labels.length) parts.push(`Overlay text: ${labels.join(" | ")}`)
  return parts.filter(Boolean).join(". ")
}