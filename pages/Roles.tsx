import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import type { AppUser, UserRoleType } from '../types';

const Roles: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          uid: doc.id
        })) as AppUser[];
        setUsers(usersData);
      } catch (error) {
        toast.error("Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRoleType) => {
    if (currentUser?.role !== 'admin') {
      toast.error("Only admins can change roles.");
      return;
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      setUsers(users.map(u => u.uid === userId ? { ...u, role: newRole } : u));
      toast.success("Role updated successfully.");
    } catch (error) {
      toast.error("Failed to update role.");
    }
  };

  if (loading) {
    return <div className="text-brand-text-secondary">Loading users...</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Roles & Permissions Management</h1>
      <p className="text-lg text-brand-text-secondary mb-8">
        Manage user roles and access levels across the application.
      </p>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="py-3 px-4 text-brand-text-primary font-semibold">User</th>
                <th className="py-3 px-4 text-brand-text-primary font-semibold">Email</th>
                <th className="py-3 px-4 text-brand-text-primary font-semibold">Current Role</th>
                <th className="py-3 px-4 text-brand-text-primary font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid} className="border-b border-brand-border/50 hover:bg-brand-secondary/50">
                  <td className="py-3 px-4 text-brand-text-secondary">{u.displayName || 'Unknown'}</td>
                  <td className="py-3 px-4 text-brand-text-secondary">{u.email}</td>
                  <td className="py-3 px-4 text-brand-text-secondary capitalize">{u.role?.replace('_', ' ')}</td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role || 'user'}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRoleType)}
                      disabled={u.email === 'pastor.eryeza@gmail.com' || currentUser?.role !== 'admin'}
                      className="bg-brand-dark border border-brand-border text-brand-text-primary text-sm rounded-lg focus:ring-brand-accent focus:border-brand-accent block w-full p-2.5"
                    >
                      <option value="user">User</option>
                      <option value="family_lead">Family Lead</option>
                      <option value="group_lead">Group Lead</option>
                      <option value="lead_developer">Lead Developer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Roles;