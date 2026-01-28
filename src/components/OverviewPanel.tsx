"use client";

import {
    Flame,
    ArrowUpRight,
    Layers,
    ShoppingBag,
    AlertCircle,
    TrendingUp,
    Users,
    DollarSign,
    Box,
    Clock,
    Activity
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function OverviewPanel() {
    return (
        <aside className="w-[340px] flex flex-col gap-6 sticky top-24 pr-4 h-[calc(100vh-140px)] custom-scrollbar overflow-y-auto">

            {/* Core Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard
                    label="SKU Total"
                    value="12,039"
                    icon={<Layers size={14} />}
                    trend="+4.2%"
                    color="indigo"
                />
                <StatCard
                    label="Reserved"
                    value="234"
                    icon={<ShoppingBag size={14} />}
                    trend="-12"
                    color="amber"
                />
                <StatCard
                    label="Stock Alerts"
                    value="2/39"
                    icon={<AlertCircle size={14} />}
                    trend="CRITICAL"
                    color="red"
                />
                <StatCard
                    label="Vendors"
                    value="84"
                    icon={<Users size={14} />}
                    trend="ACTIVE"
                    color="gray"
                    href="/vendors"
                />
            </div>

            {/* Performance Strip */}
            <div className="bg-indigo-600 rounded-[28px] p-6 text-white shadow-xl shadow-indigo-200 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 transition-transform group-hover:scale-125">
                    <TrendingUp size={80} strokeWidth={3} />
                </div>
                <div className="relative z-10 flex flex-col gap-6">
                    <div>
                        <label className="text-[11px] font-black text-indigo-300 uppercase tracking-[3px] block mb-1">Portfolio Valuation</label>
                        <div className="text-3xl font-black tabular-nums leading-none">Rs.42.8M</div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <Clock size={12} className="text-indigo-300" />
                            <span className="text-[11px] font-bold text-indigo-100 uppercase tracking-widest">Update 2m ago</span>
                        </div>
                        <ArrowUpRight size={16} className="text-indigo-300" />
                    </div>
                </div>
            </div>

            {/* High Performance Listings */}
            <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-[3px]">High Performance</h3>
                    <div className="h-[1px] flex-1 mx-4 bg-gray-100" />
                    <Link href="/reports" className="text-[12px] font-black text-indigo-500 uppercase tracking-[3px] hover:underline underline-offset-4">Reports</Link>
                </div>

                <div className="space-y-3">
                    {[
                        { name: "Galactomyces 97%", val: "3492", trend: "+22%", icon: "✨" },
                        { name: "Retinol Serum", val: "2811", trend: "+14%", icon: "💧" },
                        { name: "Sunblock SPF50", val: "1903", trend: "+08%", icon: "☀️" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-50 hover:border-indigo-100 transition-colors cursor-pointer shadow-sm group">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <div>
                                    <div className="text-[13px] font-black text-gray-800 leading-none mb-1">{item.name}</div>
                                    <div className="text-[11px] font-black text-gray-400 tabular-nums">{item.val} Views</div>
                                </div>
                            </div>
                            <div className="text-[11px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                                {item.trend}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Analytics Card */}
            <div className="bg-gray-50 rounded-[24px] p-5 mt-auto">
                <div className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-[3px] mb-4">
                    <Activity size={12} className="text-gray-400" />
                    Movement Data
                </div>
                <div className="flex items-end gap-1.5 h-16">
                    {[40, 60, 45, 90, 65, 80, 50, 70, 40, 85, 30, 95].map((h, i) => (
                        <div
                            key={i}
                            style={{ height: `${h}%` }}
                            className={cn(
                                "flex-1 rounded-t-sm transition-all hover:opacity-80",
                                i === 11 ? "bg-indigo-600" : "bg-gray-200"
                            )}
                        />
                    ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jan 01</div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today</div>
                </div>
            </div>
        </aside>
    );
}

function StatCard({ label, value, icon, trend, color, href }: any) {
    const content = (
        <>
            <div className="flex items-center justify-between">
                <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center",
                    color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                        color === 'amber' ? "bg-amber-50 text-amber-600" :
                            color === 'red' ? "bg-red-50 text-red-600" :
                                "bg-gray-50 text-gray-600"
                )}>
                    {icon}
                </div>
                <span className={cn(
                    "text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider",
                    trend.includes('+') ? "text-emerald-500 bg-emerald-50" :
                        trend.includes('-') ? "text-amber-500 bg-amber-50" :
                            trend === 'CRITICAL' ? "text-red-500 bg-red-50 animate-pulse" :
                                "text-gray-400 bg-gray-50"
                )}>
                    {trend}
                </span>
            </div>
            <div>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-1 group-hover:text-indigo-400 transition-colors">{label}</label>
                <div className="text-2xl font-black text-gray-900 leading-none tabular-nums tracking-tighter">{value}</div>
            </div>
        </>
    );

    const className = cn(
        "bg-white rounded-3xl p-5 border border-gray-50 flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-indigo-50 transition-all group text-left",
        href && "cursor-pointer"
    );

    if (href) {
        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        );
    }

    return (
        <div className={className}>
            {content}
        </div>
    );
}
