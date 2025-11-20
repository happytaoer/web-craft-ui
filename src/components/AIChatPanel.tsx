import { useState, useRef, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  IconButton,
  Avatar,
  Text,
  Button,
  useColorModeValue,
  Spinner,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Grid,
  GridItem,
  Tooltip,
  Textarea,
} from '@chakra-ui/react'
import { FaPaperPlane, FaRobot, FaUser, FaCopy, FaCheck, FaEye, FaEyeSlash } from 'react-icons/fa'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-markup'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { aiService, ChatMessage } from '../services/aiService'
import { useLanguage } from '../i18n/LanguageContext'

interface AIChatPanelProps {
  isOpen: boolean
  onClose: () => void
  onApplyCode?: (code: string) => void
  htmlContext?: {
    url: string
    htmlContent: string
    title: string
  }
  existingCode?: string  // Existing code (edit mode)
  mode?: 'create' | 'edit'  // Mode: create or edit
}

export function AIChatPanel({ 
  isOpen, 
  onClose, 
  onApplyCode, 
  htmlContext,
  existingCode,
  mode = 'create'
}: AIChatPanelProps) {
  const { t } = useLanguage()
  const toast = useToast()
  
  const getInitialMessage = (): ChatMessage => {
    if (mode === 'edit' && existingCode) {
      if (htmlContext) {
        return {
          role: 'assistant',
          content: `我已经加载了你的现有爬虫代码和目标网站 "${htmlContext.title}" 的 HTML 结构。

请告诉我你想如何优化这个爬虫？例如：
- 添加新的数据字段
- 修复错误
- 优化 XPath 选择器
- 添加异常处理
- 数据清洗
等等...`
        }
      } else {
        return {
          role: 'assistant',
          content: `我已经加载了你的现有爬虫代码。

请告诉我你想如何优化？例如：
- 添加新的数据字段
- 修复错误或异常
- 优化代码结构
- 添加数据验证
等等...`
        }
      }
    } else if (htmlContext) {
      return {
        role: 'assistant',
        content: `我已经获取了 "${htmlContext.title}" 的页面内容。\n\n请告诉我你需要从这个页面提取哪些数据？例如：\n- 标题\n- 链接\n- 图片\n- 价格\n- 评分\n等等...`
      }
    }
    return {
      role: 'assistant',
      content: '你好！我是 AI 爬虫助手。告诉我你想爬取什么网站，需要提取哪些数据，我来帮你生成代码。'
    }
  }

  const [messages, setMessages] = useState<ChatMessage[]>([getInitialMessage()])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false)
  const [isMiddlePanelCollapsed, setIsMiddlePanelCollapsed] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const editorBg = useColorModeValue('gray.50', 'gray.900')

  // Left panel logic
  const hasLeftPanel = mode === 'edit' 
    ? (existingCode && existingCode.length > 0)
    : (generatedCode.length > 0) // Create mode: show generated code
  
  const leftPanelContent = mode === 'edit' ? existingCode || '' : generatedCode
  const leftPanelLanguage = 'python'
  
  // Middle panel: HTML source code
  const hasMiddlePanel = htmlContext?.htmlContent && htmlContext.htmlContent.length > 0
  const middlePanelContent = htmlContext?.htmlContent || ''

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 重置消息当 htmlContext 或 existingCode 变化时
  useEffect(() => {
    setMessages([getInitialMessage()])
  }, [htmlContext?.url, existingCode, mode])
  
  // 生成编辑模式的系统提示词
  const getEditModeSystemPrompt = (): string => {
    let prompt = `你是一个专业的 Python 爬虫开发助手。

# 当前任务
用户正在编辑一个现有的爬虫代码，需要你帮助优化。

# 现有代码
\`\`\`python
${existingCode}
\`\`\`
`

    if (htmlContext) {
      prompt += `
# 目标网站信息
- URL: ${htmlContext.url}
- 标题: ${htmlContext.title}

# 目标网站 HTML 结构（前 5000 字符）
\`\`\`html
${htmlContext.htmlContent.substring(0, 5000)}
\`\`\`
`
    }

    prompt += `
# 你的任务
1. 仔细理解现有代码的逻辑和结构
2. 根据用户的优化需求，修改代码
3. 保持代码风格一致
4. 只修改必要的部分，不要重写整个代码
5. 添加清晰的中文注释说明修改的地方

# 输出要求
- 直接输出完整的优化后的 Python 代码
- 使用 \`\`\`python 代码块包裹
- 保持原有的类名、方法名和基本结构
- 确保代码可以直接运行
- 保持良好的代码风格和可读性

# 注意事项
- 所有 XPath 查询都要检查结果是否为空
- 使用条件表达式处理空值：value = list[0] if list else None
- 避免直接使用索引 [0]，防止 IndexError
- 添加必要的数据清洗和验证
- 保持与现有代码相同的导入语句和类结构
`

    return prompt
  }

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage: ChatMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    // 添加 AI 消息占位
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    let aiResponse = ''

    const streamOptions = {
      onChunk: (chunk: string) => {
        aiResponse += chunk
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1].content = aiResponse
          return newMessages
        })
        
        // Extract and update generated code in real-time (create mode only)
        if (mode === 'create') {
          const code = extractCode(aiResponse)
          if (code) {
            setGeneratedCode(code)
          }
        }
      },
      onComplete: () => {
        setIsStreaming(false)
        
        // Final code extraction (create mode only)
        if (mode === 'create') {
          const code = extractCode(aiResponse)
          if (code) {
            setGeneratedCode(code)
          }
        }
      },
      onError: (error: Error) => {
        setIsStreaming(false)
        toast({
          title: '错误',
          description: error.message,
          status: 'error',
          duration: 5000,
        })
        // 移除失败的消息
        setMessages(prev => prev.slice(0, -1))
      }
    }

    try {
      if (mode === 'edit' && existingCode) {
        // 编辑模式：使用自定义系统提示词
        const customSystemPrompt = getEditModeSystemPrompt()
        await aiService.streamChat(
          [...messages, userMessage],
          streamOptions,
          customSystemPrompt
        )
      } else if (htmlContext) {
        // 创建模式：使用 HTML 上下文
        await aiService.chatWithHTML(
          [...messages, userMessage],
          htmlContext.htmlContent,
          htmlContext.url,
          streamOptions
        )
      } else {
        // 普通模式
        await aiService.streamChat(
          [...messages, userMessage],
          streamOptions
        )
      }
    } catch (error) {
      streamOptions.onError(error as Error)
    }
  }

  const extractCode = (content: string): string | null => {
    const codeBlockRegex = /```python\n([\s\S]*?)```/
    const match = content.match(codeBlockRegex)
    return match ? match[1].trim() : null
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    toast({
      title: t('codeCopied'),
      status: 'success',
      duration: 2000,
    })
  }

  const handleApplyCode = (code: string) => {
    if (onApplyCode) {
      onApplyCode(code)
      toast({
        title: t('codeApplied'),
        description: t('codeAppliedDesc'),
        status: 'success',
        duration: 3000,
      })
    }
  }

  // Calculate grid columns based on visible panels
  const getGridColumns = () => {
    const visiblePanels = [
      hasLeftPanel && !isLeftPanelCollapsed,
      hasMiddlePanel && !isMiddlePanelCollapsed,
      true // Chat panel always visible
    ].filter(Boolean).length

    if (visiblePanels === 3) {
      return { base: '1fr', md: '25% 35% 40%', lg: '25% 30% 45%' }
    } else if (visiblePanels === 2) {
      return { base: '1fr', md: '40% 60%', lg: '35% 65%' }
    } else {
      return '1fr'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader borderBottomWidth="1px">
          <HStack justify="space-between">
            <HStack>
              <FaRobot />
              <Text>{t('aiAssistant')}</Text>
              {htmlContext?.url && (
                <Text fontSize="sm" color="gray.500" noOfLines={1} maxW="400px">
                  - {htmlContext.url}
                </Text>
              )}
            </HStack>
            <HStack spacing={1}>
              {hasLeftPanel && (
                <Tooltip label={
                  isLeftPanelCollapsed 
                    ? (mode === 'edit' ? t('showExistingCode') : t('showGeneratedCode'))
                    : (mode === 'edit' ? t('hideExistingCode') : t('hideGeneratedCode'))
                }>
                  <IconButton
                    icon={isLeftPanelCollapsed ? <FaEye /> : <FaEyeSlash />}
                    onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                    aria-label="Toggle code panel"
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                  />
                </Tooltip>
              )}
              {hasMiddlePanel && (
                <Tooltip label={isMiddlePanelCollapsed ? t('showHtmlSource') : t('hideHtmlSource')}>
                  <IconButton
                    icon={isMiddlePanelCollapsed ? <FaEye /> : <FaEyeSlash />}
                    onClick={() => setIsMiddlePanelCollapsed(!isMiddlePanelCollapsed)}
                    aria-label="Toggle HTML source"
                    size="sm"
                    variant="ghost"
                    colorScheme="green"
                  />
                </Tooltip>
              )}
              <ModalCloseButton position="relative" top={0} right={0} />
            </HStack>
          </HStack>
        </ModalHeader>

        <ModalBody p={0}>
          <Grid
            templateColumns={getGridColumns()}
            h="calc(100vh - 80px)"
            transition="all 0.3s"
          >
            {/* Left Panel - Generated/Existing Code */}
            {hasLeftPanel && !isLeftPanelCollapsed && (
              <GridItem
                borderRight="1px"
                borderColor={borderColor}
                overflow="hidden"
                display="flex"
                flexDirection="column"
              >
                <SourceCodePanel
                  content={leftPanelContent}
                  language={leftPanelLanguage}
                  editorBg={editorBg}
                  borderColor={borderColor}
                />
              </GridItem>
            )}

            {/* Middle Panel - HTML Source Code */}
            {hasMiddlePanel && !isMiddlePanelCollapsed && (
              <GridItem
                borderRight="1px"
                borderColor={borderColor}
                overflow="hidden"
                display="flex"
                flexDirection="column"
              >
                <SourceCodePanel
                  content={middlePanelContent}
                  language="markup"
                  editorBg={editorBg}
                  borderColor={borderColor}
                />
              </GridItem>
            )}
            
            {/* Right Panel - Chat */}
            <GridItem overflow="hidden" display="flex" flexDirection="column">
              <ChatPanel
                messages={messages}
                input={input}
                isStreaming={isStreaming}
                onSend={handleSend}
                onInputChange={setInput}
                onCopyCode={handleCopyCode}
                onApplyCode={handleApplyCode}
                copiedCode={copiedCode}
                extractCode={extractCode}
                messagesEndRef={messagesEndRef}
                t={t}
                bgColor={bgColor}
                borderColor={borderColor}
              />
            </GridItem>
          </Grid>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

// Source Code Panel Component
interface SourceCodePanelProps {
  content: string
  language: string
  editorBg: string
  borderColor: string
}

function SourceCodePanel({ 
  content, 
  language, 
  editorBg, 
  borderColor 
}: SourceCodePanelProps) {
  return (
    <Box h="100%" display="flex" flexDirection="column">
      {/* Code Editor */}
      <Box 
        flex="1" 
        overflow="auto" 
        bg={editorBg} 
        p={2}
        sx={{
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.400',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'gray.500',
          },
        }}
      >
        <Editor
          value={content}
          onValueChange={() => {}} // Read-only
          highlight={(code) => {
            try {
              return highlight(code, languages[language] || languages.markup, language)
            } catch {
              return code
            }
          }}
          padding={10}
          readOnly
          style={{
            fontFamily: '"Fira Code", "Fira Mono", monospace',
            fontSize: 13,
            minHeight: '100%',
            lineHeight: '1.5',
          }}
        />
      </Box>
      
      {/* Footer - Stats */}
      <Box p={2} borderTop="1px" borderColor={borderColor} fontSize="xs" color="gray.500">
        <HStack justify="space-between">
          <Text>{content.split('\n').length} 行</Text>
          <Text>{content.length} 字符</Text>
        </HStack>
      </Box>
    </Box>
  )
}

// Chat Panel Component
interface ChatPanelProps {
  messages: ChatMessage[]
  input: string
  isStreaming: boolean
  onSend: () => void
  onInputChange: (value: string) => void
  onCopyCode: (code: string) => void
  onApplyCode: (code: string) => void
  copiedCode: string | null
  extractCode: (content: string) => string | null
  messagesEndRef: React.RefObject<HTMLDivElement>
  t: any
  bgColor: string
  borderColor: string
}

function ChatPanel({
  messages,
  input,
  isStreaming,
  onSend,
  onInputChange,
  onCopyCode,
  onApplyCode,
  copiedCode,
  extractCode,
  messagesEndRef,
  t,
  bgColor,
  borderColor,
}: ChatPanelProps) {
  return (
    <Box h="100%" display="flex" flexDirection="column">
      {/* Messages */}
      <Box flex="1" overflow="auto" p={4}>
        <VStack spacing={4} align="stretch">
          {messages.map((msg, idx) => (
            <ChatMessageBubble
              key={idx}
              message={msg}
              onCopy={onCopyCode}
              onApply={onApplyCode}
              isCopied={copiedCode === extractCode(msg.content)}
            />
          ))}
          {isStreaming && (
            <HStack justify="center">
              <Spinner size="sm" />
              <Text fontSize="sm" color="gray.500">{t('aiGenerating')}</Text>
            </HStack>
          )}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>
      
      {/* Input */}
      <Box p={4} borderTop="1px" borderColor={borderColor} bg={bgColor}>
        <VStack spacing={2}>
          <Textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={t('aiChatPlaceholder')}
            resize="none"
            rows={3}
            disabled={isStreaming}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
          />
          <HStack w="full" justify="flex-end">
            <Button
              leftIcon={<FaPaperPlane />}
              onClick={onSend}
              colorScheme="blue"
              isLoading={isStreaming}
              loadingText={t('aiGenerating')}
              size="sm"
            >
              发送
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  )
}

// 消息气泡组件
function ChatMessageBubble({ 
  message, 
  onCopy, 
  onApply,
  isCopied 
}: { 
  message: ChatMessage
  onCopy: (code: string) => void
  onApply: (code: string) => void
  isCopied: boolean
}) {
  const isAI = message.role === 'assistant'
  const bgColor = useColorModeValue(
    isAI ? 'gray.100' : 'blue.500',
    isAI ? 'gray.700' : 'blue.600'
  )

  const extractCode = (content: string): string | null => {
    const codeBlockRegex = /```python\n([\s\S]*?)```/
    const match = content.match(codeBlockRegex)
    return match ? match[1].trim() : null
  }

  const code = extractCode(message.content)

  return (
    <HStack align="start" justify={isAI ? 'flex-start' : 'flex-end'} w="full">
      {isAI && <Avatar size="sm" icon={<FaRobot />} bg="blue.500" />}
      <VStack align={isAI ? 'start' : 'end'} maxW="80%" spacing={2}>
        <Box
          bg={bgColor}
          color={isAI ? 'inherit' : 'white'}
          px={4}
          py={3}
          borderRadius="lg"
        >
          <ReactMarkdown
            components={{
              code({ className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '')
                const isInline = !className
                return !isInline && match ? (
                  <SyntaxHighlighter
                    language={match[1]}
                    style={vscDarkPlus as any}
                    customStyle={{ borderRadius: '8px', fontSize: '13px', margin: '8px 0' }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    style={{
                      background: 'rgba(0,0,0,0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                    }}
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </Box>

        {/* 代码操作按钮 */}
        {code && isAI && (
          <HStack spacing={2}>
            <Button
              size="xs"
              leftIcon={isCopied ? <FaCheck /> : <FaCopy />}
              onClick={() => onCopy(code)}
              variant="outline"
              colorScheme={isCopied ? 'green' : 'gray'}
            >
              {isCopied ? '已复制' : '复制代码'}
            </Button>
            <Button
              size="xs"
              colorScheme="blue"
              onClick={() => onApply(code)}
            >
              应用到编辑器
            </Button>
          </HStack>
        )}
      </VStack>
      {!isAI && <Avatar size="sm" icon={<FaUser />} bg="gray.500" />}
    </HStack>
  )
}
