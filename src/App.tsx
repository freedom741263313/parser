import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { FileJson, Activity, Settings, Database, Layout } from 'lucide-react';
import clsx from 'clsx';

import ParserView from './components/ParserView';
import UdpDebugger from './components/UdpDebugger';
import RuleManager from './components/RuleManager';
import EnumManager from './components/EnumManager';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={clsx(
        "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
};

// Main App Component
function App() {
  return (
    <Router>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-card flex flex-col">
          <div className="p-6 border-b">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Layout className="h-5 w-5" />
              UDP Parser
            </h1>
          </div>
          
          <nav className="flex-1 py-4">
            <NavItem to="/" icon={FileJson} label="解析器" />
            <NavItem to="/debug" icon={Activity} label="UDP 调试" />
            <NavItem to="/rules" icon={Settings} label="规则管理" />
            <NavItem to="/enums" icon={Database} label="枚举管理" />
          </nav>
          
          <div className="p-4 border-t text-xs text-muted-foreground">
            v1.0.0
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Routes>
              <Route path="/" element={<ParserView />} />
              <Route path="/debug" element={<UdpDebugger />} />
              <Route path="/rules" element={<RuleManager />} />
              <Route path="/enums" element={<EnumManager />} />
            </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
