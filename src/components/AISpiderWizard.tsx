import { useState } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Alert,
  AlertIcon,
  useToast,
  FormControl,
  FormLabel,
} from '@chakra-ui/react'
import { FaRobot } from 'react-icons/fa'
import { urlPreviewService, PagePreview } from '../services/urlPreviewService'
import { AIChatPanel } from './AIChatPanel'
import { useLanguage } from '../i18n/LanguageContext'

interface AISpiderWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (code: string, spiderName: string) => void
}

export function AISpiderWizard({ isOpen, onClose, onComplete }: AISpiderWizardProps) {
  const toast = useToast()
  const { t } = useLanguage()
  
  // State
  const [targetUrl, setTargetUrl] = useState('')
  const [spiderName, setSpiderName] = useState('')
  const [fetchingPage, setFetchingPage] = useState(false)
  const [pagePreview, setPagePreview] = useState<PagePreview | null>(null)
  const [showAIChat, setShowAIChat] = useState(false)

  const handleFetchPage = async () => {
    if (!targetUrl.trim()) {
      toast({
        title: t('enterTargetUrl'),
        status: 'warning',
        duration: 3000,
      })
      return
    }

    if (!spiderName.trim()) {
      toast({
        title: t('enterSpiderName'),
        status: 'warning',
        duration: 3000,
      })
      return
    }

    // Validate spider name format
    if (!/^[a-z][a-z0-9_]*$/.test(spiderName)) {
      toast({
        title: t('spiderNameFormatError'),
        description: t('spiderNameFormatDesc'),
        status: 'error',
        duration: 5000,
      })
      return
    }

    setFetchingPage(true)
    try {
      const preview = await urlPreviewService.fetchPageContent(targetUrl)
      
      if (preview.success) {
        setPagePreview(preview)
        // Directly open AI chat after fetching page content
        setShowAIChat(true)
        toast({
          title: t('pageFetchSuccess'),
          description: t('pageFetchSuccessDesc').replace('{size}', (preview.contentLength / 1024).toFixed(2)),
          status: 'success',
          duration: 2000,
        })
      } else {
        toast({
          title: t('pageFetchFailed'),
          description: preview.errorMessage,
          status: 'error',
          duration: 5000,
        })
      }
    } catch (error) {
      toast({
        title: t('fetchFailed'),
        description: error instanceof Error ? error.message : t('unknownError'),
        status: 'error',
        duration: 5000,
      })
    } finally {
      setFetchingPage(false)
    }
  }

  const handleApplyCode = (code: string) => {
    setShowAIChat(false)
    // Directly complete after code is applied
    if (code && spiderName) {
      onComplete(code, spiderName)
      handleReset()
    }
  }

  const handleReset = () => {
    setTargetUrl('')
    setSpiderName('')
    setPagePreview(null)
    setShowAIChat(false)
    onClose()
  }

  return (
    <>
      <Modal isOpen={isOpen && !showAIChat} onClose={handleReset} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FaRobot />
              <Text>{t('aiSpiderWizardTitle')}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text>{t('wizardInputPrompt')}</Text>
              </Alert>

              <FormControl isRequired>
                <FormLabel>{t('wizardSpiderNameLabel')}</FormLabel>
                <Input
                  placeholder={t('wizardSpiderNamePlaceholder')}
                  value={spiderName}
                  onChange={(e) => setSpiderName(e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>{t('wizardTargetUrlLabel')}</FormLabel>
                <Input
                  placeholder={t('wizardTargetUrlPlaceholder')}
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                />
              </FormControl>

              <Button
                colorScheme="blue"
                onClick={handleFetchPage}
                isLoading={fetchingPage}
                loadingText={t('fetchingPageAndOpenAI')}
                leftIcon={<FaRobot />}
                size="lg"
              >
                {t('startGenerate')}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* AI Chat Panel */}
      {pagePreview && (
        <AIChatPanel
          isOpen={showAIChat}
          onClose={() => setShowAIChat(false)}
          onApplyCode={handleApplyCode}
          htmlContext={{
            url: pagePreview.url,
            htmlContent: pagePreview.htmlContent,
            title: pagePreview.title
          }}
        />
      )}
    </>
  )
}
