"use client";

import { useState } from 'react';
import { ServiceField, ServiceModuleConfig, buildInitialDetails, resolveFieldOptions } from '@/lib/service-modules';
import { Language } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

interface ServiceRequestFormProps {
  config: ServiceModuleConfig;
  onSubmit: (details: Record<string, any>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  pricing?: Record<string, number>;
  fieldOptionOverrides?: Record<string, string[]>;
  lang?: Language;
}

const FORM_UI_I18N: Record<Language, {
  optional: string;
  cancel: string;
  submitting: string;
  submit: string;
  hotelEntrance: string;
}> = {
  tr: {
    optional: '(İsteğe Bağlı)',
    cancel: 'İptal',
    submitting: 'Gönderiliyor...',
    submit: 'Talebi İlet',
    hotelEntrance: 'Otel Girişi',
  },
  en: {
    optional: '(Optional)',
    cancel: 'Cancel',
    submitting: 'Sending...',
    submit: 'Submit Request',
    hotelEntrance: 'Hotel Entrance',
  },
  ar: {
    optional: '(اختياري)',
    cancel: 'إلغاء',
    submitting: 'جاري الإرسال...',
    submit: 'إرسال الطلب',
    hotelEntrance: 'مدخل الفندق',
  },
  ru: {
    optional: '(Необязательно)',
    cancel: 'Отмена',
    submitting: 'Отправка...',
    submit: 'Отправить запрос',
    hotelEntrance: 'Вход в отель',
  },
  de: {
    optional: '(Optional)',
    cancel: 'Abbrechen',
    submitting: 'Wird gesendet...',
    submit: 'Anfrage senden',
    hotelEntrance: 'Hoteleingang',
  },
  fr: {
    optional: '(Optionnel)',
    cancel: 'Annuler',
    submitting: 'Envoi en cours...',
    submit: 'Envoyer la demande',
    hotelEntrance: 'Entrée de l’hôtel',
  },
};

const FIELD_LABEL_I18N: Record<string, Partial<Record<Language, string>>> = {
  'Kahvaltı Türü': { en: 'Breakfast Type', ar: 'نوع الإفطار', ru: 'Тип завтрака', de: 'Frühstücksart', fr: 'Type de petit-déjeuner' },
  'Kişi Sayısı': { en: 'Number of Guests', ar: 'عدد الأشخاص', ru: 'Количество гостей', de: 'Personenanzahl', fr: 'Nombre de personnes' },
  'Saat': { en: 'Time', ar: 'الوقت', ru: 'Время', de: 'Uhrzeit', fr: 'Heure' },
  'Özel İstekler': { en: 'Special Requests', ar: 'طلبات خاصة', ru: 'Особые пожелания', de: 'Sonderwünsche', fr: 'Demandes spéciales' },
  'Toplam Ücret': { en: 'Total Fee', ar: 'التكلفة الإجمالية', ru: 'Итоговая стоимость', de: 'Gesamtbetrag', fr: 'Montant total' },
  'Durum (Aktif/Pasif)': { en: 'Status (Active/Inactive)', ar: 'الحالة (نشط/غير نشط)', ru: 'Статус (Активен/Неактивен)', de: 'Status (Aktiv/Inaktiv)', fr: 'Statut (Actif/Inactif)' },
  'Kaldırılma Saati': { en: 'Removal Time', ar: 'وقت الإزالة', ru: 'Время снятия', de: 'Aufhebungszeit', fr: 'Heure de retrait' },
  'Acil Yardım Butonu': { en: 'Emergency Assistance', ar: 'زر المساعدة الطارئة', ru: 'Экстренная помощь', de: 'Notruf-Taste', fr: 'Assistance d’urgence' },
  'Aciliyet Derecesi': { en: 'Urgency Level', ar: 'درجة الاستعجال', ru: 'Срочность', de: 'Dringlichkeit', fr: 'Niveau d’urgence' },
  'Temizlik Nedeni': { en: 'Cleaning Reason', ar: 'سبب التنظيف', ru: 'Причина уборки', de: 'Reinigungsgrund', fr: 'Motif du ménage' },
  'Oda Durumu': { en: 'Room Status', ar: 'حالة الغرفة', ru: 'Статус номера', de: 'Zimmerstatus', fr: 'État de la chambre' },
  'Özel Not': { en: 'Special Note', ar: 'ملاحظة خاصة', ru: 'Особое примечание', de: 'Besondere Notiz', fr: 'Note spéciale' },
  'Beklenen Zaman': { en: 'Expected Time', ar: 'الوقت المتوقع', ru: 'Ожидаемое время', de: 'Erwartete Zeit', fr: 'Temps estimé' },
  'Havlu Türü': { en: 'Towel Type', ar: 'نوع المنشفة', ru: 'Тип полотенца', de: 'Handtuchtyp', fr: 'Type de serviette' },
  'Adet Sayısı': { en: 'Quantity', ar: 'الكمية', ru: 'Количество', de: 'Anzahl', fr: 'Quantité' },
  'Teslimat Zamanı': { en: 'Delivery Time', ar: 'وقت التسليم', ru: 'Время доставки', de: 'Lieferzeit', fr: 'Heure de livraison' },
  'Eski Havlu Alınması': { en: 'Used Towel Pickup', ar: 'استلام المناشف المستعملة', ru: 'Забрать использованные полотенца', de: 'Abholung gebrauchter Handtücher', fr: 'Retrait des serviettes usagées' },
  'Değişim Türü': { en: 'Change Type', ar: 'نوع التغيير', ru: 'Тип замены', de: 'Wechselart', fr: 'Type de changement' },
  'Durum (Teslim/Değiştirelim)': { en: 'Service Mode', ar: 'طريقة الخدمة', ru: 'Способ обслуживания', de: 'Servicemodus', fr: 'Mode de service' },
  'Ücret': { en: 'Fee', ar: 'الرسوم', ru: 'Стоимость', de: 'Gebühr', fr: 'Tarif' },
  'Yastık Türü': { en: 'Pillow Type', ar: 'نوع الوسادة', ru: 'Тип подушки', de: 'Kissentyp', fr: 'Type d’oreiller' },
  'Uyku Sorunu (Opsiyonel)': { en: 'Sleep Concern', ar: 'مشكلة النوم', ru: 'Проблема со сном', de: 'Schlafproblem', fr: 'Besoin de sommeil' },
  'Malzeme Seçimi': { en: 'Select Items', ar: 'اختيار المستلزمات', ru: 'Выбор принадлежностей', de: 'Artikelauswahl', fr: 'Sélection d’articles' },
  'Marka': { en: 'Brand / Tier', ar: 'العلامة التجارية', ru: 'Категория бренда', de: 'Marke / Kategorie', fr: 'Gamme / Marque' },
  'Allerji Uyarıları': { en: 'Allergy Warnings', ar: 'تحذيرات الحساسية', ru: 'Предупреждения об аллергии', de: 'Allergiehinweise', fr: 'Avertissements d’allergie' },
  'Set Türü': { en: 'Kit Type', ar: 'نوع المجموعة', ru: 'Тип набора', de: 'Set-Typ', fr: 'Type de kit' },
  'Ek Ürünler': { en: 'Additional Items', ar: 'منتجات إضافية', ru: 'Дополнительные предметы', de: 'Zusätzliche Artikel', fr: 'Articles supplémentaires' },
  'Menü Seçimi': { en: 'Menu Selection', ar: 'اختيار القائمة', ru: 'Выбор меню', de: 'Menüauswahl', fr: 'Sélection du menu' },
  'Miktar': { en: 'Quantity', ar: 'الكمية', ru: 'Количество', de: 'Menge', fr: 'Quantité' },
  'Özel Notlar': { en: 'Special Notes', ar: 'ملاحظات خاصة', ru: 'Особые пожелания', de: 'Besondere Hinweise', fr: 'Notes spéciales' },
  'İçecek Seçimi': { en: 'Beverage Selection', ar: 'اختيار المشروبات', ru: 'Выбор напитков', de: 'Getränkeauswahl', fr: 'Sélection de boissons' },
  'Sorun Türü': { en: 'Issue Type', ar: 'نوع المشكلة', ru: 'Тип проблемы', de: 'Problemart', fr: 'Type de problème' },
  'Detay Açıklaması': { en: 'Detailed Description', ar: 'وصف تفصيلي', ru: 'Подробное описание', de: 'Detaillierte Beschreibung', fr: 'Description détaillée' },
  'İletişim (Telefon)': { en: 'Contact (Phone)', ar: 'الاتصال (الهاتف)', ru: 'Контакт (Телефон)', de: 'Kontakt (Telefon)', fr: 'Contact (Téléphone)' },
  'Sorun Kategorisi': { en: 'Issue Category', ar: 'فئة المشكلة', ru: 'Категория проблемы', de: 'Problemkategorie', fr: 'Catégorie du problème' },
  'Sorun Açıklaması': { en: 'Issue Description', ar: 'وصف المشكلة', ru: 'Описание проблемы', de: 'Problembeschreibung', fr: 'Description du problème' },
  'Hizmet Türü': { en: 'Service Type', ar: 'نوع الخدمة', ru: 'Тип услуги', de: 'Serviceart', fr: 'Type de service' },
  'Kıyafet Türü': { en: 'Garment Type', ar: 'نوع الملابس', ru: 'Тип одежды', de: 'Kleidungsart', fr: 'Type de vêtement' },
  'Kıyafet Sorunu (Leke/Hasar)': { en: 'Garment Condition (Stain/Damage)', ar: 'حالة الملابس (بقعة/تلف)', ru: 'Состояние одежды (пятна/повреждения)', de: 'Kleidungszustand (Fleck/Schaden)', fr: 'État du vêtement (Tache/Dommage)' },
  'Ütü Talep Edimi': { en: 'Ironing Requested', ar: 'طلب الكي', ru: 'Требуется глажка', de: 'Bügeln gewünscht', fr: 'Repassage souhaité' },
  'Çıkış Saati': { en: 'Check-out Time', ar: 'وقت المغادرة', ru: 'Время выезда', de: 'Check-out-Zeit', fr: 'Heure de départ' },
  'İstenen Çıkış Saati': { en: 'Requested Check-out Time', ar: 'وقت المغادرة المطلوب', ru: 'Желаемое время выезда', de: 'Gewünschte Check-out-Zeit', fr: 'Heure de départ souhaitée' },
  'Ek Ücret Bilgisi': { en: 'Additional Fee Info', ar: 'معلومات الرسوم الإضافية', ru: 'Информация о доплате', de: 'Info zur Zusatzgebühr', fr: 'Infos sur les frais supplémentaires' },
  'Not (Opsiyonel)': { en: 'Note', ar: 'ملاحظة', ru: 'Примечание', de: 'Notiz', fr: 'Note' },
  'Uzatma Süresi (Gece/Gün)': { en: 'Extension Duration', ar: 'مدة التمديد', ru: 'Срок продления', de: 'Verlängerungsdauer', fr: 'Durée de prolongation' },
  'Oda Durumu (Aynı/Farklı)': { en: 'Room Preference', ar: 'تفضيل الغرفة', ru: 'Предпочтение по номеру', de: 'Zimmerpräferenz', fr: 'Préférence de chambre' },
  'Ücret Hesaplaması': { en: 'Fee Calculation', ar: 'حساب الرسوم', ru: 'Расчет стоимости', de: 'Gebührenberechnung', fr: 'Calcul du tarif' },
  'Başlangıç Noktası': { en: 'Pick-up Point', ar: 'نقطة الانطلاق', ru: 'Место посадки', de: 'Abholort', fr: 'Point de départ' },
  'Varış Noktası': { en: 'Destination', ar: 'الوجهة', ru: 'Пункт назначения', de: 'Zielort', fr: 'Destination' },
  'Yolcu Sayısı': { en: 'Passenger Count', ar: 'عدد الركاب', ru: 'Количество пассажиров', de: 'Passagieranzahl', fr: 'Nombre de passagers' },
  'Bagaj Sayısı': { en: 'Luggage Count', ar: 'عدد الحقائب', ru: 'Количество багажа', de: 'Gepäckanzahl', fr: 'Nombre de bagages' },
  'Araç Tipi': { en: 'Vehicle Type', ar: 'نوع المركبة', ru: 'Тип автомобиля', de: 'Fahrzeugtyp', fr: 'Type de véhicule' },
  'Zaman': { en: 'Time', ar: 'الوقت', ru: 'Время', de: 'Zeitpunkt', fr: 'Heure' },
  'Fiyat Tahmini': { en: 'Estimated Fare', ar: 'التكلفة التقديرية', ru: 'Ориентировочная стоимость', de: 'Preisschätzung', fr: 'Tarif estimé' },
  'Sürücü Bilgisi': { en: 'Driver Info', ar: 'معلومات السائق', ru: 'Информация о водителе', de: 'Fahrerinfo', fr: 'Infos chauffeur' },
  'Canlı Takip': { en: 'Live Tracking', ar: 'التتبع المباشر', ru: 'Отслеживание', de: 'Live-Tracking', fr: 'Suivi en direct' },
};

const OPTION_I18N: Record<string, Partial<Record<Language, string>>> = {
  // Toggles
  'Evet': { en: 'Yes', ar: 'نعم', ru: 'Да', de: 'Ja', fr: 'Oui' },
  'Hayır': { en: 'No', ar: 'لا', ru: 'Нет', de: 'Nein', fr: 'Non' },
  'Aktif': { en: 'Active', ar: 'نشط', ru: 'Активен', de: 'Aktiv', fr: 'Actif' },
  'Pasif': { en: 'Inactive', ar: 'غير نشط', ru: 'Неактивен', de: 'Inaktiv', fr: 'Inactif' },
  'Acil Yardım Gerekiyor': { en: 'Emergency Help Needed', ar: 'مطلوب مساعدة طارئة', ru: 'Нужна срочная помощь', de: 'Notfallhilfe benötigt', fr: 'Aide d’urgence requise' },
  // Breakfast
  'Türk Kahvaltısı': { en: 'Turkish Breakfast', ar: 'إفطار تركي', ru: 'Турецкий завтрак', de: 'Türkisches Frühstück', fr: 'Petit-déjeuner turc' },
  'Kontinental Kahvaltı': { en: 'Continental Breakfast', ar: 'إفطار كونتيننتال', ru: 'Континентальный завтрак', de: 'Kontinentales Frühstück', fr: 'Petit-déjeuner continental' },
  'Vegan Kahvaltı': { en: 'Vegan Breakfast', ar: 'إفطار نباتي', ru: 'Веганский завтрак', de: 'Veganes Frühstück', fr: 'Petit-déjeuner végan' },
  'Çocuk Menüsü': { en: 'Kids Menu', ar: 'قائمة الأطفال', ru: 'Детское меню', de: 'Kindermenü', fr: 'Menu enfant' },
  // DND
  '1 Saat Sonra': { en: 'In 1 Hour', ar: 'بعد ساعة واحدة', ru: 'Через 1 час', de: 'In 1 Stunde', fr: 'Dans 1 heure' },
  '3 Saat Sonra': { en: 'In 3 Hours', ar: 'بعد 3 ساعات', ru: 'Через 3 часа', de: 'In 3 Stunden', fr: 'Dans 3 heures' },
  'Yarın Sabah 08:00': { en: 'Tomorrow Morning 08:00', ar: 'غداً صباحاً 08:00', ru: 'Завтра утром в 08:00', de: 'Morgen früh 08:00', fr: 'Demain matin 08h00' },
  'Belirsiz / Ben Kaldırırım': { en: 'Until I Turn It Off', ar: 'غير محدد / سأقوم بإزالته بنفسي', ru: 'Неопределенно / Сниму сам', de: 'Unbestimmt / Ich hebe es selbst auf', fr: 'Indéfini / Je le retirerai moi-même' },
  // Cleaning
  'Standart': { en: 'Standard', ar: 'قياسي', ru: 'Стандартный', de: 'Standard', fr: 'Standard' },
  'Acil': { en: 'Urgent', ar: 'عاجل', ru: 'Срочно', de: 'Dringend', fr: 'Urgent' },
  'Genel Temizlik': { en: 'General Cleaning', ar: 'تنظيف عام', ru: 'Общая уборка', de: 'Allgemeine Reinigung', fr: 'Ménage général' },
  'Kahvaltı Sonrası Toparlama': { en: 'Post-Breakfast Tidy Up', ar: 'ترتيب ما بعد الإفطار', ru: 'Уборка после завтрака', de: 'Aufräumen nach dem Frühstück', fr: 'Rangement après petit-déjeuner' },
  'Acil Kirlilik / Dökülme': { en: 'Urgent Spill / Mess', ar: 'اتساخ طارئ / انسكاب', ru: 'Срочное загрязнение / Пролитие', de: 'Dringende Verschmutzung', fr: 'Salissure urgente / Renversement' },
  'Koku Şikayeti': { en: 'Odor Issue', ar: 'شكوى رائحة', ru: 'Жалоба на запах', de: 'Geruchsproblem', fr: 'Problème d’odeur' },
  'Diğer': { en: 'Other', ar: 'أخرى', ru: 'Другое', de: 'Sonstiges', fr: 'Autre' },
  'Oda Boş': { en: 'Room is Vacant', ar: 'الغرفة فارغة', ru: 'Номер свободен', de: 'Zimmer ist frei', fr: 'Chambre libre' },
  'Oda Dolu (Misafir İçeride)': { en: 'Guest Inside Room', ar: 'الغرفة مشغولة (الضيف بالداخل)', ru: 'Гость в номере', de: 'Gast im Zimmer', fr: 'Client présent dans la chambre' },
  // Towels
  'Banyo Havlusu': { en: 'Bath Towel', ar: 'منشفة استحمام', ru: 'Банное полотенце', de: 'Badetuch', fr: 'Serviette de bain' },
  'Yüz Havlusu': { en: 'Face Towel', ar: 'منشفة وجه', ru: 'Полотенце для лица', de: 'Gesichtshandtuch', fr: 'Serviette de visage' },
  'Ayak Havlusu': { en: 'Bath Mat / Foot Towel', ar: 'منشفة قدم', ru: 'Полотенце для ног', de: 'Badematte / Fußhandtuch', fr: 'Tapis de bain / Serviette de pieds' },
  'Bornoz': { en: 'Bathrobe', ar: 'رداء حمام (برنس)', ru: 'Халат', de: 'Bademantel', fr: 'Peignoir' },
  'Hemen': { en: 'Immediately', ar: 'فوراً', ru: 'Сейчас', de: 'Sofort', fr: 'Immédiatement' },
  '30 Dakika İçinde': { en: 'Within 30 Minutes', ar: 'خلال 30 دقيقة', ru: 'В течение 30 минут', de: 'Innerhalb von 30 Minuten', fr: 'Sous 30 minutes' },
  '1 Saat İçinde': { en: 'Within 1 Hour', ar: 'خلال ساعة واحدة', ru: 'В течение 1 часа', de: 'Innerhalb von 1 Stunde', fr: 'Sous 1 heure' },
  // Linens
  'Tam Takım (Çarşaf + Nevresim)': { en: 'Full Set (Sheets + Duvet Cover)', ar: 'طقم كامل (ملاءة + غطاء لحاف)', ru: 'Полный комплект (простыня + пододеяльник)', de: 'Komplettset (Bettlaken + Bettbezug)', fr: 'Ensemble complet (Draps + Housse)' },
  'Sadece Nevresim': { en: 'Duvet Cover Only', ar: 'غطاء اللحاف فقط', ru: 'Только пододеяльник', de: 'Nur Bettbezug', fr: 'Housse de couette uniquement' },
  'Sadece Alt Çarşaf': { en: 'Bottom Sheet Only', ar: 'الملاءة السفلية فقط', ru: 'Только нижняя простыня', de: 'Nur Bettlaken', fr: 'Drap-housse uniquement' },
  'Odaya Teslim Edilsin': { en: 'Deliver to Room Only', ar: 'التسليم إلى الغرفة فقط', ru: 'Доставить в номер', de: 'Nur aufs Zimmer liefern', fr: 'Livrer en chambre uniquement' },
  'Odada Değiştirilsin (Housekeeping Girsin)': { en: 'Change in Room (Housekeeping)', ar: 'التغيير داخل الغرفة (تدبير منزلي)', ru: 'Заменить в номере (Housekeeping)', de: 'Im Zimmer wechseln (Housekeeping)', fr: 'Changer dans la chambre (Housekeeping)' },
  'Bugün İçinde': { en: 'During Today', ar: 'خلال اليوم', ru: 'В течение сегодняшнего дня', de: 'Im Laufe des Tages', fr: 'Dans la journée' },
  'Belirli Saatte': { en: 'At Specific Time', ar: 'في وقت محدد', ru: 'В определенное время', de: 'Zu einer bestimmten Uhrzeit', fr: 'À une heure précise' },
  // Pillows
  'Ortopedik': { en: 'Orthopedic', ar: 'طبية (أورثوبيديك)', ru: 'Ортопедическая', de: 'Orthopädisch', fr: 'Orthopédique' },
  'Lateks': { en: 'Latex', ar: 'لاتكس', ru: 'Латексная', de: 'Latex', fr: 'Latex' },
  'Tüy (Kaz Tüyü)': { en: 'Goose Down / Feather', ar: 'ريش نعام / إوز', ru: 'Пуховая (гусиный пух)', de: 'Gänsedaunen', fr: 'Plumes d’oie' },
  'Yok': { en: 'None', ar: 'لا يوجد', ru: 'Нет', de: 'Keine', fr: 'Aucun' },
  'Boyun Ağrısı': { en: 'Neck Pain', ar: 'ألم الرقبة', ru: 'Боль в шее', de: 'Nackenschmerzen', fr: 'Douleur cervicale' },
  'Sırt Ağrısı': { en: 'Back Pain', ar: 'ألم الظهر', ru: 'Боль в спине', de: 'Rückenschmerzen', fr: 'Mal de dos' },
  'Alerji': { en: 'Allergy', ar: 'حساسية', ru: 'Аллергия', de: 'Allergie', fr: 'Allergie' },
  'Akşam Turndown İle': { en: 'With Evening Turndown', ar: 'مع خدمة المساء', ru: 'С вечерним сервисом', de: 'Mit dem Abendservice', fr: 'Avec le service du soir' },
  // Toiletries
  'Şampuan': { en: 'Shampoo', ar: 'شامبو', ru: 'Шампунь', de: 'Shampoo', fr: 'Shampoing' },
  'Duş Jeli': { en: 'Shower Gel', ar: 'جل استحمام', ru: 'Гель для душа', de: 'Duschgel', fr: 'Gel douche' },
  'Sabun': { en: 'Soap', ar: 'صابون', ru: 'Мыло', de: 'Seife', fr: 'Savon' },
  'Vücut Losyonu': { en: 'Body Lotion', ar: 'لوشن للجسم', ru: 'Лосьон для тела', de: 'Körperlotion', fr: 'Lotion corporelle' },
  'Nemlendirici Krem': { en: 'Moisturizing Cream', ar: 'كريم مرطب', ru: 'Увлажняющий крем', de: 'Feuchtigkeitscreme', fr: 'Crème hydratante' },
  'Premium': { en: 'Premium', ar: 'بريميوم', ru: 'Премиум', de: 'Premium', fr: 'Premium' },
  'Organik': { en: 'Organic', ar: 'عضوي', ru: 'Органический', de: 'Bio / Organisch', fr: 'Biologique' },
  'Vegan': { en: 'Vegan', ar: 'نباتي', ru: 'Веганский', de: 'Vegan', fr: 'Végan' },
  // Hygiene
  'Kadın Bakım Seti': { en: 'Women’s Care Kit', ar: 'مجموعة عناية نسائية', ru: 'Женский гигиенический набор', de: 'Damen-Pflegeset', fr: 'Kit de soin femme' },
  'Erkek Tıraş Seti': { en: 'Men’s Shaving Kit', ar: 'مجموعة حلاقة رجالية', ru: 'Мужской бритвенный набор', de: 'Herren-Rasierset', fr: 'Kit de rasage homme' },
  'Çocuk Hijyen Seti': { en: 'Kids Hygiene Kit', ar: 'مجموعة نظافة للأطفال', ru: 'Детский гигиенический набор', de: 'Kinder-Hygieneset', fr: 'Kit d’hygiène enfant' },
  'Seyahat Seti': { en: 'Travel Kit', ar: 'مجموعة سفر', ru: 'Дорожный набор', de: 'Reiseset', fr: 'Kit de voyage' },
  'Diş Fırçası & Macun': { en: 'Toothbrush & Toothpaste', ar: 'فرشاة ومعجون أسنان', ru: 'Зубная щетка и паста', de: 'Zahnbürste & Zahnpasta', fr: 'Brosse à dents & Dentifrice' },
  'Tıraş Bıçağı & Köpük': { en: 'Razor & Shaving Foam', ar: 'شفرة ورغوة حلاقة', ru: 'Бритва и пена для бритья', de: 'Rasierer & Rasierschaum', fr: 'Rasoir & Mousse à raser' },
  'Terlik': { en: 'Slippers', ar: 'شبشب', ru: 'Тапочки', de: 'Hausschuhe', fr: 'Chaussons' },
  'Duş Bonesi': { en: 'Shower Cap', ar: 'قبعة استحمام', ru: 'Шапочка для душа', de: 'Duschhaube', fr: 'Bonnet de douche' },
  'Pamuklu Çubuk': { en: 'Cotton Swabs', ar: 'أعواد قطنية', ru: 'Ватные палочки', de: 'Wattestäbchen', fr: 'Cotons-tiges' },
  // Room Service
  'Geleneksel Türk Serpme Kahvaltısı': { en: 'Traditional Turkish Spread Breakfast', ar: 'إفطار تركي تقليدي متنوع', ru: 'Традиционный турецкий завтрак', de: 'Traditionelles türkisches Frühstück', fr: 'Petit-déjeuner traditionnel turc' },
  'Dana Antrikot Izgara & Trüflü Patates Püresi': { en: 'Grilled Ribeye & Truffle Mashed Potatoes', ar: 'ريب آي مشوي مع بيوريه البطاطس بالكمأة', ru: 'Рибай на гриле с трюфельным пюре', de: 'Gegrilltes Entrecôte & Trüffel-Kartoffelpüree', fr: 'Entrecôte grillée & Purée à la truffe' },
  'El Yapımı Yaban Mantarlı Fettuccine': { en: 'Handmade Wild Mushroom Fettuccine', ar: 'فيتوتشيني يدوي بالفطر البري', ru: 'Домашние феттуччине с лесными грибами', de: 'Hausgemachte Waldpilz-Fettuccine', fr: 'Fettuccine maison aux champignons sauvages' },
  'Xenios Gurme Kulüp Sandviç': { en: 'Xenios Gourmet Club Sandwich', ar: 'كلوب ساندويتش غورميه', ru: 'Гурмэ клаб-сэндвич', de: 'Gourmet Club-Sandwich', fr: 'Club Sandwich Gourmet' },
  'Geleneksel Fırın Sütlaç & Fındık': { en: 'Traditional Baked Rice Pudding & Hazelnuts', ar: 'أرز بالحليب بالفرن مع البندق', ru: 'Традиционный запеченный рисовый пудинг с фундуком', de: 'Traditioneller gebackener Milchreis & Haselnüsse', fr: 'Riz au lait traditionnel au four & Noisettes' },
  'Taze Sıkılmış Akdeniz Portakal Suyu': { en: 'Freshly Squeezed Mediterranean Orange Juice', ar: 'عصير برتقال طازج', ru: 'Свежевыжатый средиземноморский апельсиновый сок', de: 'Frisch gepresster Orangensaft', fr: 'Jus d’orange méditerranéen fraîchement pressé' },
  // Minibar
  'Su (0.5L)': { en: 'Water (0.5L)', ar: 'ماء (0.5 لتر)', ru: 'Вода (0.5 л)', de: 'Wasser (0,5L)', fr: 'Eau (0,5L)' },
  'Kola': { en: 'Cola', ar: 'كولا', ru: 'Кола', de: 'Cola', fr: 'Cola' },
  'Meyve Suyu': { en: 'Fruit Juice', ar: 'عصير فواكه', ru: 'Фруктовый сок', de: 'Fruchtsaft', fr: 'Jus de fruits' },
  'Bira': { en: 'Beer', ar: 'بيرة', ru: 'Пиво', de: 'Bier', fr: 'Bière' },
  'Şarap (Kırmızı/Beyaz)': { en: 'Wine (Red/White)', ar: 'نبيذ (أحمر/أبيض)', ru: 'Вино (Красное/Белое)', de: 'Wein (Rot/Weiß)', fr: 'Vin (Rouge/Blanc)' },
  'Enerji İçeceği': { en: 'Energy Drink', ar: 'مشروب طاقة', ru: 'Энергетический напиток', de: 'Energy-Drink', fr: 'Boisson énergisante' },
  // Safe
  'Kasa Açılmıyor': { en: 'Safe Will Not Open', ar: 'الخزنة لا تفتح', ru: 'Сейф не открывается', de: 'Safe lässt sich nicht öffnen', fr: 'Le coffre-fort ne s’ouvre pas' },
  'Şifremi Unuttum': { en: 'Forgot Passcode', ar: 'نسيت الرقم السري', ru: 'Забыл пароль', de: 'Code vergessen', fr: 'Code oublié' },
  'Kasa Arızalı': { en: 'Safe Malfunction', ar: 'عطل في الخزنة', ru: 'Неисправность сейфа', de: 'Safe defekt', fr: 'Coffre-fort défectueux' },
  'Güvenlik Endişesi': { en: 'Security Concern', ar: 'مخاوف أمنية', ru: 'Вопрос безопасности', de: 'Sicherheitsbedenken', fr: 'Préoccupation de sécurité' },
  // Technical
  'Klima': { en: 'Air Conditioning', ar: 'التكييف', ru: 'Кондиционер', de: 'Klimaanlage', fr: 'Climatisation' },
  'Televizyon': { en: 'Television', ar: 'التلفزيون', ru: 'Телевизор', de: 'Fernseher', fr: 'Télévision' },
  'Elektrik / Priz': { en: 'Electricity / Outlet', ar: 'الكهرباء / المقبس', ru: 'Электричество / Розетка', de: 'Strom / Steckdose', fr: 'Électricité / Prise' },
  'Su Tesisatı': { en: 'Plumbing / Water', ar: 'السباكة / المياه', ru: 'Сантехника / Вода', de: 'Sanitär / Wasser', fr: 'Plomberie / Eau' },
  'WiFi / İnternet': { en: 'Wi-Fi / Internet', ar: 'واي فاي / الإنترنت', ru: 'Wi-Fi / Интернет', de: 'WLAN / Internet', fr: 'Wi-Fi / Internet' },
  'Aydınlatma': { en: 'Lighting', ar: 'الإضاءة', ru: 'Освещение', de: 'Beleuchtung', fr: 'Éclairage' },
  // Laundry
  'Express (4-6 Saat)': { en: 'Express (4-6 Hours)', ar: 'سريع (4-6 ساعات)', ru: 'Экспресс (4-6 часов)', de: 'Express (4-6 Stunden)', fr: 'Express (4-6 heures)' },
  'Standart (24 Saat)': { en: 'Standard (24 Hours)', ar: 'قياسي (24 ساعة)', ru: 'Стандарт (24 часа)', de: 'Standard (24 Stunden)', fr: 'Standard (24 heures)' },
  'Kuru Temizleme': { en: 'Dry Cleaning', ar: 'تنظيف جاف', ru: 'Химчистка', de: 'Chemische Reinigung', fr: 'Nettoyage à sec' },
  'Gömlek': { en: 'Shirt', ar: 'قميص', ru: 'Рубашка', de: 'Hemd', fr: 'Chemise' },
  'Pantolon': { en: 'Trousers / Pants', ar: 'بنطلون', ru: 'Брюки', de: 'Hose', fr: 'Pantalon' },
  'Elbise': { en: 'Dress', ar: 'فستان', ru: 'Платье', de: 'Kleid', fr: 'Robe' },
  'Takım Elbise': { en: 'Suit', ar: 'بدلة', ru: 'Костюм', de: 'Anzug', fr: 'Costume' },
  'Ceket': { en: 'Jacket', ar: 'سترة / جاكيت', ru: 'Пиджак / Куртка', de: 'Jacke / Sakko', fr: 'Veste' },
  'Leke Var': { en: 'Has Stain', ar: 'يوجد بقعة', ru: 'Есть пятно', de: 'Fleck vorhanden', fr: 'Présence de tache' },
  'Hasar Var': { en: 'Has Damage', ar: 'يوجد تلف', ru: 'Есть повреждение', de: 'Beschädigung vorhanden', fr: 'Présence de dommage' },
  // Late Checkout
  '18:00 (Gün Sonu)': { en: '18:00 (End of Day)', ar: '18:00 (نهاية اليوم)', ru: '18:00 (Конец дня)', de: '18:00 (Tagesende)', fr: '18:00 (Fin de journée)' },
  // Extend Stay
  '1 Gece': { en: '1 Night', ar: 'ليلة واحدة', ru: '1 ночь', de: '1 Nacht', fr: '1 nuit' },
  '2 Gece': { en: '2 Nights', ar: 'ليلتان', ru: '2 ночи', de: '2 Nächte', fr: '2 nuits' },
  '3 Gece': { en: '3 Nights', ar: '3 ليالٍ', ru: '3 ночи', de: '3 Nächte', fr: '3 nuits' },
  '1 Hafta': { en: '1 Week', ar: 'أسبوع واحد', ru: '1 неделя', de: '1 Woche', fr: '1 semaine' },
  'Aynı Odada Kalmak İstiyorum': { en: 'Stay in the Same Room', ar: 'أرغب بالبقاء في نفس الغرفة', ru: 'Остаться в том же номере', de: 'Im selben Zimmer bleiben', fr: 'Rester dans la même chambre' },
  'Farklı Odaya Geçebilirim': { en: 'Open to Room Change', ar: 'يمكنني الانتقال إلى غرفة أخرى', ru: 'Готов переехать в другой номер', de: 'Zimmerwechsel möglich', fr: 'Changement de chambre possible' },
  // Taxi
  'Standart Sarı Taksi': { en: 'Standard Yellow Taxi', ar: 'تاكسي أصفر قياسي', ru: 'Стандартное желтое такси', de: 'Standard Gelbes Taxi', fr: 'Taxi jaune standard' },
  'VIP Transfer (Binek)': { en: 'VIP Sedan Transfer', ar: 'نقل VIP خاص (سيدان)', ru: 'VIP-трансфер (седан)', de: 'VIP-Limousinentransfer', fr: 'Transfert Berline VIP' },
  'Minivan (Grup)': { en: 'VIP Minivan (Group)', ar: 'ميني فان (للمجموعات)', ru: 'Минивэн (групповой)', de: 'Minivan (Gruppe)', fr: 'Minivan VIP (Groupe)' },
  '15 Dakika Sonra': { en: 'In 15 Minutes', ar: 'بعد 15 دقيقة', ru: 'Через 15 минут', de: 'In 15 Minuten', fr: 'Dans 15 minutes' },
  '30 Dakika Sonra': { en: 'In 30 Minutes', ar: 'بعد 30 دقيقة', ru: 'Через 30 минут', de: 'In 30 Minuten', fr: 'Dans 30 minutes' },
  'Planlı Saat': { en: 'Scheduled Time', ar: 'وقت مجدول', ru: 'Запланированное время', de: 'Geplante Uhrzeit', fr: 'Heure programmée' },
};

const PLACEHOLDER_I18N: Record<string, Partial<Record<Language, string>>> = {
  'Örn: laktozsuz süt, bal yerine reçel...': {
    en: 'E.g. lactose-free milk, jam instead of honey...',
    ar: 'مثال: حليب خالٍ من اللاكتوز، مربى بدلاً من العسل...',
    ru: 'Напр.: безлактозное молоко, джем вместо меда...',
    de: 'Z.B. laktosefreie Milch, Marmelade statt Honig...',
    fr: 'Ex. : lait sans lactose, confiture au lieu du miel...',
  },
  'Varsa bilinen alerjilerinizi belirtin': {
    en: 'Please specify any known allergies',
    ar: 'يرجى ذكر أي حساسية معروفة إن وجدت',
    ru: 'Укажите известные аллергии, если есть',
    de: 'Bitte geben Sie bekannte Allergien an',
    fr: 'Veuillez indiquer vos allergies connues',
  },
  'Örn: Atatürk Havalimanı, Sultanahmet Meydanı': {
    en: 'E.g. Istanbul Airport, Sultanahmet Square',
    ar: 'مثال: مطار إسطنبول، ساحة السلطان أحمد',
    ru: 'Напр.: Аэропорт Стамбул, площадь Султанахмет',
    de: 'Z.B. Flughafen Istanbul, Sultanahmet-Platz',
    fr: 'Ex. : Aéroport d’Istanbul, Place Sultanahmet',
  },
};

export function translateServiceFieldLabel(label: string, lang: Language = 'tr'): string {
  if (lang === 'tr') return label;
  return FIELD_LABEL_I18N[label]?.[lang] || label;
}

export function translateServiceOption(opt: string, lang: Language = 'tr'): string {
  if (lang === 'tr') return opt;
  return OPTION_I18N[opt]?.[lang] || opt;
}

function translatePlaceholder(placeholder: string | undefined, lang: Language = 'tr'): string | undefined {
  if (!placeholder || lang === 'tr') return placeholder;
  return PLACEHOLDER_I18N[placeholder]?.[lang] || placeholder;
}

function translateComputedDisplay(raw: string, lang: Language = 'tr'): string {
  if (lang === 'tr' || !raw) return raw;
  const map: Record<string, Record<Exclude<Language, 'tr'>, string>> = {
    '~10 dakika içinde': { en: 'Within ~10 mins', ar: 'خلال ~10 دقائق', ru: 'В течение ~10 мин', de: 'Innerhalb von ~10 Min.', fr: 'Sous ~10 min' },
    '~30-45 dakika içinde': { en: 'Within ~30-45 mins', ar: 'خلال ~30-45 دقيقة', ru: 'В течение ~30-45 мин', de: 'Innerhalb von ~30-45 Min.', fr: 'Sous ~30-45 min' },
    '~15 dakika içinde': { en: 'Within ~15 mins', ar: 'خلال ~15 دقيقة', ru: 'В течение ~15 мин', de: 'Innerhalb von ~15 Min.', fr: 'Sous ~15 min' },
    '~1 saat içinde': { en: 'Within ~1 hour', ar: 'خلال ~1 ساعة', ru: 'В течение ~1 часа', de: 'Innerhalb von ~1 Std.', fr: 'Sous ~1 heure' },
    'Ücretsiz (Standart Hizmet Kapsamında)': {
      en: 'Complimentary (Standard Service)',
      ar: 'مجاني (ضمن الخدمة القياسية)',
      ru: 'Бесплатно (входит в стандартное обслуживание)',
      de: 'Kostenlos (im Standardservice enthalten)',
      fr: 'Gratuit (Service standard inclus)',
    },
    "14:00'e kadar ücretsiz, sonrası oda ücretinin %25'i yansıtılır (Onaya tabidir).": {
      en: 'Complimentary until 14:00; 25% of room rate applies afterwards (Subject to approval).',
      ar: 'مجاناً حتى الساعة 14:00؛ يتم احتساب 25% من سعر الغرفة بعد ذلك (خاضع للموافقة).',
      ru: 'Бесплатно до 14:00, далее 25% от стоимости номера (требуется подтверждение).',
      de: 'Kostenlos bis 14:00 Uhr, danach 25% des Zimmerpreises (vorbehaltlich Bestätigung).',
      fr: 'Gratuit jusqu’à 14h00 ; 25% du tarif de la chambre au-delà (Sous réserve d’approbation).',
    },
    'Talep onaylandığında atanacak': {
      en: 'Assigned upon confirmation',
      ar: 'سيتم التعيين عند تأكيد الطلب',
      ru: 'Назначается после подтверждения',
      de: 'Wird nach Bestätigung zugewiesen',
      fr: 'Attribué après confirmation',
    },
    'Sürücü atandığında aktif olacak': {
      en: 'Active once driver is assigned',
      ar: 'سيتم التفعيل عند تعيين السائق',
      ru: 'Активно после назначения водителя',
      de: 'Aktiv sobald Fahrer zugewiesen ist',
      fr: 'Actif dès l’attribution du chauffeur',
    },
  };
  if (map[raw]?.[lang]) return map[raw][lang];

  const estLabel: Record<Exclude<Language, 'tr'>, string> = {
    en: 'Estimated',
    ar: 'تقديري',
    ru: 'Ориентировочно',
    de: 'Geschätzt',
    fr: 'Estimé',
  };
  const routeLabel: Record<Exclude<Language, 'tr'>, string> = {
    en: 'Est. by Route',
    ar: 'تقديري حسب المسار',
    ru: 'По маршруту',
    de: 'Je nach Route',
    fr: 'Estimé selon trajet',
  };
  const nightLabel: Record<Exclude<Language, 'tr'>, string> = {
    en: 'nights',
    ar: 'ليالٍ',
    ru: 'ноч.',
    de: 'Nächte',
    fr: 'nuits',
  };

  let out = raw;
  out = out.replace('(Tahmini)', `(${estLabel[lang]})`);
  out = out.replace('(Güzergaha Göre Tahmini)', `(${routeLabel[lang]})`);
  out = out.replace(/\(Tahmini,\s*(\d+)\s*gece\)/g, `(${estLabel[lang]}, $1 ${nightLabel[lang]})`);
  return out;
}

function FieldInput({ field, options, value, onChange, lang = 'tr' }: { field: ServiceField; options: string[]; value: any; onChange: (v: any) => void; lang?: Language }) {
  const baseClass = "w-full font-luxury-sans text-xs p-2.5 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] text-[#141414] placeholder:text-[#78716C] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40";

  switch (field.type) {
    case 'select':
      return (
        <select className={baseClass} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt) => (
            <option key={opt} value={opt}>{translateServiceOption(opt, lang)}</option>
          ))}
        </select>
      );

    case 'multiselect':
      return (
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt) => {
            const selected: string[] = Array.isArray(value) ? value : [];
            const active = selected.includes(opt);
            return (
              <button
                type="button"
                key={opt}
                onClick={() => {
                  const next = active ? selected.filter((s) => s !== opt) : [...selected, opt];
                  onChange(next);
                }}
                className={`font-luxury-sans px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                  active
                    ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] border-[#7D5E2A] text-white shadow-2xs'
                    : 'bg-[#FAF8F4] border-[#C4B8A4] text-[#221F1C] hover:bg-[#EFE8DA]'
                }`}
              >
                {translateServiceOption(opt, lang)}
              </button>
            );
          })}
        </div>
      );

    case 'number':
      return (
        <input
          type="number"
          className={baseClass}
          min={field.min}
          max={field.max}
          value={value ?? field.min ?? 1}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      );

    case 'time':
      return (
        <input type="time" className={baseClass} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      );

    case 'text':
      return (
        <input
          type="text"
          className={baseClass}
          placeholder={translatePlaceholder(field.placeholder, lang)}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'textarea':
      return (
        <textarea
          className={`${baseClass} h-20`}
          placeholder={translatePlaceholder(field.placeholder, lang)}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'toggle': {
      const [rawOn, rawOff] = field.toggleLabels ?? ['Evet', 'Hayır'];
      const onLabel = translateServiceOption(rawOn, lang);
      const offLabel = translateServiceOption(rawOff, lang);
      const isOn = !!value;
      const isAlert = field.key === 'urgentHelp';
      return (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`font-luxury-sans flex-1 py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
              isOn
                ? isAlert ? 'bg-[#1D2025] border-[#8E7252] text-white' : 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] border-[#7D5E2A] text-white'
                : 'bg-[#FAF8F4] border-[#C4B8A4] text-[#5C4938]'
            }`}
          >
            {onLabel}
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`font-luxury-sans flex-1 py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
              !isOn ? 'bg-[#1D2025] border-[#1D2025] text-white' : 'bg-[#FAF8F4] border-[#C4B8A4] text-[#5C4938]'
            }`}
          >
            {offLabel}
          </button>
        </div>
      );
    }

    default:
      return null;
  }
}

export function ServiceRequestForm({ config, onSubmit, onCancel, isSubmitting, pricing = {}, fieldOptionOverrides, lang = 'tr' }: ServiceRequestFormProps) {
  const ui = FORM_UI_I18N[lang] || FORM_UI_I18N.en;
  const [details, setDetails] = useState<Record<string, any>>(() => {
    const init = buildInitialDetails(config);
    if (init.pickup === 'Otel Girişi' && lang !== 'tr') {
      init.pickup = ui.hotelEntrance;
    }
    return init;
  });

  const setField = (key: string, value: any) => setDetails((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-3 font-luxury-sans">
      {config.fields.map((field) => {
        if (field.type === 'display') {
          const rawDisplay = field.compute ? field.compute(details, pricing) : '—';
          return (
            <div key={field.key} className="bg-[#FAF8F4]/90 p-3 rounded-xl border border-[#C4B8A4] flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#3D352E]">{translateServiceFieldLabel(field.label, lang)}</span>
              <span className="font-luxury-serif text-sm font-bold text-[#7D5E2A] text-right">{translateComputedDisplay(rawDisplay, lang)}</span>
            </div>
          );
        }

        const isUrgentAlert = field.key === 'urgentHelp' && !!details[field.key];
        const options = resolveFieldOptions(field, fieldOptionOverrides);

        return (
          <div key={field.key} className="space-y-1">
            <label className="text-[11px] font-bold text-[#141414] flex items-center gap-1">
              {translateServiceFieldLabel(field.label, lang)}
              {field.optional && <span className="text-[#6B5A48] font-normal">{ui.optional}</span>}
              {isUrgentAlert && <AlertTriangle className="w-3.5 h-3.5 text-[#8E7252]" />}
            </label>
            <FieldInput field={field} options={options} value={details[field.key]} onChange={(v) => setField(field.key, v)} lang={lang} />
          </div>
        );
      })}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-xs font-bold text-[#141414] transition cursor-pointer"
        >
          {ui.cancel}
        </button>
        <button
          type="button"
          onClick={() => onSubmit(details)}
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white text-xs font-bold shadow-sm transition cursor-pointer"
        >
          {isSubmitting ? ui.submitting : ui.submit}
        </button>
      </div>
    </div>
  );
}

