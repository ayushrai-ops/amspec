import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileCheck, Bell,
  FileText, Users, Settings, ChevronLeft, ChevronRight,
  LogOut, Shield, Beaker
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { ROLES } from '../../lib/constants';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: 'all' },
  { to: '/labs', icon: Beaker, label: 'Labs', roles: 'all' },
  { to: '/certificates', icon: FileCheck, label: 'Certificates', roles: 'all' },
  { to: '/notifications', icon: Bell, label: 'Notifications', roles: 'all' },
  { to: '/reports', icon: FileText, label: 'Reports', roles: [ROLES.ADMIN, ROLES.LAB_MANAGER, ROLES.AUDITOR] },
  { to: '/users', icon: Users, label: 'User Management', roles: [ROLES.ADMIN] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: [ROLES.ADMIN, ROLES.LAB_MANAGER] },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const location = useLocation();

  const filteredItems = navItems.filter((item) => {
    if (item.roles === 'all') return true;
    return Array.isArray(item.roles) && user && (item.roles as readonly string[]).includes(user.role);
  });

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        minHeight: '100vh',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-primary)',
        transition: 'width var(--transition-normal)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 40,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 8px' : '20px 24px',
        borderBottom: '1px solid var(--border-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: '12px',
        minHeight: '72px',
      }}>
        {collapsed ? (
          <img src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'} style={{ height: '20px', maxWidth: '36px', objectFit: 'contain' }} alt="Logo" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <img src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'} style={{ height: '32px', objectFit: 'contain', alignSelf: 'flex-start' }} alt="AmSpec Logo" />
            <p style={{
              fontSize: '0.6rem',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
            }}>
              Lab Inventory System
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '12px' : '10px 16px',
                borderRadius: '10px',
                marginBottom: '4px',
                textDecoration: 'none',
                color: isActive ? '#06b6d4' : 'var(--text-secondary)',
                background: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                borderLeft: isActive ? '3px solid #06b6d4' : '3px solid transparent',
                transition: 'all var(--transition-fast)',
                justifyContent: collapsed ? 'center' : 'flex-start',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User info & collapse */}
      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid var(--border-primary)',
      }}>
        {!collapsed && user && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'var(--bg-card)',
            marginBottom: '8px',
          }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user.firstName} {user.lastName}
            </p>
            <p style={{
              fontSize: '0.7rem',
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '2px',
            }}>
              <Shield size={10} />
              {user.role.replace('_', ' ')}
            </p>
          </div>
        )}

        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: collapsed ? '12px' : '10px 16px',
            borderRadius: '10px',
            width: '100%',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'all var(--transition-fast)',
          }}
          title="Logout"
        >
          <LogOut size={20} />
          {!collapsed && 'Logout'}
        </button>

        <button
          onClick={onToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '8px',
            width: '100%',
            border: '1px solid var(--border-primary)',
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            marginTop: '8px',
            transition: 'all var(--transition-fast)',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
