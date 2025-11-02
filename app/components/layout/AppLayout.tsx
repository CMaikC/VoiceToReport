// app/components/layout/AppLayout.tsx
// Note : Composant de layout principal avec un volet latéral et une zone de contenu.
// Auteur : Cascade
// Date : 22/10/2025

import React from 'react';

interface AppLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function AppLayout({ sidebar, children }: AppLayoutProps) {
  return (
    <div className="flex h-full">
      <aside className="w-96 p-4 border-r bg-card">
        {sidebar}
      </aside>
      <main className="flex-1 p-4 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
