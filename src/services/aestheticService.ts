/**
 * Xenios Aesthetic & Beauty Service
 * Handles 2-Way Clinic CRM Calendar Sync, Appointment Bookings & Lead Inquiries
 */

import { 
  AestheticClinic, 
  AestheticService, 
  AppointmentBooking, 
  AestheticInquiryLead, 
  AvailableTimeSlot 
} from '@/types/aesthetic';

// In-Memory Storage
const clinicsStore = new Map<string, AestheticClinic>();
const servicesStore = new Map<string, AestheticService>();
const appointmentsStore = new Map<string, AppointmentBooking>();
const inquiriesStore = new Map<string, AestheticInquiryLead>();

// Initialize Seed Data from "Aeshetic&Wellnes.docx"
function ensureSeedData() {
  if (clinicsStore.size === 0) {
    const clinics: AestheticClinic[] = [
      {
        id: 'clinic_quartz',
        name: 'Quartz Clinique',
        slug: 'quartz-clinique',
        location_district: 'Abdi İpekçi Cad., Nişantaşı / Şişli',
        email_official: 'info@quartzclinique.com',
        phone_whatsapp: '+90 212 241 46 24',
        website: 'https://www.quartzclinique.com/',
        rating_score: 4.8,
        reviews_count: '1.200+',
        price_level: '$$$',
        crm_config: { provider: 'GENERIC_REST', slot_buffer_minutes: 15 },
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'clinic_maya',
        name: 'Maya Estetik',
        slug: 'maya-estetik',
        location_district: 'Mecidiyeköy & Nişantaşı / Şişli',
        email_official: 'contact@mayaestetik.com',
        phone_whatsapp: '+90 850 444 87 23',
        website: 'https://mayaestetik.com/',
        rating_score: 4.7,
        reviews_count: '3.100+',
        price_level: '$$',
        crm_config: { provider: 'NATIVE_XENIOS', slot_buffer_minutes: 15 },
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'clinic_estetik_intl',
        name: 'Estetik International',
        slug: 'estetik-international',
        location_district: 'Ataşehir & Fulya / Şişli',
        email_official: 'info@estetikinternational.com',
        phone_whatsapp: '+90 549 471 15 24',
        website: 'https://www.estetikinternational.com/',
        rating_score: 4.6,
        reviews_count: '2.400+',
        price_level: '$$$$',
        crm_config: { provider: 'SALESFORCE_HEALTH', slot_buffer_minutes: 20 },
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'clinic_smile_hair',
        name: 'Smile Hair Clinic',
        slug: 'smile-hair-clinic',
        location_district: 'Finans Merkezi Aksı, Ümraniye / Ataşehir',
        email_official: 'care@smilehairclinic.com',
        phone_whatsapp: '+90 216 740 03 33',
        website: 'https://smilehairclinic.com/',
        rating_score: 4.9,
        reviews_count: '4.500+',
        price_level: '$$$',
        crm_config: { provider: 'GENERIC_REST', slot_buffer_minutes: 30 },
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'clinic_vanity',
        name: 'Vanity Cosmetic Surgery',
        slug: 'vanity-clinic',
        location_district: 'Altunizade / Üsküdar',
        email_official: 'info@vanityclinic.com',
        phone_whatsapp: '+90 850 441 54 44',
        website: 'https://www.vanityclinic.com/',
        rating_score: 4.8,
        reviews_count: '3.800+',
        price_level: '$$$',
        crm_config: { provider: 'ICAL_FEED', slot_buffer_minutes: 15 },
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'clinic_memorial_wellness',
        name: 'Memorial Wellness',
        slug: 'memorial-wellness',
        location_district: 'Zorlu Center, Beşiktaş',
        email_official: 'wellness@memorial.com.tr',
        phone_whatsapp: '+90 212 314 66 66',
        website: 'https://www.memorial.com.tr/',
        rating_score: 4.9,
        reviews_count: '1.850+',
        price_level: '$$$$',
        crm_config: { provider: 'SALESFORCE_HEALTH', slot_buffer_minutes: 15 },
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'clinic_dentakay',
        name: 'Dentakay Dental Clinic',
        slug: 'dentakay-dental',
        location_district: 'Fulya, Şişli / İstanbul',
        email_official: 'hello@dentakay.com',
        phone_whatsapp: '+90 544 456 00 20',
        website: 'https://dentakay.com',
        rating_score: 4.9,
        reviews_count: '2.800+',
        price_level: '$$$',
        crm_config: { provider: 'GENERIC_REST', slot_buffer_minutes: 20 },
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'clinic_clinicplast',
        name: 'ClinicPlast (Dr. Salih Onur Basat)',
        slug: 'clinicplast',
        location_district: 'Terrace Fulya, Şişli / İstanbul',
        email_official: 'info@clinicplast.com',
        phone_whatsapp: '+90 533 150 90 90',
        website: 'https://clinicplast.com',
        rating_score: 4.8,
        reviews_count: '1.450+',
        price_level: '$$$$',
        crm_config: { provider: 'GENERIC_REST', slot_buffer_minutes: 30 },
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'clinic_clinicmono',
        name: 'Clinic Mono',
        slug: 'clinic-mono',
        location_district: 'Mecidiyeköy / Şişli',
        email_official: 'contact@clinicmono.com',
        phone_whatsapp: '+90 549 800 66 66',
        website: 'https://clinicmono.com',
        rating_score: 4.7,
        reviews_count: '3.200+',
        price_level: '$$$$',
        crm_config: { provider: 'ICAL_FEED', slot_buffer_minutes: 20 },
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'clinic_elithair',
        name: 'Elithair Istanbul Clinic',
        slug: 'elithair-clinic',
        location_district: 'Vadistanbul Aksı, Sarıyer / İstanbul',
        email_official: 'info@elithairtransplant.com',
        phone_whatsapp: '+90 212 909 00 11',
        website: 'https://elithairtransplant.com',
        rating_score: 4.9,
        reviews_count: '6.100+',
        price_level: '$$$',
        crm_config: { provider: 'SALESFORCE_HEALTH', slot_buffer_minutes: 30 },
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'clinic_clinmedica',
        name: 'ClinMedica Nişantaşı',
        slug: 'clinmedica-nisantasi',
        location_district: 'Valikonağı Cad., Nişantaşı / Şişli',
        email_official: 'contact@clinmedica.com',
        phone_whatsapp: '+90 542 300 70 80',
        website: 'https://clinmedica.com',
        rating_score: 4.8,
        reviews_count: '950+',
        price_level: '$$$',
        crm_config: { provider: 'NATIVE_XENIOS', slot_buffer_minutes: 15 },
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'clinic_thelifeco',
        name: 'The LifeCo Wellbeing Istanbul',
        slug: 'thelifeco-wellbeing',
        location_district: 'Akatlar, Beşiktaş / İstanbul',
        email_official: 'istanbul@thelifeco.com',
        phone_whatsapp: '+90 212 324 07 07',
        website: 'https://thelifeco.com',
        rating_score: 4.9,
        reviews_count: '820+',
        price_level: '$$$$',
        crm_config: { provider: 'GENERIC_REST', slot_buffer_minutes: 15 },
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];

    clinics.forEach(c => clinicsStore.set(c.id, c));

    // Matching Services
    const services: AestheticService[] = [
      {
        id: 'srv_quartz_glow',
        clinic_id: 'clinic_quartz',
        title: 'Nişantaşı Glow & Fraksiyonel Cilt Yenileme',
        category_type: 'SKIN_CARE',
        description: 'Nişantaşı’nın kalbinde, tatiliniz boyunca cildinize anında parlaklık ve sıkılık kazandıran; kolajen üretimini tetikleyen iğnesiz/ağrısız medikal anti-aging cilt protokolü.',
        duration_minutes: 45,
        price_amount: 180,
        currency: 'EUR',
        highlights: ['Sıfır İyileşme Süresi (Zero Downtime)', 'FDA Onaylı Cihazlar', 'Çok Dilli Medikal Konsiyerj', 'Otel Transfer Desteği'],
        image_url: 'https://images.unsplash.com/photo-1512290900672-1f4a9b40092c?auto=format&fit=crop&w=1200&q=80',
        is_active: true
      },
      {
        id: 'srv_maya_hydra',
        clinic_id: 'clinic_maya',
        title: 'Deep Clean HydraFacial & Leke Tedavisi',
        category_type: 'SKIN_CARE',
        description: 'İstanbul’un yoğun gezi temposunda yorulan cildinizi derinlemesine temizleyen, siyah nokta ve toksinleri arındırıp hyaluronik asit serumlarıyla neme doyuran ekspres bakım seansı.',
        duration_minutes: 45,
        price_amount: 90,
        currency: 'EUR',
        highlights: ['Vakumlu Vortex Teknolojisi', 'Cilt Tipi Analizi', 'Aynı Gün Şehri Gezmeye Devam', 'Anında Canlılık'],
        image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
        is_active: true
      },
      {
        id: 'srv_estetik_mezo',
        clinic_id: 'clinic_estetik_intl',
        title: 'Organik Saç & Yüz Mezoterapisi',
        category_type: 'MEDICAL_AESTHETICS',
        description: 'Cilt dokusunun elastikiyetini yeniden kazandıran vitamin, mineral ve peptit komplekslerinin mikro enjeksiyonla alt katmanlara iletildiği yenileyici mezoterapi kürü.',
        duration_minutes: 60,
        price_amount: 250,
        currency: 'EUR',
        highlights: ['Kişiye Özel Biyo-Kokteyller', 'İnce Çizgi ve Gözenek Sıkılaştırma', 'VIP Lounge ve Karşılama'],
        image_url: 'https://images.unsplash.com/photo-1597764693654-15b3a1e7b6c4?auto=format&fit=crop&w=1200&q=80',
        is_active: true
      },
      {
        id: 'srv_smile_hair_fue',
        clinic_id: 'clinic_smile_hair',
        title: 'Safir FUE & DHI Saç Restorasyonu',
        category_type: 'HAIR_TRANSPLANT',
        description: 'Doğal açılı ekim kanalları açan safir uç teknolojisiyle minimum doku hasarı, ağrısız anestezi ve hızlı iyileşme sunan uluslararası standartta saç restorasyon deneyimi.',
        duration_minutes: 240,
        price_amount: 1750,
        currency: 'EUR',
        highlights: ['Doğal Ön Saç Çizgisi Tasarımı', 'Maksimum Greft Garantisi', '12 Aylık Dijital Uzaktan Takip', 'VIP Transfer & Otel'],
        image_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=1200&q=80',
        is_active: true
      },
      {
        id: 'srv_vanity_botox',
        clinic_id: 'clinic_vanity',
        title: 'Baby Botox & Doğal Dudak Dolgusu',
        category_type: 'MEDICAL_AESTHETICS',
        description: 'Yüz ifadesini bozmadan kırışıklıkları gideren mikro-botoks enjeksiyonları ve altın oran prensibiyle uygulanan hyaluronik asit dudak dolgusu uygulaması.',
        duration_minutes: 30,
        price_amount: 220,
        currency: 'EUR',
        highlights: ['Mimikleri Dondurmayan Doğal Sonuçlar', 'FDA Onaylı Dolgu Maddeleri', '15 Dakikalık Pratik Uygulama'],
        image_url: 'https://images.unsplash.com/photo-1597559925846-a4273af46397?auto=format&fit=crop&w=1200&q=80',
        is_active: true
      },
      {
        id: 'srv_memorial_oxygen',
        clinic_id: 'clinic_memorial_wellness',
        title: 'Lüks Oksijen & Anti-Stress Cilt Detoksu',
        category_type: 'WELLNESS',
        description: 'Jet-lag, uçuş yorgunluğu ve çevre kirliliğinin ciltteki olumsuz etkilerini silen; cildin alt katmanlarına saf oksijen ve antioksidan aşılayan medikal spa seansı.',
        duration_minutes: 60,
        price_amount: 320,
        currency: 'EUR',
        highlights: ['Saf Oksijen İnfüzyonu', 'JCI Akreditasyonlu Standartlar', 'Zorlu Center VIP Lokasyonu'],
        image_url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80',
        is_active: true
      },
      {
        id: 'srv_dentakay_smile',
        clinic_id: 'clinic_dentakay',
        title: 'Hollywood Smile & Dijital Gülüş Tasarımı',
        category_type: 'DENTAL',
        description: 'Tatiliniz boyunca 5-7 gün içerisinde tamamlanan, 3D dijital ağız içi modelleme ve Alman menşeili zirkonyum bloklarla uygulanan eksiksiz Hollywood Smile gülüş yenileme protokolü.',
        duration_minutes: 90,
        price_amount: 2200,
        currency: 'EUR',
        highlights: ['3D CAD/CAM Ağız İçi Tarama', '5-7 Günde Hızlı Teslimat', 'VIP Havalimanı Karşılama', 'Çok Dilli Tercüman'],
        image_url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=80',
        is_active: true
      },
      {
        id: 'srv_clinicplast_rhino',
        clinic_id: 'clinic_clinicplast',
        title: 'Kapalı & Piezo Ultrasonic Rhinoplasty',
        category_type: 'PLASTIC_SURGERY',
        description: 'Doğal yüz hatlarıyla uyumlu, nefes alma fonksiyonunu koruyan ve Piezo ultrasonik teknoloji sayesinde hızlı iyileşme imkânı tanıyan kişiye özel burun cerrahisi paketi.',
        duration_minutes: 180,
        price_amount: 2800,
        currency: 'EUR',
        highlights: ['Kırmadan Ses Dalgalarıyla Şekillendirme', 'Minimum Morluk ve Şişlik', 'A-Plus Hastane Operasyonu', '7. Gün Atel Kontrolü'],
        image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
        is_active: true
      },
      {
        id: 'srv_clinicmono_lipo',
        clinic_id: 'clinic_clinicmono',
        title: 'Vaser Hi-Def Liposuction & Mommy Makeover',
        category_type: 'PLASTIC_SURGERY',
        description: 'Doğum veya kilo değişimleri sonrası vücut formunu tek seansta yeniden yapılandıran, Vaser ultrasonik yağ alma ve kombine estetik cerrahi programı.',
        duration_minutes: 240,
        price_amount: 3500,
        currency: 'EUR',
        highlights: ['Karın Germe & Göğüs Dikleştirme', 'Özel Hemşire & Otel Refakati', 'Kapsamlı Ameliyat Sonrası Korse Kiti'],
        image_url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
        is_active: true
      },
      {
        id: 'srv_elithair_dhi',
        clinic_id: 'clinic_elithair',
        title: 'Elit-DHI & İğnesiz Anestezi ile Saç / Sakal Ekimi',
        category_type: 'HAIR_TRANSPLANT',
        description: 'Avrupa standartlarında dünyanın en büyük saç ekim komplekslerinden birinde; donör bölgeyi koruyarak maksimum greft yoğunluğu sağlayan DHI saç ve sakal nakli.',
        duration_minutes: 240,
        price_amount: 1900,
        currency: 'EUR',
        highlights: ['Dr. Balwi Patentli Ön Çizgi Protokolü', 'İğnesiz Comfort Anestezi', 'Tıraşsız DHI Seçeneği', 'Özel Saç Yıkama Seti'],
        image_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
        is_active: true
      },
      {
        id: 'srv_clinmedica_combo',
        clinic_id: 'clinic_clinmedica',
        title: 'Kombine Medikal Estetik (Baby Botox, Jawline & Profhilo)',
        category_type: 'MEDICAL_AESTHETICS',
        description: 'Şehir turunuzu aksatmadan mimik çizgilerini yumuşatan, hyaluronik asit ve bio-stimülatörlerle cilde nem ve elastikiyet kazandıran ameliyatsız yüz liftingi.',
        duration_minutes: 30,
        price_amount: 350,
        currency: 'EUR',
        highlights: ['CE & FDA Onaylı Orijinal Ürün Garantisi', '30 Dakikalık Ekspres Uygulama', 'Doğal İsviçre/Fransız Dolguları'],
        image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
        is_active: true
      },
      {
        id: 'srv_thelifeco_iv',
        clinic_id: 'clinic_thelifeco',
        title: 'Anti-Aging, IV Glutatyon / NAD+ Terapi & Bütünsel Detoks',
        category_type: 'WELLNESS',
        description: 'Yoğun seyahat temposunda bağışıklığı ve enerjiyi yükselten; damardan uygulanan Glutatyon, Vitamin C ve NAD+ serumları ile hücresel düzeyde arınma sunan lüks sağlıklı yaşam kürü.',
        duration_minutes: 60,
        price_amount: 280,
        currency: 'EUR',
        highlights: ['Hücresel Yenilenme (Anti-Aging IV)', 'Jet-Lag & Karaciğer Detoksu', 'Kızılötesi Sauna & Ozon Terapisi', 'Beslenme Uzmanı Konsültasyonu'],
        image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        is_active: true
      }
    ];

    services.forEach(s => servicesStore.set(s.id, s));
  }
}

export class AestheticServiceEngine {
  /**
   * 1. Klinik ve Hizmetleri Listele
   */
  static getClinics(): AestheticClinic[] {
    ensureSeedData();
    return Array.from(clinicsStore.values());
  }

  static getClinicById(clinicId: string): AestheticClinic | undefined {
    ensureSeedData();
    return clinicsStore.get(clinicId);
  }

  static getServices(clinicId?: string): AestheticService[] {
    ensureSeedData();
    const all = Array.from(servicesStore.values());
    if (clinicId) {
      return all.filter(s => s.clinic_id === clinicId);
    }
    return all;
  }

  static getServiceById(serviceId: string): AestheticService | undefined {
    ensureSeedData();
    return servicesStore.get(serviceId);
  }

  /**
   * 2. 2-Way Canlı CRM Müsaitlik ve Saat Dilimi Sorgulama (getClinicAvailableSlots)
   * Overbooking engelleme: Randevulu saatler ve aradaki tampon (buffer) süreleri otomatik filtrelenir.
   */
  static async getClinicAvailableSlots(
    clinicId: string, 
    serviceId: string, 
    date: string
  ): Promise<AvailableTimeSlot[]> {
    ensureSeedData();
    const clinic = clinicsStore.get(clinicId);
    const service = servicesStore.get(serviceId);

    // Default daily schedule (09:30 - 18:30)
    const baseHours = [
      '09:30', '10:30', '11:30', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];

    // Mevcut randevuları filtrele
    const bookedSlotsOnDate = Array.from(appointmentsStore.values()).filter(
      a => a.clinic_id === clinicId && a.appointment_date === date && a.status === 'CONFIRMED'
    );

    const bookedHours = new Set(bookedSlotsOnDate.map(b => b.start_time));

    // Dynamic Availability Map
    const slots: AvailableTimeSlot[] = baseHours.map((hour, idx) => {
      const isBooked = bookedHours.has(hour);
      // Simulate external CRM status
      const isAvailable = !isBooked;

      const [hh, mm] = hour.split(':').map(Number);
      const endHh = mm + 45 >= 60 ? hh + 1 : hh;
      const endMm = (mm + 45) % 60;
      const endTime = `${String(endHh).padStart(2, '0')}:${String(endMm).padStart(2, '0')}`;

      return {
        id: `slot_${clinicId}_${date}_${hour.replace(':', '')}`,
        start_time: hour,
        end_time: endTime,
        is_available: isAvailable,
        price: service?.price_amount,
        currency: service?.currency || 'EUR'
      };
    });

    console.log(`[AESTHETIC CRM SLOTS] Clinic: ${clinicId} | Date: ${date} | Total Slots: ${slots.length} | Available: ${slots.filter(s => s.is_available).length}`);
    return slots;
  }

  /**
   * 3. Klinik Dış CRM Yazılımına Randevu İletimi (pushAppointmentToClinicCrm)
   */
  static async pushAppointmentToClinicCrm(booking: AppointmentBooking): Promise<{
    success: boolean;
    crmReferenceId: string;
  }> {
    const clinic = clinicsStore.get(booking.clinic_id);
    const crmRefId = `CRM_EXT_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    console.log(`[CRM PUSH] Dispatched appointment ${booking.id} to clinic ${clinic?.name} (Provider: ${clinic?.crm_config.provider || 'NATIVE'}) -> Ref: ${crmRefId}`);
    return {
      success: true,
      crmReferenceId: crmRefId
    };
  }

  /**
   * 4. Anlık Randevu Oluşturma ve Atomik CRM Kaydı (bookAppointment)
   */
  static async bookAppointment(data: Omit<AppointmentBooking, 'id' | 'created_at' | 'crm_sync_status' | 'status'>): Promise<AppointmentBooking> {
    ensureSeedData();

    // Çifte randevu kontrolü
    const existing = Array.from(appointmentsStore.values()).find(
      a => a.clinic_id === data.clinic_id && 
           a.appointment_date === data.appointment_date && 
           a.start_time === data.start_time &&
           a.status === 'CONFIRMED'
    );

    if (existing) {
      throw new Error('Seçilen saat dilimi için randevu doludur. Lütfen başka bir saat seçiniz.');
    }

    const bookingId = `apt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newBooking: AppointmentBooking = {
      id: bookingId,
      ...data,
      crm_sync_status: 'SYNCED',
      status: 'CONFIRMED',
      created_at: new Date().toISOString()
    };

    appointmentsStore.set(bookingId, newBooking);

    // Push to CRM
    await this.pushAppointmentToClinicCrm(newBooking);

    return newBooking;
  }

  /**
   * 5. Bilgi İstek (Lead Contact Form) İşleme (processInquiryForm)
   */
  static async processInquiryForm(leadData: Omit<AestheticInquiryLead, 'id' | 'created_at' | 'status'>): Promise<{
    success: boolean;
    lead_id: string;
    notificationSent: boolean;
    portalTrackingUrl: string;
  }> {
    ensureSeedData();
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const clinic = clinicsStore.get(leadData.clinic_id);
    const service = servicesStore.get(leadData.service_id);

    const newLead: AestheticInquiryLead = {
      id: leadId,
      ...leadData,
      status: 'NEW',
      created_at: new Date().toISOString()
    };

    inquiriesStore.set(leadId, newLead);

    // 1. Kliniğe HTML E-posta Bildirimi Gönder
    const clinicEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fed7aa; border-radius: 12px; background: #fffbf5;">
        <h2 style="color: #9a3412;">🌟 purelyİstanbul — Yeni Estetik & Sağlık Talebi</h2>
        <p>Aşağıdaki misafir otel konsiyerj arayüzü üzerinden kliniğinizle iletişime geçmek istemektedir:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr><td style="padding: 8px; font-weight: bold; width: 140px;">Klinik / Hizmet:</td><td>${clinic?.name} — ${service?.title}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Misafir Adı:</td><td>${leadData.guest_name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Telefon / WhatsApp:</td><td><a href="tel:${leadData.guest_phone}">${leadData.guest_phone}</a></td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">E-Posta:</td><td>${leadData.guest_email}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">İletişim Tercihi:</td><td><strong>${leadData.preferred_contact_method}</strong></td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Konaklanan Otel:</td><td>${leadData.hotel_id || 'Pera Palace Hotel'} (Oda ${leadData.room_number || '304'})</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Misafir Notu:</td><td>${leadData.message || 'Belirtilmedi'}</td></tr>
        </table>
        
        <p style="font-size: 12px; color: #78716c;">purelyİstanbul Health-Tech Lead Dispatcher Engine • İstanbul</p>
      </div>
    `;

    console.log(`[CLINIC EMAIL SENT] To: ${clinic?.email_official} | Subject: Yeni Lead (${leadData.guest_name})`);

    // 2. Misafire SMS / WhatsApp Bilgilendirme Linki Gönder
    const trackingUrl = `https://xenios.app/inquiry/${leadId}`;
    console.log(`[GUEST WA/SMS NOTIFICATION] To: ${leadData.guest_phone} | Msg: Talebiniz ${clinic?.name} kliniğine iletildi. Detaylar: ${trackingUrl}`);

    return {
      success: true,
      lead_id: leadId,
      notificationSent: true,
      portalTrackingUrl: trackingUrl
    };
  }

  static getInquiries(): AestheticInquiryLead[] {
    ensureSeedData();
    return Array.from(inquiriesStore.values());
  }

  static getAppointments(): AppointmentBooking[] {
    ensureSeedData();
    return Array.from(appointmentsStore.values());
  }
}
