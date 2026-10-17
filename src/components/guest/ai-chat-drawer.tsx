"use client";

import { Hotel, Language, GuestProfile } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { XeniosStore } from '@/lib/store';
import { askGeminiConcierge, ChatMessage } from '@/lib/gemini';
import { useState, useEffect, useRef } from 'react';
import { GuestPreferenceSurvey } from './guest-preference-survey';
import { Send, User, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AiChatDrawerProps {
  hotel: Hotel;
  roomNumber: string;
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_GREETING_TR = "Merhaba! Ben comus, Sizin kişisel İstanbul rehberinizim. Gün batımı tekne turları, Tarihi Yarımada'nın gizli lezzetleri, İstanbul’da yatırım veya size özel rotalar hakkında dilediğinizi sorabilirsiniz.\n\n✨ 'Beni Tanı' butonuna tıklayarak size özel rehberlik etmemi özelleştirebilirsiniz.";

function ComusSpiralIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <circle cx="14" cy="14" r="11" stroke="#8E7252" strokeWidth="1.35" strokeDasharray="3 2" />
      <path
        d="M14 14C14 12.6 15.2 11.5 16.5 11.5C18.5 11.5 20 13.2 20 15.3C20 18.2 17.5 20.5 14.3 20.5C10.4 20.5 7.3 17.3 7.3 13.3C7.3 8.6 11.1 5 15.8 5C20.8 5 24.5 8.8 24.5 14"
        stroke="#1D2025"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 14C14.8 14 15.4 14.6 15.4 15.4C15.4 16.7 14.2 17.7 12.8 17.7C10.8 17.7 9.3 16 9.3 13.9C9.3 11.1 11.6 8.8 14.5 8.8C17.9 8.8 20.6 11.5 20.6 15"
        stroke="#8E7252"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="14" cy="14" r="1.6" fill="#8E7252" />
    </svg>
  );
}

export function AiChatDrawer({ hotel, roomNumber, lang, isOpen, onClose }: AiChatDrawerProps) {
  const t = getT(lang);
  const [profile, setProfile] = useState<GuestProfile>(XeniosStore.getGuestProfile());
  const [showSurvey, setShowSurvey] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = XeniosStore.getAiChatMessages();
    if (saved && saved.length > 0) return saved;
    return [
      {
        id: 'init-1',
        sender: 'assistant',
        text: t.aiGreeting || DEFAULT_GREETING_TR,
        time: 'Now',
        actions: [
          {
            id: 'act-know-me',
            label: `✨ ${t.knowMeBtn || 'Beni Tanı'} (Kişisel Rehberliği Özelleştir)`,
            type: 'OPEN_SURVEY'
          }
        ],
        recommendations: [
          { title: "Bosphorus Sunset & Dinner Cruise", category: "Boğaz & Tekne", location: "Kabataş" },
          { title: "Tarihi Cağaloğlu Hamamı", category: "Kültür", location: "Sultanahmet" }
        ]
      }
    ];
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: true } }));
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        window.dispatchEvent(new CustomEvent('xenios_modal_state', { detail: { isOpen: false } }));
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setProfile(XeniosStore.getGuestProfile());
      setIntroDismissed(XeniosStore.getAiIntroDismissed());
      setShowSurvey(false);
      const saved = XeniosStore.getAiChatMessages();
      if (saved && saved.length > 0) {
        setMessages(saved);
      }
    }
  }, [isOpen]);

  // Update initial greeting if language changes and no chat history exists
  useEffect(() => {
    if (messages.length === 1 && messages[0].id.startsWith('init')) {
      const updatedInit: ChatMessage = {
        ...messages[0],
        text: t.aiGreeting || DEFAULT_GREETING_TR,
        actions: [
          {
            id: 'act-know-me',
            label: `✨ ${t.knowMeBtn || 'Beni Tanı'} (Kişisel Rehberliği Özelleştir)`,
            type: 'OPEN_SURVEY'
          }
        ]
      };
      setMessages([updatedInit]);
      XeniosStore.saveAiChatMessages([updatedInit]);
    }
  }, [lang, t]);

  if (!isOpen) return null;

  const handleSaveProfile = (updated: GuestProfile) => {
    setProfile(updated);
    XeniosStore.setGuestProfile(updated);
    XeniosStore.setAiIntroDismissed(true);
    setIntroDismissed(true);
    setShowSurvey(false);
  };

  const handleClearProfile = () => {
    const cleared = XeniosStore.clearGuestProfile();
    setProfile(cleared);
    XeniosStore.setAiIntroDismissed(false);
    setIntroDismissed(false);
    setShowSurvey(false);
  };

  const handleClearChat = () => {
    XeniosStore.clearAiChatMessages();
    const initial: ChatMessage[] = [
      {
        id: `init-${Date.now()}`,
        sender: 'assistant',
        text: t.aiGreeting || DEFAULT_GREETING_TR,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          {
            id: 'act-know-me',
            label: `✨ ${t.knowMeBtn || 'Beni Tanı'} (Kişisel Rehberliği Özelleştir)`,
            type: 'OPEN_SURVEY'
          }
        ],
        recommendations: [
          { title: "Bosphorus Sunset & Dinner Cruise", category: "Boğaz & Tekne", location: "Kabataş" },
          { title: "Tarihi Cağaloğlu Hamamı", category: "Kültür", location: "Sultanahmet" }
        ]
      }
    ];
    setMessages(initial);
    XeniosStore.saveAiChatMessages(initial);
    toast.success("Sohbet geçmişi temizlendi.");
  };

  const handleSend = async (customText?: string) => {
    const userMsg = (customText || input).trim();
    if (!userMsg || isLoading) return;
    setInput('');

    const newMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, newMsg];
    setMessages(nextMessages);
    XeniosStore.saveAiChatMessages(nextMessages);
    setIsLoading(true);

    const userPrefs = XeniosStore.getUserPreferences();
    const assistantMsg = await askGeminiConcierge(
      userMsg,
      profile,
      hotel.name,
      hotel.district,
      lang,
      roomNumber,
      userPrefs,
      nextMessages
    );

    if (assistantMsg.negative_locked_categories?.length) {
      assistantMsg.negative_locked_categories.forEach(cat => {
        XeniosStore.addBlacklistedOffer(cat, 'Misafir chat üzerinden reddetti');
      });
    }

    const finalMessages = [...nextMessages, assistantMsg];
    setMessages(finalMessages);
    XeniosStore.saveAiChatMessages(finalMessages);
    setIsLoading(false);
  };

  const handleExecuteAction = (action: any) => {
    if (action.type === 'OPEN_SURVEY') {
      setShowSurvey(true);
      return;
    }

    if (action.type === 'BOOK_APPOINTMENT') {
      const payload = action.payload || {};
      const serviceTitle = payload.service_title || 'Seçili Hizmet';
      const prefDate = payload.preferred_date || '2026-08-24';
      const prefTime = payload.preferred_time || '11:00';

      XeniosStore.addToBookedItinerary({
        booking_id: `bk_${Date.now()}`,
        title: serviceTitle,
        category: payload.booking_type || 'Rezervasyon',
        location_name: payload.listing_id?.includes('hamam') ? 'Cağaloğlu Hamamı' : 'Quartz Clinique',
        district: payload.listing_id?.includes('hamam') ? 'Sultanahmet' : 'Nişantaşı',
        location_coordinates: payload.listing_id?.includes('hamam') ? { lat: 41.0102, lng: 28.9755 } : { lat: 41.0485, lng: 28.9942 },
        date: prefDate,
        start_time: prefTime,
        end_time: '12:00',
        status: 'CONFIRMED'
      });

      const confirmMsg: ChatMessage = {
        id: `conf-${Date.now()}`,
        sender: 'assistant',
        text: `Harika bir seçim! ${serviceTitle} randevunuz ${prefDate} saat ${prefTime} için adınıza başarıyla oluşturulmuştur. 🎟️\n\n📅 Haftalık seyahat ajandanıza eklendi. Ulaşım rotanız otel resepsiyonu ve VIP transfer ekibimize bildirildi.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => {
        const updated = [...prev, confirmMsg];
        XeniosStore.saveAiChatMessages(updated);
        return updated;
      });
    } else if (action.type === 'VIEW_ITINERARY') {
      const userPrefs = XeniosStore.getUserPreferences();
      const itinerary = userPrefs.booked_itinerary || [];
      const text = itinerary.length > 0
        ? `📅 **Haftalık Seyahat Ajandanız:**\n` + itinerary.map(i => `• ${i.date} ${i.start_time}: ${i.title} (${i.location_name})`).join('\n') + `\n\n🚗 *Trafik Notu:* Sultanahmet - Nişantaşı aksında 17:00-19:30 saatleri arasında M2 Metrosunu tercih etmeniz önerilir.`
        : `Henüz kayıtlı bir seyahat randevunuz bulunmamaktadır. Dilerseniz hemen bir etkinlik veya estetik seansı planlayabiliriz.`;
      
      const itinMsg: ChatMessage = {
        id: `itin-${Date.now()}`,
        sender: 'assistant',
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => {
        const updated = [...prev, itinMsg];
        XeniosStore.saveAiChatMessages(updated);
        return updated;
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-[#F7F3EA] w-full sm:max-w-lg h-[100dvh] sm:h-[82vh] max-h-[100dvh] sm:max-h-[82vh] rounded-none sm:rounded-[24px] shadow-2xl border-[1.5px] border-[#C4B8A4] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 text-[#141414]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Luxury Ivory/Champagne Header */}
        <div className="px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3.5 bg-gradient-to-b from-[#FAF8F4] to-[#EDE5D6] border-b border-[#C4B8A4] text-[#141414] flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#FAF7F0] to-[#EFE8DA] flex items-center justify-center border-[1.5px] border-[#C5A059] shadow-sm shrink-0">
              <ComusSpiralIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-luxury-serif text-[16px] font-bold tracking-[0.04em] text-[#141414] leading-tight truncate">
                {t.aiTitle || 'comusAI · Kişisel İstanbul Rehberiniz'}
              </h3>
              <div className="flex items-center gap-1.5 font-luxury-sans text-[10.5px] text-[#5C4938] mt-0.5">
                <span className="truncate font-medium">{hotel.name} · {t.room} {roomNumber}</span>
                <span className="text-[#8E7252] shrink-0">•</span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#FAF8F4] text-[9px] font-mono text-[#7D5E2A] font-bold shrink-0 border border-[#C4B8A4]">
                  AI Concierge
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {messages.length > 1 && (
              <button
                type="button"
                onClick={handleClearChat}
                className="p-2 rounded-full bg-[#FAF8F4] hover:bg-[#EFE8DA] text-[#5C4938] transition cursor-pointer border border-[#C4B8A4]"
                title="Sohbeti Temizle"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FAF8F4] hover:bg-[#EFE8DA] text-[#141414] border border-[#C4B8A4] flex items-center justify-center text-sm font-bold transition cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[1.8]" />
            </button>
          </div>
        </div>

        {/* Survey Drawer Overlay if open */}
        {showSurvey ? (
          <div className="flex-1 overflow-y-auto p-4 pb-[max(2rem,env(safe-area-inset-bottom))] bg-[#F7F3EA] overscroll-contain">
            <GuestPreferenceSurvey
              initialProfile={profile}
              lang={lang}
              onSave={handleSaveProfile}
              onClear={handleClearProfile}
              onCancel={() => setShowSurvey(false)}
            />
          </div>
        ) : (
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F7F3EA] overscroll-contain">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-[#FAF8F4] border border-[#C5A059] p-1 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        <ComusSpiralIcon className="w-5 h-5" />
                      </div>
                    )}

                    <div className={`max-w-[85%] rounded-2xl p-3.5 font-luxury-sans text-xs shadow-sm space-y-2 ${
                      isUser
                        ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] text-white border border-[#7D5E2A] rounded-tr-xs'
                        : 'luxury-service-card text-[#141414] rounded-tl-xs'
                    }`}>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {msg.text}
                      </div>

                      {/* Interactive Action Buttons from Comus AI */}
                      {!isUser && msg.actions && msg.actions.length > 0 && (
                        <div className="pt-2 flex flex-col gap-1.5 border-t border-[#D8CBB8]">
                          {msg.actions.map((act) => (
                            <button
                              key={act.id}
                              type="button"
                              onClick={() => handleExecuteAction(act)}
                              className="font-luxury-sans w-full py-2.5 px-3 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer text-left"
                            >
                              <span>{act.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className={`text-[9px] font-mono flex items-center ${isUser ? 'text-[#EFE8DA] justify-end' : 'text-[#6B5A48] justify-end'}`}>
                        <span>{msg.time}</span>
                      </div>
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-full bg-[#1D2025] text-[#FAF8F4] border border-[#8E7252] flex items-center justify-center shrink-0 text-xs shadow-xs mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="luxury-service-card flex gap-2.5 items-center font-luxury-sans text-xs text-[#141414] p-3 w-fit">
                  <div className="w-5 h-5 relative flex items-center justify-center shrink-0 animate-spin">
                    <ComusSpiralIcon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-[#5C4938]">comus yanıt hazırlıyor...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="p-2.5 bg-[#FAF8F4] border-t border-[#D8CBB8] overflow-x-auto flex items-center gap-1.5 no-scrollbar shrink-0">
              {(t.quickChips || []).map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="font-luxury-sans px-3 py-1.5 rounded-full bg-[#F7F3EA] hover:bg-[#EFE8DA] text-[#221F1C] border border-[#C4B8A4] text-[11px] font-semibold whitespace-nowrap transition cursor-pointer shadow-2xs shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 pb-[max(0.75rem,calc(0.75rem+env(safe-area-inset-bottom)))] bg-[#FAF8F4] border-t border-[#C4B8A4] flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.aiPlaceholder}
                className="font-luxury-sans flex-1 text-xs p-3 rounded-2xl border border-[#C4B8A4] bg-[#F7F3EA] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40 text-[#141414] placeholder:text-[#78716C]"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 rounded-2xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white transition shadow-sm disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
