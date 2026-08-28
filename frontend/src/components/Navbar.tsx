import { useAuthStore } from '../store/auth';
import { LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Memo System</h1>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <Bell size={20} />
        </button>
        <div className="flex items-center gap-2 pl-4 border-l">
          <div className="text-right text-sm">
            <p className="font-medium">{user?.name}</p>
            <p className="text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
