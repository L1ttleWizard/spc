import React from 'react';
import { Home, Search, Library } from "lucide-react";

const SidebarItemSkeleton = () => (
    <div className="flex items-center gap-4 p-2 rounded animate-pulse">
        <div className="w-12 h-12 bg-neutral-800 rounded-md"></div>
        <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
            <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
        </div>
    </div>
);

const CardSkeleton = () => (
    <div className="bg-neutral-900/50 p-4 rounded-lg animate-pulse">
        <div className="w-full h-32 bg-neutral-800 rounded-md mb-4"></div>
        <div className="h-5 bg-neutral-800 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
    </div>
);


export default function Loading(): JSX.Element {
  return (
    <div className="h-screen bg-black text-white flex flex-col">
        <div className="flex flex-1 overflow-hidden">
            <aside className="w-72 p-2 hidden md:flex flex-col gap-2">
                <div className="bg-neutral-900 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-4"><Home size={24} /><div className="h-6 w-20 bg-neutral-800 rounded animate-pulse"></div></div>
                    <div className="flex items-center gap-4"><Search size={24} /><div className="h-6 w-16 bg-neutral-800 rounded animate-pulse"></div></div>
                </div>
                <div className="bg-neutral-900 rounded-lg p-2 flex-grow flex flex-col">
                    <div className="flex items-center gap-4 p-2"><Library size={24} /><div className="h-6 w-24 bg-neutral-800 rounded animate-pulse"></div></div>
                    <div className="px-2 mb-2">
                      <div className="h-8 mb-4"></div>
                      <div className="h-6"></div>
                    </div>
                    <div className="mt-2 space-y-1 px-2 overflow-y-auto">
                        <SidebarItemSkeleton />
                        <SidebarItemSkeleton />
                        <SidebarItemSkeleton />
                        <SidebarItemSkeleton />
                        <SidebarItemSkeleton />
                        <SidebarItemSkeleton />
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-y-scroll">
                <div className="sticky top-0 z-10 p-4 h-[68px] bg-neutral-900/70 backdrop-blur-sm animate-pulse"></div>
                <div className="p-6">
                    <div className="h-9 w-48 bg-neutral-800 rounded mb-6 animate-pulse"></div>
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="mb-8">
                            <div className="h-8 w-64 bg-neutral-800 rounded mb-4 animate-pulse"></div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {[...Array(6)].map((_, j) => <CardSkeleton key={j} />)}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    </div>
  );
}