import { Experience, Language } from './types';
import { getT, getLocalizedCategoryTitle } from './i18n';

interface ExpTranslation {
  title: string;
  agentNote: string;
  provider?: string;
  cuisine?: string;
  priceLevel?: string;
  specialties?: string[];
  location?: string;
}

const EXP_TRANSLATIONS: Record<string, Partial<Record<Language, ExpTranslation>>> = {
  'exp-1': {
    tr: {
      title: 'Boğaz’da Akşam Yemeği Turu & Gösteriler',
      agentNote: 'Işıltılı İstanbul Boğazı’nda canlı kültürel gösteriler eşliğinde TÜRSAB A Grubu lisanslı akşam yemekli yat turu.',
    },
    ar: {
      title: 'جولة عشاء وعروض في مضيق البوسفور',
      agentNote: 'جولة عشاء مرخصة من TÜRSAB الفئة A على طول مضيق البوسفور المضاء مع عروض ثقافية حية.',
    },
    ru: {
      title: 'Вечерний круиз по Босфору с ужином и шоу',
      agentNote: 'Лицензированный TÜRSAB вечерний круиз с ужином по сияющему Босфору и живой культурной программой.',
    },
    de: {
      title: 'Bosporus-Dinner-Cruise & Kulturbühne',
      agentNote: 'TÜRSAB-lizenzierte Abendkreuzfahrt entlang des beleuchteten Bosporus mit Live-Kulturprogramm.',
    },
    fr: {
      title: 'Dîner-Croisière sur le Bosphore & Spectacles',
      agentNote: 'Dîner-croisière certifié TÜRSAB Groupe A le long du Bosphore illuminé avec spectacles culturels en direct.',
    },
  },
  'exp-2': {
    tr: {
      title: 'Her Şey Dahil Gösterili Boğaz Akşam Yemeği Turu',
      agentNote: 'Geleneksel Semazen gösterisi ve Anadolu halk dansları eşliğinde her şey dahil akşam Boğaz turu.',
      location: 'Kabataş İskelesi',
    },
    ar: {
      title: 'جولة عشاء شاملة كلياً في البوسفور مع عروض',
      agentNote: 'جولة مسائية شاملة في البوسفور تتضمن عروض الدراويش المولوية والرقصات الفولكلورية الأناضولية.',
      location: 'رصيف كاباتاش',
    },
    ru: {
      title: 'Круиз «Всё включено» по Босфору с шоу-программой',
      agentNote: 'Вечерний круиз «всё включено» по Босфору с танцем кружащихся дервишей и анатолийским фольклором.',
      location: 'Причал Кабаташ',
    },
    de: {
      title: 'All-Inclusive Dinner-Cruise mit Show',
      agentNote: 'All-Inclusive-Abendfahrt auf dem Bosporus mit traditionellen Derwisch- und anatolischen Folkloretänzen.',
      location: 'Kabataş Anlegestelle',
    },
    fr: {
      title: 'Dîner-Croisière Tout Compris avec Spectacle',
      agentNote: 'Croisière nocturne tout compris sur le Bosphore avec derviches tourneurs et danses folkloriques d’Anatolie.',
      location: 'Embarcadère de Kabataş',
    },
  },
  'exp-3': {
    tr: {
      title: 'Boğaz’da Türk Gecesi & Akşam Yemeği Turu',
      agentNote: 'Seçkin Türk mezeleri ve taze ızgara mevsim balıkları eşliğinde panoramik akşam Boğaz turu.',
    },
    ar: {
      title: 'جولة عشاء ليلة تركية في البوسفور',
      agentNote: 'جولة مسائية بانورامية في البوسفور مع مقبلات تركية مختارة وأسماك موسمية مشوية طازجة.',
    },
    ru: {
      title: 'Турецкая ночь и ужин на Босфоре',
      agentNote: 'Панорамный вечерний круиз по Босфору с турецкими мезе и свежей сезонной рыбой на гриле.',
    },
    de: {
      title: 'Türkischer Abend & Dinner-Cruise auf dem Bosporus',
      agentNote: 'Panoramische Abendfahrt auf dem Bosporus mit erlesenen türkischen Meze und frisch gegrilltem Fisch.',
    },
    fr: {
      title: 'Soirée Turque & Dîner-Croisière sur le Bosphore',
      agentNote: 'Croisière panoramique en soirée avec mezzés turcs raffinés et poisson de saison fraîchement grillé.',
    },
  },
  'exp-4': {
    tr: {
      title: 'Boğaz’da Lüks Özel Yat Kiralama',
      agentNote: 'Çiftler ve küçük gruplar için İstanbul Boğazı’nda özel motor yat kiralama deneyimi (2 - 4 saat).',
    },
    ar: {
      title: 'تأجير يخت فاخر خاص في البوسفور',
      agentNote: 'تأجير يخت خاص على طول مضيق البوسفور للأزواج والمجموعات الصغيرة (من ساعتين إلى 4 ساعات).',
    },
    ru: {
      title: 'Аренда приватной люкс-яхты на Босфоре',
      agentNote: 'Приватная моторная яхта на Босфоре для пар и небольших компаний (от 2 до 4 часов).',
    },
    de: {
      title: 'Private Luxus-Yachtcharter auf dem Bosporus',
      agentNote: 'Privater Motoryacht-Charter entlang des Bosporus für Paare und kleine Gruppen (2 bis 4 Stunden).',
    },
    fr: {
      title: 'Location de Yacht Privé de Luxe sur le Bosphore',
      agentNote: 'Location privée de yacht à moteur sur le Bosphore pour couples et petits groupes (2 à 4 heures).',
    },
  },
  'exp-5': {
    tr: {
      title: 'Lüks Yatta Gün Batımı Boğaz Turu',
      agentNote: 'Karaköy’den hareket eden, uzman tarihçi anlatımı eşliğinde altın saat gün batımı yat turu.',
      location: 'Karaköy İskelesi',
    },
    ar: {
      title: 'جولة غروب الشمس على متن يخت فاخر',
      agentNote: 'جولة يخت وقت الغروب تنطلق من كاراكوي مع شرح تاريخي مباشر.',
      location: 'رصيف كاراكوي',
    },
    ru: {
      title: 'Круиз на закате на роскошной яхте',
      agentNote: 'Круиз на закате с отправлением из Каракёя и живым рассказом историка.',
      location: 'Причал Каракёй',
    },
    de: {
      title: 'Sonnenuntergangsfahrt auf einer Luxusyacht',
      agentNote: 'Yachtfahrt zur goldenen Stunde ab Karaköy mit Live-Kommentar eines Historikers.',
      location: 'Karaköy Anlegestelle',
    },
    fr: {
      title: 'Croisière au Coucher du Soleil en Yacht de Luxe',
      agentNote: 'Croisière à l’heure dorée au départ de Karaköy avec commentaires historiques en direct.',
      location: 'Embarcadère de Karaköy',
    },
  },
  'exp-6': {
    tr: {
      title: 'Yerebatan Sarnıcı, Topkapı & Ayasofya Hızlı Geçiş Turu',
      agentNote: 'Lisanslı tarihçi rehber eşliğinde Ayasofya, Topkapı Sarayı ve Yerebatan Sarnıcı’na sıra beklemeden hızlı giriş.',
    },
    ar: {
      title: 'دخول سريع: صهريج البازيليك وتوبكابي وآيا صوفيا',
      agentNote: 'دخول سريع للمتاحف دون طوابير مع مرشد مؤرخ مرخص يشمل آيا صوفيا وقصر توبكابي وصهريج البازيليك.',
    },
    ru: {
      title: 'Быстрый вход: Цистерна Базилика, Топкапы и Айя-София',
      agentNote: 'Проход без очереди в Айя-Софию, дворец Топкапы и Цистерну Базилика в сопровождении лицензированного историка.',
    },
    de: {
      title: 'Fast-Track: Cisterna Basilica, Topkapı & Hagia Sophia',
      agentNote: 'Schnelleinlass ohne Anstehen mit lizenziertem Historiker-Guide für Hagia Sophia, Topkapı-Palast und Basilika-Zisterne.',
    },
    fr: {
      title: 'Accès Coupe-File : Citerne Basilique, Topkapi & Sainte-Sophie',
      agentNote: 'Entrée coupe-file avec guide historien certifié pour Sainte-Sophie, le Palais de Topkapi et la Citerne Basilique.',
    },
  },
  'exp-7': {
    tr: {
      title: 'Küçük Gruplu Tarihi Yarımada Yürüyüş Turu',
      agentNote: 'UNESCO Dünya Mirası listesindeki Tarihi Yarımada’da lisanslı yerel rehber eşliğinde butik yürüyüş rotası.',
    },
    ar: {
      title: 'جولة مشي لمجموعة صغيرة في المدينة القديمة',
      agentNote: 'مسار مشي حميمي عبر شبه الجزيرة التاريخية المدرجة في اليونسكو مع مرشد محلي مرخص.',
    },
    ru: {
      title: 'Пешеходный тур по Старому городу в мини-группе',
      agentNote: 'Камерная пешая прогулка по Историческому полуострову ЮНЕСКО с лицензированным местным гидом.',
    },
    de: {
      title: 'Kleingruppen-Rundgang durch die Altstadt',
      agentNote: 'Persönlicher Rundgang durch die UNESCO-geschützte Historische Halbinsel mit lizenziertem Guide.',
    },
    fr: {
      title: 'Visite à Pied de la Vieille Ville en Petit Groupe',
      agentNote: 'Parcours intimiste à travers la péninsule historique classée à l’UNESCO avec un guide local certifié.',
    },
  },
  'exp-8': {
    tr: {
      title: 'İstanbul’un Gizli Hazineleri & Tarihi Hanlar Yürüyüşü',
      agentNote: 'Butik otel misafirleri için özel olarak kurgulanmış mimari rotalar ve gizli avlular yürüyüşü.',
    },
    ar: {
      title: 'الجواهر الخفية في إسطنبول وجولة البلدة القديمة',
      agentNote: 'جولة معمارية مخصصة عبر الأفنية السرية والزوايا التاريخية المصممة لضيوف الفنادق البوتيكية.',
    },
    ru: {
      title: 'Скрытые жемчужины Стамбула и тайные дворики',
      agentNote: 'Авторский маршрут по старинным пассажам и скрытым дворикам специально для гостей бутик-отелей.',
    },
    de: {
      title: 'Verborgene Schätze Istanbuls & Geheime Innenhöfe',
      agentNote: 'Maßgeschneiderter Architektur- und Innenhof-Rundgang speziell für Boutique-Hotelgäste.',
    },
    fr: {
      title: 'Trésors Cachés d’Istanbul & Cours Secrètes',
      agentNote: 'Promenade architecturale sur mesure à travers les cours secrètes et passages historiques.',
    },
  },
  'exp-9': {
    tr: {
      title: 'Tarihi Yarımada Günlük Rehberli Keşif Turu',
      agentNote: 'Roma, Bizans ve Osmanlı şaheserlerini kapsayan kapsamlı Tarihi Yarımada rehberli yürüyüş turu.',
    },
    ar: {
      title: 'جولة يومية بصحبة مرشد في شبه الجزيرة التاريخية',
      agentNote: 'جولة مشي يومية تغطي أهم المعالم الرومانية والبيزنطية والعثمانية في قلب إسطنبول.',
    },
    ru: {
      title: 'Ежедневная экскурсия по Историческому полуострову',
      agentNote: 'Обзорная прогулка с гидом по главным римским, византийским и османским памятникам.',
    },
    de: {
      title: 'Tägliche Führung über die Historische Halbinsel',
      agentNote: 'Geführter Rundgang zu den wichtigsten römischen, byzantinischen und osmanischen Wahrzeichen.',
    },
    fr: {
      title: 'Visite Guidée Quotidienne de la Péninsule Historique',
      agentNote: 'Parcours guidé incontournable à la découverte des monuments romains, byzantins et ottomans.',
    },
  },
  'exp-10': {
    tr: {
      title: 'İki Kıtanın Lezzetleri Gastronomi Turu',
      agentNote: 'Karaköy’den Kadıköy’e uzanan, 12 otantik yerel esnaf durağında tadım içeren iki kıta gastronomi rotası.',
    },
    ar: {
      title: 'جولة تذوق الطعام بين قارتين',
      agentNote: 'مسار طهي يمتد بين قارتين من كاراكوي إلى كاديكوي لتذوق 12 محطة محلية أصيلة.',
    },
    ru: {
      title: 'Гастрономический тур «Вкус двух континентов»',
      agentNote: 'Кулинарный маршрут из Каракёя в Кадыкёй с дегустацией в 12 аутентичных семейных заведениях.',
    },
    de: {
      title: 'Kulinarische Tour „Geschmack zweier Kontinente“',
      agentNote: 'Kulinarische Entdeckungsreise von Karaköy nach Kadıköy mit 12 authentischen Familienbetrieben.',
    },
    fr: {
      title: 'Circuit Gastronomique « Saveurs de Deux Continents »',
      agentNote: 'Parcours gourmand entre Karaköy et Kadıköy avec dégustations dans 12 adresses familiales authentiques.',
    },
  },
  'exp-11': {
    tr: {
      title: 'Tarihi Yarımada & Kadıköy Arka Sokak Lezzetleri',
      agentNote: 'Tarihi esnaf lokantalarını, taş fırınları ve baharatçıları keşfeden arka sokak gastronomi yürüyüşü.',
    },
    ar: {
      title: 'أسرار الطهي في المدينة القديمة وكاديكوي',
      agentNote: 'جولة تذوق في الأزقة التاريخية لاستكشاف المطاعم الشعبية العريقة والأفران الحجرية وأسواق التوابل.',
    },
    ru: {
      title: 'Кулинарные секреты Старого города и Кадыкёя',
      agentNote: 'Гастрономическая прогулка по старинным ремесленным локантам, дровяным пекарням и лавкам специй.',
    },
    de: {
      title: 'Kulinarische Geheimnisse der Altstadt & Kadıköy',
      agentNote: 'Gastronomie-Rundgang zu historischen Handwerker-Lokantas, Holzofenbäckereien und Gewürzständen.',
    },
    fr: {
      title: 'Secrets Culinaires de la Vieille Ville & Kadıköy',
      agentNote: 'Balade gastronomique à la découverte des lokantas historiques, fours à bois et étals d’épices.',
    },
  },
  'exp-12': {
    tr: {
      title: 'Tarihi Çarşılar & Gurme Lezzet Yürüyüşü',
      agentNote: 'Zanaatkar Türk peynirleri, zeytinler ve taş fırın baklava tadımlarıyla küçük gruplu tarihi çarşı yürüyüşü.',
    },
    ar: {
      title: 'جولة الأسواق التاريخية وتذوق الأطعمة',
      agentNote: 'جولة في الأسواق التاريخية لمجموعات صغيرة مع تذوق الأجبان التركية والزيتون والبقلاوة الحرفية.',
    },
    ru: {
      title: 'Гастрономическая прогулка по историческим рынкам',
      agentNote: 'Прогулка в мини-группе по историческим рынкам с дегустацией ремесленных сыров, оливок и пахлавы.',
    },
    de: {
      title: 'Historischer Markt- & Feinkost-Rundgang',
      agentNote: 'Kleingruppen-Marktrundgang mit Verkostung von handwerklichem Käse, Oliven und Baklava.',
    },
    fr: {
      title: 'Promenade Gourmande dans les Marchés Historiques',
      agentNote: 'Visite en petit groupe des marchés historiques avec dégustation de fromages artisanaux, olives et baklavas.',
    },
  },
  'exp-13': {
    tr: {
      title: 'Ev Usulü Yemek Atölyesi & Mısır Çarşısı Turu',
      agentNote: 'Rehberli Mısır Çarşısı malzeme alışverişi sonrasında uygulamalı Anadolu mutfağı yemek atölyesi.',
    },
    ar: {
      title: 'ورشة طهي منزلي وجولة في سوق التوابل',
      agentNote: 'ورشة عمل تطبيقية للمطبخ الأناضولي تسبقها جولة لاختيار المكونات من السوق المصري.',
    },
    ru: {
      title: 'Кулинарный мастер-класс и тур по Египетскому базару',
      agentNote: 'Практический мастер-класс по анатолийской кухне после совместного выбора специй на Египетском базаре.',
    },
    de: {
      title: 'Kochkurs & Gewürzbasar-Tour',
      agentNote: 'Praktischer anatolischer Kochworkshop nach einem geführten Einkauf im Ägyptischen Gewürzbasar.',
    },
    fr: {
      title: 'Atelier Cuisine Maison & Visite du Bazar aux Épices',
      agentNote: 'Cours de cuisine anatolienne pratique précédé d’une sélection d’ingrédients au Bazar Égyptien.',
    },
  },
  'exp-14': {
    tr: {
      title: 'Geleneksel Türk Hamamı & Kese-Köpük Ritüeli',
      agentNote: '300 yıllık tarihi mermer hamamda geleneksel kese ve sıcak zeytinyağlı köpük masajı ritüeli.',
    },
    ar: {
      title: 'طقوس الحمام التركي التقليدي والتدليك',
      agentNote: 'طقوس حمام رخامي أصيل عمره 300 عام مع تقشير الكيسة التقليدي وتدليك رغوة زيت الزيتون الدافئ.',
    },
    ru: {
      title: 'Традиционный турецкий хаммам и пенный массаж',
      agentNote: 'Аутентичный ритуал в 300-летнем мраморном хаммаме с пилингом кесе и теплым пенным массажем.',
    },
    de: {
      title: 'Traditionelles Türkisches Hamam- & Massageritual',
      agentNote: 'Authentisches Ritual im 300 Jahre alten Marmor-Hamam mit Kese-Peeling und Olivenseifen-Schaummassage.',
    },
    fr: {
      title: 'Rituel Traditionnel de Hammam Turc & Massage',
      agentNote: 'Rituel authentique dans un hammam en marbre vieux de 300 ans avec gommage kese et massage à la mousse.',
    },
  },
  'exp-15': {
    tr: {
      title: 'Otantik Mimar Sinan Hamam Deneyimi',
      agentNote: '16. yüzyıl Mimar Sinan eseri tarihi hamamda özel termal banyo ve aromaterapi ritüelleri.',
    },
    ar: {
      title: 'تجربة الحمام العثماني الأصيل',
      agentNote: 'تحفة المعماري سنان من القرن السادس عشر تقدم طقوس الاستحمام الحراري والعلاج بالروائح العطرية.',
    },
    ru: {
      title: 'Аутентичный хаммам эпохи Мимара Синана',
      agentNote: 'Архитектурный шедевр XVI века работы Мимара Синана с традиционными банными и арома-ритуалами.',
    },
    de: {
      title: 'Authentisches Hamam-Erlebnis (Mimar Sinan)',
      agentNote: 'Meisterwerk von Mimar Sinan aus dem 16. Jahrhundert mit traditionellem Bad und Aromatherapie.',
    },
    fr: {
      title: 'Expérience Authentique au Hammam de Mimar Sinan',
      agentNote: 'Sanctuaire architectural du XVIe siècle signé Mimar Sinan offrant bain thermal et aromathérapie.',
    },
  },
  'exp-16': {
    tr: {
      title: 'Mevlevi Sema Ayini & Klasik Tasavvuf Müziği',
      agentNote: 'Klasik Türk ney ve tambur dinletisi eşliğinde otantik Mevlevi Sema töreni.',
    },
    ar: {
      title: 'عرض الدراويش المولوية ومراسم السماع',
      agentNote: 'مراسم السماع المولوية الأصيلة مصحوبة بالموسيقى الصوفية الكلاسيكية وعزف الناي.',
    },
    ru: {
      title: 'Церемония Сема и кружащиеся дервиши',
      agentNote: 'Аутентичная суфийская церемония Сема под живое исполнение классической музыки на флейте ней.',
    },
    de: {
      title: 'Tanzende Derwische & Sema-Zeremonie',
      agentNote: 'Authentische Mevlevi-Sema-Zeremonie begleitet von klassischer türkischer Ney-Flötenmusik.',
    },
    fr: {
      title: 'Derviches Tourneurs & Cérémonie du Sema',
      agentNote: 'Cérémonie soufie Mevlevi authentique accompagnée de musique classique turque à la flûte ney.',
    },
  },
  'exp-17': {
    tr: {
      title: 'Mozaik Lamba & Ebru Sanatı Atölyesi',
      agentNote: 'Yerel zanaatkarlar eşliğinde el yapımı mozaik cam lamba ve geleneksel Ebru sanatı atölyesi.',
    },
    ar: {
      title: 'ورشة صنع الفوانيس الفسيفسائية التركية',
      agentNote: 'ورشة عمل حرفية لصنع المصابيح الزجاجية الفسيفسائية وفن الإيبرو (الرسم على الماء) مع حرفيين محليين.',
    },
    ru: {
      title: 'Мастер-класс по созданию мозаичных ламп и Эбру',
      agentNote: 'Творческий мастер-класс по изготовлению турецких мозаичных светильников и искусству Эбру с мастерами.',
    },
    de: {
      title: 'Workshop: Türkische Mosaiklampen & Ebru-Kunst',
      agentNote: 'Kunsthandwerklicher Workshop für Mosaikglaslampen und traditionelle Ebru-Wassermarmorierung.',
    },
    fr: {
      title: 'Atelier de Fabrication de Lampes Mosaïques & Ebru',
      agentNote: 'Atelier artisanal de lampes en verre mosaïque et d’art traditionnel Ebru avec des artisans locaux.',
    },
  },
  'exp-18': {
    tr: {
      title: 'Kumda Türk Kahvesi Yapımı & Kültür Atölyesi',
      agentNote: 'Tarihi Galata stüdyosunda kumda geleneksel Türk kahvesi demleme ve kahve kültürü hikayeleri.',
    },
    ar: {
      title: 'ورشة تحضير القهوة التركية على الرمل',
      agentNote: 'ورشة تحضير القهوة التركية التقليدية على الرمل الساخن مع قصص ثقافية في استوديو تاريخي.',
    },
    ru: {
      title: 'Мастер-класс по кофе на песке и кофейным традициям',
      agentNote: 'Приготовление традиционного турецкого кофе на песке и знакомство с культурой кофе в исторической студии.',
    },
    de: {
      title: 'Türkischer Kaffee auf heißem Sand & Kultur-Workshop',
      agentNote: 'Zubereitung von traditionellem türkischem Kaffee im heißen Sand mit kulturellen Geschichten.',
    },
    fr: {
      title: 'Atelier Café Turc sur Sable & Traditions',
      agentNote: 'Préparation traditionnelle du café turc sur le sable chaud et récits culturels dans un atelier historique.',
    },
  },
  'exp-24': {
    tr: {
      title: 'IST & SAW Özel VIP Havalimanı Transferi',
      agentNote: 'İstanbul (IST) ve Sabiha Gökçen (SAW) havalimanları için 7/24 lisanslı lüks Mercedes-Benz Vito/Sprinter karşılama ve transfer.',
      location: 'İstanbul Geneli',
    },
    ar: {
      title: 'نقل VIP خاص من وإلى مطاري إسطنبول (IST & SAW)',
      agentNote: 'خدمة استقبال ونقل فاخرة على مدار الساعة بسيارات مرسيدس فيتو/سبرينتر مرخصة لمطاري إسطنبول وصبيحة كوكجن.',
      location: 'عموم إسطنبول',
    },
    ru: {
      title: 'Индивидуальный VIP-трансфер в аэропорты IST и SAW',
      agentNote: 'Круглосуточная встреча и трансфер на лицензированных Mercedes-Benz Vito/Sprinter для аэропортов IST и SAW.',
      location: 'Весь Стамбул',
    },
    de: {
      title: 'Privater VIP-Flughafentransfer (IST & SAW)',
      agentNote: 'Lizenziertes 24/7-Meet-&-Greet im luxuriösen Mercedes-Benz Vito/Sprinter für die Flughäfen IST & SAW.',
      location: 'Ganz Istanbul',
    },
    fr: {
      title: 'Transfert Aéroport VIP Privé (IST & SAW)',
      agentNote: 'Accueil et transfert 24h/24 en Mercedes-Benz Vito/Sprinter de luxe agréé pour les aéroports IST et SAW.',
      location: 'Tout Istanbul',
    },
  },
  'exp-25': {
    tr: {
      title: 'Özel Şoförlü VIP Araç Tahsisi & Transfer',
      agentNote: 'Tam gün şehir içi ulaşım ve Boğaz akşam yemekleri için özel şoförlü, lisanslı makam aracı filosu.',
    },
    ar: {
      title: 'تأجير سيارة VIP مع سائق خاص للتنقلات',
      agentNote: 'أسطول سيارات تنفيذية مرخصة مع سائق خاص للتنقلات اليومية في المدينة وحجوزات العشاء.',
    },
    ru: {
      title: 'Аренда VIP-автомобиля с личным водителем',
      agentNote: 'Лицензированный представительский флот с личным водителем для поездок по городу на весь день.',
    },
    de: {
      title: 'VIP-Chauffeurservice & Limousinen-Charter',
      agentNote: 'Lizenzierte Executive-Flotte mit privatem Chauffeur für Ganztagesfahrten und Abendveranstaltungen.',
    },
    fr: {
      title: 'Voiture VIP avec Chauffeur Privé & Transferts',
      agentNote: 'Flotte exécutive agréée avec chauffeur privé pour vos déplacements à la journée et dîners sur le Bosphore.',
    },
  },
  'exp-26': {
    tr: {
      title: 'Teras Uçuşan Elbise & Kültürel Fotoğraf Çekimi',
      agentNote: 'Haliç ve Tarihi Yarımada kubbelerine nazır ikonik terasta uçuşan elbise (Flying Dress) fotoğraf çekimi.',
    },
    ar: {
      title: 'جلسة تصوير الفستان الطائر على السطح',
      agentNote: 'جلسة تصوير أيقونية بالفستان الطائر على سطح يطل على القرن الذهبي وقباب شبه الجزيرة التاريخية.',
    },
    ru: {
      title: 'Фотосессия в летящем платье на панорамной крыше',
      agentNote: 'Знаменитая фотосессия в летящем платье на террасе с видом на Золотой Рог и купола Старого города.',
    },
    de: {
      title: 'Rooftop Flying-Dress- & Kultur-Fotoshooting',
      agentNote: 'Ikonisches Flying-Dress-Fotoshooting auf einer Dachterrasse mit Blick auf das Goldene Horn.',
    },
    fr: {
      title: 'Shooting Photo Flying Dress sur les Toits',
      agentNote: 'Séance photo iconique en robe volante sur une terrasse surplombant la Corne d’Or et les dômes historiques.',
    },
  },
  'exp-27': {
    tr: {
      title: 'Galata Kulesi Manzaralı Teras Fotoğraf Çekimi',
      agentNote: 'Gün doğumu veya gün batımında tarihi Galata Kulesi fonunda özel editoryal portre fotoğraf çekimi.',
    },
    ar: {
      title: 'جلسة تصوير على السطح بإطلالة برج غلطة',
      agentNote: 'جلسة تصوير بورتريه خاصة مؤطرة ببرج غلطة التاريخي عند شروق الشمس أو غروبها.',
    },
    ru: {
      title: 'Фотосессия на крыше с видом на Галатскую башню',
      agentNote: 'Приватная портретная фотосессия на фоне средневековой Галатской башни на рассвете или закате.',
    },
    de: {
      title: 'Rooftop-Fotoshooting mit Blick auf den Galataturm',
      agentNote: 'Privates Porträt-Fotoshooting vor der Kulisse des mittelalterlichen Galataturms bei Sonnenauf- oder -untergang.',
    },
    fr: {
      title: 'Shooting Photo en Terrasse face à la Tour de Galata',
      agentNote: 'Séance portrait éditoriale privée avec la Tour de Galata en toile de fond au lever ou coucher du soleil.',
    },
  },
  'exp-28': {
    tr: {
      title: 'Otantik Osmanlı Kostümleri & Teras Çekimi',
      agentNote: 'El dokuması halılarla bezeli terasta profesyonel ışıklandırma ile tarihi kostüm fotoğraf çekimi.',
    },
    ar: {
      title: 'جلسة تصوير بالأزياء العثمانية الأصيلة على السطح',
      agentNote: 'جلسة تصوير بالأزياء التراثية والسجاد المنسوج يدوياً على التراس مع إضاءة احترافية.',
    },
    ru: {
      title: 'Фотосессия в османских костюмах на панорамной террасе',
      agentNote: 'Фотосессия в исторических костюмах на террасе с коврами ручной работы и профессиональным светом.',
    },
    de: {
      title: 'Authentische Osmanische Kostüme & Rooftop-Shooting',
      agentNote: 'Fotoshooting in historischen Gewändern auf einer Teppichterrasse mit professioneller Beleuchtung.',
    },
    fr: {
      title: 'Costumes Ottomans Authentiques & Shooting Terrasse',
      agentNote: 'Séance photo en costumes d’époque sur une terrasse ornée de tapis tissés main avec éclairage professionnel.',
    },
  },
  'exp-29': {
    tr: {
      title: 'Boğaz Kıyısı & Ortaköy Uçuşan Elbise Çekimi',
      agentNote: 'Profesyonel yerel fotoğrafçı eşliğinde Boğaz kıyısı ve Ortaköy Camii önünde fotoğraf & video çekimi.',
    },
    ar: {
      title: 'جلسة تصوير الفستان الطائر في البوسفور وأورتاكوي',
      agentNote: 'جلسة تصوير صور وفيديو على ضفاف البوسفور وأمام مسجد أورتاكوي مع مصور محلي محترف.',
    },
    ru: {
      title: 'Фотосессия у Босфора и мечети Ортакёй',
      agentNote: 'Фото- и видеосъемка на набережной Босфора и у мечети Ортакёй с профессиональным фотографом.',
    },
    de: {
      title: 'Flying-Dress-Shooting am Bosporus & in Ortaköy',
      agentNote: 'Foto- und Reel-Session am Bosporus-Ufer und vor der Ortaköy-Moschee mit professionellem Fotografen.',
    },
    fr: {
      title: 'Shooting Flying Dress sur le Bosphore & à Ortaköy',
      agentNote: 'Séance photo et vidéo au bord du Bosphore et devant la mosquée d’Ortaköy avec un photographe professionnel.',
    },
  },
  'exp-33': {
    tr: {
      title: 'Kapalıçarşı Zanaatkar Rotası & Adil Alışveriş Turu',
      agentNote: 'Misafirleri doğrudan usta dokumacılar ve mücevher ustalarıyla buluşturan sıfır komisyonlu, şeffaf Kapalıçarşı yürüyüşü.',
    },
    ar: {
      title: 'جولة تسوق البازار الكبير والحرفيين الأصليين',
      agentNote: 'جولة شفافة بدون عمولات خفية في البازار الكبير تربط الضيوف مباشرة بكبار النساجين وصاغة المجوهرات.',
    },
    ru: {
      title: 'Аутентичный шопинг-тур по Гранд-базару без наценок',
      agentNote: 'Прозрачный маршрут по Гранд-базару без скрытых комиссий со знакомством с потомственными ткачами и ювелирами.',
    },
    de: {
      title: 'Großer Basar: Kunsthandwerk & Fair-Shopping-Tour',
      agentNote: 'Provisionsfreier, transparenter Rundgang durch den Großen Basar direkt zu Meisterwebern und Juwelieren.',
    },
    fr: {
      title: 'Visite Artisanale du Grand Bazar & Shopping Équitable',
      agentNote: 'Parcours transparent et sans commission au Grand Bazar, directement auprès des maîtres tisserands et joailliers.',
    },
  },
  'exp-34': {
    tr: {
      title: 'Çukurcuma Antikacıları & Galata Tasarım Butikleri',
      agentNote: 'Çukurcuma, Galata ve Serdar-ı Ekrem sokaklarındaki bağımsız tasarım atölyeleri ve antikacı rotası.',
    },
    ar: {
      title: 'جولة تحف تشوكورجوما وبوتيكات غلطة',
      agentNote: 'مسار منسق للتصميم والتحف عبر تشوكورجوما وغلطة واستوديوهات المصممين المستقلين.',
    },
    ru: {
      title: 'Антикварные лавки Чукурджума и бутики Галаты',
      agentNote: 'Авторский маршрут по антикварным галереям Чукурджума и независимым дизайнерским ателье Галаты.',
    },
    de: {
      title: 'Antiquitäten in Çukurcuma & Design-Boutiquen in Galata',
      agentNote: 'Kuratierter Design- und Antiquitätenrundgang durch Çukurcuma, Galata und unabhängige Ateliers.',
    },
    fr: {
      title: 'Antiquaires de Çukurcuma & Boutiques de Créateurs à Galata',
      agentNote: 'Parcours design et antiquités à travers Çukurcuma, Galata et les ateliers indépendants de Serdar-ı Ekrem.',
    },
  },
  'exp-35': {
    tr: {
      title: 'Tarihi Hanlar & Zanaat Atölyeleri Keşif Turu',
      agentNote: 'Tarihi kervansaray atölyelerine ve usta bakır, ipek ve İznik çini zanaatkarlarına özel erişim.',
    },
    ar: {
      title: 'جولة الخانات التاريخية وورش الحرف اليدوية',
      agentNote: 'وصول خاص إلى ورش الخانات التاريخية وكبار حرفيي النحاس والحرير والسيراميك.',
    },
    ru: {
      title: 'Исторические караван-сараи и ремесленные мастерские',
      agentNote: 'Приватный доступ в старинные мастерские караван-сараев к мастерам по меди, шелку и керамике.',
    },
    de: {
      title: 'Historische Karawansereien & Handwerksateliers',
      agentNote: 'Privater Zugang zu historischen Werkstätten und Meistern für Kupfer, Seide und Keramik.',
    },
    fr: {
      title: 'Caravansérails Historiques & Ateliers d’Artisans',
      agentNote: 'Accès privé aux ateliers historiques et aux maîtres artisans du cuivre, de la soie et de la céramique.',
    },
  },
  'exp-41': {
    tr: {
      title: 'İstanbul Modern Sergi Turu & Sesli Rehber',
      agentNote: 'Karaköy kıyısında Renzo Piano imzalı ikonik binada yer alan İstanbul Modern’e rehberli ziyaret.',
    },
    ar: {
      title: 'معرض الفن المعاصر في إسطنبول مودرن',
      agentNote: 'زيارة مصحوبة بمرشد إلى متحف إسطنبول مودرن في مبناه المطل على الواجهة البحرية من تصميم رينزو بيانو.',
    },
    ru: {
      title: 'Музей современного искусства Istanbul Modern',
      agentNote: 'Экскурсия в музей Istanbul Modern на набережной Каракёя в здании по проекту Ренцо Пьяно.',
    },
    de: {
      title: 'Istanbul Modern: Zeitgenössische Kunst & Führung',
      agentNote: 'Geführter Besuch des Istanbul Modern im von Renzo Piano entworfenen Gebäude an der Waterfront von Karaköy.',
    },
    fr: {
      title: 'Istanbul Modern : Exposition d’Art Contemporain',
      agentNote: 'Visite guidée d’Istanbul Modern dans son bâtiment signé Renzo Piano sur le front de mer de Karaköy.',
    },
  },
  'exp-42': {
    tr: {
      title: 'Oryantalist Tablolar & Kütahya Çinileri Sergisi',
      agentNote: 'Oryantalist başyapıtlar (Kaplumbağa Terbiyecisi), Anadolu ağırlıkları ve Kütahya çinilerini kapsayan Pera Müzesi turu.',
    },
    ar: {
      title: 'معرض اللوحات الاستشراقية وخزف كوتاهية في متحف بيرا',
      agentNote: 'جولة في متحف بيرا تضم روائع الفن الاستشراقي والموازين الأناضولية وخزف كوتاهية التاريخي.',
    },
    ru: {
      title: 'Ориенталистская живопись и керамика в музее Пера',
      agentNote: 'Экскурсия по музею Пера: шедевры ориентализма, анатолийские меры веса и изразцы Кютахьи.',
    },
    de: {
      title: 'Pera-Museum: Orientalistische Gemälde & Kütahya-Keramik',
      agentNote: 'Führung durch das Pera-Museum mit orientalistischen Meisterwerken und historischen Kütahya-Fliesen.',
    },
    fr: {
      title: 'Musée de Pera : Peintures Orientalistes & Faïences',
      agentNote: 'Visite guidée du Musée de Pera présentant des chefs-d’œuvre orientalistes et des faïences de Kütahya.',
    },
  },
  'exp-43': {
    tr: {
      title: 'Arter Çağdaş Sanat Sergileri & Galeri Turu',
      agentNote: 'Çok katlı çağdaş sanat sergilerini ve heykel galerilerini keşfeden Arter müze yürüyüşü.',
    },
    ar: {
      title: 'معارض الفن الحديث وجولات صالات العرض في آرتير',
      agentNote: 'جولة في متحف آرتير للفن المعاصر لاستكشاف المعارض متعددة الطوابق وصالات النحت.',
    },
    ru: {
      title: 'Выставки современного искусства в музее Arter',
      agentNote: 'Прогулка по многоэтажным выставочным залам и скульптурным галереям музея современного искусства Arter.',
    },
    de: {
      title: 'Arter: Moderne Kunstausstellungen & Galerietour',
      agentNote: 'Rundgang durch das Museum für zeitgenössische Kunst Arter mit mehrstöckigen Ausstellungen.',
    },
    fr: {
      title: 'Arter : Expositions d’Art Moderne & Visite Guidée',
      agentNote: 'Parcours au musée d’art contemporain Arter à travers ses expositions sur plusieurs étages.',
    },
  },
  'exp-44': {
    tr: {
      title: 'Osmanlı Bankası Müzesi & SALT Galata Mimari Turu',
      agentNote: 'Tarihi Bankalar Caddesi’nde SALT Galata mimari turu ve Osmanlı Bankası Müzesi kasa daireleri gezisi.',
    },
    ar: {
      title: 'متحف البنك العثماني وجولة معمارية في سالت غلطة',
      agentNote: 'جولة معمارية في مبنى سالت غلطة التاريخي وخزائن متحف البنك العثماني.',
    },
    ru: {
      title: 'Музей Османского банка и архитектурный тур SALT Galata',
      agentNote: 'Архитектурная прогулка по зданию SALT Galata и историческим хранилищам Музея Османского банка.',
    },
    de: {
      title: 'Museum der Osmanischen Bank & Architektur-Tour SALT Galata',
      agentNote: 'Architekturrundgang durch SALT Galata und die historischen Tresorräume des Museums der Osmanischen Bank.',
    },
    fr: {
      title: 'Musée de la Banque Ottomane & Visite Architecturale SALT Galata',
      agentNote: 'Visite architecturale de SALT Galata et découverte des coffres historiques du Musée de la Banque Ottomane.',
    },
  },
  'exp-45': {
    tr: {
      title: 'Tasavvuf Mirası & Galata Mevlevihanesi Turu',
      agentNote: 'Asırlık şiir, musiki ve hat sanatını keşfeden Galata Mevlevihanesi ve tasavvuf mirası rotası.',
    },
    ar: {
      title: 'التراث الصوفي وجولة تكية غلطة المولوية',
      agentNote: 'مسار التراث الصوفي وتكية غلطة المولوية لاستكشاف قرون من الشعر والموسيقى والخط العربي.',
    },
    ru: {
      title: 'Суфийское наследие и обитель дервишей Галаты',
      agentNote: 'Экскурсия по Галатской обители Мевлеви: века суфийской поэзии, музыки и каллиграфии.',
    },
    de: {
      title: 'Sufi-Erbe & Führung durch das Mevlevi-Kloster Galata',
      agentNote: 'Entdeckungsroute durch das Galata-Mevlevi-Kloster mit Jahrhunderten von Poesie, Musik und Kalligrafie.',
    },
    fr: {
      title: 'Héritage Soufi & Visite de la Loge Mevlevi de Galata',
      agentNote: 'Parcours culturel à la loge Mevlevi de Galata explorant des siècles de poésie, musique et calligraphie.',
    },
  },
  'exp-46': {
    tr: {
      title: 'Fener Rum Patrikhanesi & Bizans Mirası Turu',
      agentNote: 'Fener Rum Patrikhanesi ve Bizans dönemi eserlerini ziyaret eden tarihi Fener & Balat yürüyüş rotası.',
    },
    ar: {
      title: 'البطريركية المسكونية والتراث البيزنطي في فنار وبالاط',
      agentNote: 'جولة مشي تاريخية في حي فنار وبالاط لزيارة البطريركية المسكونية والمعالم البيزنطية.',
    },
    ru: {
      title: 'Вселенский Патриархат и византийское наследие Фенера',
      agentNote: 'Исторический маршрут по кварталам Фенер и Балат с посещением Константинопольского Патриархата.',
    },
    de: {
      title: 'Ökumenisches Patriarchat & Byzantinisches Erbe',
      agentNote: 'Historischer Rundgang durch Fener & Balat mit Besuch des Ökumenischen Patriarchats.',
    },
    fr: {
      title: 'Patriarcat Œcuménique & Héritage Byzantin à Fener',
      agentNote: 'Promenade historique à Fener et Balat visitant le Patriarcat œcuménique et les monuments byzantins.',
    },
  },
  'exp-47': {
    tr: {
      title: 'Sefarad Mirası & Tarihi Sinagoglar Rehberli Turu',
      agentNote: 'Uzman tarihçi eşliğinde Galata ve Balat’ın tarihi sinagoglarını ziyaret eden Sefarad kültür yürüyüşü.',
    },
    ar: {
      title: 'جولة التراث اليهودي والمعابد التاريخية',
      agentNote: 'جولة تاريخية لزيارة المعابد التاريخية في غلطة وبالاط برفقة مؤرخ متخصص.',
    },
    ru: {
      title: 'Еврейское наследие и исторические синагоги Стамбула',
      agentNote: 'Прогулка по сефардскому наследию с посещением старинных синагог Галаты и Балата с историком.',
    },
    de: {
      title: 'Jüdisches Erbe & Historische Synagogen-Tour',
      agentNote: 'Geführter Rundgang zum sephardischen Erbe und den historischen Synagogen von Galata und Balat.',
    },
    fr: {
      title: 'Patrimoine Séfarade & Visite Guidée des Synagogues',
      agentNote: 'Parcours historique des synagogues de Galata et Balat accompagné d’un historien spécialiste.',
    },
  },
  'exp-48': {
    tr: {
      title: 'Özel Haliç Kültür Mozaiği & Miras Yürüyüşü',
      agentNote: 'Haliç semtleri boyunca çok kültürlü mimari ve tarihi miras yürüyüşü.',
    },
    ar: {
      title: 'جولة مشي خاصة للتراث المعماري والثقافي في القرن الذهبي',
      agentNote: 'جولة معمارية وثقافية خاصة عبر أحياء القرن الذهبي التاريخية.',
    },
    ru: {
      title: 'Индивидуальный тур по культурному наследию Золотого Рога',
      agentNote: 'Приватная архитектурная и историческая прогулка по старинным кварталам Золотого Рога.',
    },
    de: {
      title: 'Private Kulturerbe- & Architektur-Tour am Goldenen Horn',
      agentNote: 'Privater Architektur- und Kulturrundgang durch die traditionsreichen Viertel am Goldenen Horn.',
    },
    fr: {
      title: 'Visite Privée du Patrimoine & de l’Architecture de la Corne d’Or',
      agentNote: 'Promenade architecturale et multiculturelle privée à travers les quartiers historiques de la Corne d’Or.',
    },
  },
  'rest-1': {
    tr: {
      title: 'Deraliye Rooftop Restaurant',
      agentNote: 'Ayasofya yakınında, 15. ve 17. yüzyıl Osmanlı saray reçetelerini sunan ödüllü teras fine dining restoranı.',
      provider: 'Fine Dining & Teras Restoran',
      cuisine: 'Osmanlı Saray Mutfağı & Fine Dining',
      priceLevel: '$$$$ (Lüks / Fine Dining)',
      specialties: ['Vişneli Yaprak Sarma', 'Kaz Kebabı', 'Mahmudiye (1539)'],
    },
    en: {
      title: 'Deraliye Rooftop Restaurant',
      agentNote: 'Award-winning rooftop fine dining near Hagia Sophia serving authentic 15th–17th century Ottoman palace recipes.',
      provider: 'Fine Dining & Rooftop Restaurant',
      cuisine: 'Ottoman Palace Cuisine & Fine Dining',
      priceLevel: '$$$$ (Luxury / Fine Dining)',
      specialties: ['Sour Cherry Vine Leaves', 'Goose Kebab', 'Mahmudiye (1539)'],
    },
    ar: {
      title: 'مطعم ديراليه روف توب (Deraliye Rooftop)',
      agentNote: 'مطعم فاخر حائز على جوائز بالقرب من آيا صوفيا يقدم وصفات القصر العثماني الأصيلة من القرنين الخامس عشر والسابع عشر.',
      provider: 'مطعم فاخر وتراس بانورامي',
      cuisine: 'مطبخ القصر العثماني الفاخر',
      priceLevel: '$$$$ (فاخر)',
      specialties: ['ورق عنب بالكرز', 'كباب الإوز العثماني', 'محمودية (وصفة 1539)'],
    },
    ru: {
      title: 'Deraliye Rooftop Restaurant',
      agentNote: 'Отмеченный наградами панорамный ресторан у Айя-Софии, где подают блюда по рецептам османских султанов XV–XVII веков.',
      provider: 'Высокая кухня и панорамная терраса',
      cuisine: 'Дворцовая османская кухня & Fine Dining',
      priceLevel: '$$$$ (Люкс / Fine Dining)',
      specialties: ['Долма с вишней', 'Кебаб из гуся', 'Махмудие (рецепт 1539 г.)'],
    },
    de: {
      title: 'Deraliye Rooftop Restaurant',
      agentNote: 'Preisgekröntes Rooftop-Fine-Dining nahe der Hagia Sophia mit authentischen osmanischen Palastrezepten aus dem 15.–17. Jahrhundert.',
      provider: 'Fine Dining & Dachterrassen-Restaurant',
      cuisine: 'Osmanische Palastküche & Fine Dining',
      priceLevel: '$$$$ (Luxus / Fine Dining)',
      specialties: ['Weinblätter mit Sauerkirschen', 'Gänse-Kebab', 'Mahmudiye (1539)'],
    },
    fr: {
      title: 'Deraliye Rooftop Restaurant',
      agentNote: 'Restaurant gastronomique en terrasse près de Sainte-Sophie servant d’authentiques recettes du palais ottoman des XVe–XVIIe siècles.',
      provider: 'Gastronomie & Terrasse Panoramique',
      cuisine: 'Cuisine du Palais Ottoman & Fine Dining',
      priceLevel: '$$$$ (Luxe / Gastronomique)',
      specialties: ['Feuilles de vigne aux griottes', 'Kebab d’oie', 'Mahmudiye (1539)'],
    },
  },
  'rest-2': {
    tr: {
      title: 'Hidden Garden Restaurant',
      agentNote: 'Sultanahmet’te testi kebabı ve taze Ege deniz ürünleriyle ünlü, yeşillikler içindeki gizli avlu restoranı.',
      provider: 'Otantik Restoran & Bahçe',
      cuisine: 'Geleneksel Türk, Akdeniz & Taze Deniz Ürünleri',
      priceLevel: '$$-$$$',
      specialties: ['Çömlek Kebabı (Testi Kebab)', 'Izgara Levrek', 'Karışık Meze Tabağı'],
    },
    en: {
      title: 'Hidden Garden Restaurant',
      agentNote: 'Hidden lush courtyard in Sultanahmet renowned for clay-pot testi kebab and fresh Aegean seafood.',
      provider: 'Authentic Courtyard Restaurant',
      cuisine: 'Traditional Turkish, Mediterranean & Fresh Seafood',
      priceLevel: '$$-$$$',
      specialties: ['Clay-Pot Testi Kebab', 'Grilled Sea Bass', 'Mixed Meze Platter'],
    },
    ar: {
      title: 'مطعم هيدن غاردن (Hidden Garden)',
      agentNote: 'فناء أخضر خفي في السلطان أحمد يشتهر بكباب الفخار والمأكولات البحرية الطازجة من بحر إيجة.',
      provider: 'مطعم وحديقة تقليدية',
      cuisine: 'مأكولات تركية تقليدية وبحرية طازجة',
      priceLevel: '$$-$$$',
      specialties: ['كباب الفخار (تستي كباب)', 'قاروص مشوي', 'طبق مقبلات مشكل'],
    },
    ru: {
      title: 'Hidden Garden Restaurant',
      agentNote: 'Уютный зеленый дворик в Султанахмете, известный тести-кебабом в глиняном горшочке и свежими морепродуктами.',
      provider: 'Аутентичный ресторан с садом',
      cuisine: 'Традиционная турецкая и средиземноморская кухня',
      priceLevel: '$$-$$$',
      specialties: ['Тести-кебаб в горшочке', 'Сибас на гриле', 'Ассорти турецких мезе'],
    },
    de: {
      title: 'Hidden Garden Restaurant',
      agentNote: 'Versteckter grüner Innenhof in Sultanahmet, bekannt für Testi-Kebab aus dem Tontopf und frische Meeresfrüchte.',
      provider: 'Authentisches Gartenrestaurant',
      cuisine: 'Traditionell Türkisch, Mediterran & Meeresfrüchte',
      priceLevel: '$$-$$$',
      specialties: ['Testi-Kebab im Tontopf', 'Gegrillter Wolfsbarsch', 'Gemischte Meze-Platte'],
    },
    fr: {
      title: 'Hidden Garden Restaurant',
      agentNote: 'Jardin intérieur verdoyant à Sultanahmet réputé pour son testi kebab en pot d’argile et ses poissons frais.',
      provider: 'Restaurant Authentique & Jardin',
      cuisine: 'Cuisine Turque Traditionnelle & Fruits de Mer',
      priceLevel: '$$-$$$',
      specialties: ['Testi Kebab en pot d’argile', 'Bar grillé', 'Assortiment de mezzés'],
    },
  },
  'rest-3': {
    tr: {
      title: 'Loti Restaurant & Rooftop',
      agentNote: 'Marmara Denizi ve Tarihi Yarımada manzaralı terasta seçkin Anadolu mutfağı ve sommelier eşleşmeleri.',
      provider: 'Fine Dining & Teras Restoran',
      cuisine: 'Modern Dünya Mutfağı & Çağdaş Türk Füzyon',
      priceLevel: '$$$-$$$$',
      specialties: ['Kuzu İncik Konfi', 'Deniz Mahsullü Risotto', 'Baklava Çıtırı'],
    },
    en: {
      title: 'Loti Restaurant & Rooftop',
      agentNote: 'Panoramic Sea of Marmara and Old City terrace offering refined Anatolian cuisine and sommelier pairings.',
      provider: 'Fine Dining & Rooftop Terrace',
      cuisine: 'Contemporary Turkish Fusion & World Cuisine',
      priceLevel: '$$$-$$$$',
      specialties: ['Lamb Shank Confit', 'Seafood Risotto', 'Crispy Baklava Mille-Feuille'],
    },
    ar: {
      title: 'مطعم وتراس لوتي (Loti Rooftop)',
      agentNote: 'تراس بانورامي يطل على بحر مرمرة والمدينة القديمة ويقدم مأكولات أناضولية راقية.',
      provider: 'مطعم وتراس بانورامي',
      cuisine: 'مأكولات عالمية ومطبخ تركي معاصر',
      priceLevel: '$$$-$$$$',
      specialties: ['موزات ضأن كونفيه', 'ريزوتو المأكولات البحرية', 'بقلاوة مقرمشة'],
    },
    ru: {
      title: 'Loti Restaurant & Rooftop',
      agentNote: 'Панорамная терраса с видом на Мраморное море и Старый город, изысканная анатолийская кухня.',
      provider: 'Панорамный ресторан и терраса',
      cuisine: 'Современный турецкий фьюжн и мировая кухня',
      priceLevel: '$$$-$$$$',
      specialties: ['Томленая голяшка ягненка', 'Ризотто с морепродуктами', 'Хрустящая пахлава'],
    },
    de: {
      title: 'Loti Restaurant & Rooftop',
      agentNote: 'Panoramaterrasse mit Blick auf das Marmarameer und die Altstadt sowie verfeinerte anatolische Küche.',
      provider: 'Fine Dining & Dachterrasse',
      cuisine: 'Moderne Weltküche & Türkische Fusion',
      priceLevel: '$$$-$$$$',
      specialties: ['Lammhaxe Confit', 'Meeresfrüchte-Risotto', 'Baklava-Crunch'],
    },
    fr: {
      title: 'Loti Restaurant & Rooftop',
      agentNote: 'Terrasse panoramique sur la mer de Marmara et la vieille ville proposant une cuisine anatolienne raffinée.',
      provider: 'Gastronomie & Terrasse',
      cuisine: 'Fusion Turque Contemporaine & Cuisine du Monde',
      priceLevel: '$$$-$$$$',
      specialties: ['Souris d’agneau confite', 'Risotto aux fruits de mer', 'Croustillant de baklava'],
    },
  },
  'rest-4': {
    tr: {
      title: 'AŞEKA Karaköy',
      agentNote: 'Karaköy’de 100 yıllık tarihi taş binada avangart şef tadım tabakları ve botanik kokteyller.',
      provider: 'Modern Gastronomi & Lounge',
      cuisine: "Avangart Fine Dining & Chef's Table",
      priceLevel: '$$$$',
      specialties: ['Trüflü Ev Yapımı Makarna', 'Ördek Confit', 'İmza Botanik Kokteyller'],
    },
    en: {
      title: 'AŞEKA Karaköy',
      agentNote: 'Avant-garde chef tasting plates and botanical cocktails inside a 100-year-old stone building in Karaköy.',
      provider: 'Modern Gastronomy & Lounge',
      cuisine: "Avant-Garde Fine Dining & Chef's Table",
      priceLevel: '$$$$',
      specialties: ['Truffle Handmade Pasta', 'Duck Confit', 'Signature Botanical Cocktails'],
    },
    ar: {
      title: 'أشيكا كاراكوي (AŞEKA Karaköy)',
      agentNote: 'أطباق تذوق مبتكرة من الشيف في مبنى حجري تاريخي عمره 100 عام في كاراكوي.',
      provider: 'فن الطهي الحديث ولاونج',
      cuisine: 'طاولة الشيف ومأكولات مبتكرة',
      priceLevel: '$$$$',
      specialties: ['باستا يدوية بالكمأة', 'بط كونفيه', 'مشروبات نباتية مميزة'],
    },
    ru: {
      title: 'AŞEKA Karaköy',
      agentNote: 'Авангардные авторские блюда и ботанические коктейли в 100-летнем каменном особняке в Каракёе.',
      provider: 'Современная гастрономия и лаунж',
      cuisine: "Авангардный Fine Dining & Chef's Table",
      priceLevel: '$$$$',
      specialties: ['Домашняя паста с трюфелем', 'Утка конфи', 'Авторские ботанические коктейли'],
    },
    de: {
      title: 'AŞEKA Karaköy',
      agentNote: 'Avantgardistische Chef-Tasting-Kreationen und botanische Cocktails in einem 100 Jahre alten Steingebäude.',
      provider: 'Moderne Gastronomie & Lounge',
      cuisine: "Avantgarde Fine Dining & Chef's Table",
      priceLevel: '$$$$',
      specialties: ['Hausgemachte Trüffelpasta', 'Enten-Confit', 'Botanische Signature-Cocktails'],
    },
    fr: {
      title: 'AŞEKA Karaköy',
      agentNote: 'Assiettes de dégustation d’avant-garde et cocktails botaniques dans un bâtiment en pierre centenaire à Karaköy.',
      provider: 'Gastronomie Moderne & Lounge',
      cuisine: 'Fine Dining d’Avant-Garde & Table du Chef',
      priceLevel: '$$$$',
      specialties: ['Pâtes fraîches à la truffe', 'Canard confit', 'Cocktails botaniques signature'],
    },
  },
  'rest-5': {
    tr: {
      title: 'Mikla Restaurant (1 Michelin Yıldızlı)',
      agentNote: 'Şef Mehmet Gürs imzalı, Haliç ve Boğaz manzaralı Michelin yıldızlı Yeni Anadolu Mutfağı.',
      provider: 'Michelin Star & Rooftop Fine Dining',
      cuisine: 'Yeni Anadolu Mutfağı (New Anatolian Cuisine)',
      priceLevel: '$$$$ (Tadım Menüsü)',
      specialties: ['Mantı & Yoğurt Dondurması', 'İskenderun Karidesi', 'Trakya Kıvırcık Kuzusu'],
    },
    en: {
      title: 'Mikla Restaurant (1 Michelin Star)',
      agentNote: 'Michelin-starred rooftop by Chef Mehmet Gürs celebrating New Anatolian cuisine with sweeping Golden Horn views.',
      provider: 'Michelin Star & Rooftop Fine Dining',
      cuisine: 'New Anatolian Cuisine',
      priceLevel: '$$$$ (Tasting Menu)',
      specialties: ['Mantı & Yogurt Ice Cream', 'İskenderun Prawns', 'Thracian Kıvırcık Lamb'],
    },
    ar: {
      title: 'مطعم ميكلا (نجمة ميشلان واحدة)',
      agentNote: 'مطعم سطح حائز على نجمة ميشلان للشيف محمد غورس يحتفي بالمطبخ الأناضولي الجديد مع إطلالة ساحرة.',
      provider: 'نجمة ميشلان وتراس فاخر',
      cuisine: 'المطبخ الأناضولي الجديد',
      priceLevel: '$$$$ (قائمة تذوق)',
      specialties: ['مانتي مع آيس كريم الزبادي', 'روبيان إسكندرون', 'لحم ضأن تراقيا'],
    },
    ru: {
      title: 'Mikla Restaurant (1 звезда Michelin)',
      agentNote: 'Отмеченный звездой Michelin панорамный ресторан шефа Мехмета Гюрса, прославляющий Новую анатолийскую кухню.',
      provider: 'Звезда Michelin и панорамный Fine Dining',
      cuisine: 'Новая анатолийская кухня',
      priceLevel: '$$$$ (Дегустационное меню)',
      specialties: ['Манты с йогуртовым мороженым', 'Креветки Искендерун', 'Фракийский ягненок'],
    },
    de: {
      title: 'Mikla Restaurant (1 Michelin-Stern)',
      agentNote: 'Mit einem Michelin-Stern ausgezeichnetes Rooftop-Restaurant von Chef Mehmet Gürs mit Neuer Anatolischer Küche.',
      provider: 'Michelin-Stern & Rooftop Fine Dining',
      cuisine: 'Neue Anatolische Küche',
      priceLevel: '$$$$ (Degustationsmenü)',
      specialties: ['Mantı & Joghurteis', 'İskenderun-Garnelen', 'Thrakisches Lamm'],
    },
    fr: {
      title: 'Mikla Restaurant (1 Étoile Michelin)',
      agentNote: 'Rooftop étoilé Michelin du chef Mehmet Gürs célébrant la Nouvelle Cuisine Anatolienne face à la Corne d’Or.',
      provider: 'Étoile Michelin & Rooftop Gastronomique',
      cuisine: 'Nouvelle Cuisine Anatolienne',
      priceLevel: '$$$$ (Menu Dégustation)',
      specialties: ['Mantı & Glace au yaourt', 'Crevettes d’İskenderun', 'Agneau de Thrace'],
    },
  },
  'rest-6': {
    tr: {
      title: 'Pandeli Restaurant',
      agentNote: 'Mısır Çarşısı girişinin üst katında, turkuaz İznik çinileriyle bezeli 120 yıllık efsanevi lezzet durağı.',
      provider: 'Tarihi Mutfak Mirası',
      cuisine: 'Klasik Osmanlı & İstanbul Mutfağı',
      priceLevel: '$$$',
      specialties: ['Patlıcanlı Börek', 'Hünkar Beğendi', 'Kağıtta Levrek'],
    },
    en: {
      title: 'Pandeli Restaurant',
      agentNote: 'Legendary 120-year-old turquoise-tiled culinary institution above the Spice Bazaar doorway.',
      provider: 'Historic Culinary Heritage (Michelin Bib Gourmand)',
      cuisine: 'Classic Ottoman & Old Istanbul Cuisine',
      priceLevel: '$$$',
      specialties: ['Eggplant Pastry (Börek)', 'Hünkar Beğendi', 'Sea Bass en Papillote'],
    },
    ar: {
      title: 'مطعم باندلي التاريخي (Pandeli)',
      agentNote: 'مؤسسة طهي أسطورية عمرها 120 عاماً مزينة بالبلاط الفيروزي فوق بوابة السوق المصري.',
      provider: 'تراث الطهي التاريخي',
      cuisine: 'المطبخ العثماني والإسطنبولي الكلاسيكي',
      priceLevel: '$$$',
      specialties: ['بوريك بالباذنجان', 'هونكار بيغيندي', 'سمك القاروص بالورق'],
    },
    ru: {
      title: 'Pandeli Restaurant',
      agentNote: 'Легендарный 120-летний ресторан с бирюзовыми изразцами над главным входом в Египетский базар.',
      provider: 'Историческое кулинарное наследие',
      cuisine: 'Классическая османская и стамбульская кухня',
      priceLevel: '$$$',
      specialties: ['Бёрек с баклажанами', 'Хюнкяр Бегенди', 'Сибас в пергаменте'],
    },
    de: {
      title: 'Pandeli Restaurant',
      agentNote: 'Legendäre, 120 Jahre alte kulinarische Institution mit türkisfarbenen Fliesen über dem Eingang des Gewürzbasars.',
      provider: 'Historisches Kulinarisches Erbe',
      cuisine: 'Klassische Osmanische & Istanbuler Küche',
      priceLevel: '$$$',
      specialties: ['Auberginen-Börek', 'Hünkar Beğendi', 'Wolfsbarsch im Pergament'],
    },
    fr: {
      title: 'Pandeli Restaurant',
      agentNote: 'Institution culinaire légendaire de 120 ans aux faïences turquoise située au-dessus de l’entrée du Bazar aux Épices.',
      provider: 'Patrimoine Culinaire Historique',
      cuisine: 'Cuisine Classique Ottomane & Stambouliote',
      priceLevel: '$$$',
      specialties: ['Börek aux aubergines', 'Hünkar Beğendi', 'Bar en papillote'],
    },
  },
  'rest-7': {
    tr: {
      title: 'Neolokal (1 Michelin & Yeşil Yıldız)',
      agentNote: 'SALT Galata’nın terasında Şef Maksut Aşkar yönetiminde sürdürülebilir Anadolu mutfak mirası.',
      provider: 'Sürdürülebilir Fine Dining & Sanat',
      cuisine: 'Modernize Edilmiş Anadolu Mirası',
      priceLevel: '$$$$',
      specialties: ['Ördek Katmer', 'Anne Mantısı', 'Topik & Tahinli Füzyon'],
    },
    en: {
      title: 'Neolokal (1 Michelin Star & Green Star)',
      agentNote: 'Michelin Star & Green Star dining by Chef Maksut Aşkar atop SALT Galata, honoring sustainable Anatolian traditions.',
      provider: 'Sustainable Fine Dining & Art',
      cuisine: 'Modernized Anatolian Culinary Heritage',
      priceLevel: '$$$$',
      specialties: ['Duck Katmer', 'Traditional Mantı Reimagined', 'Topik & Tahini Fusion'],
    },
    ar: {
      title: 'نيولوكال (نجمة ميشلان والنجمة الخضراء)',
      agentNote: 'تجربة طعام حائزة على نجمة ميشلان والنجمة الخضراء للشيف مقصود أشكار في قمة مبنى سالت غلطة.',
      provider: 'طعام فاخر مستدام وفن',
      cuisine: 'تراث الأناضول بلمسة حديثة',
      priceLevel: '$$$$',
      specialties: ['كاتمر البط', 'مانتي تقليدي مبتكر', 'توبيك بالطحينة'],
    },
    ru: {
      title: 'Neolokal (Звезда Michelin и Зеленая звезда)',
      agentNote: 'Ресторан шефа Максута Ашкара на крыше SALT Galata, удостоенный звезды Michelin за бережное отношение к традициям Анатолии.',
      provider: 'Устойчивая высокая кухня и искусство',
      cuisine: 'Современное наследие Анатолии',
      priceLevel: '$$$$',
      specialties: ['Катмер с уткой', 'Авторские манты', 'Топик с тахини'],
    },
    de: {
      title: 'Neolokal (1 Michelin-Stern & Grüner Stern)',
      agentNote: 'Nachhaltige anatolische Spitzenküche von Chef Maksut Aşkar im historischen Gebäude von SALT Galata.',
      provider: 'Nachhaltiges Fine Dining & Kunst',
      cuisine: 'Modernisiertes Anatolisches Kulturerbe',
      priceLevel: '$$$$',
      specialties: ['Enten-Katmer', 'Hausgemachte Mantı', 'Topik & Tahini-Fusion'],
    },
    fr: {
      title: 'Neolokal (1 Étoile Michelin & Étoile Verte)',
      agentNote: 'Table étoilée Michelin et Étoile Verte du chef Maksut Aşkar au sommet de SALT Galata célébrant le terroir anatolien.',
      provider: 'Haute Gastronomie Durable & Art',
      cuisine: 'Héritage Anatolien Modernisé',
      priceLevel: '$$$$',
      specialties: ['Katmer de canard', 'Mantı revisité', 'Fusion Topik & Tahini'],
    },
  },
  'rest-8': {
    tr: {
      title: 'Fine Dine İstanbul Rooftop',
      agentNote: 'Ayasofya, Sultanahmet Camii ve Boğaz’ı 360 derece gören terasta çağdaş Türk ve Osmanlı mutfağı.',
      provider: 'Fine Dining & Teras Restoran',
      cuisine: 'Boğaz Manzaralı Çağdaş Türk & Osmanlı',
      priceLevel: '$$$$',
      specialties: ['Sultan Kebabı', 'Fırınlanmış Kuzu Gerdan', 'Safranlı Deniz Mahsulleri Çorbası'],
    },
    en: {
      title: 'Fine Dine Istanbul Rooftop',
      agentNote: '360-degree rooftop dining overlooking Hagia Sophia, the Blue Mosque, and the Bosphorus strait.',
      provider: 'Fine Dining & Panoramic Rooftop',
      cuisine: 'Bosphorus-View Contemporary Turkish & Ottoman',
      priceLevel: '$$$$',
      specialties: ['Sultan Kebab', 'Slow-Baked Lamb Neck', 'Saffron Seafood Soup'],
    },
    ar: {
      title: 'فاين داين إسطنبول روف توب',
      agentNote: 'عشاء بانورامي بزاوية 360 درجة يطل على آيا صوفيا والمسجد الأزرق ومضيق البوسفور.',
      provider: 'مطعم وتراس بانورامي فاخر',
      cuisine: 'مطبخ تركي وعثماني معاصر بإطلالة البوسفور',
      priceLevel: '$$$$',
      specialties: ['كباب السلطان', 'رقبة ضأن مخبوزة', 'شوربة مأكولات بحرية بالزعفران'],
    },
    ru: {
      title: 'Fine Dine Istanbul Rooftop',
      agentNote: 'Панорамный ресторан с обзором 360° на Айя-Софию, Голубую мечеть и пролив Босфор.',
      provider: 'Панорамный ресторан на крыше',
      cuisine: 'Современная турецкая и османская кухня с видом на Босфор',
      priceLevel: '$$$$',
      specialties: ['Султан-кебаб', 'Томленая шея ягненка', 'Суп из морепродуктов с шафраном'],
    },
    de: {
      title: 'Fine Dine Istanbul Rooftop',
      agentNote: '360-Grad-Dachterrassenrestaurant mit direktem Blick auf die Hagia Sophia, die Blaue Moschee und den Bosporus.',
      provider: 'Fine Dining & Panoramaterrasse',
      cuisine: 'Zeitgenössisch Türkisch & Osmanisch mit Bosporusblick',
      priceLevel: '$$$$',
      specialties: ['Sultan-Kebab', 'Geschmorter Lammhals', 'Safran-Meeresfrüchtesuppe'],
    },
    fr: {
      title: 'Fine Dine Istanbul Rooftop',
      agentNote: 'Terrasse panoramique à 360 degrés surplombant Sainte-Sophie, la Mosquée Bleue et le Bosphore.',
      provider: 'Fine Dining & Terrasse Panoramique',
      cuisine: 'Cuisine Turque & Ottomane Contemporaine face au Bosphore',
      priceLevel: '$$$$',
      specialties: ['Kebab du Sultan', 'Collier d’agneau rôti', 'Soupe de fruits de mer au safran'],
    },
  },
  'rest-9': {
    tr: {
      title: 'Çiya Sofrası',
      agentNote: 'Şef Musa Dağdeviren’in unutulmaya yüz tutmuş Anadolu ve Mezopotamya reçetelerini yaşatan dünyaca ünlü Kadıköy sofrası.',
      provider: 'Geleneksel Gastronomi Mirası',
      cuisine: 'Otantik Mezopotamya, Kafkas & Güneydoğu Anadolu',
      priceLevel: '$$-$$$',
      specialties: ['Şiveydiz', 'Mumbar Dolması', 'Zahter Salatası', 'Kerebiç'],
    },
    en: {
      title: 'Çiya Sofrası — Anatolian Heritage Table',
      agentNote: 'Chef Musa Dağdeviren’s world-renowned Kadıköy culinary table preserving rare Anatolian and Mesopotamian recipes.',
      provider: "Traditional Gastronomy Heritage (Chef's Table)",
      cuisine: 'Authentic Mesopotamian, Caucasian & Anatolian',
      priceLevel: '$$-$$$',
      specialties: ['Şiveydiz', 'Stuffed Mumbar', 'Zahter Salad', 'Kerebiç Dessert'],
    },
    ar: {
      title: 'مطعم تشيا سوفراسي (Çiya Sofrası)',
      agentNote: 'مائدة الشيف موسى داغديفيرين الشهيرة عالمياً في كاديكوي والتي تحافظ على الوصفات الأناضولية النادرة.',
      provider: 'تراث الطهي الأصيل',
      cuisine: 'مطبخ بلاد الرافدين والأناضول الأصيل',
      priceLevel: '$$-$$$',
      specialties: ['شيفيديز', 'ممبار محشي', 'سلطة الزعتر البري', 'حلوى الكرابيج'],
    },
    ru: {
      title: 'Çiya Sofrası',
      agentNote: 'Всемирно известный ресторан шефа Мусы Дагдевирена в Кадыкёе, возрождающий редкие рецепты Анатолии и Месопотамии.',
      provider: "Традиционное гастрономическое наследие (Chef's Table)",
      cuisine: 'Аутентичная месопотамская и анатолийская кухня',
      priceLevel: '$$-$$$',
      specialties: ['Шивейдиз', 'Фаршированный мумбар', 'Салат с захтером', 'Десерт керебич'],
    },
    de: {
      title: 'Çiya Sofrası',
      agentNote: 'Weltbekannte Tafel von Chef Musa Dağdeviren in Kadıköy, die seltene anatolische und mesopotamische Rezepte bewahrt.',
      provider: "Traditionelles Gastronomie-Erbe (Chef's Table)",
      cuisine: 'Authentisch Mesopotamisch, Kaukasisch & Anatolisch',
      priceLevel: '$$-$$$',
      specialties: ['Şiveydiz', 'Gefüllter Mumbar', 'Zahter-Salat', 'Kerebiç'],
    },
    fr: {
      title: 'Çiya Sofrası',
      agentNote: 'Table mondialement connue du chef Musa Dağdeviren à Kadıköy préservant les recettes oubliées d’Anatolie et de Mésopotamie.',
      provider: "Patrimoine Gastronomique Traditionnel (Chef's Table)",
      cuisine: 'Cuisine Authentique de Mésopotamie & d’Anatolie',
      priceLevel: '$$-$$$',
      specialties: ['Şiveydiz', 'Mumbar farci', 'Salade de zahter', 'Dessert Kerebiç'],
    },
  },
  'rest-10': {
    tr: {
      title: 'Matbah Osmanlı Saray Mutfağı',
      agentNote: 'Topkapı Sarayı’nın yanı başında, arşiv belgelerine dayalı hakiki Osmanlı saray yemekleri.',
      provider: 'Fine Dining Saray Mutfağı',
      cuisine: '15-19. Yüzyıl Osmanlı Saray Reçeteleri',
      priceLevel: '$$$$',
      specialties: ['Kavun Dolması (1539)', 'Kuzu Gerdan Kebabı', 'Nirbaç'],
    },
    en: {
      title: 'Matbah Ottoman Palace Cuisine',
      agentNote: 'Royal Ottoman palace cuisine served beside Topkapi Palace using documented archival recipes.',
      provider: 'Fine Dining Palace Cuisine',
      cuisine: '15th–19th Century Ottoman Palace Recipes',
      priceLevel: '$$$$',
      specialties: ['Stuffed Melon (1539)', 'Lamb Neck Kebab', 'Nirbaç'],
    },
    ar: {
      title: 'مطعم مطبخ القصر العثماني (Matbah)',
      agentNote: 'مأكولات القصر العثماني الملكية تقدم بجوار قصر توبكابي باستخدام وصفات تاريخية موثقة.',
      provider: 'مطبخ القصر الفاخر',
      cuisine: 'وصفات القصر العثماني من القرن 15 إلى 19',
      priceLevel: '$$$$',
      specialties: ['الشمام المحشي باللحم (1539)', 'كباب رقبة الضأن', 'نيرباتش'],
    },
    ru: {
      title: 'Matbah Ottoman Palace Cuisine',
      agentNote: 'Королевская кухня османских султанов рядом с дворцом Топкапы по архивным рецептам XV–XIX веков.',
      provider: 'Высокая дворцовая кухня',
      cuisine: 'Рецепты Османского дворца XV–XIX веков',
      priceLevel: '$$$$',
      specialties: ['Фаршированная дыня (1539 г.)', 'Кебаб из шеи ягненка', 'Нирбач'],
    },
    de: {
      title: 'Matbah Ottoman Palace Cuisine',
      agentNote: 'Königliche osmanische Palastküche direkt neben dem Topkapı-Palast nach historischen Archivrezepten.',
      provider: 'Fine Dining Palastküche',
      cuisine: 'Osmanische Palastrezepte des 15.–19. Jahrhunderts',
      priceLevel: '$$$$',
      specialties: ['Gefüllte Melone (1539)', 'Lammhals-Kebab', 'Nirbaç'],
    },
    fr: {
      title: 'Matbah Cuisine du Palais Ottoman',
      agentNote: 'Cuisine royale du palais ottoman servie à côté du Palais de Topkapi selon des recettes d’archives historiques.',
      provider: 'Haute Cuisine de Palais',
      cuisine: 'Recettes du Palais Ottoman des XVe–XIXe Siècles',
      priceLevel: '$$$$',
      specialties: ['Melon farci (1539)', 'Kebab de collier d’agneau', 'Nirbaç'],
    },
  },
  'rest-11': {
    tr: {
      title: 'Sunset Grill & Bar',
      agentNote: 'Ulus Parkı’nda Boğaz Köprüsü manzarasına hakim, uluslararası ödüllü kavı ve sushi barıyla ikonik fine dining.',
      provider: 'Lüks Fine Dining & Sushi',
      cuisine: 'Akdeniz, Çağdaş Türk & Yeni Nesil Japon (Sushi)',
      priceLevel: '$$$$',
      specialties: ['Black Cod Miso', 'Trüflü Ton Balığı Tartar', 'Izgara Kuzu Sırtı'],
    },
    en: {
      title: 'Sunset Grill & Bar',
      agentNote: 'Iconic Ulus Park hilltop dining overlooking the Bosphorus Bridge with an acclaimed international cellar.',
      provider: 'Luxury Fine Dining & Sushi Bar',
      cuisine: 'Mediterranean, Contemporary Turkish & New Style Japanese',
      priceLevel: '$$$$',
      specialties: ['Black Cod Miso', 'Truffle Tuna Tartare', 'Grilled Rack of Lamb'],
    },
    ar: {
      title: 'صن سيت غريل آند بار (Sunset Grill & Bar)',
      agentNote: 'مطعم شهير على تلة حديقة أولوس يطل على جسر البوسفور ويقدم مأكولات متوسطية ويابانية فاخرة.',
      provider: 'مطعم فاخر وسوشي بار',
      cuisine: 'متوسطي وتركي معاصر وياباني فاخر',
      priceLevel: '$$$$',
      specialties: ['سمك القد الأسود بالميسو', 'تارتار التونة بالكمأة', 'ريش ضأن مشوية'],
    },
    ru: {
      title: 'Sunset Grill & Bar',
      agentNote: 'Культовый ресторан на холме Улус-парка с панорамным видом на Босфорский мост и богатой винной картой.',
      provider: 'Люкс Fine Dining и суши-бар',
      cuisine: 'Средиземноморская, современная турецкая и японская кухня',
      priceLevel: '$$$$',
      specialties: ['Черная треска мисо', 'Тартар из тунца с трюфелем', 'Каре ягненка на гриле'],
    },
    de: {
      title: 'Sunset Grill & Bar',
      agentNote: 'Ikonisches Restaurant im Ulus-Park mit Blick auf die Bosporus-Brücke, Sushi-Bar und exzellentem Weinkeller.',
      provider: 'Luxus Fine Dining & Sushi',
      cuisine: 'Mediterran, Zeitgenössisch Türkisch & Japanisch',
      priceLevel: '$$$$',
      specialties: ['Black Cod Miso', 'Trüffel-Thunfisch-Tatar', 'Gegrillter Lammrücken'],
    },
    fr: {
      title: 'Sunset Grill & Bar',
      agentNote: 'Table iconique sur les hauteurs du parc d’Ulus face au pont du Bosphore avec bar à sushis et grande cave.',
      provider: 'Haute Gastronomie & Bar à Sushis',
      cuisine: 'Méditerranéenne, Turque Contemporaine & Japonaise',
      priceLevel: '$$$$',
      specialties: ['Black Cod Miso', 'Tartare de thon à la truffe', 'Carré d’agneau grillé'],
    },
  },
  'rest-12': {
    tr: {
      title: 'Mürver Restaurant',
      agentNote: 'Tarihi Yarımada manzaralı terasta, açık odun ateşinde pişirilen deniz ürünleri ve et spesiyalleriyle Michelin tavsiyeli şef restoranı.',
      provider: 'Modern Izgara & Şef Restoranı',
      cuisine: 'Açık Ateşte Pişirme & Çağdaş Yerel Lezzetler',
      priceLevel: '$$$$',
      specialties: ['Küllü Ahtapot', 'Fırınlanmış Dana İlik', 'Ağır Ateşte Kuzu Kol'],
    },
    en: {
      title: 'Mürver Restaurant',
      agentNote: 'Michelin-recommended open-fire and wood-smoked seafood & grill terrace overlooking the Historic Peninsula.',
      provider: 'Modern Open-Fire & Chef Restaurant',
      cuisine: 'Live-Fire Cooking & Contemporary Local Flavors',
      priceLevel: '$$$$',
      specialties: ['Ash-Roasted Octopus', 'Wood-Fired Bone Marrow', 'Slow-Cooked Lamb Shoulder'],
    },
    ar: {
      title: 'مطعم مورفير (Mürver Restaurant)',
      agentNote: 'تراس موصى به من ميشلان يطل على شبه الجزيرة التاريخية ويشتهر بالمأكولات البحرية والمشويات على الحطب.',
      provider: 'مشويات حديثة على الحطب ومطعم شيف',
      cuisine: 'طهي على النار المفتوحة ونكهات محلية معاصرة',
      priceLevel: '$$$$',
      specialties: ['أخطبوط مشوي على الجمر', 'نخاع العظم بالفرن الحطبي', 'كتف ضأن مطهو ببطء'],
    },
    ru: {
      title: 'Mürver Restaurant',
      agentNote: 'Рекомендованный Michelin ресторан на террасе с видом на Старый город, где готовят морепродукты и мясо на живом огне.',
      provider: 'Современный гриль и авторский ресторан',
      cuisine: 'Блюда на открытом огне и локальные деликатесы',
      priceLevel: '$$$$',
      specialties: ['Осьминог на углях', 'Запеченный костный мозг', 'Томленая лопатка ягненка'],
    },
    de: {
      title: 'Mürver Restaurant',
      agentNote: 'Vom Guide Michelin empfohlenes Terrassenrestaurant mit Küche über offenem Holzfeuer und Blick auf die Altstadt.',
      provider: 'Modernes Open-Fire- & Chef-Restaurant',
      cuisine: 'Offenes Holzfeuer & Zeitgenössische Lokale Küche',
      priceLevel: '$$$$',
      specialties: ['In Asche gegarter Oktopus', 'Gebackenes Rindermark', 'Geschmorte Lammschulter'],
    },
    fr: {
      title: 'Mürver Restaurant',
      agentNote: 'Terrasse recommandée par le Guide Michelin face à la péninsule historique, spécialisée dans la cuisson au feu de bois.',
      provider: 'Grill Moderne au Feu de Bois & Table de Chef',
      cuisine: 'Cuisson sur Flamme Vive & Saveurs Locales',
      priceLevel: '$$$$',
      specialties: ['Poulpe rôti à la cendre', 'Os à moelle au four à bois', 'Épaule d’agneau confite'],
    },
  },
  'rest-13': {
    tr: {
      title: 'Feriye Lokantası',
      agentNote: 'Boğaz kıyısında restore edilmiş 19. yüzyıl Osmanlı saray karakol binasında seçkin Boğaziçi gastronomisi.',
      provider: 'Boğaz Kıyısı Fine Dining',
      cuisine: 'Modernize Edilmiş İstanbul & Boğaziçi Mutfağı',
      priceLevel: '$$$$',
      specialties: ['İsli Patlıcanlı Levrek', 'Kuzu Karsambaç', 'Deniz Mahsullü Güveç'],
    },
    en: {
      title: 'Feriye — Bosphorus Palace Waterfront Dining',
      agentNote: 'Waterfront gastronomy housed in a restored 19th-century Ottoman palace building on the Bosphorus shore.',
      provider: 'Bosphorus Waterfront Fine Dining',
      cuisine: 'Modernized Istanbul & Bosphorus Cuisine',
      priceLevel: '$$$$',
      specialties: ['Sea Bass with Smoked Eggplant', 'Lamb Karsambaç', 'Seafood Casserole'],
    },
    ar: {
      title: 'مطعم فيريه على البوسفور (Feriye)',
      agentNote: 'تجربة طهي راقية على ضفاف البوسفور مباشرة داخل مبنى قصر عثماني مرمم يعود للقرن التاسع عشر.',
      provider: 'مطعم فاخر على ضفاف البوسفور',
      cuisine: 'مطبخ إسطنبول والبوسفور المعاصر',
      priceLevel: '$$$$',
      specialties: ['سمك القاروص مع الباذنجان المدخن', 'لحم ضأن كارسمباتش', 'طاجن المأكولات البحرية'],
    },
    ru: {
      title: 'Feriye Lokantası',
      agentNote: 'Высокая гастрономия на самом берегу Босфора в отреставрированном здании османского дворца XIX века.',
      provider: 'Fine Dining на берегу Босфора',
      cuisine: 'Современная стамбульская и босфорская кухня',
      priceLevel: '$$$$',
      specialties: ['Сибас с копченым баклажаном', 'Ягненок Карсамбач', 'Гювеч из морепродуктов'],
    },
    de: {
      title: 'Feriye Lokantası',
      agentNote: 'Spitzengastronomie direkt am Bosporus-Ufer in einem restaurierten osmanischen Palastgebäude aus dem 19. Jahrhundert.',
      provider: 'Fine Dining direkt am Bosporus',
      cuisine: 'Modernisierte Istanbuler & Bosporus-Küche',
      priceLevel: '$$$$',
      specialties: ['Wolfsbarsch mit Rauch-Aubergine', 'Lamm Karsambaç', 'Meeresfrüchte-Auflauf'],
    },
    fr: {
      title: 'Feriye Lokantası',
      agentNote: 'Haute gastronomie au bord de l’eau dans un palais ottoman restauré du XIXe siècle sur la rive du Bosphore.',
      provider: 'Haute Gastronomie sur les Rives du Bosphore',
      cuisine: 'Cuisine d’Istanbul & du Bosphore Modernisée',
      priceLevel: '$$$$',
      specialties: ['Bar au caviar d’aubergine fumée', 'Agneau Karsambaç', 'Cassolette de fruits de mer'],
    },
  },
  'rest-14': {
    tr: {
      title: 'Nicole Restaurant (1 Michelin Yıldızlı)',
      agentNote: 'Beyoğlu’nda tarihi Fransisken manastırı terasında sunulan Michelin yıldızlı mevsimsel tadım menüsü.',
      provider: 'Michelin Star Boutique Fine Dining',
      cuisine: 'Fransız Teknikli Çağdaş Akdeniz',
      priceLevel: '$$$$',
      specialties: ['Bıldırcın Dolması', 'Karadeniz Kalkanı', 'Mevsimsel Şef Tadım Menüsü'],
    },
    en: {
      title: 'Nicole Restaurant (1 Michelin Star)',
      agentNote: 'Michelin-starred seasonal tasting menu served on the historic Franciscan monastery terrace in Beyoğlu.',
      provider: 'Michelin Star Boutique Fine Dining',
      cuisine: 'Contemporary Mediterranean with French Technique',
      priceLevel: '$$$$',
      specialties: ['Stuffed Quail', 'Black Sea Turbot', "Seasonal Chef's Tasting Menu"],
    },
    ar: {
      title: 'مطعم نيكول (نجمة ميشلان واحدة)',
      agentNote: 'قائمة تذوق موسمية حائزة على نجمة ميشلان تقدم على تراس تاريخي يطل على المدينة القديمة في بيوغلو.',
      provider: 'مطعم بوتيكي حائز على نجمة ميشلان',
      cuisine: 'مطبخ متوسطي معاصر بتقنيات فرنسية',
      priceLevel: '$$$$',
      specialties: ['سمان محشي', 'سمك التربوت من البحر الأسود', 'قائمة تذوق الشيف الموسمية'],
    },
    ru: {
      title: 'Nicole Restaurant (1 звезда Michelin)',
      agentNote: 'Сезонное дегустационное меню со звездой Michelin на исторической террасе в Бейоглу.',
      provider: 'Бутик-ресторан со звездой Michelin',
      cuisine: 'Современная средиземноморская кухня с французской техникой',
      priceLevel: '$$$$',
      specialties: ['Фаршированный перепел', 'Черноморский калкан', 'Сезонный сет от шефа'],
    },
    de: {
      title: 'Nicole Restaurant (1 Michelin-Stern)',
      agentNote: 'Saisonales Michelin-Sterne-Degustationsmenü auf der historischen Terrasse in Beyoğlu.',
      provider: 'Michelin-Stern Boutique Fine Dining',
      cuisine: 'Zeitgenössisch Mediterran mit Französischer Technik',
      priceLevel: '$$$$',
      specialties: ['Gefüllte Wachtel', 'Schwarzmeer-Steinbutt', 'Saisonales Degustationsmenü'],
    },
    fr: {
      title: 'Nicole Restaurant (1 Étoile Michelin)',
      agentNote: 'Menu dégustation saisonnier étoilé Michelin servi sur la terrasse historique de Beyoğlu.',
      provider: 'Boutique Fine Dining Étoilé Michelin',
      cuisine: 'Méditerranéenne Contemporaine & Technique Française',
      priceLevel: '$$$$',
      specialties: ['Caille farcie', 'Turbot de la mer Noire', 'Menu dégustation de saison'],
    },
  },
  'rest-15': {
    tr: {
      title: 'Nuz Restaurant Garden',
      agentNote: 'Kadim Mezopotamya baharatlarını ve ağır ateşte pişen taş fırın lezzetlerini sunan samimi bahçe restoranı.',
      provider: 'Otantik Restoran & Bahçe',
      cuisine: 'Anadolu & Mezopotamya Mutfak Mirası',
      priceLevel: '$$-$$$',
      specialties: ['Güveçte Kuzu Tandır', 'Baharatlı Mardin Kebabı', 'Fıstıklı İrmik Helvası'],
    },
    en: {
      title: 'Nuz Restaurant Garden',
      agentNote: 'Intimate garden table celebrating ancient Mesopotamian spices and slow-cooked clay-oven dishes.',
      provider: 'Authentic Restaurant & Garden',
      cuisine: 'Anatolian & Mesopotamian Culinary Heritage',
      priceLevel: '$$-$$$',
      specialties: ['Clay-Casserole Lamb Tandır', 'Spiced Mardin Kebab', 'Pistachio Semolina Halva'],
    },
    ar: {
      title: 'مطعم وحديقة نوز (Nuz Restaurant Garden)',
      agentNote: 'حديقة دافئة تحتفي بتوابل بلاد الرافدين القديمة والأطباق المطهوة ببطء في الأفران الفخارية.',
      provider: 'مطعم وحديقة أصيلة',
      cuisine: 'تراث المطبخ الأناضولي وبلاد الرافدين',
      priceLevel: '$$-$$$',
      specialties: ['لحم ضأن بالتنور الفخاري', 'كباب ماردين المتبل', 'حلاوة السميد بالفستق'],
    },
    ru: {
      title: 'Nuz Restaurant Garden',
      agentNote: 'Уютный ресторан с садом, прославляющий древние специи Месопотамии и блюда из глиняной печи.',
      provider: 'Аутентичный ресторан и сад',
      cuisine: 'Кулинарное наследие Анатолии и Месопотамии',
      priceLevel: '$$-$$$',
      specialties: ['Тандыр из ягненка в горшочке', 'Пряный мардинский кебаб', 'Манная халва с фисташками'],
    },
    de: {
      title: 'Nuz Restaurant Garden',
      agentNote: 'Idyllisches Gartenrestaurant mit alten mesopotamischen Gewürzen und langsam im Lehmofen gegarten Spezialitäten.',
      provider: 'Authentisches Restaurant & Garten',
      cuisine: 'Anatolisches & Mesopotamisches Kulturerbe',
      priceLevel: '$$-$$$',
      specialties: ['Lamm-Tandır im Tontopf', 'Gewürzter Mardin-Kebab', 'Grieß-Halva mit Pistazien'],
    },
    fr: {
      title: 'Nuz Restaurant Garden',
      agentNote: 'Table de jardin intimiste célébrant les épices anciennes de Mésopotamie et les plats mijotés au four d’argile.',
      provider: 'Restaurant Authentique & Jardin',
      cuisine: 'Patrimoine Culinaire d’Anatolie & de Mésopotamie',
      priceLevel: '$$-$$$',
      specialties: ['Agneau Tandır en cocotte d’argile', 'Kebab épicé de Mardin', 'Halva de semoule aux pistaches'],
    },
  },
  'rest-16': {
    tr: {
      title: 'Beyoğlu Ocakbaşı',
      agentNote: 'Beyoğlu’nun tarihi ara sokaklarında saklı, gerçek meşe kömüründe zırh kebabı ve ocakbaşı deneyimi.',
      provider: 'Geleneksel Ocakbaşı & Kebap',
      cuisine: 'Geleneksel Türk Zırh Kebabı & Sıcak Mezeler',
      priceLevel: '$$-$$$',
      specialties: ['Zırh Adana Kebap', 'Kuzu Pirzola', 'Közde Sarımsaklı Patlıcan Salatası'],
    },
    en: {
      title: 'Beyoğlu Ocakbaşı — Traditional Charcoal Grill',
      agentNote: 'Authentic charcoal ocakbaşı grill experience tucked in the historic lanes of Beyoğlu.',
      provider: 'Traditional Ocakbaşı & Charcoal Grill',
      cuisine: 'Hand-Minced Turkish Kebab & Warm Mezes',
      priceLevel: '$$-$$$',
      specialties: ['Hand-Minced Adana Kebab', 'Grilled Lamb Chops', 'Charcoal Garlic Eggplant Salad'],
    },
    ar: {
      title: 'بيوغلو أوجاكباشي للمشويات (Beyoğlu Ocakbaşı)',
      agentNote: 'تجربة شواء تركية أصيلة على الفحم في الأزقة التاريخية لحي بيوغلو.',
      provider: 'مشويات أوجاكباشي تقليدية على الفحم',
      cuisine: 'كباب تركي مفروم يدوياً ومقبلات ساخنة',
      priceLevel: '$$-$$$',
      specialties: ['كباب أضنة المفروم بالساتور', 'ريش ضأن مشوية', 'سلطة باذنجان مشوي بالثوم'],
    },
    ru: {
      title: 'Beyoğlu Ocakbaşı',
      agentNote: 'Аутентичный гриль-бар оджакбаши на углях в исторических переулках Бейоглу.',
      provider: 'Традиционный оджакбаши и гриль на углях',
      cuisine: 'Рубленый турецкий кебаб и горячие мезе',
      priceLevel: '$$-$$$',
      specialties: ['Рубленый адана-кебаб', 'Бараньи ребрышки', 'Салат из печеных баклажанов с чесноком'],
    },
    de: {
      title: 'Beyoğlu Ocakbaşı',
      agentNote: 'Authentisches Holzkohle-Ocakbaşı-Grillerlebnis in den historischen Gassen von Beyoğlu.',
      provider: 'Traditionelles Ocakbaşı & Holzkohlegrill',
      cuisine: 'Handgehackter Türkischer Kebab & Warme Meze',
      priceLevel: '$$-$$$',
      specialties: ['Handgehackter Adana-Kebab', 'Lammkoteletts', 'Gegrillter Knoblauch-Auberginensalat'],
    },
    fr: {
      title: 'Beyoğlu Ocakbaşı',
      agentNote: 'Expérience authentique de grillades ocakbaşı au charbon de bois nichée dans les ruelles historiques de Beyoğlu.',
      provider: 'Ocakbaşı Traditionnel & Grill au Charbon',
      cuisine: 'Kebab Turc Haché au Couteau & Mezzés Chauds',
      priceLevel: '$$-$$$',
      specialties: ['Adana Kebab haché main', 'Côtelettes d’agneau', 'Salade d’aubergines grillées à l’ail'],
    },
  },
  'rest-17': {
    tr: {
      title: 'Galata Meyhanesi',
      agentNote: 'Akustik geleneksel fasıl müziği ve günlük hazırlanan Ege mezeleriyle klasik İstanbul meyhane akşamı.',
      provider: 'Geleneksel Meyhane & Fasıl',
      cuisine: 'Canlı Akustik Fasıl & İstanbul Meze Kültürü',
      priceLevel: '$$$',
      specialties: ['Sıcak Ot Kavurma', 'Levrek Simit', 'Lakerda', 'Tereyağlı Karides'],
    },
    en: {
      title: 'Galata Meyhanesi — Historic Tavern & Live Fasıl',
      agentNote: 'Classic Istanbul meyhane evening with acoustic traditional music and freshly prepared Aegean meze.',
      provider: 'Traditional Meyhane & Acoustic Music',
      cuisine: 'Live Acoustic Fasıl & Istanbul Meze Culture',
      priceLevel: '$$$',
      specialties: ['Sautéed Aegean Herbs', 'Sea Bass Simit', 'Artisan Lakerda', 'Butter Shrimp Casserole'],
    },
    ar: {
      title: 'غالطة ميهانيسي (Galata Meyhanesi)',
      agentNote: 'أمسية إسطنبولية كلاسيكية مع الموسيقى التقليدية الحية والمقبلات الطازجة من بحر إيجة.',
      provider: 'مطعم تقليدي وموسيقى كلاسيكية حية',
      cuisine: 'موسيقى تركية حية وثقافة المقبلات الإسطنبولية',
      priceLevel: '$$$',
      specialties: ['أعشاب بحر إيجة المقلية', 'لفائف القاروص بالسمسم', 'لاكيردا تقليدية', 'روبيان بالزبدة'],
    },
    ru: {
      title: 'Galata Meyhanesi',
      agentNote: 'Классический стамбульский вечер в мейхане с живой акустической музыкой и свежими эгейскими мезе.',
      provider: 'Традиционная мейхане и живая музыка',
      cuisine: 'Живая музыка фасыл и культура стамбульских мезе',
      priceLevel: '$$$',
      specialties: ['Томленые эгейские травы', 'Сибас в кунжутной корочке', 'Лакерда', 'Креветки в сливочном масле'],
    },
    de: {
      title: 'Galata Meyhanesi',
      agentNote: 'Klassischer Istanbuler Meyhane-Abend mit akustischer Live-Musik und frisch zubereiteten Ägäis-Meze.',
      provider: 'Traditionelle Meyhane & Akustische Musik',
      cuisine: 'Akustische Live-Musik & Istanbuler Meze-Kultur',
      priceLevel: '$$$',
      specialties: ['Gebratene Ägäis-Wildkräuter', 'Wolfsbarsch im Sesamring', 'Lakerda', 'Buttergarnelen'],
    },
    fr: {
      title: 'Galata Meyhanesi',
      agentNote: 'Soirée meyhane stambouliote classique avec musique acoustique traditionnelle et mezzés égéens frais.',
      provider: 'Meyhane Traditionnelle & Musique Acoustique',
      cuisine: 'Musique Acoustique & Culture des Mezzés d’Istanbul',
      priceLevel: '$$$',
      specialties: ['Herbes égéennes sautées', 'Bar en croûte de sésame', 'Lakerda', 'Crevettes au beurre'],
    },
  },
  'rest-18': {
    tr: {
      title: 'Hane Kadıköy',
      agentNote: 'Kadıköy’ün kalbinde çağdaş Ege otları ve deniz mahsullü mezeler sunan yeni nesil lezzet sofrası.',
      provider: 'Yeni Nesil Meyhane & Teras',
      cuisine: 'Yenilikçi Ege & Akdeniz Mezeleri',
      priceLevel: '$$$',
      specialties: ['Avokadolu Karides', 'Fesleğenli Levrek Marin', 'Vişneli Yaprak Sarma'],
    },
    en: {
      title: 'Hane Kadıköy — Modern Aegean Meze Table',
      agentNote: 'Contemporary Aegean herbs and seafood meze table in the vibrant heart of Kadıköy.',
      provider: 'Modern Aegean Gastronomy & Terrace',
      cuisine: 'Innovative Aegean & Mediterranean Mezes',
      priceLevel: '$$$',
      specialties: ['Avocado Prawns', 'Basil Marinated Sea Bass', 'Sour Cherry Vine Leaves'],
    },
    ar: {
      title: 'هان كاديكوي (Hane Kadıköy)',
      agentNote: 'مائدة مقبلات معاصرة من أعشاب بحر إيجة والمأكولات البحرية في قلب كاديكوي النابض بالحياة.',
      provider: 'مطبخ بحر إيجة الحديث وتراس',
      cuisine: 'مقبلات إيجة والبحر المتوسط المبتكرة',
      priceLevel: '$$$',
      specialties: ['روبيان بالأفوكادو', 'قاروص متبل بالريحان', 'ورق عنب بالكرز'],
    },
    ru: {
      title: 'Hane Kadıköy',
      agentNote: 'Современный гастробар с эгейскими травами и морскими деликатесами в самом сердце Кадыкёя.',
      provider: 'Современная мейхане и терраса',
      cuisine: 'Авторские эгейские и средиземноморские мезе',
      priceLevel: '$$$',
      specialties: ['Креветки с авокадо', 'Маринованный сибас с базиликом', 'Долма с вишней'],
    },
    de: {
      title: 'Hane Kadıköy',
      agentNote: 'Zeitgenössische Ägäis-Kräuter- und Meeresfrüchte-Meze-Tafel im lebendigen Herzen von Kadıköy.',
      provider: 'Moderne Ägäis-Meyhane & Terrasse',
      cuisine: 'Innovative Ägäische & Mediterrane Meze',
      priceLevel: '$$$',
      specialties: ['Garnelen mit Avocado', 'Basilikum-marinierter Wolfsbarsch', 'Weinblätter mit Sauerkirschen'],
    },
    fr: {
      title: 'Hane Kadıköy',
      agentNote: 'Table contemporaine d’herbes égéennes et de mezzés de la mer au cœur animé de Kadıköy.',
      provider: 'Meyhane Moderne & Terrasse',
      cuisine: 'Mezzés Innovants de la Mer Égée & Méditerranée',
      priceLevel: '$$$',
      specialties: ['Crevettes à l’avocat', 'Bar mariné au basilic', 'Feuilles de vigne aux griottes'],
    },
  },
  'rest-19': {
    tr: {
      title: 'Ala Kadıköy Meyhane',
      agentNote: 'Kadıköy çarşısının canlı atmosferinde Girit ve Ege zeytinyağlı meze geleneğini yaşatan otantik meyhane.',
      provider: 'Geleneksel Rum Meyhanesi',
      cuisine: 'Girit, Rum & Ada Mutfağı',
      priceLevel: '$$-$$$',
      specialties: ['Girit Ezmesi', 'Ahtapot Izgara', 'Güveçte Kaşarlı Karides'],
    },
    en: {
      title: 'Ala Kadıköy — Cretan & Aegean Tavern',
      agentNote: 'Heritage Cretan and Aegean olive-oil meze tavern in Kadıköy’s lively market quarter.',
      provider: 'Traditional Aegean & Cretan Tavern',
      cuisine: 'Cretan, Aegean & Island Cuisine',
      priceLevel: '$$-$$$',
      specialties: ['Cretan Pistachio & Cheese Spread', 'Chargrilled Octopus', 'Shrimp Casserole with Kashar'],
    },
    ar: {
      title: 'آلا كاديكوي (Ala Kadıköy)',
      agentNote: 'مطعم تراثي للمقبلات الكريتية والإيجية بزيت الزيتون في حي السوق النابض بالحياة في كاديكوي.',
      provider: 'مطبخ إيجة وكريت التقليدي',
      cuisine: 'مأكولات الجزر وبحر إيجة',
      priceLevel: '$$-$$$',
      specialties: ['مقبلات كريت بالجبن والفستق', 'أخطبوط مشوي', 'طاجن الروبيان بالجبن'],
    },
    ru: {
      title: 'Ala Kadıköy Meyhane',
      agentNote: 'Традиционная таверна с критскими и эгейскими мезе на оливковом масле в рыночном квартале Кадыкёя.',
      provider: 'Традиционная эгейская и критская таверна',
      cuisine: 'Критская и островная эгейская кухня',
      priceLevel: '$$-$$$',
      specialties: ['Критский паштет', 'Осьминог на гриле', 'Креветки в горшочке с сыром'],
    },
    de: {
      title: 'Ala Kadıköy Meyhane',
      agentNote: 'Traditionelle kretische und ägäische Olivenöl-Meze-Taverne im lebhaften Marktviertel von Kadıköy.',
      provider: 'Traditionelle Ägäis- & Kreta-Taverne',
      cuisine: 'Kretische, Ägäische & Inselküche',
      priceLevel: '$$-$$$',
      specialties: ['Kretische Creme (Girit Ezmesi)', 'Gegrillter Oktopus', 'Garnelen-Auflauf mit Käse'],
    },
    fr: {
      title: 'Ala Kadıköy Meyhane',
      agentNote: 'Taverne traditionnelle de mezzés crétois et égéens à l’huile d’olive dans le quartier du marché de Kadıköy.',
      provider: 'Taverne Traditionnelle Égéenne & Crétoise',
      cuisine: 'Cuisine Crétoise & des Îles de la Mer Égée',
      priceLevel: '$$-$$$',
      specialties: ['Crème crétoise aux pistaches', 'Poulpe grillé', 'Cassolette de crevettes gratinées'],
    },
  },
  'rest-20': {
    tr: {
      title: 'Tarihi Sultanahmet Köftecisi (1920)',
      agentNote: '1920’den bu yana değişmeyen reçetesiyle efsanevi ızgara köfte ve piyaz sunan tarihi Sultanahmet klasiği.',
      provider: 'İkonik Tarihi Esnaf Lezzeti',
      cuisine: 'Asırlık Türk Köftesi & Piyaz',
      priceLevel: '$-$$ (Hızlı & Bütçe Dostu)',
      specialties: ['Izgara Sultanahmet Köftesi', 'İspir Fasulyeli Piyaz', 'İrmik Helvası'],
    },
    en: {
      title: 'Historic Sultanahmet Köftecisi (Est. 1920)',
      agentNote: 'Sultanahmet’s historic 1920 culinary landmark serving its signature heritage grilled meatballs.',
      provider: 'Iconic 1920 Culinary Landmark',
      cuisine: 'Century-Old Turkish Grilled Meatballs & Piyaz',
      priceLevel: '$-$$ (Fast & Budget-Friendly)',
      specialties: ['Grilled Sultanahmet Meatballs', 'İspir Bean Piyaz Salad', 'Semolina Halva'],
    },
    ar: {
      title: 'كفتجي السلطان أحمد التاريخي (تأسس عام 1920)',
      agentNote: 'المعلم التاريخي الشهير في السلطان أحمد منذ عام 1920 والذي يقدم كرات اللحم المشوية الشهيرة.',
      provider: 'معلم طهي تاريخي منذ 1920',
      cuisine: 'الكفتة التركية المشوية الأصيلة وسلطة البياز',
      priceLevel: '$-$$ (سريع واقتصادي)',
      specialties: ['كفتة السلطان أحمد المشوية', 'سلطة فاصولياء إسبر (بياز)', 'حلاوة السميد'],
    },
    ru: {
      title: 'Исторический Sultanahmet Köftecisi (с 1920 г.)',
      agentNote: 'Кулинарная достопримечательность Султанахмета с 1920 года, знаменитая своими фирменными кёфте на гриле.',
      provider: 'Легендарное историческое заведение с 1920 г.',
      cuisine: 'Вековые традиции турецких кёфте и салата пияз',
      priceLevel: '$-$$ (Быстро и доступно)',
      specialties: ['Кёфте Султанахмет на гриле', 'Фасолевый салат Пияз', 'Манная халва'],
    },
    de: {
      title: 'Historischer Sultanahmet Köftecisi (seit 1920)',
      agentNote: 'Kulinarisches Wahrzeichen in Sultanahmet seit 1920, berühmt für seine traditionellen gegrillten Köfte.',
      provider: 'Kulinarisches Traditionslokal seit 1920',
      cuisine: 'Traditionelle Türkische Köfte & Bohnensalat (Piyaz)',
      priceLevel: '$-$$ (Schnell & Preiswert)',
      specialties: ['Gegrillte Sultanahmet-Köfte', 'İspir-Bohnensalat (Piyaz)', 'Grieß-Halva'],
    },
    fr: {
      title: 'Sultanahmet Köftecisi Historique (Fondé en 1920)',
      agentNote: 'Institution culinaire historique de Sultanahmet depuis 1920 servant ses célèbres boulettes de viande grillées.',
      provider: 'Institution Culinaire Historique depuis 1920',
      cuisine: 'Köfte Turcs Centenaires & Salade Piyaz',
      priceLevel: '$-$$ (Rapide & Abordable)',
      specialties: ['Köfte grillés de Sultanahmet', 'Salade de haricots d’İspir (Piyaz)', 'Halva de semoule'],
    },
  },
  'exp-hammam-3': {
    tr: {
      title: '16. Yüzyıl Kılıç Ali Paşa Hamamı Ritüeli',
      agentNote: 'Mimar Sinan’ın 1580 tarihli restore edilmiş muazzam kubbesi altında geleneksel kese, köpük ritüeli ve el yapımı şerbet ikramı.',
    },
    ar: {
      title: 'طقوس حمام قليج علي باشا من القرن السادس عشر',
      agentNote: 'تحت قبة المعماري سنان المرممة منذ عام 1580، استمتع بالتقشير التقليدي وطقوس الرغوة والشربات العثماني.',
    },
    ru: {
      title: 'Ритуал в хаммаме Кылыч Али-паши XVI века',
      agentNote: 'Отреставрированный купол 1580 года работы Мимара Синана: традиционный пилинг, пенный ритуал и домашний щербет.',
    },
    de: {
      title: 'Kılıç Ali Paşa Hamam-Ritual aus dem 16. Jahrhundert',
      agentNote: 'Unter Mimar Sinans restaurierter Kuppel von 1580: traditionelles Peeling, Schaumritual und handgemachter Scherbett.',
    },
    fr: {
      title: 'Rituel du Hammam Kılıç Ali Paşa du XVIe Siècle',
      agentNote: 'Sous le dôme restauré de 1580 signé Mimar Sinan : gommage traditionnel, rituel de mousse et sorbet artisanal.',
    },
  },
  'exp-hammam-4': {
    tr: {
      title: 'Hürrem Sultan Hamamı Kraliyet & Aromaterapi Ritüeli',
      agentNote: 'Ayasofya ile Sultanahmet Camii arasında, organik kil maskeleri ve mermer göbek taşında özel saray hamamı deneyimi.',
      location: 'Sultanahmet Meydanı',
    },
    ar: {
      title: 'حمام خرم سلطان الملكي وطقوس العلاج بالروائح',
      agentNote: 'يقع بين آيا صوفيا والمسجد الأزرق، ويقدم طقوس حمام ملكية خاصة مع أقنعة الطين الأحمر العضوي.',
      location: 'ساحة السلطان أحمد',
    },
    ru: {
      title: 'Королевский ритуал в хаммаме Хюррем Султан',
      agentNote: 'Расположенный между Айя-Софией и Голубой мечетью хаммам предлагает приватные мраморные ритуалы с глиняными масками.',
      location: 'Площадь Султанахмет',
    },
    de: {
      title: 'Königliches Osmanisches Bad im Hürrem Sultan Hamam',
      agentNote: 'Zwischen Hagia Sophia und Blauer Moschee gelegen, mit privaten Marmor-Thermalritualen und Bio-Tonerde-Masken.',
      location: 'Sultanahmet-Platz',
    },
    fr: {
      title: 'Bain Royal Ottoman & Aromathérapie au Hammam Hürrem Sultan',
      agentNote: 'Situé entre Sainte-Sophie et la Mosquée Bleue, offrant des rituels thermaux privés avec masques à l’argile rouge bio.',
      location: 'Place Sultanahmet',
    },
  },
  'exp-transfer-3': {
    tr: {
      title: 'Hızlı Havalimanı Karşılama & VIP Mercedes Vito Transfer',
      agentNote: 'Terminal kapısında isminizle karşılama, bagaj desteği ve D2 belgeli lüks VIP araçla sabit fiyatlı doğrudan transfer.',
      location: 'İstanbul Havalimanı (IST) & Sabiha Gökçen (SAW)',
    },
    ar: {
      title: 'استقبال سريع في المطار + نقل VIP مرسيدس فيتو',
      agentNote: 'استقبال عند بوابة المطار ومساعدة في الأمتعة ونقل مباشر بسعر ثابت في سيارة فاخرة مرخصة.',
      location: 'مطار إسطنبول (IST) ومطار صبيحة (SAW)',
    },
    ru: {
      title: 'Fast-Track встреча в аэропорту + VIP Mercedes Vito',
      agentNote: 'Встреча у выхода из терминала, помощь с багажом и прямой трансфер по фиксированному тарифу на люкс-минивэне.',
      location: 'Аэропорт Стамбул (IST) и Сабиха Гёкчен (SAW)',
    },
    de: {
      title: 'Fast-Track Airport Meet & Greet + VIP Mercedes Vito',
      agentNote: 'Empfang am Terminalausgang, Gepäckservice und direkter Festpreis-Transfer im lizenzierten Luxus-Van.',
      location: 'Flughafen Istanbul (IST) & Sabiha Gökçen (SAW)',
    },
    fr: {
      title: 'Accueil Rapide Aéroport + Transfert VIP Mercedes Vito',
      agentNote: 'Accueil à la sortie du terminal, assistance bagages et transfert direct à tarif fixe en van de luxe agréé.',
      location: 'Aéroport d’Istanbul (IST) & Sabiha Gökçen (SAW)',
    },
  },
  'exp-transfer-4': {
    tr: {
      title: 'Semtler Arası Özel Şoför & Akşam Yemeği Tahsisi',
      agentNote: 'TÜRSAB ve D2 belgeli filolar tarafından sunulan noktadan noktaya veya 6 saatlik özel şoförlü araç tahsisi.',
    },
    ar: {
      title: 'سائق خاص للتنقل بين الأحياء وحجوزات المساء',
      agentNote: 'خدمة سيارة خاصة مع سائق من نقطة إلى نقطة أو تحت التصرف لمدة 6 ساعات بأسطول مرخص.',
    },
    ru: {
      title: 'Личный водитель для поездок по городу и вечерних выездов',
      agentNote: 'Индивидуальный трансфер или аренда авто с водителем на 6 часов от лицензированного автопарка.',
    },
    de: {
      title: 'Privater Chauffeur zwischen den Stadtteilen & Abendtransfer',
      agentNote: 'Punkt-zu-Punkt- oder 6-Stunden-Bereitschaftsservice mit privatem Chauffeur und lizenzierter Flotte.',
    },
    fr: {
      title: 'Chauffeur Privé Inter-Quartiers & Voiture de Soirée',
      agentNote: 'Service de chauffeur privé point à point ou mise à disposition de 6 heures par une flotte agréée.',
    },
  },
  'exp-bazaar-4': {
    tr: {
      title: 'Özel İpek Dokuma & İznik Çini Ustası Atölye Ziyareti',
      agentNote: 'Sertifikalı İznik kuvars çini ve Hereke ipek ustalarının atölyelerine şeffaf atölye fiyatlarıyla doğrudan erişim.',
    },
    ar: {
      title: 'زيارة خاصة لمرسم حياكة الحرير وخزف إزنيك',
      agentNote: 'وصول مباشر إلى استوديوهات كبار حرفيي خزف إزنيك وحرير هيريكي المعتمدين بأسعار الورشة الشفافة.',
    },
    ru: {
      title: 'Приватное ателье шелкоткачества и изникской керамики',
      agentNote: 'Прямой доступ в мастерские сертифицированных мастеров изникской керамики и шелка Хереке по честным ценам.',
    },
    de: {
      title: 'Privates Meisteratelier für Seidenweberei & İznik-Keramik',
      agentNote: 'Direkter Atelierzugang zu zertifizierten İznik-Quarzkeramik- und Hereke-Seidenmeistern zu transparenten Werkstattpreisen.',
    },
    fr: {
      title: 'Atelier Privé de Maîtres Tisserands de Soie & Céramique d’İznik',
      agentNote: 'Accès direct aux ateliers de maîtres certifiés en céramique d’İznik et soie de Hereke à prix d’atelier transparents.',
    },
  },
  'exp-catering-1': {
    tr: {
      title: 'Odaya Teslim Geleneksel Türk Serpme Kahvaltısı',
      agentNote: 'Sıcak taş fırın simidi, organik Van petek balı ve kaymağı, Ezine peynirleri, menemen ve demleme Rize çayı süitinize teslim edilir.',
      location: 'Butik Otel & Süitlere Teslimat',
    },
    ar: {
      title: 'إفطار تركي تقليدي متنوع يوصل إلى جناحك',
      agentNote: 'سميت طازج، عسل فان العضوي مع القشطة، أجبان إزينه المعتقة، شكشوكة تركية وشاي ريزا يقدم في غرفتك.',
      location: 'توصيل إلى الفنادق البوتيكية والأجنحة',
    },
    ru: {
      title: 'Традиционный турецкий завтрак с доставкой в номер',
      agentNote: 'Горячий симит из печи, органический сотовый мед и каймак из Вана, сыры Эзине, менемен и чай из Ризе прямо в ваш люкс.',
      location: 'Доставка в бутик-отели и апартаменты',
    },
    de: {
      title: 'Traditionelles Türkisches Serpme-Frühstück in Ihre Suite',
      agentNote: 'Warmer Holzofen-Simit, Bio-Wabenhonig & Kaymak aus Van, gereifter Ezine-Käse, Menemen und Rize-Tee direkt aufs Zimmer.',
      location: 'Lieferung in Boutique-Hotels & Suiten',
    },
    fr: {
      title: 'Petit-Déjeuner Turc Traditionnel Livré en Suite',
      agentNote: 'Simit chaud au feu de bois, miel en rayon et kaymak de Van, fromages d’Ezine, menemen et thé de Rize livrés dans votre chambre.',
      location: 'Livré dans les Hôtels-Boutiques & Suites',
    },
  },
  'exp-catering-2': {
    tr: {
      title: 'Ege Zeytinyağlı Meze & Anadolu Tadım Kutusu',
      agentNote: 'Özel teras akşamlarınız için şef hazırlığı soğuk zeytinyağlı meze tabağı, ekşi mayalı ekmekler ve yerel butik eşleşmeler.',
      location: 'Butik Otel & Süitlere Teslimat',
    },
    ar: {
      title: 'صندوق مقبلات بحر إيجة بزيت الزيتون للغرف والتراسات',
      agentNote: 'تشكيلة مقبلات باردة بزيت الزيتون محضرة من الشيف مع خبز العجين المخمر لأمسيات التراس الخاصة.',
      location: 'توصيل إلى الفنادق البوتيكية والأجنحة',
    },
    ru: {
      title: 'Гастробокс эгейских мезе и анатолийских деликатесов',
      agentNote: 'Приготовленное шефом плато холодных мезе на оливковом масле и ремесленный хлеб для уютного вечера на террасе.',
      location: 'Доставка в бутик-отели и апартаменты',
    },
    de: {
      title: 'Ägäische Meze- & Anatolische Genussbox',
      agentNote: 'Vom Küchenchef zubereitete kalte Olivenöl-Meze-Platte, Sauerteigfladen und kuratierte Begleitungen für Ihren Terrassenabend.',
      location: 'Lieferung in Boutique-Hotels & Suiten',
    },
    fr: {
      title: 'Coffret Dégustation Mezzés Égéens & Terroir Anatolien',
      agentNote: 'Assortiment de mezzés froids à l’huile d’olive préparés par un chef et pains au levain pour vos soirées privées en terrasse.',
      location: 'Livré dans les Hôtels-Boutiques & Suites',
    },
  },
  'exp-catering-3': {
    tr: {
      title: 'Gaziantep Fıstıklı Baklava & Semaverde Türk Çayı Tepsisi',
      agentNote: 'Günlük taş fırın Gaziantep fıstıklı baklava, gül yapraklı lokum ve pirinç semaverde çay servisi doğrudan odanıza getirilir.',
      location: 'Butik Otel & Süitlere Teslimat',
    },
    ar: {
      title: 'صينية بقلاوة غازي عنتاب الملكية بالفستق والشاي التركي',
      agentNote: 'بقلاوة غازي عنتاب الطازجة بالفستق وراحة الحلقوم بالورد مع خدمة الشاي في السماور النحاسي مباشرة إلى غرفتك.',
      location: 'توصيل إلى الفنادق البوتيكية والأجنحة',
    },
    ru: {
      title: 'Королевская фисташковая пахлава и турецкий чай в самоваре',
      agentNote: 'Свежевыпеченная пахлава из Газиантепа, лукум с лепестками роз и чай в медном самоваре с доставкой в номер.',
      location: 'Доставка в бутик-отели и апартаменты',
    },
    de: {
      title: 'Königliches Pistazien-Baklava & Türkisches Teetablett',
      agentNote: 'Frisch gebackenes Gaziantep-Pistazien-Baklava, Rosenblüten-Lokum und Samowar-Teeservice direkt auf Ihr Zimmer.',
      location: 'Lieferung in Boutique-Hotels & Suiten',
    },
    fr: {
      title: 'Plateau Royal de Baklavas à la Pistache & Thé Turc au Samovar',
      agentNote: 'Baklavas frais aux pistaches de Gaziantep, loukoums à la rose et service à thé en samovar de cuivre livrés en chambre.',
      location: 'Livré dans les Hôtels-Boutiques & Suites',
    },
  },
  'exp-catering-4': {
    tr: {
      title: 'Süit İçi Özel Şefli Osmanlı Kutlama Yemeği',
      agentNote: 'Tam masa tasarımı ve özel mutfak ekibi tarafından süitinizde hazırlanan ve servis edilen 4 aşamalı gurme Anadolu akşam yemeği.',
      location: 'Butik Süitler & Teras Daireler',
    },
    ar: {
      title: 'عشاء احتفالي عثماني خاص مع شيف داخل الجناح',
      agentNote: 'عشاء أناضولي فاخر مكون من 4 أطباق يتم إعداده وتقديمه في جناحك بواسطة فريق طهي معتمد مع تنسيق كامل للمائدة.',
      location: 'الأجنحة البوتيكية والبنتهاوس',
    },
    ru: {
      title: 'Приватный праздничный османский ужин от шефа в номере',
      agentNote: 'Гурмэ-ужин из 4 подач с полной сервировкой стола, приготовленный и поданный в вашем люксе командой шеф-поваров.',
      location: 'Бутик-люксы и пентхаусы',
    },
    de: {
      title: 'Privates Osmanisches Festtagsdinner mit Privatkoch in der Suite',
      agentNote: 'Vier-Gänge-Gourmetdinner inklusive Tischdekoration, frisch zubereitet und serviert in Ihrer Suite.',
      location: 'Boutique-Suiten & Penthouses',
    },
    fr: {
      title: 'Dîner de Célébration Ottoman Privé avec Chef en Suite',
      agentNote: 'Dîner gastronomique anatolien en quatre services préparé et servi dans votre suite avec dressage complet de la table.',
      location: 'Suites-Boutiques & Penthouses',
    },
  },
  'exp-laundry-1': {
    tr: {
      title: '6 Saatte Ekspres Yıkama, Katlama & Buharlı Ütü Vale',
      agentNote: 'Aynı gün otel resepsiyonundan teslim alınıp teslim edilen, hipoalerjenik yıkama, hassas kurutma ve özenli katlama hizmeti.',
      location: 'Kapıdan Kapıya Resepsiyon Teslim & İade',
    },
    ar: {
      title: 'خدمة غسيل وطي وكي بالبخار السريعة خلال 6 ساعات',
      agentNote: 'غسيل صديق للبيئة ومضاد للحساسية مع تجفيف دقيق وطي أنيق مع الاستلام والتسليم في نفس اليوم لفندقك.',
      location: 'استلام وتسليم عبر استقبال الفندق',
    },
    ru: {
      title: 'Экспресс-стирка, сушка и отпаривание за 6 часов',
      agentNote: 'Гипоаллергенная эко-стирка, бережная сушка и аккуратная глажка с забором и возвратом через ресепшен в тот же день.',
      location: 'Забор и доставка через ресепшен отеля',
    },
    de: {
      title: '6-Stunden-Express-Wäsche-, Falt- & Dampfservice',
      agentNote: 'Umweltfreundliche, hypoallergene Wäsche, schonende Trocknung und Abholung/Rückgabe am selben Tag über die Rezeption.',
      location: 'Abholung & Rückgabe an der Hotelrezeption',
    },
    fr: {
      title: 'Service Express 6h : Lavage, Pliage & Repassage Vapeur',
      agentNote: 'Lavage hypoallergénique écologique, séchage délicat et pliage soigné avec collecte et retour le jour même à la réception.',
      location: 'Collecte & Retour à la Réception de l’Hôtel',
    },
  },
  'exp-laundry-2': {
    tr: {
      title: 'Takım Elbise, İpek & Gece Elbisesi Kuru Temizleme',
      agentNote: 'Hassas ipek, kaşmir, keten ve özel dikim gece kıyafetleri için solvent içermeyen uzman kuru temizleme ve el ütüsü.',
      location: 'Kapıdan Kapıya Resepsiyon Teslim & İade',
    },
    ar: {
      title: 'تنظيف جاف للبدلات الرسمية والحرير وفساتين السهرة',
      agentNote: 'تنظيف جاف متخصص خالٍ من المذيبات القاسية وإنهاء يدوي للحرير والكشمير والكتان وملابس السهرة.',
      location: 'استلام وتسليم عبر استقبال الفندق',
    },
    ru: {
      title: 'Деликатная химчистка костюмов, шелка и вечерних платьев',
      agentNote: 'Профессиональная безрастворительная химчистка и ручная финишная обработка для шелка, кашемира и вечерних нарядов.',
      location: 'Забор и доставка через ресепшен отеля',
    },
    de: {
      title: 'Chemische Reinigung für Anzüge, Seide & Abendgarderobe',
      agentNote: 'Lösungsmittelfreie Spezialreinigung und Handfinish für empfindliche Seide, Kaschmir, Leinen und Abendmode.',
      location: 'Abholung & Rückgabe an der Hotelrezeption',
    },
    fr: {
      title: 'Nettoyage à Sec Haute Couture : Costumes, Soie & Robes de Soirée',
      agentNote: 'Nettoyage à sec écologique sans solvant et finition main pour soies délicates, cachemire, lin et tenues de soirée.',
      location: 'Collecte & Retour à la Réception de l’Hôtel',
    },
  },
  'exp-laundry-3': {
    tr: {
      title: '3 Saatte Ekspres Buharlı Ütü (5 Parçaya Kadar)',
      agentNote: 'Akşam yemeği rezervasyonları, davetler veya teras fotoğraf çekimleri öncesinde valiz kırışıklıklarını gideren hızlı profesyonel buharlı ütü.',
      location: 'Kapıdan Kapıya Resepsiyon Teslim & İade',
    },
    ar: {
      title: 'كي سريع بالبخار خلال 3 ساعات (حتى 5 قطع)',
      agentNote: 'إزالة سريعة لتجاعيد السفر وكي احترافي بالبخار قبل حجوزات العشاء أو جلسات التصوير.',
      location: 'استلام وتسليم عبر استقبال الفندق',
    },
    ru: {
      title: 'Экспресс-отпаривание за 3 часа (до 5 вещей)',
      agentNote: 'Быстрое профессиональное отпаривание одежды после чемодана перед ужином, мероприятием или фотосессией.',
      location: 'Забор и доставка через ресепшен отеля',
    },
    de: {
      title: '3-Stunden-Express-Dampfbügeln (bis zu 5 Kleidungsstücke)',
      agentNote: 'Schnelles professionelles Aufbügeln vor Dinner-Reservierungen, Galas oder Rooftop-Fotoshootings.',
      location: 'Abholung & Rückgabe an der Hotelrezeption',
    },
    fr: {
      title: 'Pressing Vapeur Express en 3h (Jusqu’à 5 Vêtements)',
      agentNote: 'Défroissage rapide de valise et repassage vapeur professionnel avant vos dîners, soirées ou séances photo.',
      location: 'Collecte & Retour à la Réception de l’Hôtel',
    },
  },
  'exp-laundry-4': {
    tr: {
      title: 'Lüks Deri Ayakkabı Bakımı, Süet & Çanta Yenileme',
      agentNote: 'Beyoğlu’nun usta zanaatkarları tarafından Saphir mum bakımı, süet fırçalama ve seyahat izi onarımı.',
      location: 'Kapıdan Kapıya Resepsiyon Teslim & İade',
    },
    ar: {
      title: 'تلميع الأحذية الجلدية الفاخرة وتجديد الشامواه والحقائب',
      agentNote: 'عناية يدوية بشمع Saphir وتنظيف الشامواه وإزالة آثار السفر على يد أمهر حرفيي الجلود في بيوغلو.',
      location: 'استلام وتسليم عبر استقبال الفندق',
    },
    ru: {
      title: 'Премиальный уход за кожаной обувью, замшей и сумками',
      agentNote: 'Ручной уход воском Saphir, чистка замши и обновление кожаных изделий от потомственных мастеров Бейоглу.',
      location: 'Забор и доставка через ресепшен отеля',
    },
    de: {
      title: 'Luxus-Lederschuhpflege, Wildleder- & Taschen-Refresh',
      agentNote: 'Handwerkliche Saphir-Wachspflege, Wildlederbürsten und Auffrischung durch Meisterhandwerker aus Beyoğlu.',
      location: 'Abholung & Rückgabe an der Hotelrezeption',
    },
    fr: {
      title: 'Soin des Souliers en Cuir, Daim & Rafraîchissement Maroquinerie',
      agentNote: 'Soin artisanal à la cire Saphir, brossage du daim et rénovation par les maîtres bottiers de Beyoğlu.',
      location: 'Collecte & Retour à la Réception de l’Hôtel',
    },
  },
};

export function localizeDuration(rawDuration: string, lang: Language): string {
  if (!rawDuration || lang === 'en') return rawDuration;
  const labels: Record<Exclude<Language, 'en'>, { hours: string; hour: string; min: string }> = {
    tr: { hours: 'Saat', hour: 'Saat', min: 'Dk' },
    ar: { hours: 'ساعات', hour: 'ساعة', min: 'دقيقة' },
    ru: { hours: 'ч.', hour: 'ч.', min: 'мин.' },
    de: { hours: 'Std.', hour: 'Std.', min: 'Min.' },
    fr: { hours: 'Heures', hour: 'Heure', min: 'Min' },
  };
  const l = labels[lang];
  return rawDuration
    .replace(/\b1\s*Hours?\b/gi, `1 ${l.hour}`)
    .replace(/\bHours\b/gi, l.hours)
    .replace(/\bHour\b/gi, l.hour)
    .replace(/\bMin\b/gi, l.min);
}

export function getLocalizedExperience(exp: Experience, lang: Language) {
  const trOverride = EXP_TRANSLATIONS[exp.id]?.[lang];
  return {
    title: trOverride?.title || exp.title,
    agentNote: trOverride?.agentNote || exp.agentNote,
    desc: trOverride?.agentNote || exp.desc || exp.agentNote,
    provider: trOverride?.provider || exp.provider,
    cuisine: trOverride?.cuisine || exp.cuisine,
    priceLevel: trOverride?.priceLevel || exp.priceLevel,
    specialties: trOverride?.specialties || exp.specialties,
    location: trOverride?.location || exp.location,
    duration: localizeDuration(exp.duration, lang),
  };
}

export function getLocalizedExperienceCategoryTag(exp: Experience, lang: Language): string {
  const t = getT(lang);
  if (exp.categoryKey) {
    const isRest = exp.category.toLowerCase().includes('restoran') || exp.id.startsWith('rest-');
    if (isRest) return t.categoriesList.restaurants.title;
    return getLocalizedCategoryTitle(exp.categoryKey, lang);
  }
  const raw = exp.categoryTag || (exp.category.includes('.') ? exp.category.split('.')[1].trim() : exp.category);
  const lower = raw.toLowerCase();
  if (lower.includes('estetik') || lower.includes('aesthetic') || lower.includes('güzellik') || exp.categoryTag === 'Aesthetic') return t.categoriesList.aesthetic?.title || raw;
  if (lower.includes('restoran')) return t.categoriesList.restaurants.title;
  if (lower.includes('boğaz') || lower.includes('yat') || lower.includes('bosphorus')) return t.categoriesList.bosphorus.title;
  if (lower.includes('tarih') || lower.includes('müze') || lower.includes('heritage') || lower.includes('mystic')) return t.categoriesList.history.title;
  if (lower.includes('gastro') || lower.includes('gurme') || lower.includes('foodie')) return t.categoriesList.gastronomy.title;
  if (lower.includes('günübirlik') || lower.includes('şehir dışı')) return (t.categoriesList as any).dayTrips?.title || raw;
  if (lower.includes('transfer') || lower.includes('vip')) return t.categoriesList.transfer.title;
  if (lower.includes('fotoğraf') || lower.includes('kostüm') || lower.includes('photo')) return t.categoriesList.photo.title;
  if (lower.includes('gece hayatı') || lower.includes('pub crawl')) return (t.categoriesList as any).nightlife?.title || raw;
  if (lower.includes('alışveriş') || lower.includes('çarşı') || lower.includes('shopping')) return t.categoriesList.shopping.title;
  if (lower.includes('aile') || lower.includes('çocuk') || lower.includes('eğlence')) return (t.categoriesList as any).family?.title || raw;
  if (lower.includes('semazen') || lower.includes('sanat') || lower.includes('art')) return t.categoriesList.art.title;
  if (lower.includes('kültür') || lower.includes('miras') || lower.includes('culture')) return t.categoriesList.culture.title;
  if (lower.includes('macera') || lower.includes('doğa')) return t.categoriesList.adventure.title;
  if (lower.includes('hamam') || lower.includes('spa') || lower.includes('wellness')) return t.categoriesList.hamam.title;
  if (lower.includes('yatırım') || lower.includes('invest')) return t.categoriesList.invest.title;
  return getLocalizedCategoryTitle(raw, lang);
}

export interface ExperienceUiLabels {
  bookAppointment: string;
  requestInfo: string;
  websiteMenu: string;
  verifiedRestaurant: string;
  purelyGuarantee: string;
  purelyApprovedVenue: string;
  copiedLink: string;
  addedToFavorites: string;
  removedFromFavorites: string;
  back: string;
  share: string;
  addToFavorites: string;
  directions: string;
  buildSteps: (params: { isRestaurant: boolean; title: string; provider: string; cuisine?: string }) => { title: string; desc: string }[];
}

export const EXPERIENCE_UI_I18N: Record<Language, ExperienceUiLabels> = {
  tr: {
    bookAppointment: 'Randevu Oluştur',
    requestInfo: 'Bilgi Almak İstiyorum',
    websiteMenu: 'Web Sitesi / Menü',
    verifiedRestaurant: 'Doğrulanmış Restoran',
    purelyGuarantee: 'purelyİstanbul Güvencesi',
    purelyApprovedVenue: 'purelyİstanbul Onaylı Mekan',
    copiedLink: 'Bağlantı kopyalandı!',
    addedToFavorites: 'Favorilere eklendi!',
    removedFromFavorites: 'Favorilerden çıkarıldı',
    back: 'Geri Dön',
    share: 'Paylaş',
    addToFavorites: 'Favorilere Ekle',
    directions: 'Yol Tarifi',
    buildSteps: ({ isRestaurant, title, provider, cuisine }) => [
      {
        title: isRestaurant ? 'Masa Rezervasyonu & Karşılama' : 'Buluşma & Sıcak Karşılama',
        desc: isRestaurant
          ? `${title} ekibi tarafından kapıda karşılama ve ayrılan masanıza yerleşim.`
          : `${provider} ekibi tarafından belirlenen noktada Türk çayı veya ikramlarla samimi bir karşılama.`,
      },
      {
        title: isRestaurant ? 'Menü & Gurme Tadım Rehberi' : 'Tarih ve Zanaat Hikayesi',
        desc: isRestaurant
          ? `${cuisine || 'Şef'} imzalı mevsimlik lezzetler ve imza spesiyallerin tanıtımı.`
          : 'Uzman rehber ve zanaatkarlardan deneyimin köklü İstanbul tarihi ve inceliklerini öğrenin.',
      },
      {
        title: isRestaurant ? 'Ana Lezzet & Gastronomi Şöleni' : 'Uygulama & Ana Deneyim',
        desc: isRestaurant
          ? 'Taze yerel malzemeler ve usta şefler tarafından hazırlanan özel tabakların sunumu.'
          : `Rehberlik eşliğinde ${title} sürecine bizzat dahil olun.`,
      },
      {
        title: isRestaurant ? 'Geleneksel Tatlı & İkramlar' : 'İkramlar & Fotoğraf Çekimi',
        desc: isRestaurant
          ? 'İstanbul usulü kahve veya geleneksel tatlı ikramlarıyla lezzet deneyiminin tamamlanması.'
          : 'Geleneksel Türk lezzetlerinin tadını çıkarırken unutulmaz anı fotoğrafları çekilin.',
      },
    ],
  },
  en: {
    bookAppointment: 'Book Appointment',
    requestInfo: 'Request Info',
    websiteMenu: 'Website / Menu',
    verifiedRestaurant: 'Verified Restaurant',
    purelyGuarantee: 'purelyİstanbul Guarantee',
    purelyApprovedVenue: 'purelyİstanbul Verified Partner',
    copiedLink: 'Link copied!',
    addedToFavorites: 'Added to favorites!',
    removedFromFavorites: 'Removed from favorites',
    back: 'Back',
    share: 'Share',
    addToFavorites: 'Add to Favorites',
    directions: 'Directions',
    buildSteps: ({ isRestaurant, title, provider, cuisine }) => [
      {
        title: isRestaurant ? 'Table Reservation & Welcome' : 'Meet & Warm Welcome',
        desc: isRestaurant
          ? `Personal welcome at the entrance by the ${title} team and seating at your reserved table.`
          : `Warm welcome by ${provider} at the designated meeting point with traditional Turkish tea or refreshments.`,
      },
      {
        title: isRestaurant ? 'Menu & Sommelier Introduction' : 'Heritage & Craft Story',
        desc: isRestaurant
          ? `Introduction to seasonal highlights and signature specialties of ${cuisine || "the Chef's kitchen"}.`
          : 'Discover the deep Istanbul heritage and artisanal secrets behind the experience with licensed specialists.',
      },
      {
        title: isRestaurant ? 'Main Culinary Experience' : 'Main Curated Experience',
        desc: isRestaurant
          ? 'Presentation of signature dishes crafted with fresh local Anatolian ingredients by master chefs.'
          : `Immerse yourself directly in the ${title} experience with dedicated guidance.`,
      },
      {
        title: isRestaurant ? 'Traditional Dessert & Digestif' : 'Refreshments & Memorable Photos',
        desc: isRestaurant
          ? 'Conclude your dining journey with traditional Turkish coffee or artisan desserts.'
          : 'Capture unforgettable memories while enjoying authentic local treats.',
      },
    ],
  },
  ar: {
    bookAppointment: 'حجز موعد',
    requestInfo: 'طلب معلومات',
    websiteMenu: 'الموقع الإلكتروني / القائمة',
    verifiedRestaurant: 'مطعم معتمد',
    purelyGuarantee: 'ضمان purelyİstanbul',
    purelyApprovedVenue: 'وجهة معتمدة من purelyİstanbul',
    copiedLink: 'تم نسخ الرابط!',
    addedToFavorites: 'تمت الإضافة إلى المفضلة!',
    removedFromFavorites: 'تمت الإزالة من المفضلة',
    back: 'رجوع',
    share: 'مشاركة',
    addToFavorites: 'إضافة إلى المفضلة',
    directions: 'الاتجاهات',
    buildSteps: ({ isRestaurant, title, provider, cuisine }) => [
      {
        title: isRestaurant ? 'حجز الطاولة والاستقبال' : 'اللقاء والترحيب الحار',
        desc: isRestaurant
          ? `استقبال خاص عند المدخل من قبل فريق ${title} والجلوس في طاولتك المحجوزة.`
          : `ترحيب حار من فريق ${provider} في نقطة الالتقاء المحددة مع ضيافة الشاي التركي.`,
      },
      {
        title: isRestaurant ? 'تعريف بالقائمة والأطباق المميزة' : 'قصة التاريخ والحرفية',
        desc: isRestaurant
          ? `التعرف على النكهات الموسمية والأطباق الخاصة من ${cuisine || 'مطبخ الشيف'}.`
          : 'تعرّف على تاريخ إسطنبول العريق وتفاصيل التجربة مع مرشدين وحرفيين متخصصين.',
      },
      {
        title: isRestaurant ? 'التجربة الذوقية الرئيسية' : 'التجربة الرئيسية',
        desc: isRestaurant
          ? 'تقديم الأطباق الخاصة المحضرة من مكونات محلية طازجة على يد أمهر الطهاة.'
          : `استمتع بتجربة ${title} بكل تفاصيلها برفقة إرشاد متخصص.`,
      },
      {
        title: isRestaurant ? 'الحلوى التقليدية والضيافة' : 'الضيافة والتقاط الصور التذكارية',
        desc: isRestaurant
          ? 'اختتام تجربة الطعام بالقهوة التركية التقليدية أو الحلويات الفاخرة.'
          : 'التقط صوراً تذكارية لا تُنسى أثناء الاستمتاع بالضيافة التركية الأصيلة.',
      },
    ],
  },
  ru: {
    bookAppointment: 'Записаться',
    requestInfo: 'Запросить инфо',
    websiteMenu: 'Сайт / Меню',
    verifiedRestaurant: 'Проверенный ресторан',
    purelyGuarantee: 'Гарантия purelyİstanbul',
    purelyApprovedVenue: 'Одобрено purelyİstanbul',
    copiedLink: 'Ссылка скопирована!',
    addedToFavorites: 'Добавлено в избранное!',
    removedFromFavorites: 'Удалено из избранного',
    back: 'Назад',
    share: 'Поделиться',
    addToFavorites: 'В избранное',
    directions: 'Маршрут',
    buildSteps: ({ isRestaurant, title, provider, cuisine }) => [
      {
        title: isRestaurant ? 'Бронирование стола и встреча' : 'Встреча и теплое приветствие',
        desc: isRestaurant
          ? `Персональная встреча у входа командой ${title} и размещение за вашим забронированным столиком.`
          : `Радушный прием от команды ${provider} на месте встречи с традиционным турецким чаем или угощениями.`,
      },
      {
        title: isRestaurant ? 'Знакомство с меню и специалитетами' : 'История и традиции мастерства',
        desc: isRestaurant
          ? `Презентация сезонных блюд и фирменных специалитетов (${cuisine || 'авторская кухня шефа'}).`
          : 'Узнайте богатую историю Стамбула и тонкости ремесла от лицензированных гидов и мастеров.',
      },
      {
        title: isRestaurant ? 'Основная гастрономическая часть' : 'Основная программа впечатления',
        desc: isRestaurant
          ? 'Подача авторских блюд из свежайших локальных продуктов от шеф-поваров.'
          : `Погрузитесь в атмосферу «${title}» в сопровождении экспертов.`,
      },
      {
        title: isRestaurant ? 'Традиционный десерт и комплименты' : 'Угощения и памятные фотографии',
        desc: isRestaurant
          ? 'Завершение вечера традиционным кофе по-стамбульски или фирменными десертами.'
          : 'Сделайте незабываемые фотографии, наслаждаясь традиционными турецкими угощениями.',
      },
    ],
  },
  de: {
    bookAppointment: 'Termin buchen',
    requestInfo: 'Info anfordern',
    websiteMenu: 'Webseite / Menü',
    verifiedRestaurant: 'Geprüftes Restaurant',
    purelyGuarantee: 'purelyİstanbul-Garantie',
    purelyApprovedVenue: 'purelyİstanbul-Partner',
    copiedLink: 'Link kopiert!',
    addedToFavorites: 'Zu Favoriten hinzugefügt!',
    removedFromFavorites: 'Aus Favoriten entfernt',
    back: 'Zurück',
    share: 'Teilen',
    addToFavorites: 'Zu Favoriten',
    directions: 'Route',
    buildSteps: ({ isRestaurant, title, provider, cuisine }) => [
      {
        title: isRestaurant ? 'Tischreservierung & Empfang' : 'Treffpunkt & Herzlicher Empfang',
        desc: isRestaurant
          ? `Persönlicher Empfang durch das Team von ${title} und Begleitung zu Ihrem reservierten Tisch.`
          : `Herzlicher Empfang durch ${provider} am vereinbarten Treffpunkt mit türkischem Tee oder Erfrischungen.`,
      },
      {
        title: isRestaurant ? 'Menü- & Spezialitäten-Einführung' : 'Geschichte & Handwerkskunst',
        desc: isRestaurant
          ? `Vorstellung saisonaler Highlights und Signature-Gerichte (${cuisine || 'Empfehlung des Küchenchefs'}).`
          : 'Erfahren Sie von lizenzierten Experten alles über die Geschichte und Traditionen hinter dem Erlebnis.',
      },
      {
        title: isRestaurant ? 'Kulinarisches Hauptprogramm' : 'Haupterlebnis & Durchführung',
        desc: isRestaurant
          ? 'Präsentation ausgewählter Spezialitäten aus frischen regionalen Zutaten.'
          : `Erleben Sie „${title}“ hautnah unter fachkundiger Begleitung.`,
      },
      {
        title: isRestaurant ? 'Traditionelles Dessert & Ausklang' : 'Erfrischungen & Erinnerungsfotos',
        desc: isRestaurant
          ? 'Abrundung des kulinarischen Erlebnisses mit traditionellem Mokka oder hausgemachten Desserts.'
          : 'Halten Sie unvergessliche Erinnerungen fest, während Sie lokale Köstlichkeiten genießen.',
      },
    ],
  },
  fr: {
    bookAppointment: 'Prendre RDV',
    requestInfo: 'Demander des infos',
    websiteMenu: 'Site Web / Menu',
    verifiedRestaurant: 'Restaurant Vérifié',
    purelyGuarantee: 'Garantie purelyİstanbul',
    purelyApprovedVenue: 'Partenaire Certifié purelyİstanbul',
    copiedLink: 'Lien copié !',
    addedToFavorites: 'Ajouté aux favoris !',
    removedFromFavorites: 'Retiré des favoris',
    back: 'Retour',
    share: 'Partager',
    addToFavorites: 'Ajouter aux favoris',
    directions: 'Itinéraire',
    buildSteps: ({ isRestaurant, title, provider, cuisine }) => [
      {
        title: isRestaurant ? 'Réservation de Table & Accueil' : 'Rencontre & Accueil Chaleureux',
        desc: isRestaurant
          ? `Accueil personnalisé par l’équipe de ${title} et installation à votre table réservée.`
          : `Accueil chaleureux par ${provider} au point de rencontre avec thé turc ou rafraîchissements.`,
      },
      {
        title: isRestaurant ? 'Présentation du Menu & Spécialités' : 'Histoire & Savoir-Faire',
        desc: isRestaurant
          ? `Découverte des créations de saison et spécialités signatures (${cuisine || 'Cuisine du Chef'}).`
          : 'Découvrez l’histoire stambouliote et les secrets artisanaux avec nos spécialistes certifiés.',
      },
      {
        title: isRestaurant ? 'Expérience Gastronomique Principale' : 'Expérience Principale',
        desc: isRestaurant
          ? 'Service des plats signatures préparés à partir de produits locaux frais par les chefs.'
          : `Vivez pleinement l’expérience « ${title} » avec un accompagnement dédié.`,
      },
      {
        title: isRestaurant ? 'Dessert Traditionnel & Mignardises' : 'Douceurs & Photos Souvenirs',
        desc: isRestaurant
          ? 'Clôture du repas autour d’un café turc traditionnel ou de desserts maison.'
          : 'Immortalisez des souvenirs inoubliables tout en dégustant des spécialités locales.',
      },
    ],
  },
};
