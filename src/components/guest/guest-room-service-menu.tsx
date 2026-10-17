"use client";

import { useState, useMemo, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { RoomServiceMenuItem, Hotel } from '@/lib/types';
import { LuxuryServiceIcon } from './luxury-service-icon';
import { Plus, Minus, Clock, ChevronRight, UtensilsCrossed } from 'lucide-react';
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

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: false } }));
    };
  }, []);

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
    <div className="flex flex-col h-[85vh] bg-[#F7F3EA] rounded-t-[24px] sm:rounded-[24px] border-[1.5px] border-[#C4B8A4] overflow-hidden relative shadow-2xl text-[#141414]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-[#FAF8F4] to-[#EDE5D6] border-b border-[#C4B8A4] z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <LuxuryServiceIcon serviceKey="roomservice" className="w-11 h-11" />
          </div>
          <div>
            <h3 className="font-luxury-serif text-[17px] font-bold uppercase tracking-[0.04em] text-[#141414]">Oda Servisi Menüsü</h3>
            <p className="font-luxury-sans text-[11px] text-[#5C4938] font-medium">{hotel.name} · Oda {roomNumber}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 text-[#141414] font-bold bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] rounded-full flex items-center justify-center transition cursor-pointer">
          ✕
        </button>
      </div>

      {/* Categories */}
      <div className="flex overflow-x-auto gap-2 p-3 bg-[#FAF8F4] border-b border-[#D8CBB8] shrink-0 hide-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`font-luxury-sans px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors border cursor-pointer ${
              selectedCategory === cat 
                ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] text-white font-bold border-[#7D5E2A] shadow-sm' 
                : 'bg-[#F7F3EA] text-[#221F1C] font-semibold border-[#C4B8A4] hover:bg-[#EFE8DA]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-44">
        {filteredItems.map(item => {
          const qty = getQuantity(item.id);
          return (
            <div key={item.id} className="luxury-service-card p-3.5 flex gap-3.5 transition-all">
              {/* Image placeholder if none */}
              <div className="w-24 h-24 rounded-2xl bg-[#EFE8DA] overflow-hidden shrink-0 relative border border-[#C4B8A4]">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8E7252]">
                    <UtensilsCrossed className="w-8 h-8 stroke-[1.5]" />
                  </div>
                )}
                {/* Price tag */}
                <div className="absolute bottom-1.5 right-1.5 bg-[#FAF8F4]/95 backdrop-blur-sm px-2 py-0.5 rounded-lg font-luxury-serif text-[12px] font-bold text-[#141414] shadow-sm border border-[#C4B8A4]">
                  {item.price}{item.currency === 'EUR' ? '€' : item.currency}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col min-w-0 font-luxury-sans">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-luxury-serif font-bold text-[#141414] text-[15px] leading-tight line-clamp-2">{item.name}</h4>
                </div>
                
                <p className="text-[11px] text-[#3D352E] mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {item.preparationTimeMinutes && (
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[#6B5A48] font-medium">
                    <Clock className="w-3 h-3 text-[#8E7252]" />
                    ~{item.preparationTimeMinutes} dk
                  </div>
                )}

                <div className="mt-auto pt-2.5 flex items-center justify-end">
                  {qty === 0 ? (
                    <button 
                      onClick={() => addToCart(item.id)}
                      className="px-4 py-1.5 bg-[#FAF8F4] text-[#7D5E2A] hover:bg-[#EFE8DA] border border-[#C4B8A4] rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ekle
                    </button>
                  ) : (
                    <div className="flex items-center gap-2.5 bg-[#FAF8F4] border border-[#C4B8A4] rounded-full p-1 shadow-2xs">
                      <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full bg-white border border-[#D8CBB8] flex items-center justify-center text-[#7D5E2A] shadow-xs hover:bg-[#EFE8DA] transition cursor-pointer">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-extrabold text-sm w-5 text-center text-[#141414] select-none">{qty}</span>
                      <button onClick={() => addToCart(item.id)} className="w-7 h-7 rounded-full bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] flex items-center justify-center text-white shadow-xs transition cursor-pointer">
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
          <div className="text-center py-12 font-luxury-sans text-[#5C4938] text-sm">
            Bu kategoride ürün bulunmuyor.
          </div>
        )}
      </div>

      {/* Floating Cart Footer */}
      {cartCount > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F7F3EA] via-[#F7F3EA]/95 to-transparent pt-10 pb-8 sm:pb-6 z-30">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="font-luxury-sans w-full bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white rounded-2xl p-4 flex items-center justify-between shadow-xl transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                {cartCount}
              </div>
              <span className="font-bold text-base">Siparişi Ver</span>
            </div>
            <div className="flex items-center gap-2 font-luxury-serif font-bold text-lg">
              {cartTotal}€
              <ChevronRight className="w-5 h-5 opacity-80" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
