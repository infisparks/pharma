"use client";

import { cn } from "@/lib/utils";
import {
    LayoutGrid,
    Package,
    ShoppingBag,
    Calendar,
    Wallet,
    Rocket,
    Bookmark,
    Send,
    Phone,
    BarChart3,
    User,
    Users,
    UserPlus,
    Zap,
    Stethoscope,
    ShoppingCart,
    History as HistoryIcon,
    Building2,
    Receipt
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
    { icon: Package, label: "Inventory", href: "/" },
    { icon: Building2, label: "Vendors", href: "/vendors" },
    { icon: ShoppingBag, label: "Purchase Entry", href: "/purchase-entry" },
    { icon: ShoppingCart, label: "Sales Entry", href: "/sell" },
    { icon: Receipt, label: "Sales Ledger", href: "/sales-ledger" },
    { icon: HistoryIcon, label: "Purchase Ledger", href: "/purchases" },
    { icon: Package, label: "New Product", href: "/product-registration" },
    { icon: UserPlus, label: "Join InfiPlus", href: "/vendor-registration" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-full w-[80px] bg-white border-r border-[#eee] flex flex-col items-center py-6 z-50">
            <div className="mb-10 text-indigo-600 transition-transform hover:scale-110 active:scale-90 cursor-pointer">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border-2 border-indigo-100 shadow-sm">
                    <Zap size={28} strokeWidth={2.5} fill="currentColor" />
                </div>
            </div>

            <nav className="flex-1 flex flex-col gap-8">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "relative p-2 rounded-xl transition-all duration-200 group",
                                isActive ? "text-indigo-600 bg-indigo-50" : "text-gray-400 hover:text-indigo-500 hover:bg-gray-50"
                            )}
                        >
                            <item.icon size={24} />
                            {isActive && (
                                <div className="absolute left-[-22px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-600 rounded-r-full" />
                            )}
                            {/* Tooltip */}
                            <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto">
                <Link href="/support" className="p-2 text-gray-400 hover:text-indigo-500 transition-colors">
                    <Phone size={24} />
                </Link>
            </div>
        </aside>
    );
}
