// API Response types
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  error_code: string | null
  timestamp: string
}

// Spider types
export interface SpidersData {
  spiders: string[]
  count: number
}

export interface Spider {
  id: string
  name: string
}

// Crawl request and response types
export interface CrawlRequest {
  spider_name: string
  timeout?: number
}

export interface CrawlResult {
  url: string
  status_code: number
  success: boolean
  content_length: number
  encoding: string
  headers: Record<string, string>
  request_headers: Record<string, string>
  response_time: number
  extracted_data: Record<string, unknown> | null
  error_message: string | null
  task_id: string | null
}

export interface DebugCrawlRequest {
  spider_name: string
}

export interface CreateSpiderRequest {
  spider_name: string
  spider_code: string
}

export interface CreateSpiderResponse {
  spider_name: string
  message: string
}

export interface DeleteSpiderResponse {
  spider_name: string
  message: string
}

export interface GetSpiderCodeResponse {
  spider_name: string
  spider_code: string
}

export interface EditSpiderRequest {
  spider_name: string
  spider_code: string
}

export interface EditSpiderResponse {
  spider_name: string
  message: string
}

export interface SystemInfo {
  platform: string
  platform_version: string
  python_version: string
  cpu_count: number
  memory_total: number
  memory_available: number
  disk_usage: number
}

export interface HealthCheck {
  status: string
  version: string
  uptime: number
  system_info: SystemInfo
}
