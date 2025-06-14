/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    // Adicione aqui outras variáveis de ambiente que seu frontend usar,
    // sempre com o prefixo VITE_
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }