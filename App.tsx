import React, { useState } from 'react';
import { Login } from './views/Login';
import { BSideDashboard } from './views/BSideDashboard';
import { CSideDashboard } from './views/CSideDashboard';
import { UserRole } from './types';

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.GUEST);

  const handleLogin = (role: UserRole) => {
    setCurrentRole(role);
  };

  if (currentRole === UserRole.GUEST) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentRole === UserRole.B_SIDE) {
    return <BSideDashboard />;
  }

  if (currentRole === UserRole.C_SIDE) {
    return <CSideDashboard />;
  }

  return null;
};

export default App;
