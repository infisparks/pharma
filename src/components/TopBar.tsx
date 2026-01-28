"use client";

import { MessageSquare, Settings, User, Zap, Bell, ShieldCheck, Sun, Search, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function TopBar() {
    const supabase = createClient();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };
    return (
        <header className="h-14 border-b border-gray-100 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-[60]">
            {/* Left: System Status */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <Zap size={14} fill="currentColor" strokeWidth={3} />
                    </div>
                    <div>
                        <div className="text-[13px] font-black text-gray-900 leading-none mb-0.5">InfiPlus Dashboard</div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Enterprise Core</span>
                        </div>
                    </div>
                </div>

                <div className="h-6 w-[1px] bg-gray-100" />

                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 hover:bg-white transition-all cursor-pointer group">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] group-hover:text-gray-900 transition-colors">Local Ledger Secured</span>
                </div>
            </div>

            {/* Middle: Integrated Search (Subtle) */}
            <div className="hidden lg:flex relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={14} />
                <input
                    type="text"
                    placeholder="Search anything (Cmd + K)"
                    className="h-9 w-[300px] pl-10 pr-4 bg-gray-50 border-transparent border focus:bg-white focus:border-indigo-100 rounded-xl outline-none text-[13px] font-bold text-gray-700 transition-all placeholder:text-gray-300"
                />
            </div>

            {/* Right: Terminal Actions */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 pr-4 border-r border-gray-100">
                    <TopAction icon={<Bell size={16} />} badge="3" />
                    <TopAction icon={<MessageSquare size={16} />} />
                    <TopAction icon={<LayoutGrid size={16} />} />
                </div>

                <div className="flex items-center gap-3 pl-4">
                    <div className="text-right">
                        <div className="text-[13px] font-black text-gray-900 leading-none mb-0.5">Mudassir S.</div>
                        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Administrator</div>
                    </div>
                    <button className="w-9 h-9 rounded-[14px] bg-gradient-to-tr from-gray-100 to-white border border-gray-200 p-1 group hover:border-indigo-200 transition-all active:scale-95 shadow-sm">
                        <div className="w-full h-full rounded-[10px] overflow-hidden bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <User size={18} strokeWidth={2.5} />
                        </div>
                    </button>
                    <button className="w-8 h-8 rounded-lg text-gray-300 hover:text-gray-900 transition-colors">
                        <Settings size={16} />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-8 h-8 rounded-lg text-gray-300 hover:text-red-500 transition-colors"
                        title="Logout Protocol"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
}

function TopAction({ icon, badge }: { icon: any, badge?: string }) {
    return (
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all relative group">
            {icon}
            {badge && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            )}
        </button>
    )
}
