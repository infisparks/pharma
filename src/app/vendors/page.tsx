"use client";

import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { mockVendors, Vendor } from "@/data/vendors";
import {
    Search,
    MoreVertical,
    Star,
    ExternalLink,
    Mail,
    Phone,
    MapPin,
    Filter,
    ArrowUpDown,
    UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useEffect } from "react";

export default function VendorsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Pending' | 'Suspended'>('All');
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchVendors = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('vendors')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching vendors:", error);
            } else {
                setVendors(data || []);
            }
            setLoading(false);
        };

        fetchVendors();
    }, []);

    const filteredVendors = vendors.filter(vendor => {
        const matchesSearch = (vendor.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (vendor.business_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (vendor.email || "").toLowerCase().includes(searchQuery.toLowerCase());

        // Use database fields or default to 'Active' for legacy mock data rendering
        const status = vendor.status || 'Active';
        const matchesFilter = activeFilter === 'All' || status === activeFilter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen bg-[#f8f9fc] flex flex-col">
            <TopBar />

            <main className="flex-1 p-8 max-w-[1400px] mx-auto w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Active Vendors</h1>
                        <div className="flex items-center gap-4">
                            <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                {filteredVendors.length} Total
                            </span>
                            <p className="text-gray-400 font-medium text-sm">Manage and track all your registered partner vendors.</p>
                        </div>
                    </div>

                    <Link
                        href="/vendor-registration"
                        className="flex items-center gap-2 bg-gray-900 text-white px-6 h-12 rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200 w-fit"
                    >
                        <UserPlus size={18} />
                        Add New Vendor
                    </Link>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-[32px] p-4 border border-[#eee] mb-8 flex flex-col lg:flex-row items-center gap-4 shadow-sm">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, company or email..."
                            className="w-full pl-14 pr-6 h-14 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-medium text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-full lg:w-auto">
                        {['All', 'Active', 'Pending', 'Suspended'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter as any)}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    activeFilter === filter
                                        ? "bg-white text-indigo-600 shadow-sm border border-gray-100"
                                        : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    <button className="flex items-center gap-2 px-6 h-14 bg-white border border-gray-100 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all">
                        <Filter size={18} />
                        <span className="hidden sm:inline">Advanced Filters</span>
                    </button>
                </div>

                {/* Vendor Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"
                        />
                        <p className="text-gray-400 font-black uppercase tracking-[3px] text-[10px]">Accessing Database...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVendors.map((vendor, idx) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={vendor.id}
                                className="group bg-white rounded-[32px] border border-[#eee] p-8 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:border-indigo-100 transition-all duration-300 relative overflow-hidden"
                            >
                                {/* Status Badge */}
                                <div className="absolute top-6 right-6">
                                    <span className={cn(
                                        "text-[8px] font-black uppercase tracking-[2px] px-3 py-1.5 rounded-full",
                                        (vendor.status || 'Active') === 'Active' ? "bg-emerald-50 text-emerald-600" :
                                            vendor.status === 'Pending' ? "bg-amber-50 text-amber-600" :
                                                "bg-red-50 text-red-600"
                                    )}>
                                        {vendor.status || 'Active'}
                                    </span>
                                </div>

                                {/* Profile Header */}
                                <div className="flex items-start gap-5 mb-8">
                                    <div className="w-20 h-20 rounded-[28px] bg-gray-50 border-2 border-white shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                        <img
                                            src={vendor.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${vendor.full_name}`}
                                            alt={vendor.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <h3 className="text-xl font-black text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                            {vendor.full_name}
                                        </h3>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                            {vendor.business_name || "Independent Vendor"}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-50">
                                        <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                                            <Star size={14} fill="currentColor" />
                                            <span className="text-sm font-black text-gray-900">{vendor.rating > 0 ? vendor.rating : 'N/A'}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[1px]">Vendor Rating</p>
                                    </div>
                                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-50">
                                        <div className="text-sm font-black text-gray-900 mb-1">{vendor.total_products || 0}</div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[1px]">Total Products</p>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-4 mb-10">
                                    <div className="flex items-center gap-3 text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer group/item">
                                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center group-hover/item:border-indigo-100 transition-all">
                                            <Mail size={14} />
                                        </div>
                                        <span className="text-xs font-bold truncate">{vendor.email || "No email listed"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer group/item">
                                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center group-hover/item:border-indigo-100 transition-all">
                                            <Phone size={14} />
                                        </div>
                                        <span className="text-xs font-bold">{vendor.phone_number || "No phone listed"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                                            <MapPin size={14} />
                                        </div>
                                        <span className="text-xs font-bold line-clamp-1">{vendor.address || "No address provided"}</span>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex items-center gap-3 pt-6 border-t border-gray-50">
                                    <button className="flex-1 h-12 bg-white border border-gray-100 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center gap-2">
                                        View Profile
                                        <ExternalLink size={14} />
                                    </button>
                                    <button className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {!loading && filteredVendors.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-[32px] flex items-center justify-center mb-6 text-gray-300">
                            <Search size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">No vendors found</h3>
                        <p className="text-gray-400 font-medium">Try adjusting your search or filters to find what you're looking for.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
