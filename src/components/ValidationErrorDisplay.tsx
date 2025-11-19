import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react'
import { WarningIcon } from '@chakra-ui/icons'
import type { ValidationError } from '../types/api'
import { useLanguage } from '../i18n/LanguageContext'

interface ValidationErrorDisplayProps {
  errors: ValidationError[]
}

export function ValidationErrorDisplay({ errors }: ValidationErrorDisplayProps) {
  const { t } = useLanguage()
  const errorBgColor = useColorModeValue('red.50', 'red.900')
  const errorBorderColor = useColorModeValue('red.200', 'red.700')

  const getErrorTypeLabel = (type: ValidationError['type']) => {
    switch (type) {
      case 'syntax_error':
        return t('syntaxError')
      case 'import_error':
        return t('importError')
      case 'structure_error':
        return t('structureError')
      case 'field_error':
        return t('fieldError')
      default:
        return type
    }
  }

  const getErrorTypeColor = (type: ValidationError['type']) => {
    switch (type) {
      case 'syntax_error':
        return 'red'
      case 'import_error':
        return 'orange'
      case 'structure_error':
        return 'purple'
      case 'field_error':
        return 'blue'
      default:
        return 'gray'
    }
  }

  return (
    <Alert
      status="error"
      variant="subtle"
      flexDirection="column"
      alignItems="flex-start"
      borderRadius="md"
      bg={errorBgColor}
      borderWidth="1px"
      borderColor={errorBorderColor}
      p={4}
    >
      <HStack mb={3}>
        <AlertIcon as={WarningIcon} />
        <AlertTitle fontSize="md" fontWeight="bold">
          {t('validationErrorTitle')}
        </AlertTitle>
      </HStack>
      
      <AlertDescription width="100%">
        <Text mb={3} fontSize="sm" opacity={0.9}>
          {t('validationErrorDesc')}
        </Text>
        
        <VStack align="stretch" spacing={3}>
          {errors.map((error, index) => (
            <Box
              key={index}
              p={3}
              bg={useColorModeValue('white', 'gray.800')}
              borderRadius="md"
              borderWidth="1px"
              borderColor={useColorModeValue('gray.200', 'gray.700')}
            >
              <HStack mb={2} spacing={2}>
                <Badge colorScheme={getErrorTypeColor(error.type)} fontSize="xs">
                  {getErrorTypeLabel(error.type)}
                </Badge>
                {error.line && (
                  <Badge colorScheme="gray" fontSize="xs">
                    {t('errorAtLine').replace('{line}', error.line.toString())}
                  </Badge>
                )}
              </HStack>
              
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {error.message}
              </Text>
              
              {error.detail && (
                <Text fontSize="xs" opacity={0.8} fontStyle="italic">
                  {error.detail}
                </Text>
              )}
            </Box>
          ))}
        </VStack>
      </AlertDescription>
    </Alert>
  )
}
