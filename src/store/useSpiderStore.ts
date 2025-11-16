import { create } from 'zustand'
import { spiderApi } from '../services/api'
import type { Spider, CrawlResult } from '../types/api'

interface SpiderState {
  spiders: Spider[]
  loading: boolean
  error: string | null
  executingSpiders: Set<string>
  debuggingSpiders: Set<string>
  lastResult: CrawlResult | null
  lastDebugResult: CrawlResult | null
  fetchSpiders: () => Promise<void>
  executeSpider: (spiderId: string) => Promise<CrawlResult | null>
  debugSpider: (spiderId: string) => Promise<CrawlResult | null>
}

export const useSpiderStore = create<SpiderState>((set, get) => ({
  spiders: [],
  loading: false,
  error: null,
  executingSpiders: new Set(),
  debuggingSpiders: new Set(),
  lastResult: null,
  lastDebugResult: null,

  fetchSpiders: async () => {
    set({ loading: true, error: null })
    try {
      const response = await spiderApi.getSpiders()
      if (response.success) {
        // 将 string[] 转换为 Spider[]
        const spiders = response.data.spiders.map((name) => ({
          id: name,
          name: name,
        }))
        set({ spiders, loading: false })
      } else {
        set({ error: response.message, loading: false })
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '获取爬虫列表失败', 
        loading: false 
      })
    }
  },

  executeSpider: async (spiderId: string) => {
    const { executingSpiders } = get()
    
    // 添加到执行中的集合
    const newExecuting = new Set(executingSpiders)
    newExecuting.add(spiderId)
    set({ executingSpiders: newExecuting, error: null })

    try {
      const response = await spiderApi.crawlSingle({
        spider_name: spiderId,
        timeout: 30,
      })

      if (response.success) {
        set({ lastResult: response.data })
        return response.data
      } else {
        set({ error: response.message })
        return null
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '执行爬虫失败'
      })
      return null
    } finally {
      // 从执行中的集合移除
      const updatedExecuting = new Set(get().executingSpiders)
      updatedExecuting.delete(spiderId)
      set({ executingSpiders: updatedExecuting })
    }
  },

  debugSpider: async (spiderId: string) => {
    const { debuggingSpiders } = get()
    
    // 添加到调试中的集合
    const newDebugging = new Set(debuggingSpiders)
    newDebugging.add(spiderId)
    set({ debuggingSpiders: newDebugging, error: null })

    try {
      const response = await spiderApi.debugCrawl({
        spider_name: spiderId,
      })

      if (response.success) {
        set({ lastDebugResult: response.data })
        return response.data
      } else {
        set({ error: response.message })
        return null
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Debug 执行失败'
      })
      return null
    } finally {
      // 从调试中的集合移除
      const updatedDebugging = new Set(get().debuggingSpiders)
      updatedDebugging.delete(spiderId)
      set({ debuggingSpiders: updatedDebugging })
    }
  },
}))
