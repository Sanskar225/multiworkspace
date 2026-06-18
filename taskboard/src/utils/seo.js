import { useEffect } from 'react'

const DEFAULTS = {
  title: 'Ledger — Multi-Workspace Task Board',
  description: 'Organize team work across boards, columns, and tasks.'
}

function setMetaTag(selector, attr, value) {
  const el = document.querySelector(selector)
  if (el) el.setAttribute(attr, value)
}

/**
 * Updates document.title and the Open Graph / Twitter meta tags declared in
 * index.html so a page — most importantly a public board — gets a real title
 * and description when it's pasted into Slack, iMessage, or a social post.
 *
 * Caveat documented in the engineering notes: this is a client-rendered SPA,
 * so these tags are only present once JavaScript runs. Most chat apps and
 * search engines do execute JS before generating a preview, but a handful of
 * older/strict crawlers don't. The honest fix for 100% coverage is
 * server-side rendering or prerendering the public routes — out of scope
 * here, called out as a known trade-off.
 */
export function useDocumentMeta({ title, description, type = 'website' } = {}) {
  useEffect(() => {
    const finalTitle = title || DEFAULTS.title
    const finalDescription = description || DEFAULTS.description

    document.title = finalTitle
    setMetaTag('meta[name="description"]', 'content', finalDescription)
    setMetaTag('#og-title', 'content', finalTitle)
    setMetaTag('#og-description', 'content', finalDescription)
    setMetaTag('#og-type', 'content', type)

    return () => {
      document.title = DEFAULTS.title
      setMetaTag('meta[name="description"]', 'content', DEFAULTS.description)
      setMetaTag('#og-title', 'content', DEFAULTS.title)
      setMetaTag('#og-description', 'content', DEFAULTS.description)
      setMetaTag('#og-type', 'content', 'website')
    }
  }, [title, description, type])
}

/**
 * Injects (and cleans up) a JSON-LD <script> block describing the board as
 * structured data, so an automated reader (search engine, link unfurler)
 * gets an explicit machine-readable model of the content - not just prose -
 * without needing to parse the rendered DOM.
 */
export function useStructuredData(getJsonLd, deps = []) {
  useEffect(() => {
    const data = getJsonLd()
    if (!data) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(data)
    script.dataset.injectedBy = 'ledger-seo'
    document.head.appendChild(script)
    return () => script.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
