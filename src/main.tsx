import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from '@/shared/queryClient';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

const target = import.meta.env.VITE_APP_TARGET as string | undefined;

async function bootstrap() {
  if (target === 'caficultores') {
    const { default: AppCaficultores } = await import('./AppCaficultores');
    createRoot(root!).render(
      <StrictMode>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <AppCaficultores />
          </QueryClientProvider>
        </HelmetProvider>
      </StrictMode>,
    );
  } else if (target === 'mayoristas') {
    const { default: AppMayoristas } = await import('./AppMayoristas');
    createRoot(root!).render(
      <StrictMode>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <AppMayoristas />
          </QueryClientProvider>
        </HelmetProvider>
      </StrictMode>,
    );
  } else if (target === 'one') {
    const { default: AppONE } = await import('./AppONE');
    createRoot(root!).render(
      <StrictMode>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <AppONE />
          </QueryClientProvider>
        </HelmetProvider>
      </StrictMode>,
    );
  } else {
    const { default: AppClientes } = await import('./AppClientes');
    createRoot(root!).render(
      <StrictMode>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <AppClientes />
          </QueryClientProvider>
        </HelmetProvider>
      </StrictMode>,
    );
  }
}

bootstrap();
