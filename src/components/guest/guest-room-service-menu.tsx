"use client";

import { useState, useMemo, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { RoomServiceMenuItem, Hotel, Language } from '@/lib/types';
import { LuxuryServiceIcon } from './luxury-service-icon';
import { Plus, Minus, Clock, ChevronRight, UtensilsCrossed, MessageSquareText, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { FirestoreService } from '@/lib/firestore-service';
import { getT } from '@/lib/i18n';
import {
  InlineOnlinePaymentBox,
  processOnlineServicePayment,
  ONLINE_PAYMENT_I18N,
  GuestPaymentMethod,
  OnlineCardDetails,
} from './inline-online-payment-box';

interface Props {
  hotel: Hotel;
  roomNumber: string;
  lang: string;
  onClose: () => void;
}

const ROOM_SERVICE_UI_I18N: Record<Language, {
  title: string;
  min: string;
  kcal: string;
  allergensLabel: string;
  quickAllergens: string[];
  add: string;
  empty: string;
  placeOrder: string;
  noteLabel: string;
  notePlaceholder: string;
  orderReceivedTitle: string;
  orderServiceLabel: string;
  orderError: string;
  categories: Record<string, string>;
}> = {
  tr: {
    title: 'Kahvaltı & Yeme-İçme Menüsü',
    min: 'dk',
    kcal: 'kcal',
    allergensLabel: 'Alerjenler',
    quickAllergens: ['Glutensiz', 'Laktozsuz', 'Kuruyemiş Alerjisi', 'Yumurta Alerjisi'],
    add: 'Ekle',
    empty: 'Bu kategoride ürün bulunmuyor.',
    placeOrder: 'Siparişi Ver',
    noteLabel: 'Sipariş & Alerjen Notunuz',
    notePlaceholder: 'Özel isteğiniz, pişirme derecesi veya alerji notunuzu yazabilirsiniz...',
    orderReceivedTitle: 'Siparişiniz Alındı!',
    orderServiceLabel: 'Kahvaltı & Yeme-İçme',
    orderError: 'Sipariş iletilirken bir hata oluştu.',
    categories: {
      'Tümü': 'Tümü',
      'Kahvaltı': 'Kahvaltı',
      'Ana Yemek': 'Ana Yemek',
      'Atıştırmalık': 'Atıştırmalık',
      'Tatlı': 'Tatlı',
      'İçecek': 'İçecek',
    },
  },
  en: {
    title: 'In-Room Dining Menu',
    min: 'min',
    kcal: 'kcal',
    allergensLabel: 'Allergens',
    quickAllergens: ['Gluten-Free', 'Lactose-Free', 'Nut Allergy', 'Egg Allergy'],
    add: 'Add',
    empty: 'No items available in this category.',
    placeOrder: 'Place Order',
    noteLabel: 'Order & Allergy Note',
    notePlaceholder: 'Add any special requests, cooking preferences, or allergy notes...',
    orderReceivedTitle: 'Order Received!',
    orderServiceLabel: 'In-Room Dining',
    orderError: 'An error occurred while submitting your order.',
    categories: {
      'Tümü': 'All',
      'Kahvaltı': 'Breakfast',
      'Ana Yemek': 'Main Course',
      'Atıştırmalık': 'Snacks',
      'Tatlı': 'Dessert',
      'İçecek': 'Beverages',
    },
  },
  ar: {
    title: 'قائمة خدمة الغرف',
    min: 'دقيقة',
    kcal: 'سعرة',
    allergensLabel: 'مسببات الحساسية',
    quickAllergens: ['خالٍ من الغلوتين', 'خالٍ من اللاكتوز', 'حساسية المكسرات', 'حساسية البيض'],
    add: 'إضافة',
    empty: 'لا توجد عناصر متاحة في هذه الفئة.',
    placeOrder: 'إتمام الطلب',
    noteLabel: 'ملاحظة الطلب والحساسية',
    notePlaceholder: 'أضف أي طلبات خاصة أو تفضيلات الطهي أو ملاحظات الحساسية...',
    orderReceivedTitle: 'تم استلام طلبك!',
    orderServiceLabel: 'خدمة الغرف',
    orderError: 'حدث خطأ أثناء إرسال طلبك.',
    categories: {
      'Tümü': 'الكل',
      'Kahvaltı': 'الإفطار',
      'Ana Yemek': 'الطبق الرئيسي',
      'Atıştırmalık': 'وجبات خفيفة',
      'Tatlı': 'الحلويات',
      'İçecek': 'المشروبات',
    },
  },
  ru: {
    title: 'Меню обслуживания в номере',
    min: 'мин',
    kcal: 'ккал',
    allergensLabel: 'Аллергены',
    quickAllergens: ['Без глютена', 'Без лактозы', 'Аллергия на орехи', 'Аллергия на яйца'],
    add: 'Добавить',
    empty: 'В этой категории нет блюд.',
    placeOrder: 'Оформить заказ',
    noteLabel: 'Примечание и аллергии',
    notePlaceholder: 'Укажите особые пожелания, степень прожарки или аллергии...',
    orderReceivedTitle: 'Ваш заказ принят!',
    orderServiceLabel: 'Обслуживание в номере',
    orderError: 'Произошла ошибка при отправке заказа.',
    categories: {
      'Tümü': 'Все',
      'Kahvaltı': 'Завтрак',
      'Ana Yemek': 'Основное блюдо',
      'Atıştırmalık': 'Закуски',
      'Tatlı': 'Десерты',
      'İçecek': 'Напитки',
    },
  },
  de: {
    title: 'Zimmerservice-Menü',
    min: 'Min.',
    kcal: 'kcal',
    allergensLabel: 'Allergene',
    quickAllergens: ['Glutenfrei', 'Laktosefrei', 'Nussallergie', 'Eiallergie'],
    add: 'Hinzufügen',
    empty: 'Keine Artikel in dieser Kategorie verfügbar.',
    placeOrder: 'Bestellung aufgeben',
    noteLabel: 'Bestell- & Allergiehinweis',
    notePlaceholder: 'Besondere Wünsche, Garstufe oder Allergiehinweise hinzufügen...',
    orderReceivedTitle: 'Bestellung eingegangen!',
    orderServiceLabel: 'Zimmerservice',
    orderError: 'Beim Senden Ihrer Bestellung ist ein Fehler aufgetreten.',
    categories: {
      'Tümü': 'Alle',
      'Kahvaltı': 'Frühstück',
      'Ana Yemek': 'Hauptgericht',
      'Atıştırmalık': 'Snacks',
      'Tatlı': 'Dessert',
      'İçecek': 'Getränke',
    },
  },
  fr: {
    title: 'Menu Service d’Étage',
    min: 'min',
    kcal: 'kcal',
    allergensLabel: 'Allergènes',
    quickAllergens: ['Sans gluten', 'Sans lactose', 'Allergie aux noix', 'Allergie aux œufs'],
    add: 'Ajouter',
    empty: 'Aucun article disponible dans cette catégorie.',
    placeOrder: 'Passer la commande',
    noteLabel: 'Note de commande & allergies',
    notePlaceholder: 'Ajoutez vos demandes spéciales, cuisson souhaitée ou allergies...',
    orderReceivedTitle: 'Commande reçue !',
    orderServiceLabel: 'Service d’Étage',
    orderError: 'Une erreur est survenue lors de l’envoi de votre commande.',
    categories: {
      'Tümü': 'Tout',
      'Kahvaltı': 'Petit-déjeuner',
      'Ana Yemek': 'Plat principal',
      'Atıştırmalık': 'Collations',
      'Tatlı': 'Dessert',
      'İçecek': 'Boissons',
    },
  },
};

const MENU_ITEMS_I18N: Record<string, Partial<Record<Language, { name: string; description: string; allergens?: string }>>> = {
  'menu-item-1': {
    en: {
      name: 'Traditional Turkish Spread Breakfast',
      description: 'Ezine feta, aged Kars kashar, honeycomb, clotted cream, organic olives, butter, tomatoes, cucumbers, menemen, and freshly baked simit.',
      allergens: 'Gluten, Dairy, Eggs, Sesame',
    },
    ar: {
      name: 'إفطار تركي تقليدي متنوع',
      description: 'جبن إزينه، جبن قشقوان قارص، عسل بالشمع، قشطة، زيتون عضوي، زبدة، طماطم، خيار، شكشوكة تركية (مينيمين) وسميت طازج.',
      allergens: 'غلوتين، منتجات الألبان، بيض، سمسم',
    },
    ru: {
      name: 'Традиционный турецкий завтрак',
      description: 'Сыр Эзине, выдержанный кашар из Карса, сотовый мед, каймак, органические оливки, масло, томаты, огурцы, менемен и свежий симит.',
      allergens: 'Глютен, молочные продукты, яйца, кунжут',
    },
    de: {
      name: 'Traditionelles türkisches Frühstück',
      description: 'Ezine-Schafskäse, gereifter Kars-Kaschkaval, Wabenhonig, Kaymak, Bio-Oliven, Butter, Tomaten, Gurken, Menemen und frischer Simit.',
      allergens: 'Gluten, Milchprodukte, Eier, Sesam',
    },
    fr: {
      name: 'Petit-déjeuner traditionnel turc',
      description: 'Fromage Ezine, kashar affiné de Kars, miel en rayon, kaymak, olives bio, beurre, tomates, concombres, menemen et simit fraîchement cuit.',
      allergens: 'Gluten, Produits laitiers, Œufs, Sésame',
    },
  },
  'menu-item-2': {
    en: {
      name: 'Grilled Ribeye & Truffle Mashed Potatoes',
      description: '220g dry-aged ribeye served with roasted shallots, grilled asparagus, and fresh mashed potatoes infused with truffle oil.',
      allergens: 'Dairy (Butter, Cream)',
    },
    ar: {
      name: 'ريب آي مشوي مع بيوريه البطاطس بالكمأة',
      description: '220 غرام من لحم الريب آي المعتق يقدم مع الكراث المشوي والهليون المشوي وبيوريه البطاطس الطازجة بزيت الكمأة.',
      allergens: 'منتجات الألبان (زبدة، كريمة)',
    },
    ru: {
      name: 'Рибай на гриле с трюфельным картофельным пюре',
      description: 'Выдержанный стейк рибай 220 г с запеченным шалотом, спаржей на гриле и нежным картофельным пюре с трюфельным маслом.',
      allergens: 'Молочные продукты (сливочное масло, сливки)',
    },
    de: {
      name: 'Gegrilltes Entrecôte & Trüffel-Kartoffelpüree',
      description: '220g gereiftes Entrecôte mit gerösteten Schalotten, gegrilltem Spargel und frischem Kartoffelpüree mit Trüffelöl.',
      allergens: 'Milchprodukte (Butter, Sahne)',
    },
    fr: {
      name: 'Entrecôte grillée & Purée de pommes de terre à la truffe',
      description: 'Entrecôte maturée de 220g accompagnée d’échalotes rôties, d’asperges grillées et d’une purée fraîche à l’huile de truffe.',
      allergens: 'Produits laitiers (Beurre, Crème)',
    },
  },
  'menu-item-3': {
    en: {
      name: 'Handmade Wild Mushroom Fettuccine',
      description: 'Fresh handmade pasta with porcini and oyster mushrooms, creamy sauce, aged parmesan, and fresh thyme leaves.',
      allergens: 'Gluten, Eggs, Dairy (Cream, Parmesan)',
    },
    ar: {
      name: 'فيتوتشيني يدوي بالفطر البري',
      description: 'معكرونة طازجة محضرة يدوياً مع فطر البورسيني والمحار، صلصة الكريمة الطازجة، جبن البارميزان وأوراق الزعتر الطازجة.',
      allergens: 'غلوتين، بيض، منتجات الألبان (كريمة، بارميزان)',
    },
    ru: {
      name: 'Домашние феттуччине с лесными грибами',
      description: 'Свежая паста ручной работы с белыми грибами и вешенками в сливочном соусе с пармезаном и свежим тимьяном.',
      allergens: 'Глютен, яйца, молочные продукты (сливки, пармезан)',
    },
    de: {
      name: 'Hausgemachte Waldpilz-Fettuccine',
      description: 'Frische handgemachte Pasta mit Steinpilzen und Austernpilzen, feiner Rahmsauce, Parmesan und frischem Thymian.',
      allergens: 'Gluten, Eier, Milchprodukte (Sahne, Parmesan)',
    },
    fr: {
      name: 'Fettuccine maison aux champignons sauvages',
      description: 'Pâtes fraîches faites maison aux cèpes et pleurotes, sauce crémeuse, parmesan affiné et feuilles de thym frais.',
      allergens: 'Gluten, Œufs, Produits laitiers (Crème, Parmesan)',
    },
  },
  'menu-item-4': {
    en: {
      name: 'Xenios Gourmet Club Sandwich',
      description: 'Grilled chicken breast, smoked beef, boiled egg, kashar cheese, tomato, crisp lettuce, and golden french fries.',
      allergens: 'Gluten, Eggs, Dairy, Mustard',
    },
    ar: {
      name: 'كلوب ساندويتش غورميه',
      description: 'صدر دجاج مشوي، لحم بقري مدخن، بيض مسلوق، جبن قشقوان، طماطم، خس مقرمش وبطاطس مقلية ذهبية.',
      allergens: 'غلوتين، بيض، منتجات الألبان، خردل',
    },
    ru: {
      name: 'Гурмэ клаб-сэндвич Xenios',
      description: 'Куриная грудка на гриле, копченая говядина, яйцо, сыр кашар, томаты, хрустящий салат и картофель фри.',
      allergens: 'Глютен, яйца, молочные продукты, горчица',
    },
    de: {
      name: 'Xenios Gourmet Club-Sandwich',
      description: 'Gegrillte Hähnchenbrust, geräuchertes Rindfleisch, Ei, Kaschkaval-Käse, Tomate, Salat und knusprige Pommes frites.',
      allergens: 'Gluten, Eier, Milchprodukte, Senf',
    },
    fr: {
      name: 'Club Sandwich Gourmet Xenios',
      description: 'Blanc de poulet grillé, bœuf fumé, œuf dur, fromage kashar, tomate, laitue croquante et frites dorées.',
      allergens: 'Gluten, Œufs, Produits laitiers, Moutarde',
    },
  },
  'menu-item-5': {
    en: {
      name: 'Traditional Baked Rice Pudding & Hazelnuts',
      description: 'Stone-oven caramelized water buffalo milk rice pudding topped with roasted Giresun hazelnuts.',
      allergens: 'Dairy, Tree Nuts (Hazelnuts)',
    },
    ar: {
      name: 'أرز بالحليب بالفرن مع البندق',
      description: 'أرز بالحليب التقليدي المخبوز في الفرن الحجري بحليب الجاموس الأصلي مع بندق غيرسون المحمص.',
      allergens: 'منتجات الألبان، مكسرات (بندق)',
    },
    ru: {
      name: 'Традиционный запеченный рисовый пудинг с фундуком',
      description: 'Запеченный в каменной печи сютлач на буйволином молоке с карамельной корочкой и обжаренным гиресунским фундуком.',
      allergens: 'Молочные продукты, орехи (фундук)',
    },
    de: {
      name: 'Traditioneller gebackener Milchreis & Haselnüsse',
      description: 'Im Steinofen karamellisierter Büffelmilch-Milchreis (Fırın Sütlaç) mit gerösteten Giresun-Haselnüssen.',
      allergens: 'Milchprodukte, Schalenfrüchte (Haselnüsse)',
    },
    fr: {
      name: 'Riz au lait traditionnel au four & Noisettes',
      description: 'Riz au lait de bufflonne caramélisé au four en pierre, garni de noisettes torréfiées de Giresun.',
      allergens: 'Produits laitiers, Fruits à coque (Noisettes)',
    },
  },
  'menu-item-6': {
    en: {
      name: 'Freshly Squeezed Mediterranean Orange Juice',
      description: '100% pure, additive-free daily squeezed orange juice from Finike orchards in Antalya.',
      allergens: 'Allergen-Free (100% Natural)',
    },
    ar: {
      name: 'عصير برتقال متوسطي طازج',
      description: 'عصير برتقال طبيعي 100% خالٍ من الإضافات معصور يومياً من بساتين فينيكي في أنطاليا.',
      allergens: 'خالٍ من مسببات الحساسية (طبيعي 100%)',
    },
    ru: {
      name: 'Свежевыжатый средиземноморский апельсиновый сок',
      description: '100% натуральный свежевыжатый сок из отборных апельсинов садов Финике в Анталье.',
      allergens: 'Без аллергенов (100% натуральный)',
    },
    de: {
      name: 'Frisch gepresster mediterraner Orangensaft',
      description: 'Täglich frisch gepresster 100% natürlicher Orangensaft aus den Gärten von Finike in Antalya.',
      allergens: 'Allergenfrei (100% Natürlich)',
    },
    fr: {
      name: 'Jus d’orange méditerranéen fraîchement pressé',
      description: 'Jus d’orange 100 % naturel sans additifs, pressé quotidiennement à partir des orangers de Finike à Antalya.',
      allergens: 'Sans allergènes (100 % naturel)',
    },
  },
};

export function GuestRoomServiceMenu({ hotel, roomNumber, lang, onClose }: Props) {
  const safeLang: Language = (['tr', 'en', 'ar', 'ru', 'de', 'fr'].includes(lang) ? lang : 'en') as Language;
  const t = getT(safeLang);
  const ui = ROOM_SERVICE_UI_I18N[safeLang] || ROOM_SERVICE_UI_I18N.en;
  const [items] = useState<RoomServiceMenuItem[]>(() => XeniosStore.getRoomServiceMenu(hotel.id).filter(i => i.available));
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  
  // Cart state: itemId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderNote, setOrderNote] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<GuestPaymentMethod>('room_charge');
  const [cardDetails, setCardDetails] = useState<OnlineCardDetails>({
    holderName: '',
    cardNumber: '4543 •••• •••• 8892',
    expiry: '09/28',
    cvv: '734',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const payUi = ONLINE_PAYMENT_I18N[safeLang] || ONLINE_PAYMENT_I18N.en;

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

  const getLocalizedItemName = (item: RoomServiceMenuItem) => {
    if (safeLang === 'tr') return item.name;
    return MENU_ITEMS_I18N[item.id]?.[safeLang]?.name || item.name;
  };

  const getLocalizedItemDesc = (item: RoomServiceMenuItem) => {
    if (safeLang === 'tr') return item.description;
    return MENU_ITEMS_I18N[item.id]?.[safeLang]?.description || item.description;
  };

  const getLocalizedItemAllergens = (item: RoomServiceMenuItem) => {
    if (safeLang === 'tr') return item.allergens || '';
    const preset = MENU_ITEMS_I18N[item.id]?.[safeLang]?.allergens;
    if (preset) return preset;
    return item.allergens || '';
  };

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

    let paymentReference = '';
    if (paymentMethod === 'online_card') {
      const payRes = await processOnlineServicePayment({
        amount: cartTotal,
        currency: 'EUR',
        hotelId: hotel.id,
        hotelName: hotel.name,
        roomNumber,
        serviceTitle: 'Oda Servisi Siparişi',
        card: cardDetails,
        lang: safeLang,
      });
      if (!payRes.success) {
        toast.error(payRes.error || payUi.invalidCardError);
        setIsSubmitting(false);
        return;
      }
      paymentReference = payRes.paymentReference;
    }

    const orderDetails = Object.entries(cart).map(([id, qty]) => {
      const item = items.find(i => i.id === id);
      return item ? `${qty}x ${item.name} (${item.price * qty} ${item.currency})` : '';
    }).filter(Boolean);

    const cleanNote = orderNote.trim();
    const paymentLine =
      paymentMethod === 'online_card'
        ? `💳 Ödeme: Online Ödendi (${cartTotal} EUR · Onay: #${paymentReference})`
        : `🏨 Ödeme: Oda Folyosu / Teslimatta (${cartTotal} EUR)`;

    const summaryParts = [
      orderDetails.join('\n'),
      cleanNote ? `Not: ${cleanNote}` : '',
      paymentLine,
      `Toplam: ${cartTotal} EUR`,
    ].filter(Boolean);
    const summary = summaryParts.join('\n\n');

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
        paymentMethod,
        paymentStatus: paymentMethod === 'online_card' ? 'paid_online' : 'room_folio',
        paymentAmount: cartTotal,
        paymentCurrency: 'EUR',
        ...(paymentReference ? { paymentReference } : {}),
        details: {
          items: orderDetails,
          total: cartTotal,
          paymentMethod,
          paymentStatus: paymentMethod === 'online_card' ? 'paid_online' : 'room_folio',
          ...(paymentReference ? { paymentReference } : {}),
          ...(cleanNote ? { note: cleanNote } : {}),
        }
      });

      toast.success(
        paymentMethod === 'online_card' ? payUi.paymentSuccessToast : ui.orderReceivedTitle,
        {
          description: `${hotel.name} ${t.room} ${roomNumber} · ${ui.orderServiceLabel}${paymentReference ? ` · #${paymentReference}` : ''}`
        }
      );
      onClose();
    } catch (e) {
      toast.error(ui.orderError);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="luxury-service-card flex flex-col h-[84vh] bg-[#F7F3EA]/95 backdrop-blur-[18px] rounded-[28px] border-[1.5px] border-[rgba(230,185,75,0.55)] overflow-hidden relative shadow-2xl text-[#141414]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-[#FAF8F4] to-[#EDE5D6] border-b border-[rgba(230,185,75,0.45)] z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <LuxuryServiceIcon serviceKey="roomservice" className="w-11 h-11" />
          </div>
          <div>
            <h3 className="font-luxury-serif text-[17px] font-bold uppercase tracking-[0.04em] text-[#141414]">{ui.title}</h3>
            <p className="font-luxury-sans text-[11px] text-[#5C4938] font-medium">{hotel.name} · {t.room} {roomNumber}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 text-[#141414] font-bold bg-[rgba(245,215,130,0.22)] hover:bg-[rgba(245,215,130,0.4)] border border-[rgba(230,185,75,0.55)] rounded-full flex items-center justify-center transition cursor-pointer">
          ✕
        </button>
      </div>

      {/* Categories */}
      <div className="flex overflow-x-auto gap-2 p-3 bg-[rgba(245,215,130,0.22)] backdrop-blur-[18px] border-b border-[rgba(230,185,75,0.55)] shrink-0 hide-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`font-luxury-sans px-4 py-1.5 rounded-full text-xs whitespace-nowrap active:opacity-75 active:scale-[0.985] transition-all duration-150 border cursor-pointer ${
              selectedCategory === cat 
                ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] text-white font-bold border-[#7D5E2A] shadow-sm' 
                : 'golden-pill-badge text-[#2C1E0F] font-semibold hover:bg-[rgba(240,195,70,0.48)]'
            }`}
          >
            {ui.categories[cat] || cat}
          </button>
        ))}
      </div>

      {/* Item List */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-3.5 ${cartCount > 0 ? 'pb-80' : 'pb-12'}`}>
        {filteredItems.map(item => {
          const qty = getQuantity(item.id);
          const itemName = getLocalizedItemName(item);
          const itemDesc = getLocalizedItemDesc(item);
          const itemAllergens = getLocalizedItemAllergens(item);
          return (
            <div key={item.id} className="luxury-service-card p-3.5 flex gap-3.5 transition-all">
              {/* Image placeholder if none */}
              <div className="w-24 h-24 rounded-2xl bg-[rgba(245,215,130,0.22)] overflow-hidden shrink-0 relative border border-[rgba(230,185,75,0.55)]">
                {item.image ? (
                  <img src={item.image} alt={itemName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8E7252]">
                    <UtensilsCrossed className="w-8 h-8 stroke-[1.5]" />
                  </div>
                )}
                {/* Price tag */}
                <div className="golden-pill-badge absolute bottom-1.5 right-1.5 backdrop-blur-md px-2.5 py-0.5 rounded-full font-luxury-serif text-[12px] font-bold text-[#2C1E0F] shadow-sm">
                  {item.price}{item.currency === 'EUR' ? '€' : item.currency}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col min-w-0 font-luxury-sans">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-luxury-serif font-bold text-[#141414] text-[15px] leading-tight line-clamp-2">{itemName}</h4>
                </div>
                
                <p className="text-[11px] text-[#3D352E] mt-1 line-clamp-2 leading-relaxed">
                  {itemDesc}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {item.preparationTimeMinutes && (
                    <div className="flex items-center gap-1 text-[10px] text-[#6B5A48] font-medium">
                      <Clock className="w-3 h-3 text-[#8E7252]" />
                      ~{item.preparationTimeMinutes} {ui.min}
                    </div>
                  )}
                  {item.calories !== undefined && item.calories !== '' && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#6E4912] bg-[rgba(245,215,130,0.38)] border border-[rgba(220,175,50,0.6)] px-2 py-0.5 rounded-full">
                      🔥 ~{item.calories} {ui.kcal}
                    </span>
                  )}
                </div>

                {itemAllergens && (
                  <div className="mt-1.5 text-[10px] text-[#4A3820] bg-[rgba(255,250,238,0.65)] border border-[rgba(220,175,50,0.5)] px-2 py-1 rounded-xl leading-snug">
                    <span className="font-bold text-[#7D5E2A]">⚠️ {ui.allergensLabel}:</span> {itemAllergens}
                  </div>
                )}

                <div className="mt-auto pt-2.5 flex items-center justify-end">
                  {qty === 0 ? (
                    <button 
                      onClick={() => addToCart(item.id)}
                      className="golden-pill-badge px-4 py-1.5 text-[#2C1E0F] hover:bg-[rgba(240,195,70,0.48)] rounded-full text-xs font-bold active:opacity-75 active:scale-[0.985] transition-all duration-150 flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> {ui.add}
                    </button>
                  ) : (
                    <div className="golden-pill-badge flex items-center gap-2.5 rounded-full p-1 shadow-2xs">
                      <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full bg-[rgba(245,215,130,0.45)] border border-[rgba(220,175,50,0.6)] flex items-center justify-center text-[#2C1E0F] shadow-xs hover:bg-[rgba(240,195,70,0.55)] active:opacity-75 active:scale-[0.985] transition-all duration-150 cursor-pointer">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-extrabold text-sm w-5 text-center text-[#141414] select-none">{qty}</span>
                      <button onClick={() => addToCart(item.id)} className="w-7 h-7 rounded-full bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] flex items-center justify-center text-white shadow-xs active:opacity-75 active:scale-[0.985] transition-all duration-150 cursor-pointer">
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
            {ui.empty}
          </div>
        )}
      </div>

      {/* Floating Cart Footer with Guest Note Input & Online Payment Choice */}
      {cartCount > 0 && (
        <div className="absolute bottom-0 left-0 right-0 max-h-[55vh] overflow-y-auto px-3.5 pt-3 pb-4 sm:p-4 bg-[#F7F3EA]/98 backdrop-blur-md border-t border-[#D8CBB8] shadow-[0_-10px_28px_rgba(28,22,14,0.12)] z-30 space-y-2.5">
          <div className="bg-[#FAF8F4] border border-[#C4B8A4] rounded-2xl px-3 py-2 shadow-2xs space-y-1.5">
            <label className="flex items-center gap-1.5 font-luxury-sans text-[11px] font-bold text-[#5C4938]">
              <MessageSquareText className="w-3.5 h-3.5 text-[#8E7252]" />
              <span>{ui.noteLabel}</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {ui.quickAllergens.map(tag => {
                const isSelected = orderNote.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setOrderNote(
                          orderNote
                            .replace(new RegExp(`\\s*,?\\s*${tag}`, 'g'), '')
                            .replace(/^,\s*/, '')
                            .trim()
                        );
                      } else {
                        setOrderNote(orderNote.trim() ? `${orderNote.trim()}, ${tag}` : tag);
                      }
                    }}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#8E7252] text-white border-[#7D5E2A]'
                        : 'bg-[#F3EDE2] text-[#5C4938] border-[#D8CBB8] hover:bg-[#EAE0CE]'
                    }`}
                  >
                    {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                  </button>
                );
              })}
            </div>
            <textarea
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              rows={2}
              placeholder={ui.notePlaceholder}
              className="w-full bg-transparent font-luxury-sans text-[16px] sm:text-xs leading-snug text-[#141414] placeholder:text-[#8C7B68] focus:outline-none resize-none"
            />
          </div>

          <InlineOnlinePaymentBox
            amount={cartTotal}
            currency="EUR"
            lang={safeLang}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            cardDetails={cardDetails}
            onCardDetailsChange={setCardDetails}
            compact
          />

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="font-luxury-sans w-full bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xl transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                {paymentMethod === 'online_card' ? <Lock className="w-4 h-4" /> : cartCount}
              </div>
              <span className="font-bold text-sm sm:text-base">
                {isSubmitting
                  ? payUi.processing3DSecure
                  : paymentMethod === 'online_card'
                  ? payUi.payAndSubmit(`${cartTotal} €`)
                  : ui.placeOrder}
              </span>
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

