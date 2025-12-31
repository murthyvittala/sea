import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuthUser, getUserProfile, supabase } from '@/lib/supabase';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', role: '', plan: '' });
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdminAndFetch() {
      const user = await getAuthUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const profile = await getUserProfile(user.id);
      if (profile?.role !== 'admin') {
        setIsAdmin(false);
        return;
      }
      setIsAdmin(true);
      setLoading(true);
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (!error && data) {
        setUser(data);
        setForm({ email: data.email, role: data.role, plan: data.plan });
      }
      setLoading(false);
    }
    if (userId) checkAdminAndFetch();
  }, [userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('users').update({ role: form.role, plan: form.plan }).eq('id', userId);
    setSaving(false);
    router.push('/admin/users');
  }

  if (isAdmin === null || loading) return <div className="p-8">Checking admin access...</div>;
  if (!isAdmin) return <div className="p-8 text-red-600 font-bold">Access denied. Admins only.</div>;
  if (!user) return <div className="p-8">User not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit User</h1>
        <form onSubmit={handleSave} className="bg-white rounded shadow p-6 space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input type="email" value={form.email} disabled className="w-full border rounded px-3 py-2 bg-gray-100" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full border rounded px-3 py-2">
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Plan</label>
            <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} className="w-full border rounded px-3 py-2">
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </form>
      </div>
    </div>
  );
}
