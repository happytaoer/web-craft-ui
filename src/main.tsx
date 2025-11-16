import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import App from './App'
import theme from './theme.ts'
import { LanguageProvider } from './i18n/LanguageContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <LanguageProvider>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
