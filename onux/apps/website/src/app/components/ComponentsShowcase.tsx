'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  Card,
  Sidebar,
  GlobalHeader,
  ThemeProvider,
  useCinacoinTheme,
  type SidebarItem,
  type NavItem,
  type User,
} from '@cinacoin/ui'

export default function ComponentsShowcase() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [mockUser, setMockUser] = useState<User | null>(null)

  const sidebarItems: SidebarItem[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <IconHome />,
      active: true,
    },
    {
      key: 'projects',
      label: 'Projects',
      icon: <IconFolder />,
      children: [
        { key: 'project-1', label: 'Project Alpha', href: '#' },
        { key: 'project-2', label: 'Project Beta', href: '#' },
        { key: 'project-3', label: 'Project Gamma', href: '#' },
      ],
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: <IconChart />,
      badge: <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', background: 'var(--cc-primary)', color: 'var(--cc-on-primary)' }}>New</span>,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <IconSettings />,
      href: '#',
    },
  ]

  const navItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '#products' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About', href: '/about' },
    { label: 'Dashboard', href: '#', requireAuth: true, permission: 'admin' },
  ]

  const handleLogin = () => {
    setMockUser({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: undefined,
    })
  }

  const handleLogout = () => {
    setMockUser(null)
  }

  return (
    <ThemeProvider>
      <div style={{ minHeight: '100vh', background: 'var(--cc-canvas-soft)' }}>
        {/* Global Header Demo */}
        <section style={{ borderBottom: '1px solid var(--cc-hairline)', marginBottom: '48px' }}>
          <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px', color: 'var(--cc-ink)' }}>
              Cinacoin UI Component Library
            </h1>
            <p style={{ color: 'var(--cc-body)', marginBottom: '24px' }}>
              Shared component library for all Cinacoin applications
            </p>
          </div>
          <GlobalHeader
            navItems={navItems}
            permissions={mockUser ? ['admin'] : []}
            cta={{ label: 'Get Started', href: '#' }}
            secondaryCta={{ label: 'Log In', href: '#' }}
            auth={{
              user: mockUser,
              isAuthenticated: !!mockUser,
              login: handleLogin,
              logout: handleLogout,
            }}
          />
          <div style={{ padding: '16px 24px', maxWidth: '1400px', margin: '0 auto' }}>
            <Button variant="secondary" size="sm" onClick={mockUser ? handleLogout : handleLogin}>
              {mockUser ? 'Mock Logout' : 'Mock Login'}
            </Button>
          </div>
        </section>

        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          {/* Buttons Section */}
          <section style={{ marginBottom: '64px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--cc-ink)' }}>
              Buttons
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" loading>Loading</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px', color: 'var(--cc-ink)' }}>
                Sizes
              </h3>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>
            </div>
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '12px', color: 'var(--cc-ink)' }}>
                With Icons
              </h3>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Button variant="primary" icon={<IconPlus />}>Add Item</Button>
                <Button variant="secondary" iconRight={<IconArrowRight />}>Next</Button>
              </div>
            </div>
          </section>

          {/* Inputs Section */}
          <section style={{ marginBottom: '64px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--cc-ink)' }}>
              Inputs
            </h2>
            <div style={{ display: 'grid', gap: '24px', maxWidth: '400px' }}>
              <Input
                placeholder="Default input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Input
                placeholder="With left icon"
                leftAddon={<IconSearch />}
              />
              <Input
                placeholder="With right icon"
                rightAddon={<IconEye />}
              />
              <Input
                placeholder="Error state"
                error
                errorMessage="This field is required"
              />
              <Input
                placeholder="With helper text"
                helperText="Enter your email address"
              />
              <Input
                placeholder="Disabled"
                disabled
              />
            </div>
          </section>

          {/* Cards Section */}
          <section style={{ marginBottom: '64px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--cc-ink)' }}>
              Cards
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <Card>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--cc-ink)' }}>
                  Default Card
                </h3>
                <p style={{ color: 'var(--cc-body)' }}>
                  This is a default card with standard styling.
                </p>
              </Card>
              <Card variant="soft">
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--cc-ink)' }}>
                  Soft Card
                </h3>
                <p style={{ color: 'var(--cc-body)' }}>
                  This is a soft card with a subtle background.
                </p>
              </Card>
              <Card variant="featured">
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                  Featured Card
                </h3>
                <p>
                  This is a featured card with primary styling.
                </p>
              </Card>
              <Card
                header={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--cc-ink)' }}>Card with Header</h3>
                    <Button variant="ghost" size="sm">Action</Button>
                  </div>
                }
                footer={
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" size="sm">Cancel</Button>
                    <Button variant="primary" size="sm">Save</Button>
                  </div>
                }
              >
                <p style={{ color: 'var(--cc-body)' }}>
                  This card has a header and footer section.
                </p>
              </Card>
            </div>
          </section>

          {/* Sidebar Section */}
          <section style={{ marginBottom: '64px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--cc-ink)' }}>
              Sidebar
            </h2>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ position: 'relative' }}>
                <Sidebar
                  items={sidebarItems}
                  collapsed={sidebarCollapsed}
                  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                  header={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--cc-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--cc-on-primary)',
                        fontWeight: 600,
                      }}>
                        C
                      </div>
                      {!sidebarCollapsed && <span style={{ fontWeight: 600, color: 'var(--cc-ink)' }}>Cinacoin</span>}
                    </div>
                  }
                  footer={
                    !sidebarCollapsed && (
                      <div style={{ fontSize: '12px', color: 'var(--cc-muted)' }}>
                        v1.0.0
                      </div>
                    )
                  }
                />
              </div>
              <div style={{ flex: 1, padding: '16px', background: 'var(--cc-canvas)', borderRadius: '8px', border: '1px solid var(--cc-hairline)' }}>
                <p style={{ color: 'var(--cc-body)' }}>
                  The sidebar component supports collapsible mode, nested items, badges, and custom header/footer slots.
                </p>
              </div>
            </div>
          </section>

          {/* Theme Section */}
          <section style={{ marginBottom: '64px' }}>
            <ThemeToggleDemo />
          </section>
        </div>
      </div>
    </ThemeProvider>
  )
}

function ThemeToggleDemo() {
  const { theme, toggle } = useCinacoinTheme()

  return (
    <>
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--cc-ink)' }}>
        Theme
      </h2>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--cc-ink)' }}>
              Current Theme: {theme}
            </h3>
            <p style={{ color: 'var(--cc-body)' }}>
              Click the button to toggle between light and dark themes.
            </p>
          </div>
          <Button variant="primary" onClick={toggle}>
            Toggle Theme
          </Button>
        </div>
      </Card>
    </>
  )
}

// Icon components for demo
function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconFolder() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
