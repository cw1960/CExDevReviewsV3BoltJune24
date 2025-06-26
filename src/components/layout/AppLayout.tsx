import React from 'react'
import { AppShell } from '@mantine/core'
import { SideNav } from './SideNav'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <AppShell
      navbar={{ width: 280, breakpoint: 'sm' }}
      padding="md"
    >
      <SideNav />
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  )
}