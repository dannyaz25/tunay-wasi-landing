import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/queryClient';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

const target = import.meta.env.VITE_APP_TARGET;

async function bootstrap() {
  if (target === 'caficultores') {
    const { default: AppCaficultores } = await import('./AppCaficultores');
    createRoot(root!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <AppCaficultores />
        </QueryClientProvider>
      </StrictMode>,
    );
  } else if (target === 'mayoristas') {
    const { default: AppMayoristas } = await import('./AppMayoristas');
    createRoot(root!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <AppMayoristas />
        </QueryClientProvider>
      </StrictMode>,
    );
  } else {
    const { default: AppClientes } = await import('./AppClientes');
    createRoot(root!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <AppClientes />
        </QueryClientProvider>
      </StrictMode>,
    );
  }
}

bootstrap();
