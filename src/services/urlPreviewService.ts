/**
 * URL Preview Service - Fetch HTML content from target webpage
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080/api/v1'

export interface PagePreview {
  url: string
  statusCode: number
  title: string
  htmlContent: string
  htmlPreview: string
  contentLength: number
  encoding: string
  success: boolean
  errorMessage?: string
}

class URLPreviewService {
  /**
   * Fetch page content via backend API
   */
  async fetchPageContent(url: string): Promise<PagePreview> {
    try {
      // Call backend API to fetch page content
      const apiUrl = `${API_BASE_URL}/fetch-url?url=${encodeURIComponent(url)}`
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch page')
      }

      const data = result.data
      const htmlContent = data.html_content

      // Generate HTML preview
      const htmlPreview = this.formatHTMLPreview(htmlContent)

      return {
        url: data.url,
        statusCode: data.status_code,
        title: data.title,
        htmlContent,
        htmlPreview,
        contentLength: data.content_length,
        encoding: data.encoding,
        success: true
      }
    } catch (error) {
      console.error('Failed to fetch page:', error)
      return {
        url,
        statusCode: 0,
        title: '',
        htmlContent: '',
        htmlPreview: '',
        contentLength: 0,
        encoding: '',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Format HTML preview (beautify display)
   */
  private formatHTMLPreview(html: string): string {
    try {
      // Remove script and style tags
      let cleaned = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

      // Compress whitespace
      cleaned = cleaned.replace(/\s+/g, ' ')

      // Add newlines between tags
      cleaned = cleaned.replace(/>\s*</g, '>\n<')

      // Truncate to first 3000 characters
      cleaned = cleaned.substring(0, 3000)

      // Simple indentation
      const lines = cleaned.split('\n')
      let indent = 0
      const formatted = lines.map(line => {
        const trimmed = line.trim()
        if (!trimmed) return ''

        // Decrease indent for closing tags
        if (trimmed.startsWith('</')) {
          indent = Math.max(0, indent - 2)
        }

        const result = ' '.repeat(indent) + trimmed

        // Increase indent for opening tags
        if (trimmed.startsWith('<') && 
            !trimmed.startsWith('</') && 
            !trimmed.endsWith('/>') &&
            !trimmed.match(/<(br|hr|img|input|meta|link)/i)) {
          indent += 2
        }

        return result
      }).filter(line => line).join('\n')

      return formatted
    } catch (error) {
      console.error('Failed to format HTML:', error)
      return html.substring(0, 3000)
    }
  }

  /**
   * Analyze HTML structure
   */
  analyzeHTMLStructure(html: string): {
    hasTitle: boolean
    hasTables: boolean
    hasLists: boolean
    commonClasses: string[]
    commonIds: string[]
    headings: string[]
  } {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      // Extract common classes
      const classes = new Set<string>()
      doc.querySelectorAll('[class]').forEach(el => {
        const classList = el.getAttribute('class')
        if (classList) {
          classList.split(/\s+/).forEach(cls => {
            if (cls && cls.length > 0) {
              classes.add(cls)
            }
          })
        }
      })

      // Extract common IDs
      const ids = new Set<string>()
      doc.querySelectorAll('[id]').forEach(el => {
        const id = el.getAttribute('id')
        if (id) {
          ids.add(id)
        }
      })

      // Extract headings
      const headings: string[] = []
      doc.querySelectorAll('h1, h2, h3').forEach(h => {
        const text = h.textContent?.trim()
        if (text) {
          headings.push(text)
        }
      })

      return {
        hasTitle: !!doc.querySelector('title'),
        hasTables: !!doc.querySelector('table'),
        hasLists: !!doc.querySelector('ul, ol'),
        commonClasses: Array.from(classes).slice(0, 10),
        commonIds: Array.from(ids).slice(0, 10),
        headings: headings.slice(0, 5)
      }
    } catch (error) {
      console.error('Failed to analyze HTML:', error)
      return {
        hasTitle: false,
        hasTables: false,
        hasLists: false,
        commonClasses: [],
        commonIds: [],
        headings: []
      }
    }
  }
}

export const urlPreviewService = new URLPreviewService()
