import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Library, PlusSquare, Heart, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export function Sidebar() {
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
  ];

  const actions: any[] = [];

  return (
    <aside id="sidebar" className="w-60 bg-black h-full flex flex-col p-6 gap-6">
      <div className="flex items-center gap-2 px-2 mb-6">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
          <div className="w-4 h-4 bg-black rotate-45" />
        </div>
        <span className="text-xl font-bold tracking-tighter">dullStar</span>
      </div>

      <nav className="flex flex-col gap-4 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-4 sidebar-icon cursor-pointer transition-all duration-200',
                isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
              )
            }
          >
            <item.icon size={24} className={cn(item.path === '/' && 'fill-current')} />
            <span className="font-bold">{item.label}</span>
          </NavLink>
        ))}
      </nav>


      <div className="mt-auto mb-4 bg-neutral-900 rounded-lg p-4">
        <h4 className="text-sm font-bold mb-2">Admin Portal</h4>
        <p className="text-xs text-neutral-400 mb-3">Authenticate to manage the dullStar database.</p>
        <NavLink to="/admin" className="block w-full py-2 bg-white text-black font-bold rounded-full text-xs text-center hover:bg-neutral-200 transition-colors">
          LOGIN TO FIREBASE
        </NavLink>
      </div>
    </aside>
  );
}
