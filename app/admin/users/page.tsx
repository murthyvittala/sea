"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase, getAuthUser, getUserProfile } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  role: string;
  plan: string;
}

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
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
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) setUsers(data);
      setLoading(false);
    }
    checkAdminAndFetch();
  }, []);

  if (isAdmin === null) return <div className="p-8">Checking admin access...</div>;
  if (!isAdmin) return <div className="p-8 text-red-600 font-bold">Access denied. Admins only.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Users</h1>
        <div className="mb-4">
          <Link href="/admin/users/add" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add User</Link>
        </div>
        <div className="bg-white rounded shadow p-4">
          {loading ? (
            <p className="text-gray-500">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-gray-500">No users found.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2 px-3">Email</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">Plan</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="py-2 px-3">{user.email}</td>
                    <td className="py-2 px-3">{user.role}</td>
                    <td className="py-2 px-3">{user.plan}</td>
                    <td className="py-2 px-3">
                      <Link href={`/admin/users/${user.id}/edit`} className="text-blue-600 hover:underline mr-2">Edit</Link>
                    </td>
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
