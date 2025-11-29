import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { StoreProvider } from './context/StoreContext';

// Main App Component
function App() {
  return (
    <StoreProvider>
      <Router>
        <MainLayout />
      </Router>
    </StoreProvider>
  );
}

export default App;
