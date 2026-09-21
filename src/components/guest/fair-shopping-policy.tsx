import json
import os

with open('src/components/guest/fair-shopping-policy.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's just create a new fair-shopping-policy.tsx content using a simpler approach
# Wait, rewriting the whole file in python might be tedious. Let me just create a new React component string with local translations.

new_content = """\"use client\";

import { useState } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Send, 
  Building2, 
  Car, 
  HelpCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Shield,
  ArrowRight,
  Landmark
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Language } from '@/lib/types';
import { getT } from '@/lib/i18n';

interface FairShoppingPolicyProps {
  lang?: Language;
}

const localDict = {
  tr: {
    officialIstanbulkartTitle: "Resmi İstanbulkart & Ulaşım",
    officialIstanbulkartDesc: "Metro, tramvay, vapur, Marmaray ve otobüslerde geçerli tek resmi toplu taşıma kartı. Biletmatik cihazlarından veya online temin edebilirsiniz.",
    officialIstanbulkartLink: "İstanbulkart Resmi Portalı",
    officialMuzekartTitle: "Resmi MüzeKart & Biletler",
    officialMuzekartDesc: "T.C. Kültür ve Turizm Bakanlığı'na bağlı 300'den fazla müze ve ören yerinde sıra beklemeden geçerli resmi giriş kartı.",
    officialMuzekartLink: "MüzeKart Satın Al / İncele",
    shieldTitle: "İstanbul'da Karşılaşılabilecek Yaygın Tuzaklar ve Yasal Haklarınız",
    problemLabel: "⚠️ Karşılaşılan Sorun:",
    riskLabel: "🛑 Olası Riskler:",
    actionLabel: "✅ Misafirin Yapması Gerekenler:",
    lawLabel: "📜 Türkiye'de Hukuk Nasıl İşler?:",
    emergencyContactsTitle: "Resmi Acil & Destek Hatları",
    emergencyCallCenter: "Acil Çağrı Merkezi",
    tourismPolice: "Turizm Polisi",
    ibbWhiteDesk: "İBB Beyaz Masa",
    zabıta: "Zabıta İhbar",
    badExperienceBadge: "Haksız, şüpheli alışveriş & kötü deneyim",
    policyMainTitle: "purelyİstanbul Misafir Kalkanı & Adil Alışveriş Politikası",
    policyMainDesc: "İstanbul'da her misafir adil, güvenilir ve şeffaf bir seyahat yaşamalıdır. purelyİstanbul haksız kazanç, fahiş fiyat ve kötü niyetli işletmelere karşı haklarınızı korur.",
    sorryTitle: "Yaşadığınız kötü deneyim için üzgünüz",
    sorryDesc: "Lütfen deneyiminizi ve fatura, fiş, taksi plakası veya konum gibi kanıtları sisteme yükleyin.",
    submitComplaintBtn: "Hemen Şikayet Aç →",
    howToComplainTitle: "Şikayet Nasıl Yapabilirsin?",
    proofType: "Kanıt Türü",
    whatIsIt: "Nedir?",
    example: "Örnek",
    proofReceipt: "Fatura / Fiş",
    proofReceiptDesc: "İşletmeden aldığın ödeme belgesi",
    proofReceiptEx: "Restoran fişi, tur makbuzu, ürün faturası",
    proofScreenshot: "Ekran Görüntüsü",
    proofScreenshotDesc: "Telefon, app veya web ekran görüntüsü",
    proofScreenshotEx: "Yanlış fiyat, ödeme onayı, mesajlaşma",
    proofLocation: "Konum Bilgisi",
    proofLocationDesc: "İşletmenin harita konumu veya adresi",
    proofLocationEx: "Google Maps linki, sokak adı",
    proofTaxi: "Taksi Plakası",
    proofTaxiDesc: "Taksi dolandırıcılığı yaşandıysa",
    proofTaxiEx: "Sarı plaka numarası (Örn: 34 TAA 01)",
    whatHappensNextTitle: "Şikayetiniz sonrası purelyİstanbul Ne Yapar? (7 Günlük İnceleme ve Yaptırım Akışı)",
    step1Title: "Adım 1: Araştırma (1-2 Gün)",
    step1Desc: "Kanıtların doğruluğu, piyasa rayiçleri ve olayın ciddiyeti incelenir.",
    step2Title: "Adım 2: İşletmeye Bildirim (Gün 2-3)",
    step2Desc: "İşletmeye resmi e-posta gönderilir: 'Bir hata mı yapıldı? Yanlış anlaşılma mı söz konusu?' İşletmeden makul bir açıklama yapması veya yaşanılan mağduriyeti telafi etmesi beklenir. Aksi durumda, işletmeyle ilgili şikayetiniz diğer turist misafirlerin dikkat etmesi için purelyİstanbul platformunda Uyarı Panosu'nda yayınlanır.",
    step3Title: "Adım 3: Kurumsal Bildirimler (Resmi Devlet Kurumları)",
    cimerTitle: "CİMER (Cumhurbaşkanlığı İletişim)",
    cimerDesc: "Turist dolandırıcılığı, sahte acenteler ve esnaf usulsüzlükleri Bakanlıklara sevk edilir.",
    tudesTitle: "İBB TUDES (Toplu Ulaşım Hizmetleri)",
    tudesDesc: "Taksi plakasıyla bildirilen fazla ücret ve taksimetre açmama şikayetleri doğrudan cezai işleme alınır.",
    faqTitle: "Sık Sorulan Sorular (SSS)"
  },
  en: {
    officialIstanbulkartTitle: "Official Istanbulkart & Transit",
    officialIstanbulkartDesc: "The only official public transit card valid on metros, trams, ferries, and buses. Obtain from machines or online.",
    officialIstanbulkartLink: "Istanbulkart Official Portal",
    officialMuzekartTitle: "Official MuseumPass & Tickets",
    officialMuzekartDesc: "Skip-the-line official entrance card valid in over 300 museums and historical sites under the Ministry of Culture and Tourism.",
    officialMuzekartLink: "Buy / View MuseumPass",
    shieldTitle: "Common Tourist Traps in Istanbul & Your Legal Rights",
    problemLabel: "⚠️ Encountered Problem:",
    riskLabel: "🛑 Potential Risks:",
    actionLabel: "✅ What Guests Should Do:",
    lawLabel: "📜 How the Law Works in Turkey:",
    emergencyContactsTitle: "Official Emergency & Support Lines",
    emergencyCallCenter: "Emergency Call Center",
    tourismPolice: "Tourism Police",
    ibbWhiteDesk: "Municipality Help Desk",
    zabıta: "Municipal Police (Zabıta)",
    badExperienceBadge: "Unfair, suspicious shopping & bad experience",
    policyMainTitle: "purelyIstanbul Guest Shield & Fair Shopping Policy",
    policyMainDesc: "Every guest in Istanbul deserves a fair, safe, and transparent travel experience. purelyIstanbul protects your rights against unfair charges, exorbitant prices, and malicious businesses.",
    sorryTitle: "We are sorry for your bad experience",
    sorryDesc: "Please upload your experience and evidence such as invoices, receipts, taxi plates, or locations to the system.",
    submitComplaintBtn: "Open a Complaint Now →",
    howToComplainTitle: "How to File a Complaint?",
    proofType: "Evidence Type",
    whatIsIt: "What is it?",
    example: "Example",
    proofReceipt: "Invoice / Receipt",
    proofReceiptDesc: "Payment document received from the business",
    proofReceiptEx: "Restaurant receipt, tour voucher, product invoice",
    proofScreenshot: "Screenshot",
    proofScreenshotDesc: "Phone, app, or web screenshot",
    proofScreenshotEx: "Incorrect price, payment confirmation, messaging",
    proofLocation: "Location Info",
    proofLocationDesc: "Map location or address of the business",
    proofLocationEx: "Google Maps link, street name",
    proofTaxi: "Taxi License Plate",
    proofTaxiDesc: "If a taxi scam occurred",
    proofTaxiEx: "Yellow plate number (e.g., 34 TAA 01)",
    whatHappensNextTitle: "What purelyIstanbul Does After Your Complaint? (7-Day Review and Sanction Workflow)",
    step1Title: "Step 1: Investigation (Days 1-2)",
    step1Desc: "The accuracy of evidence, market rates, and the severity of the incident are examined.",
    step2Title: "Step 2: Notification to Business (Days 2-3)",
    step2Desc: "An official email is sent to the business: 'Was a mistake made? Is there a misunderstanding?' The business is expected to provide a reasonable explanation or compensate for the grievance. Otherwise, your complaint about the business is published on the purelyIstanbul Warning Board for other tourist guests to be careful.",
    step3Title: "Step 3: Institutional Notifications (Official Government Agencies)",
    cimerTitle: "CIMER (Presidential Communication Center)",
    cimerDesc: "Tourist scams, fake agencies, and tradesmen irregularities are forwarded to the Ministries.",
    tudesTitle: "IBB TUDES (Public Transportation Services)",
    tudesDesc: "Overcharge and non-use of taximeter complaints reported with a taxi plate are directly subject to criminal action.",
    faqTitle: "Frequently Asked Questions (FAQ)"
  },
  ar: {
    officialIstanbulkartTitle: "بطاقة إسطنبول الرسمية والمواصلات",
    officialIstanbulkartDesc: "بطاقة النقل العام الرسمية الوحيدة الصالحة في المترو والترام والعبارات والحافلات. احصل عليها من الأجهزة أو عبر الإنترنت.",
    officialIstanbulkartLink: "بوابة بطاقة إسطنبول الرسمية",
    officialMuzekartTitle: "بطاقة وتذاكر المتاحف الرسمية",
    officialMuzekartDesc: "بطاقة دخول رسمية تتيح تخطي الطوابير، صالحة في أكثر من 300 متحف وموقع تاريخي تابع لوزارة الثقافة والسياحة.",
    officialMuzekartLink: "شراء / عرض بطاقة المتاحف",
    shieldTitle: "فخاخ السياح الشائعة في إسطنبول وحقوقك القانونية",
    problemLabel: "⚠️ المشكلة التي تمت مواجهتها:",
    riskLabel: "🛑 المخاطر المحتملة:",
    actionLabel: "✅ ما يجب على النزيل فعله:",
    lawLabel: "📜 كيف يعمل القانون في تركيا:",
    emergencyContactsTitle: "أرقام الطوارئ والدعم الرسمية",
    emergencyCallCenter: "مركز نداء الطوارئ",
    tourismPolice: "شرطة السياحة",
    ibbWhiteDesk: "مكتب مساعدة البلدية (الطاولة البيضاء)",
    zabıta: "شرطة البلدية (الضابطة)",
    badExperienceBadge: "تسوق غير عادل، مشبوه وتجربة سيئة",
    policyMainTitle: "درع زينيوس للنزلاء وسياسة التسوق العادل",
    policyMainDesc: "يستحق كل نزيل في إسطنبول تجربة سفر عادلة وآمنة وشفافة. يحمي purelyIstanbul حقوقك ضد الرسوم غير العادلة والأسعار الباهظة والشركات الخبيثة.",
    sorryTitle: "نأسف لتجربتك السيئة",
    sorryDesc: "يرجى تحميل تجربتك والأدلة مثل الفواتير أو الإيصالات أو لوحات سيارات الأجرة أو المواقع إلى النظام.",
    submitComplaintBtn: "افتح شكوى الآن ←",
    howToComplainTitle: "كيف ترفع شكوى؟",
    proofType: "نوع الدليل",
    whatIsIt: "ما هو؟",
    example: "مثال",
    proofReceipt: "فاتورة / إيصال",
    proofReceiptDesc: "مستند الدفع المستلم من الشركة",
    proofReceiptEx: "إيصال مطعم، قسيمة جولة، فاتورة منتج",
    proofScreenshot: "لقطة شاشة",
    proofScreenshotDesc: "لقطة شاشة للهاتف أو التطبيق أو الويب",
    proofScreenshotEx: "سعر غير صحيح، تأكيد الدفع، المراسلة",
    proofLocation: "معلومات الموقع",
    proofLocationDesc: "موقع الخريطة أو عنوان الشركة",
    proofLocationEx: "رابط خرائط جوجل، اسم الشارع",
    proofTaxi: "لوحة سيارة الأجرة",
    proofTaxiDesc: "في حال حدوث عملية احتيال لسيارة أجرة",
    proofTaxiEx: "رقم اللوحة الصفراء (مثل: 34 TAA 01)",
    whatHappensNextTitle: "ماذا يفعل purelyIstanbul بعد شكواك؟ (مراجعة لمدة 7 أيام وسير عمل العقوبات)",
    step1Title: "الخطوة 1: التحقيق (أيام 1-2)",
    step1Desc: "يتم فحص دقة الأدلة وأسعار السوق وخطورة الحادث.",
    step2Title: "الخطوة 2: الإخطار للشركة (أيام 2-3)",
    step2Desc: "يتم إرسال بريد إلكتروني رسمي إلى الشركة: 'هل تم ارتكاب خطأ؟ هل هناك سوء فهم؟' يُتوقع من الشركة تقديم تفسير معقول أو التعويض عن المظلمة. وبخلاف ذلك، يتم نشر شكواك حول الشركة على لوحة تحذير purelyIstanbul ليكون الضيوف السياحيون الآخرون حذرين.",
    step3Title: "الخطوة 3: الإخطارات المؤسسية (الوكالات الحكومية الرسمية)",
    cimerTitle: "CİMER (مركز الاتصال الرئاسي)",
    cimerDesc: "يتم تحويل عمليات الاحتيال السياحي والوكالات الوهمية ومخالفات التجار إلى الوزارات.",
    tudesTitle: "İBB TUDES (خدمات النقل العام)",
    tudesDesc: "تخضع الشكاوى المتعلقة بزيادة الرسوم وعدم استخدام عداد سيارات الأجرة المُبلغ عنها بلوحة سيارة أجرة لإجراءات جنائية مباشرة.",
    faqTitle: "الأسئلة المتداولة (FAQ)"
  }
};

const localizedFaqs = {
  tr: [
    {
      q: "purelyİstanbul'a şikayet edersem, işletme beni bulabilir mi?",
      a: "Hayır. purelyİstanbul'un adillik politikasında turist kimliği %100 korunur. İşletme sadece 'Bir misafir x sorununu bildirdi' bilgisini öğrenir. Adınız, telefonunuz veya e-postanız asla işletmeyle paylaşılmaz."
    },
    {
      q: "7 gün sonra işletme cevap vermezse ne oluyor?",
      a: "İşletmenin sessiz kalması kabul edilmez. 7 gün sonunda işletme doğrudan 'Alışveriş Rehberi & Uyarı Panosu'nda kamuya açık olarak yayınlanır ve resmi kurumlara (CİMER/Ticaret Bakanlığı/TUDES) ihbar edilir."
    },
    {
      q: "İşletme uyarı sayfasından nasıl çıkarılır?",
      a: "Yazılı başvuru yaparak purelyİstanbul ile resmi temas kurması gerekir. Mağdur misafirin zararını telafi ettiğini belgelerse uyarı kaldırılabilir. Ancak tekrar şikayet gelirse kalıcı kara listeye alınır."
    },
    {
      q: "Sahte veya asılsız şikayet yaparsam ne olur?",
      a: "purelyİstanbul tüm başvuruları fiş, fatura, konum ve makbuzlarla inceler. Kanıtı olmayan şikayetler reddedilir. Sahte bildirimde bulunan hesaplar sistemden sınırlandırılır."
    },
    {
      q: "purelyİstanbul'da ilanı olmayan bir esnaftan dolandırıldıysam?",
      a: "Fark etmez. purelyİstanbul'un misyonu gereği, o işletme de kanıtlar doğrultusunda Alışveriş Rehberi'nde uyarılır ve resmi kurumlara ihbarda bulunulur."
    },
    {
      q: "Taksi dolandırıcılığı için ne yapmalıyım?",
      a: "Taksi plakasını ve fişi sisteme yükleyin. purelyİstanbul bu durumu İBB-TUDES sistemi üzerinden online resmi ihbar kaydına geçirir ve şoför hakkında cezai işlem başlatılmasını sağlar."
    },
    {
      q: "Şikayet açtıktan ne kadar süre sonra sonuç alırım?",
      a: "Ortalama 10-14 gün. (Araştırma 1-2 gün + işletmenin cevap süresi 7 gün + kamuya açıklanma ve resmi ihbar süreci)."
    }
  ],
  en: [
    {
      q: "If I complain to purelyIstanbul, can the business find me?",
      a: "No. In purelyIstanbul's fairness policy, the tourist's identity is 100% protected. The business only learns 'A guest reported problem X'. Your name, phone, or email is never shared with the business."
    },
    {
      q: "What happens if the business doesn't respond after 7 days?",
      a: "Silence from the business is unacceptable. After 7 days, the business is directly published publicly on the 'Shopping Guide & Warning Board' and reported to official institutions (CIMER/Ministry of Trade/TUDES)."
    },
    {
      q: "How is a business removed from the warning page?",
      a: "They must officially contact purelyIstanbul by applying in writing. If they document that they have compensated the victim guest, the warning can be removed. However, if there is a complaint again, they are permanently blacklisted."
    },
    {
      q: "What happens if I make a fake or unfounded complaint?",
      a: "purelyIstanbul examines all applications with receipts, invoices, locations, and vouchers. Unsubstantiated complaints are rejected. Accounts making fake reports are restricted from the system."
    },
    {
      q: "What if I am scammed by a tradesman who doesn't have a listing on purelyIstanbul?",
      a: "It doesn't matter. In line with purelyIstanbul's mission, that business is also warned in the Shopping Guide based on the evidence and reported to official institutions."
    },
    {
      q: "What should I do about taxi scams?",
      a: "Upload the taxi plate and receipt to the system. purelyIstanbul registers this as an official online report via the IBB-TUDES system and ensures criminal proceedings are initiated against the driver."
    },
    {
      q: "How long after opening a complaint will I get results?",
      a: "On average 10-14 days. (Investigation 1-2 days + business response time 7 days + public disclosure and official reporting process)."
    }
  ],
  ar: [
    {
      q: "إذا اشتكيت إلى purelyIstanbul، فهل يمكن للشركة العثور عليّ؟",
      a: "لا. في سياسة العدالة الخاصة بـ purelyIstanbul، تتم حماية هوية السائح بنسبة 100٪. تعلم الشركة فقط أن 'ضيفًا أبلغ عن المشكلة X'. لا تتم مشاركة اسمك أو رقم هاتفك أو بريدك الإلكتروني أبدًا مع الشركة."
    },
    {
      q: "ماذا يحدث إذا لم تستجب الشركة بعد 7 أيام؟",
      a: "صمت الشركة غير مقبول. بعد 7 أيام، يتم نشر الشركة مباشرة للجمهور على 'دليل التسوق ولوحة التحذير' ويتم إبلاغ المؤسسات الرسمية (CIMER/وزارة التجارة/TUDES)."
    },
    {
      q: "كيف يتم إزالة شركة من صفحة التحذير؟",
      a: "يجب عليهم الاتصال بـ purelyIstanbul رسميًا عن طريق تقديم طلب كتابي. إذا وثقوا أنهم عوضوا الضيف الضحية، فيمكن إزالة التحذير. ومع ذلك، إذا كانت هناك شكوى مرة أخرى، فسيتم إدراجهم في القائمة السوداء بشكل دائم."
    },
    {
      q: "ماذا يحدث إذا قدمت شكوى كاذبة أو لا أساس لها؟",
      a: "يفحص purelyIstanbul جميع الطلبات مع الإيصالات والفواتير والمواقع والقسائم. يتم رفض الشكاوى التي لا أساس لها. يتم تقييد الحسابات التي تقدم تقارير كاذبة من النظام."
    },
    {
      q: "ماذا لو تعرضت لعملية احتيال من قبل تاجر ليس لديه قائمة على purelyIstanbul؟",
      a: "لا يهم. تمشيا مع مهمة purelyIstanbul، يتم تحذير تلك الشركة أيضا في دليل التسوق بناء على الأدلة وإبلاغ المؤسسات الرسمية."
    },
    {
      q: "ماذا أفعل حيال عمليات الاحتيال في سيارات الأجرة؟",
      a: "قم بتحميل لوحة التاكسي والإيصال إلى النظام. يسجل purelyIstanbul هذا كتقرير رسمي عبر الإنترنت عبر نظام IBB-TUDES ويضمن اتخاذ إجراءات جنائية ضد السائق."
    },
    {
      q: "كم من الوقت بعد فتح شكوى سأحصل على نتائج؟",
      a: "في المتوسط 10-14 يومًا. (التحقيق 1-2 يوم + وقت استجابة الشركة 7 أيام + الإفصاح العام وعملية إعداد التقارير الرسمية)."
    }
  ]
};

const localizedShieldTopics = {
  tr: [
    {
      id: 1,
      title: "Sokak Tuzakları & Ayakkabı Boyacısı Hilesi",
      problem: "Yanınıza arkadaşça yaklaşıp 'özel bir bar' teklif edenler, fırçasını bilerek düşüren ayakkabı boyacıları veya sahte Osmanlı antikası satıcıları.",
      risk: "Gece kulüplerinde tartışmak fiziksel saldırıya veya fahiş hesap gaspına dönüşebilir. Sahte antika satın almak havalimanında tarihi eser kaçakçılığı şüphesiyle gözaltına yol açabilir.",
      action: "Fırça düşerse yürümeye devam edin. Yabancılardan gelen bar davetlerini kabul etmeyin. Dolandırıldıysanız tartışmayın, fiş alın ve doğrudan Turizm Polisine gidin.",
      law: "TCK madde 157-158 dolandırıcılık suçunu düzenler. Sahte tarihi eser satmak dolandırıcılık, gerçeğini izinsiz satmak kaçakçılıktır."
    },
    {
      id: 2,
      title: "Sarı Taksi Dolandırıcılıkları (Tırnakçılık & Taksimetre)",
      problem: "Taksimetreyi açmayıp sabit fahiş ücret istemek, yolu kasıtlı uzatmak veya 500 TL verdiğinizde hızla 50 TL ile değiştirip eksik para verdiğinizi iddia etmek.",
      risk: "Otoyol kenarında agresif şoförle tartışmak tehlikelidir. Bagajınız bagajdayken bilmediğiniz yerde mahsur kalabilirsiniz.",
      action: "Rotanızı telefonunuzun GPS'inden izleyin. Binmeden önce plakanın net fotoğrafını çekin. Taksimetre açılmazsa derhal inin. Parayı verirken banknotu açıkça sesli söyleyin.",
      law: "İBB TUDES mevzuatına göre taksimetre açmamak ve fazla ücret almak ağır para cezası ve ruhsat iptali gerektirir."
    },
    {
      id: 3,
      title: "Restoran & Gece Kulübü Şişirilmiş Hesaplar",
      problem: "Fiyatların yazmadığı menü verilmesi, söylenmeyen fahiş 'kuver' ve sipariş edilmeyen içecekler için binlerce lira istenmesi.",
      risk: "Ödeme yapılmazsa korumaların fiziksel tehdidi veya ATM'ye kadar zorla götürme riski (Gasp suçu).",
      action: "Fiyatların basılı olduğu menüyü görmeden sipariş vermeyin. Şişirilmiş hesap gelirse ayrıntılı adisyon isteyin. Tehdit edilirse 112 Polisi arayıp gasp edildiğinizi söyleyin.",
      law: "Tüketici Koruma Kanunu gereği tüm işletmeler girişlerinde ve masalarda net, onaylı fiyat listesi bulundurmak zorundadır."
    },
    {
      id: 4,
      title: "Sahte Polis / Sivil Denetim Tuzağı",
      problem: "Sokakta rozet gösterip 'sivil polis' olduğunu söyleyerek sahte uyuşturucu/para bahanesiyle cüzdan ve pasaportunuzu talep edenler.",
      risk: "Cüzdanınızı verirseniz el çabukluğuyla dövizleriniz ve kartlarınız çalınır veya pasaportunuz sahtesiyle değiştirilebilir.",
      action: "Asla cüzdanınızı sokakta vermeyin. 'Yalnızca en yakın resmi karakolda veya 112 çağırarak işlem yaparım' deyin. Dolandırıcılar hemen uzaklaşacaktır.",
      law: "Polis kimliği olmadan sivil şahısların arama yapması yasadışıdır."
    }
  ],
  en: [
    {
      id: 1,
      title: "Street Traps & Shoe Shiner Scam",
      problem: "People who approach you in a friendly manner and offer a 'special bar', shoe shiners who drop their brushes on purpose, or fake Ottoman antique sellers.",
      risk: "Arguing in nightclubs can turn into physical assault or extortion. Buying fake antiques can lead to detention at the airport on suspicion of historical artifact smuggling.",
      action: "If the brush drops, keep walking. Do not accept bar invitations from strangers. If scammed, don't argue, get a receipt and go directly to the Tourism Police.",
      law: "Selling fake historical artifacts is fraud, selling real ones without permission is smuggling under Turkish Penal Code."
    },
    {
      id: 2,
      title: "Yellow Taxi Scams (Meter & Sleight of Hand)",
      problem: "Not turning on the taximeter and demanding a fixed exorbitant fee, intentionally extending the route, or when you give 500 TL, quickly replacing it with 50 TL and claiming you gave missing money.",
      risk: "Arguing with an aggressive driver on the highway is dangerous. You could get stranded while your luggage is in the trunk.",
      action: "Track your route on your phone's GPS. Take a clear photo of the license plate before getting in. If the meter is not turned on, get out immediately. State the banknote out loud when paying.",
      law: "According to IBB TUDES legislation, not opening a taximeter and taking excessive fees requires heavy fines and license cancellation."
    },
    {
      id: 3,
      title: "Restaurant & Nightclub Inflated Bills",
      problem: "Being given a menu without prices, unstated exorbitant 'cover' charges, and thousands of liras demanded for drinks not ordered.",
      risk: "If payment is not made, physical threats from bouncers or being forced to go to an ATM (Extortion crime).",
      action: "Do not order without seeing a printed menu with prices. If an inflated bill arrives, ask for a detailed receipt. If threatened, call 112 Police and say you are being extorted.",
      law: "Under the Consumer Protection Law, all businesses must have a clear, approved price list at their entrances and on tables."
    },
    {
      id: 4,
      title: "Fake Police / Plainclothes Inspection Trap",
      problem: "People showing a badge on the street, claiming to be 'plainclothes police', and demanding your wallet and passport under the pretext of fake drugs/money.",
      risk: "If you give your wallet, your currency and cards will be stolen by sleight of hand, or your passport may be replaced with a fake one.",
      action: "Never give your wallet on the street. Say 'I will only process this at the nearest official police station or by calling 112'. Scammers will walk away immediately.",
      law: "It is illegal for civilians without police ID to conduct searches."
    }
  ],
  ar: [
    {
      id: 1,
      title: "فخاخ الشوارع وخدعة ماسح الأحذية",
      problem: "الأشخاص الذين يقتربون منك بطريقة ودية ويعرضون 'بارًا خاصًا'، أو ماسحو الأحذية الذين يسقطون فرشاتهم عن قصد، أو بائعو التحف العثمانية المزيفة.",
      risk: "يمكن أن يتحول الجدال في النوادي الليلية إلى اعتداء جسدي أو ابتزاز. يمكن أن يؤدي شراء التحف المزيفة إلى الاعتقال في المطار للاشتباه في تهريب الآثار التاريخية.",
      action: "إذا سقطت الفرشاة، استمر في المشي. لا تقبل دعوات البار من الغرباء. إذا تعرضت للاحتيال، فلا تجادل، واحصل على إيصال واذهب مباشرة إلى شرطة السياحة.",
      law: "بيع القطع الأثرية التاريخية المزيفة هو احتيال، وبيع القطع الحقيقية دون إذن هو تهريب بموجب قانون العقوبات التركي."
    },
    {
      id: 2,
      title: "احتيال سيارات الأجرة الصفراء (العداد وخفة اليد)",
      problem: "عدم تشغيل عداد التاكسي والمطالبة برسوم باهظة ثابتة، أو تمديد المسار عن قصد، أو عندما تعطي 500 ليرة تركية، تستبدلها بسرعة بـ 50 ليرة تركية وتدعي أنك أعطيت أموالًا ناقصة.",
      risk: "الجدال مع سائق عدواني على الطريق السريع أمر خطير. يمكن أن تتقطع بك السبل بينما تكون أمتعتك في صندوق السيارة.",
      action: "تتبع مسارك على نظام تحديد المواقع العالمي (GPS) بهاتفك. التقط صورة واضحة للوحة الترخيص قبل الدخول. إذا لم يتم تشغيل العداد، انزل على الفور. اذكر الورقة النقدية بصوت عالٍ عند الدفع.",
      law: "وفقًا لتشريعات IBB TUDES، فإن عدم فتح عداد التاكسي وأخذ رسوم زائدة يتطلب غرامات باهظة وإلغاء الترخيص."
    },
    {
      id: 3,
      title: "فواتير المطاعم والنوادي الليلية المضخمة",
      problem: "إعطاء قائمة بدون أسعار، ورسوم 'غطاء' باهظة غير معلنة، ومطالبة بآلاف الليرات لمشروبات لم يتم طلبها.",
      risk: "إذا لم يتم الدفع، تهديدات جسدية من الحراس أو الإجبار على الذهاب إلى ماكينة الصراف الآلي (جريمة ابتزاز).",
      action: "لا تطلب دون رؤية قائمة مطبوعة بالأسعار. إذا وصلت فاتورة مضخمة، فاطلب إيصالاً مفصلاً. إذا تعرضت للتهديد، فاتصل بالشرطة 112 وقل إنك تتعرض للابتزاز.",
      law: "بموجب قانون حماية المستهلك، يجب أن يكون لدى جميع الشركات قائمة أسعار واضحة ومعتمدة في مداخلها وعلى طاولاتها."
    },
    {
      id: 4,
      title: "فخ الشرطة المزيفة / التفتيش بملابس مدنية",
      problem: "أشخاص يظهرون شارة في الشارع، ويدعون أنهم 'شرطة بملابس مدنية'، ويطالبون بمحفظتك وجواز سفرك بحجة المخدرات/الأموال المزيفة.",
      risk: "إذا أعطيت محفظتك، فستتم سرقة عملتك وبطاقاتك بخفة يد، أو قد يتم استبدال جواز سفرك بآخر مزيف.",
      action: "لا تعط محفظتك أبدًا في الشارع. قل 'سأقوم بمعالجة هذا فقط في أقرب مركز شرطة رسمي أو عن طريق الاتصال بـ 112'. سيبتعد المحتالون على الفور.",
      law: "من غير القانوني للمدنيين الذين ليس لديهم هوية شرطة إجراء عمليات تفتيش."
    }
  ]
};

export function FairShoppingPolicy({ lang = 'tr' }: FairShoppingPolicyProps) {
  const t = getT(lang);
  const safeLang = (lang as 'tr' | 'en' | 'ar') || 'en';
  const lt = localDict[safeLang] || localDict.en;
  const faqs = localizedFaqs[safeLang] || localizedFaqs.en;
  const shieldTopics = localizedShieldTopics[safeLang] || localizedShieldTopics.en;
  
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openTrap, setOpenTrap] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      
      {/* SAYFA BAŞI: RESMİ İSTANBULKART & MÜZEKART MODÜLLERİ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-red-200/80 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-16 w-24 rounded-xl bg-red-500/5 p-1 border border-red-200 flex items-center justify-center overflow-hidden">
              <Image 
                src="/icons/istanbulkart.png" 
                alt={lt.officialIstanbulkartTitle} 
                width={80} 
                height={52} 
                className="object-contain drop-shadow-xs" 
              />
            </div>
            <h3 className="text-base font-bold text-zinc-900">{lt.officialIstanbulkartTitle}</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {lt.officialIstanbulkartDesc}
            </p>
          </div>

          <a
            href="https://www.istanbulkart.istanbul"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition"
          >
            <span>{lt.officialIstanbulkartLink}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-16 w-24 rounded-xl bg-amber-500/5 p-1 border border-amber-200 flex items-center justify-center overflow-hidden">
              <Image 
                src="/icons/muzekart.png" 
                alt={lt.officialMuzekartTitle}
                width={80} 
                height={52} 
                className="object-contain drop-shadow-xs" 
              />
            </div>
            <h3 className="text-base font-bold text-zinc-900">{lt.officialMuzekartTitle}</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {lt.officialMuzekartDesc}
            </p>
          </div>

          <a
            href="https://muze.gov.tr"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition"
          >
            <span>{lt.officialMuzekartLink}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* SECTION 1: purelyİstanbul MİSAFİR KALKANI */}
      <div className="space-y-5">
          
          <div className="space-y-3">
            <h3 className="text-base font-bold font-serif text-zinc-900">
              {lt.shieldTitle}
            </h3>

            <div className="space-y-3">
              {shieldTopics.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenTrap(openTrap === item.id ? null : item.id)}
                    className="w-full p-4 text-left font-bold text-xs sm:text-sm text-zinc-900 bg-zinc-50/80 hover:bg-amber-50/50 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {item.id}
                      </span>
                      <span>{item.title}</span>
                    </div>
                    {openTrap === item.id ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                  </button>

                  {openTrap === item.id && (
                    <div className="p-5 space-y-3.5 text-xs text-zinc-700 bg-white border-t border-zinc-200 leading-relaxed">
                      <div className="space-y-1">
                        <strong className="text-red-700 block font-bold">{lt.problemLabel}</strong>
                        <div>{item.problem}</div>
                      </div>

                      <div className="space-y-1">
                        <strong className="text-amber-700 block font-bold">{lt.riskLabel}</strong>
                        <p>{item.risk}</p>
                      </div>

                      <div className="space-y-1 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                        <strong className="text-emerald-800 block font-bold">{lt.actionLabel}</strong>
                        <p className="text-emerald-950">{item.action}</p>
                      </div>

                      <div className="space-y-1 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                        <strong className="text-zinc-800 block font-bold">{lt.lawLabel}</strong>
                        <p className="text-zinc-600">{item.law}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="bg-white rounded-3xl p-5 border border-amber-200/60 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center p-1 border border-red-200">
                <Image src="/icons/sos-emergency.png" alt="SOS Acil" width={20} height={20} className="object-contain" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900">{lt.emergencyContactsTitle}</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/50">
                <span className="text-zinc-500 block text-[10px]">{lt.emergencyCallCenter}</span>
                <strong className="text-red-600 text-sm font-mono">112</strong>
              </div>
              <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/50">
                <span className="text-zinc-500 block text-[10px]">{lt.tourismPolice}</span>
                <strong className="text-zinc-900 text-sm font-mono font-bold">+90 212 527 45 03</strong>
              </div>
              <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/50">
                <span className="text-zinc-500 block text-[10px]">{lt.ibbWhiteDesk}</span>
                <strong className="text-zinc-800 text-sm font-mono">153</strong>
              </div>
              <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/50">
                <span className="text-zinc-500 block text-[10px]">{lt.zabıta}</span>
                <strong className="text-amber-800 text-sm font-mono">153</strong>
              </div>
            </div>
          </div>

        </div>

      {/* SECTION 2: purelyİstanbul ADİL ALIŞVERİŞ POLİTİKASI */}
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-md space-y-5">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-md">
              {lt.badExperienceBadge}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 mt-2">
              {lt.policyMainTitle}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-xl">
              {lt.policyMainDesc}
            </p>
          </div>

          <div className="bg-gradient-to-b from-amber-50 to-orange-50/60 p-5 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 p-1.5 flex items-center justify-center shrink-0 border border-orange-200/80 shadow-xs">
                <Image
                  src="/icons/bad-experience.png"
                  alt="Bad Experience"
                  width={48}
                  height={48}
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900">{lt.sorryTitle}</h4>
                <p className="text-xs text-zinc-600 mt-0.5 max-w-md">
                  {lt.sorryDesc}
                </p>
              </div>
            </div>

            <Link
              href="/complaints"
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <span>{lt.submitComplaintBtn}</span>
            </Link>
          </div>
        </div>

          <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold font-serif text-zinc-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">1</span>
              <span>{lt.howToComplainTitle}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-zinc-200 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-amber-50 text-zinc-800 font-bold border-b border-zinc-200">
                    <th className="p-2.5">{lt.proofType}</th>
                    <th className="p-2.5">{lt.whatIsIt}</th>
                    <th className="p-2.5">{lt.example}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-600">
                  <tr>
                    <td className="p-2.5 font-bold text-zinc-900">{lt.proofReceipt}</td>
                    <td className="p-2.5">{lt.proofReceiptDesc}</td>
                    <td className="p-2.5">{lt.proofReceiptEx}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-zinc-900">{lt.proofScreenshot}</td>
                    <td className="p-2.5">{lt.proofScreenshotDesc}</td>
                    <td className="p-2.5">{lt.proofScreenshotEx}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-zinc-900">{lt.proofLocation}</td>
                    <td className="p-2.5">{lt.proofLocationDesc}</td>
                    <td className="p-2.5">{lt.proofLocationEx}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-zinc-900">{lt.proofTaxi}</td>
                    <td className="p-2.5">{lt.proofTaxiDesc}</td>
                    <td className="p-2.5">{lt.proofTaxiEx}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold font-serif text-zinc-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">2</span>
              <span>{lt.whatHappensNextTitle}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                <strong className="text-zinc-900 font-bold block">{lt.step1Title}</strong>
                <p className="text-zinc-600">{lt.step1Desc}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                <strong className="text-zinc-900 font-bold block">{lt.step2Title}</strong>
                <p className="text-zinc-600">{lt.step2Desc}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                <strong className="text-zinc-900 font-bold block">{lt.step3Title}</strong>

                <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-1">
                  <strong className="text-zinc-900 font-bold flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-red-600" />
                    <span>{lt.cimerTitle}</span>
                  </strong>
                  <p className="text-zinc-500">{lt.cimerDesc}</p>
                </div>

                <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-1">
                  <strong className="text-zinc-900 font-bold flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-amber-600" />
                    <span>{lt.tudesTitle}</span>
                  </strong>
                  <p className="text-zinc-500">{lt.tudesDesc}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-bold font-serif text-zinc-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-600" />
              <span>{lt.faqTitle}</span>
            </h3>

            <div className="space-y-2 text-xs">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-zinc-200 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full p-3.5 text-left font-bold text-zinc-900 bg-zinc-50 hover:bg-amber-50/50 flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {openFaq === idx ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                  </button>
                  {openFaq === idx && (
                    <div className="p-3.5 text-zinc-600 bg-white border-t border-zinc-200 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
    </div>
  );
}
"""

with open('src/components/guest/fair-shopping-policy.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
