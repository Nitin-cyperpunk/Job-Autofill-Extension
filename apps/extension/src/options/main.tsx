import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import { initTheme } from '@/utils/theme';
import { OptionsPage } from './OptionsPage';

// Apply the saved theme first so the page never flashes the wrong colours.
void initTheme().finally(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <OptionsPage />
    </StrictMode>,
  ),
);
