"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Phone,
    Mail,
    Building2,
    MapPin,
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    Loader2,
    Globe,
    Camera
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { isAdmin } from "@/utils/rbac";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const avatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=George",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
];

const vendorSchema = z.object({
    fullName: z.string().min(2, "Name is too short").max(50),
    phoneNumber: z.string().min(10, "Invalid phone number"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    businessName: z.string().optional(),
    address: z.string().optional(),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

export default function VendorRegistration() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const verifyAccess = async () => {
            const admin = await isAdmin();
            if (!admin) {
                setPermissionDenied(true);
            }
        };
        verifyAccess();
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<VendorFormValues>({
        resolver: zodResolver(vendorSchema),
    });

    const onSubmit = async (data: VendorFormValues) => {
        setIsSubmitting(true);

        // Final permission check before saving
        const admin = await isAdmin();
        if (!admin) {
            alert("Permission denied. You must be an admin to register vendors.");
            setIsSubmitting(false);
            return;
        }

        const { error } = await supabase
            .from('vendors')
            .insert([
                {
                    full_name: data.fullName,
                    phone_number: data.phoneNumber,
                    email: data.email,
                    business_name: data.businessName,
                    address: data.address,
                    website: data.website,
                    avatar_url: selectedAvatar,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) {
            console.error("Error saving vendor:", error);
            alert("Failed to save vendor: " + error.message);
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(false);
        setIsSuccess(true);
    };

    return (
        <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-2 sm:p-4">
            <Link
                href="/"
                className="fixed top-4 left-4 flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-semibold group z-50"
            >
                <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center bg-white group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-all shadow-sm">
                    <ArrowLeft size={14} />
                </div>
                <span className="text-xs">Back</span>
            </Link>

            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-[#eee] overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                {/* Left Side - Info */}
                <div className="w-full md:w-[350px] bg-indigo-600 p-8 text-white flex flex-col relative overflow-hidden">
                    {/* Abstract background elements */}
                    <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute -top-24 -right-24 w-96 h-96 border-[40px] border-white rounded-full" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white rounded-full" />
                    </div>

                    <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-lg">
                                <Building2 size={20} strokeWidth={2.5} />
                            </div>
                            <span className="text-xl font-black tracking-tighter">InfiPlus</span>
                        </div>

                        <h1 className="text-2xl font-black mb-4 leading-tight">
                            Grow Your Business <br /> with InfiPlus
                        </h1>
                        <p className="text-indigo-100/80 text-[15px] leading-relaxed mb-8 font-medium">
                            Powerful inventory management platform designed for modern brands.
                        </p>

                        <div className="space-y-6">
                            {[
                                { title: "Smart Inventory", desc: "Real-time tracking & alerts." },
                                { title: "Global Vendor Network", desc: "Verified partners worldwide." },
                                { title: "Secure Payments", desc: "Automated & encrypted." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                                        <CheckCircle2 size={16} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white uppercase text-[10px] tracking-widest mb-0.5">{item.title}</h4>
                                        <p className="text-[12px] text-indigo-100/60 leading-snug">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 mt-auto pt-12 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {avatars.slice(0, 3).map((url, i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-gray-200 overflow-hidden shadow-lg">
                                        <img src={url} alt="User" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs font-bold text-indigo-100 uppercase tracking-widest">
                                Trusted by <span className="text-white">5K+</span> Vendors
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="flex-1 p-6 sm:p-10 relative bg-white">
                    <AnimatePresence mode="wait">
                        {permissionDenied ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center text-center h-full p-6"
                            >
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 font-black text-2xl border-4 border-red-100">!</div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Access Restricted</h3>
                                <p className="text-gray-400 font-bold text-sm max-w-xs mb-8">
                                    Only administrators are authorized to register new vendors within the InfiPlus ledger.
                                </p>
                                <button
                                    onClick={() => router.push("/")}
                                    className="h-12 px-8 bg-gray-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all"
                                >
                                    Return to Overview
                                </button>
                            </motion.div>
                        ) : !isSuccess ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="max-w-xl mx-auto h-full flex flex-col"
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">Create Profile</h2>
                                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[2px]">Step into the future with InfiPlus</p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-1">

                                    {/* Avatar Picker Section */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Profile Photo</label>
                                        <div className="flex flex-wrap gap-3 items-center">
                                            <div className="relative group">
                                                <div className="w-16 h-16 rounded-[20px] bg-indigo-50 border-[3px] border-indigo-100 overflow-hidden shadow-inner relative z-10 transition-transform group-hover:scale-105">
                                                    <img src={selectedAvatar} alt="Selected profile" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="absolute inset-0 bg-indigo-500 rounded-[20px] blur-lg opacity-5 animate-pulse -z-10" />
                                            </div>

                                            <div className="flex-1 flex flex-wrap gap-2">
                                                {avatars.map((url, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setSelectedAvatar(url)}
                                                        className={cn(
                                                            "w-10 h-10 rounded-xl border transition-all p-0.5 overflow-hidden active:scale-90",
                                                            selectedAvatar === url
                                                                ? "border-indigo-600 shadow-lg shadow-indigo-100"
                                                                : "border-gray-100 hover:border-indigo-200"
                                                        )}
                                                    >
                                                        <img src={url} alt="Option" className="w-full h-full object-cover rounded-lg" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Full Name */}
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name *</label>
                                            <div className="relative group">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                                                <input
                                                    {...register("fullName")}
                                                    type="text"
                                                    placeholder="Alex Morgan"
                                                    className={cn(
                                                        "w-full pl-9 pr-3 h-11 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-bold text-gray-800 text-[13px]",
                                                        errors.fullName && "border-red-200 ring-2 ring-red-500/5 bg-red-50/50"
                                                    )}
                                                />
                                            </div>
                                            {errors.fullName && <p className="text-[11px] font-bold text-red-500 ml-1">{errors.fullName.message}</p>}
                                        </div>

                                        {/* Phone - Required */}
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Contact Number *</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                                                <input
                                                    {...register("phoneNumber")}
                                                    type="tel"
                                                    placeholder="+1 (555) 000-0000"
                                                    className={cn(
                                                        "w-full pl-9 pr-3 h-11 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-bold text-gray-800 text-[13px]",
                                                        errors.phoneNumber && "border-red-200 ring-2 ring-red-500/5 bg-red-50/50"
                                                    )}
                                                />
                                            </div>
                                            {errors.phoneNumber && <p className="text-[11px] font-bold text-red-500 ml-1">{errors.phoneNumber.message}</p>}
                                        </div>

                                        {/* Email - Optional */}
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Email <span className="opacity-50 font-medium lowercase">(opt)</span></label>
                                            <div className="relative group">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                                                <input
                                                    {...register("email")}
                                                    type="email"
                                                    placeholder="alex@infiplus.com"
                                                    className="w-full pl-9 pr-3 h-11 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-bold text-gray-800 text-[13px]"
                                                />
                                            </div>
                                        </div>

                                        {/* Business Name - Optional */}
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Business Identity <span className="opacity-50 font-medium lowercase">(opt)</span></label>
                                            <div className="relative group">
                                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                                                <input
                                                    {...register("businessName")}
                                                    type="text"
                                                    placeholder="Global Ventures LTD"
                                                    className="w-full pl-9 pr-3 h-11 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-bold text-gray-800 text-[13px]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Wide Address - Optional */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Official Address <span className="opacity-50 font-medium lowercase">(opt)</span></label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                                            <input
                                                {...register("address")}
                                                type="text"
                                                placeholder="Penthouse 42, Skyline Tower, Dubai"
                                                className="w-full pl-9 pr-3 h-11 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-bold text-gray-800 text-[13px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex flex-col items-center">
                                        <button
                                            disabled={isSubmitting}
                                            type="submit"
                                            className="group w-full h-12 bg-indigo-600 text-white rounded-xl font-black text-[12px] uppercase tracking-[2px] flex items-center justify-center gap-4 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 disabled:opacity-70"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={16} />
                                                    Finalizing...
                                                </>
                                            ) : (
                                                <>
                                                    Registration
                                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                        <p className="text-[10px] text-gray-300 mt-4 font-bold uppercase tracking-[2px] text-center max-w-xs">
                                            Secure 256-bit encrypted.
                                        </p>
                                    </div>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center text-center h-full py-12"
                            >
                                <div className="relative mb-12">
                                    <div className="w-32 h-32 bg-emerald-50 rounded-[44px] flex items-center justify-center relative">
                                        <CheckCircle2 size={56} className="text-emerald-500 relative z-10" strokeWidth={2.5} />
                                    </div>
                                    {/* Floating checkmarks for flair */}
                                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-emerald-500 border border-emerald-50">
                                        <CheckCircle2 size={24} />
                                    </div>
                                </div>

                                <h2 className="text-5xl font-black text-gray-900 mb-6 tracking-tight">Welcome Aboard!</h2>
                                <p className="text-gray-500 font-bold max-w-sm mx-auto mb-12 leading-relaxed text-sm">
                                    Your registration with <span className="text-indigo-600 underline underline-offset-4">InfiPlus</span> has been submitted successfully. We'll activate your dashboard soon.
                                </p>

                                <Link
                                    href="/"
                                    className="px-14 h-16 bg-gray-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[3px] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-95"
                                >
                                    Go to Dashboard
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
