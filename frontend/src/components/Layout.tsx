import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex h-screen bg-canvas-pattern p-3 gap-3 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 gap-3">
        <Navbar />
        <main className="flex-1 overflow-auto rounded-4xl fade-in">
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
