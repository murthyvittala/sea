"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAuthUser, getUserProfile } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

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

  if (isAdmin === null) {
    return <div className="p-8">Checking admin access...</div>;
  }
  if (!isAdmin) {
    return <div className="p-8 text-red-600 font-bold">Access denied. Admins only.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/users" className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">User Management</h2>
            <p className="text-gray-600">View, add, edit, or remove users. Manage user roles and permissions.</p>
          </Link>
          <Link href="/admin/roles" className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">Role Management</h2>
            <p className="text-gray-600">Create and edit roles. Assign permissions to roles.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
