import type { LucideIcon } from 'lucide-react';

export interface NavItem {
    id: string;
    label: string;
    Icon: LucideIcon;
}

interface BottomNavProps {
    currentTab: string;
    onTabChange: (tab: string) => void;
    tabs: NavItem[];
}

export default function BottomNav({ currentTab, onTabChange, tabs }: BottomNavProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 z-50 px-2 pb-[calc(env(safe-area-inset-bottom)+6px)] pt-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center max-w-lg mx-auto">
                {tabs.map(({ id, label, Icon }) => {
                    const active = currentTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onTabChange(id)}
                            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-all duration-200 relative ${active
                                ? 'text-emerald-600'
                                : 'text-slate-400 hover:text-slate-600 active:scale-90'
                                }`}
                            style={{ transition: 'color 200ms ease, transform 200ms cubic-bezier(0.34,1.56,0.64,1)' }}
                        >
                            {active && (
                                <div className="absolute -top-1.5 w-5 h-0.5 bg-emerald-500 rounded-full" />
                            )}
                            <Icon
                                size={22}
                                strokeWidth={active ? 2.5 : 1.75}
                                className={`transition-all duration-200 ${active ? 'scale-110' : ''}`}
                            />
                            <span className={`text-[9px] font-bold tracking-wide transition-all duration-200 ${active ? 'opacity-100' : 'opacity-60'}`}>
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
