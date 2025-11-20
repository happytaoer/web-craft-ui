/**
 * AI Service - Deep Infra API Integration
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface StreamOptions {
  onChunk: (text: string) => void
  onComplete: () => void
  onError: (error: Error) => void
}

class AIService {
  private apiKey: string
  private baseUrl = 'https://api.deepinfra.com/v1/openai'
  private model: string

  constructor() {
    this.apiKey = import.meta.env.VITE_DEEP_INFRA_API_KEY || ''
    this.model = import.meta.env.VITE_DEEP_INFRA_MODEL || 'meta-llama/Meta-Llama-3.1-70B-Instruct'
  }

  /**
   * Get base system prompt
   */
  private getSystemPrompt(): string {
    return `You are a professional Python web scraping assistant. Your task is to help users create spider code that conforms to the BaseSpider specification.

## Spider Specification

1. Must inherit from BaseSpider class
2. Must define the following fields:
   - name: str (spider name, lowercase letters, numbers, underscores)
   - start_url: str (starting URL)
3. Must implement parse method:
   \`\`\`python
   def parse(self, raw_content: str, context: ParseContext) -> Dict[str, Any]:
       # Parsing logic
       pass
   \`\`\`

## Available Tools

- lxml.html.fromstring() - Parse HTML
- XPath expressions - Extract data
- tree.xpath('//div[@class="title"]/text()') - Example

## Code Template

\`\`\`python
from typing import Dict, Any
from lxml import html
from spiders.core.base_spider import BaseSpider, ParseContext


class MySpider(BaseSpider):
    name = "my_spider"
    start_url = "https://example.com"
    
    def parse(self, raw_content: str, context: ParseContext) -> Dict[str, Any]:
        tree = html.fromstring(raw_content)
        
        # Extract data
        data = {
            "title": tree.xpath('//h1/text()')[0] if tree.xpath('//h1/text()') else None,
        }
        
        return data
\`\`\`

## Important Notes

1. Generate complete spider class code
2. Use XPath to extract data
3. Handle possible null values (use conditional statements or try-except)
4. Add comments in Chinese
5. Ensure code can run directly

Please generate code based on user requirements.`
  }

  /**
   * Get system prompt with HTML context
   */
  private getSystemPromptWithHTML(htmlContent: string, url: string): string {
    // Truncate HTML (avoid exceeding token limit)
    const htmlPreview = htmlContent.substring(0, 6000)
    
    return `You are a professional Python web scraping assistant. The user wants to scrape the following webpage:

Target URL: ${url}

Page HTML content (partial):
\`\`\`html
${htmlPreview}
\`\`\`

## Your Task

1. **Carefully analyze the HTML structure above**
2. Based on user requirements, use XPath or CSS selectors to extract data
3. Generate spider code that conforms to BaseSpider specification

## Spider Specification

Must include the following structure:

\`\`\`python
from typing import Dict, Any
from lxml import html
from spiders.core.base_spider import BaseSpider, ParseContext


class MySpider(BaseSpider):
    name = "spider_name"  # lowercase letters, numbers, underscores
    start_url = "${url}"
    
    def parse(self, raw_content: str, context: ParseContext) -> Dict[str, Any]:
        tree = html.fromstring(raw_content)
        
        # Extract data
        data = {}
        
        return data
\`\`\`

## Important Tips

1. **Carefully analyze the HTML structure provided above**, find the correct tags and attributes
2. Use accurate XPath expressions, for example:
   - \`tree.xpath('//div[@class="title"]/text()')\`
   - \`tree.xpath('//span[@id="price"]/text()')\`
3. **Must handle null values**, use the following pattern:
   \`\`\`python
   title_list = tree.xpath('//h1/text()')
   title = title_list[0] if title_list else None
   \`\`\`
4. Returned data must be in dictionary format
5. Add Chinese comments to explain each extraction step

Please generate code based on user requirements.`
  }

  /**
   * Stream chat
   */
  async streamChat(
    messages: ChatMessage[],
    options: StreamOptions,
    customSystemPrompt?: string
  ): Promise<void> {
    try {
      const systemPrompt = customSystemPrompt || this.getSystemPrompt()

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              options.onComplete()
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                options.onChunk(content)
              }
            } catch (e) {
              // 忽略 JSON 解析错误
            }
          }
        }
      }

      options.onComplete()
    } catch (error) {
      console.error('AI stream chat error:', error)
      options.onError(error as Error)
    }
  }

  /**
   * 带 HTML 上下文的流式聊天
   */
  async chatWithHTML(
    messages: ChatMessage[],
    htmlContent: string,
    url: string,
    options: StreamOptions
  ): Promise<void> {
    const systemPrompt = this.getSystemPromptWithHTML(htmlContent, url)
    return this.streamChat(messages, options, systemPrompt)
  }

  /**
   * 非流式聊天（一次性返回）
   */
  async chat(messages: ChatMessage[], customSystemPrompt?: string): Promise<string> {
    try {
      const systemPrompt = customSystemPrompt || this.getSystemPrompt()

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          stream: false,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || ''
    } catch (error) {
      console.error('AI chat error:', error)
      throw error
    }
  }

  /**
   * 快速生成爬虫代码
   */
  async generateSpiderCode(params: {
    description: string
    targetUrl?: string
    spiderName?: string
    htmlContent?: string
  }): Promise<string> {
    const prompt = `请帮我生成一个爬虫代码：

需求描述：${params.description}
${params.targetUrl ? `目标网站：${params.targetUrl}` : ''}
${params.spiderName ? `爬虫名称：${params.spiderName}` : ''}

请直接生成完整的 Python 代码，包含完整的类定义。`

    const systemPrompt = params.htmlContent && params.targetUrl
      ? this.getSystemPromptWithHTML(params.htmlContent, params.targetUrl)
      : this.getSystemPrompt()

    return this.chat([{ role: 'user', content: prompt }], systemPrompt)
  }
}

export const aiService = new AIService()
