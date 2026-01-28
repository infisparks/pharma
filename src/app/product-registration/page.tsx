"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Check, Loader2, Camera, Database,
    Layers, ArrowLeft, ChevronRight, Activity,
    Scale, Building2, FlaskConical, Sparkles
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

const wellnessEmojis = ["💊", "🧴", "🏥", "🦷", "🌿", "💧", "💊", "💆", "🤸", "💪"];

const productSchema = z.object({
    name: z.string().min(3, "Product name must be at least 3 characters"),
    category: z.string().min(1, "Please select a category"),
    vendorId: z.string().min(1, "Vendor is required"),
    brand: z.string().optional(),
    dosageForm: z.string().min(1, "Dosage form is required"),
    unitValue: z.string().min(1, "Amount is required"),
    unitType: z.string().min(1, "Unit is required"),
    description: z.string().optional(),
    emoji: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductRegistration() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [selectedEmoji, setSelectedEmoji] = useState("💊");
    const [categories, setCategories] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isSavingCategory, setIsSavingCategory] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            emoji: "💊",
            unitType: "mg"
        }
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            const [catsRes, vendorsRes] = await Promise.all([
                supabase.from('product_categories').select('*').order('name'),
                supabase.from('vendors').select('id, full_name, business_name').order('full_name')
            ]);

            if (catsRes.data) setCategories(catsRes.data);
            if (vendorsRes.data) setVendors(vendorsRes.data);
        };
        fetchInitialData();
    }, []);

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setIsSavingCategory(true);
        const { data, error } = await supabase
            .from('product_categories')
            .insert([{ name: newCategoryName }])
            .select();

        if (data) {
            setCategories([...categories, data[0]]);
            setValue("category", data[0].name);
            setIsCreatingCategory(false);
            setNewCategoryName("");
        }
        setIsSavingCategory(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setProfileImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: ProductFormValues) => {
        setIsSubmitting(true);
        const { error } = await supabase
            .from('products')
            .insert([{
                name: data.name,
                category: data.category,
                vendor_id: parseInt(data.vendorId),
                brand: data.brand,
                dosage_form: data.dosageForm,
                unit_value: data.unitValue,
                unit_type: data.unitType,
                description: data.description,
                emoji: data.emoji,
                image_url: profileImage
            }]);

        if (!error) {
            setIsSuccess(true);
            reset();
            setProfileImage(null);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-[#FDFDFF] flex flex-col font-[family-name:var(--font-outfit)]">
            {/* Top Nav */}
            <nav className="h-12 border-b border-gray-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-600 transition-all">
                        <ArrowLeft size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[2px]">Dashboard</span>
                    </Link>
                    <div className="h-4 w-[1px] bg-gray-200" />
                    <div className="flex items-center gap-2">
                        <Layers size={14} className="text-gray-300" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Catalog / New Master Profile</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">InfiPlus Vault Protocol</span>
                </div>
            </nav>

            <main className="flex-1 flex flex-col items-center justify-start p-4 lg:p-8">
                <div className="w-full max-w-[900px]">
                    <AnimatePresence mode="wait">
                        {!isSuccess ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.99 }}
                                className="bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden"
                            >
                                <div className="h-1 bg-indigo-600 w-full" />

                                <div className="p-6 md:p-8">
                                    <div className="mb-6 flex flex-row items-center gap-5 text-left border-b border-gray-50 pb-6">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-[14px] flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                                            {profileImage ? (
                                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover rounded-[14px]" />
                                            ) : (
                                                <Database size={20} strokeWidth={2.5} />
                                            )}
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-100 shadow flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                <Camera size={8} />
                                            </div>
                                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                                        </div>
                                        <div>
                                            <h1 className="text-xl font-black text-gray-900 tracking-tighter mb-0.5">Product Profile Registry</h1>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[2px]">Establish Official Master Catalog Identity</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                                            {/* Left Column: Visuals */}
                                            <div className="md:col-span-4 space-y-5">
                                                <div className="space-y-2.5">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] block pl-1">Visual Marker</label>
                                                    <div className="w-full aspect-square bg-gray-50 rounded-[20px] border border-gray-100 flex items-center justify-center relative overflow-hidden group shadow-inner">
                                                        {profileImage ? (
                                                            <img src={profileImage} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="text-center p-4">
                                                                <div className="text-3xl mb-1 opacity-20 filter grayscale">💊</div>
                                                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-[1px]">No Identity Set</p>
                                                            </div>
                                                        )}
                                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                            <span className="bg-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest text-indigo-600 shadow-xl">Update</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2.5">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] block pl-1">Category Emoji</label>
                                                    <div className="grid grid-cols-5 gap-1 p-1.5 bg-gray-50/50 rounded-xl border border-gray-50">
                                                        {wellnessEmojis.map(emoji => (
                                                            <button
                                                                key={emoji} type="button"
                                                                onClick={() => { setSelectedEmoji(emoji); setValue("emoji", emoji); }}
                                                                className={cn(
                                                                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all",
                                                                    selectedEmoji === emoji ? "bg-white shadow-sm border border-gray-100 scale-105" : "hover:bg-white/50"
                                                                )}
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Fields */}
                                            <div className="md:col-span-8 space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] block pl-1">Official Product Title *</label>
                                                    <input
                                                        {...register("name")}
                                                        placeholder="e.g. HYALU GEL PLUS"
                                                        className={cn(
                                                            "w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-bold text-gray-800 text-[12px] shadow-sm",
                                                            errors.name && "border-red-200"
                                                        )}
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] block pl-1">Supplier Association *</label>
                                                    <div className="relative group">
                                                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                                                        <select
                                                            {...register("vendorId")}
                                                            className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-lg focus:bg-white outline-none transition-all font-bold text-gray-800 text-[11px] appearance-none"
                                                        >
                                                            <option value="">Link to Vendor...</option>
                                                            {vendors.map(v => (
                                                                <option key={v.id} value={v.id}>{v.full_name} ({v.business_name || 'Individual'})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between pl-1">
                                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[3px]">Classification</label>
                                                            <button type="button" onClick={() => setIsCreatingCategory(!isCreatingCategory)} className="text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:underline">+ New</button>
                                                        </div>
                                                        {isCreatingCategory ? (
                                                            <div className="flex gap-1">
                                                                <input autoFocus value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Name..." className="flex-1 h-10 px-3 bg-white border border-indigo-200 rounded-lg font-bold text-gray-800 text-[11px]" />
                                                                <button type="button" onClick={handleCreateCategory} disabled={isSavingCategory} className="h-10 px-3 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase">Add</button>
                                                            </div>
                                                        ) : (
                                                            <select {...register("category")} className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-lg outline-none font-bold text-gray-800 text-[11px] appearance-none cursor-pointer">
                                                                <option value="">Category...</option>
                                                                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                                            </select>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] block pl-1">Brand Identifier</label>
                                                        <input {...register("brand")} placeholder="e.g. InfiPlus" className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-lg outline-none font-bold text-gray-800 text-[11px]" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] block pl-1">Dosage Form *</label>
                                                        <div className="relative">
                                                            <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                                                            <select {...register("dosageForm")} className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-lg outline-none font-bold text-gray-800 text-[11px] appearance-none">
                                                                <option value="">Form...</option>
                                                                {["Tablet", "Capsule", "Syrup", "Injection", "Serum", "Gel", "Cream", "Lotion"].map(form => <option key={form} value={form}>{form}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] block pl-1">Pack Size / Net Content *</label>
                                                        <div className="flex border border-gray-100 rounded-lg overflow-hidden shadow-sm bg-gray-50">
                                                            <div className="relative flex-1">
                                                                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={12} />
                                                                <input
                                                                    {...register("unitValue")}
                                                                    placeholder="Value"
                                                                    className="w-full h-10 pl-9 pr-2 bg-transparent outline-none font-bold text-gray-800 text-[11px]"
                                                                />
                                                            </div>
                                                            <div className="w-[1px] bg-gray-200 h-5 self-center" />
                                                            <select
                                                                {...register("unitType")}
                                                                className="w-20 h-10 px-1 bg-transparent outline-none font-black text-gray-500 text-[9px] uppercase appearance-none text-center cursor-pointer hover:bg-white transition-colors"
                                                            >
                                                                {["mg", "ml", "mcg", "g", "IU", "vial", "pack", "Strips", "Tablets"].map(u => <option key={u} value={u}>{u}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] block pl-1">Identity Specifications</label>
                                                    <div className="relative group">
                                                        <FlaskConical className="absolute left-3.5 top-3 text-gray-400" size={13} />
                                                        <textarea
                                                            {...register("description")}
                                                            rows={2}
                                                            placeholder="Chemical composition or usage specs..."
                                                            className="w-full py-2 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-lg outline-none font-bold text-gray-800 text-[11px] resize-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <div className="flex items-center gap-2 opacity-40">
                                                <Sparkles size={11} className="text-indigo-600" />
                                                <span className="text-[8px] font-black uppercase tracking-[2px]">Encrypted Register</span>
                                            </div>
                                            <button
                                                disabled={isSubmitting}
                                                type="submit"
                                                className="h-10 px-6 bg-gray-900 text-white rounded-lg font-black text-[9px] uppercase tracking-[2px] flex items-center gap-2 hover:bg-black active:scale-95 transition-all shadow-lg"
                                            >
                                                {isSubmitting ? <Loader2 className="animate-spin" size={12} /> : <>Create Profile <ChevronRight size={12} /></>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[24px] border border-gray-100 p-12 flex flex-col items-center text-center shadow-xl"
                            >
                                <div className="w-16 h-16 bg-emerald-50 rounded-[20px] flex items-center justify-center mb-6 border border-emerald-100">
                                    <Check size={28} className="text-emerald-500" strokeWidth={3.5} />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 mb-1 tracking-tight">Identity Registry Updated.</h2>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[2px] mb-8">Official profile established in the vault</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setIsSuccess(false)} className="h-10 px-6 border border-gray-200 rounded-lg font-black text-[9px] uppercase tracking-[2px] text-gray-400 hover:text-gray-900 transition-all">Add Another</button>
                                    <Link href="/purchase-entry" className="h-10 px-8 bg-gray-900 text-white rounded-lg font-black text-[9px] uppercase tracking-[2px] flex items-center justify-center hover:bg-indigo-600 transition-all shadow-sm">Go to Purchase Entry</Link>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
