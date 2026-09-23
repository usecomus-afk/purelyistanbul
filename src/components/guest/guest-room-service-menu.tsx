"use client";

import { useState, useMemo } from 'react';
import { XeniosStore } from '@/lib/store';
import { RoomServiceMenuItem, Hotel } from '@/lib/types';
import { Plus, Minus, Info, Clock, CheckCircle2, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { FirestoreService } from '@/lib/firestore-service';
import { getT } from '@/lib/i18n';

interface Props {
  hotel: Hotel;
  roomNumber: string;
  lang: string;
  onClose: () => void;
}

export function GuestRoomServiceMenu({ hotel, roomNumber, lang, onClose }: Props) {
  const t = getT(lang as any);
  const [items] = useState<RoomServiceMenuItem[]>(() => XeniosStore.getRoomServiceMenu(hotel.id).filter(i => i.available));
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  
  // Cart state: itemId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category));
    return ['Tümü', ...Array.from(cats)];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Tümü') return items;
    return items.filter(i => i.category === selectedCategory);
  }, [items, selectedCategory]);

  const addToCart = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[id] > 1) {
        next[id]--;
      } else {
        delete next[id];
      }
      return next;
    });
  };

  const getQuantity = (id: string) => cart[id] || 0;

  const cartTotal = useMemo(() => {
    let total = 0;
    Object.entries(cart).forEach(([id, qty]) => {
      const item = items.find(i => i.id === id);
      if (item) total += item.price * qty;
    });
    return total;
  }, [cart, items]);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const handleSubmit = async () => {
    if (cartCount === 0) return;
    setIsSubmitting(true);

    const orderDetails = Object.entries(cart).map(([id, qty]) => {
      const item = items.find(i => i.id === id);
      return item ? `${qty}x ${item.name} (${item.price * qty} ${item.currency})` : '';
    }).filter(Boolean);

    const summary = orderDetails.join('\n') + `\n\nToplam: ${cartTotal} EUR`;

    try {
      await FirestoreService.addRequest({
        hotelId: hotel.id,
        hotelName: hotel.name,
        roomNumber: roomNumber,
        serviceKey: 'roomservice',
        serviceTitle: 'Oda Servisi Siparişi',
        notes: summary,
        status: 'pending',
        department: 'Room Service (Mutfak KDS)',
        stage: 'order_received',
        priority: 'standart',
        details: { items: orderDetails, total: cartTotal }
      });

      toast.success('Siparişiniz Alındı!', {
        description: `${hotel.name} Oda ${roomNumber} · Oda Servisi`
      });
      onClose();
    } catch (e) {
      toast.error('Sipariş iletilirken bir hata oluştu.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-zinc-50 rounded-t-3xl sm:rounded-3xl overflow-hidden relative shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-zinc-100 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900">Oda Servisi Menüsü</h3>
            <p className="text-[10px] text-zinc-500 font-mono">Oda {roomNumber}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-700 font-bold bg-zinc-100 hover:bg-zinc-200 rounded-full transition">
          ✕
        </button>
      </div>

      {/* Categories */}
      <div className="flex overflow-x-auto gap-2 p-3 bg-white border-b border-zinc-100 shrink-0 hide-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === cat 
                ? 'bg-amber-500 text-white shadow-sm' 
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {filteredItems.map(item => {
          const qty = getQuantity(item.id);
          return (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-xs border border-zinc-100 flex gap-4 transition-all">
              {/* Image placeholder if none */}
              <div className="w-24 h-24 rounded-xl bg-zinc-100 overflow-hidden shrink-0 relative border border-zinc-100">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300">
                    <UtensilsCrossed className="w-8 h-8" />
                  </div>
                )}
                {/* Price tag */}
                <div className="absolute bottom-1 right-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-bold text-zinc-900 shadow-sm border border-zinc-200/50">
                  {item.price}{item.currency === 'EUR' ? '€' : item.currency}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-zinc-900 text-sm leading-tight line-clamp-2">{item.name}</h4>
                </div>
                
                <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {item.preparationTimeMinutes && (
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-zinc-400 font-medium">
                    <Clock className="w-3 h-3" />
                    ~{item.preparationTimeMinutes} dk
                  </div>
                )}

                <div className="mt-auto pt-3 flex items-center justify-end">
                  {qty === 0 ? (
                    <button 
                      onClick={() => addToCart(item.id)}
                      className="px-4 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 rounded-full text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ekle
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-full p-1">
                      <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-amber-600 shadow-sm hover:bg-zinc-50 transition">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-sm w-4 text-center">{qty}</span>
                      <button onClick={() => addToCart(item.id)} className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm hover:bg-amber-600 transition">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-zinc-500 text-sm">
            Bu kategoride ürün bulunmuyor.
          </div>
        )}
      </div>

      {/* Floating Cart Footer */}
      {cartCount > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pt-12 pb-6">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg transition-all disabled:opacity-70 disabled:cursor-wait"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                {cartCount}
              </div>
              <span className="font-bold">Siparişi Ver</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-lg">
              {cartTotal}€
              <ChevronRight className="w-5 h-5 opacity-70" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
