import { useState, useEffect } from 'react';
import { getAuthUser, getUserProfile, supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AddUserPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [plan, setPlan] = useState('free');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      const user = await getAuthUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const profile = await getUserProfile(user.id);
      setIsAdmin(profile?.role === 'admin');
    }
    checkAdmin();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { data, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: false,
    });
    if (signUpError || !data?.user?.id) {
      setError(signUpError?.message || 'Failed to create user');
      setSaving(false);
      return;
    }
    await supabase.from('users').insert({
      id: data.user.id,
      email,
      role,
      plan,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    router.push('/admin/users');
  }

  if (isAdmin === null) return <div className="p-8">Checking admin access...</div>;
  if (!isAdmin) return <div className="p-8 text-red-600 font-bold">Access denied. Admins only.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Add User</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Plan</label>
            <select value={plan} onChange={e => setPlan(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={saving}>{saving ? 'Saving...' : 'Add User'}</button>
        </form>
      </div>
    </div>
  );
}
