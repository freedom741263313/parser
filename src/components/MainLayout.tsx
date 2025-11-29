import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { FileJson, Activity, Settings, Database, Layout, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

import ParserView from './ParserView';
import UdpDebugger from './UdpDebugger';
import RuleManager from './RuleManager';
import EnumManager from './EnumManager';

const NavItem = ({ to, icon: Icon, label, isCollapsed }: { to: string; icon: any; label: string; isCollapsed: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      title={isCollapsed ? label : undefined}
      className={clsx(
        "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        isCollapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{label}</span>}
    </Link>
  );
};

export function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Router>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {/* Sidebar */}
        <div 
          data-testid="sidebar"
          className={clsx(
            "border-r bg-card flex flex-col transition-all duration-300 ease-in-out",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
          <div className={clsx("h-16 border-b flex items-center px-4", isCollapsed ? "justify-center" : "justify-start gap-2")}>
            <Layout className="h-6 w-6 shrink-0" />
            {!isCollapsed && (
              <h1 className="text-lg font-bold whitespace-nowrap overflow-hidden">
                UDP Parser
              </h1>
            )}
          </div>
          
          <nav className="flex-1 py-4 overflow-hidden">
            <NavItem to="/" icon={FileJson} label="解析器" isCollapsed={isCollapsed} />
            <NavItem to="/debug" icon={Activity} label="UDP 调试" isCollapsed={isCollapsed} />
            <NavItem to="/rules" icon={Settings} label="规则管理" isCollapsed={isCollapsed} />
            <NavItem to="/enums" icon={Database} label="枚举管理" isCollapsed={isCollapsed} />
          </nav>
          
          <div className="p-4 border-t flex flex-col gap-4">
             <div className={clsx("flex", isCollapsed ? "justify-center" : "justify-end")}>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  aria-label="Toggle Sidebar"
                  className="p-2 hover:bg-accent rounded-md text-muted-foreground transition-colors"
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
             </div>
             
            {!isCollapsed && (
              <div className="text-xs text-muted-foreground text-center">
                v1.0.0
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto transition-all duration-300">
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
