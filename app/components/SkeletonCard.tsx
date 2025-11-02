// app/components/SkeletonCard.tsx
// Note : Composant représentant le squelette de chargement pour un élément de la bibliothèque.
// Auteur : Cascade
// Date : 22/10/2025

import { Skeleton } from "@/app/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <div className="group flex flex-col p-3 border rounded-lg bg-card">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 mr-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
      </div>
      <Skeleton className="h-12 w-full mt-3" />
      <div className="flex items-center justify-end space-x-1 mt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-10" />
        <Skeleton className="h-8 w-10" />
      </div>
    </div>
  );
}
