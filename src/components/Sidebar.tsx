"use client";

import React, { Fragment, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { LibraryItem, LibrarySortType, LibraryFilterType } from '@/types';
import { Home, Search, Library, Check, ChevronDown, Loader2 } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import Link from 'next/link';
import Image from 'next/image';

interface SidebarProps {
  items?: LibraryItem[] | null | undefined;
  currentSort?: LibrarySortType | undefined;
  currentFilter?: LibraryFilterType | undefined;
}

const sortOptions: { value: LibrarySortType; label: string }[] = [
    { value: 'recents', label: 'Недавно прослушанные' },
    { value: 'added', label: 'Недавно добавленные' },
    { value: 'alpha', label: 'По алфавиту' },
    { value: 'creator', label: 'По создателю' },
];

export default function Sidebar({ items, currentSort, currentFilter }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleNavigation = (paramsString: string) => {
    startTransition(() => {
      router.push(`${pathname}?${paramsString}`);
    });
  };

  const handleFilterClick = (filter: LibraryFilterType | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === currentFilter) {
      params.delete('filter');
    } else if (filter) {
      params.set('filter', filter);
    }
    handleNavigation(params.toString());
  }

  const handleSortChange = (newSort: LibrarySortType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    handleNavigation(params.toString());
  }

  const sort = currentSort || 'recents';
  const filter = currentFilter || 'playlist';
  const activeSortLabel = sortOptions.find(opt => opt.value === sort)?.label;
  
  return (
    <aside className="text-gray-400 bg-black fixed left-0 top-0 z-20 h-screen w-72 p-2 hidden md:block">
      <div className="bg-neutral-900 rounded-lg p-4 space-y-4">
        <Link href="/" className="flex items-center gap-4 text-white font-bold">
          <Home size={24} />
          <span>Главная</span>
        </Link>
        <Link href="/search" className="flex items-center gap-4 hover:text-white transition-colors">
          <Search size={24} />
          <span>Поиск</span>
        </Link>
      </div>

      <div className="bg-neutral-900 rounded-lg mt-2 p-2 flex-grow flex flex-col">
        <div className="flex items-center justify-between p-2">
            <button className="flex items-center gap-4 hover:text-white transition-colors w-full">
                <Library size={24} />
                <span className="font-semibold">Медиатека</span>
            </button>
        </div>
        
        <div className="px-2 mb-2">
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => handleFilterClick('playlist')} 
              disabled={isPending}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors disabled:opacity-50 ${filter === 'playlist' ? 'bg-white text-black' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}
            >
              Плейлисты
            </button>
            <button 
              onClick={() => handleFilterClick('album')}
              disabled={isPending}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors disabled:opacity-50 ${filter === 'album' ? 'bg-white text-black' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}
            >
              Альбомы
            </button>
          </div>
          
          <div className="flex justify-between items-center text-sm text-neutral-400">
            <button className="p-2 hover:text-white rounded-full hover:bg-neutral-800" disabled={isPending}>
                <Search size={16} />
            </button>
            
            <div className='flex items-center gap-2'>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Menu as="div" className="relative inline-block text-left">
                  <div>
                      <Menu.Button disabled={isPending} className="inline-flex w-full justify-center items-center gap-x-1 rounded-md px-3 py-2 text-sm font-semibold text-neutral-300 hover:text-white disabled:opacity-50">
                          {activeSortLabel}
                          <ChevronDown className="-mr-1 h-5 w-5" aria-hidden="true" />
                      </Menu.Button>
                  </div>

                  <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                  >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-neutral-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                              <p className="px-4 py-2 text-xs text-neutral-400">Сортировать по</p>
                              {sortOptions.map((option) => (
                                  <Menu.Item key={option.value}>
                                      {({ active }) => (
                                          <button
                                              onClick={() => handleSortChange(option.value)}
                                              className={`flex justify-between items-center w-full px-4 py-2 text-left text-sm font-semibold ${
                                                  active ? 'bg-neutral-700 text-white' : 'text-neutral-300'
                                              }`}
                                          >
                                              {option.label}
                                              {option.value === sort && <Check className="h-4 w-4" />}
                                          </button>
                                      )}
                                  </Menu.Item>
                              ))}
                          </div>
                      </Menu.Items>
                  </Transition>
              </Menu>
            </div>
          </div>
        </div>
        
        <div className={`mt-2 space-y-1 px-2 overflow-y-auto transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
          {items?.map((item) => (
            <Link 
              key={`${item.type}-${item.id}`} 
              href={`/${item.type}/${item.id}`}
              className="flex items-center gap-4 p-2 rounded text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              <div className="w-12 h-12 flex-shrink-0 bg-neutral-700 rounded-md relative">
                {item.imageUrl ? (
                  <Image 
                    src={item.imageUrl} 
                    alt={item.name} 
                    fill
                    className="object-cover rounded-md"
                    sizes="48px"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-700 rounded-md flex items-center justify-center">
                    <span className="text-neutral-400 text-xs">Нет</span>
                  </div>
                )}
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-white truncate">{item.name}</p>
                <p className="text-xs capitalize truncate">{item.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}