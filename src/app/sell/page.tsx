"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import {
    Search,
    Phone,
    Plus,
    Minus,
    Trash2,
    DollarSign,
    ArrowRight,
    CheckCircle2,
    ShoppingCart,
    ShoppingBag,
    SearchX,
    Loader2,
    Wallet
} from "lucide-react";
import { cn, disableScrollOnNumberInput } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

interface CartItem {
    cartId: string;
    id: string; // product_id
    name: string;
    emoji: string;
    category: string;
    unit_value: number; // pieces per pack
    unit_type: string;
    mrp: number; // per pack
    batchCode: string;
    qty: number; // number of packs
    expiryDate: string;
    maxQty: number; // Total packs available for this batch
}

export default function SellPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Database Data
    const [customers, setCustomers] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [stocks, setStocks] = useState<any[]>([]);

    // Header State
    const [customerId, setCustomerId] = useState<string | number>("");
    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerPhone, setNewCustomerPhone] = useState("");
    const [doctorId, setDoctorId] = useState("");
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

    // Cart State
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [overallDiscount, setOverallDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online' | 'Mixed'>('Cash');
    const [cashAmount, setCashAmount] = useState(0);
    const [onlineAmount, setOnlineAmount] = useState(0);

    const customerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Initial Fetch
    const loadData = async () => {
        const [custRes, prodRes, purchaseRes, salesRes] = await Promise.all([
            supabase.from('customers').select('*').order('name'),
            supabase.from('products').select('*').order('name'),
            supabase.from('purchase_items').select('*'),
            supabase.from('sale_items').select('product_id, batch_code, quantity')
        ]);
        if (custRes.data) setCustomers(custRes.data);
        if (prodRes.data) setAllProducts(prodRes.data);

        // Calculate available stock per batch
        const stockMap = new Map<string, number>();

        // Add purchased quantities
        (purchaseRes.data || []).forEach(pi => {
            const key = `${pi.product_id}_${pi.batch_code}`;
            const unitValue = parseFloat(pi.unit_value) || 1;
            const qty = (parseFloat(pi.quantity) + parseFloat(pi.free_quantity || 0)) * unitValue;
            stockMap.set(key, (stockMap.get(key) || 0) + qty);
        });

        // Subtract sold quantities
        (salesRes.data || []).forEach(si => {
            const key = `${si.product_id}_${si.batch_code}`;
            const product = prodRes.data?.find(p => p.id === si.product_id);
            const unitValue = parseFloat(product?.unit_value || 1);
            const qty = parseFloat(si.quantity || 0) * unitValue;
            stockMap.set(key, (stockMap.get(key) || 0) - qty);
        });

        // Convert to array format
        const stocksArray = Array.from(stockMap.entries())
            .filter(([_, qty]) => qty > 0)
            .map(([key, quantity]) => {
                const [product_id, batch_code] = key.split('_');
                const purchaseInfo = (purchaseRes.data || []).find(
                    pi => pi.product_id === parseInt(product_id) && pi.batch_code === batch_code
                );
                return {
                    product_id: parseInt(product_id),
                    batch_code,
                    quantity,
                    expiry_date: purchaseInfo?.expiry_date || '',
                    mrp: purchaseInfo?.mrp || 0
                };
            });

        setStocks(stocksArray);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filter Products based on Stock Availability
    const activeProducts = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return [];

        return allProducts
            .filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.category && p.category.toLowerCase().includes(query)) ||
                (p.brand && p.brand.toLowerCase().includes(query))
            )
            .map(p => {
                const availableStock = stocks
                    .filter(s => s.product_id === p.id)
                    .reduce((acc, s) => acc + (parseFloat(s.quantity) || 0), 0);

                const unitValue = parseFloat(p.unit_value) || 1;
                const availablePacks = Math.floor(availableStock / unitValue);

                return { ...p, availableStock, availablePacks };
            })
            .sort((a, b) => (b.availableStock > 0 ? 1 : 0) - (a.availableStock > 0 ? 1 : 0));
    }, [searchQuery, allProducts, stocks]);

    const addToCart = (product: any) => {
        // Find stock for this product (oldest batch first)
        const productStocks = stocks
            .filter(s => s.product_id === product.id)
            .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

        if (productStocks.length === 0) {
            alert("Insufficient stock in the vault.");
            return;
        }

        const primaryBatch = productStocks[0];

        // Check if batch already in cart
        if (cart.find(c => c.batchCode === primaryBatch.batch_code && c.id === product.id)) {
            alert("This batch is already in the cart. Adjust quantity there.");
            return;
        }

        const unitValue = parseFloat(product.unit_value) || 1;
        const maxPacks = Math.floor(parseFloat(primaryBatch.quantity) / unitValue);

        if (maxPacks < 1) {
            alert("Not enough stock to sell a full pack.");
            return;
        }

        // Fetch MRP from purchase_items
        supabase
            .from('purchase_items')
            .select('mrp')
            .match({ product_id: product.id, batch_code: primaryBatch.batch_code })
            .single()
            .then(({ data }) => {
                const newItem: CartItem = {
                    cartId: Math.random().toString(36).substr(2, 9),
                    id: product.id,
                    name: product.name,
                    emoji: product.emoji || '💊',
                    category: product.category,
                    unit_value: unitValue,
                    unit_type: product.unit_type,
                    mrp: parseFloat(data?.mrp || 0),
                    batchCode: primaryBatch.batch_code,
                    qty: 1,
                    expiryDate: primaryBatch.expiry_date,
                    maxQty: maxPacks
                };

                setCart([newItem, ...cart]);
                setSearchQuery("");
                setIsSearching(false);
            });
    };

    const updateQty = (cartId: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.cartId === cartId) {
                const newQty = Math.max(1, item.qty + delta);

                if (newQty > item.maxQty) {
                    alert(`Only ${item.maxQty} packs available in this batch.`);
                    return item;
                }
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const totals = useMemo(() => {
        const subtotal = cart.reduce((acc, item) => acc + (item.mrp * item.qty), 0);
        const grandTotal = Math.max(0, subtotal - overallDiscount);
        return { subtotal, grandTotal };
    }, [cart, overallDiscount]);

    const balance = useMemo(() => {
        const totalPaid = paymentMethod === 'Mixed' ? (cashAmount + onlineAmount) : (paymentMethod === 'Cash' ? cashAmount : onlineAmount);
        return totalPaid - totals.grandTotal;
    }, [paymentMethod, cashAmount, onlineAmount, totals.grandTotal]);

    const executeSale = async () => {
        if (cart.length === 0) return;

        // Strict Validation
        if (!newCustomerName) { alert("Customer Name is required."); return; }
        if (totals.grandTotal > 0 && balance < -0.01) { alert("Payment is insufficient."); return; }

        setIsSubmitting(true);

        try {
            // 1. Handle Customer
            let finalCustomerId = customerId;
            if (!customerId) {
                const { data: newCust, error: custErr } = await supabase
                    .from('customers')
                    .insert([{ name: newCustomerName, phone: newCustomerPhone }])
                    .select().single();
                if (newCust) finalCustomerId = newCust.id;
            }

            // 2. Create Sale Header
            const { data: sale, error: saleErr } = await supabase
                .from('sales')
                .insert([{
                    customer_id: finalCustomerId || null,
                    total_amount: totals.grandTotal,
                    discount_amount: overallDiscount,
                    payment_method: paymentMethod,
                    cash_amount: paymentMethod === 'Online' ? 0 : cashAmount,
                    online_amount: paymentMethod === 'Cash' ? 0 : onlineAmount,
                    doctor_name: doctorId
                }])
                .select().single();

            if (saleErr) throw saleErr;

            // 3. Process Items (Stock is calculated in real-time from sale_items)
            for (const item of cart) {
                await supabase.from('sale_items').insert([{
                    sale_id: sale.id,
                    product_id: item.id,
                    batch_code: item.batchCode,
                    quantity: item.qty,
                    unit_price: item.mrp,
                    subtotal: item.qty * item.mrp
                }]);
            }

            setIsSuccess(true);
            setCart([]);
            setNewCustomerName("");
            setNewCustomerPhone("");
            setCashAmount(0);
            setOnlineAmount(0);
            setOverallDiscount(0);
            await loadData(); // Refresh stock
        } catch (err: any) {
            alert("Sale Failed: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFF] flex flex-col font-sans">
            <TopBar />

            <main className="flex-1 flex flex-col lg:flex-row p-3 gap-3 overflow-hidden h-[calc(100vh-64px)]">
                {/* [LEFT] Active Terminal */}
                <div className="flex-1 flex flex-col bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden relative">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-white relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-lg">
                                <ShoppingCart size={18} />
                            </div>
                            <div>
                                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] leading-none mb-1">POS Protocol v3.0</h2>
                                <p className="text-[16px] font-black text-gray-800 tracking-tight">Sales Terminal</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 relative" ref={customerRef}>
                            <div className="flex flex-col gap-1 items-end">
                                <input
                                    value={newCustomerName}
                                    onChange={(e) => { setNewCustomerName(e.target.value); setIsCustomerDropdownOpen(true); }}
                                    placeholder="Customer Name *"
                                    className="h-9 px-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none font-bold text-[13px] w-48 transition-all"
                                />
                                <div className="flex items-center gap-2">
                                    <Phone size={10} className="text-gray-300" />
                                    <input
                                        value={newCustomerPhone}
                                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                                        placeholder="Phone"
                                        className="h-6 bg-transparent outline-none font-bold text-[10px] w-36 text-gray-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar pb-36">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20">
                                <ShoppingBag size={80} strokeWidth={1} className="mb-4" />
                                <p className="text-sm font-black uppercase tracking-[4px]">Empty Register</p>
                            </div>
                        ) : cart.map((item) => (
                            <motion.div layout key={item.cartId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-white border border-gray-100 rounded-[24px] shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all border-l-4 border-l-indigo-600">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl shadow-inner">{item.emoji}</div>
                                    <div>
                                        <h4 className="text-[15px] font-black text-gray-900 leading-none mb-1">{item.name}</h4>
                                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            Batch: {item.batchCode} <span className="w-1 h-1 bg-gray-200 rounded-full" /> Exp: {item.expiryDate}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100 h-10">
                                            <button onClick={() => updateQty(item.cartId, -1)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 hover:text-black shadow-sm transition-all"><Minus size={12} strokeWidth={3} /></button>
                                            <input
                                                type="number"
                                                onWheel={disableScrollOnNumberInput}
                                                value={item.qty}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    if (val > item.maxQty) {
                                                        alert(`Only ${item.maxQty} packs available.`);
                                                        return;
                                                    }
                                                    setCart(cart.map(c => c.cartId === item.cartId ? { ...c, qty: val } : c));
                                                }}
                                                className="w-12 bg-transparent text-center text-[15px] font-black text-gray-900 outline-none tabular-nums"
                                            />
                                            <button onClick={() => updateQty(item.cartId, 1)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 hover:text-black shadow-sm transition-all"><Plus size={12} strokeWidth={3} /></button>
                                        </div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase">Available: {item.maxQty} Packs</span>
                                    </div>

                                    <div className="text-right min-w-[100px]">
                                        <div className="text-[18px] font-black text-gray-900 tabular-nums leading-none mb-1">
                                            Rs.{(item.mrp * item.qty).toFixed(2)}
                                        </div>
                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Rs.{item.mrp} / Pack</div>
                                    </div>

                                    <button onClick={() => setCart(cart.filter(i => i.cartId !== item.cartId))} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Grand Total Strip */}
                    <div className="absolute bottom-0 inset-x-0 p-6 bg-gray-900 text-white flex items-center justify-between shadow-2xl z-20">
                        <div className="flex gap-10">
                            <div>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Subtotal</span>
                                <div className="text-[20px] font-black tabular-nums">Rs.{totals.subtotal.toFixed(2)}</div>
                            </div>
                            <div className={cn("px-4 py-2 rounded-2xl flex flex-col justify-center", balance >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                                <span className="text-[9px] font-black uppercase tracking-widest mb-0.5">Payment Balance</span>
                                <div className="text-[16px] font-black tabular-nums">Rs.{balance.toFixed(2)}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[2px] mb-1 block">Final Settlement</span>
                            <div className="text-4xl font-black text-emerald-400 tracking-tighter leading-none tabular-nums">Rs.{totals.grandTotal.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* [RIGHT] Control Panel */}
                <div className="w-full lg:w-[400px] flex flex-col gap-3">
                    <div className="bg-white rounded-[32px] border border-gray-100 p-5 shadow-sm space-y-4">
                        <div className="relative" ref={searchRef}>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3 flex items-center gap-2"><Search size={10} className="text-indigo-600" /> Vault Inventory</h3>
                            <input
                                value={searchQuery}
                                onFocus={() => setIsSearching(true)}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search Product..."
                                className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none font-bold text-[14px]"
                            />
                            {isSearching && searchQuery && (
                                <div className="absolute top-full mt-2 inset-x-0 bg-white border border-gray-100 rounded-3xl shadow-2xl z-[150] overflow-hidden">
                                    <div className="max-h-[400px] overflow-y-auto p-2">
                                        {activeProducts.map(p => (
                                            <button key={p.id} onClick={() => addToCart(p)} disabled={p.availablePacks === 0} className="w-full text-left p-3 rounded-2xl hover:bg-indigo-50 flex items-center gap-3 transition-all group disabled:opacity-50 disabled:cursor-not-allowed">
                                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:bg-white">{p.emoji || '💊'}</div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="text-[14px] font-black text-gray-800 truncate">{p.name}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn("text-[10px] font-bold uppercase tracking-widest", p.availablePacks > 0 ? "text-emerald-600" : "text-red-500")}>
                                                            {p.availablePacks} packs in stock
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">• {p.category}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                        {activeProducts.length === 0 && (
                                            <div className="p-8 text-center flex flex-col items-center opacity-30">
                                                <SearchX size={32} className="mb-2" />
                                                <span className="text-[10px] font-black uppercase">No active stock matches</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Method</label>
                                <div className="grid grid-cols-3 gap-1 bg-gray-50 p-1 rounded-xl">
                                    {(['Cash', 'Online', 'Mixed'] as const).map(m => (
                                        <button key={m} onClick={() => setPaymentMethod(m)} className={cn("py-2 rounded-lg text-[10px] font-black transition-all", paymentMethod === m ? "bg-white text-indigo-600 shadow-sm border border-indigo-100" : "text-gray-400")}>{m}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {(paymentMethod === 'Cash' || paymentMethod === 'Mixed') && (
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cash Amount</span>
                                        <div className="relative">
                                            <Wallet size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                                            <input type="number" onWheel={disableScrollOnNumberInput} value={cashAmount || ""} onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)} className="w-full h-10 pl-8 pr-3 bg-emerald-50/20 border border-emerald-100 rounded-xl font-black text-[14px] text-emerald-700 outline-none" />
                                        </div>
                                    </div>
                                )}
                                {(paymentMethod === 'Online' || paymentMethod === 'Mixed') && (
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Online Amount</span>
                                        <div className="relative">
                                            <DollarSign size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" />
                                            <input type="number" onWheel={disableScrollOnNumberInput} value={onlineAmount || ""} onChange={(e) => setOnlineAmount(parseFloat(e.target.value) || 0)} className="w-full h-10 pl-8 pr-3 bg-indigo-50/20 border border-indigo-100 rounded-xl font-black text-[14px] text-indigo-700 outline-none" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Optional Discount</span>
                                <input type="number" onWheel={disableScrollOnNumberInput} value={overallDiscount || ""} onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)} className="w-full h-10 px-4 bg-gray-50 border border-transparent rounded-xl font-black text-[14px] outline-none" placeholder="Rs. 0.00" />
                            </div>

                            <button onClick={executeSale} disabled={isSubmitting || cart.length === 0} className="w-full h-16 bg-gray-900 text-white rounded-[28px] font-black text-[13px] uppercase tracking-[3px] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl active:scale-95 disabled:opacity-20 mt-4">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <>Finalize Settlement <ArrowRight size={18} /></>}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Success Overlay */}
            <AnimatePresence>
                {isSuccess && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-white/80 backdrop-blur-xl z-[200] flex items-center justify-center">
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[48px] border border-gray-100 shadow-[0_40px_100px_rgba(0,0,0,0.1)] p-12 text-center max-w-sm">
                            <div className="w-24 h-24 bg-emerald-50 rounded-[40px] flex items-center justify-center text-emerald-500 mx-auto mb-8 border border-emerald-100"><CheckCircle2 size={48} strokeWidth={3} /></div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-4">Sale Complete!</h2>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[4px] leading-relaxed mb-10 opacity-50">Transaction recorded successfully</p>
                            <button onClick={() => setIsSuccess(false)} className="w-full h-14 bg-gray-900 text-white rounded-[24px] font-black text-[12px] uppercase tracking-[2px]">Next Sale</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
