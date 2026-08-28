import { useAuthStore } from '../store/auth';

export default function AdminPage() {
  const { isAdmin } = useAuthStore();

  if (!isAdmin()) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
        You do not have admin access
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Administration</h1>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Users</h2>
          <p className="text-gray-500 mb-4">Manage organization users</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Manage Users
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Departments</h2>
          <p className="text-gray-500 mb-4">Manage departments</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Manage Departments
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Categories</h2>
          <p className="text-gray-500 mb-4">Manage memo categories</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Manage Categories
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Reports</h2>
          <p className="text-gray-500 mb-4">View system statistics</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
}
