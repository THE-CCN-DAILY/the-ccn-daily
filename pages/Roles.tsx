import React from 'react';
import Card from '../components/Card';
import type { UserRole } from '../types';
import { UserIcon, PencilIcon, AdminIcon, StepsIcon } from '../components/icons';

const rolesData: UserRole[] = [
  {
    name: 'User',
    description: 'The standard role for every community member. Access to all public content and personal features.',
    icon: UserIcon,
    permissions: [
      'Read all public content (courses, books, podcasts)',
      'Create and manage personal notes and highlights',
      'Participate in community features (Prayer Wall, comments)',
      'Manage own profile and account settings',
      'Track personal progress and achievements',
    ],
  },
  {
    name: 'Content Creator',
    description: 'A trusted role for managing the app\'s content library. Can create, edit, and publish materials.',
    icon: PencilIcon,
    permissions: [
      'All permissions of a standard User',
      'Create, upload, and publish new courses and books',
      'Edit existing content and its metadata',
      'View basic analytics on their own content',
      'Moderate comments on the content they manage',
    ],
  },
  {
    name: 'Admin',
    description: 'The super-user with complete control over the application, its content, and its users.',
    icon: AdminIcon,
    permissions: [
      'All permissions of User and Content Creator',
      'Access the comprehensive Admin Dashboard',
      'Manage all users (assign roles, suspend accounts)',
      'View and analyze all application-wide analytics',
      'Control app-level settings and configurations',
    ],
  },
];

const Roles: React.FC = () => {
  return (
    <div>
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Roles & Permissions</h1>
      <p className="text-lg text-brand-text-secondary mb-8">
        This is our plan for Role-Based Access Control (RBAC), implemented using Firebase Auth Custom Claims. It defines who can perform what actions within the app, ensuring security and proper content management.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {rolesData.map((role) => (
          <Card key={role.name} className="flex flex-col">
            <div className="flex items-center mb-4">
              <role.icon className="w-10 h-10 text-brand-accent mr-4" />
              <div>
                <h3 className="text-2xl font-bold text-brand-text-primary">{role.name}</h3>
                <p className="text-brand-text-secondary text-sm">{role.description}</p>
              </div>
            </div>
            <div className="border-t border-brand-border pt-4 mt-auto">
              <h4 className="font-semibold text-brand-text-primary mb-3">Key Permissions:</h4>
              <ul className="space-y-2">
                {role.permissions.map((permission, index) => (
                  <li key={index} className="flex items-start">
                    <StepsIcon className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-brand-text-secondary text-sm">{permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Roles;