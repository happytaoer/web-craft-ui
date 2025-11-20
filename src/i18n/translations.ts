export const translations = {
  'zh-CN': {
    // Header
    brandName: 'web-craft dashboard',
    createSpider: '创建爬虫',
    toggleTheme: '切换主题',
    toggleLanguage: '切换语言',
    
    // Spider Card
    execute: '执行',
    debug: '调试',
    edit: '编辑',
    delete: '删除',
    executing: '执行中',
    debugging: '调试中',
    deleting: '删除中',
    
    // Create Spider Modal
    createSpiderTitle: '创建新爬虫',
    spiderName: '爬虫名称',
    spiderNamePlaceholder: '例如: my_spider (小写字母、数字、下划线)',
    spiderCode: '爬虫代码',
    spiderCodePlaceholder: '# 请输入完整的 Python 爬虫代码，需要继承 BaseSpider...',
    cancel: '取消',
    create: '创建',
    creating: '创建中',
    
    // Edit Spider Modal
    editSpiderTitle: '编辑爬虫',
    save: '保存',
    saving: '保存中',
    loadingCode: '加载中',
    
    // Result Modal
    executionResult: '执行结果',
    debugResult: '调试结果',
    status: '状态',
    success: '成功',
    failed: '失败',
    url: 'URL',
    statusCode: '状态码',
    responseTime: '响应时间',
    taskId: '任务 ID',
    errorMessage: '错误信息',
    extractedData: '提取的数据',
    close: '关闭',
    taskCreated: '任务已创建，异步执行中',
    taskExecuting: '任务正在后台执行，请稍后查看结果',
    
    // Messages
    createSuccess: '创建成功',
    createSuccessDesc: '爬虫已创建',
    createFailed: '创建失败',
    deleteConfirm: '确定要删除爬虫吗？此操作不可恢复。',
    deleteSuccess: '删除成功',
    deleteSuccessDesc: '爬虫已删除',
    deleteFailed: '删除失败',
    saveSuccess: '保存成功',
    saveSuccessDesc: '爬虫已更新',
    saveFailed: '保存失败',
    loadFailed: '加载失败',
    
    // Errors
    emptyNameOrCode: '爬虫名称和代码不能为空',
    emptyCode: '爬虫代码不能为空',
    unknownError: '未知错误',
    
    // Validation Errors
    validationErrorTitle: '代码验证失败',
    validationErrorDesc: '您的爬虫代码存在以下问题：',
    syntaxError: '语法错误',
    importError: '导入错误',
    structureError: '结构错误',
    fieldError: '字段错误',
    errorAtLine: '第 {line} 行',
    
    // AI Assistant
    aiAssistant: 'AI 助手',
    aiGenerating: 'AI 生成中...',
    aiGenerate: 'AI 生成',
    aiOptimize: 'AI 优化',
    aiChatPlaceholder: '描述你要爬取的内容...',
    copyCode: '复制代码',
    applyToEditor: '应用到编辑器',
    codeCopied: '已复制',
    codeApplied: '代码已应用',
    codeAppliedDesc: '代码已填充到编辑器',
    
    // AI Spider Wizard
    aiSpiderWizardTitle: 'AI 爬虫生成',
    wizardInputPrompt: '输入目标网站 URL 和爬虫名称',
    wizardSpiderNameLabel: '爬虫名称',
    wizardSpiderNamePlaceholder: '例如: douban_movie (小写字母、数字、下划线)',
    wizardTargetUrlLabel: '目标 URL',
    wizardTargetUrlPlaceholder: 'https://example.com',
    startGenerate: '开始生成',
    fetchingPageAndOpenAI: '获取页面并打开AI对话...',
    enterTargetUrl: '请输入目标 URL',
    enterSpiderName: '请输入爬虫名称',
    spiderNameFormatError: '爬虫名称格式错误',
    spiderNameFormatDesc: '必须以小写字母开头，只能包含小写字母、数字和下划线',
    pageFetchSuccess: '页面获取成功',
    pageFetchSuccessDesc: '成功获取 {size} KB 内容',
    pageFetchFailed: '页面获取失败',
    fetchFailed: '获取失败',
    showExistingCode: '显示现有代码',
    hideExistingCode: '隐藏现有代码',
    showGeneratedCode: '显示生成代码',
    hideGeneratedCode: '隐藏生成代码',
    showHtmlSource: '显示HTML源码',
    hideHtmlSource: '隐藏HTML源码',
    
    // Edit AI
    fetchingTargetContent: '正在获取目标网站内容...',
    contentFetchSuccess: '页面内容获取成功',
    contentFetchFailed: '页面内容获取失败',
    cannotExtractUrl: '无法提取目标 URL',
    ensureStartUrl: '请确保代码中包含 start_url',
    
    // Loading
    loading: '加载中...',
    
    // Alert
    errorTitle: '错误',
    
    // System Status
    systemStatus: '系统状态',
    systemVersion: '版本',
    systemUptime: '运行时间',
    systemPlatform: '平台',
    pythonVersion: 'Python 版本',
    cpuCount: 'CPU 核心',
    memoryUsage: '内存使用',
    diskUsage: '磁盘使用',
    healthy: '健康',
    unhealthy: '异常',
  },
  'en-US': {
    // Header
    brandName: 'web-craft dashboard',
    createSpider: 'Create Spider',
    toggleTheme: 'Toggle Theme',
    toggleLanguage: 'Switch Language',
    
    // Spider Card
    execute: 'Execute',
    debug: 'Debug',
    edit: 'Edit',
    delete: 'Delete',
    executing: 'Executing',
    debugging: 'Debugging',
    deleting: 'Deleting',
    
    // Create Spider Modal
    createSpiderTitle: 'Create New Spider',
    spiderName: 'Spider Name',
    spiderNamePlaceholder: 'e.g., my_spider (lowercase, digits, underscores)',
    spiderCode: 'Spider Code',
    spiderCodePlaceholder: '# Enter complete Python spider code that inherits from BaseSpider...',
    cancel: 'Cancel',
    create: 'Create',
    creating: 'Creating',
    
    // Edit Spider Modal
    editSpiderTitle: 'Edit Spider',
    save: 'Save',
    saving: 'Saving',
    loadingCode: 'Loading',
    
    // Result Modal
    executionResult: 'Execution Result',
    debugResult: 'Debug Result',
    status: 'Status',
    success: 'Success',
    failed: 'Failed',
    url: 'URL',
    statusCode: 'Status Code',
    responseTime: 'Response Time',
    taskId: 'Task ID',
    errorMessage: 'Error Message',
    extractedData: 'Extracted Data',
    close: 'Close',
    taskCreated: 'Task created, executing asynchronously',
    taskExecuting: 'Task is executing in background, please check later',
    
    // Messages
    createSuccess: 'Created Successfully',
    createSuccessDesc: 'Spider has been created',
    createFailed: 'Creation Failed',
    deleteConfirm: 'Are you sure to delete this spider? This action cannot be undone.',
    deleteSuccess: 'Deleted Successfully',
    deleteSuccessDesc: 'Spider has been deleted',
    deleteFailed: 'Deletion Failed',
    saveSuccess: 'Saved Successfully',
    saveSuccessDesc: 'Spider has been updated',
    saveFailed: 'Save Failed',
    loadFailed: 'Load Failed',
    
    // Errors
    emptyNameOrCode: 'Spider name and code cannot be empty',
    emptyCode: 'Spider code cannot be empty',
    unknownError: 'Unknown error',
    
    // Validation Errors
    validationErrorTitle: 'Code Validation Failed',
    validationErrorDesc: 'Your spider code has the following issues:',
    syntaxError: 'Syntax Error',
    importError: 'Import Error',
    structureError: 'Structure Error',
    fieldError: 'Field Error',
    errorAtLine: 'Line {line}',
    
    // AI Assistant
    aiAssistant: 'AI Assistant',
    aiGenerating: 'AI Generating...',
    aiGenerate: 'AI Generate',
    aiOptimize: 'AI Optimize',
    aiChatPlaceholder: 'Describe what you want to scrape...',
    copyCode: 'Copy Code',
    applyToEditor: 'Apply to Editor',
    codeCopied: 'Copied',
    codeApplied: 'Code Applied',
    codeAppliedDesc: 'Code has been filled into the editor',
    
    // AI Spider Wizard
    aiSpiderWizardTitle: 'AI Spider Generator',
    wizardInputPrompt: 'Enter target website URL and spider name',
    wizardSpiderNameLabel: 'Spider Name',
    wizardSpiderNamePlaceholder: 'e.g: douban_movie (lowercase, numbers, underscores)',
    wizardTargetUrlLabel: 'Target URL',
    wizardTargetUrlPlaceholder: 'https://example.com',
    startGenerate: 'Start Generate',
    fetchingPageAndOpenAI: 'Fetching page and opening AI chat...',
    enterTargetUrl: 'Please enter target URL',
    enterSpiderName: 'Please enter spider name',
    spiderNameFormatError: 'Spider name format error',
    spiderNameFormatDesc: 'Must start with lowercase letter, only lowercase letters, numbers and underscores allowed',
    pageFetchSuccess: 'Page fetched successfully',
    pageFetchSuccessDesc: 'Successfully fetched {size} KB content',
    pageFetchFailed: 'Page fetch failed',
    fetchFailed: 'Fetch failed',
    showExistingCode: 'Show Existing Code',
    hideExistingCode: 'Hide Existing Code',
    showGeneratedCode: 'Show Generated Code',
    hideGeneratedCode: 'Hide Generated Code',
    showHtmlSource: 'Show HTML Source',
    hideHtmlSource: 'Hide HTML Source',
    
    // Edit AI
    fetchingTargetContent: 'Fetching target website content...',
    contentFetchSuccess: 'Page content fetched successfully',
    contentFetchFailed: 'Failed to fetch page content',
    cannotExtractUrl: 'Cannot extract target URL',
    ensureStartUrl: 'Please ensure start_url is included in the code',
    
    // Loading
    loading: 'Loading...',
    
    // Alert
    errorTitle: 'Error',
    
    // System Status
    systemStatus: 'System Status',
    systemVersion: 'Version',
    systemUptime: 'Uptime',
    systemPlatform: 'Platform',
    pythonVersion: 'Python Version',
    cpuCount: 'CPU Cores',
    memoryUsage: 'Memory Usage',
    diskUsage: 'Disk Usage',
    healthy: 'Healthy',
    unhealthy: 'Unhealthy',
  },
} as const

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations['zh-CN']
