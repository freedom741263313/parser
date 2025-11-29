import React from 'react';
import { MainLayout } from './components/MainLayout';
import { StoreProvider } from './context/StoreContext';

// Main App Component
function App() {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
}

export default App;
