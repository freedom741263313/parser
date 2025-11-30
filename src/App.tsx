import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { StoreProvider } from './context/StoreContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Main App Component
function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <Router>
          <MainLayout />
        </Router>
      </StoreProvider>
    </ThemeProvider>
  );
}

export default App;
