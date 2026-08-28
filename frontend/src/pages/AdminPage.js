import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import { Plus } from 'lucide-react';
export default function AdminPage() {
    const { isAdmin } = useAuthStore();
    const [tab, setTab] = useState('users');
    if (!isAdmin()) {
        return (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded", children: "You do not have admin access." }));
    }
    return (_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "Administration" }), _jsx("div", { className: "flex gap-2 border-b mb-6", children: ['users', 'departments', 'categories', 'reports'].map((t) => (_jsx("button", { onClick: () => setTab(t), className: `px-5 py-2 text-sm font-medium capitalize border-b-2 transition ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: t }, t))) }), tab === 'users' && _jsx(UsersTab, {}), tab === 'departments' && _jsx(DepartmentsTab, {}), tab === 'categories' && _jsx(CategoriesTab, {}), tab === 'reports' && _jsx(ReportsTab, {})] }));
}
function UsersTab() {
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', designation: '', departmentId: '', role: 'user' });
    const [saving, setSaving] = useState(false);
    const load = () => {
        setLoading(true);
        Promise.all([adminAPI.listUsers(), adminAPI.getDepartments()])
            .then(([uRes, dRes]) => {
            setUsers(uRes.data.users || []);
            setDepartments(dRes.data.departments || []);
        })
            .catch(() => setError('Failed to load users'))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);
    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await adminAPI.createUser(form);
            setForm({ name: '', email: '', password: '', designation: '', departmentId: '', role: 'user' });
            setShowForm(false);
            load();
        }
        catch (err) {
            setError(err.response?.data?.error || 'Failed to create user');
        }
        finally {
            setSaving(false);
        }
    };
    const toggleStatus = async (user) => {
        try {
            await adminAPI.updateUser(user.id, { status: user.status === 'active' ? 'inactive' : 'active' });
            load();
        }
        catch {
            setError('Failed to update user');
        }
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("h2", { className: "text-xl font-semibold", children: ["Users (", users.length, ")"] }), _jsxs("button", { onClick: () => setShowForm(!showForm), className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm", children: [_jsx(Plus, { size: 16 }), " Add User"] })] }), error && _jsx("div", { className: "text-red-600 text-sm mb-3", children: error }), showForm && (_jsxs("form", { onSubmit: handleCreate, className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 grid grid-cols-2 gap-3", children: [_jsx("input", { required: true, placeholder: "Full name", value: form.name, onChange: e => setForm(f => ({ ...f, name: e.target.value })), className: "px-3 py-2 border rounded-lg text-sm" }), _jsx("input", { required: true, type: "email", placeholder: "Email", value: form.email, onChange: e => setForm(f => ({ ...f, email: e.target.value })), className: "px-3 py-2 border rounded-lg text-sm" }), _jsx("input", { required: true, type: "password", placeholder: "Password (min 8)", value: form.password, onChange: e => setForm(f => ({ ...f, password: e.target.value })), className: "px-3 py-2 border rounded-lg text-sm" }), _jsx("input", { placeholder: "Designation", value: form.designation, onChange: e => setForm(f => ({ ...f, designation: e.target.value })), className: "px-3 py-2 border rounded-lg text-sm" }), _jsxs("select", { required: true, value: form.departmentId, onChange: e => setForm(f => ({ ...f, departmentId: e.target.value })), className: "px-3 py-2 border rounded-lg text-sm", children: [_jsx("option", { value: "", children: "Select department" }), departments.map(d => _jsx("option", { value: d.id, children: d.name }, d.id))] }), _jsxs("select", { value: form.role, onChange: e => setForm(f => ({ ...f, role: e.target.value })), className: "px-3 py-2 border rounded-lg text-sm", children: [_jsx("option", { value: "user", children: "User" }), _jsx("option", { value: "admin", children: "Admin" })] }), _jsxs("div", { className: "col-span-2 flex gap-2", children: [_jsx("button", { type: "submit", disabled: saving, className: "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50", children: saving ? 'Creating...' : 'Create User' }), _jsx("button", { type: "button", onClick: () => setShowForm(false), className: "px-4 py-2 bg-gray-200 rounded-lg text-sm", children: "Cancel" })] })] })), loading ? _jsx("p", { className: "text-gray-500", children: "Loading..." }) : (_jsx("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: _jsxs("table", { className: "w-full text-sm text-left", children: [_jsx("thead", { className: "bg-gray-50 border-b", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 font-medium text-gray-600", children: "Name" }), _jsx("th", { className: "px-4 py-3 font-medium text-gray-600", children: "Email" }), _jsx("th", { className: "px-4 py-3 font-medium text-gray-600", children: "Department" }), _jsx("th", { className: "px-4 py-3 font-medium text-gray-600", children: "Role" }), _jsx("th", { className: "px-4 py-3 font-medium text-gray-600", children: "Status" }), _jsx("th", { className: "px-4 py-3 font-medium text-gray-600", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y", children: users.map((u) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-3 font-medium", children: u.name }), _jsx("td", { className: "px-4 py-3 text-gray-500", children: u.email }), _jsx("td", { className: "px-4 py-3", children: u.department?.name || '—' }), _jsx("td", { className: "px-4 py-3 capitalize", children: u.role }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`, children: u.status }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("button", { onClick: () => toggleStatus(u), className: `text-xs px-3 py-1 rounded ${u.status === 'active' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`, children: u.status === 'active' ? 'Deactivate' : 'Activate' }) })] }, u.id))) })] }) }))] }));
}
function DepartmentsTab() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const load = () => {
        adminAPI.getDepartments()
            .then(r => setDepartments(r.data.departments || []))
            .catch(() => setError('Failed to load'))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);
    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await adminAPI.createDepartment({ name, description });
            setName('');
            setDescription('');
            load();
        }
        catch (err) {
            setError(err.response?.data?.error || 'Failed to create');
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Departments" }), error && _jsx("div", { className: "text-red-600 text-sm mb-3", children: error }), _jsxs("form", { onSubmit: handleCreate, className: "bg-white rounded-lg shadow p-4 mb-4 flex gap-3 items-end", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-xs font-medium text-gray-500 mb-1", children: "Department name" }), _jsx("input", { required: true, value: name, onChange: e => setName(e.target.value), placeholder: "e.g. Finance", className: "w-full px-3 py-2 border rounded-lg text-sm" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-xs font-medium text-gray-500 mb-1", children: "Description" }), _jsx("input", { value: description, onChange: e => setDescription(e.target.value), placeholder: "Optional", className: "w-full px-3 py-2 border rounded-lg text-sm" })] }), _jsxs("button", { type: "submit", disabled: saving, className: "flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50", children: [_jsx(Plus, { size: 16 }), " ", saving ? 'Adding...' : 'Add'] })] }), loading ? _jsx("p", { className: "text-gray-500", children: "Loading..." }) : (_jsx("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: _jsxs("table", { className: "w-full text-sm text-left", children: [_jsx("thead", { className: "bg-gray-50 border-b", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 font-medium text-gray-600", children: "Name" }), _jsx("th", { className: "px-4 py-3 font-medium text-gray-600", children: "Description" }), _jsx("th", { className: "px-4 py-3 font-medium text-gray-600", children: "Users" }), _jsx("th", { className: "px-4 py-3 font-medium text-gray-600", children: "Memos" }), _jsx("th", { className: "px-4 py-3 font-medium text-gray-600", children: "Status" })] }) }), _jsx("tbody", { className: "divide-y", children: departments.map((d) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-3 font-medium", children: d.name }), _jsx("td", { className: "px-4 py-3 text-gray-500", children: d.description || '—' }), _jsx("td", { className: "px-4 py-3", children: d._count?.users ?? 0 }), _jsx("td", { className: "px-4 py-3", children: d._count?.memos ?? 0 }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`, children: d.status }) })] }, d.id))) })] }) }))] }));
}
function CategoriesTab() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const load = () => {
        adminAPI.getCategories()
            .then(r => setCategories(r.data.categories || []))
            .catch(() => setError('Failed to load'))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);
    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await adminAPI.createCategory({ name, description });
            setName('');
            setDescription('');
            load();
        }
        catch (err) {
            setError(err.response?.data?.error || 'Failed to create');
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Memo Categories" }), error && _jsx("div", { className: "text-red-600 text-sm mb-3", children: error }), _jsxs("form", { onSubmit: handleCreate, className: "bg-white rounded-lg shadow p-4 mb-4 flex gap-3 items-end", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-xs font-medium text-gray-500 mb-1", children: "Category name" }), _jsx("input", { required: true, value: name, onChange: e => setName(e.target.value), placeholder: "e.g. Financial", className: "w-full px-3 py-2 border rounded-lg text-sm" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-xs font-medium text-gray-500 mb-1", children: "Description" }), _jsx("input", { value: description, onChange: e => setDescription(e.target.value), placeholder: "Optional", className: "w-full px-3 py-2 border rounded-lg text-sm" })] }), _jsxs("button", { type: "submit", disabled: saving, className: "flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50", children: [_jsx(Plus, { size: 16 }), " ", saving ? 'Adding...' : 'Add'] })] }), loading ? _jsx("p", { className: "text-gray-500", children: "Loading..." }) : (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: categories.map((c) => (_jsxs("div", { className: "bg-white rounded-lg shadow p-4", children: [_jsx("p", { className: "font-medium", children: c.name }), c.description && _jsx("p", { className: "text-sm text-gray-500 mt-1", children: c.description }), _jsx("span", { className: `mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`, children: c.status })] }, c.id))) }))] }));
}
function ReportsTab() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        adminAPI.getDashboard()
            .then(r => setStats(r.data.stats))
            .catch(() => setError('Failed to load reports'))
            .finally(() => setLoading(false));
    }, []);
    if (loading)
        return _jsx("p", { className: "text-gray-500", children: "Loading..." });
    if (error)
        return _jsx("p", { className: "text-red-600", children: error });
    const cards = [
        { label: 'Total Users', value: stats?.totalUsers ?? 0, color: 'bg-blue-50 text-blue-700' },
        { label: 'Departments', value: stats?.departments ?? 0, color: 'bg-purple-50 text-purple-700' },
        { label: 'Total Memos', value: stats?.totalMemos ?? 0, color: 'bg-gray-50 text-gray-700' },
        { label: 'Pending', value: stats?.pendingMemos ?? 0, color: 'bg-amber-50 text-amber-700' },
        { label: 'Approved', value: stats?.approvedMemos ?? 0, color: 'bg-green-50 text-green-700' },
        { label: 'Rejected', value: stats?.rejectedMemos ?? 0, color: 'bg-red-50 text-red-700' },
    ];
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Organization Reports" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4", children: cards.map((c) => (_jsxs("div", { className: `rounded-lg p-6 ${c.color}`, children: [_jsx("p", { className: "text-sm font-medium opacity-80", children: c.label }), _jsx("p", { className: "text-4xl font-bold mt-1", children: c.value })] }, c.label))) })] }));
}
