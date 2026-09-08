"use client";

import { Hotel, Language, GuestProfile } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { XeniosStore } from '@/lib/store';
import { askGeminiConcierge, ChatMessage } from '@/lib/gemini';
import { useState, useEffect, useRef } from 'react';
import { GuestPreferenceSurvey } from './guest-preference-survey';
import { Send, User, X, UserCog, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface AiChatDrawerProps {
  hotel: Hotel;
  roomNumber: string;
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_GREETING_TR = "Merhaba! Ben comus, Sizin kişisel İstanbul rehberinizim. Gün batımı tekne turları, Tarihi Yarımada'nın gizli lezzetleri, İstanbul’da yatırım veya size özel rotalar hakkında dilediğinizi sorabilirsiniz.\n\n✨ 'Beni Tanı' butonuna tıklayarak size özel rehberlik etmemi özelleştirebilirsiniz.";

export function AiChatDrawer({ hotel, roomNumber, lang, isOpen, onClose }: AiChatDrawerProps) {
  const t = getT(lang);
  const [profile, setProfile] = useState<GuestProfile>(XeniosStore.getGuestProfile());
  const [showSurvey, setShowSurvey] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
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
  ]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setProfile(XeniosStore.getGuestProfile());
      setIntroDismissed(XeniosStore.getAiIntroDismissed());
      setShowSurvey(false);
      setMessages([
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
      ]);
    }
  }, [isOpen, lang]);

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

    setMessages(prev => [...prev, newMsg]);
    setIsLoading(true);

    const userPrefs = XeniosStore.getUserPreferences();
    const assistantMsg = await askGeminiConcierge(userMsg, profile, hotel.name, hotel.district, lang, roomNumber, userPrefs);

    // If assistant returned negative locks (Anti-Nagging)
    if (assistantMsg.negative_locked_categories?.length) {
      assistantMsg.negative_locked_categories.forEach(cat => {
        XeniosStore.addBlacklistedOffer(cat, 'Misafir chat üzerinden reddetti');
      });
    }

    setMessages(prev => [...prev, assistantMsg]);
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
      setMessages(prev => [...prev, confirmMsg]);
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
      setMessages(prev => [...prev, itinMsg]);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white w-full sm:max-w-lg h-[88dvh] sm:h-[82vh] max-h-[88dvh] sm:max-h-[82vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-amber-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 text-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xs overflow-hidden p-1.5 shrink-0">
              <Image
                src="/icons/menu/aiGuide.png"
                alt="comus AI"
                width={26}
                height={26}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white leading-tight truncate">
                {t.aiTitle || 'comusAI - Kişisel İstanbul Rehberiniz'}
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-amber-100 mt-1">
                <span className="truncate">{hotel.name} · {t.room} {roomNumber}</span>
                <span className="text-amber-200/60 shrink-0">•</span>
                <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[9px] font-mono text-white/95 font-medium shrink-0 border border-white/20">
                  Gemini
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowSurvey(!showSurvey)}
              className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer border border-white/20"
              title={t.knowMeBtn}
            >
              <UserCog className="w-3.5 h-3.5 text-amber-200" />
              <span>{t.knowMeBtn}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Survey Drawer Overlay if open */}
        {showSurvey ? (
          <div className="flex-1 overflow-y-auto p-4 pb-[max(2rem,env(safe-area-inset-bottom))] bg-[#fbf8f1] overscroll-contain">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#fbf8f1] overscroll-contain">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-2xl bg-amber-100 border border-amber-300 p-1 flex items-center justify-center shrink-0 shadow-xs mt-0.5 overflow-hidden">
                        <Image
                          src="/icons/menu/aiGuide.png"
                          alt="comus"
                          width={22}
                          height={22}
                          className="object-contain"
                        />
                      </div>
                    )}

                    <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs space-y-2 ${
                      isUser
                        ? 'bg-amber-500 text-white rounded-tr-xs'
                        : 'bg-white text-zinc-800 border border-amber-200/80 rounded-tl-xs'
                    }`}>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {msg.text}
                      </div>

                      {/* Interactive Action Buttons from Comus AI */}
                      {!isUser && msg.actions && msg.actions.length > 0 && (
                        <div className="pt-2 flex flex-col gap-1.5 border-t border-amber-100">
                          {msg.actions.map((act) => (
                            <button
                              key={act.id}
                              type="button"
                              onClick={() => handleExecuteAction(act)}
                              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer text-left"
                            >
                              <span>{act.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className={`text-[9px] font-mono flex items-center ${isUser ? 'text-amber-100 justify-end' : 'text-zinc-400 justify-end'}`}>
                        <span>{msg.time}</span>
                      </div>
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-2xl bg-zinc-800 text-white flex items-center justify-center shrink-0 text-xs shadow-xs mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-2 items-center text-xs text-amber-900 bg-amber-100/90 p-2.5 rounded-2xl border border-amber-300 w-fit shadow-xs">
                  <div className="w-5 h-5 relative flex items-center justify-center shrink-0">
                    <Image
                      src="/icons/menu/aiGuide.png"
                      alt="comus"
                      width={18}
                      height={18}
                      className="object-contain animate-pulse"
                    />
                  </div>
                  <span className="font-medium text-amber-950">comus yanıt hazırlıyor...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="p-2.5 bg-white border-t border-amber-100 overflow-x-auto flex items-center gap-1.5 no-scrollbar shrink-0">
              {(t.quickChips || []).map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-[11px] font-medium whitespace-nowrap transition cursor-pointer shadow-2xs shrink-0"
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
              className="p-3 pb-[max(0.75rem,calc(0.75rem+env(safe-area-inset-bottom)))] bg-white border-t border-amber-200 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.aiPlaceholder}
                className="flex-1 text-xs p-3 rounded-2xl border border-amber-200 bg-[#fbf8f1] focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-zinc-900 placeholder:text-zinc-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white transition shadow-md disabled:opacity-50 cursor-pointer shrink-0"
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
