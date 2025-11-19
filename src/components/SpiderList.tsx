import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  useColorMode,
  useColorModeValue,
  IconButton,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Stack,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useToast,
  Code,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react'
import { MoonIcon, SunIcon, AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { FaPlay, FaBug, FaGlobe } from 'react-icons/fa'
import { useSpiderStore } from '../store'
import { spiderApi } from '../services/api'
import type { CrawlResult, HealthCheck, ValidationError, ValidationErrorResponse } from '../types/api'
import { ValidationErrorDisplay } from './ValidationErrorDisplay'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/themes/prism-tomorrow.css'
import { useLanguage } from '../i18n/LanguageContext.tsx'

export function SpiderList() {
  const { colorMode, toggleColorMode } = useColorMode()
  const { language, setLanguage, t } = useLanguage()
  const { spiders, loading, executingSpiders, debuggingSpiders, fetchSpiders, executeSpider, debugSpider } = useSpiderStore()
  const toast = useToast()
  
  // State
  const [showResult, setShowResult] = useState(false)
  const [showDebugResult, setShowDebugResult] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentResult, setCurrentResult] = useState<CrawlResult | null>(null)
  const [currentDebugResult, setCurrentDebugResult] = useState<CrawlResult | null>(null)
  const [spiderName, setSpiderName] = useState('')
  const [spiderCode, setSpiderCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createValidationErrors, setCreateValidationErrors] = useState<ValidationError[]>([])
  const [deletingSpiders, setDeletingSpiders] = useState<Set<string>>(new Set())
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSpiderId, setEditingSpiderId] = useState<string | null>(null)
  const [editSpiderCode, setEditSpiderCode] = useState('')
  const [loadingCode, setLoadingCode] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editValidationErrors, setEditValidationErrors] = useState<ValidationError[]>([])
  const [healthData, setHealthData] = useState<HealthCheck | null>(null)

  const defaultSpiderTemplate = `from typing import Dict, Any
from spiders.core.base_spider import BaseSpider, ParseContext


class DefaultSpider(BaseSpider):
    name = "default"
    start_url = "https://www.google.com"
    def parse(self, raw_content: str, context: ParseContext) -> Dict[str, Any]:
        """
        Parse web page content and extract basic information
        
        Args:
            raw_content: original HTML/text content
            context: request/response metadata
            
        Returns:
            extracted data dictionary
        """
        return raw_content
`

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const editorBg = useColorModeValue('#f5f5f5', '#1e1e1e')
  const footerHeight = 64

  useEffect(() => {
    fetchSpiders()
    fetchHealth()
    // Refresh health every 30 seconds
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [fetchSpiders])

  const fetchHealth = async () => {
    try {
      const response = await spiderApi.getHealth()
      if (response.success && response.data) {
        setHealthData(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch health:', error)
    }
  }

  const handleExecute = async (spiderId: string) => {
    const result = await executeSpider(spiderId)
    if (result) {
      setCurrentResult(result)
      setShowResult(true)
    }
  }

  const handleDebug = async (spiderId: string) => {
    const result = await debugSpider(spiderId)
    if (result) {
      setCurrentDebugResult(result)
      setShowDebugResult(true)
    }
  }

  const openCreateModal = () => {
    setSpiderName('')
    setSpiderCode(defaultSpiderTemplate)
    setCreateError(null)
    setShowCreateModal(true)
  }

  const handleCreateSpider = async () => {
    if (!spiderName.trim() || !spiderCode.trim()) {
      setCreateError(t('emptyNameOrCode'))
      return
    }

    setCreating(true)
    setCreateError(null)
    setCreateValidationErrors([])

    try {
      const response = await spiderApi.createSpider({
        spider_name: spiderName,
        spider_code: spiderCode,
      })

      if (response.success) {
        toast({
          title: t('createSuccess'),
          description: `${t('createSuccessDesc')}: "${spiderName}"`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        setShowCreateModal(false)
        setSpiderName('')
        setSpiderCode('')
        await fetchSpiders()
      } else {
        // Check if this is a validation error
        if (response.error_code === 'VALIDATION_ERROR' && response.data) {
          const validationData = response.data as unknown as ValidationErrorResponse
          if (validationData.validation_errors) {
            setCreateValidationErrors(validationData.validation_errors)
          } else {
            setCreateError(`${t('createFailed')}: ${response.message}`)
          }
        } else {
          setCreateError(`${t('createFailed')}: ${response.message}`)
        }
      }
    } catch (error) {
      setCreateError(`${t('createFailed')}: ${error instanceof Error ? error.message : t('unknownError')}`)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteSpider = async (spiderId: string) => {
    if (!confirm(`${t('deleteConfirm')} "${spiderId}"?`)) {
      return
    }

    const newDeleting = new Set(deletingSpiders)
    newDeleting.add(spiderId)
    setDeletingSpiders(newDeleting)

    try {
      const response = await spiderApi.deleteSpider(spiderId)

      if (response.success) {
        toast({
          title: t('deleteSuccess'),
          description: `${t('deleteSuccessDesc')}: "${spiderId}"`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        await fetchSpiders()
      } else {
        toast({
          title: t('deleteFailed'),
          description: response.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error) {
      toast({
        title: t('deleteFailed'),
        description: error instanceof Error ? error.message : t('unknownError'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      const updatedDeleting = new Set(deletingSpiders)
      updatedDeleting.delete(spiderId)
      setDeletingSpiders(updatedDeleting)
    }
  }

  const handleEditSpider = async (spiderId: string) => {
    setEditingSpiderId(spiderId)
    setShowEditModal(true)
    setLoadingCode(true)
    setEditError(null)

    try {
      const response = await spiderApi.getSpiderCode(spiderId)

      if (response.success && response.data) {
        setEditSpiderCode(response.data.spider_code)
      } else {
        setEditError(`${t('loadFailed')}: ${response.message}`)
      }
    } catch (error) {
      setEditError(`${t('loadFailed')}: ${error instanceof Error ? error.message : t('unknownError')}`)
    } finally {
      setLoadingCode(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingSpiderId) return

    if (!editSpiderCode.trim()) {
      setEditError(t('emptyCode'))
      return
    }

    setEditing(true)
    setEditError(null)
    setEditValidationErrors([])

    try {
      const response = await spiderApi.editSpider(editingSpiderId, {
        spider_name: editingSpiderId,
        spider_code: editSpiderCode,
      })

      if (response.success) {
        toast({
          title: t('saveSuccess'),
          description: `${t('saveSuccessDesc')}: "${editingSpiderId}"`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        setShowEditModal(false)
        setEditingSpiderId(null)
        setEditSpiderCode('')
        await fetchSpiders()
      } else {
        // Check if this is a validation error
        if (response.error_code === 'VALIDATION_ERROR' && response.data) {
          const validationData = response.data as unknown as ValidationErrorResponse
          if (validationData.validation_errors) {
            setEditValidationErrors(validationData.validation_errors)
          } else {
            setEditError(`${t('saveFailed')}: ${response.message}`)
          }
        } else {
          setEditError(`${t('saveFailed')}: ${response.message}`)
        }
      }
    } catch (error) {
      setEditError(`${t('saveFailed')}: ${error instanceof Error ? error.message : t('unknownError')}`)
    } finally {
      setEditing(false)
    }
  }

  const protectedSpiders = ['ip', 'hackernews']

  if (loading && spiders.length === 0) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    )
  }

  return (
    <Box minH="100vh" pb={`${footerHeight + 16}px`}>
      {/* Header */}
      <Box bg={bgColor} borderBottom="1px" borderColor={borderColor} py={4} position="sticky" top={0} zIndex={10}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.700', 'gray.200')}>
              {t('brandName')}
            </Text>
            <Flex gap={3}>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="brand"
                onClick={openCreateModal}
              >
                {t('createSpider')}
              </Button>
              <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label={t('toggleLanguage')}
                  icon={<FaGlobe />}
                  variant="outline"
                />
                <MenuList>
                  <MenuItem onClick={() => setLanguage('zh-CN')} fontWeight={language === 'zh-CN' ? 'bold' : 'normal'}>
                    中文
                  </MenuItem>
                  <MenuItem onClick={() => setLanguage('en-US')} fontWeight={language === 'en-US' ? 'bold' : 'normal'}>
                    English
                  </MenuItem>
                </MenuList>
              </Menu>
              <IconButton
                aria-label={t('toggleTheme')}
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                variant="outline"
              />
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={8}>
        {/* {error && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            <AlertTitle>{t('errorTitle')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )} */}

        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          }}
          gap={6}
        >
          {spiders.map((spider) => (
            <Card key={spider.id} variant="outline" bg={bgColor}>
              <CardHeader>
                <Heading size="md">{spider.name}</Heading>
              </CardHeader>

              <CardBody>
                <Grid
                  templateColumns={`repeat(${protectedSpiders.includes(spider.id) ? 3 : 4}, minmax(0, 1fr))`}
                  gap={2}
                >
                  <Button
                    leftIcon={<FaPlay />}
                    colorScheme="green"
                    size="sm"
                    onClick={() => handleExecute(spider.id)}
                    isLoading={executingSpiders.has(spider.id)}
                    loadingText={t('executing')}
                    width="100%"
                  >
                    {t('execute')}
                  </Button>

                  <Button
                    leftIcon={<FaBug />}
                    colorScheme="orange"
                    size="sm"
                    onClick={() => handleDebug(spider.id)}
                    isLoading={debuggingSpiders.has(spider.id)}
                    loadingText={t('debugging')}
                    width="100%"
                  >
                    {t('debug')}
                  </Button>

                  <Button
                    leftIcon={<EditIcon />}
                    colorScheme="blue"
                    size="sm"
                    onClick={() => handleEditSpider(spider.id)}
                    width="100%"
                  >
                    {t('edit')}
                  </Button>

                  {!protectedSpiders.includes(spider.id) && (
                    <Button
                      leftIcon={<DeleteIcon />}
                      colorScheme="red"
                      size="sm"
                      onClick={() => handleDeleteSpider(spider.id)}
                      isLoading={deletingSpiders.has(spider.id)}
                      loadingText={t('deleting')}
                      width="100%"
                    >
                      {t('delete')}
                    </Button>
                  )}
                </Grid>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </Container>

      {/* Create Spider Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSpiderName('')
          setSpiderCode('')
          setCreateError(null)
        }}
        size="4xl"
      >
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>{t('createSpiderTitle')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isInvalid={!!createError}>
                <FormLabel>{t('spiderName')}</FormLabel>
                <Input
                  value={spiderName}
                  onChange={(e) => setSpiderName(e.target.value)}
                  placeholder={t('spiderNamePlaceholder')}
                  disabled={creating}
                />
              </FormControl>

              <FormControl isInvalid={!!createError}>
                <FormLabel>{t('spiderCode')}</FormLabel>
                <Box
                  border="1px"
                  borderColor={borderColor}
                  borderRadius="md"
                  overflow="hidden"
                  bg={editorBg}
                >
                  <Editor
                    value={spiderCode}
                    onValueChange={setSpiderCode}
                    highlight={(code) => highlight(code, languages.python, 'python')}
                    padding={16}
                    disabled={creating}
                    placeholder={t('spiderCodePlaceholder')}
                    style={{
                      fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
                      fontSize: 14,
                      lineHeight: 1.6,
                      minHeight: '350px',
                      maxHeight: '50vh',
                      overflow: 'auto',
                    }}
                  />
                </Box>
                {createError && <FormErrorMessage>{createError}</FormErrorMessage>}
              </FormControl>
              
              {/* Validation Errors Display */}
              {createValidationErrors.length > 0 && (
                <ValidationErrorDisplay errors={createValidationErrors} />
              )}
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                setShowCreateModal(false)
                setSpiderName('')
                setSpiderCode('')
                setCreateError(null)
                setCreateValidationErrors([])
              }}
              disabled={creating}
            >
              {t('cancel')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleCreateSpider}
              isLoading={creating}
              loadingText={t('creating')}
            >
              {t('create')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Spider Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingSpiderId(null)
          setEditSpiderCode('')
          setEditError(null)
        }}
        size="4xl"
      >
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>{t('editSpiderTitle')}: {editingSpiderId}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {loadingCode ? (
              <Flex justify="center" align="center" py={20}>
                <Spinner size="xl" color="brand.500" />
              </Flex>
            ) : (
              <Stack spacing={4}>
                <FormControl isInvalid={!!editError}>
                  <FormLabel>{t('spiderCode')}</FormLabel>
                  <Box
                    border="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    overflow="hidden"
                    bg={editorBg}
                  >
                    <Editor
                      value={editSpiderCode}
                      onValueChange={setEditSpiderCode}
                      highlight={(code) => highlight(code, languages.python, 'python')}
                      padding={16}
                      disabled={editing}
                      placeholder={t('spiderCodePlaceholder')}
                      style={{
                        fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
                        fontSize: 14,
                        lineHeight: 1.6,
                        minHeight: '500px',
                        maxHeight: '60vh',
                        overflow: 'auto',
                      }}
                    />
                  </Box>
                  {editError && <FormErrorMessage>{editError}</FormErrorMessage>}
                </FormControl>
                
                {/* Validation Errors Display */}
                {editValidationErrors.length > 0 && (
                  <ValidationErrorDisplay errors={editValidationErrors} />
                )}
              </Stack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                setShowEditModal(false)
                setEditingSpiderId(null)
                setEditSpiderCode('')
                setEditError(null)
                setEditValidationErrors([])
              }}
              disabled={editing}
            >
              {t('cancel')}
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleSaveEdit}
              isLoading={editing}
              loadingText={t('saving')}
              disabled={loadingCode}
            >
              {t('save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Result Modal */}
      <Modal
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        size="4xl"
      >
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>{t('executionResult')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {currentResult && (
              <Stack spacing={4}>
                <Box>
                  <Text fontWeight="bold" mb={2}>{t('status')}:</Text>
                  <Badge colorScheme={currentResult.success ? 'green' : 'red'} fontSize="md">
                    {currentResult.success ? t('success') : t('failed')}
                  </Badge>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>{t('url')}:</Text>
                  <Text fontSize="sm" color="blue.500">{currentResult.url}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>{t('statusCode')}:</Text>
                  <Badge colorScheme={currentResult.status_code === 200 ? 'green' : currentResult.status_code === 202 ? 'blue' : 'orange'}>
                    {currentResult.status_code}
                  </Badge>
                  {currentResult.status_code === 202 && (
                    <Text fontSize="sm" color="gray.500" ml={2} display="inline">
                      ({t('taskCreated')})
                    </Text>
                  )}
                </Box>

                {currentResult.task_id && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>{t('taskId')}:</Text>
                    <Code fontSize="sm" p={2} borderRadius="md">
                      {currentResult.task_id}
                    </Code>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {t('taskExecuting')}
                    </Text>
                  </Box>
                )}

                {currentResult.response_time > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>{t('responseTime')}:</Text>
                    <Text>{currentResult.response_time.toFixed(2)}s</Text>
                  </Box>
                )}

                {currentResult.error_message && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>{t('errorMessage')}:</Text>
                    <Text color="red.500">{currentResult.error_message}</Text>
                  </Box>
                )}

                {currentResult.extracted_data && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>{t('extractedData')}:</Text>
                    <Code
                      display="block"
                      whiteSpace="pre"
                      p={4}
                      borderRadius="md"
                      overflow="auto"
                      maxH="400px"
                    >
                      {JSON.stringify(currentResult.extracted_data, null, 2)}
                    </Code>
                  </Box>
                )}
              </Stack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button onClick={() => setShowResult(false)}>{t('close')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Debug Result Modal */}
      <Modal
        isOpen={showDebugResult}
        onClose={() => setShowDebugResult(false)}
        size="4xl"
      >
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>{t('debugResult')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {currentDebugResult && (
              <Stack spacing={4}>
                <Box>
                  <Text fontWeight="bold" mb={2}>{t('status')}:</Text>
                  <Badge colorScheme={currentDebugResult.success ? 'green' : 'red'} fontSize="md">
                    {currentDebugResult.success ? t('success') : t('failed')}
                  </Badge>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>{t('url')}:</Text>
                  <Text fontSize="sm" color="blue.500">{currentDebugResult.url}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>{t('statusCode')}:</Text>
                  <Badge colorScheme={currentDebugResult.status_code === 200 ? 'green' : 'orange'}>
                    {currentDebugResult.status_code}
                  </Badge>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>{t('responseTime')}:</Text>
                  <Text>{currentDebugResult.response_time.toFixed(2)}s</Text>
                </Box>

                {currentDebugResult.error_message && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>{t('errorMessage')}:</Text>
                    <Text color="red.500">{currentDebugResult.error_message}</Text>
                  </Box>
                )}

                {currentDebugResult.extracted_data && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>{t('extractedData')}:</Text>
                    <Code
                      display="block"
                      whiteSpace="pre"
                      p={4}
                      borderRadius="md"
                      overflow="auto"
                      maxH="400px"
                    >
                      {JSON.stringify(currentDebugResult.extracted_data, null, 2)}
                    </Code>
                  </Box>
                )}
              </Stack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button onClick={() => setShowDebugResult(false)}>{t('close')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* System Status Footer */}
      {healthData && (
        <Box
          bg={bgColor}
          borderTop="1px"
          borderColor={borderColor}
          py={2}
          px={4}
          position="fixed"
          bottom={0}
          left={0}
          width="100%"
          zIndex={9}
        >
          <Container maxW="container.xl">
            <Stack spacing={2}>
              <Flex justify="space-between" align="center">
                <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('gray.700', 'gray.200')}>
                  {t('systemStatus')}
                </Text>
                <Badge colorScheme={healthData.status === 'healthy' ? 'green' : 'red'} fontSize="xs">
                  {healthData.status === 'healthy' ? t('healthy') : t('unhealthy')}
                </Badge>
              </Flex>
              
              <Grid
                templateColumns={{
                  base: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(6, 1fr)',
                }}
                gap={3}
              >
                <Box>
                  <Text fontSize="xs" color="gray.500">{t('systemVersion')}</Text>
                  <Text fontSize="sm" fontWeight="medium">{healthData.version}</Text>
                </Box>
                
                <Box>
                  <Text fontSize="xs" color="gray.500">{t('systemUptime')}</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {Math.floor(healthData.uptime / 3600)}h {Math.floor((healthData.uptime % 3600) / 60)}m
                  </Text>
                </Box>
                
                <Box>
                  <Text fontSize="xs" color="gray.500">{t('systemPlatform')}</Text>
                  <Text fontSize="sm" fontWeight="medium">{healthData.system_info.platform}</Text>
                </Box>
                
                <Box>
                  <Text fontSize="xs" color="gray.500">{t('pythonVersion')}</Text>
                  <Text fontSize="sm" fontWeight="medium">{healthData.system_info.python_version}</Text>
                </Box>
                
                <Box>
                  <Text fontSize="xs" color="gray.500">{t('cpuCount')}</Text>
                  <Text fontSize="sm" fontWeight="medium">{healthData.system_info.cpu_count}</Text>
                </Box>
                
                <Box>
                  <Text fontSize="xs" color="gray.500">{t('memoryUsage')}</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {((healthData.system_info.memory_total - healthData.system_info.memory_available) / healthData.system_info.memory_total * 100).toFixed(1)}%
                  </Text>
                </Box>
              </Grid>
            </Stack>
          </Container>
        </Box>
      )}
    </Box>
  )
}
