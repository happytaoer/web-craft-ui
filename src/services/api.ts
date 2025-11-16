import type { ApiResponse, SpidersData, CrawlRequest, CrawlResult, DebugCrawlRequest, CreateSpiderRequest, CreateSpiderResponse, DeleteSpiderResponse, GetSpiderCodeResponse, EditSpiderRequest, EditSpiderResponse, HealthCheck } from '../types/api'

const API_BASE_URL = 'http://0.0.0.0:8080/api/v1'

export const spiderApi = {
  // 获取爬虫列表
  async getSpiders(): Promise<ApiResponse<SpidersData>> {
    const response = await fetch(`${API_BASE_URL}/spiders`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  // 执行单个爬虫
  async crawlSingle(request: CrawlRequest): Promise<ApiResponse<CrawlResult>> {
    const response = await fetch(`${API_BASE_URL}/crawl/single`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spider_name: request.spider_name,
        timeout: request.timeout || 30,
      }),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  // Debug 模式执行爬虫
  async debugCrawl(request: DebugCrawlRequest): Promise<ApiResponse<CrawlResult>> {
    const response = await fetch(`${API_BASE_URL}/crawl/debug`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spider_name: request.spider_name,
      }),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  // 创建新爬虫
  async createSpider(request: CreateSpiderRequest): Promise<ApiResponse<CreateSpiderResponse>> {
    const response = await fetch(`${API_BASE_URL}/spiders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spider_name: request.spider_name,
        spider_code: request.spider_code,
      }),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  // 删除爬虫
  async deleteSpider(spiderName: string): Promise<ApiResponse<DeleteSpiderResponse>> {
    const response = await fetch(`${API_BASE_URL}/spiders/${spiderName}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  // 获取爬虫代码
  async getSpiderCode(spiderName: string): Promise<ApiResponse<GetSpiderCodeResponse>> {
    const response = await fetch(`${API_BASE_URL}/spiders/${spiderName}/code`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  // 编辑爬虫
  async editSpider(spiderName: string, request: EditSpiderRequest): Promise<ApiResponse<EditSpiderResponse>> {
    const response = await fetch(`${API_BASE_URL}/spiders/${spiderName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spider_name: request.spider_name,
        spider_code: request.spider_code,
      }),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  // 健康检查
  async getHealth(): Promise<ApiResponse<HealthCheck>> {
    const response = await fetch(`${API_BASE_URL}/health`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },
}
