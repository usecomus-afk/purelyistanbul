"use client";

import { useState, useEffect, useRef } from 'react';
import { XeniosStore } from '@/lib/store';
import { Hotel, InRoomServiceItem, RoomServiceMenuItem } from '@/lib/types';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
  UtensilsCrossed,
  Plus,
  Edit3,
  Trash2,
  X,
  Search,
  Clock,
  LayoutGrid,
  ChefHat,
  ImagePlus,
  Upload,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const MENU_CATEGORIES = [
  'Tümü',
  'Kahvaltı',
  'Başlangıç',
  'Ana Yemek',
  'Tatlı',
  'İçecek',
  'Atıştırmalık',
  'Gece Menüsü'
] as const;

const PRESET_FOOD_IMAGES = [
  { label: 'Geleneksel Kahvaltı', path: '/images/experiences/exp-gastro-1.jpg' },
  { label: 'Antrikot & Izgara',   path: '/images/experiences/exp-gastro-2.jpg' },
  { label: 'El Yapımı Makarna',   path: '/images/experiences/exp-gastro-3.jpg' },
  { label: 'Kulüp Sandviç',       path: '/images/experiences/exp-gastro-4.jpg' },
  { label: 'Fırın Tatlı & Sütlaç', path: '/images/experiences/exp-gastro-5.jpg' },
  { label: 'Taze Meyve Suyu',     path: '/images/experiences/exp-gastro-6.jpg' },
];

// ─── tiny helper ────────────────────────────────────────────────────────────
function isPresetPath(url: string) {
  return PRESET_FOOD_IMAGES.some(p => p.path === url);
}

export default function HotelPortalServicesPage() {
  const [hotels, setHotels]             = useState<Hotel[]>(() => XeniosStore.getHotels());
  const [activeHotelId, setActiveHotelId] = useState<string>(() => XeniosStore.getActiveHotelId());
  const currentHotel = hotels.find(h => h.id === activeHotelId) || hotels[0];

  const [activeTab, setActiveTab] = useState<'menu' | 'services'>('menu');

  const [menuItems, setMenuItems]           = useState<RoomServiceMenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [searchMenu, setSearchMenu]         = useState('');
  const [inRoomServices, setInRoomServices] = useState<InRoomServiceItem[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoomServiceMenuItem | null>(null);

  // form fields
  const [formName, setFormName]               = useState('');
  const [formCategory, setFormCategory]       = useState<RoomServiceMenuItem['category']>('Ana Yemek');
  const [formPrice, setFormPrice]             = useState<number | ''>(20);
  const [formPrepTime, setFormPrepTime]       = useState<number | ''>(15);
  const [formDesc, setFormDesc]               = useState('');
  const [formIngredients, setFormIngredients] = useState('');
  const [formImage, setFormImage]             = useState(PRESET_FOOD_IMAGES[0].path);
  const [formAvailable, setFormAvailable]     = useState(true);

  // image upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null); // 0-100 while uploading, null otherwise
  const [uploadedUrl, setUploadedUrl]       = useState<string | null>(null); // URL after upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshData = () => {
    const list = XeniosStore.getHotels();
    setHotels(list);
    const id = XeniosStore.getActiveHotelId();
    setActiveHotelId(id);
    setMenuItems(XeniosStore.getRoomServiceMenu(id));
    setInRoomServices(XeniosStore.getInRoomServices());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('xenios_room_service_menu_updated', refreshData);
    window.addEventListener('xenios_in_room_services_updated',  refreshData);
    return () => {
      window.removeEventListener('xenios_room_service_menu_updated', refreshData);
      window.removeEventListener('xenios_in_room_services_updated',  refreshData);
    };
  }, [activeHotelId]);

  // ── image upload ────────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // client-side validation
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir görsel dosyası seçin (JPG, PNG, WebP…)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Görsel boyutu 5 MB\'ı aşamaz.');
      return;
    }

    if (!storage) {
      // fallback: use a local object-URL (no Firebase Storage configured)
      const localUrl = URL.createObjectURL(file);
      setUploadedUrl(localUrl);
      setFormImage(localUrl);
      toast.success('Görsel seçildi (yerel önizleme).');
      return;
    }

    try {
      setUploadProgress(0);
      const hotelId  = currentHotel?.id || 'shared';
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, `hotel-menu/${hotelId}/${fileName}`);
      const task = uploadBytesResumable(storageRef, file);

      task.on(
        'state_changed',
        snap => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        err => {
          console.error(err);
          toast.error('Görsel yüklenemedi. Lütfen tekrar deneyin.');
          setUploadProgress(null);
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          setUploadedUrl(url);
          setFormImage(url);
          setUploadProgress(null);
          toast.success('Görsel başarıyla yüklendi!');
        }
      );
    } catch (err) {
      console.error(err);
      toast.error('Görsel yüklenirken hata oluştu.');
      setUploadProgress(null);
    }
  };

  // ── modal helpers ───────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormName('');
    setFormCategory('Ana Yemek');
    setFormPrice(22);
    setFormPrepTime(15);
    setFormDesc('');
    setFormIngredients('');
    setFormImage(PRESET_FOOD_IMAGES[0].path);
    setFormAvailable(true);
    setUploadedUrl(null);
    setUploadProgress(null);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: RoomServiceMenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price);
    setFormPrepTime(item.preparationTimeMinutes || 15);
    setFormDesc(item.description);
    setFormIngredients(item.ingredients);
    setFormImage(item.image);
    setFormAvailable(item.available);
    // if the saved image is a custom URL (not a preset), show it as uploaded
    setUploadedUrl(!isPresetPath(item.image) ? item.image : null);
    setUploadProgress(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) { toast.error('Lütfen ürün adını giriniz.'); return; }
    if (!formPrice || Number(formPrice) <= 0) { toast.error('Lütfen geçerli bir fiyat giriniz.'); return; }
    if (uploadProgress !== null) { toast.error('Görsel yükleniyor, lütfen bekleyin.'); return; }

    const payload = {
      name:                 formName.trim(),
      category:             formCategory,
      price:                Number(formPrice),
      preparationTimeMinutes: Number(formPrepTime) || 15,
      description:          formDesc.trim(),
      ingredients:          formIngredients.trim(),
      image:                formImage,
      available:            formAvailable,
    };

    if (editingItem) {
      XeniosStore.updateRoomServiceMenuItem(currentHotel.id, editingItem.id, payload);
      toast.success(`"${formName}" güncellendi.`);
    } else {
      XeniosStore.addRoomServiceMenuItem(currentHotel.id, {
        ...payload,
        hotelId:  currentHotel.id,
        currency: 'EUR',
      });
      toast.success(`"${formName}" menüye eklendi.`);
    }

    setIsModalOpen(false);
    refreshData();
  };

  const handleDeleteMenuItem = (id: string, name: string) => {
    if (confirm(`"${name}" ürününü oda servisi menüsünden silmek istediğinize emin misiniz?`)) {
      XeniosStore.deleteRoomServiceMenuItem(currentHotel.id, id);
      toast.success(`"${name}" menüden silindi.`);
      refreshData();
    }
  };

  const handleToggleAvailability = (item: RoomServiceMenuItem) => {
    XeniosStore.updateRoomServiceMenuItem(currentHotel.id, item.id, { available: !item.available });
    toast.info(`"${item.name}" ${!item.available ? 'müsait yapıldı' : 'tükendi olarak işaretlendi'}.`);
    refreshData();
  };

  const handleToggleService = (service: InRoomServiceItem) => {
    XeniosStore.saveInRoomService({ ...service, enabled: !service.enabled });
    toast.success(`"${service.label}" ${!service.enabled ? 'aktif edildi' : 'kapatıldı'}.`);
    refreshData();
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCat    = selectedCategory === 'Tümü' || item.category === selectedCategory;
    const matchesSearch = !searchMenu ||
      item.name.toLowerCase().includes(searchMenu.toLowerCase()) ||
      item.ingredients.toLowerCase().includes(searchMenu.toLowerCase()) ||
      item.description.toLowerCase().includes(searchMenu.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">{currentHotel?.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 mt-1">
            Otel İçi Hizmetler &amp; Menü Yönetimi
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Oda servisi (F&amp;B) yiyecek-içecek menüsünü ve otel içi servislerin oda ekranındaki görünürlüğünü yönetin.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-amber-100/60 rounded-2xl border border-amber-200">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-zinc-700 hover:bg-amber-200/50'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Oda Servisi Menüsü ({menuItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'services'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-zinc-700 hover:bg-amber-200/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Genel Hizmet Modülleri (16)</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: Oda Servisi Menü Yönetimi ── */}
      {activeTab === 'menu' && (
        <div className="space-y-5">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-amber-200/80 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchMenu}
                onChange={e => setSearchMenu(e.target.value)}
                placeholder="Yemek, içecek veya malzeme ara..."
                className="w-full pl-10 pr-4 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Ürün / Yemek Ekle</span>
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {MENU_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3.5 py-1.5 rounded-xl whitespace-nowrap font-medium transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'bg-white text-zinc-600 hover:bg-amber-50 border border-amber-200/70'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenuItems.map(item => (
              <div
                key={item.id}
                className={`btn-3d p-4 flex flex-col justify-between gap-3 overflow-hidden ${
                  !item.available ? 'opacity-65 grayscale-30' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-amber-50 border border-amber-200 shrink-0 relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-200">
                          {item.category}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          €{item.price}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-zinc-900 mt-1 leading-snug line-clamp-1" title={item.name}>
                        {item.name}
                      </h3>
                      {item.preparationTimeMinutes && (
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{item.preparationTimeMinutes} dk</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed">{item.description}</p>

                  {item.ingredients && (
                    <div className="text-[10px] text-zinc-500 bg-amber-50/50 p-2 rounded-xl border border-amber-100 line-clamp-1">
                      <strong>İçindekiler:</strong> {item.ingredients}
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition cursor-pointer ${
                      item.available
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                    }`}
                  >
                    {item.available ? '● Müsait' : '○ Tükendi'}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenuItem(item.id, item.name)}
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMenuItems.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-amber-200 p-6 space-y-2">
              <UtensilsCrossed className="w-10 h-10 text-amber-400 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-800">Menüde ürün bulunamadı</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Arama kriterlerinize uygun yemek bulunamadı veya bu kategoride henüz ürün yok.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="mt-2 text-xs font-bold text-amber-800 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200"
              >
                + Yeni Ürün Ekle
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Genel Hizmet Modülleri ── */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {inRoomServices.map(srv => (
              <div key={srv.id} className="btn-3d p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50/80 border border-amber-200 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    <img src={srv.icon} alt={srv.label} className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{srv.label}</h3>
                    <span className="text-[10px] text-zinc-500 block truncate">{srv.department || 'Genel Servis'}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleService(srv)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition cursor-pointer shrink-0 ${
                    srv.enabled
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200'
                  }`}
                >
                  {srv.enabled ? 'Aktif' : 'Kapalı'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal: Add / Edit Room Service Item ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={e => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div
            className="bg-white border border-amber-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-amber-100 flex items-center justify-between gap-3 bg-gradient-to-r from-amber-50 to-orange-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-200 flex items-center justify-center p-2 shadow-xs">
                  <ChefHat className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold font-serif text-zinc-900">
                    {editingItem ? 'Ürünü Düzenle' : 'Yeni Oda Servisi Ürünü Ekle'}
                  </h2>
                  <p className="text-[10px] text-zinc-500">Misafir PWA oda servisi kataloğunda anında canlı yayınlanır</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-full hover:bg-amber-100 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveMenuItem} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Name */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-800 block">
                  Ürün / Yemek Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Örn: Izgara Levrek & Roka Salatası"
                  className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-800 block">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                  >
                    {MENU_CATEGORIES.filter(c => c !== 'Tümü').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-800 block">Fiyat (EUR €) <span className="text-rose-500">*</span></label>
                  <input
                    type="number" min="1" step="0.5" required
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="25"
                    className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              {/* Prep Time & Availability */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-800 block">Hazırlık Süresi (Dk)</label>
                  <input
                    type="number" min="5" step="5"
                    value={formPrepTime}
                    onChange={e => setFormPrepTime(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="15"
                    className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-800 block">Stok / Müsaitlik</label>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox" id="avail_chk"
                      checked={formAvailable}
                      onChange={e => setFormAvailable(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                    />
                    <label htmlFor="avail_chk" className="text-xs font-medium text-zinc-700 cursor-pointer">
                      Siparişe Açık (Stokta Var)
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-800 block">Açıklama &amp; Sunum</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Yemeğin pişirme tekniği, lezzet notları ve yanında sunulan garnitürler..."
                  className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Ingredients */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-800 block">İçindekiler &amp; Malzemeler (Alerjen Bilgisi İçin)</label>
                <input
                  type="text"
                  value={formIngredients}
                  onChange={e => setFormIngredients(e.target.value)}
                  placeholder="Örn: Balık, Zeytinyağı, Sarımsak, Roka, Limon"
                  className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* ── IMAGE SECTION ─────────────────────────────────────────── */}
              <div className="space-y-3">
                <label className="font-bold text-zinc-800 block">Ürün Görseli</label>

                {/* Upload area */}
                <div
                  className="relative border-2 border-dashed border-amber-300 rounded-2xl overflow-hidden bg-amber-50/30 cursor-pointer hover:bg-amber-50/60 transition group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {uploadProgress !== null ? (
                    /* Progress state */
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                      <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
                      <span className="text-xs font-bold text-amber-700">Yükleniyor… {uploadProgress}%</span>
                      <div className="w-48 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : uploadedUrl ? (
                    /* Uploaded preview */
                    <div className="relative">
                      <img
                        src={uploadedUrl}
                        alt="Yüklenen görsel"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-xl">
                          <Upload className="w-3.5 h-3.5" /> Görseli Değiştir
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ) : (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-amber-700">
                      <ImagePlus className="w-8 h-8 text-amber-400" />
                      <span className="text-xs font-bold">Görsel yükle</span>
                      <span className="text-[10px] text-zinc-400">JPG, PNG, WebP — maks. 5 MB</span>
                    </div>
                  )}
                </div>

                {/* OR divider */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-amber-200" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">veya hazır görsel seç</span>
                  <div className="flex-1 h-px bg-amber-200" />
                </div>

                {/* Preset gallery */}
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_FOOD_IMAGES.map(img => (
                    <button
                      key={img.path}
                      type="button"
                      onClick={() => {
                        setFormImage(img.path);
                        setUploadedUrl(null);
                      }}
                      className={`p-1 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer overflow-hidden ${
                        formImage === img.path && !uploadedUrl
                          ? 'border-amber-500 bg-amber-100/50 ring-2 ring-amber-500/30'
                          : 'border-zinc-200 hover:border-amber-300'
                      }`}
                    >
                      <img src={img.path} alt={img.label} className="w-full h-12 object-cover rounded-lg" />
                      <span className="text-[9px] font-bold text-zinc-700 truncate w-full text-center">{img.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* ── END IMAGE SECTION ─────────────────────────────────────── */}

              {/* Footer */}
              <div className="pt-3 border-t border-amber-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={uploadProgress !== null}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  {uploadProgress !== null
                    ? 'Yükleniyor…'
                    : editingItem
                    ? 'Güncelle'
                    : 'Menüye Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
