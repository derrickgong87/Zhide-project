
import React, { useState, useEffect } from 'react';
import { Login } from './views/Login';
import { BSideDashboard } from './views/BSideDashboard';
import { CSideDashboard } from './views/CSideDashboard';
import { UserRole } from './types';
import { DataService } from './services/dataService';

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.GUEST);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const session = DataService.getCurrentUser();
    if (session) {
      setCurrentRole(session.role);
    }
    setLoading(false);
  }, []);

  const handleLogin = (role: UserRole) => {
    setCurrentRole(role);
  };

  const handleLogout = () => {
    DataService.logout();
    setCurrentRole(UserRole.GUEST);
  }

  if (loading) return null;

  if (currentRole === UserRole.GUEST) {
    return <Login onLogin={handleLogin} />;
  }

  // Wrap dashboards to include logout for demo
  if (currentRole === UserRole.B_SIDE) {
    return (
      <>
        <div className="fixed top-4 right-4 z-50">
           <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-slate-600 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">退出登录</button>
        </div>
        <BSideDashboard />
      </>
    );
  }

  if (currentRole === UserRole.C_SIDE) {
     return (
      <>
        <div className="fixed top-4 right-4 z-50 md:top-6 md:right-8">
           <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-slate-600 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">退出登录</button>
        </div>
        <CSideDashboard />
      </>
    );
  }

  return null;
};

export default App;
