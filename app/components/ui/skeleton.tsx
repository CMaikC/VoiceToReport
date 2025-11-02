// components/ui/skeleton.tsx
// Note : Composant de base pour l'affichage de squelettes de chargement.
// Auteur : Cascade
// Date : 22/10/2025

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
