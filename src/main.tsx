import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppShell from './AppShell';
import './ui.css';

const root = document.getElementById('root')!;
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </React.StrictMode>
);

// Simple import handler to replace data with imported JSON
window.addEventListener('skillrpg_import' as any, (e: Event) => {
  const detail = (e as CustomEvent).detail;
  try {
    localStorage.setItem('skillrpg_ua_v2', JSON.stringify(detail));
    location.reload();
  } catch {
    alert('Не вдалося імпортувати дані');
  }
});

