"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAuthUser, getUserProfile, supabase } from '@/lib/supabase';

interface Role {
  id: number;
  name: string;
  description: string;
}

export default function RoleListPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
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
      const { data, error } = await supabase.from('roles').select('*');
      if (!error && data) setRoles(data);
      setLoading(false);
    }
    checkAdminAndFetch();
  }, []);

  if (isAdmin === null) return <div className="p-8">Checking admin access...</div>;
  if (!isAdmin) return <div className="p-8 text-red-600 font-bold">Access denied. Admins only.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Roles</h1>
        <div className="mb-4">
          <Link href="/admin/roles/add" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Role</Link>
        </div>
        <div className="bg-white rounded shadow p-4">
          {loading ? (
            <p className="text-gray-500">Loading roles...</p>
          ) : roles.length === 0 ? (
            <p className="text-gray-500">No roles found.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="border-t">
                    <td className="py-2 px-3">{role.name}</td>
                    <td className="py-2 px-3">{role.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
