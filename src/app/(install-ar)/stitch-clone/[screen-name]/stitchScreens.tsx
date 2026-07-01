import type { JSX } from "react";

function Screen_home(): JSX.Element {
  return (
    <div className={"bg-background text-on-background font-body-md antialiased rtl"} data-stitch-source={"kmt_legal_21"}>
      <style dangerouslySetInnerHTML={{ __html: "@layer utilities {\n            .rtl { direction: rtl; }\n            .ltr { direction: ltr; }\n        }" }} />
      <>
        {/* TopNavBar */}
        <nav className="bg-surface-container-lowest dark:bg-surface-container-lowest w-full top-0 sticky border-b border-outline-variant dark:border-outline flat no shadows z-50">
        <div className="flex justify-between items-center px-margin-desktop max-w-container-max mx-auto h-20 rtl">
        {/* Brand */}
        <div className="text-headline-md font-headline-md text-primary dark:text-on-primary-fixed cursor-pointer active:opacity-80">
                        KMT Legal
                    </div>
        {/* Navigation Links (Desktop) */}
        <ul className="hidden md:flex gap-6 items-center">
        <li><a className="text-secondary font-bold border-b-2 border-secondary pb-1 hover:text-secondary transition-colors duration-200 font-body-md text-body-md" href="#">Practice Areas</a></li>
        <li><a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 font-body-md text-body-md" href="#">Our Team</a></li>
        <li><a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 font-body-md text-body-md" href="#">Insights</a></li>
        <li><a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 font-body-md text-body-md" href="#">Contact</a></li>
        </ul>
        {/* Actions */}
        <div className="flex items-center gap-4">
        <div className="flex gap-2">
        <button className="text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80 p-2">
        <span className="material-symbols-outlined" data-icon="search">search</span>
        </button>
        <button className="text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80 p-2 hidden sm:block">
        <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
        </button>
        </div>
        <div className="h-6 w-px bg-outline-variant mx-2 hidden sm:block"></div>
        <button className="text-secondary dark:text-secondary-fixed font-label-sm text-label-sm uppercase hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80">
                            EN
                        </button>
        <button className="bg-secondary text-on-secondary px-6 py-2 rounded font-body-md text-body-md hover:opacity-90 transition-opacity cursor-pointer active:opacity-80 ml-4 hidden sm:block">
                            Book Consultation
                        </button>
        <img alt="User profile" className="w-10 h-10 rounded-full border border-outline-variant object-cover ml-2 cursor-pointer" data-alt="A professional headshot of a legal consultant in a well-lit office, wearing a dark navy suit. The image is cropped to a small circle, set against a subtle, light gray background typical of a corporate modern UI." src="/stitch-assets/c1a0b4cedd2485e4.png"/>
        </div>
        </div>
        </nav>
        {/* Main Content */}
        <main>
        {/* Hero Section */}
        <section className="relative bg-surface-container-lowest overflow-hidden py-stack-lg md:py-16">
        <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 md:grid-cols-12 gap-gutter items-center min-h-[680px]">
        {/* Hero Text (Right Side in RTL, so Col Span 7) */}
        <div className="md:col-span-6 lg:col-span-7 flex flex-col gap-stack-md z-10 relative">
        <div className="inline-flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full w-max mb-4 border border-outline-variant">
        <span className="material-symbols-outlined text-secondary text-sm" data-icon="gavel">gavel</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">مكتب محاماة مرخص</span>
        </div>
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary leading-tight">
                                مكتب محاماة عصري يجمع الخبرة القانونية مع <span className="text-secondary">التنظيم الذكي</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-4 max-w-2xl">
                                احجز استشارتك، ارفع مستنداتك، وتابع مواعيدك وقضاياك من مكان واحد. نحن نقدم حلولاً قانونية متكاملة بلمسة عصرية تضمن لك الشفافية والأمان.
                            </p>
        <div className="flex flex-wrap gap-4 mt-8">
        <button className="bg-secondary text-on-secondary px-8 py-3 rounded-DEFAULT font-body-md text-body-md hover:bg-secondary/90 transition-colors shadow-sm flex items-center gap-2">
                                    احجز استشارة
                                    <span className="material-symbols-outlined text-sm ltr:rotate-180" data-icon="arrow_forward">arrow_forward</span>
        </button>
        <button className="bg-transparent border border-primary text-primary px-8 py-3 rounded-DEFAULT font-body-md text-body-md hover:bg-surface-container-low transition-colors flex items-center gap-2">
                                    تعرف على فريقنا
                                </button>
        </div>
        <div className="mt-12 flex items-center gap-6 border-t border-outline-variant pt-6">
        <div className="flex -space-x-4 ltr:space-x-reverse rtl:-space-x-4 rtl:space-x-reverse">
        <img alt="Client" className="w-10 h-10 rounded-full border-2 border-surface-container-lowest object-cover" data-alt="A small circular portrait of a professional corporate lawyer in a modern office. Bright, clean light mode aesthetic." src="/stitch-assets/e981dde636879377.png"/>
        <img alt="Client" className="w-10 h-10 rounded-full border-2 border-surface-container-lowest object-cover" data-alt="A small circular portrait of a smiling female legal consultant. Professional corporate modern aesthetic." src="/stitch-assets/9b72451d7cb0ea68.png"/>
        <img alt="Client" className="w-10 h-10 rounded-full border-2 border-surface-container-lowest object-cover" data-alt="A small circular portrait of a senior partner in a law firm. Minimalist, premium white background." src="/stitch-assets/7c170521b833edff.png"/>
        </div>
        <div>
        <p className="font-body-md text-body-md font-bold text-primary">+500 عميل يثقون بنا</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">في مختلف القطاعات</p>
        </div>
        </div>
        </div>
        {/* Hero Visual (Left Side) */}
        <div className="md:col-span-6 lg:col-span-5 relative mt-12 md:mt-0 z-0">
        {/* Premium Visual Placeholder */}
        <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-surface-container border border-outline-variant shadow-sm flex flex-col">
        <div className="h-12 bg-surface-container-low border-b border-outline-variant flex items-center px-4 gap-2">
        <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
        <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
        <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
        </div>
        <div className="flex-1 bg-surface-container-lowest p-6 flex flex-col gap-4">
        {/* Simulated AI Intake UI */}
        <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center">
        <span className="material-symbols-outlined text-secondary" data-icon="smart_toy">smart_toy</span>
        </div>
        <div>
        <h3 className="font-body-md text-body-md font-bold text-primary">المساعد القانوني الذكي</h3>
        <p className="font-label-sm text-label-sm text-on-surface-variant">جاهز لاستقبال استفسارك</p>
        </div>
        </div>
        <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant self-start max-w-[85%]">
        <p className="font-body-md text-body-md text-on-surface-variant">مرحباً بك في KMT Legal. كيف يمكنني مساعدتك اليوم؟</p>
        </div>
        <div className="bg-primary text-on-primary p-4 rounded-lg self-end max-w-[85%] mt-2">
        <p className="font-body-md text-body-md">أريد حجز استشارة بخصوص تأسيس شركة جديدة.</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant self-start max-w-[85%] mt-2">
        <p className="font-body-md text-body-md text-on-surface-variant mb-3">بالتأكيد، يمكنني ترتيب ذلك. يرجى اختيار الموعد المناسب:</p>
        <div className="flex gap-2 mt-2">
        <span className="px-3 py-1 bg-surface-container-lowest border border-outline-variant rounded font-label-sm text-label-sm cursor-pointer hover:border-secondary">غداً 10:00 ص</span>
        <span className="px-3 py-1 bg-secondary text-on-secondary border border-secondary rounded font-label-sm text-label-sm cursor-pointer">غداً 2:00 م</span>
        </div>
        </div>
        {/* Trust Indicator Overlay */}
        <div className="absolute bottom-6 right-6 left-6 bg-surface-container-lowest/90 backdrop-blur-sm p-4 rounded-lg border border-outline-variant shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-secondary" data-icon="verified_user">verified_user</span>
        </div>
        <div>
        <p className="font-label-sm text-label-sm font-bold text-primary">تشفير تام</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">بياناتك محمية بالكامل</p>
        </div>
        </div>
        <span className="material-symbols-outlined text-secondary" data-icon="lock">lock</span>
        </div>
        </div>
        </div>
        </div>
        </div>
        </section>
        {/* Services Preview Section */}
        <section className="py-stack-lg bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-desktop">
        <div className="text-center mb-12">
        <h2 className="font-headline-md text-headline-md text-primary font-bold">مجالات التخصص</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-2xl mx-auto">نقدم خدمات قانونية متخصصة تلبي احتياجات الأفراد والشركات بأعلى معايير الجودة.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {/* Service Card 1 */}
        <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant hover:border-secondary transition-colors group cursor-pointer">
        <div className="w-12 h-12 rounded bg-surface-container-low flex items-center justify-center mb-4 group-hover:bg-secondary/10 transition-colors">
        <span className="material-symbols-outlined text-primary group-hover:text-secondary" data-icon="domain">domain</span>
        </div>
        <h3 className="font-body-lg text-body-lg text-primary font-bold mb-2">قضايا الشركات</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4">تأسيس الشركات، العقود التجارية، والاستشارات القانونية للشركات الناشئة والكبرى.</p>
        <a className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm hover:underline" href="#">
                                    اقرأ المزيد
                                    <span className="material-symbols-outlined text-sm ltr:rotate-180" data-icon="arrow_forward">arrow_forward</span>
        </a>
        </div>
        {/* Service Card 2 */}
        <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant hover:border-secondary transition-colors group cursor-pointer">
        <div className="w-12 h-12 rounded bg-surface-container-low flex items-center justify-center mb-4 group-hover:bg-secondary/10 transition-colors">
        <span className="material-symbols-outlined text-primary group-hover:text-secondary" data-icon="family_home">family_home</span>
        </div>
        <h3 className="font-body-lg text-body-lg text-primary font-bold mb-2">قضايا الأسرة</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4">النزاعات الأسرية، المواريث، والأحوال الشخصية بسرية تامة واحترافية.</p>
        <a className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm hover:underline" href="#">
                                    اقرأ المزيد
                                    <span className="material-symbols-outlined text-sm ltr:rotate-180" data-icon="arrow_forward">arrow_forward</span>
        </a>
        </div>
        {/* Service Card 3 */}
        <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant hover:border-secondary transition-colors group cursor-pointer">
        <div className="w-12 h-12 rounded bg-surface-container-low flex items-center justify-center mb-4 group-hover:bg-secondary/10 transition-colors">
        <span className="material-symbols-outlined text-primary group-hover:text-secondary" data-icon="balance">balance</span>
        </div>
        <h3 className="font-body-lg text-body-lg text-primary font-bold mb-2">القضايا الجنائية</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4">تمثيل قانوني قوي ودفاع استراتيجي في مختلف أنواع القضايا الجنائية.</p>
        <a className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm hover:underline" href="#">
                                    اقرأ المزيد
                                    <span className="material-symbols-outlined text-sm ltr:rotate-180" data-icon="arrow_forward">arrow_forward</span>
        </a>
        </div>
        {/* Service Card 4 */}
        <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant hover:border-secondary transition-colors group cursor-pointer">
        <div className="w-12 h-12 rounded bg-surface-container-low flex items-center justify-center mb-4 group-hover:bg-secondary/10 transition-colors">
        <span className="material-symbols-outlined text-primary group-hover:text-secondary" data-icon="real_estate_agent">real_estate_agent</span>
        </div>
        <h3 className="font-body-lg text-body-lg text-primary font-bold mb-2">العقارات</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4">النزاعات العقارية، عقود الإيجار والبيع، والاستشارات المتعلقة بالتطوير العقاري.</p>
        <a className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm hover:underline" href="#">
                                    اقرأ المزيد
                                    <span className="material-symbols-outlined text-sm ltr:rotate-180" data-icon="arrow_forward">arrow_forward</span>
        </a>
        </div>
        {/* Service Card 5 */}
        <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant hover:border-secondary transition-colors group cursor-pointer">
        <div className="w-12 h-12 rounded bg-surface-container-low flex items-center justify-center mb-4 group-hover:bg-secondary/10 transition-colors">
        <span className="material-symbols-outlined text-primary group-hover:text-secondary" data-icon="history_edu">history_edu</span>
        </div>
        <h3 className="font-body-lg text-body-lg text-primary font-bold mb-2">صياغة العقود</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4">صياغة ومراجعة كافة أنواع العقود لضمان الحماية القانونية التامة لحقوقك.</p>
        <a className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm hover:underline" href="#">
                                    اقرأ المزيد
                                    <span className="material-symbols-outlined text-sm ltr:rotate-180" data-icon="arrow_forward">arrow_forward</span>
        </a>
        </div>
        {/* Service Card 6 */}
        <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant hover:border-secondary transition-colors group cursor-pointer">
        <div className="w-12 h-12 rounded bg-surface-container-low flex items-center justify-center mb-4 group-hover:bg-secondary/10 transition-colors">
        <span className="material-symbols-outlined text-primary group-hover:text-secondary" data-icon="request_quote">request_quote</span>
        </div>
        <h3 className="font-body-lg text-body-lg text-primary font-bold mb-2">التحصيل التجاري</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4">إجراءات فعالة لتحصيل الديون والمستحقات المالية للشركات والأفراد.</p>
        <a className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm hover:underline" href="#">
                                    اقرأ المزيد
                                    <span className="material-symbols-outlined text-sm ltr:rotate-180" data-icon="arrow_forward">arrow_forward</span>
        </a>
        </div>
        </div>
        </div>
        </section>
        {/* Footer */}
        <footer className="bg-surface-container-highest dark:bg-surface-container-highest w-full bottom-0 bg-surface-container-highest flat no shadows">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop py-stack-lg max-w-container-max mx-auto rtl">
        {/* Brand Info */}
        <div className="flex flex-col gap-4">
        <div className="text-headline-md font-headline-md text-primary">KMT Legal</div>
        <p className="font-body-md text-body-md text-on-surface-variant">مكتب محاماة عصري يجمع الخبرة القانونية مع التنظيم الذكي لتقديم أفضل الخدمات.</p>
        </div>
        {/* Links: Practice Areas */}
        <div className="flex flex-col gap-4">
        <h4 className="font-body-lg text-body-lg text-primary font-bold">مجالات التخصص</h4>
        <ul className="flex flex-col gap-2">
        <li><a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-opacity duration-300" href="#">قضايا الشركات</a></li>
        <li><a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-opacity duration-300" href="#">القضايا الجنائية</a></li>
        <li><a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-opacity duration-300" href="#">صياغة العقود</a></li>
        </ul>
        </div>
        {/* Links: Quick Links */}
        <div className="flex flex-col gap-4">
        <h4 className="font-body-lg text-body-lg text-primary font-bold">روابط سريعة</h4>
        <ul className="flex flex-col gap-2">
        <li><a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Privacy Policy</a></li>
        <li><a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Terms of Service</a></li>
        <li><a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Office Locations</a></li>
        <li><a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Careers</a></li>
        </ul>
        </div>
        {/* Contact Info */}
        <div className="flex flex-col gap-4">
        <h4 className="font-body-lg text-body-lg text-primary font-bold">تواصل معنا</h4>
        <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-sm" data-icon="location_on">location_on</span>
                                شارع العليا، الرياض، المملكة العربية السعودية
                            </p>
        <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-sm" data-icon="mail">mail</span>
                                info@kmtlegal.com
                            </p>
        </div>
        </div>
        {/* Copyright */}
        <div className="border-t border-outline-variant">
        <div className="px-margin-desktop py-4 max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="font-body-md text-body-md text-on-surface-variant text-center md:text-right">
                                © 2024 KMT Legal. All rights reserved. Licensed by the Ministry of Justice.
                            </p>
        <div className="flex gap-4">
        <a className="text-on-surface-variant hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined" data-icon="language">language</span></a>
        </div>
        </div>
        </div>
        </footer>
        </main>
      </>
    </div>
  );
}

function Screen_services(): JSX.Element {
  return (
    <div className={"bg-background text-on-background font-body-md min-h-screen flex flex-col"} data-stitch-source={"kmt_legal_20"}>
      <style dangerouslySetInnerHTML={{ __html: ".material-symbols-outlined {\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\n        }" }} />
      <>
        {/* TopNavBar */}
        <nav className="bg-surface-container-lowest dark:bg-surface-container-lowest text-secondary dark:text-secondary-fixed font-body-md text-body-md w-full top-0 sticky border-b border-outline-variant dark:border-outline flat no shadows z-50">
        <div className="flex justify-between items-center px-margin-desktop max-w-container-max mx-auto h-20 rtl">
        {/* Brand */}
        <div className="text-headline-md font-headline-md text-primary dark:text-on-primary-fixed flex items-center gap-2 cursor-pointer">
        <span>KMT Legal</span>
        </div>
        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-gutter">
        <a className="text-secondary font-bold border-b-2 border-secondary pb-1 cursor-pointer active:opacity-80" href="#">Practice Areas</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Our Team</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Insights</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Contact</a>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-stack-md">
        <button className="hidden md:flex items-center justify-center p-2 text-on-surface-variant hover:text-secondary transition-colors rounded-full hover:bg-surface-container-low">
        <span className="material-symbols-outlined">search</span>
        </button>
        <button className="hidden md:flex items-center justify-center p-2 text-on-surface-variant hover:text-secondary transition-colors rounded-full hover:bg-surface-container-low">
        <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="text-on-surface-variant hover:text-secondary font-label-sm text-label-sm transition-colors uppercase">EN</button>
        <button className="bg-secondary text-on-secondary px-6 py-2 rounded-lg font-body-md hover:bg-opacity-90 transition-opacity">Book Consultation</button>
        </div>
        </div>
        </nav>
        {/* Main Content Canvas */}
        <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col gap-stack-lg">
        {/* Hero Section */}
        <section className="text-center py-12 md:py-20 flex flex-col items-center justify-center relative overflow-hidden rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(#000000 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
        <div className="relative z-10 max-w-2xl px-4">
        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-6 leading-tight">خدمات قانونية متخصصة للأفراد والشركات</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">نقدم حلولاً قانونية شاملة ومصممة خصيصاً لتلبية احتياجاتك بدقة واحترافية.</p>
        {/* Search Bar */}
        <div className="relative w-full max-w-md mx-auto mb-8">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <span className="material-symbols-outlined text-outline">search</span>
        </div>
        <input className="w-full pl-4 pr-10 py-3 bg-surface text-on-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none font-body-md text-body-md placeholder-outline-variant shadow-sm" placeholder="ابحث عن خدمة قانونية..." type="text"/>
        </div>
        {/* Chips */}
        <div className="flex flex-wrap justify-center gap-3">
        <button className="px-4 py-1.5 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm border border-secondary transition-colors">الكل</button>
        <button className="px-4 py-1.5 rounded-full bg-surface-container-lowest text-on-surface-variant border border-outline-variant font-label-sm text-label-sm hover:bg-surface-container-low transition-colors">أفراد</button>
        <button className="px-4 py-1.5 rounded-full bg-surface-container-lowest text-on-surface-variant border border-outline-variant font-label-sm text-label-sm hover:bg-surface-container-low transition-colors">شركات</button>
        <button className="px-4 py-1.5 rounded-full bg-surface-container-lowest text-on-surface-variant border border-outline-variant font-label-sm text-label-sm hover:bg-surface-container-low transition-colors">عقارات</button>
        <button className="px-4 py-1.5 rounded-full bg-surface-container-lowest text-on-surface-variant border border-outline-variant font-label-sm text-label-sm hover:bg-surface-container-low transition-colors">أسرة</button>
        <button className="px-4 py-1.5 rounded-full bg-surface-container-lowest text-on-surface-variant border border-outline-variant font-label-sm text-label-sm hover:bg-surface-container-low transition-colors">جنائي</button>
        <button className="px-4 py-1.5 rounded-full bg-surface-container-lowest text-on-surface-variant border border-outline-variant font-label-sm text-label-sm hover:bg-surface-container-low transition-colors">تجاري</button>
        </div>
        </div>
        </section>
        {/* Services Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {/* Card 1 */}
        <div className="group bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col h-full">
        <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center mb-4 group-hover:bg-secondary-container transition-colors">
        <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-primary mb-2">القانون الجنائي</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">دفاع متخصص في القضايا الجنائية مع ضمان حماية حقوقك في كل مرحلة.</p>
        <button className="flex items-center gap-2 text-secondary font-label-sm text-label-sm group-hover:underline mt-auto">
        <span>اعرف التفاصيل</span>
        <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
        </button>
        </div>
        {/* Card 2 */}
        <div className="group bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col h-full">
        <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center mb-4 group-hover:bg-secondary-container transition-colors">
        <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>domain</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-primary mb-2">تأسيس الشركات</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">خدمات متكاملة لتأسيس الشركات وتسجيل العلامات التجارية وحوكمة الشركات.</p>
        <button className="flex items-center gap-2 text-secondary font-label-sm text-label-sm group-hover:underline mt-auto">
        <span>اعرف التفاصيل</span>
        <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
        </button>
        </div>
        {/* Card 3 */}
        <div className="group bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col h-full">
        <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center mb-4 group-hover:bg-secondary-container transition-colors">
        <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>family_home</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-primary mb-2">قانون الأسرة</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">استشارات قانونية في قضايا الأحوال الشخصية، الزواج، الطلاق، والمواريث.</p>
        <button className="flex items-center gap-2 text-secondary font-label-sm text-label-sm group-hover:underline mt-auto">
        <span>اعرف التفاصيل</span>
        <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
        </button>
        </div>
        {/* Card 4 */}
        <div className="group bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col h-full">
        <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center mb-4 group-hover:bg-secondary-container transition-colors">
        <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>real_estate_agent</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-primary mb-2">القانون العقاري</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">تمثيل قانوني في النزاعات العقارية وصياغة عقود البيع والشراء والإيجار.</p>
        <button className="flex items-center gap-2 text-secondary font-label-sm text-label-sm group-hover:underline mt-auto">
        <span>اعرف التفاصيل</span>
        <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
        </button>
        </div>
        {/* Card 5 */}
        <div className="group bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col h-full">
        <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center mb-4 group-hover:bg-secondary-container transition-colors">
        <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>contract</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-primary mb-2">صياغة العقود</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">صياغة ومراجعة العقود التجارية والمدنية بدقة لضمان حماية مصالحك.</p>
        <button className="flex items-center gap-2 text-secondary font-label-sm text-label-sm group-hover:underline mt-auto">
        <span>اعرف التفاصيل</span>
        <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
        </button>
        </div>
        {/* Card 6 */}
        <div className="group bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col h-full">
        <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center mb-4 group-hover:bg-secondary-container transition-colors">
        <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>balance</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-primary mb-2">التقاضي وفض المنازعات</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">تمثيل أمام كافة المحاكم وتقديم حلول بديلة لفض المنازعات كالتحكيم.</p>
        <button className="flex items-center gap-2 text-secondary font-label-sm text-label-sm group-hover:underline mt-auto">
        <span>اعرف التفاصيل</span>
        <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
        </button>
        </div>
        </section>
        {/* AI Assistant Section */}
        <section className="bg-surface-container border border-outline-variant rounded-xl p-8 md:p-12 mt-4 flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="flex-grow text-center md:text-right">
        <h2 className="font-headline-md text-headline-md text-primary mb-2">غير متأكد من الخدمة المناسبة؟</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 md:mb-0 max-w-xl">دع مساعدنا الذكي يوجهك للخدمة القانونية الأنسب لحالتك. أجب عن بضعة أسئلة بسيطة وسنوجهك للقسم الصحيح.</p>
        </div>
        <div className="flex-shrink-0">
        <button className="bg-primary text-on-primary px-8 py-3 rounded-lg font-body-md text-body-md hover:bg-opacity-90 transition-opacity flex items-center gap-2">
        <span className="material-symbols-outlined">smart_toy</span>
        <span>ابدأ بتحديد نوع الاستشارة</span>
        </button>
        </div>
        </section>
        </main>
        {/* Footer */}
        <footer className="bg-surface-container-highest dark:bg-surface-container-highest text-primary dark:text-on-primary-fixed font-body-md text-body-md w-full bottom-0 flat no shadows mt-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop py-stack-lg max-w-container-max mx-auto rtl">
        <div className="col-span-1 md:col-span-2">
        <div className="text-headline-md font-headline-md text-primary mb-4">KMT Legal</div>
        <p className="text-on-surface-variant mb-4 max-w-sm">© 2024 KMT Legal. All rights reserved. Licensed by the Ministry of Justice.</p>
        </div>
        <div className="flex flex-col gap-2">
        <h4 className="font-bold mb-2">Links</h4>
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Privacy Policy</a>
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Terms of Service</a>
        </div>
        <div className="flex flex-col gap-2">
        <h4 className="font-bold mb-2">Company</h4>
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Office Locations</a>
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Careers</a>
        </div>
        </div>
        </footer>
      </>
    </div>
  );
}

function Screen_service_corporate_contracts(): JSX.Element {
  return (
    <div className={"bg-background text-on-background font-body-md rtl"} data-stitch-source={"kmt_legal_18"}>
      
      <>
        {/* TopNavBar */}
        <nav className="bg-surface-container-lowest border-b border-outline-variant w-full top-0 sticky z-50">
        <div className="flex justify-between items-center px-margin-desktop max-w-container-max mx-auto h-20 rtl">
        <div className="flex items-center gap-gutter">
        <a className="text-headline-md font-headline-md text-primary flex items-center gap-2" href="#">
        <img className="h-8 w-8 object-contain rounded" data-alt="A minimalist and elegant legal firm logo for KMT Legal. The logo features a stylized monogram or architectural motif representing trust, authority, and modern legal practice. The color palette relies on deep midnight navy and refined gold accents against a clean white background. The overall aesthetic is highly professional, corporate modern, and exudes a sense of premium service." src="/stitch-assets/35618386b99b1fdc.png"/>
                            KMT Legal
                        </a>
        </div>
        <div className="hidden md:flex items-center gap-gutter">
        <a className="text-secondary font-bold border-b-2 border-secondary pb-1" href="#">Practice Areas</a>
        <a className="text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Our Team</a>
        <a className="text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Insights</a>
        <a className="text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Contact</a>
        </div>
        <div className="flex items-center gap-stack-md">
        <button className="text-on-surface-variant hover:text-secondary transition-colors">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
        </button>
        <button className="text-on-surface-variant hover:text-secondary transition-colors">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>notifications</span>
        </button>
        <span className="text-on-surface-variant font-label-sm text-label-sm border-r border-outline-variant pr-stack-md mr-stack-md">EN</span>
        <button className="bg-secondary text-on-secondary px-4 py-2 rounded font-body-md text-body-md hover:bg-secondary-fixed-dim transition-colors cursor-pointer active:opacity-80">Book Consultation</button>
        </div>
        </div>
        </nav>
        {/* Main Content Area */}
        <main className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-stack-lg min-h-screen">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex text-on-surface-variant font-body-md text-body-md mb-stack-lg">
        <ol className="inline-flex items-center space-x-1 space-x-reverse md:space-x-2">
        <li className="inline-flex items-center">
        <a className="hover:text-primary transition-colors" href="#">الرئيسية</a>
        </li>
        <li>
        <div className="flex items-center">
        <span className="material-symbols-outlined text-sm mx-1">chevron_left</span>
        <a className="hover:text-primary transition-colors" href="#">خدماتنا</a>
        </div>
        </li>
        <li aria-current="page">
        <div className="flex items-center">
        <span className="material-symbols-outlined text-sm mx-1">chevron_left</span>
        <span className="text-primary font-medium">قضايا الشركات</span>
        </div>
        </li>
        </ol>
        </nav>
        {/* Hero Section */}
        <section className="mb-stack-lg border-b border-outline-variant pb-stack-lg">
        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-stack-md">قضايا الشركات والعقود التجارية</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">نقدم دعماً قانونياً شاملاً للشركات في كافة مراحل نموها، بدءاً من التأسيس وصياغة العقود المعقدة وصولاً إلى تمثيلها في النزاعات التجارية، لضمان حماية مصالحك وتقليل المخاطر القانونية.</p>
        </section>
        {/* Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Right Column: Content */}
        <div className="md:col-span-8 space-y-stack-lg">
        {/* Section 1 */}
        <section className="bg-surface-container-lowest p-stack-lg rounded border border-outline-variant">
        <h2 className="font-headline-md text-headline-md text-primary mb-stack-md flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">business_center</span>
                                متى تحتاج هذه الخدمة؟
                            </h2>
        <ul className="list-disc list-inside space-y-stack-sm text-on-surface-variant">
        <li>عند تأسيس شركة جديدة أو إعادة هيكلة كيان قائم.</li>
        <li>قبل الدخول في شراكات استراتيجية أو اندماجات واستحواذات.</li>
        <li>لصياغة أو مراجعة عقود العمل، عقود التوريد، والامتياز التجاري.</li>
        <li>عند مواجهة نزاعات بين الشركاء أو قضايا مع الموردين والعملاء.</li>
        <li>لضمان الامتثال للأنظمة التجارية والعمالية المحدثة.</li>
        </ul>
        </section>
        {/* Section 2 */}
        <section className="bg-surface-container-lowest p-stack-lg rounded border border-outline-variant">
        <h2 className="font-headline-md text-headline-md text-primary mb-stack-md flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">gavel</span>
                                ما الذي نساعدك فيه؟
                            </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
        <div className="p-stack-md bg-surface-container-low rounded">
        <h3 className="font-bold text-primary mb-2">تأسيس وهيكلة الشركات</h3>
        <p className="text-on-surface-variant text-sm">اختيار الكيان القانوني الأنسب، صياغة عقود التأسيس، واستخراج التراخيص اللازمة.</p>
        </div>
        <div className="p-stack-md bg-surface-container-low rounded">
        <h3 className="font-bold text-primary mb-2">صياغة ومراجعة العقود</h3>
        <p className="text-on-surface-variant text-sm">إعداد عقود دقيقة تحمي حقوقك وتوضح الالتزامات وتقليل ثغرات النزاع المحتملة.</p>
        </div>
        <div className="p-stack-md bg-surface-container-low rounded">
        <h3 className="font-bold text-primary mb-2">النزاعات التجارية</h3>
        <p className="text-on-surface-variant text-sm">التمثيل القانوني أمام المحاكم التجارية ولجان التحكيم لحل الخلافات بفعالية.</p>
        </div>
        <div className="p-stack-md bg-surface-container-low rounded">
        <h3 className="font-bold text-primary mb-2">الحوكمة والامتثال</h3>
        <p className="text-on-surface-variant text-sm">تطوير لوائح داخلية تضمن سير العمل وفق الأنظمة وتقي الشركات من المخالفات.</p>
        </div>
        </div>
        </section>
        {/* Section 3 */}
        <section className="bg-surface-container-lowest p-stack-lg rounded border border-outline-variant">
        <h2 className="font-headline-md text-headline-md text-primary mb-stack-md flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">route</span>
                                خطوات العمل معنا
                            </h2>
        <div className="space-y-stack-md relative before:absolute before:inset-y-0 before:right-6 before:w-px before:bg-outline-variant">
        <div className="relative flex items-start gap-stack-md">
        <div className="bg-secondary text-on-secondary rounded-full w-12 h-12 flex items-center justify-center font-bold z-10 shrink-0">1</div>
        <div className="pt-2">
        <h3 className="font-bold text-primary">الاستشارة المبدئية</h3>
        <p className="text-on-surface-variant">فهم تفاصيل الحالة وتقديم تقييم قانوني أولي للخيارات المتاحة.</p>
        </div>
        </div>
        <div className="relative flex items-start gap-stack-md">
        <div className="bg-surface-container text-primary rounded-full w-12 h-12 flex items-center justify-center font-bold z-10 shrink-0 border border-outline-variant">2</div>
        <div className="pt-2">
        <h3 className="font-bold text-primary">جمع المستندات والتحليل</h3>
        <p className="text-on-surface-variant">مراجعة كافة الوثائق المتعلقة وبناء الاستراتيجية القانونية.</p>
        </div>
        </div>
        <div className="relative flex items-start gap-stack-md">
        <div className="bg-surface-container text-primary rounded-full w-12 h-12 flex items-center justify-center font-bold z-10 shrink-0 border border-outline-variant">3</div>
        <div className="pt-2">
        <h3 className="font-bold text-primary">التنفيذ والمتابعة</h3>
        <p className="text-on-surface-variant">صياغة العقود، تسجيل الشركة، أو بدء إجراءات التقاضي مع تحديثك المستمر.</p>
        </div>
        </div>
        </div>
        </section>
        {/* Section 4 FAQ */}
        <section className="bg-surface-container-lowest p-stack-lg rounded border border-outline-variant">
        <h2 className="font-headline-md text-headline-md text-primary mb-stack-md flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">help_outline</span>
                                الأسئلة الشائعة
                            </h2>
        <div className="space-y-stack-sm">
        <details className="group border border-outline-variant rounded p-stack-md bg-surface-container-low cursor-pointer">
        <summary className="font-bold text-primary flex justify-between items-center list-none">
                                        ما هي تكلفة الاستشارة الأولية؟
                                        <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-secondary">expand_more</span>
        </summary>
        <p className="text-on-surface-variant mt-stack-sm pt-stack-sm border-t border-outline-variant text-sm">تختلف التكلفة بناءً على تعقيد القضية. يتم توضيح الرسوم بدقة قبل تأكيد الحجز.</p>
        </details>
        <details className="group border border-outline-variant rounded p-stack-md bg-surface-container-low cursor-pointer">
        <summary className="font-bold text-primary flex justify-between items-center list-none">
                                        كم يستغرق تأسيس شركة جديدة؟
                                        <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-secondary">expand_more</span>
        </summary>
        <p className="text-on-surface-variant mt-stack-sm pt-stack-sm border-t border-outline-variant text-sm">عادةً ما يستغرق الأمر من أيام إلى أسابيع قليلة، اعتماداً على نوع الشركة واكتمال المستندات المطلوبة.</p>
        </details>
        </div>
        </section>
        </div>
        {/* Left Column: Sticky Booking Card */}
        <div className="md:col-span-4 relative">
        <div className="sticky top-28 bg-surface-container-lowest p-stack-lg rounded border border-outline-variant shadow-[0_10px_15px_-3px_rgba(15,23,42,0.05)]">
        <h3 className="font-headline-md text-headline-md text-primary mb-stack-sm">احجز استشارة في قضايا الشركات</h3>
        <p className="text-on-surface-variant text-sm mb-stack-lg border-b border-outline-variant pb-stack-md">ناقش تفاصيل وضعك القانوني مع نخبة من المحامين المتخصصين في الشأن التجاري.</p>
        <div className="space-y-stack-md mb-stack-lg">
        <div className="flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined text-secondary">schedule</span>
        <span>المدة: 45 دقيقة</span>
        </div>
        <div className="flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined text-secondary">video_camera_front</span>
        <span>عبر الإنترنت أو في المكتب</span>
        </div>
        </div>
        <button className="w-full bg-secondary text-on-secondary py-3 rounded font-bold hover:bg-secondary-fixed-dim transition-colors mb-stack-sm">احجز الآن</button>
        <p className="text-center text-xs text-on-surface-variant mt-2">متاح جدولة مرنة خلال أيام العمل.</p>
        </div>
        </div>
        </div>
        </main>
        {/* Footer */}
        <footer className="bg-surface-container-highest w-full bottom-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop py-stack-lg max-w-container-max mx-auto rtl">
        {/* Brand */}
        <div className="col-span-1 md:col-span-1 flex flex-col gap-stack-sm">
        <span className="text-headline-md font-headline-md text-primary">KMT Legal</span>
        <p className="text-on-surface-variant text-sm">© 2024 KMT Legal. All rights reserved. Licensed by the Ministry of Justice.</p>
        </div>
        {/* Links */}
        <div className="col-span-1 md:col-span-2 flex flex-wrap gap-x-gutter gap-y-stack-sm text-on-surface-variant font-body-md text-body-md items-center">
        <a className="hover:text-primary underline transition-opacity duration-300" href="#">Privacy Policy</a>
        <a className="hover:text-primary underline transition-opacity duration-300" href="#">Terms of Service</a>
        <a className="hover:text-primary underline transition-opacity duration-300" href="#">Office Locations</a>
        <a className="hover:text-primary underline transition-opacity duration-300" href="#">Careers</a>
        </div>
        {/* Legal Disclaimer */}
        <div className="col-span-1 md:col-span-1 border-t md:border-t-0 md:border-r border-outline-variant pt-stack-md md:pt-0 md:pr-stack-md">
        <p className="text-xs text-on-surface-variant">
        <span className="font-bold block mb-1">إخلاء مسؤولية:</span>
                            المعلومات المعروضة عامة ولا تغني عن استشارة قانونية متخصصة.
                        </p>
        </div>
        </div>
        </footer>
      </>
    </div>
  );
}

function Screen_team(): JSX.Element {
  return (
    <div className={"bg-background text-on-background min-h-screen flex flex-col"} data-stitch-source={"kmt_legal_1"}>
      <style dangerouslySetInnerHTML={{ __html: "body { font-family: 'IBM Plex Sans Arabic', sans-serif; }\n        .glass-card {\n            background: rgba(255, 255, 255, 0.7);\n            backdrop-filter: blur(10px);\n            border: 1px solid rgba(255, 255, 255, 0.3);\n        }" }} />
      <>
        {/* TopNavBar */}
        <nav className="bg-surface-container-lowest dark:bg-surface-container-lowest w-full top-0 sticky border-b border-outline-variant dark:border-outline z-50">
        <div className="flex justify-between items-center px-margin-desktop max-w-container-max mx-auto h-20 rtl">
        {/* Brand */}
        <div className="text-headline-md font-headline-md text-primary dark:text-on-primary-fixed flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                        KMT Legal
                    </div>
        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex gap-8 items-center font-body-md text-body-md">
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Practice Areas</a>
        <a className="text-secondary font-bold border-b-2 border-secondary pb-1 hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Our Team</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Insights</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Contact</a>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-4">
        <button className="material-symbols-outlined text-on-surface-variant hover:text-secondary transition-colors cursor-pointer" data-icon="search">search</button>
        <button className="material-symbols-outlined text-on-surface-variant hover:text-secondary transition-colors cursor-pointer" data-icon="notifications">notifications</button>
        <button className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors uppercase">EN</button>
        <button className="hidden md:block bg-secondary text-on-secondary px-6 py-2 rounded font-body-md hover:bg-opacity-90 transition-opacity">Book Consultation</button>
        </div>
        </div>
        </nav>
        {/* Main Content */}
        <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 px-margin-desktop bg-surface-container-lowest relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #755a26 0%, transparent 50%)" }}></div>
        <div className="max-w-container-max mx-auto text-center relative z-10">
        <h1 className="font-display-lg text-display-lg text-primary mb-6">فريق قانوني متعدد التخصصات</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
                            نجمع بين الخبرة العميقة والابتكار لتقديم حلول قانونية استثنائية. تعرف على الخبراء الذين يدافعون عن مصالحك.
                        </p>
        {/* Filter Chips */}
        <div className="flex flex-wrap justify-center gap-3">
        <button className="px-6 py-2 rounded-full border border-secondary bg-secondary text-on-secondary font-body-md transition-colors">الكل</button>
        <button className="px-6 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary font-body-md transition-colors">قانون الشركات</button>
        <button className="px-6 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary font-body-md transition-colors">شؤون الأسرة</button>
        <button className="px-6 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary font-body-md transition-colors">القانون الجنائي</button>
        <button className="px-6 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary font-body-md transition-colors">العقارات</button>
        </div>
        </div>
        </section>
        {/* Team Grid */}
        <section className="py-16 px-margin-desktop bg-background">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
        <div className="h-64 relative overflow-hidden">
        <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A professional portrait of a distinguished Middle Eastern lawyer in his 40s. He is wearing a sharp, tailored navy blue suit with a subtle striped tie. He is standing in a modern, well-lit corporate office with glass walls and minimalist decor. The lighting is bright and high-key, creating a light-mode, trustworthy, and authoritative aesthetic. The color palette emphasizes clean whites, professional blues, and subtle gold accents." src="/stitch-assets/0ae8535de19a67c6.png"/>
        </div>
        <div className="p-6">
        <div className="flex justify-between items-start mb-2">
        <div>
        <h3 className="font-headline-md text-headline-md text-primary">أ. كريم محمود</h3>
        <p className="font-body-md text-body-md text-secondary mt-1">شريك مؤسس</p>
        </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6 mt-4">
        <span className="text-xs bg-surface-container-low text-on-surface-variant px-2 py-1 rounded">قانون الشركات</span>
        <span className="text-xs bg-surface-container-low text-on-surface-variant px-2 py-1 rounded">العقود التجارية</span>
        </div>
        <div className="flex gap-3">
        <button className="flex-1 border border-outline-variant text-primary font-body-md py-2 rounded hover:bg-surface-container-low transition-colors text-center">عرض الملف</button>
        <button className="flex-1 bg-secondary text-on-secondary font-body-md py-2 rounded hover:bg-opacity-90 transition-opacity text-center">حجز استشارة</button>
        </div>
        </div>
        </div>
        {/* Card 2 */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
        <div className="h-64 relative overflow-hidden">
        <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A professional portrait of a confident Middle Eastern female lawyer in her 30s. She is wearing an elegant dark blazer over a crisp white blouse. The background is a sophisticated law library with softly blurred leather-bound books and warm wood paneling. The lighting is bright and flattering, consistent with a high-end corporate identity. The overall tone is calm, intelligent, and highly professional." src="/stitch-assets/ff4ca4cf707aef0c.png"/>
        </div>
        <div className="p-6">
        <div className="flex justify-between items-start mb-2">
        <div>
        <h3 className="font-headline-md text-headline-md text-primary">أ. ليلى أحمد</h3>
        <p className="font-body-md text-body-md text-secondary mt-1">محامي أول</p>
        </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6 mt-4">
        <span className="text-xs bg-surface-container-low text-on-surface-variant px-2 py-1 rounded">شؤون الأسرة</span>
        <span className="text-xs bg-surface-container-low text-on-surface-variant px-2 py-1 rounded">النزاعات المدنية</span>
        </div>
        <div className="flex gap-3">
        <button className="flex-1 border border-outline-variant text-primary font-body-md py-2 rounded hover:bg-surface-container-low transition-colors text-center">عرض الملف</button>
        <button className="flex-1 bg-secondary text-on-secondary font-body-md py-2 rounded hover:bg-opacity-90 transition-opacity text-center">حجز استشارة</button>
        </div>
        </div>
        </div>
        {/* Card 3 */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
        <div className="h-64 relative overflow-hidden">
        <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A professional portrait of a serious Middle Eastern male lawyer in his 50s. He is dressed in a charcoal gray suit with a subtle silver tie pin. He is pictured against a bright, clean, minimalist architectural background featuring white marble and glass. The lighting is crisp and natural, emphasizing a secure, reliable, and premium corporate image. The aesthetic relies on neutral tones with minimal distraction." src="/stitch-assets/b7457fddf1203399.png"/>
        </div>
        <div className="p-6">
        <div className="flex justify-between items-start mb-2">
        <div>
        <h3 className="font-headline-md text-headline-md text-primary">أ. طارق حسن</h3>
        <p className="font-body-md text-body-md text-secondary mt-1">مستشار قانوني</p>
        </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6 mt-4">
        <span className="text-xs bg-surface-container-low text-on-surface-variant px-2 py-1 rounded">القانون الجنائي</span>
        <span className="text-xs bg-surface-container-low text-on-surface-variant px-2 py-1 rounded">التقاضي</span>
        </div>
        <div className="flex gap-3">
        <button className="flex-1 border border-outline-variant text-primary font-body-md py-2 rounded hover:bg-surface-container-low transition-colors text-center">عرض الملف</button>
        <button className="flex-1 bg-secondary text-on-secondary font-body-md py-2 rounded hover:bg-opacity-90 transition-opacity text-center">حجز استشارة</button>
        </div>
        </div>
        </div>
        </div>
        </section>
        {/* Process Section */}
        <section className="py-20 px-margin-desktop bg-surface-container-low border-t border-outline-variant">
        <div className="max-w-container-max mx-auto">
        <div className="text-center mb-16">
        <h2 className="font-display-lg text-display-lg text-primary">كيف نختار المحامي المناسب لك</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-4 max-w-2xl mx-auto">عملية منهجية لضمان حصولك على أفضل تمثيل قانوني لقضيتك المحددة.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Step 1 */}
        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant relative">
        <div className="absolute -top-5 -right-5 w-10 h-10 bg-secondary text-on-secondary rounded-full flex items-center justify-center font-bold text-xl border-4 border-surface-container-low">1</div>
        <span className="material-symbols-outlined text-secondary text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
        <h3 className="font-headline-md text-headline-md text-primary mb-3">تقييم الحالة</h3>
        <p className="font-body-md text-body-md text-on-surface-variant">نقوم بتحليل تفاصيل قضيتك بعناية لتحديد التخصصات القانونية المطلوبة بدقة.</p>
        </div>
        {/* Step 2 */}
        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant relative">
        <div className="absolute -top-5 -right-5 w-10 h-10 bg-secondary text-on-secondary rounded-full flex items-center justify-center font-bold text-xl border-4 border-surface-container-low">2</div>
        <span className="material-symbols-outlined text-secondary text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>manage_search</span>
        <h3 className="font-headline-md text-headline-md text-primary mb-3">مطابقة الخبرات</h3>
        <p className="font-body-md text-body-md text-on-surface-variant">نبحث في فريقنا عن المحامي الذي يمتلك سجل نجاح مثبت في قضايا مشابهة لقضيتك.</p>
        </div>
        {/* Step 3 */}
        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant relative">
        <div className="absolute -top-5 -right-5 w-10 h-10 bg-secondary text-on-secondary rounded-full flex items-center justify-center font-bold text-xl border-4 border-surface-container-low">3</div>
        <span className="material-symbols-outlined text-secondary text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
        <h3 className="font-headline-md text-headline-md text-primary mb-3">الاستشارة الأولية</h3>
        <p className="font-body-md text-body-md text-on-surface-variant">نرتب لقاء استراتيجي لوضع خطة العمل والتأكد من توافق الرؤى لتحقيق أفضل نتيجة.</p>
        </div>
        </div>
        </div>
        </section>
        </main>
        {/* Footer */}
        <footer className="bg-surface-container-highest dark:bg-surface-container-highest w-full bottom-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop py-stack-lg max-w-container-max mx-auto rtl">
        <div className="col-span-1 md:col-span-1 flex items-start">
        <span className="text-headline-md font-headline-md text-primary">KMT Legal</span>
        </div>
        <div className="col-span-1 md:col-span-2 flex flex-wrap gap-4 items-center justify-center font-body-md text-body-md">
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Privacy Policy</a>
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Terms of Service</a>
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Office Locations</a>
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Careers</a>
        </div>
        <div className="col-span-1 md:col-span-1 flex items-end justify-end text-sm text-on-surface-variant font-body-md text-body-md">
                        © 2024 KMT Legal. All rights reserved. Licensed by the Ministry of Justice.
                    </div>
        </div>
        </footer>
      </>
    </div>
  );
}

function Screen_lawyer_profile_karim(): JSX.Element {
  return (
    <div className={"bg-surface text-on-surface antialiased rtl"} data-stitch-source={"._kmt_legal"}>
      <style dangerouslySetInnerHTML={{ __html: "body { font-family: 'IBM Plex Sans Arabic', sans-serif; }\n        .material-symbols-outlined { font-variation-settings: 'FILL' 0; }" }} />
      <>
        {/* TopNavBar */}
        <nav className="bg-surface-container-lowest dark:bg-surface-container-lowest w-full top-0 sticky border-b border-outline-variant dark:border-outline flat no shadows z-50">
        <div className="flex justify-between items-center px-margin-desktop max-w-container-max mx-auto h-20 rtl">
        {/* Brand */}
        <div className="flex items-center gap-4">
        <a className="text-headline-md font-headline-md text-primary dark:text-on-primary-fixed" href="#">KMT Legal</a>
        </div>
        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex gap-gutter items-center">
        <a className="font-body-md text-body-md text-secondary font-bold border-b-2 border-secondary pb-1 cursor-pointer active:opacity-80" href="#">Our Team</a>
        <a className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Practice Areas</a>
        <a className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Insights</a>
        <a className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Contact</a>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-4">
        <button className="hidden md:flex items-center justify-center p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
        <span className="material-symbols-outlined" data-icon="search">search</span>
        </button>
        <button className="hidden md:flex items-center justify-center p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
        <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
        </button>
        <span className="font-label-sm text-label-sm text-on-surface-variant cursor-pointer hover:text-secondary transition-colors">EN</span>
        <button className="bg-secondary text-on-secondary px-6 py-2 rounded font-body-md hover:bg-secondary/90 transition-colors hidden md:block">
                            Book Consultation
                        </button>
        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-on-surface-variant p-2">
        <span className="material-symbols-outlined">menu</span>
        </button>
        </div>
        </div>
        </nav>
        <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-stack-lg">
        {/* Hero Profile */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-lg flex flex-col md:flex-row gap-gutter items-start">
        <div className="w-full md:w-1/3 shrink-0">
        <img className="w-full h-auto aspect-[3/4] object-cover rounded-md border border-outline-variant" data-alt="A professional portrait of a distinguished Middle Eastern male lawyer in his 40s. He is wearing a tailored navy blue suit with a subtle gold patterned tie. The background is a slightly blurred, high-end corporate office with soft, warm natural light coming from a large window. The mood is confident, trustworthy, and calm. High-key lighting, corporate modern aesthetic." src="/stitch-assets/b25c75c2e3f319cd.png"/>
        </div>
        <div className="w-full md:w-2/3 flex flex-col h-full justify-between space-y-stack-md">
        <div>
        <div className="flex items-center gap-2 mb-2">
        <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm">شريك مؤسس</span>
        <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm">محكمة النقض</span>
        </div>
        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-2">أ. كريم محمود</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                                        خبير قانوني متمرس يمتلك أكثر من 15 عاماً من الخبرة في القضايا التجارية وحوكمة الشركات. سجل حافل بالنجاحات في تمثيل كبرى الشركات أمام المحاكم العليا.
                                    </p>
        </div>
        <div className="grid grid-cols-3 gap-4 border-t border-outline-variant pt-stack-md mt-auto">
        <div className="text-center md:text-right">
        <span className="block font-headline-md text-headline-md text-secondary">+15</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">سنوات خبرة</span>
        </div>
        <div className="text-center md:text-right border-r border-outline-variant pr-4">
        <span className="block font-headline-md text-headline-md text-secondary">450+</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">قضية منجزة</span>
        </div>
        <div className="text-center md:text-right border-r border-outline-variant pr-4">
        <span className="block font-headline-md text-headline-md text-secondary">98%</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">نسبة النجاح</span>
        </div>
        </div>
        </div>
        </section>
        {/* Specialties (Bento Grid Style) */}
        <section>
        <h2 className="font-headline-md text-headline-md text-primary mb-stack-md border-b border-outline-variant pb-2">مجالات التخصص</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md hover:border-secondary transition-colors group cursor-default">
        <span className="material-symbols-outlined text-secondary mb-4 text-3xl group-hover:scale-110 transition-transform" data-icon="corporate_fare">corporate_fare</span>
        <h3 className="font-body-lg text-body-lg text-primary font-medium mb-2">القانون التجاري والشركات</h3>
        <p className="font-body-md text-body-md text-on-surface-variant">تأسيس الشركات، عمليات الدمج والاستحواذ، وحوكمة الشركات.</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md hover:border-secondary transition-colors group cursor-default">
        <span className="material-symbols-outlined text-secondary mb-4 text-3xl group-hover:scale-110 transition-transform" data-icon="gavel">gavel</span>
        <h3 className="font-body-lg text-body-lg text-primary font-medium mb-2">التقاضي وتسوية المنازعات</h3>
        <p className="font-body-md text-body-md text-on-surface-variant">التمثيل أمام المحاكم التجارية والتحكيم الدولي.</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md hover:border-secondary transition-colors group cursor-default md:col-span-2">
        <span className="material-symbols-outlined text-secondary mb-4 text-3xl group-hover:scale-110 transition-transform" data-icon="account_balance">account_balance</span>
        <h3 className="font-body-lg text-body-lg text-primary font-medium mb-2">القطاع المصرفي والمالي</h3>
        <p className="font-body-md text-body-md text-on-surface-variant">تقديم الاستشارات القانونية للبنوك والمؤسسات المالية، صياغة العقود التمويلية المعقدة، والامتثال التنظيمي.</p>
        </div>
        </div>
        </section>
        {/* Working Method */}
        <section>
        <h2 className="font-headline-md text-headline-md text-primary mb-stack-md border-b border-outline-variant pb-2">منهجية العمل</h2>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md">
        <ul className="space-y-4">
        <li className="flex items-start gap-4">
        <span className="material-symbols-outlined text-secondary mt-1" data-icon="check_circle">check_circle</span>
        <div>
        <h4 className="font-body-md text-body-md text-primary font-medium">التحليل الدقيق</h4>
        <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">دراسة مستفيضة لكافة الجوانب القانونية والواقعية للقضية قبل إبداء الرأي.</p>
        </div>
        </li>
        <li className="flex items-start gap-4">
        <span className="material-symbols-outlined text-secondary mt-1" data-icon="check_circle">check_circle</span>
        <div>
        <h4 className="font-body-md text-body-md text-primary font-medium">الشفافية التامة</h4>
        <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">إبقاء الموكل على إطلاع دائم بكافة التطورات والاحتمالات بصراحة ووضوح.</p>
        </div>
        </li>
        <li className="flex items-start gap-4">
        <span className="material-symbols-outlined text-secondary mt-1" data-icon="check_circle">check_circle</span>
        <div>
        <h4 className="font-body-md text-body-md text-primary font-medium">السرية المهنية</h4>
        <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">التزام صارم بأعلى معايير السرية لحماية بيانات ومصالح الموكلين.</p>
        </div>
        </li>
        </ul>
        </div>
        </section>
        </div>
        {/* Sidebar Booking Card */}
        <aside className="lg:col-span-4 relative">
        <div className="sticky top-28 bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md shadow-sm">
        <h3 className="font-headline-md text-headline-md text-primary mb-4 border-b border-outline-variant pb-2">حجز استشارة</h3>
        <div className="mb-6">
        <p className="font-body-md text-body-md text-on-surface-variant mb-3">اختر الموعد المناسب:</p>
        {/* Dates */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button className="shrink-0 w-16 h-16 rounded border border-secondary bg-secondary/10 flex flex-col items-center justify-center cursor-pointer">
        <span className="font-label-sm text-label-sm text-secondary">أكتوبر</span>
        <span className="font-body-lg text-body-lg text-secondary font-bold">15</span>
        </button>
        <button className="shrink-0 w-16 h-16 rounded border border-outline-variant hover:border-secondary transition-colors flex flex-col items-center justify-center cursor-pointer">
        <span className="font-label-sm text-label-sm text-on-surface-variant">أكتوبر</span>
        <span className="font-body-lg text-body-lg text-primary font-bold">16</span>
        </button>
        <button className="shrink-0 w-16 h-16 rounded border border-outline-variant hover:border-secondary transition-colors flex flex-col items-center justify-center cursor-pointer">
        <span className="font-label-sm text-label-sm text-on-surface-variant">أكتوبر</span>
        <span className="font-body-lg text-body-lg text-primary font-bold">17</span>
        </button>
        </div>
        {/* Times */}
        <div className="grid grid-cols-2 gap-2 mb-6">
        <button className="border border-outline-variant py-2 rounded text-center font-body-md text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors">10:00 ص</button>
        <button className="border border-secondary bg-secondary/10 py-2 rounded text-center font-body-md text-secondary font-medium">11:30 ص</button>
        <button className="border border-outline-variant py-2 rounded text-center font-body-md text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors">01:00 م</button>
        <button className="border border-outline-variant py-2 rounded text-center font-body-md text-on-surface-variant opacity-50 cursor-not-allowed">03:00 م</button>
        </div>
        </div>
        <div className="space-y-4">
        <div className="flex justify-between items-center border-t border-outline-variant pt-4 mb-4">
        <span className="font-body-md text-body-md text-on-surface-variant">رسوم الاستشارة</span>
        <span className="font-headline-md text-headline-md text-primary font-medium">1,500 <span className="font-body-md text-body-md text-on-surface-variant">ر.س</span></span>
        </div>
        <button className="w-full bg-secondary text-on-secondary py-3 rounded font-body-md font-medium hover:bg-secondary/90 transition-colors flex justify-center items-center gap-2">
        <span className="material-symbols-outlined" data-icon="event_available">event_available</span>
                                    تأكيد الحجز
                                </button>
        <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-2 flex items-center justify-center gap-1">
        <span className="material-symbols-outlined text-[14px]" data-icon="lock">lock</span>
                                    دفع إلكتروني آمن
                                </p>
        </div>
        </div>
        </aside>
        </div>
        </main>
        {/* Footer */}
        <footer className="bg-surface-container-highest dark:bg-surface-container-highest w-full bottom-0 mt-stack-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop py-stack-lg max-w-container-max mx-auto rtl">
        {/* Brand */}
        <div className="col-span-1 md:col-span-1 mb-6 md:mb-0">
        <span className="text-headline-md font-headline-md text-primary block mb-4">KMT Legal</span>
        <p className="font-body-md text-body-md text-on-surface-variant">
                            © 2024 KMT Legal. All rights reserved. Licensed by the Ministry of Justice.
                        </p>
        </div>
        {/* Links */}
        <div className="col-span-1 md:col-span-3 flex flex-wrap justify-start md:justify-end gap-gutter items-center">
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Privacy Policy</a>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Terms of Service</a>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Office Locations</a>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Careers</a>
        </div>
        </div>
        </footer>
      </>
    </div>
  );
}

function Screen_book_consultation(): JSX.Element {
  return (
    <div className={"bg-background text-on-background font-body-md min-h-screen flex flex-col"} data-stitch-source={"kmt_legal_22"}>
      <style dangerouslySetInnerHTML={{ __html: ".material-symbols-outlined {\n          font-variation-settings:\n          'FILL' 0,\n          'wght' 300,\n          'GRAD' 0,\n          'opsz' 20\n        }\n        .material-symbols-outlined.fill {\n            font-variation-settings: 'FILL' 1;\n        }" }} />
      <>
        {/* TopNavBar (Transactional Intent - Suppressed Links, Kept Brand Anchor) */}
        <header className="bg-surface-container-lowest border-b border-outline-variant w-full top-0 sticky z-50">
        <div className="flex justify-between items-center px-margin-desktop max-w-container-max mx-auto h-20 rtl">
        {/* Brand */}
        <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-3xl">balance</span>
        <span className="text-headline-md font-headline-md text-primary font-bold tracking-tight">KMT Legal</span>
        </div>
        {/* Minimal Actions for Transactional Flow */}
        <div className="flex items-center gap-gutter">
        <button className="font-label-sm text-label-sm text-secondary hover:text-primary transition-colors uppercase tracking-widest">
                            EN
                        </button>
        <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1" href="#">
                            إلغاء
                            <span className="material-symbols-outlined text-[16px]">close</span>
        </a>
        </div>
        </div>
        </header>
        {/* Main Canvas */}
        <main className="flex-1 max-w-container-max mx-auto w-full px-margin-desktop py-stack-lg rtl flex flex-col md:flex-row gap-gutter">
        {/* Left Side: Consultation Flow (9 columns on desktop) */}
        <div className="w-full md:w-3/4 flex flex-col gap-stack-lg">
        {/* Page Header & Stepper */}
        <div className="flex flex-col gap-stack-md">
        <h1 className="text-display-lg font-display-lg text-primary">احجز استشارتك القانونية</h1>
        <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl">
                            نحن هنا لتقديم التوجيه القانوني الدقيق. يرجى إكمال الخطوات التالية لضمان توجيهك إلى المستشار الأمثل لحالتك.
                        </p>
        {/* 5-Step Stepper */}
        <div className="mt-stack-md">
        <div className="flex items-center w-full">
        {/* Step 1 (Active) */}
        <div className="flex flex-col items-center relative z-10">
        <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm text-label-sm mb-2 border-2 border-secondary">
                                        1
                                    </div>
        <span className="font-label-sm text-label-sm text-secondary">النوع</span>
        </div>
        <div className="flex-1 h-px bg-outline-variant -mt-6"></div>
        {/* Step 2 */}
        <div className="flex flex-col items-center relative z-10">
        <div className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface-variant flex items-center justify-center font-label-sm text-label-sm mb-2 border-2 border-outline-variant">
                                        2
                                    </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant">التفاصيل</span>
        </div>
        <div className="flex-1 h-px bg-outline-variant -mt-6"></div>
        {/* Step 3 */}
        <div className="flex flex-col items-center relative z-10">
        <div className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface-variant flex items-center justify-center font-label-sm text-label-sm mb-2 border-2 border-outline-variant">
                                        3
                                    </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant">الوصف</span>
        </div>
        <div className="flex-1 h-px bg-outline-variant -mt-6"></div>
        {/* Step 4 */}
        <div className="flex flex-col items-center relative z-10">
        <div className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface-variant flex items-center justify-center font-label-sm text-label-sm mb-2 border-2 border-outline-variant">
                                        4
                                    </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant">الوثائق</span>
        </div>
        <div className="flex-1 h-px bg-outline-variant -mt-6"></div>
        {/* Step 5 */}
        <div className="flex flex-col items-center relative z-10">
        <div className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface-variant flex items-center justify-center font-label-sm text-label-sm mb-2 border-2 border-outline-variant">
                                        5
                                    </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant">الموعد</span>
        </div>
        </div>
        </div>
        </div>
        <div className="h-px w-full bg-outline-variant"></div>
        {/* Step Content: Select Service Type */}
        <div className="flex flex-col gap-stack-md">
        <h2 className="text-headline-md font-headline-md text-primary">ما هو نوع الاستشارة التي تحتاجها؟</h2>
        <p className="text-body-md font-body-md text-on-surface-variant">
                            اختر الفئة الأقرب لموضوعك. سيساعدنا ذلك في تخصيص الأسئلة القادمة.
                        </p>
        {/* Service Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-stack-md mt-stack-sm">
        {/* Card 1 */}
        <label className="group relative bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md cursor-pointer hover:border-secondary transition-colors duration-200 shadow-sm flex flex-col gap-3">
        <input checked className="absolute top-4 left-4 text-secondary focus:ring-secondary focus:ring-offset-0 border-outline-variant" name="service_type" type="radio"/>
        <span className="material-symbols-outlined text-3xl text-secondary">domain</span>
        <span className="text-headline-md font-headline-md text-primary text-[20px]">قضايا الشركات</span>
        <span className="text-label-sm font-label-sm text-on-surface-variant">تأسيس، عقود، نزاعات تجارية، وإفلاس.</span>
        </label>
        {/* Card 2 */}
        <label className="group relative bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md cursor-pointer hover:border-secondary transition-colors duration-200 shadow-sm flex flex-col gap-3">
        <input className="absolute top-4 left-4 text-secondary focus:ring-secondary focus:ring-offset-0 border-outline-variant" name="service_type" type="radio"/>
        <span className="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-secondary transition-colors">family_restroom</span>
        <span className="text-headline-md font-headline-md text-primary text-[20px]">قضايا الأسرة</span>
        <span className="text-label-sm font-label-sm text-on-surface-variant">أحوال شخصية، طلاق، حضانة، ومواريث.</span>
        </label>
        {/* Card 3 */}
        <label className="group relative bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md cursor-pointer hover:border-secondary transition-colors duration-200 shadow-sm flex flex-col gap-3">
        <input className="absolute top-4 left-4 text-secondary focus:ring-secondary focus:ring-offset-0 border-outline-variant" name="service_type" type="radio"/>
        <span className="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-secondary transition-colors">gavel</span>
        <span className="text-headline-md font-headline-md text-primary text-[20px]">قضايا جنائية</span>
        <span className="text-label-sm font-label-sm text-on-surface-variant">دفاع جنائي، استئناف، وجرائم إلكترونية.</span>
        </label>
        {/* Card 4 */}
        <label className="group relative bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md cursor-pointer hover:border-secondary transition-colors duration-200 shadow-sm flex flex-col gap-3">
        <input className="absolute top-4 left-4 text-secondary focus:ring-secondary focus:ring-offset-0 border-outline-variant" name="service_type" type="radio"/>
        <span className="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-secondary transition-colors">real_estate_agent</span>
        <span className="text-headline-md font-headline-md text-primary text-[20px]">عقارات وأملاك</span>
        <span className="text-label-sm font-label-sm text-on-surface-variant">نزاعات عقارية، عقود إيجار، وتسجيل.</span>
        </label>
        {/* Card 5 */}
        <label className="group relative bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md cursor-pointer hover:border-secondary transition-colors duration-200 shadow-sm flex flex-col gap-3">
        <input className="absolute top-4 left-4 text-secondary focus:ring-secondary focus:ring-offset-0 border-outline-variant" name="service_type" type="radio"/>
        <span className="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-secondary transition-colors">work</span>
        <span className="text-headline-md font-headline-md text-primary text-[20px]">قضايا عمالية</span>
        <span className="text-label-sm font-label-sm text-on-surface-variant">نزاعات عمل، عقود توظيف، وتعويضات.</span>
        </label>
        {/* Card 6 */}
        <label className="group relative bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md cursor-pointer hover:border-secondary transition-colors duration-200 shadow-sm flex flex-col gap-3">
        <input className="absolute top-4 left-4 text-secondary focus:ring-secondary focus:ring-offset-0 border-outline-variant" name="service_type" type="radio"/>
        <span className="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-secondary transition-colors">help_outline</span>
        <span className="text-headline-md font-headline-md text-primary text-[20px]">أخرى / غير متأكد</span>
        <span className="text-label-sm font-label-sm text-on-surface-variant">دعنا نساعدك في تحديد التصنيف الصحيح.</span>
        </label>
        </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-stack-lg pt-stack-md border-t border-outline-variant">
        <button className="px-6 py-2 border border-primary text-primary font-label-sm text-label-sm rounded hover:bg-surface-container-low transition-colors disabled:opacity-50" disabled>
                            السابق
                        </button>
        <button className="px-6 py-2 bg-secondary text-on-secondary font-label-sm text-label-sm rounded hover:opacity-90 transition-opacity flex items-center gap-2">
                            التالي
                            <span className="material-symbols-outlined text-[16px] rtl:rotate-180">arrow_forward</span>
        </button>
        </div>
        </div>
        {/* Right Side: AI Assistant Panel (3 columns on desktop) */}
        <aside className="w-full md:w-1/4 h-fit sticky top-[100px]">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-sm relative overflow-hidden">
        {/* Decorative Top Border */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-secondary opacity-80"></div>
        <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined">smart_toy</span>
        </div>
        <div>
        <h3 className="text-headline-md font-headline-md text-primary text-[18px]">المساعد الذكي للفرز</h3>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">يضمن توجيهك بدقة</p>
        </div>
        </div>
        <div className="text-body-md font-body-md text-on-surface-variant space-y-4">
        <p>
                                يقوم نظامنا بتحليل اختياراتك في الوقت الفعلي لضمان:
                            </p>
        <ul className="space-y-2">
        <li className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
        <span>تحديد الخبير القانوني المناسب.</span>
        </li>
        <li className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
        <span>تجهيز الوثائق المطلوبة مسبقاً.</span>
        </li>
        <li className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
        <span>توفير وقتك أثناء الاستشارة.</span>
        </li>
        </ul>
        </div>
        <div className="mt-6 pt-4 border-t border-outline-variant flex items-center gap-2 text-on-surface-variant opacity-70">
        <span className="material-symbols-outlined text-[16px]">lock</span>
        <span className="font-label-sm text-label-sm">بياناتك مشفرة ومحمية ببروتوكولات قانونية صارمة.</span>
        </div>
        </div>
        </aside>
        </main>
      </>
    </div>
  );
}

function Screen_case_studies(): JSX.Element {
  return (
    <div className={"antialiased min-h-screen flex flex-col relative"} data-stitch-source={"kmt_legal_19"}>
      <style dangerouslySetInnerHTML={{ __html: "body {\n            font-family: 'IBM Plex Sans Arabic', sans-serif;\n            background-color: #f7f9fb;\n            color: #191c1e;\n        }\n        .material-symbols-outlined {\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\n        }\n        /* Custom scrollbar for subtle aesthetic */\n        ::-webkit-scrollbar {\n            width: 8px;\n        }\n        ::-webkit-scrollbar-track {\n            background: #f7f9fb;\n        }\n        ::-webkit-scrollbar-thumb {\n            background: #c6c6cd;\n            border-radius: 4px;\n        }\n        ::-webkit-scrollbar-thumb:hover {\n            background: #76777d;\n        }" }} />
      <>
        {/* TopNavBar Component */}
        <nav className="bg-surface-container-lowest dark:bg-surface-container-lowest w-full top-0 sticky border-b border-outline-variant dark:border-outline z-50 transition-all duration-300">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto h-20 rtl">
        {/* Brand Logo */}
        <a className="text-headline-md font-headline-md text-primary dark:text-on-primary-fixed tracking-tight" href="#">
                        KMT Legal
                    </a>
        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-gutter">
        <a className="text-on-surface-variant dark:text-on-surface-variant font-body-md text-body-md hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">
                            Practice Areas
                        </a>
        <a className="text-on-surface-variant dark:text-on-surface-variant font-body-md text-body-md hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">
                            Our Team
                        </a>
        <a aria-current="page" className="text-secondary font-bold border-b-2 border-secondary pb-1 font-body-md text-body-md cursor-pointer active:opacity-80" href="#">
                            Insights
                        </a>
        <a className="text-on-surface-variant dark:text-on-surface-variant font-body-md text-body-md hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">
                            Contact
                        </a>
        </div>
        {/* Trailing Actions */}
        <div className="flex items-center gap-stack-md">
        <button aria-label="Notifications" className="hidden md:flex text-on-surface-variant hover:text-secondary transition-colors duration-200">
        <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
        </button>
        <button aria-label="Search" className="hidden md:flex text-on-surface-variant hover:text-secondary transition-colors duration-200">
        <span className="material-symbols-outlined" data-icon="search">search</span>
        </button>
        <button className="text-on-surface-variant font-label-sm text-label-sm hover:text-secondary transition-colors duration-200 uppercase tracking-wider hidden sm:block">
                            EN
                        </button>
        <button className="bg-secondary text-on-primary font-label-sm text-label-sm px-4 py-2 rounded uppercase tracking-wider hover:bg-secondary-container hover:text-on-secondary-container transition-colors duration-200 cursor-pointer active:opacity-80 shadow-sm hidden sm:block">
                            Book Consultation
                        </button>
        {/* Mobile Menu Toggle */}
        <button aria-label="Menu" className="md:hidden text-primary p-2">
        <span className="material-symbols-outlined">menu</span>
        </button>
        </div>
        </div>
        </nav>
        {/* Main Content Canvas */}
        <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="relative bg-surface-container-lowest py-20 lg:py-32 border-b border-surface-variant overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#76777d 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10 text-center md:text-right">
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary mb-stack-md max-w-3xl leading-tight">
                            نماذج من خبراتنا العملية
                        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                            نستعرض هنا مختارات من القضايا والاستشارات التي تعاملنا معها، لنعكس نهجنا الاستراتيجي في حماية مصالح عملائنا ضمن إطار من السرية التامة والاحترافية.
                        </p>
        </div>
        </section>
        {/* Filter & Content Section */}
        <section className="py-stack-lg max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full">
        {/* Filters */}
        <div className="mb-stack-lg flex flex-wrap gap-stack-sm justify-start items-center">
        <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider ml-2 hidden sm:inline-block">تصفية حسب:</span>
        <button className="bg-secondary-container text-on-secondary-container border border-secondary-container px-4 py-2 rounded-full font-body-md text-body-md transition-colors hover:bg-secondary hover:text-on-primary">
                            الكل
                        </button>
        <button className="bg-surface-container-lowest text-on-surface-variant border border-outline-variant px-4 py-2 rounded-full font-body-md text-body-md transition-colors hover:bg-surface-container-high hover:text-primary">
                            الشركات والتجاري
                        </button>
        <button className="bg-surface-container-lowest text-on-surface-variant border border-outline-variant px-4 py-2 rounded-full font-body-md text-body-md transition-colors hover:bg-surface-container-high hover:text-primary">
                            الملكية الفكرية
                        </button>
        <button className="bg-surface-container-lowest text-on-surface-variant border border-outline-variant px-4 py-2 rounded-full font-body-md text-body-md transition-colors hover:bg-surface-container-high hover:text-primary">
                            العقارات والمقاولات
                        </button>
        <button className="bg-surface-container-lowest text-on-surface-variant border border-outline-variant px-4 py-2 rounded-full font-body-md text-body-md transition-colors hover:bg-surface-container-high hover:text-primary">
                            تسوية المنازعات
                        </button>
        </div>
        {/* Case Studies Grid (Bento/Card Hybrid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {/* Case Card 1 */}
        <article className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md hover:shadow-lg transition-shadow duration-300 relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-1 h-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="flex justify-between items-start mb-2">
        <span className="inline-block bg-surface-container-high text-on-surface-variant text-xs font-medium px-2.5 py-0.5 rounded">تسوية المنازعات</span>
        <span className="material-symbols-outlined text-outline-variant group-hover:text-secondary transition-colors" data-icon="gavel" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-primary leading-snug">
                                نزاع تجاري معقد حول مستحقات مالية متأخرة
                            </h3>
        <div className="space-y-4 flex-grow mt-2">
        <div>
        <h4 className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">التحدي</h4>
        <p className="font-body-md text-body-md text-on-surface-variant">
                                        واجه العميل (شركة مقاولات كبرى) مماطلة في سداد مستحقات بملايين الريالات من قبل جهة متعاقدة، مع تعقيدات في تفسير بنود العقد.
                                    </p>
        </div>
        <div>
        <h4 className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">النهج</h4>
        <p className="font-body-md text-body-md text-on-surface-variant">
                                        تحليل شامل للعقود والمراسلات، وصياغة مذكرة قانونية محكمة، واللجوء للتحكيم التجاري كمسار أسرع وأكثر فاعلية.
                                    </p>
        </div>
        <div className="bg-surface py-3 px-4 rounded border-r-2 border-secondary">
        <h4 className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1">النتيجة العامة</h4>
        <p className="font-body-md text-body-md text-primary font-medium">
                                        صدور حكم تحكيمي لصالح العميل بإلزام الطرف الآخر بسداد كامل المستحقات مع التعويض عن التأخير.
                                    </p>
        </div>
        </div>
        </article>
        {/* Case Card 2 */}
        <article className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md hover:shadow-lg transition-shadow duration-300 relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-1 h-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="flex justify-between items-start mb-2">
        <span className="inline-block bg-surface-container-high text-on-surface-variant text-xs font-medium px-2.5 py-0.5 rounded">الشركات والتجاري</span>
        <span className="material-symbols-outlined text-outline-variant group-hover:text-secondary transition-colors" data-icon="corporate_fare">corporate_fare</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-primary leading-snug">
                                إعادة هيكلة شركة عائلية لتجنب التصفية
                            </h3>
        <div className="space-y-4 flex-grow mt-2">
        <div>
        <h4 className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">التحدي</h4>
        <p className="font-body-md text-body-md text-on-surface-variant">
                                        خلافات حادة بين الشركاء الورثة هددت استمرارية كيان تجاري عريق يضم آلاف الموظفين وأصول ضخمة.
                                    </p>
        </div>
        <div>
        <h4 className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">النهج</h4>
        <p className="font-body-md text-body-md text-on-surface-variant">
                                        وساطة مكثفة بين الأطراف، وإعداد هيكل حوكمة جديد يفصل بين الملكية والإدارة، وتأسيس شركة قابضة.
                                    </p>
        </div>
        <div className="bg-surface py-3 px-4 rounded border-r-2 border-secondary">
        <h4 className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1">النتيجة العامة</h4>
        <p className="font-body-md text-body-md text-primary font-medium">
                                        توقيع اتفاقية تسوية شاملة، وإقرار النظام الأساسي الجديد، واستئناف العمليات التجارية بنجاح.
                                    </p>
        </div>
        </div>
        </article>
        {/* Case Card 3 */}
        <article className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md hover:shadow-lg transition-shadow duration-300 relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-1 h-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="flex justify-between items-start mb-2">
        <span className="inline-block bg-surface-container-high text-on-surface-variant text-xs font-medium px-2.5 py-0.5 rounded">الملكية الفكرية</span>
        <span className="material-symbols-outlined text-outline-variant group-hover:text-secondary transition-colors" data-icon="copyright">copyright</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-primary leading-snug">
                                حماية علامة تجارية من التعدي الإقليمي
                            </h3>
        <div className="space-y-4 flex-grow mt-2">
        <div>
        <h4 className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">التحدي</h4>
        <p className="font-body-md text-body-md text-on-surface-variant">
                                        اكتشاف قيام شركة منافسة في دولة مجاورة بتسجيل علامة تجارية مشابهة لعلامة العميل المشهورة واستخدامها.
                                    </p>
        </div>
        <div>
        <h4 className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">النهج</h4>
        <p className="font-body-md text-body-md text-on-surface-variant">
                                        التنسيق مع مكاتب المحاماة الزميلة دولياً، ورفع دعاوى شطب وتعدي، وتقديم إثباتات الشهرة والأسبقية.
                                    </p>
        </div>
        <div className="bg-surface py-3 px-4 rounded border-r-2 border-secondary">
        <h4 className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1">النتيجة العامة</h4>
        <p className="font-body-md text-body-md text-primary font-medium">
                                        شطب العلامة المقلدة، وإلزام المعتدي بوقف الاستخدام، والتعويض عن الأضرار الناجمة.
                                    </p>
        </div>
        </div>
        </article>
        </div>
        {/* Disclaimer */}
        <div className="mt-stack-lg border-t border-outline-variant pt-stack-md text-center">
        <p className="font-label-sm text-label-sm text-outline max-w-2xl mx-auto flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-[16px]" data-icon="info">info</span>
                            تنويه قانوني: الحالات المذكورة أعلاه هي أمثلة عامة للخبرات السابقة. النتائج السابقة لا تضمن نتائج مستقبلية مماثلة، حيث تختلف وقائع وظروف كل قضية.
                        </p>
        </div>
        </section>
        </main>
        {/* Footer Component */}
        <footer className="bg-surface-container-highest dark:bg-surface-container-highest w-full bottom-0 mt-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max mx-auto rtl">
        {/* Brand & Copyright */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-stack-sm">
        <span className="text-headline-md font-headline-md text-primary dark:text-on-primary-fixed">
                            KMT Legal
                        </span>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-md">
                            © 2024 KMT Legal. All rights reserved. Licensed by the Ministry of Justice.
                        </p>
        </div>
        {/* Links Column 1 */}
        <div className="col-span-1 flex flex-col gap-2">
        <h4 className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-2">Legal</h4>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">
                            Privacy Policy
                        </a>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">
                            Terms of Service
                        </a>
        </div>
        {/* Links Column 2 */}
        <div className="col-span-1 flex flex-col gap-2">
        <h4 className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-2">Company</h4>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">
                            Office Locations
                        </a>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">
                            Careers
                        </a>
        </div>
        </div>
        </footer>
      </>
    </div>
  );
}

function Screen_case_study_commercial_dispute(): JSX.Element {
  return (
    <div className={"antialiased min-h-screen flex flex-col"} data-stitch-source={"kmt_legal_17"}>
      <style dangerouslySetInnerHTML={{ __html: "/* Setup base fonts */\n        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');\n        \n        body {\n            font-family: 'IBM Plex Sans Arabic', sans-serif;\n            background-color: theme('colors.background');\n            color: theme('colors.on-background');\n        }\n\n        .material-symbols-outlined {\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\n        }\n        \n        .material-symbols-outlined.filled {\n            font-variation-settings: 'FILL' 1;\n        }\n\n        /* Minimal scrollbar */\n        ::-webkit-scrollbar {\n            width: 6px;\n        }\n        ::-webkit-scrollbar-track {\n            background: theme('colors.surface');\n        }\n        ::-webkit-scrollbar-thumb {\n            background: theme('colors.outline-variant');\n            border-radius: 10px;\n        }\n        ::-webkit-scrollbar-thumb:hover {\n            background: theme('colors.outline');\n        }" }} />
      <>
        {/* TopNavBar (Shared Component) */}
        <nav className="bg-surface-container-lowest dark:bg-surface-container-lowest w-full top-0 sticky border-b border-outline-variant dark:border-outline flat no shadows z-50">
        <div className="flex justify-between items-center px-margin-desktop max-w-container-max mx-auto h-20 rtl">
        {/* Brand */}
        <div className="flex items-center gap-4">
        <span className="text-headline-md font-headline-md text-primary dark:text-on-primary-fixed tracking-tight font-extrabold">KMT Legal</span>
        </div>
        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 font-body-md text-body-md h-full">
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80 h-full flex items-center" href="#">Practice Areas</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80 h-full flex items-center" href="#">Our Team</a>
        {/* Active Nav Item based on Intent */}
        <a className="text-secondary font-bold border-b-2 border-secondary h-full flex items-center mt-[2px]" href="#">Insights</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80 h-full flex items-center" href="#">Contact</a>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-on-surface-variant">
        <button className="cursor-pointer hover:text-secondary transition-colors duration-200"><span className="material-symbols-outlined">search</span></button>
        <button className="cursor-pointer hover:text-secondary transition-colors duration-200"><span className="material-symbols-outlined">notifications</span></button>
        <button className="cursor-pointer hover:text-secondary transition-colors duration-200 font-label-sm text-label-sm uppercase tracking-wider">EN</button>
        </div>
        <button className="hidden md:block bg-secondary text-on-secondary px-6 py-2 rounded font-label-sm text-label-sm hover:opacity-90 transition-opacity">
                            Book Consultation
                        </button>
        </div>
        </div>
        </nav>
        {/* Main Canvas */}
        <main className="flex-grow w-full max-w-container-max mx-auto px-margin-desktop py-stack-lg">
        {/* Breadcrumbs & Header Context */}
        <div className="mb-stack-lg">
        <nav aria-label="Breadcrumb" className="flex text-on-surface-variant font-label-sm text-label-sm mb-stack-md">
        <ol className="inline-flex items-center space-x-1 space-x-reverse md:space-x-3">
        <li className="inline-flex items-center">
        <a className="hover:text-secondary transition-colors" href="#">الرئيسية</a>
        </li>
        <li>
        <div className="flex items-center">
        <span className="material-symbols-outlined text-[16px] mx-1">chevron_left</span>
        <a className="hover:text-secondary transition-colors" href="#">دراسات حالة</a>
        </div>
        </li>
        <li aria-current="page">
        <div className="flex items-center">
        <span className="material-symbols-outlined text-[16px] mx-1">chevron_left</span>
        <span className="text-on-surface">نزاع تجاري</span>
        </div>
        </li>
        </ol>
        </nav>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary mb-stack-sm leading-tight max-w-3xl">
                                نزاع تجاري معقد حول مستحقات مالية متأخرة
                            </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                                دراسة حالة مجهولة المصدر تستعرض المنهجية القانونية المتبعة لاسترداد مستحقات مالية ضخمة لشركة مقاولات من مطور عقاري.
                            </p>
        </div>
        </div>
        </div>
        {/* Grid Layout: Content (9 cols) + Sidebar (3 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter relative">
        {/* Left Content Area (9 Columns) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-stack-lg">
        {/* Abstract Header Image */}
        <div className="w-full h-64 md:h-80 bg-surface-container-high rounded-xl overflow-hidden border border-outline-variant relative">
        <div className="absolute inset-0 bg-cover bg-center mix-blend-multiply opacity-80" data-alt="A sophisticated, highly architectural photograph of a modern corporate building interior in soft light mode. The image features clean, sharp geometric lines, vast white spaces, and subtle reflections on polished marble floors. A warm, golden light subtly washes over the scene, echoing the brand's secondary color. The mood is highly professional, secure, and serene, representing stability and legal authority." style={{ backgroundImage: "url('/stitch-assets/4eb341e75f2ca2d2.png')" }}></div>
        </div>
        {/* Metadata Bar */}
        <div className="flex flex-wrap gap-4 p-4 bg-surface-container-lowest border border-outline-variant rounded-lg">
        <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary text-[20px]">domain</span>
        <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant">القطاع</span>
        <span className="font-body-md text-body-md text-primary font-medium">المقاولات والبناء</span>
        </div>
        </div>
        <div className="w-px h-10 bg-outline-variant hidden md:block"></div>
        <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">check_circle</span>
        <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant">حالة القضية</span>
        <span className="font-body-md text-body-md text-primary font-medium">مغلقة (تمت التسوية)</span>
        </div>
        </div>
        <div className="w-px h-10 bg-outline-variant hidden md:block"></div>
        <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">visibility_off</span>
        <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant">مستوى الخصوصية</span>
        <span className="font-body-md text-body-md text-primary font-medium">الهوية محجوبة كلياً</span>
        </div>
        </div>
        </div>
        {/* Section: Background */}
        <section className="space-y-stack-md">
        <h2 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-2">الخلفية والسياق</h2>
        <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                                تم توكيل مكتبنا من قبل إحدى شركات المقاولات الرائدة (المدعي) في نزاع مع مطور عقاري (المدعى عليه) حول تأخر صرف مستحقات مالية بلغت قيمتها الإجمالية ما يقارب 50 مليون ريال. نشأ النزاع نتيجة لتأخيرات في تسليم المشروع، حيث تبادل الطرفان الاتهامات حول المسؤولية عن هذا التأخير. ادعى المطور العقاري أن التأخير يعود لسوء إدارة شركة المقاولات، بينما استندت شركة المقاولات إلى التعديلات المتكررة في نطاق العمل (Variation Orders) التي طلبها المطور دون تمديد زمني رسمي.
                            </p>
        </section>
        {/* Section: Legal Challenge */}
        <section className="space-y-stack-md">
        <h2 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-2">التحدي القانوني</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-surface border border-outline-variant rounded">
        <div className="flex items-center gap-3 mb-3">
        <span className="material-symbols-outlined text-secondary">description</span>
        <h3 className="font-body-lg text-body-lg text-primary font-medium">غموض العقود</h3>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">
                                        احتوى العقد الأصلي على شروط فضفاضة فيما يخص إجراءات الموافقة على التعديلات (Variation Orders)، مما أدى إلى صعوبة إثبات التزام المطور العقاري بدفع تكاليف الأعمال الإضافية التي تم تنفيذها بالفعل على أرض الواقع.
                                    </p>
        </div>
        <div className="p-6 bg-surface border border-outline-variant rounded">
        <div className="flex items-center gap-3 mb-3">
        <span className="material-symbols-outlined text-secondary">history_toggle_off</span>
        <h3 className="font-body-lg text-body-lg text-primary font-medium">التقادم والمدد الزمنية</h3>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">
                                        مضى وقت طويل على بعض المطالبات الفرعية ضمن النزاع، مما شكل خطراً حقيقياً بسقوط حق المطالبة بالتقادم المانع من سماع الدعوى وفقاً للأنظمة المعمول بها، وهو ما استند إليه المدعى عليه في دفاعه الأولي.
                                    </p>
        </div>
        </div>
        </section>
        {/* Section: Approach */}
        <section className="space-y-stack-md">
        <h2 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-2">المنهجية والاستراتيجية</h2>
        <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                                اعتمد فريق KMT Legal استراتيجية مزدوجة ترتكز على الضغط القانوني من خلال إعداد ملف تحكيم متكامل، بالتوازي مع فتح قنوات التفاوض المباشر للوصول إلى تسوية ودية تقلل من التكاليف والوقت على الموكل. تم الاستعانة بخبراء هندسيين ومحاسبيين لتوثيق حجم الأعمال المنفذة ومطابقتها مع المراسلات الإلكترونية المتبادلة.
                            </p>
        </section>
        {/* Section: Analyzed Documents (Bento Lite) */}
        <section className="space-y-stack-md">
        <h2 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-2">نطاق التحليل والتدقيق</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col items-center text-center p-4 bg-surface-container-lowest border border-outline-variant rounded hover:border-secondary transition-colors">
        <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-2">contract</span>
        <span className="font-label-sm text-label-sm text-primary">العقد الرئيسي واللاحق</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">4 وثائق</span>
        </div>
        <div className="flex flex-col items-center text-center p-4 bg-surface-container-lowest border border-outline-variant rounded hover:border-secondary transition-colors">
        <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-2">request_quote</span>
        <span className="font-label-sm text-label-sm text-primary">أوامر التغيير (VO)</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">112 أمر</span>
        </div>
        <div className="flex flex-col items-center text-center p-4 bg-surface-container-lowest border border-outline-variant rounded hover:border-secondary transition-colors">
        <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-2">mark_email_read</span>
        <span className="font-label-sm text-label-sm text-primary">المراسلات الرسمية</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">+500 إيميل</span>
        </div>
        <div className="flex flex-col items-center text-center p-4 bg-surface-container-lowest border border-outline-variant rounded hover:border-secondary transition-colors">
        <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-2">receipt_long</span>
        <span className="font-label-sm text-label-sm text-primary">مستخلصات الدفع</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">24 مستخلص</span>
        </div>
        </div>
        </section>
        {/* Section: Timeline */}
        <section className="space-y-stack-md">
        <h2 className="font-headline-md text-headline-md text-primary border-b border-outline-variant pb-2">التسلسل الزمني للإجراءات</h2>
        <div className="relative border-r border-outline-variant ml-4 pr-6 space-y-8 py-4">
        {/* Node */}
        <div className="relative">
        <div className="absolute w-3 h-3 bg-secondary rounded-full -right-[29px] top-1.5 border-2 border-surface-container-lowest"></div>
        <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">الشهر الأول</span>
        <h4 className="font-body-lg text-body-lg text-primary font-medium">التدقيق وبناء الملف</h4>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">جمع كافة الوثائق الهندسية والمحاسبية وإعداد تقرير الخبرة الأولي الذي يثبت حق المقاول.</p>
        </div>
        {/* Node */}
        <div className="relative">
        <div className="absolute w-3 h-3 bg-surface-container-highest rounded-full -right-[29px] top-1.5 border-2 border-outline-variant"></div>
        <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">الشهر الثالث</span>
        <h4 className="font-body-lg text-body-lg text-primary font-medium">إرسال الإشعارات القانونية</h4>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">توجيه إنذار قانوني نهائي للمطور العقاري يتضمن المطالبات المحدثة والمثبتة بالأدلة.</p>
        </div>
        {/* Node */}
        <div className="relative">
        <div className="absolute w-3 h-3 bg-surface-container-highest rounded-full -right-[29px] top-1.5 border-2 border-outline-variant"></div>
        <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">الشهر الخامس</span>
        <h4 className="font-body-lg text-body-lg text-primary font-medium">جلسات التفاوض المباشر</h4>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">عقد 4 جلسات تفاوض بحضور الخبراء الفنيين من الطرفين لمناقشة المستخلصات المعلقة نقطة بنقطة.</p>
        </div>
        {/* Node */}
        <div className="relative">
        <div className="absolute w-3 h-3 bg-primary rounded-full -right-[29px] top-1.5 border-2 border-surface-container-lowest"></div>
        <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1">الشهر السابع</span>
        <h4 className="font-body-lg text-body-lg text-primary font-medium">توقيع اتفاقية التسوية</h4>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">صياغة وتوقيع اتفاقية تسوية نهائية تضمن حقوق موكلنا مع جدول زمني واضح للدفعات.</p>
        </div>
        </div>
        </section>
        </div>
        {/* Right Sidebar (3 Columns) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-stack-md mt-stack-lg lg:mt-0">
        <div className="sticky top-28 space-y-stack-md">
        {/* CTA Card */}
        <div className="bg-primary-container text-on-primary-container p-6 rounded-lg border border-outline-variant/20 shadow-sm relative overflow-hidden">
        {/* Decorative element */}
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary opacity-10 rounded-full blur-xl"></div>
        <h3 className="font-headline-md text-headline-md text-on-primary mb-2 relative z-10">هل تواجه نزاعاً تجارياً مشابهاً؟</h3>
        <p className="font-body-md text-body-md mb-6 relative z-10 opacity-90">
                                    احمِ حقوقك المالية والتجارية. تواصل مع فريقنا لتقييم موقفك القانوني واستكشاف خيارات الحل.
                                </p>
        <button className="w-full bg-secondary text-on-secondary px-6 py-3 rounded font-body-md text-body-md font-medium hover:opacity-90 transition-opacity flex justify-center items-center gap-2 relative z-10">
                                    Book Consultation
                                    <span className="material-symbols-outlined text-[18px]">arrow_left_alt</span>
        </button>
        </div>
        {/* Related Services Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-lg">
        <h3 className="font-body-lg text-body-lg text-primary font-medium mb-4 pb-2 border-b border-outline-variant">خدمات ذات صلة</h3>
        <ul className="space-y-3">
        <li>
        <a className="group flex items-center justify-between font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#">
        <span>التحكيم التجاري</span>
        <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_left_alt</span>
        </a>
        </li>
        <li>
        <a className="group flex items-center justify-between font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#">
        <span>صياغة العقود الإنشائية</span>
        <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_left_alt</span>
        </a>
        </li>
        <li>
        <a className="group flex items-center justify-between font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#">
        <span>تسوية المنازعات الودية</span>
        <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_left_alt</span>
        </a>
        </li>
        </ul>
        </div>
        </div>
        </div>
        </div>
        {/* Divider */}
        <hr className="border-outline-variant my-stack-lg w-full"/>
        {/* Bottom Legal Disclaimer */}
        <div className="bg-surface p-6 rounded border border-outline-variant text-center max-w-4xl mx-auto">
        <span className="material-symbols-outlined text-on-surface-variant mb-2">info</span>
        <h5 className="font-label-sm text-label-sm text-primary mb-2 tracking-wide">إخلاء مسؤولية قانوني</h5>
        <p className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed">
                        تم نشر دراسة الحالة هذه لأغراض إعلامية وتثقيفية فقط، ولا تشكل استشارة قانونية. تم إخفاء أو تعديل جميع الأسماء، والأرقام، والتفاصيل المحددة لحماية خصوصية وسرية عملائنا. نتائج القضايا السابقة لا تضمن نتائج مماثلة في قضايا مستقبلية، حيث تعتمد كل قضية على وقائعها المستقلة.
                    </p>
        </div>
        </main>
        {/* Footer (Shared Component) */}
        <footer className="bg-surface-container-highest dark:bg-surface-container-highest w-full bottom-0 flat no shadows mt-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop py-stack-lg max-w-container-max mx-auto rtl">
        {/* Brand Column */}
        <div className="flex flex-col gap-4 col-span-1 md:col-span-1">
        <span className="text-headline-md font-headline-md text-primary dark:text-on-primary-fixed tracking-tight font-extrabold">KMT Legal</span>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-4">
                            © 2024 KMT Legal. All rights reserved. Licensed by the Ministry of Justice.
                        </p>
        </div>
        {/* Links Column */}
        <div className="flex flex-col gap-2 col-span-1 md:col-span-3 md:items-end justify-end">
        <div className="flex flex-wrap gap-6 font-body-md text-body-md text-primary dark:text-on-primary-fixed">
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Privacy Policy</a>
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Terms of Service</a>
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Office Locations</a>
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Careers</a>
        </div>
        </div>
        </div>
        </footer>
      </>
    </div>
  );
}

function Screen_media(): JSX.Element {
  return (
    <div className={"bg-background text-on-background antialiased selection:bg-secondary-container selection:text-on-secondary-container font-sans rtl"} data-stitch-source={"kmt_legal_16"}>
      
      <>
        {/* Top Navigation Bar */}
        <nav className="bg-surface-container-lowest dark:bg-surface-container-lowest w-full top-0 sticky border-b border-outline-variant dark:border-outline z-50">
        <div className="flex justify-between items-center px-margin-desktop max-w-container-max mx-auto h-20 rtl">
        {/* Brand */}
        <div className="flex items-center gap-gutter">
        <a className="text-headline-md font-headline-md text-primary dark:text-on-primary-fixed tracking-tight" href="#">KMT Legal</a>
        </div>
        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center gap-gutter">
        <a className="text-on-surface-variant dark:text-on-surface-variant font-body-md text-body-md hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Practice Areas</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant font-body-md text-body-md hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Our Team</a>
        <a className="text-secondary font-bold border-b-2 border-secondary pb-1 font-body-md text-body-md hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Insights</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant font-body-md text-body-md hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Contact</a>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-stack-md">
        <button className="hidden md:flex items-center justify-center p-2 text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>notifications</span>
        </button>
        <button className="hidden md:flex items-center justify-center p-2 text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
        </button>
        <a className="text-label-sm font-label-sm text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">EN</a>
        <button className="bg-secondary text-on-secondary px-6 py-2 rounded-DEFAULT font-label-sm text-label-sm hover:opacity-90 transition-opacity duration-200 cursor-pointer active:opacity-80 hidden md:block">Book Consultation</button>
        {/* Mobile Menu Toggle */}
        <button className="md:hidden p-2 text-on-surface-variant">
        <span className="material-symbols-outlined">menu</span>
        </button>
        </div>
        </div>
        </nav>
        {/* Main Content */}
        <main className="w-full flex-grow">
        {/* Hero Section */}
        <section className="w-full bg-surface py-16 md:py-24 px-margin-mobile md:px-margin-desktop border-b border-outline-variant">
        <div className="max-w-container-max mx-auto flex flex-col items-center text-center">
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary mb-stack-md">المركز الإعلامي القانوني</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                            تغطية شاملة لأحدث التطورات القانونية، المقالات التحليلية، والفعاليات البارزة في الساحة القانونية، مقدمة من خبراء KMT Legal.
                        </p>
        </div>
        </section>
        {/* Tabs Section */}
        <section className="w-full px-margin-mobile md:px-margin-desktop bg-surface-container-lowest sticky top-20 z-40 border-b border-outline-variant">
        <div className="max-w-container-max mx-auto overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-stack-lg py-stack-md whitespace-nowrap">
        <button className="font-body-md text-body-md text-secondary font-bold border-b-2 border-secondary pb-2 px-2 transition-colors">All</button>
        <button className="font-body-md text-body-md text-on-surface-variant hover:text-secondary pb-2 px-2 transition-colors">Videos</button>
        <button className="font-body-md text-body-md text-on-surface-variant hover:text-secondary pb-2 px-2 transition-colors">Facebook</button>
        <button className="font-body-md text-body-md text-on-surface-variant hover:text-secondary pb-2 px-2 transition-colors">Articles</button>
        <button className="font-body-md text-body-md text-on-surface-variant hover:text-secondary pb-2 px-2 transition-colors">News</button>
        </div>
        </div>
        </section>
        {/* Content Grid */}
        <section className="py-16 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Featured Video (TikTok Style) - Takes up 4 columns on desktop */}
        <div className="md:col-span-4 h-[600px] relative rounded-xl overflow-hidden group cursor-pointer border border-outline-variant bg-surface-container-low shadow-sm hover:shadow-md transition-shadow">
        <div className="absolute inset-0 bg-cover bg-center w-full h-full" data-alt="A vertical video frame showing a professional lawyer in a modern, well-lit office speaking directly to the camera, conveying authority and trust. Light modern corporate aesthetic with subtle gold accents." style={{ backgroundImage: "url('/stitch-assets/1b43992c3d78f709.png')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50">
        <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
        </div>
        </div>
        {/* Content Overlay */}
        <div className="absolute bottom-0 w-full p-stack-md flex flex-col gap-stack-sm text-white">
        <div className="flex items-center gap-2 mb-2">
        <span className="bg-secondary/90 px-3 py-1 rounded-full font-label-sm text-label-sm text-on-secondary">Featured</span>
        <span className="flex items-center gap-1 font-label-sm text-label-sm bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
        <span className="material-symbols-outlined text-[14px]">visibility</span> 12.4k
                                    </span>
        </div>
        <h3 className="font-headline-md text-headline-md leading-tight">شرح مفصل لتعديلات قانون الشركات الجديد 2024</h3>
        <p className="font-body-md text-body-md text-white/80 line-clamp-2">تعرف على أهم التغييرات التي طرأت على قانون الشركات وتأثيرها المباشر على بيئة الأعمال المحلية والدولية.</p>
        <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-surface overflow-hidden">
        <img className="w-full h-full object-cover" data-alt="A small professional headshot of an Arab lawyer in a dark suit against a light grey background." src="/stitch-assets/585e629f50d916aa.png"/>
        </div>
        <span className="font-label-sm text-label-sm text-white/90">د. أحمد عبد الرحمن</span>
        </div>
        <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
        <span className="material-symbols-outlined text-white">share</span>
        </button>
        </div>
        </div>
        </div>
        {/* Masonry Grid for other content - Takes up 8 columns */}
        <div className="md:col-span-8 columns-1 sm:columns-2 gap-gutter space-y-gutter">
        {/* Article Card */}
        <div className="break-inside-avoid bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden hover:border-outline transition-colors group cursor-pointer">
        <div className="h-48 relative overflow-hidden">
        <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A close up shot of a high quality legal document being signed with an elegant gold fountain pen on a polished dark wood desk. Natural light streaming from a window. Professional legal aesthetic." src="/stitch-assets/b8b47a1dd8d5ce08.png"/>
        </div>
        <div className="p-stack-md flex flex-col gap-stack-sm">
        <div className="flex items-center justify-between mb-2">
        <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Article</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">12 Oct 2024</span>
        </div>
        <h4 className="font-headline-md text-headline-md text-primary">التحكيم التجاري الدولي: المزايا والتحديات</h4>
        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3">نظرة معمقة على آليات التحكيم التجاري الدولي كبديل فعال لحل النزاعات بين الشركات العابرة للحدود، وأهم التحديات التي تواجه التنفيذ.</p>
        <div className="mt-stack-md flex items-center text-secondary font-label-sm text-label-sm group-hover:gap-2 transition-all">
        <span>اقرأ المزيد</span>
        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </div>
        </div>
        </div>
        {/* Facebook Post Card */}
        <div className="break-inside-avoid bg-surface-container-lowest rounded-lg border border-outline-variant p-stack-md flex flex-col gap-stack-sm hover:bg-surface transition-colors cursor-pointer">
        <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
        <span className="material-symbols-outlined">thumb_up</span>
        </div>
        <div>
        <p className="font-label-sm text-label-sm text-primary font-bold">KMT Legal Facebook</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">2 hours ago</p>
        </div>
        </div>
        <p className="font-body-md text-body-md text-primary" dir="rtl">
                                    نفخر بالإعلان عن ترقية ثلاثة من محامينا المتميزين إلى مرتبة شركاء. هذه الخطوة تعكس التزامنا المستمر بتطوير الكفاءات القانونية وتقديم أفضل خدمة لعملائنا. نهنئهم على هذا الإنجاز المستحق.
                                </p>
        <div className="h-40 rounded-DEFAULT overflow-hidden mt-2 relative">
        <img className="w-full h-full object-cover" data-alt="A professional group photo of three diverse Arab lawyers, two men and one woman, in formal business attire smiling confidently in a modern, bright office lobby with floor-to-ceiling windows. High quality corporate photography." src="/stitch-assets/bd64f8e89da8f4f6.png"/>
        </div>
        <div className="flex items-center gap-4 mt-2 border-t border-outline-variant pt-2">
        <button className="flex items-center gap-1 text-on-surface-variant hover:text-blue-600 transition-colors font-label-sm text-label-sm">
        <span className="material-symbols-outlined text-[18px]">thumb_up</span> 245
                                    </button>
        <button className="flex items-center gap-1 text-on-surface-variant hover:text-blue-600 transition-colors font-label-sm text-label-sm">
        <span className="material-symbols-outlined text-[18px]">chat_bubble</span> 32
                                    </button>
        </div>
        </div>
        {/* News Card (Text Only) */}
        <div className="break-inside-avoid bg-surface-container-low rounded-lg border border-outline-variant p-stack-md flex flex-col gap-stack-sm hover:border-outline transition-colors cursor-pointer border-l-4 border-l-secondary">
        <div className="flex items-center justify-between mb-2">
        <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">News Update</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">10 Oct 2024</span>
        </div>
        <h4 className="font-headline-md text-headline-md text-primary">المشاركة في مؤتمر القانون الاستثماري بالرياض</h4>
        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-4">
                                    شارك فريق KMT Legal كمتحدثين رئيسيين في المؤتمر السنوي للقانون الاستثماري الذي عقد في مدينة الرياض، حيث تم استعراض أحدث التشريعات الجاذبة للاستثمار الأجنبي المباشر.
                                </p>
        </div>
        {/* Video Card (Horizontal) */}
        <div className="break-inside-avoid bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden hover:border-outline transition-colors group cursor-pointer">
        <div className="h-40 relative overflow-hidden bg-black flex items-center justify-center">
        <img className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" data-alt="A thumbnail of a webinar presentation showing a clean graphical slide about 'Intellectual Property Rights' with a small picture-in-picture of an Arab female lawyer presenting. Professional corporate seminar aesthetic." src="/stitch-assets/f9addb2d07ebf63d.png"/>
        <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 group-hover:bg-secondary/80 transition-colors duration-300">
        <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
        </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded font-label-sm text-label-sm text-white">
                                        45:20
                                    </div>
        </div>
        <div className="p-stack-md flex flex-col gap-stack-sm">
        <div className="flex items-center justify-between mb-1">
        <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Webinar</span>
        </div>
        <h4 className="font-headline-md text-body-lg font-bold text-primary">ندوة: حقوق الملكية الفكرية في العصر الرقمي</h4>
        </div>
        </div>
        </div>
        </div>
        {/* Load More CTA */}
        <div className="w-full flex justify-center mt-stack-lg pt-stack-lg border-t border-outline-variant">
        <button className="border border-primary text-primary px-8 py-3 rounded-DEFAULT font-label-sm text-label-sm hover:bg-surface-container-high transition-colors duration-200">
                            تحميل المزيد
                        </button>
        </div>
        </section>
        </main>
        {/* Footer */}
        <footer className="bg-surface-container-highest dark:bg-surface-container-highest w-full bottom-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop py-stack-lg max-w-container-max mx-auto rtl">
        {/* Brand & Copyright */}
        <div className="flex flex-col gap-stack-sm col-span-1 md:col-span-2">
        <span className="text-headline-md font-headline-md text-primary">KMT Legal</span>
        <p className="font-body-md text-body-md text-on-surface-variant">© 2024 KMT Legal. All rights reserved. Licensed by the Ministry of Justice.</p>
        </div>
        {/* Links */}
        <div className="flex flex-col gap-stack-sm col-span-1 md:col-span-2 md:items-end">
        <div className="flex flex-wrap gap-x-gutter gap-y-stack-sm md:justify-end">
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Privacy Policy</a>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Terms of Service</a>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Office Locations</a>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Careers</a>
        </div>
        </div>
        </div>
        </footer>
      </>
    </div>
  );
}

function Screen_articles(): JSX.Element {
  return (
    <div className={"bg-background text-on-background font-body-md text-body-md antialiased rtl"} data-stitch-source={"kmt_legal_15"}>
      <style dangerouslySetInnerHTML={{ __html: ".material-symbols-outlined {\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\n        }\n        .material-symbols-outlined.fill-icon {\n            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;\n        }" }} />
      <>
        {/* TopNavBar */}
        <nav className="bg-surface-container-lowest dark:bg-surface-container-lowest text-secondary dark:text-secondary-fixed font-body-md text-body-md w-full top-0 sticky border-b border-outline-variant dark:border-outline flat no shadows z-50">
        <div className="flex justify-between items-center px-margin-desktop max-w-container-max mx-auto h-20 rtl">
        <div className="flex items-center gap-gutter">
        <a className="text-headline-md font-headline-md text-primary dark:text-on-primary-fixed" href="#">KMT Legal</a>
        <div className="hidden md:flex gap-stack-md ml-margin-desktop">
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80 px-2 py-4" href="#">Practice Areas</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80 px-2 py-4" href="#">Our Team</a>
        <a className="text-secondary font-bold border-b-2 border-secondary pb-1 cursor-pointer active:opacity-80 px-2 py-4 mt-1" href="#">Insights</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80 px-2 py-4" href="#">Contact</a>
        </div>
        </div>
        <div className="flex items-center gap-stack-md">
        <div className="flex gap-stack-sm items-center text-on-surface-variant">
        <button className="hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80 p-2 rounded-full hover:bg-surface-container-highest">
        <span className="material-symbols-outlined" data-icon="search">search</span>
        </button>
        <button className="hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80 p-2 rounded-full hover:bg-surface-container-highest">
        <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
        </button>
        </div>
        <button className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors px-2">EN</button>
        <button className="bg-secondary text-on-secondary px-6 py-2 rounded-lg hover:bg-secondary-container hover:text-on-secondary-container transition-colors font-label-sm text-label-sm uppercase tracking-wider whitespace-nowrap">
                            Book Consultation
                        </button>
        </div>
        </div>
        </nav>
        {/* Main Content */}
        <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        {/* Hero Section */}
        <section className="mb-stack-lg text-center md:text-right">
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary mb-stack-sm">مقالات قانونية مبسطة</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">استكشف مكتبتنا من المقالات والأدلة القانونية المصممة لتبسيط المفاهيم القانونية المعقدة وتزويدك بالمعرفة اللازمة لقرارات عملك.</p>
        </section>
        {/* Search and Filter Bar */}
        <section className="mb-stack-lg bg-surface-container-low rounded-xl p-stack-md flex flex-col md:flex-row gap-stack-md items-center justify-between border border-outline-variant">
        <div className="relative w-full md:w-1/2">
        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-3 pr-12 pl-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow font-body-md text-body-md text-on-surface" placeholder="ابحث في المقالات..." type="text"/>
        </div>
        <div className="flex gap-stack-sm overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
        <button className="whitespace-nowrap px-4 py-2 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm transition-colors">الكل</button>
        <button className="whitespace-nowrap px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-highest transition-colors font-label-sm text-label-sm">تأسيس الشركات</button>
        <button className="whitespace-nowrap px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-highest transition-colors font-label-sm text-label-sm">العقود التجارية</button>
        <button className="whitespace-nowrap px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-highest transition-colors font-label-sm text-label-sm">الملكية الفكرية</button>
        <button className="whitespace-nowrap px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-highest transition-colors font-label-sm text-label-sm">العمل والعمال</button>
        </div>
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-stack-lg">
        {/* Featured Article */}
        <article className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden group hover:shadow-lg transition-shadow duration-300 cursor-pointer">
        <div className="h-64 w-full relative overflow-hidden bg-surface-variant">
        <img alt="Featured Article Image" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A professional and sleek corporate office setting, bright natural light pouring through large windows, modern minimalist furniture, conveying a sense of corporate transparency and legal professionalism. Warm sunlight and deep gray accents." src="/stitch-assets/b392b48a7cb6b561.png"/>
        <div className="absolute top-4 right-4 bg-surface-container-lowest/90 backdrop-blur px-3 py-1 rounded-full text-secondary font-label-sm text-label-sm border border-outline-variant">مقالة مميزة</div>
        </div>
        <div className="p-stack-lg">
        <div className="flex items-center gap-2 mb-3 text-on-surface-variant font-label-sm text-label-sm">
        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
        <span>15 أكتوبر 2023</span>
        <span className="mx-2">•</span>
        <span className="material-symbols-outlined text-[16px]">schedule</span>
        <span>5 دقائق قراءة</span>
        </div>
        <h2 className="font-headline-md text-headline-md text-primary mb-stack-sm group-hover:text-secondary transition-colors">الدليل الشامل: خطوات تأسيس شركة ذات مسؤولية محدودة (LLC)</h2>
        <p className="text-on-surface-variant font-body-md text-body-md mb-stack-md line-clamp-3">
                                    تعرف على الخطوات القانونية والإجرائية الكاملة لتأسيس شركة ذات مسؤولية محدودة في النظام الجديد، من اختيار الاسم التجاري وحتى استخراج السجل وتوثيق العقود.
                                </p>
        <div className="flex items-center text-secondary font-label-sm text-label-sm uppercase tracking-wide group-hover:underline">
                                    اقرأ المزيد
                                    <span className="material-symbols-outlined ml-2 rtl:-scale-x-100">arrow_forward</span>
        </div>
        </div>
        </article>
        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {/* Card 1 */}
        <article className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden group hover:shadow-md transition-shadow duration-300 cursor-pointer flex flex-col">
        <div className="h-48 w-full relative overflow-hidden bg-surface-variant">
        <img alt="Article Image" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A close up of a legal contract with a premium gold fountain pen resting on it. Shallow depth of field, high-end corporate aesthetic, crisp white paper, subtle shadows." src="/stitch-assets/2484f68d86633ca8.png"/>
        </div>
        <div className="p-stack-md flex-grow flex flex-col">
        <div className="text-secondary font-label-sm text-label-sm mb-2">العقود التجارية</div>
        <h3 className="font-headline-md text-headline-md text-primary mb-2 text-[20px] leading-tight group-hover:text-secondary transition-colors">5 بنود أساسية يجب أن تتضمنها عقود الشراكة</h3>
        <p className="text-on-surface-variant font-body-md text-body-md mb-4 line-clamp-2 text-sm">تجنب النزاعات المستقبلية بتضمين هذه البنود الخمسة الجوهرية في أي عقد شراكة تجارية لضمان حقوق جميع الأطراف.</p>
        <div className="mt-auto flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm border-t border-outline-variant pt-3">
        <span>10 أكتوبر 2023</span>
        <span>3 دقائق قراءة</span>
        </div>
        </div>
        </article>
        {/* Card 2 */}
        <article className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden group hover:shadow-md transition-shadow duration-300 cursor-pointer flex flex-col">
        <div className="h-48 w-full relative overflow-hidden bg-surface-variant">
        <img alt="Article Image" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A modern abstract representation of intellectual property. Glowing minimal geometric icons floating over a dark sleek background with subtle grid lines, conveying technology and legal protection." src="/stitch-assets/2c0d439a80ab607f.png"/>
        </div>
        <div className="p-stack-md flex-grow flex flex-col">
        <div className="text-secondary font-label-sm text-label-sm mb-2">الملكية الفكرية</div>
        <h3 className="font-headline-md text-headline-md text-primary mb-2 text-[20px] leading-tight group-hover:text-secondary transition-colors">كيف تحمي علامتك التجارية من الانتهاك؟</h3>
        <p className="text-on-surface-variant font-body-md text-body-md mb-4 line-clamp-2 text-sm">خطوات عملية وقانونية لتسجيل وحماية علامتك التجارية محلياً ودولياً، والإجراءات المتبعة عند وقوع انتهاك.</p>
        <div className="mt-auto flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm border-t border-outline-variant pt-3">
        <span>5 أكتوبر 2023</span>
        <span>4 دقائق قراءة</span>
        </div>
        </div>
        </article>
        {/* Card 3 */}
        <article className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden group hover:shadow-md transition-shadow duration-300 cursor-pointer flex flex-col">
        <div className="p-stack-md flex-grow flex flex-col">
        <div className="text-secondary font-label-sm text-label-sm mb-2">العمل والعمال</div>
        <h3 className="font-headline-md text-headline-md text-primary mb-2 text-[20px] leading-tight group-hover:text-secondary transition-colors">حقوق الموظف وصاحب العمل في فترة التجربة</h3>
        <p className="text-on-surface-variant font-body-md text-body-md mb-4 line-clamp-3 text-sm">تحليل شامل للمواد القانونية المنظمة لفترة التجربة في نظام العمل، ومتى يحق لأي من الطرفين إنهاء العقد دون تعويض.</p>
        <div className="mt-auto flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm border-t border-outline-variant pt-3">
        <span>28 سبتمبر 2023</span>
        <span>6 دقائق قراءة</span>
        </div>
        </div>
        </article>
        {/* Card 4 */}
        <article className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden group hover:shadow-md transition-shadow duration-300 cursor-pointer flex flex-col">
        <div className="p-stack-md flex-grow flex flex-col">
        <div className="text-secondary font-label-sm text-label-sm mb-2">تأسيس الشركات</div>
        <h3 className="font-headline-md text-headline-md text-primary mb-2 text-[20px] leading-tight group-hover:text-secondary transition-colors">الفرق بين المؤسسة الفردية والشركة: أيهما تختار؟</h3>
        <p className="text-on-surface-variant font-body-md text-body-md mb-4 line-clamp-3 text-sm">مقارنة قانونية ومالية بين المؤسسات الفردية والشركات لمساعدتك في اتخاذ القرار الأنسب لمشروعك الناشئ.</p>
        <div className="mt-auto flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm border-t border-outline-variant pt-3">
        <span>20 سبتمبر 2023</span>
        <span>4 دقائق قراءة</span>
        </div>
        </div>
        </article>
        </div>
        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-stack-md">
        <button className="w-10 h-10 rounded-lg flex items-center justify-center border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors" disabled>
        <span className="material-symbols-outlined rtl:-scale-x-100">chevron_right</span>
        </button>
        <button className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary text-on-secondary font-label-sm">1</button>
        <button className="w-10 h-10 rounded-lg flex items-center justify-center border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors font-label-sm">2</button>
        <button className="w-10 h-10 rounded-lg flex items-center justify-center border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors font-label-sm">3</button>
        <span className="text-on-surface-variant">...</span>
        <button className="w-10 h-10 rounded-lg flex items-center justify-center border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors">
        <span className="material-symbols-outlined rtl:-scale-x-100">chevron_left</span>
        </button>
        </div>
        </div>
        {/* Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-stack-lg hidden md:flex">
        {/* Most Read Widget */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md">
        <h3 className="font-headline-md text-headline-md text-primary mb-stack-md flex items-center gap-2 border-b border-outline-variant pb-3">
        <span className="material-symbols-outlined text-secondary">trending_up</span>
                                المقالات الأكثر قراءة
                            </h3>
        <ul className="flex flex-col gap-4">
        <li className="group cursor-pointer">
        <div className="text-secondary font-label-sm text-label-sm mb-1">تأسيس الشركات</div>
        <h4 className="font-body-md text-body-md text-on-surface group-hover:text-secondary transition-colors font-medium">دليل المستثمر الأجنبي لتأسيس شركة في المملكة</h4>
        </li>
        <li className="group cursor-pointer border-t border-outline-variant pt-4">
        <div className="text-secondary font-label-sm text-label-sm mb-1">الضرائب والزكاة</div>
        <h4 className="font-body-md text-body-md text-on-surface group-hover:text-secondary transition-colors font-medium">كل ما تحتاج معرفته عن ضريبة القيمة المضافة للشركات</h4>
        </li>
        <li className="group cursor-pointer border-t border-outline-variant pt-4">
        <div className="text-secondary font-label-sm text-label-sm mb-1">العقود التجارية</div>
        <h4 className="font-body-md text-body-md text-on-surface group-hover:text-secondary transition-colors font-medium">صياغة عقود عدم الإفصاح (NDA) لحماية أسرار شركتك</h4>
        </li>
        </ul>
        </div>
        {/* Categories Widget */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md">
        <h3 className="font-headline-md text-headline-md text-primary mb-stack-md border-b border-outline-variant pb-3">
                                التصنيفات
                            </h3>
        <ul className="flex flex-col gap-2">
        <li>
        <a className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-high text-on-surface transition-colors font-body-md text-body-md" href="#">
        <span>تأسيس الشركات</span>
        <span className="bg-surface-variant text-on-surface-variant text-xs py-1 px-2 rounded-full">24</span>
        </a>
        </li>
        <li>
        <a className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-high text-on-surface transition-colors font-body-md text-body-md" href="#">
        <span>العقود التجارية</span>
        <span className="bg-surface-variant text-on-surface-variant text-xs py-1 px-2 rounded-full">18</span>
        </a>
        </li>
        <li>
        <a className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-high text-on-surface transition-colors font-body-md text-body-md" href="#">
        <span>الملكية الفكرية</span>
        <span className="bg-surface-variant text-on-surface-variant text-xs py-1 px-2 rounded-full">12</span>
        </a>
        </li>
        <li>
        <a className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-high text-on-surface transition-colors font-body-md text-body-md" href="#">
        <span>العمل والعمال</span>
        <span className="bg-surface-variant text-on-surface-variant text-xs py-1 px-2 rounded-full">31</span>
        </a>
        </li>
        <li>
        <a className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-high text-on-surface transition-colors font-body-md text-body-md" href="#">
        <span>الضرائب والزكاة</span>
        <span className="bg-surface-variant text-on-surface-variant text-xs py-1 px-2 rounded-full">9</span>
        </a>
        </li>
        </ul>
        </div>
        {/* CTA Widget */}
        <div className="bg-primary-container text-on-primary-container rounded-xl p-stack-lg text-center mt-stack-md border border-outline-variant">
        <span className="material-symbols-outlined text-4xl mb-4 text-secondary-container">support_agent</span>
        <h3 className="font-headline-md text-headline-md text-on-primary mb-2">تحتاج استشارة قانونية؟</h3>
        <p className="font-body-md text-body-md mb-6 opacity-90 text-sm">تواصل مع فريقنا من المحامين المتخصصين للحصول على استشارة مخصصة لحالتك.</p>
        <button className="w-full bg-secondary text-on-secondary px-6 py-3 rounded-lg hover:bg-secondary-container hover:text-on-secondary-container transition-colors font-label-sm text-label-sm uppercase tracking-wider">
                                احجز استشارة الآن
                            </button>
        </div>
        </aside>
        </div>
        </main>
        {/* Footer */}
        <footer className="bg-surface-container-highest dark:bg-surface-container-highest text-primary dark:text-on-primary-fixed font-body-md text-body-md w-full bottom-0 flat no shadows mt-stack-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop py-stack-lg max-w-container-max mx-auto rtl">
        <div className="col-span-1 md:col-span-1">
        <div className="text-headline-md font-headline-md text-primary mb-4">KMT Legal</div>
        <p className="text-on-surface-variant font-label-sm text-label-sm max-w-xs mb-4">
                             © 2024 KMT Legal. All rights reserved. Licensed by the Ministry of Justice.
                         </p>
        </div>
        <div className="col-span-1 md:col-span-3 flex flex-wrap gap-stack-lg md:justify-end">
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Privacy Policy</a>
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Terms of Service</a>
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Office Locations</a>
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Careers</a>
        </div>
        </div>
        </footer>
      </>
    </div>
  );
}

function Screen_contact(): JSX.Element {
  return (
    <div className={"bg-surface text-on-surface font-body-md antialiased min-h-screen flex flex-col rtl"} data-stitch-source={"kmt_legal_14"}>
      <style dangerouslySetInnerHTML={{ __html: ".material-symbols-outlined {\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\n          }\n          .glass-panel {\n              background: rgba(255, 255, 255, 0.7);\n              backdrop-filter: blur(10px);\n              -webkit-backdrop-filter: blur(10px);\n              border: 1px solid rgba(255, 255, 255, 0.3);\n          }" }} />
      <>
        {/* TopNavBar */}
        <header className="bg-surface-container-lowest dark:bg-surface-container-lowest w-full top-0 sticky border-b border-outline-variant dark:border-outline z-50">
        <div className="flex justify-between items-center px-margin-desktop max-w-container-max mx-auto h-20 rtl">
        <div className="flex items-center gap-8">
        {/* Brand */}
        <a className="text-headline-md font-headline-md text-primary dark:text-on-primary-fixed tracking-tight font-bold" href="#">
                            KMT Legal
                        </a>
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 font-body-md text-body-md" href="#">Practice Areas</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 font-body-md text-body-md" href="#">Our Team</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 font-body-md text-body-md" href="#">Insights</a>
        <a aria-current="page" className="text-secondary font-bold border-b-2 border-secondary pb-1 hover:text-secondary transition-colors duration-200 font-body-md text-body-md" href="#">Contact</a>
        </nav>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-on-surface-variant">
        <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer active:opacity-80">
        <span className="material-symbols-outlined">search</span>
        </button>
        <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer active:opacity-80">
        <span className="material-symbols-outlined">notifications</span>
        </button>
        </div>
        <button className="font-label-sm text-label-sm text-primary uppercase cursor-pointer active:opacity-80 hover:text-secondary transition-colors duration-200">
                            EN
                        </button>
        <button className="bg-secondary text-on-primary px-6 py-2 rounded font-label-sm text-label-sm font-medium hover:bg-opacity-90 transition-colors cursor-pointer active:opacity-80 hidden md:block">
                            Book Consultation
                        </button>
        {/* Mobile Menu Toggle */}
        <button className="md:hidden p-2 text-primary">
        <span className="material-symbols-outlined">menu</span>
        </button>
        </div>
        </div>
        </header>
        <main className="flex-grow w-full">
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 px-margin-mobile md:px-margin-desktop overflow-hidden border-b border-outline-variant">
        <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-cover bg-center opacity-30 mix-blend-luminosity" data-alt="A modern, high-end corporate office lobby with warm natural light filtering through large windows, showcasing minimalist white marble walls and deep navy blue accent furniture. Subtle reflections on glass surfaces. The mood is professional, secure, and luxurious." style={{ backgroundImage: "url('/stitch-assets/6764cfecee488659.png')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-surface/80 to-surface"></div>
        </div>
        <div className="relative z-10 max-w-container-max mx-auto text-center">
        <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-primary mb-stack-md">تواصل مع مكتبنا</h1>
        <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mx-auto">نحن هنا لتقديم الاستشارات القانونية والدعم اللازم لقضاياك. يرجى التواصل معنا عبر القنوات المتاحة أدناه أو حجز موعد لزيارة أحد فروعنا.</p>
        </div>
        </section>
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Column: Contact Info & Branches (Right visually due to RTL) */}
        <div className="lg:col-span-5 space-y-stack-lg">
        {/* Quick Contact Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
        {/* Phone */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md hover:border-secondary transition-colors group">
        <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center mb-stack-sm group-hover:bg-secondary-container transition-colors">
        <span className="material-symbols-outlined text-primary group-hover:text-secondary-container-on">call</span>
        </div>
        <h3 className="text-body-md font-body-md font-medium text-primary mb-1">الهاتف</h3>
        <p className="text-label-sm font-label-sm text-on-surface-variant dir-ltr text-right">+20 2 1234 5678</p>
        </div>
        {/* WhatsApp */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md hover:border-secondary transition-colors group">
        <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center mb-stack-sm group-hover:bg-secondary-container transition-colors">
        <span className="material-symbols-outlined text-primary group-hover:text-secondary-container-on">chat</span>
        </div>
        <h3 className="text-body-md font-body-md font-medium text-primary mb-1">واتساب</h3>
        <p className="text-label-sm font-label-sm text-on-surface-variant dir-ltr text-right">+20 10 9876 5432</p>
        </div>
        {/* Email */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md hover:border-secondary transition-colors group">
        <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center mb-stack-sm group-hover:bg-secondary-container transition-colors">
        <span className="material-symbols-outlined text-primary group-hover:text-secondary-container-on">mail</span>
        </div>
        <h3 className="text-body-md font-body-md font-medium text-primary mb-1">البريد الإلكتروني</h3>
        <p className="text-label-sm font-label-sm text-on-surface-variant">contact@kmtlegal.com</p>
        </div>
        {/* Hours */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md hover:border-secondary transition-colors group">
        <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center mb-stack-sm group-hover:bg-secondary-container transition-colors">
        <span className="material-symbols-outlined text-primary group-hover:text-secondary-container-on">schedule</span>
        </div>
        <h3 className="text-body-md font-body-md font-medium text-primary mb-1">ساعات العمل</h3>
        <p className="text-label-sm font-label-sm text-on-surface-variant">الأحد - الخميس: 9 ص - 5 م</p>
        </div>
        </div>
        {/* Branches */}
        <div>
        <h2 className="text-headline-md font-headline-md text-primary mb-stack-md">فروعنا</h2>
        <div className="space-y-stack-md">
        {/* Cairo Branch */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
        <div className="p-stack-md border-b border-outline-variant flex justify-between items-start">
        <div>
        <h3 className="text-body-lg font-body-lg font-medium text-primary mb-1">المقر الرئيسي - القاهرة</h3>
        <p className="text-body-md font-body-md text-on-surface-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">location_on</span>
                                                ٤٥ شارع النيل، الدقي، الجيزة، مصر
                                            </p>
        </div>
        <button className="text-secondary hover:text-primary transition-colors text-label-sm font-label-sm uppercase flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">directions</span>
                                            الاتجاهات
                                        </button>
        </div>
        <div className="h-32 w-full bg-surface-container-highest relative">
        {/* Map Placeholder */}
        <img className="w-full h-full object-cover opacity-80 mix-blend-multiply" data-alt="A clean, minimalist satellite map view of Cairo, Egypt, focusing on the Nile river area with a subtle gold map pin marker. The map uses a light mode, desaturated color palette with soft greys and whites, fitting a high-end corporate aesthetic." data-location="Cairo" src="/stitch-assets/11c3bae2e63b7192.png"/>
        </div>
        </div>
        {/* Alexandria Branch */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
        <div className="p-stack-md border-b border-outline-variant flex justify-between items-start">
        <div>
        <h3 className="text-body-lg font-body-lg font-medium text-primary mb-1">فرع الإسكندرية</h3>
        <p className="text-body-md font-body-md text-on-surface-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">location_on</span>
                                                ١٢ طريق الكورنيش، سان ستيفانو، الإسكندرية
                                            </p>
        </div>
        <button className="text-secondary hover:text-primary transition-colors text-label-sm font-label-sm uppercase flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">directions</span>
                                            الاتجاهات
                                        </button>
        </div>
        </div>
        </div>
        </div>
        </div>
        {/* Right Column: Contact Form (Left visually due to RTL) */}
        <div className="lg:col-span-7">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-margin-mobile md:p-margin-desktop shadow-sm relative overflow-hidden">
        <div className="mb-stack-lg relative z-10">
        <h2 className="text-headline-md font-headline-md text-primary mb-2">أرسل استفسارك</h2>
        <p className="text-body-md font-body-md text-on-surface-variant">يرجى تعبئة النموذج أدناه وسيقوم فريقنا بالرد عليك في أقرب وقت ممكن.</p>
        </div>
        <form className="space-y-stack-md relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
        {/* Name */}
        <div>
        <label className="block text-label-sm font-label-sm text-primary mb-2" htmlFor="fullName">الاسم الكامل</label>
        <input className="w-full bg-surface border border-outline-variant rounded focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all outline-none py-2 px-3 text-body-md font-body-md text-on-surface" id="fullName" placeholder="أدخل اسمك الكريم" type="text"/>
        </div>
        {/* Phone */}
        <div>
        <label className="block text-label-sm font-label-sm text-primary mb-2" htmlFor="phone">رقم الهاتف</label>
        <input className="w-full bg-surface border border-outline-variant rounded focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all outline-none py-2 px-3 text-body-md font-body-md text-on-surface" dir="ltr" id="phone" placeholder="+20 10 XXXX XXXX" type="tel"/>
        </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
        {/* Email */}
        <div>
        <label className="block text-label-sm font-label-sm text-primary mb-2" htmlFor="email">البريد الإلكتروني</label>
        <input className="w-full bg-surface border border-outline-variant rounded focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all outline-none py-2 px-3 text-body-md font-body-md text-on-surface" dir="ltr" id="email" placeholder="name@example.com" type="email"/>
        </div>
        {/* Inquiry Type */}
        <div>
        <label className="block text-label-sm font-label-sm text-primary mb-2" htmlFor="inquiryType">نوع الاستفسار</label>
        <select className="w-full bg-surface border border-outline-variant rounded focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all outline-none py-2 px-3 text-body-md font-body-md text-on-surface appearance-none pr-8" id="inquiryType">
        <option disabled selected value="">اختر نوع الاستفسار</option>
        <option value="corporate">قضايا الشركات والتجاري</option>
        <option value="civil">القضايا المدنية</option>
        <option value="realestate">العقارات والإنشاءات</option>
        <option value="other">استشارة عامة</option>
        </select>
        </div>
        </div>
        {/* Message */}
        <div>
        <label className="block text-label-sm font-label-sm text-primary mb-2" htmlFor="message">الرسالة أو تفاصيل القضية</label>
        <textarea className="w-full bg-surface border border-outline-variant rounded focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all outline-none py-2 px-3 text-body-md font-body-md text-on-surface resize-none" id="message" placeholder="يرجى تزويدنا بتفاصيل مختصرة..." rows={5}></textarea>
        </div>
        {/* Privacy Consent */}
        <div className="flex items-start gap-3 mt-stack-md">
        <div className="flex items-center h-6">
        <input className="w-4 h-4 rounded border-outline-variant text-secondary focus:ring-secondary/50 bg-surface cursor-pointer" id="privacyConsent" type="checkbox"/>
        </div>
        <div className="text-label-sm font-label-sm text-on-surface-variant leading-relaxed">
        <label className="cursor-pointer" htmlFor="privacyConsent">
                                            أوافق على سياسة الخصوصية وأقر بأن المعلومات المقدمة ستعامل بسرية تامة من قبل فريق KMT Legal ولا تشكل علاقة موكل بمحام حتى يتم توقيع اتفاقية رسمية.
                                        </label>
        </div>
        </div>
        {/* Submit Button */}
        <div className="pt-stack-md border-t border-outline-variant mt-stack-lg">
        <button className="w-full md:w-auto bg-secondary text-on-primary px-8 py-3 rounded font-label-sm text-label-sm font-medium hover:bg-opacity-90 transition-colors cursor-pointer active:opacity-80 flex items-center justify-center gap-2" type="submit">
        <span>إرسال الطلب</span>
        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'wght' 600" }}>send</span>
        </button>
        </div>
        </form>
        </div>
        </div>
        </div>
        </main>
        {/* Footer */}
        <footer className="bg-surface-container-highest dark:bg-surface-container-highest w-full bottom-0 border-t border-outline-variant">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop py-stack-lg max-w-container-max mx-auto rtl">
        {/* Brand & Copyright */}
        <div className="col-span-1 md:col-span-2 space-y-4">
        <div className="text-headline-md font-headline-md text-primary font-bold">
                            KMT Legal
                        </div>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                            © 2024 KMT Legal. All rights reserved. Licensed by the Ministry of Justice.
                        </p>
        </div>
        {/* Links Column 1 */}
        <div className="col-span-1 space-y-2">
        <a className="block font-body-md text-body-md text-on-surface-variant hover:text-primary transition-opacity duration-300 underline" href="#">Privacy Policy</a>
        <a className="block font-body-md text-body-md text-on-surface-variant hover:text-primary transition-opacity duration-300 underline" href="#">Terms of Service</a>
        </div>
        {/* Links Column 2 */}
        <div className="col-span-1 space-y-2">
        <a className="block font-body-md text-body-md text-on-surface-variant hover:text-primary transition-opacity duration-300 underline" href="#">Office Locations</a>
        <a className="block font-body-md text-body-md text-on-surface-variant hover:text-primary transition-opacity duration-300 underline" href="#">Careers</a>
        </div>
        </div>
        </footer>
      </>
    </div>
  );
}

function Screen_login(): JSX.Element {
  return (
    <div className={"bg-background min-h-screen font-body-md text-on-background antialiased flex flex-col md:flex-row"} data-stitch-source={"kmt_legal_6"}>
      <style dangerouslySetInnerHTML={{ __html: ".glass-panel {\n            background: rgba(255, 255, 255, 0.85);\n            backdrop-filter: blur(12px);\n            border: 1px solid rgba(226, 232, 240, 0.8);\n        }\n        .form-input-glow:focus {\n            box-shadow: 0 0 0 2px rgba(19, 27, 46, 0.1);\n            border-color: #131b2e;\n        }" }} />
      <>
        {/* Left Side: Visual / Branding (Hidden on mobile) */}
        <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-surface-container-low relative flex-col justify-between p-margin-desktop overflow-hidden border-l border-outline-variant">
        {/* Background Image/Texture */}
        <div className="absolute inset-0 z-0 opacity-80" data-alt="A sophisticated, abstract legal-tech visualization featuring subtle geometric lines and scales of justice integrated into a modern architectural space. The environment is bathed in bright, soft white lighting typical of a high-end corporate office. The color palette emphasizes clean whites, light grays, and muted navy blues, conveying absolute security, precision, and modern legal authority." style={{ backgroundImage: "url('/stitch-assets/927e808522dfd86d.png')" }}>
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-surface-container-low via-transparent to-surface-container-low/50"></div>
        {/* Branding */}
        <div className="relative z-20">
        <h1 className="font-headline-md text-headline-md text-primary font-bold">KMT Legal</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-md">
                        التميز في تقديم الاستشارات القانونية. حماية بياناتك وأعمالك هي أولويتنا القصوى.
                    </p>
        </div>
        {/* Role Hint & Security Note */}
        <div className="relative z-20 mt-auto glass-panel p-stack-lg rounded-xl max-w-lg">
        <div className="flex items-center gap-3 mb-stack-sm">
        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>shield_lock</span>
        <h3 className="font-headline-md text-body-lg font-semibold text-primary">بوابة العملاء وفريق المكتب</h3>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">
                        هذا النظام محمي بأحدث تقنيات التشفير. يتم مراقبة جميع عمليات الدخول لضمان أقصى درجات السرية والأمان لملفاتك القانونية.
                    </p>
        </div>
        </div>
        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center px-margin-mobile md:px-margin-desktop py-stack-lg bg-surface-container-lowest min-h-screen">
        <div className="max-w-md w-full mx-auto">
        {/* Mobile Branding (Visible only on mobile) */}
        <div className="md:hidden text-center mb-stack-lg">
        <h1 className="font-headline-md text-display-lg-mobile text-primary font-bold mb-2">KMT Legal</h1>
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Client Portal</p>
        </div>
        {/* Header */}
        <div className="mb-stack-lg text-center md:text-right">
        <h2 className="font-display-lg-mobile text-display-lg-mobile text-primary mb-stack-sm">تسجيل الدخول</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">الرجاء إدخال بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم.</p>
        </div>
        {/* Form */}
        <form action="#" className="space-y-stack-md" method="POST">
        {/* Email */}
        <div>
        <label className="block font-label-sm text-label-sm text-on-surface mb-2" htmlFor="email">البريد الإلكتروني</label>
        <div className="relative">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">mail</span>
        </div>
        <input className="block w-full pl-3 pr-10 py-3 bg-surface border border-outline-variant rounded-lg text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-0 form-input-glow transition-all duration-200" dir="ltr" id="email" name="email" placeholder="name@kmtlegal.com" required type="email"/>
        </div>
        </div>
        {/* Password */}
        <div>
        <label className="block font-label-sm text-label-sm text-on-surface mb-2" htmlFor="password">كلمة المرور</label>
        <div className="relative">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">lock</span>
        </div>
        <input className="block w-full pl-3 pr-10 py-3 bg-surface border border-outline-variant rounded-lg text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-0 form-input-glow transition-all duration-200" dir="ltr" id="password" name="password" placeholder="••••••••" required type="password"/>
        </div>
        </div>
        {/* Options Row */}
        <div className="flex items-center justify-between py-2">
        <div className="flex items-center">
        <input className="h-4 w-4 text-secondary focus:ring-primary border-outline-variant rounded cursor-pointer" id="remember-me" name="remember-me" type="checkbox"/>
        <label className="mr-2 block font-body-md text-label-sm text-on-surface-variant cursor-pointer" htmlFor="remember-me">
                                    تذكرني
                                </label>
        </div>
        <div className="text-sm">
        <a className="font-label-sm text-label-sm text-secondary hover:text-on-secondary-fixed-variant transition-colors underline-offset-2 hover:underline" href="#">
                                    نسيت كلمة المرور؟
                                </a>
        </div>
        </div>
        {/* Submit Button */}
        <div className="pt-stack-sm">
        <button className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-label-sm text-body-md font-medium text-white bg-secondary hover:bg-on-secondary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors duration-200" type="submit">
                                تسجيل الدخول
                                <span className="material-symbols-outlined mr-2 text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_left_alt</span>
        </button>
        </div>
        </form>
        {/* Footer minimal */}
        <div className="mt-stack-lg text-center">
        <p className="font-label-sm text-label-sm text-outline">
                            © 2024 KMT Legal. جميع الحقوق محفوظة.
                        </p>
        </div>
        </div>
        </div>
      </>
    </div>
  );
}

function Screen_portal_dashboard(): JSX.Element {
  return (
    <div className={"bg-background text-on-background font-body-md min-h-screen rtl flex"} data-stitch-source={"kmt_legal_13"}>
      <style dangerouslySetInnerHTML={{ __html: ".material-symbols-outlined {\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\n        }" }} />
      <>
        {/* SideNavBar (from JSON) */}
        <nav className="bg-surface-container-low dark:bg-surface-container-low text-secondary dark:text-secondary-fixed font-label-sm text-label-sm h-screen w-64 fixed right-0 top-0 rtl border-l border-outline-variant dark:border-outline flat no shadows flex flex-col h-full py-stack-md z-50">
        {/* Header */}
        <div className="px-margin-desktop mb-stack-lg">
        <h1 className="text-headline-md font-headline-md text-primary">KMT Legal</h1>
        <p className="text-on-surface-variant mt-stack-sm">Management Portal</p>
        </div>
        {/* Navigation Links */}
        <div className="flex-grow flex flex-col gap-stack-sm">
        {/* Active Tab: Dashboard */}
        <a className="bg-secondary-container text-on-secondary-container rounded-lg mx-2 flex items-center px-4 py-3 transition-colors duration-200" href="#">
        <span className="material-symbols-outlined ml-3" data-icon="dashboard">dashboard</span>
        <span>Dashboard</span>
        </a>
        {/* Inactive Tabs */}
        <a className="text-on-surface-variant hover:bg-surface-container-high mx-2 flex items-center px-4 py-3 rounded-lg hover:bg-surface-container-high transition-all duration-200" href="#">
        <span className="material-symbols-outlined ml-3" data-icon="folder_shared">folder_shared</span>
        <span>Cases</span>
        </a>
        <a className="text-on-surface-variant hover:bg-surface-container-high mx-2 flex items-center px-4 py-3 rounded-lg hover:bg-surface-container-high transition-all duration-200" href="#">
        <span className="material-symbols-outlined ml-3" data-icon="description">description</span>
        <span>Documents</span>
        </a>
        <a className="text-on-surface-variant hover:bg-surface-container-high mx-2 flex items-center px-4 py-3 rounded-lg hover:bg-surface-container-high transition-all duration-200" href="#">
        <span className="material-symbols-outlined ml-3" data-icon="calendar_month">calendar_month</span>
        <span>Calendar</span>
        </a>
        <a className="text-on-surface-variant hover:bg-surface-container-high mx-2 flex items-center px-4 py-3 rounded-lg hover:bg-surface-container-high transition-all duration-200" href="#">
        <span className="material-symbols-outlined ml-3" data-icon="group">group</span>
        <span>Clients</span>
        </a>
        <a className="text-on-surface-variant hover:bg-surface-container-high mx-2 flex items-center px-4 py-3 rounded-lg hover:bg-surface-container-high transition-all duration-200" href="#">
        <span className="material-symbols-outlined ml-3" data-icon="settings">settings</span>
        <span>Settings</span>
        </a>
        </div>
        {/* CTA & Footer Actions */}
        <div className="px-margin-desktop mt-auto pt-stack-lg border-t border-outline-variant">
        <button className="w-full bg-secondary text-on-secondary rounded-lg py-2 font-label-sm mb-stack-md hover:opacity-90 transition-opacity">
                        New Filing
                    </button>
        <div className="flex flex-col gap-stack-sm">
        <a className="text-on-surface-variant hover:bg-surface-container-high flex items-center px-2 py-2 rounded-lg transition-all duration-200" href="#">
        <span className="material-symbols-outlined ml-3" data-icon="help">help</span>
        <span>Support</span>
        </a>
        <a className="text-on-surface-variant hover:bg-surface-container-high flex items-center px-2 py-2 rounded-lg transition-all duration-200" href="#">
        <span className="material-symbols-outlined ml-3" data-icon="logout">logout</span>
        <span>Logout</span>
        </a>
        </div>
        </div>
        </nav>
        {/* Main Content Area */}
        <main className="flex-1 mr-64">
        {/* Top App Bar (Mobile Only / Utility) */}
        <header className="bg-surface-container-lowest sticky top-0 z-40 border-b border-outline-variant px-margin-desktop py-stack-md flex justify-between items-center h-20 rtl">
        <div className="flex items-center gap-stack-md lg:hidden">
        <button className="text-on-surface-variant p-2">
        <span className="material-symbols-outlined" data-icon="menu">menu</span>
        </button>
        <span className="text-headline-md font-headline-md text-primary">KMT Legal</span>
        </div>
        <div className="flex-grow flex justify-end items-center gap-stack-lg">
        <div className="hidden md:flex items-center gap-stack-md">
        <button className="text-on-surface-variant hover:text-secondary transition-colors duration-200">
        <span className="material-symbols-outlined" data-icon="search">search</span>
        </button>
        <button className="text-on-surface-variant hover:text-secondary transition-colors duration-200 relative">
        <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
        <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
        </button>
        </div>
        <div className="flex items-center gap-stack-md border-r border-outline-variant pr-stack-md">
        <span className="font-label-sm text-on-surface-variant">محمد عبد الله</span>
        <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant overflow-hidden">
        <img alt="User profile" className="w-full h-full object-cover" data-alt="A professional headshot of a Middle Eastern male executive, late 30s, wearing a tailored dark navy suit and white shirt, subtle warm studio lighting, neutral grey background, high resolution corporate photography style." src="/stitch-assets/0876d03f16a6e987.png"/>
        </div>
        </div>
        </div>
        </header>
        {/* Dashboard Canvas */}
        <div className="p-margin-desktop max-w-container-max mx-auto">
        {/* Welcome Header */}
        <div className="mb-stack-lg">
        <h2 className="font-display-lg text-display-lg text-primary mb-stack-sm">أهلاً، محمد</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">إليك نظرة عامة على ملفاتك ومواعيدك القادمة.</p>
        </div>
        {/* Bento Grid: Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-stack-lg">
        {/* Metric 1: Active Cases */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col justify-between h-32 hover:border-secondary transition-colors">
        <div className="flex justify-between items-start">
        <span className="text-on-surface-variant font-label-sm">القضايا النشطة</span>
        <div className="p-2 bg-secondary-container/20 rounded-lg text-secondary">
        <span className="material-symbols-outlined" data-icon="folder_shared">folder_shared</span>
        </div>
        </div>
        <div>
        <span className="font-headline-md text-headline-md text-primary">3</span>
        </div>
        </div>
        {/* Metric 2: Upcoming Appointments */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col justify-between h-32 hover:border-secondary transition-colors">
        <div className="flex justify-between items-start">
        <span className="text-on-surface-variant font-label-sm">مواعيد قادمة</span>
        <div className="p-2 bg-surface-container-high rounded-lg text-on-surface-variant">
        <span className="material-symbols-outlined" data-icon="calendar_month">calendar_month</span>
        </div>
        </div>
        <div>
        <span className="font-headline-md text-headline-md text-primary">1</span>
        </div>
        </div>
        {/* Metric 3: Required Documents */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col justify-between h-32 hover:border-secondary transition-colors">
        <div className="flex justify-between items-start">
        <span className="text-on-surface-variant font-label-sm">مستندات مطلوبة</span>
        <div className="p-2 bg-error-container/20 rounded-lg text-error">
        <span className="material-symbols-outlined" data-icon="description">description</span>
        </div>
        </div>
        <div>
        <span className="font-headline-md text-headline-md text-primary">2</span>
        </div>
        </div>
        {/* Metric 4: New Messages */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col justify-between h-32 hover:border-secondary transition-colors">
        <div className="flex justify-between items-start">
        <span className="text-on-surface-variant font-label-sm">رسائل جديدة</span>
        <div className="p-2 bg-primary-fixed-dim/20 rounded-lg text-primary-container">
        <span className="material-symbols-outlined" data-icon="mail">mail</span>
        </div>
        </div>
        <div>
        <span className="font-headline-md text-headline-md text-primary">5</span>
        </div>
        </div>
        </div>
        {/* Asymmetric Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Main Column: Active Case Summaries (Span 2) */}
        <div className="lg:col-span-2 space-y-gutter">
        <div className="flex justify-between items-end mb-stack-md">
        <h3 className="font-headline-md text-headline-md text-primary">ملخص القضايا النشطة</h3>
        <a className="text-secondary font-label-sm hover:underline" href="#">عرض الكل</a>
        </div>
        {/* Case Card 1 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md hover:border-secondary transition-colors">
        <div className="flex justify-between items-start border-b border-outline-variant pb-stack-sm mb-stack-sm">
        <div>
        <div className="flex items-center gap-stack-sm mb-2">
        <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant font-label-sm rounded-DEFAULT text-[10px]">#KMT-2024-089</span>
        <span className="px-2 py-1 bg-blue-50 text-blue-700 font-label-sm rounded-DEFAULT text-[10px]">نشط</span>
        </div>
        <h4 className="font-body-lg text-body-lg text-primary">نزاع تجاري - شركة الأفق</h4>
        </div>
        <span className="text-on-surface-variant font-label-sm">تحديث: 12 أكتوبر</span>
        </div>
        <div className="text-on-surface-variant font-body-md mb-stack-md">
                                    تم تقديم المذكرة الجوابية للمحكمة التجارية. ننتظر تحديد موعد الجلسة القادمة.
                                </div>
        <div className="flex gap-stack-md">
        <button className="text-secondary font-label-sm hover:opacity-80 flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]" data-icon="visibility">visibility</span>
                                        تفاصيل القضية
                                    </button>
        </div>
        </div>
        {/* Case Card 2 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md hover:border-secondary transition-colors">
        <div className="flex justify-between items-start border-b border-outline-variant pb-stack-sm mb-stack-sm">
        <div>
        <div className="flex items-center gap-stack-sm mb-2">
        <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant font-label-sm rounded-DEFAULT text-[10px]">#KMT-2024-112</span>
        <span className="px-2 py-1 bg-amber-50 text-amber-700 font-label-sm rounded-DEFAULT text-[10px]">قيد المراجعة</span>
        </div>
        <h4 className="font-body-lg text-body-lg text-primary">مراجعة عقد تأسيس - فرع جديد</h4>
        </div>
        <span className="text-on-surface-variant font-label-sm">تحديث: 10 أكتوبر</span>
        </div>
        <div className="text-on-surface-variant font-body-md mb-stack-md">
                                    تم الانتهاء من المسودة الأولى للعقد. مطلوب مراجعة البند الرابع والموافقة عليه.
                                </div>
        <div className="flex gap-stack-md">
        <button className="text-secondary font-label-sm hover:opacity-80 flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]" data-icon="visibility">visibility</span>
                                        تفاصيل القضية
                                    </button>
        <button className="text-error font-label-sm hover:opacity-80 flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]" data-icon="upload_file">upload_file</span>
                                        إرفاق مستند
                                    </button>
        </div>
        </div>
        </div>
        {/* Secondary Column: Next Appointment (Span 1) */}
        <div>
        <h3 className="font-headline-md text-headline-md text-primary mb-stack-md">الموعد القادم</h3>
        <div className="bg-primary-container text-on-primary-container rounded-lg p-stack-md">
        <div className="flex items-start justify-between mb-stack-lg">
        <div className="bg-on-primary-container/20 p-3 rounded-lg">
        <span className="material-symbols-outlined text-inverse-primary" data-icon="event">event</span>
        </div>
        <div className="text-left">
        <span className="block font-headline-md text-on-primary">15</span>
        <span className="block font-label-sm text-inverse-primary">أكتوبر</span>
        </div>
        </div>
        <div className="mb-stack-lg">
        <h4 className="font-body-lg text-on-primary mb-1">اجتماع استشاري - استراتيجية التقاضي</h4>
        <p className="font-body-md text-inverse-primary flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]" data-icon="schedule">schedule</span>
                                        10:00 صباحاً - 11:30 صباحاً
                                    </p>
        <p className="font-body-md text-inverse-primary flex items-center gap-2 mt-2">
        <span className="material-symbols-outlined text-[16px]" data-icon="location_on">location_on</span>
                                        مكتب الرياض الرئيسي
                                    </p>
        </div>
        <div className="flex flex-col gap-stack-sm">
        <button className="w-full bg-secondary text-on-secondary rounded-lg py-2 font-label-sm hover:opacity-90 transition-opacity">
                                        تأكيد الحضور
                                    </button>
        <button className="w-full border border-outline text-inverse-primary rounded-lg py-2 font-label-sm hover:bg-on-primary-container/10 transition-colors">
                                        إعادة جدولة
                                    </button>
        </div>
        </div>
        </div>
        </div>
        </div>
        </main>
      </>
    </div>
  );
}

function Screen_portal_case_detail(): JSX.Element {
  return (
    <div className={"bg-background min-h-screen flex text-on-background rtl"} data-stitch-source={"kmt_legal_10"}>
      <style dangerouslySetInnerHTML={{ __html: "body {\n    background-color: theme('colors.background');\n    color: theme('colors.on-background');\n  }" }} />
      <>
        {/* SideNavBar Component */}
        <aside className="hidden md:flex flex-col h-screen w-64 fixed right-0 top-0 rtl bg-surface-container-low border-l border-outline-variant py-stack-md z-40">
        <div className="px-margin-desktop mb-stack-lg">
        <div className="text-headline-md font-headline-md text-primary mb-1">KMT Legal</div>
        <div className="font-label-sm text-label-sm text-on-surface-variant">Management Portal</div>
        </div>
        <div className="px-4 mb-stack-lg">
        <button className="w-full bg-secondary text-on-secondary py-2 px-4 rounded font-label-sm text-label-sm flex items-center justify-center gap-2 hover:bg-on-secondary-container transition-colors">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
                New Filing
              </button>
        </div>
        <nav className="flex-1 flex flex-col gap-1 px-2">
        <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">dashboard</span>
        <span className="font-label-sm text-label-sm">Dashboard</span>
        </a>
        <a className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary-container text-on-secondary-container transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">folder_shared</span>
        <span className="font-label-sm text-label-sm">Cases</span>
        </a>
        <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">description</span>
        <span className="font-label-sm text-label-sm">Documents</span>
        </a>
        <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">calendar_month</span>
        <span className="font-label-sm text-label-sm">Calendar</span>
        </a>
        <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">group</span>
        <span className="font-label-sm text-label-sm">Clients</span>
        </a>
        <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">settings</span>
        <span className="font-label-sm text-label-sm">Settings</span>
        </a>
        </nav>
        <div className="mt-auto flex flex-col gap-1 px-2 border-t border-outline-variant pt-4">
        <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">help</span>
        <span className="font-label-sm text-label-sm">Support</span>
        </a>
        <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">logout</span>
        <span className="font-label-sm text-label-sm">Logout</span>
        </a>
        </div>
        </aside>
        {/* Mobile TopNavBar Component */}
        <header className="md:hidden w-full top-0 sticky bg-surface-container-lowest border-b border-outline-variant z-50">
        <div className="flex justify-between items-center px-margin-mobile h-20 rtl">
        <div className="text-headline-md font-headline-md text-primary">KMT Legal</div>
        <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-secondary cursor-pointer">search</span>
        <span className="material-symbols-outlined text-secondary cursor-pointer">menu</span>
        </div>
        </div>
        </header>
        {/* Main Content Canvas */}
        <main className="flex-1 md:mr-64 w-full p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto">
        {/* Page Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-stack-lg">
        <div>
        <div className="flex items-center gap-3 mb-2">
        <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-primary">ملف استشارة عقارية</h1>
        <span className="px-3 py-1 rounded-full bg-secondary-container/20 text-secondary border border-secondary/30 font-label-sm text-label-sm flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                    قيد المراجعة
                  </span>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">رقم الملف: #KMT-2024-0892</p>
        </div>
        <div className="flex items-center gap-3">
        <button className="bg-secondary text-on-secondary px-6 py-2 rounded font-body-md text-body-md flex items-center gap-2 hover:bg-on-secondary-container transition-colors shadow-sm">
        <span className="material-symbols-outlined text-[20px]">upload_file</span>
                  إرسال مستند جديد
                </button>
        </div>
        </div>
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left/Main Column: Tabs & Content */}
        <div className="lg:col-span-8 flex flex-col gap-gutter">
        {/* Tabs Navigation */}
        <div className="border-b border-outline-variant bg-surface-container-lowest px-4 pt-2 rounded-t-lg">
        <nav aria-label="Tabs" className="flex gap-6 overflow-x-auto">
        <button className="border-b-2 border-secondary py-4 px-1 font-body-md text-body-md font-medium text-secondary whitespace-nowrap">
                      الملخص
                    </button>
        <button className="border-b-2 border-transparent py-4 px-1 font-body-md text-body-md font-medium text-on-surface-variant hover:text-secondary hover:border-outline whitespace-nowrap transition-colors">
                      المواعيد
                    </button>
        <button className="border-b-2 border-transparent py-4 px-1 font-body-md text-body-md font-medium text-on-surface-variant hover:text-secondary hover:border-outline whitespace-nowrap transition-colors">
                      المستندات
                    </button>
        <button className="border-b-2 border-transparent py-4 px-1 font-body-md text-body-md font-medium text-on-surface-variant hover:text-secondary hover:border-outline whitespace-nowrap transition-colors">
                      الرسائل
                    </button>
        <button className="border-b-2 border-transparent py-4 px-1 font-body-md text-body-md font-medium text-on-surface-variant hover:text-secondary hover:border-outline whitespace-nowrap transition-colors">
                      المدفوعات
                    </button>
        </nav>
        </div>
        {/* Tab Content Area (Summary) */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-b-lg rounded-tl-lg p-6 shadow-sm">
        <h2 className="text-headline-md font-headline-md text-primary mb-stack-md">تفاصيل القضية</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg leading-relaxed">
                    استشارة قانونية شاملة بخصوص نزاع ملكية تجارية في منطقة الأعمال المركزية. يتطلب الملف مراجعة العقود السابقة وتقييم الالتزامات القانونية للأطراف المعنية قبل الشروع في أي إجراءات تقاضي رسمية.
                  </p>
        <h3 className="font-body-lg text-body-lg text-primary mb-4 border-b border-outline-variant pb-2">سجل التطورات (Timeline)</h3>
        <div className="relative border-r border-outline-variant mr-3 pr-6 pb-4">
        <div className="absolute w-3 h-3 bg-secondary rounded-full -right-[6.5px] top-1"></div>
        <div className="mb-1">
        <span className="font-label-sm text-label-sm text-secondary bg-secondary-container/30 px-2 py-0.5 rounded">اليوم، 10:30 صباحاً</span>
        </div>
        <h4 className="font-body-md text-body-md font-medium text-primary">تم استلام الدفعة الأولى</h4>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">تم تأكيد استلام الرسوم الاستشارية المبدئية والبدء في مراجعة الملف.</p>
        </div>
        <div className="relative border-r border-outline-variant mr-3 pr-6 pb-4">
        <div className="absolute w-3 h-3 bg-outline rounded-full -right-[6.5px] top-1"></div>
        <div className="mb-1">
        <span className="font-label-sm text-label-sm text-on-surface-variant">12 أكتوبر 2024</span>
        </div>
        <h4 className="font-body-md text-body-md font-medium text-primary">اجتماع تمهيدي</h4>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">عقد اجتماع أولي مع العميل لمناقشة تفاصيل النزاع واستلام المستندات الأولية.</p>
        </div>
        <div className="relative mr-3 pr-6">
        <div className="absolute w-3 h-3 bg-outline rounded-full -right-[6.5px] top-1"></div>
        <div className="mb-1">
        <span className="font-label-sm text-label-sm text-on-surface-variant">10 أكتوبر 2024</span>
        </div>
        <h4 className="font-body-md text-body-md font-medium text-primary">فتح الملف</h4>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">تم إنشاء الملف وإسناده للفريق القانوني المختص بالعقارات.</p>
        </div>
        </div>
        </div>
        {/* Right/Sidebar Column: Info Cards */}
        <div className="lg:col-span-4 flex flex-col gap-stack-md">
        {/* Case Meta Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-sm">
        <h3 className="font-body-lg text-body-lg font-medium text-primary mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">info</span>
                    معلومات الملف
                  </h3>
        <ul className="flex flex-col gap-4">
        <li className="flex justify-between items-center border-b border-outline-variant pb-2">
        <span className="font-body-md text-body-md text-on-surface-variant">نوع الملف</span>
        <span className="font-body-md text-body-md font-medium text-primary">استشارة عقارية</span>
        </li>
        <li className="flex justify-between items-center border-b border-outline-variant pb-2">
        <span className="font-body-md text-body-md text-on-surface-variant">المحامي المسؤول</span>
        <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-secondary font-label-sm">أ.م</div>
        <span className="font-body-md text-body-md font-medium text-primary">أحمد محمود</span>
        </div>
        </li>
        <li className="flex justify-between items-center pb-1">
        <span className="font-body-md text-body-md text-on-surface-variant">تاريخ الفتح</span>
        <span className="font-body-md text-body-md font-medium text-primary">10/10/2024</span>
        </li>
        </ul>
        </div>
        {/* Next Action Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-1 bg-secondary"></div>
        <h3 className="font-body-lg text-body-lg font-medium text-primary mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">event</span>
                    الموعد القادم
                  </h3>
        <div className="bg-surface rounded p-3 mb-4">
        <div className="font-body-md text-body-md font-medium text-primary">جلسة استماع أولية</div>
        <div className="font-label-sm text-label-sm text-on-surface-variant mt-1 flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">schedule</span>
                      الخميس، 24 أكتوبر 2024 - 10:00 ص
                    </div>
        <div className="font-label-sm text-label-sm text-on-surface-variant mt-1 flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">videocam</span>
                      اجتماع مرئي (Zoom)
                    </div>
        </div>
        <button className="w-full bg-transparent border border-outline text-primary py-2 rounded font-body-md text-body-md hover:bg-surface transition-colors">
                    عرض التفاصيل
                  </button>
        </div>
        </div>
        </div>
        </main>
      </>
    </div>
  );
}

function Screen_portal_documents(): JSX.Element {
  return (
    <div className={"bg-surface text-on-surface font-body-md min-h-screen flex rtl"} data-stitch-source={"kmt_legal_11"}>
      <style dangerouslySetInnerHTML={{ __html: ".drag-active {\n            border-color: #755a26;\n            background-color: rgba(117, 90, 38, 0.05);\n        }\n        .shimmer {\n            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);\n            background-size: 200% 100%;\n            animation: shimmer 2s infinite linear;\n        }\n        @keyframes shimmer {\n            0% { background-position: 200% 0; }\n            100% { background-position: -200% 0; }\n        }" }} />
      <>
        {/* SideNavBar */}
        <nav className="bg-surface-container-low h-screen w-64 fixed right-0 top-0 border-l border-outline-variant flex flex-col h-full py-stack-md z-40 hidden md:flex">
        <div className="px-margin-desktop mb-stack-lg">
        <h1 className="text-headline-md font-headline-md text-primary">KMT Legal</h1>
        <p className="text-on-surface-variant font-label-sm text-label-sm mt-1">Management Portal</p>
        </div>
        <div className="px-stack-md mb-stack-md">
        <button className="w-full bg-secondary text-on-secondary py-2 px-4 rounded-lg font-label-sm text-label-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
                        New Filing
                    </button>
        </div>
        <ul className="flex-1 space-y-1">
        <li>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all mx-2 rounded-lg font-label-sm text-label-sm" href="#">
        <span className="material-symbols-outlined">dashboard</span>
                            Dashboard
                        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all mx-2 rounded-lg font-label-sm text-label-sm" href="#">
        <span className="material-symbols-outlined">folder_shared</span>
                            Cases
                        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-lg mx-2 transition-all font-label-sm text-label-sm font-bold" href="#">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                            Documents
                        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all mx-2 rounded-lg font-label-sm text-label-sm" href="#">
        <span className="material-symbols-outlined">calendar_month</span>
                            Calendar
                        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all mx-2 rounded-lg font-label-sm text-label-sm" href="#">
        <span className="material-symbols-outlined">group</span>
                            Clients
                        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all mx-2 rounded-lg font-label-sm text-label-sm" href="#">
        <span className="material-symbols-outlined">settings</span>
                            Settings
                        </a>
        </li>
        </ul>
        <div className="mt-auto border-t border-outline-variant pt-stack-md mx-2">
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg font-label-sm text-label-sm" href="#">
        <span className="material-symbols-outlined">help</span>
                        Support
                    </a>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg font-label-sm text-label-sm" href="#">
        <span className="material-symbols-outlined">logout</span>
                        Logout
                    </a>
        </div>
        </nav>
        {/* Main Content Area */}
        <main className="flex-1 md:mr-64 p-margin-mobile md:p-margin-desktop w-full max-w-container-max mx-auto">
        {/* Header Section */}
        <header className="flex justify-between items-end mb-stack-lg border-b border-outline-variant pb-stack-md">
        <div>
        <h2 className="font-display-lg text-display-lg text-primary">مستنداتي</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-2xl">
                            إدارة المستندات القانونية الخاصة بك بأمان. جميع الملفات مشفرة وتخضع لسياسة الخصوصية الصارمة.
                        </p>
        </div>
        <div className="hidden md:flex items-center gap-4">
        <button className="bg-surface-container-highest p-2 rounded-full text-on-surface-variant hover:text-primary transition-colors">
        <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant overflow-hidden">
        <img alt="User profile" className="w-full h-full object-cover" data-alt="A professional headshot of a corporate executive in a modern high-key office environment, subtle lighting." src="/stitch-assets/fc5159de1339cd35.png"/>
        </div>
        </div>
        </header>
        {/* Security Banner */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md mb-stack-lg flex items-start gap-4">
        <span className="material-symbols-outlined text-secondary text-2xl mt-1">shield</span>
        <div>
        <h4 className="font-headline-md text-body-md font-bold text-primary">اتصال آمن ومشفر</h4>
        <p className="font-body-md text-label-sm text-on-surface-variant mt-1">
                            جميع المستندات المرفوعة هنا محمية بتشفير من طرف إلى طرف (End-to-End Encryption) ولا يمكن الوصول إليها إلا من قبل الفريق القانوني المصرح له في KMT Legal.
                        </p>
        </div>
        </div>
        {/* Upload Zone */}
        <section className="mb-stack-lg">
        <h3 className="font-headline-md text-headline-md text-primary mb-stack-md">رفع مستند جديد</h3>
        <div className="w-full bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-xl p-stack-lg flex flex-col items-center justify-center text-center transition-all duration-300 relative overflow-hidden group hover:border-secondary hover:bg-surface-container-low cursor-pointer min-h-[200px]" id="dropzone">
        <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-10 pointer-events-none"></div>
        <span className="material-symbols-outlined text-4xl text-outline mb-4 group-hover:text-secondary transition-colors" style={{ fontVariationSettings: "'FILL' 0" }}>cloud_upload</span>
        <p className="font-body-lg text-body-lg text-primary mb-2">قم بسحب وإفلات الملفات هنا أو انقر للتصفح</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">
                            الصيغ المدعومة: PDF, DOCX, JPG, PNG (الحد الأقصى: 50MB)
                        </p>
        <input accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" id="fileInput" multiple type="file"/>
        </div>
        </section>
        {/* Document Table */}
        <section>
        <div className="flex justify-between items-center mb-stack-md">
        <h3 className="font-headline-md text-headline-md text-primary">المستندات المرفوعة</h3>
        <div className="relative w-64">
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pr-10 pl-4 font-body-md text-body-md text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="بحث في المستندات..." type="text"/>
        </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
        <thead className="bg-surface-container-low border-b border-outline-variant">
        <tr>
        <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold">اسم المستند</th>
        <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold">النوع</th>
        <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold">القضية المرتبطة</th>
        <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold">تاريخ الرفع</th>
        <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold">الحالة</th>
        <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant font-semibold text-left">إجراءات</th>
        </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
        {/* Row 1: Under Review */}
        <tr className="hover:bg-surface-container-low transition-colors group">
        <td className="py-4 px-6">
        <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-error-container text-on-error-container flex items-center justify-center">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
        </div>
        <div>
        <p className="font-body-md text-body-md text-primary font-medium">عقد_تأسيس_الشركة_محدث.pdf</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">2.4 MB</p>
        </div>
        </div>
        </td>
        <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant">قانوني / عقود</td>
        <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant">KMT-2024-089</td>
        <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant">15 أكتوبر 2024</td>
        <td className="py-4 px-6">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                                قيد المراجعة
                                            </span>
        </td>
        <td className="py-4 px-6 text-left">
        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
        <span className="material-symbols-outlined">more_vert</span>
        </button>
        </td>
        </tr>
        {/* Row 2: Accepted */}
        <tr className="hover:bg-surface-container-low transition-colors group">
        <td className="py-4 px-6">
        <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
        </div>
        <div>
        <p className="font-body-md text-body-md text-primary font-medium">صورة_الهوية_الوطنية.jpg</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">850 KB</p>
        </div>
        </div>
        </td>
        <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant">إثبات هوية</td>
        <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant">ملف العميل العام</td>
        <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant">10 أكتوبر 2024</td>
        <td className="py-4 px-6">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-variant text-on-surface-variant">
        <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                                                مقبول
                                            </span>
        </td>
        <td className="py-4 px-6 text-left">
        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
        <span className="material-symbols-outlined">more_vert</span>
        </button>
        </td>
        </tr>
        {/* Row 3: New */}
        <tr className="hover:bg-surface-container-low transition-colors group">
        <td className="py-4 px-6">
        <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
        </div>
        <div>
        <p className="font-body-md text-body-md text-primary font-medium">مسودة_الاتفاقية_التجارية.docx</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">1.1 MB</p>
        </div>
        </div>
        </td>
        <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant">قانوني / مسودات</td>
        <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant">KMT-2024-112</td>
        <td className="py-4 px-6 font-body-md text-body-md text-on-surface-variant">اليوم، 09:30 ص</td>
        <td className="py-4 px-6">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-outline-variant text-primary">
        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                جديد
                                            </span>
        </td>
        <td className="py-4 px-6 text-left">
        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
        <span className="material-symbols-outlined">more_vert</span>
        </button>
        </td>
        </tr>
        </tbody>
        </table>
        </div>
        </div>
        </section>
        </main>
        <script dangerouslySetInnerHTML={{ __html: "\n        // Simple Drag and Drop visual feedback\n        const dropzone = document.getElementById('dropzone');\n        const fileInput = document.getElementById('fileInput');\n\n        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {\n            dropzone.addEventListener(eventName, preventDefaults, false);\n        });\n\n        function preventDefaults(e) {\n            e.preventDefault();\n            e.stopPropagation();\n        }\n\n        ['dragenter', 'dragover'].forEach(eventName => {\n            dropzone.addEventListener(eventName, highlight, false);\n        });\n\n        ['dragleave', 'drop'].forEach(eventName => {\n            dropzone.addEventListener(eventName, unhighlight, false);\n        });\n\n        function highlight(e) {\n            dropzone.classList.add('drag-active');\n            dropzone.classList.add('border-secondary');\n        }\n\n        function unhighlight(e) {\n            dropzone.classList.remove('drag-active');\n            dropzone.classList.remove('border-secondary');\n        }\n\n        dropzone.addEventListener('drop', handleDrop, false);\n\n        function handleDrop(e) {\n            let dt = e.dataTransfer;\n            let files = dt.files;\n            handleFiles(files);\n        }\n\n        fileInput.addEventListener('change', function() {\n            handleFiles(this.files);\n        });\n\n        function handleFiles(files) {\n            if(files.length > 0) {\n                // In a real app, this would trigger the upload process\n                console.log('Files ready for upload:', files);\n                // Quick visual feedback\n                const originalText = dropzone.querySelector('.font-body-lg').innerText;\n                dropzone.querySelector('.font-body-lg').innerText = `تم تحديد ${files.length} ملف(ات) للرفع`;\n                setTimeout(() => {\n                    dropzone.querySelector('.font-body-lg').innerText = originalText;\n                }, 3000);\n            }\n        }\n    " }} />
      </>
    </div>
  );
}

function Screen_portal_appointments(): JSX.Element {
  return (
    <div className={"bg-background text-on-background font-body-md rtl"} data-stitch-source={"kmt_legal_12"}>
      <style dangerouslySetInnerHTML={{ __html: ".material-symbols-outlined {\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\n        }\n        .icon-fill {\n            font-variation-settings: 'FILL' 1;\n        }" }} />
      <>
        {/* TopNavBar */}
        <header className="bg-surface-container-lowest dark:bg-surface-container-lowest text-secondary dark:text-secondary-fixed font-body-md text-body-md w-full top-0 sticky border-b border-outline-variant dark:border-outline flat no shadows flex justify-between items-center px-margin-desktop max-w-container-max mx-auto h-20 rtl z-50">
        <div className="flex items-center gap-6">
        <div className="text-headline-md font-headline-md text-primary dark:text-on-primary-fixed">KMT Legal</div>
        <nav className="hidden md:flex gap-4">
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Practice Areas</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Our Team</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Insights</a>
        <a className="text-on-surface-variant dark:text-on-surface-variant hover:text-secondary transition-colors duration-200 cursor-pointer active:opacity-80" href="#">Contact</a>
        </nav>
        </div>
        <div className="flex items-center gap-4">
        <span className="material-symbols-outlined cursor-pointer hover:text-secondary transition-colors duration-200" data-icon="search">search</span>
        <span className="material-symbols-outlined cursor-pointer hover:text-secondary transition-colors duration-200" data-icon="notifications">notifications</span>
        <button className="bg-secondary text-on-secondary px-4 py-2 rounded font-label-sm text-label-sm hover:opacity-90 transition-opacity">Book Consultation</button>
        <span className="font-label-sm text-label-sm cursor-pointer hover:text-secondary transition-colors duration-200">EN</span>
        </div>
        </header>
        <div className="flex max-w-container-max mx-auto px-margin-desktop py-stack-lg gap-gutter">
        {/* SideNavBar */}
        <aside className="hidden md:flex bg-surface-container-low dark:bg-surface-container-low text-secondary dark:text-secondary-fixed font-label-sm text-label-sm border-l border-outline-variant dark:border-outline flat no shadows flex-col w-64 rtl h-[calc(100vh-80px)] sticky top-20 py-stack-md shrink-0">
        <div className="px-4 mb-8">
        <div className="text-headline-md font-headline-md text-primary mb-1">KMT Legal</div>
        <div className="text-on-surface-variant opacity-80">Management Portal</div>
        </div>
        <nav className="flex-1 flex flex-col gap-2">
        <a className="flex items-center gap-3 py-2 px-3 text-on-surface-variant hover:bg-surface-container-high mx-2 transition-all duration-200 rounded-lg" href="#">
        <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
                            Dashboard
                        </a>
        <a className="flex items-center gap-3 py-2 px-3 text-on-surface-variant hover:bg-surface-container-high mx-2 transition-all duration-200 rounded-lg" href="#">
        <span className="material-symbols-outlined" data-icon="folder_shared">folder_shared</span>
                            Cases
                        </a>
        <a className="flex items-center gap-3 py-2 px-3 text-on-surface-variant hover:bg-surface-container-high mx-2 transition-all duration-200 rounded-lg" href="#">
        <span className="material-symbols-outlined" data-icon="description">description</span>
                            Documents
                        </a>
        <a className="flex items-center gap-3 py-2 px-3 bg-secondary-container text-on-secondary-container rounded-lg mx-2 transition-all duration-200 font-bold" href="#">
        <span className="material-symbols-outlined icon-fill" data-icon="calendar_month">calendar_month</span>
                            Calendar
                        </a>
        <a className="flex items-center gap-3 py-2 px-3 text-on-surface-variant hover:bg-surface-container-high mx-2 transition-all duration-200 rounded-lg" href="#">
        <span className="material-symbols-outlined" data-icon="group">group</span>
                            Clients
                        </a>
        <a className="flex items-center gap-3 py-2 px-3 text-on-surface-variant hover:bg-surface-container-high mx-2 transition-all duration-200 rounded-lg" href="#">
        <span className="material-symbols-outlined" data-icon="settings">settings</span>
                            Settings
                        </a>
        </nav>
        <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-outline-variant">
        <button className="mx-4 mb-4 bg-secondary text-on-secondary py-2 rounded-lg font-label-sm text-label-sm hover:opacity-90 transition-opacity flex justify-center items-center gap-2">
        <span className="material-symbols-outlined" data-icon="add">add</span>
                            New Filing
                        </button>
        <a className="flex items-center gap-3 py-2 px-3 text-on-surface-variant hover:bg-surface-container-high mx-2 transition-all duration-200 rounded-lg" href="#">
        <span className="material-symbols-outlined" data-icon="help">help</span>
                            Support
                        </a>
        <a className="flex items-center gap-3 py-2 px-3 text-on-surface-variant hover:bg-surface-container-high mx-2 transition-all duration-200 rounded-lg" href="#">
        <span className="material-symbols-outlined" data-icon="logout">logout</span>
                            Logout
                        </a>
        </div>
        </aside>
        {/* Main Content */}
        <main className="flex-1 min-w-0 flex flex-col gap-stack-lg">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant pb-stack-md">
        <div>
        <h1 className="font-headline-md text-headline-md text-primary mb-2">مواعيدي</h1>
        <p className="text-on-surface-variant">إدارة وتتبع استشاراتك القانونية وجلساتك القادمة.</p>
        </div>
        <div className="flex gap-2">
        <select className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-on-surface-variant font-label-sm text-label-sm focus:outline-none focus:border-on-tertiary-fixed-variant focus:ring-1 focus:ring-on-tertiary-fixed-variant">
        <option value="all">جميع الحالات</option>
        <option value="upcoming">القادمة</option>
        <option value="past">السابقة</option>
        <option value="cancelled">الملغاة</option>
        </select>
        <button className="bg-secondary text-on-secondary px-4 py-2 rounded-lg font-label-sm text-label-sm hover:opacity-90 transition-opacity flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">add</span>
                                حجز موعد جديد
                            </button>
        </div>
        </div>
        {/* Upcoming Appointments */}
        <section className="flex flex-col gap-stack-md">
        <h2 className="font-headline-md text-[20px] text-primary flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">upcoming</span>
                            المواعيد القادمة
                        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-gutter">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-1 h-full bg-secondary"></div>
        <div className="flex justify-between items-start mb-4">
        <div>
        <span className="inline-block px-2 py-1 bg-surface-container-low text-on-surface-variant text-[10px] font-bold tracking-wider rounded uppercase mb-2">استشارة أولية</span>
        <h3 className="font-headline-md text-[18px] text-primary">قضية عقارية - مراجعة عقود</h3>
        </div>
        <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-bold flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                        مؤكد
                                    </span>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] opacity-70">person</span>
        <span className="font-label-sm text-label-sm">المحامي: أحمد محمود</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] opacity-70">event</span>
        <span className="font-label-sm text-label-sm">15 أكتوبر 2024</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] opacity-70">schedule</span>
        <span className="font-label-sm text-label-sm">10:00 صباحاً</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] opacity-70">videocam</span>
        <span className="font-label-sm text-label-sm">اجتماع أونلاين (Zoom)</span>
        </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-surface-container-high">
        <button className="px-4 py-1.5 border border-outline-variant text-on-surface-variant rounded hover:bg-surface-container-low transition-colors font-label-sm text-label-sm flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                                        إضافة مستندات
                                    </button>
        <button className="px-4 py-1.5 border border-outline-variant text-on-surface-variant rounded hover:bg-surface-container-low transition-colors font-label-sm text-label-sm flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                                        إعادة جدولة
                                    </button>
        </div>
        </div>
        {/* Card 2 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-1 h-full bg-secondary"></div>
        <div className="flex justify-between items-start mb-4">
        <div>
        <span className="inline-block px-2 py-1 bg-surface-container-low text-on-surface-variant text-[10px] font-bold tracking-wider rounded uppercase mb-2">متابعة قضية</span>
        <h3 className="font-headline-md text-[18px] text-primary">جلسة استماع - المحكمة التجارية</h3>
        </div>
        <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-bold flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                        قيد الانتظار
                                    </span>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] opacity-70">person</span>
        <span className="font-label-sm text-label-sm">المحامي: سارة خالد</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] opacity-70">event</span>
        <span className="font-label-sm text-label-sm">18 أكتوبر 2024</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] opacity-70">schedule</span>
        <span className="font-label-sm text-label-sm">12:30 ظهراً</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] opacity-70">location_on</span>
        <span className="font-label-sm text-label-sm">المكتب الرئيسي</span>
        </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-surface-container-high">
        <button className="px-4 py-1.5 border border-outline-variant text-on-surface-variant rounded hover:bg-surface-container-low transition-colors font-label-sm text-label-sm flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                                        إضافة مستندات
                                    </button>
        <button className="px-4 py-1.5 border border-outline-variant text-on-surface-variant rounded hover:bg-surface-container-low transition-colors font-label-sm text-label-sm flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                                        إعادة جدولة
                                    </button>
        </div>
        </div>
        </div>
        </section>
        {/* Past Appointments */}
        <section className="flex flex-col gap-stack-md mt-stack-md opacity-80">
        <h2 className="font-headline-md text-[20px] text-primary flex items-center gap-2">
        <span className="material-symbols-outlined text-outline">history</span>
                            المواعيد السابقة
                        </h2>
        <div className="grid grid-cols-1 gap-4">
        {/* Past Card 1 */}
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
        <h3 className="font-headline-md text-[16px] text-primary m-0">تأسيس شركة ذات مسؤولية محدودة</h3>
        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px] font-bold">مكتمل</span>
        </div>
        <div className="flex flex-wrap gap-4 text-on-surface-variant font-label-sm text-label-sm">
        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">event</span> 01 أكتوبر 2024</span>
        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">person</span> المحامي: أحمد محمود</span>
        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span> المكتب الرئيسي</span>
        </div>
        </div>
        <button className="px-3 py-1.5 border border-outline-variant text-on-surface-variant rounded hover:bg-surface-container-high transition-colors font-label-sm text-label-sm flex items-center gap-1 whitespace-nowrap">
        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                    عرض التفاصيل
                                </button>
        </div>
        {/* Past Card 2 */}
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
        <h3 className="font-headline-md text-[16px] text-primary m-0">استشارة عمالية - إنهاء عقد</h3>
        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px] font-bold">مكتمل</span>
        </div>
        <div className="flex flex-wrap gap-4 text-on-surface-variant font-label-sm text-label-sm">
        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">event</span> 25 سبتمبر 2024</span>
        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">person</span> المحامي: سارة خالد</span>
        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">videocam</span> أونلاين</span>
        </div>
        </div>
        <button className="px-3 py-1.5 border border-outline-variant text-on-surface-variant rounded hover:bg-surface-container-high transition-colors font-label-sm text-label-sm flex items-center gap-1 whitespace-nowrap">
        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                    عرض التفاصيل
                                </button>
        </div>
        </div>
        </section>
        </main>
        </div>
        {/* Footer */}
        <footer className="bg-surface-container-highest dark:bg-surface-container-highest text-primary dark:text-on-primary-fixed font-body-md text-body-md w-full bottom-0 flat no shadows grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop py-stack-lg max-w-container-max mx-auto rtl mt-auto">
        <div>
        <div className="text-headline-md font-headline-md text-primary mb-4">KMT Legal</div>
        <p className="text-on-surface-variant text-sm">© 2024 KMT Legal. All rights reserved. Licensed by the Ministry of Justice.</p>
        </div>
        <div className="flex flex-col gap-2">
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Privacy Policy</a>
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Terms of Service</a>
        </div>
        <div className="flex flex-col gap-2">
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Office Locations</a>
        <a className="text-on-surface-variant hover:text-primary underline transition-opacity duration-300" href="#">Careers</a>
        </div>
        <div>
        {/* Space for additional links or social icons if needed in future */}
        </div>
        </footer>
      </>
    </div>
  );
}

function Screen_admin_dashboard(): JSX.Element {
  return (
    <div className={"bg-background text-on-background antialiased flex"} data-stitch-source={"kmt_legal_9"}>
      
      <>
        {/* SideNavBar (from JSON) */}
        <nav className="bg-surface-container-low h-screen w-64 fixed right-0 top-0 rtl border-l border-outline-variant flex flex-col h-full py-stack-md z-50">
        <div className="px-margin-desktop mb-stack-lg">
        <h1 className="text-headline-md font-headline-md text-primary">KMT Legal</h1>
        <p className="font-label-sm text-label-sm text-on-surface-variant">Management Portal</p>
        </div>
        <div className="px-margin-desktop mb-stack-md">
        <button className="w-full bg-secondary text-on-secondary font-label-sm text-label-sm py-2 rounded-lg hover:bg-on-secondary-container transition-colors duration-200 flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-[18px]">add</span>
                        New Filing
                    </button>
        </div>
        <div className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
        <li><a className="flex items-center gap-3 py-2 px-3 bg-secondary-container text-on-secondary-container rounded-lg mx-2 transition-colors duration-200" href="#"><span className="material-symbols-outlined" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span><span className="font-label-sm text-label-sm">Dashboard</span></a></li>
        <li><a className="flex items-center gap-3 py-2 px-3 text-on-surface-variant hover:bg-surface-container-high mx-2 rounded-lg transition-colors duration-200" href="#"><span className="material-symbols-outlined">folder_shared</span><span className="font-label-sm text-label-sm">Cases</span></a></li>
        <li><a className="flex items-center gap-3 py-2 px-3 text-on-surface-variant hover:bg-surface-container-high mx-2 rounded-lg transition-colors duration-200" href="#"><span className="material-symbols-outlined">description</span><span className="font-label-sm text-label-sm">Documents</span></a></li>
        <li><a className="flex items-center gap-3 py-2 px-3 text-on-surface-variant hover:bg-surface-container-high mx-2 rounded-lg transition-colors duration-200" href="#"><span className="material-symbols-outlined">calendar_month</span><span className="font-label-sm text-label-sm">Calendar</span></a></li>
        <li><a className="flex items-center gap-3 py-2 px-3 text-on-surface-variant hover:bg-surface-container-high mx-2 rounded-lg transition-colors duration-200" href="#"><span className="material-symbols-outlined">group</span><span className="font-label-sm text-label-sm">Clients</span></a></li>
        <li><a className="flex items-center gap-3 py-2 px-3 text-on-surface-variant hover:bg-surface-container-high mx-2 rounded-lg transition-colors duration-200" href="#"><span className="material-symbols-outlined">settings</span><span className="font-label-sm text-label-sm">Settings</span></a></li>
        </ul>
        </div>
        <div className="mt-auto pt-stack-md border-t border-outline-variant/50">
        <ul className="space-y-1">
        <li><a className="flex items-center gap-3 py-2 px-3 text-on-surface-variant hover:bg-surface-container-high mx-2 rounded-lg transition-colors duration-200" href="#"><span className="material-symbols-outlined">help</span><span className="font-label-sm text-label-sm">Support</span></a></li>
        <li><a className="flex items-center gap-3 py-2 px-3 text-on-surface-variant hover:bg-surface-container-high mx-2 rounded-lg transition-colors duration-200" href="#"><span className="material-symbols-outlined">logout</span><span className="font-label-sm text-label-sm">Logout</span></a></li>
        </ul>
        </div>
        </nav>
        {/* Main Content Area */}
        <main className="flex-1 mr-64 min-h-screen bg-surface px-margin-desktop py-stack-lg rtl">
        {/* Top Bar */}
        <header className="flex justify-between items-center mb-stack-lg">
        <h2 className="font-headline-md text-headline-md text-primary">لوحة المكتب</h2>
        <div className="flex items-center gap-4">
        <div className="relative">
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input className="pl-4 pr-10 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all w-64" placeholder="بحث..." type="text"/>
        </div>
        <button className="p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface-variant hover:text-primary transition-colors">
        <span className="material-symbols-outlined">notifications</span>
        </button>
        </div>
        </header>
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-gutter mb-stack-lg">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
        <p className="font-label-sm text-label-sm text-on-surface-variant">New Consultations</p>
        <span className="material-symbols-outlined text-secondary">forum</span>
        </div>
        <div className="flex items-end justify-between">
        <h3 className="font-headline-md text-headline-md text-primary">12</h3>
        <span className="font-label-sm text-label-sm text-green-600 flex items-center"><span className="material-symbols-outlined text-[14px]">trending_up</span> +3 today</span>
        </div>
        </div>
        {/* Card 2 */}
        <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
        <p className="font-label-sm text-label-sm text-on-surface-variant">Active Cases</p>
        <span className="material-symbols-outlined text-secondary">folder_open</span>
        </div>
        <div className="flex items-end justify-between">
        <h3 className="font-headline-md text-headline-md text-primary">48</h3>
        <span className="font-label-sm text-label-sm text-on-surface-variant">Ongoing</span>
        </div>
        </div>
        {/* Card 3 */}
        <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
        <p className="font-label-sm text-label-sm text-on-surface-variant">This Week's Sessions</p>
        <span className="material-symbols-outlined text-secondary">gavel</span>
        </div>
        <div className="flex items-end justify-between">
        <h3 className="font-headline-md text-headline-md text-primary">8</h3>
        <span className="font-label-sm text-label-sm text-on-surface-variant">Scheduled</span>
        </div>
        </div>
        {/* Card 4 */}
        <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
        <p className="font-label-sm text-label-sm text-error">Overdue Tasks</p>
        <span className="material-symbols-outlined text-error">warning</span>
        </div>
        <div className="flex items-end justify-between">
        <h3 className="font-headline-md text-headline-md text-error">3</h3>
        <span className="font-label-sm text-label-sm text-on-surface-variant">Needs attention</span>
        </div>
        </div>
        {/* Card 5 */}
        <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
        <p className="font-label-sm text-label-sm text-on-surface-variant">Docs for Review</p>
        <span className="material-symbols-outlined text-secondary">plagiarism</span>
        </div>
        <div className="flex items-end justify-between">
        <h3 className="font-headline-md text-headline-md text-primary">15</h3>
        <span className="font-label-sm text-label-sm text-on-surface-variant">Pending</span>
        </div>
        </div>
        </div>
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Left Column: Tables & Queues (Takes up 2 columns) */}
        <div className="lg:col-span-2 space-y-gutter">
        {/* Court Sessions Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="px-stack-md py-3 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
        <h3 className="font-body-lg text-body-lg text-primary font-medium">Upcoming Court Sessions</h3>
        <a className="font-label-sm text-label-sm text-secondary hover:underline" href="#">View All</a>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-right">
        <thead className="bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant">
        <tr>
        <th className="px-stack-md py-3 font-medium">Case ID</th>
        <th className="px-stack-md py-3 font-medium">Client</th>
        <th className="px-stack-md py-3 font-medium">Court</th>
        <th className="px-stack-md py-3 font-medium">Date &amp; Time</th>
        <th className="px-stack-md py-3 font-medium">Status</th>
        </tr>
        </thead>
        <tbody className="font-body-md text-body-md divide-y divide-outline-variant/50">
        <tr className="hover:bg-surface-container-low transition-colors">
        <td className="px-stack-md py-3 text-secondary font-medium">#KMT-2024-089</td>
        <td className="px-stack-md py-3 text-primary">Ahmed Al-Farsi</td>
        <td className="px-stack-md py-3 text-on-surface-variant">Commercial Court</td>
        <td className="px-stack-md py-3 text-on-surface-variant">Oct 24, 09:00 AM</td>
        <td className="px-stack-md py-3"><span className="px-2 py-1 bg-surface-container-high text-on-surface-variant rounded-full font-label-sm text-label-sm">Scheduled</span></td>
        </tr>
        <tr className="hover:bg-surface-container-low transition-colors">
        <td className="px-stack-md py-3 text-secondary font-medium">#KMT-2024-102</td>
        <td className="px-stack-md py-3 text-primary">Tech Solutions LLC</td>
        <td className="px-stack-md py-3 text-on-surface-variant">Labor Court</td>
        <td className="px-stack-md py-3 text-on-surface-variant">Oct 25, 11:30 AM</td>
        <td className="px-stack-md py-3"><span className="px-2 py-1 bg-surface-container-high text-on-surface-variant rounded-full font-label-sm text-label-sm">Scheduled</span></td>
        </tr>
        <tr className="hover:bg-surface-container-low transition-colors">
        <td className="px-stack-md py-3 text-secondary font-medium">#KMT-2023-455</td>
        <td className="px-stack-md py-3 text-primary">Fatima Real Estate</td>
        <td className="px-stack-md py-3 text-on-surface-variant">Appeals Court</td>
        <td className="px-stack-md py-3 text-on-surface-variant">Oct 28, 10:00 AM</td>
        <td className="px-stack-md py-3"><span className="px-2 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label-sm text-label-sm">Requires Prep</span></td>
        </tr>
        </tbody>
        </table>
        </div>
        </div>
        {/* AI Intake Queue */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md">
        <div className="flex justify-between items-center mb-stack-md border-b border-outline-variant pb-2">
        <h3 className="font-body-lg text-body-lg text-primary font-medium flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">psychology</span>
                                    AI Intake Queue
                                </h3>
        <span className="font-label-sm text-label-sm text-on-surface-variant">3 Pending Review</span>
        </div>
        <div className="space-y-3">
        {/* Queue Item 1 */}
        <div className="p-3 border border-outline-variant rounded-lg flex items-start gap-3 hover:border-secondary transition-colors cursor-pointer bg-surface">
        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-headline-md">S</div>
        <div className="flex-1">
        <div className="flex justify-between items-start">
        <h4 className="font-body-md text-body-md text-primary font-medium">Sara Mahmoud</h4>
        <span className="font-label-sm text-label-sm text-on-surface-variant">10 mins ago</span>
        </div>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 line-clamp-1">Inquiry regarding corporate restructuring and compliance with new labor laws.</p>
        <div className="mt-2 flex gap-2">
        <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant rounded text-[10px] font-medium">Corporate</span>
        <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant rounded text-[10px] font-medium">High Priority</span>
        </div>
        </div>
        </div>
        {/* Queue Item 2 */}
        <div className="p-3 border border-outline-variant rounded-lg flex items-start gap-3 hover:border-secondary transition-colors cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-headline-md">M</div>
        <div className="flex-1">
        <div className="flex justify-between items-start">
        <h4 className="font-body-md text-body-md text-primary font-medium">Mohammed Al-Dosari</h4>
        <span className="font-label-sm text-label-sm text-on-surface-variant">1 hour ago</span>
        </div>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 line-clamp-1">Dispute over commercial lease agreement termination terms.</p>
        <div className="mt-2 flex gap-2">
        <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant rounded text-[10px] font-medium">Real Estate</span>
        </div>
        </div>
        </div>
        </div>
        </div>
        </div>
        {/* Right Column: Recent Activity & Quick Actions */}
        <div className="space-y-gutter">
        {/* Recent Activity Timeline */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md h-full">
        <h3 className="font-body-lg text-body-lg text-primary font-medium mb-stack-md border-b border-outline-variant pb-2">Recent Activity</h3>
        <div className="relative border-r border-outline-variant pr-4 mr-2 space-y-6">
        {/* Activity 1 */}
        <div className="relative">
        <span className="absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-surface-container-lowest"></span>
        <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Just now</p>
        <p className="font-body-md text-body-md text-primary">Document <span className="font-medium text-secondary">Contract_v2.pdf</span> uploaded by L. Hassan</p>
        </div>
        {/* Activity 2 */}
        <div className="relative">
        <span className="absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full bg-surface-container-highest ring-4 ring-surface-container-lowest"></span>
        <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">2 hours ago</p>
        <p className="font-body-md text-body-md text-primary">Case status updated to <span className="font-medium">Pending Review</span> for #KMT-2024-089</p>
        </div>
        {/* Activity 3 */}
        <div className="relative">
        <span className="absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full bg-surface-container-highest ring-4 ring-surface-container-lowest"></span>
        <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Yesterday, 14:30</p>
        <p className="font-body-md text-body-md text-primary">Invoice #INV-902 sent to Tech Solutions LLC</p>
        </div>
        {/* Activity 4 */}
        <div className="relative">
        <span className="absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full bg-surface-container-highest ring-4 ring-surface-container-lowest"></span>
        <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Yesterday, 09:15</p>
        <p className="font-body-md text-body-md text-primary">New client profile created: <span className="font-medium">Global Logistics Co.</span></p>
        </div>
        </div>
        </div>
        </div>
        </div>
        </main>
      </>
    </div>
  );
}

function Screen_admin_clients(): JSX.Element {
  return (
    <div className={"bg-background text-on-background font-body-md rtl min-h-screen"} data-stitch-source={"kmt_legal_5"}>
      <style dangerouslySetInnerHTML={{ __html: ".material-symbols-outlined {\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;\n        }" }} />
      <>
        {/* SideNavBar (Shared Component Blueprint) */}
        <nav className="h-screen w-64 fixed right-0 top-0 bg-surface-container-low border-l border-outline-variant flex flex-col h-full py-stack-md rtl z-50">
        {/* Brand Header */}
        <div className="px-margin-desktop mb-stack-lg">
        <h1 className="text-headline-md font-headline-md text-primary">KMT Legal</h1>
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Management Portal</p>
        </div>
        {/* Main Navigation */}
        <ul className="flex-1 space-y-stack-sm overflow-y-auto font-label-sm text-label-sm text-on-surface-variant">
        <li>
        <a className="flex items-center gap-3 px-4 py-3 mx-2 hover:bg-surface-container-high transition-all rounded-DEFAULT group" href="#">
        <span className="material-symbols-outlined group-hover:text-primary transition-colors" data-icon="dashboard">dashboard</span>
        <span>Dashboard</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 mx-2 hover:bg-surface-container-high transition-all rounded-DEFAULT group" href="#">
        <span className="material-symbols-outlined group-hover:text-primary transition-colors" data-icon="folder_shared">folder_shared</span>
        <span>Cases</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 mx-2 hover:bg-surface-container-high transition-all rounded-DEFAULT group" href="#">
        <span className="material-symbols-outlined group-hover:text-primary transition-colors" data-icon="description">description</span>
        <span>Documents</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 mx-2 hover:bg-surface-container-high transition-all rounded-DEFAULT group" href="#">
        <span className="material-symbols-outlined group-hover:text-primary transition-colors" data-icon="calendar_month">calendar_month</span>
        <span>Calendar</span>
        </a>
        </li>
        {/* Active State Navigation */}
        <li>
        <a className="flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-lg mx-2 transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-on-secondary-container" data-icon="group" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
        <span>Clients</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 mx-2 hover:bg-surface-container-high transition-all rounded-DEFAULT group" href="#">
        <span className="material-symbols-outlined group-hover:text-primary transition-colors" data-icon="settings">settings</span>
        <span>Settings</span>
        </a>
        </li>
        </ul>
        {/* Primary CTA */}
        <div className="px-4 mt-auto mb-stack-md">
        <button className="w-full bg-secondary text-on-primary font-label-sm text-label-sm py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary/90 transition-colors">
        <span className="material-symbols-outlined text-sm" data-icon="add">add</span>
                        New Filing
                    </button>
        </div>
        {/* Footer Navigation */}
        <ul className="border-t border-outline-variant pt-stack-sm font-label-sm text-label-sm text-on-surface-variant">
        <li>
        <a className="flex items-center gap-3 px-4 py-3 mx-2 hover:bg-surface-container-high transition-all rounded-DEFAULT group" href="#">
        <span className="material-symbols-outlined group-hover:text-primary transition-colors" data-icon="help">help</span>
        <span>Support</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 mx-2 hover:bg-surface-container-high transition-all rounded-DEFAULT group" href="#">
        <span className="material-symbols-outlined group-hover:text-primary transition-colors" data-icon="logout">logout</span>
        <span>Logout</span>
        </a>
        </li>
        </ul>
        </nav>
        {/* Main Content Area */}
        <main className="mr-64 p-margin-desktop bg-background min-h-screen flex flex-col">
        {/* Page Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md mb-stack-lg border-b border-outline-variant pb-stack-md">
        <div>
        <h2 className="text-display-lg font-display-lg text-primary">العملاء</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mt-2">Manage and track internal client relationships, case status, and assignments.</p>
        </div>
        <div className="flex items-center gap-4">
        <button className="bg-secondary text-on-primary font-label-sm text-label-sm px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2">
        <span className="material-symbols-outlined" data-icon="person_add">person_add</span>
                            Add Client
                        </button>
        </div>
        </div>
        {/* Search & Filters Container (Bento/Card style) */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 mb-stack-lg shadow-sm">
        <form className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-gutter">
        {/* Search Input */}
        <div className="lg:col-span-1">
        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Search</label>
        <div className="relative">
        <span className="absolute right-3 top-2.5 text-on-surface-variant material-symbols-outlined" data-icon="search">search</span>
        <input className="w-full bg-surface border border-outline-variant rounded-DEFAULT py-2 pr-10 pl-3 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-shadow font-body-md text-body-md text-on-surface" placeholder="Name or Phone" type="text"/>
        </div>
        </div>
        {/* Filter: Source */}
        <div>
        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Source</label>
        <div className="relative">
        <select className="w-full bg-surface border border-outline-variant rounded-DEFAULT py-2 px-3 appearance-none focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-shadow font-body-md text-body-md text-on-surface">
        <option value="">All Sources</option>
        <option value="referral">Referral</option>
        <option value="facebook">Facebook</option>
        <option value="google">Google</option>
        <option value="direct">Direct</option>
        </select>
        <span className="absolute left-3 top-2.5 pointer-events-none text-on-surface-variant material-symbols-outlined" data-icon="expand_more">expand_more</span>
        </div>
        </div>
        {/* Filter: Status */}
        <div>
        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Status</label>
        <div className="relative">
        <select className="w-full bg-surface border border-outline-variant rounded-DEFAULT py-2 px-3 appearance-none focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-shadow font-body-md text-body-md text-on-surface">
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="closed">Closed</option>
        </select>
        <span className="absolute left-3 top-2.5 pointer-events-none text-on-surface-variant material-symbols-outlined" data-icon="expand_more">expand_more</span>
        </div>
        </div>
        {/* Filter: Lawyer */}
        <div>
        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Assigned Lawyer</label>
        <div className="relative">
        <select className="w-full bg-surface border border-outline-variant rounded-DEFAULT py-2 px-3 appearance-none focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-shadow font-body-md text-body-md text-on-surface">
        <option value="">All Lawyers</option>
        <option value="ahmed">Ahmed Yasin</option>
        <option value="sara">Sara Kamal</option>
        <option value="omar">Omar Tariq</option>
        </select>
        <span className="absolute left-3 top-2.5 pointer-events-none text-on-surface-variant material-symbols-outlined" data-icon="expand_more">expand_more</span>
        </div>
        </div>
        {/* Filter Action */}
        <div className="flex items-end">
        <button className="w-full bg-surface border border-outline-variant text-on-surface font-label-sm text-label-sm py-2 px-4 rounded-DEFAULT hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2" type="button">
        <span className="material-symbols-outlined text-sm" data-icon="filter_list">filter_list</span>
                                Apply Filters
                            </button>
        </div>
        </form>
        </div>
        {/* Data Table Container */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm flex-1">
        <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
        <thead>
        <tr className="bg-surface-container-low border-b border-outline-variant">
        <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">Client Name</th>
        <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">Phone</th>
        <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">Request Type</th>
        <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">Source</th>
        <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">Last Contact</th>
        <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">Status</th>
        <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">Assigned Lawyer</th>
        <th className="py-4 px-6 font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap w-16"></th>
        </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant font-body-md text-body-md text-on-surface">
        {/* Row 1 */}
        <tr className="hover:bg-surface-bright transition-colors group">
        <td className="py-4 px-6 font-medium">Mohammed Al-Fayed</td>
        <td className="py-4 px-6 text-on-surface-variant" dir="ltr">+971 50 123 4567</td>
        <td className="py-4 px-6">Corporate Restructuring</td>
        <td className="py-4 px-6 text-on-surface-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-sm text-on-surface-variant" data-icon="public">public</span> Google
                                    </td>
        <td className="py-4 px-6 text-on-surface-variant">12 Oct 2024</td>
        <td className="py-4 px-6">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f0f4f8] text-[#334155] border border-[#cbd5e1]">Active</span>
        </td>
        <td className="py-4 px-6">Ahmed Yasin</td>
        <td className="py-4 px-6 text-left">
        <button className="text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100 p-1">
        <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
        </button>
        </td>
        </tr>
        {/* Row 2 */}
        <tr className="hover:bg-surface-bright transition-colors group">
        <td className="py-4 px-6 font-medium">Fatima Hassan</td>
        <td className="py-4 px-6 text-on-surface-variant" dir="ltr">+971 55 987 6543</td>
        <td className="py-4 px-6">Real Estate Dispute</td>
        <td className="py-4 px-6 text-on-surface-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-sm text-on-surface-variant" data-icon="group_add">group_add</span> Referral
                                    </td>
        <td className="py-4 px-6 text-on-surface-variant">08 Oct 2024</td>
        <td className="py-4 px-6">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">Pending</span>
        </td>
        <td className="py-4 px-6">Sara Kamal</td>
        <td className="py-4 px-6 text-left">
        <button className="text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100 p-1">
        <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
        </button>
        </td>
        </tr>
        {/* Row 3 */}
        <tr className="hover:bg-surface-bright transition-colors group">
        <td className="py-4 px-6 font-medium">Khalid Ibrahim</td>
        <td className="py-4 px-6 text-on-surface-variant" dir="ltr">+971 52 345 6789</td>
        <td className="py-4 px-6">Intellectual Property</td>
        <td className="py-4 px-6 text-on-surface-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-sm text-on-surface-variant" data-icon="thumb_up">thumb_up</span> Facebook
                                    </td>
        <td className="py-4 px-6 text-on-surface-variant">25 Sep 2024</td>
        <td className="py-4 px-6">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]">Closed</span>
        </td>
        <td className="py-4 px-6">Omar Tariq</td>
        <td className="py-4 px-6 text-left">
        <button className="text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100 p-1">
        <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
        </button>
        </td>
        </tr>
        {/* Row 4 */}
        <tr className="hover:bg-surface-bright transition-colors group">
        <td className="py-4 px-6 font-medium">Nour Al-Sabah</td>
        <td className="py-4 px-6 text-on-surface-variant" dir="ltr">+971 56 111 2222</td>
        <td className="py-4 px-6">Family Law - Custody</td>
        <td className="py-4 px-6 text-on-surface-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-sm text-on-surface-variant" data-icon="login">login</span> Direct
                                    </td>
        <td className="py-4 px-6 text-on-surface-variant">14 Oct 2024</td>
        <td className="py-4 px-6">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f0f4f8] text-[#334155] border border-[#cbd5e1]">Active</span>
        </td>
        <td className="py-4 px-6">Sara Kamal</td>
        <td className="py-4 px-6 text-left">
        <button className="text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100 p-1">
        <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
        </button>
        </td>
        </tr>
        </tbody>
        </table>
        </div>
        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
        <span className="font-label-sm text-label-sm text-on-surface-variant">Showing 1 to 4 of 24 clients</span>
        <div className="flex gap-2">
        <button className="p-2 border border-outline-variant rounded-DEFAULT text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50" disabled>
        <span className="material-symbols-outlined text-sm" data-icon="chevron_right">chevron_right</span>
        </button>
        <button className="p-2 border border-outline-variant rounded-DEFAULT text-on-surface-variant hover:bg-surface-container-high transition-colors">
        <span className="material-symbols-outlined text-sm" data-icon="chevron_left">chevron_left</span>
        </button>
        </div>
        </div>
        </div>
        </main>
      </>
    </div>
  );
}

function Screen_admin_cases(): JSX.Element {
  return (
    <div className={"bg-surface font-body-md text-on-surface antialiased rtl flex"} data-stitch-source={"kmt_legal_8"}>
      <style dangerouslySetInnerHTML={{ __html: "body { background-color: #F8FAFC; }" }} />
      <>
        {/* SideNavBar (Shared Component) */}
        <nav className="bg-surface-container-low dark:bg-surface-container-low text-secondary dark:text-secondary-fixed font-label-sm text-label-sm h-screen w-64 fixed right-0 top-0 rtl border-l border-outline-variant dark:border-outline flat no shadows flex flex-col h-full py-stack-md z-50">
        {/* Header */}
        <div className="px-margin-desktop mb-stack-lg flex flex-col items-center">
        <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mb-stack-sm text-primary">
        <span className="material-symbols-outlined text-headline-md font-headline-md" data-icon="gavel" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
        </div>
        <h1 className="text-headline-md font-headline-md text-primary">KMT Legal</h1>
        <p className="text-on-surface-variant mt-1">Management Portal</p>
        </div>
        {/* CTA */}
        <div className="px-gutter mb-stack-md">
        <button className="w-full bg-secondary text-on-secondary py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
        <span className="material-symbols-outlined text-label-sm font-label-sm" data-icon="add">add</span>
                        New Filing
                    </button>
        </div>
        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <a className="flex items-center gap-3 py-3 px-4 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg cursor-pointer active:opacity-80" href="#">
        <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
                        Dashboard
                    </a>
        <a className="flex items-center gap-3 py-3 px-4 bg-secondary-container text-on-secondary-container rounded-lg mx-2 cursor-pointer active:opacity-80 transition-colors duration-200" href="#">
        <span className="material-symbols-outlined" data-icon="folder_shared" style={{ fontVariationSettings: "'FILL' 1" }}>folder_shared</span>
                        Cases
                    </a>
        <a className="flex items-center gap-3 py-3 px-4 text-on-surface-variant hover:bg-surface-container-high mx-2 hover:bg-surface-container-high transition-all cursor-pointer active:opacity-80" href="#">
        <span className="material-symbols-outlined" data-icon="description">description</span>
                        Documents
                    </a>
        <a className="flex items-center gap-3 py-3 px-4 text-on-surface-variant hover:bg-surface-container-high mx-2 hover:bg-surface-container-high transition-all cursor-pointer active:opacity-80" href="#">
        <span className="material-symbols-outlined" data-icon="calendar_month">calendar_month</span>
                        Calendar
                    </a>
        <a className="flex items-center gap-3 py-3 px-4 text-on-surface-variant hover:bg-surface-container-high mx-2 hover:bg-surface-container-high transition-all cursor-pointer active:opacity-80" href="#">
        <span className="material-symbols-outlined" data-icon="group">group</span>
                        Clients
                    </a>
        <a className="flex items-center gap-3 py-3 px-4 text-on-surface-variant hover:bg-surface-container-high mx-2 hover:bg-surface-container-high transition-all cursor-pointer active:opacity-80" href="#">
        <span className="material-symbols-outlined" data-icon="settings">settings</span>
                        Settings
                    </a>
        </div>
        {/* Footer Links */}
        <div className="px-2 mt-auto pt-stack-md border-t border-outline-variant dark:border-outline space-y-1">
        <a className="flex items-center gap-3 py-3 px-4 text-on-surface-variant hover:bg-surface-container-high mx-2 hover:bg-surface-container-high transition-all rounded-lg cursor-pointer active:opacity-80" href="#">
        <span className="material-symbols-outlined" data-icon="help">help</span>
                        Support
                    </a>
        <a className="flex items-center gap-3 py-3 px-4 text-on-surface-variant hover:bg-surface-container-high mx-2 hover:bg-surface-container-high transition-all rounded-lg cursor-pointer active:opacity-80" href="#">
        <span className="material-symbols-outlined" data-icon="logout">logout</span>
                        Logout
                    </a>
        </div>
        </nav>
        {/* Main Content Area */}
        <main className="flex-1 mr-64 min-h-screen pb-stack-lg">
        {/* Top Utility Bar (Minimal) */}
        <header className="h-20 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-margin-desktop sticky top-0 z-40">
        <div className="flex items-center gap-4">
        <h2 className="text-headline-md font-headline-md text-primary">إدارة القضايا</h2>
        </div>
        <div className="flex items-center gap-6">
        <div className="relative">
        <span className="material-symbols-outlined text-on-surface-variant hover:text-secondary cursor-pointer transition-colors" data-icon="notifications">notifications</span>
        <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant hover:text-secondary cursor-pointer transition-colors" data-icon="search">search</span>
        <div className="h-8 w-px bg-outline-variant mx-2"></div>
        <button className="font-label-sm text-label-sm text-secondary hover:underline uppercase">EN</button>
        <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant ml-2">
        <img className="w-full h-full object-cover" data-alt="A professional headshot of a legal associate in a modern corporate setting, natural lighting, sharp focus, wearing a dark navy suit against a soft grey background. Quiet luxury aesthetic." src="/stitch-assets/50c92d46fba252d4.png"/>
        </div>
        </div>
        </header>
        <div className="px-margin-desktop mt-stack-lg max-w-container-max mx-auto">
        {/* Page Header & Primary Action */}
        <div className="flex justify-between items-end mb-stack-md">
        <div>
        <p className="text-on-surface-variant font-body-md text-body-md mb-1">نظرة عامة على جميع القضايا النشطة والمغلقة</p>
        <div className="flex gap-2">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-surface-container-highest text-on-surface-variant rounded-full font-label-sm text-label-sm">إجمالي: 142</span>
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full font-label-sm text-label-sm">نشط: 86</span>
        </div>
        </div>
        <button className="bg-secondary text-on-secondary px-6 py-2.5 rounded hover:opacity-90 transition-opacity font-body-md text-body-md flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" data-icon="add">add</span>
                            إضافة قضية
                        </button>
        </div>
        {/* Filters Bar (Bento-style container) */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 mb-stack-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Search Input */}
        <div className="relative col-span-1 md:col-span-2">
        <span className="material-symbols-outlined absolute right-3 top-2.5 text-outline" data-icon="search">search</span>
        <input className="w-full bg-surface border border-outline-variant rounded-lg pl-3 pr-10 py-2 text-body-md font-body-md focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all" placeholder="البحث برقم القضية، العميل، أو المحامي..." type="text"/>
        </div>
        {/* Type Filter */}
        <select className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-md font-body-md focus:border-primary-container outline-none appearance-none">
        <option value="">نوع القضية</option>
        <option value="commercial">تجاري</option>
        <option value="civil">مدني</option>
        <option value="criminal">جنائي</option>
        <option value="family">أحوال شخصية</option>
        </select>
        {/* Status Filter */}
        <select className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-md font-body-md focus:border-primary-container outline-none appearance-none">
        <option value="">الحالة</option>
        <option value="new">جديدة</option>
        <option value="under_study">قيد الدراسة</option>
        <option value="active">نشطة</option>
        <option value="finished">منتهية</option>
        </select>
        {/* Next Session Filter */}
        <div className="flex items-center gap-2">
        <button className="flex-1 bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-md font-body-md text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center justify-between">
        <span>تاريخ الجلسة</span>
        <span className="material-symbols-outlined text-[18px]" data-icon="calendar_today">calendar_today</span>
        </button>
        </div>
        </div>
        <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between items-center">
        <div className="flex gap-2">
        <button className="text-secondary font-label-sm text-label-sm hover:underline">مزيد من الفلاتر</button>
        </div>
        <button className="text-on-surface-variant font-label-sm text-label-sm hover:text-primary transition-colors flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]" data-icon="filter_list_off">filter_list_off</span>
                                مسح الفلاتر
                            </button>
        </div>
        </div>
        {/* Data Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
        <thead>
        <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
        <th className="py-4 px-6 font-semibold">المعرف الداخلي</th>
        <th className="py-4 px-6 font-semibold">الاسم المختصر</th>
        <th className="py-4 px-6 font-semibold">النوع</th>
        <th className="py-4 px-6 font-semibold">العميل</th>
        <th className="py-4 px-6 font-semibold">المحكمة</th>
        <th className="py-4 px-6 font-semibold">الجلسة القادمة</th>
        <th className="py-4 px-6 font-semibold">الحالة</th>
        <th className="py-4 px-6 font-semibold">المحامي المعين</th>
        <th className="py-4 px-6 font-semibold text-center">إجراءات</th>
        </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant text-body-md font-body-md text-on-surface">
        {/* Row 1: Active Case */}
        <tr className="hover:bg-surface transition-colors group">
        <td className="py-4 px-6 font-medium text-tertiary">#KMT-2024-089</td>
        <td className="py-4 px-6">نزاع عقاري - مجموعة الأفق</td>
        <td className="py-4 px-6 text-on-surface-variant">تجاري</td>
        <td className="py-4 px-6">شركة الأفق للتطوير</td>
        <td className="py-4 px-6 text-on-surface-variant">المحكمة التجارية (دائرة 3)</td>
        <td className="py-4 px-6">
        <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-error" data-icon="event">event</span>
        <span className="text-error font-medium">12 أكتوبر 2024</span>
        </div>
        </td>
        <td className="py-4 px-6">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-fixed text-on-primary-fixed border border-inverse-primary">
                                                نشطة
                                            </span>
        </td>
        <td className="py-4 px-6">
        <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">أ</div>
        <span>أحمد المحمود</span>
        </div>
        </td>
        <td className="py-4 px-6 text-center">
        <button className="text-on-surface-variant hover:text-secondary p-1 rounded transition-colors">
        <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
        </button>
        </td>
        </tr>
        {/* Row 2: Under Study */}
        <tr className="hover:bg-surface transition-colors group">
        <td className="py-4 px-6 font-medium text-tertiary">#KMT-2024-102</td>
        <td className="py-4 px-6">استحواذ تقنية الرواد</td>
        <td className="py-4 px-6 text-on-surface-variant">اندماج واستحواذ</td>
        <td className="py-4 px-6">صندوق الاستثمار المتقدم</td>
        <td className="py-4 px-6 text-on-surface-variant">-</td>
        <td className="py-4 px-6 text-on-surface-variant">-</td>
        <td className="py-4 px-6">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container border border-secondary-fixed-dim">
                                                قيد الدراسة
                                            </span>
        </td>
        <td className="py-4 px-6">
        <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-surface-tint text-on-primary flex items-center justify-center font-bold text-xs">س</div>
        <span>سارة العتيبي</span>
        </div>
        </td>
        <td className="py-4 px-6 text-center">
        <button className="text-on-surface-variant hover:text-secondary p-1 rounded transition-colors">
        <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
        </button>
        </td>
        </tr>
        {/* Row 3: New */}
        <tr className="hover:bg-surface transition-colors group">
        <td className="py-4 px-6 font-medium text-tertiary">#KMT-2024-105</td>
        <td className="py-4 px-6">دعوى عمالية جماعية</td>
        <td className="py-4 px-6 text-on-surface-variant">عمالي</td>
        <td className="py-4 px-6">مصنع الروابي</td>
        <td className="py-4 px-6 text-on-surface-variant">المحكمة العمالية</td>
        <td className="py-4 px-6 text-on-surface-variant">يحدد لاحقاً</td>
        <td className="py-4 px-6">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-fixed-dim">
                                                جديدة
                                            </span>
        </td>
        <td className="py-4 px-6 text-on-surface-variant italic">
                                            غير معين
                                        </td>
        <td className="py-4 px-6 text-center">
        <button className="text-on-surface-variant hover:text-secondary p-1 rounded transition-colors">
        <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
        </button>
        </td>
        </tr>
        {/* Row 4: Finished */}
        <tr className="hover:bg-surface transition-colors group opacity-75">
        <td className="py-4 px-6 font-medium text-tertiary line-through">#KMT-2023-045</td>
        <td className="py-4 px-6">تصفية تركة (عائلة السعيد)</td>
        <td className="py-4 px-6 text-on-surface-variant">أحوال شخصية</td>
        <td className="py-4 px-6">ورثة محمد السعيد</td>
        <td className="py-4 px-6 text-on-surface-variant">محكمة الأحوال الشخصية</td>
        <td className="py-4 px-6 text-on-surface-variant">منتهية</td>
        <td className="py-4 px-6">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-container-high text-on-surface border border-outline-variant">
                                                منتهية
                                            </span>
        </td>
        <td className="py-4 px-6">
        <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">أ</div>
        <span>أحمد المحمود</span>
        </div>
        </td>
        <td className="py-4 px-6 text-center">
        <button className="text-on-surface-variant hover:text-secondary p-1 rounded transition-colors">
        <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
        </button>
        </td>
        </tr>
        </tbody>
        </table>
        </div>
        {/* Pagination */}
        <div className="bg-surface-container-low px-6 py-4 border-t border-outline-variant flex items-center justify-between">
        <div className="text-label-sm font-label-sm text-on-surface-variant">
                                عرض 1 إلى 4 من 142 سجل
                            </div>
        <div className="flex items-center gap-2">
        <button className="p-2 border border-outline-variant rounded bg-surface hover:bg-surface-container-high text-on-surface-variant disabled:opacity-50 transition-colors" disabled>
        <span className="material-symbols-outlined text-[16px]" data-icon="chevron_right">chevron_right</span>
        </button>
        <button className="px-3 py-1 bg-secondary text-on-secondary rounded font-label-sm">1</button>
        <button className="px-3 py-1 border border-outline-variant bg-surface hover:bg-surface-container-high rounded font-label-sm text-on-surface transition-colors">2</button>
        <button className="px-3 py-1 border border-outline-variant bg-surface hover:bg-surface-container-high rounded font-label-sm text-on-surface transition-colors">3</button>
        <span className="text-on-surface-variant px-2">...</span>
        <button className="p-2 border border-outline-variant rounded bg-surface hover:bg-surface-container-high text-on-surface-variant transition-colors">
        <span className="material-symbols-outlined text-[16px]" data-icon="chevron_left">chevron_left</span>
        </button>
        </div>
        </div>
        </div>
        </div>
        </main>
      </>
    </div>
  );
}

function Screen_admin_case_detail(): JSX.Element {
  return (
    <div className={"bg-background text-on-background font-body-md antialiased h-screen overflow-hidden flex"} data-stitch-source={"kmt_legal_7"}>
      <style dangerouslySetInnerHTML={{ __html: ".material-symbols-outlined {\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\n        }\n        .material-symbols-outlined.fill {\n            font-variation-settings: 'FILL' 1;\n        }\n        .glass-card {\n            background: rgba(255, 255, 255, 0.95);\n            backdrop-filter: blur(10px);\n            border: 1px solid theme('colors.outline-variant');\n        }" }} />
      <>
        {/* SideNavBar (Shared Component) */}
        <nav className="bg-surface-container-low dark:bg-surface-container-low text-secondary dark:text-secondary-fixed font-label-sm text-label-sm h-screen w-64 fixed right-0 top-0 rtl border-l border-outline-variant dark:border-outline flat no shadows flex flex-col h-full py-stack-md z-50">
        <div className="px-margin-desktop mb-stack-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-headline-md">K</div>
        <div>
        <h1 className="text-headline-md font-headline-md text-primary">KMT Legal</h1>
        <p className="text-on-surface-variant">Management Portal</p>
        </div>
        </div>
        <button className="mx-margin-desktop mb-stack-lg bg-secondary text-on-primary py-2 px-4 rounded hover:bg-secondary-container hover:text-on-secondary-container transition-colors duration-200 flex items-center justify-center gap-2 font-label-sm">
        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
                    New Filing
                </button>
        <ul className="flex-1 space-y-2">
        <li>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high mx-2 transition-colors duration-200 rounded" href="#">
        <span className="material-symbols-outlined">dashboard</span>
                            Dashboard
                        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-lg mx-2 transition-colors duration-200" href="#">
        <span className="material-symbols-outlined fill">folder_shared</span>
                            Cases
                        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high mx-2 transition-colors duration-200 rounded" href="#">
        <span className="material-symbols-outlined">description</span>
                            Documents
                        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high mx-2 transition-colors duration-200 rounded" href="#">
        <span className="material-symbols-outlined">calendar_month</span>
                            Calendar
                        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high mx-2 transition-colors duration-200 rounded" href="#">
        <span className="material-symbols-outlined">group</span>
                            Clients
                        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high mx-2 transition-colors duration-200 rounded" href="#">
        <span className="material-symbols-outlined">settings</span>
                            Settings
                        </a>
        </li>
        </ul>
        <div className="mt-auto border-t border-outline-variant pt-stack-sm mx-2">
        <ul className="space-y-2">
        <li>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded transition-colors duration-200" href="#">
        <span className="material-symbols-outlined">help</span>
                                Support
                            </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded transition-colors duration-200" href="#">
        <span className="material-symbols-outlined">logout</span>
                                Logout
                            </a>
        </li>
        </ul>
        </div>
        </nav>
        {/* Main Content Area */}
        <main className="flex-1 mr-64 h-full overflow-y-auto bg-surface-bright pb-stack-lg">
        {/* Header Section */}
        <header className="bg-surface-container-lowest border-b border-outline-variant py-stack-md px-margin-desktop sticky top-0 z-40">
        <div className="max-w-container-max mx-auto flex justify-between items-start">
        <div>
        <div className="flex items-center gap-3 mb-2">
        <span className="bg-surface-container-high text-on-surface px-2 py-1 rounded text-label-sm font-label-sm">#CASE-2024-089</span>
        <span className="bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded text-label-sm font-label-sm flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Active</span>
        <span className="bg-error-container text-on-error-container px-2 py-1 rounded text-label-sm font-label-sm">High Priority</span>
        </div>
        <h2 className="text-headline-md font-headline-md text-primary mb-1">Al-Futtaim Commercial Dispute</h2>
        <p className="text-body-md font-body-md text-on-surface-variant flex items-center gap-2">
        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>person</span>
                                Assigned to: <strong>Ahmed Raza (Senior Counsel)</strong>
        </p>
        </div>
        <div className="flex gap-3">
        <button className="bg-surface-container-highest text-on-surface hover:bg-surface-container-high px-4 py-2 rounded transition-colors duration-200 flex items-center gap-2 font-label-sm border border-outline-variant">
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>update</span>
                                Update Status
                            </button>
        <button className="bg-secondary text-on-primary hover:bg-secondary-container hover:text-on-secondary-container px-4 py-2 rounded transition-colors duration-200 flex items-center gap-2 font-label-sm">
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                                Quick Action
                            </button>
        </div>
        </div>
        {/* Tabs */}
        <div className="max-w-container-max mx-auto mt-stack-md border-b border-outline-variant flex overflow-x-auto hide-scrollbar">
        <a className="px-4 py-3 text-secondary font-bold border-b-2 border-secondary whitespace-nowrap" href="#">Summary</a>
        <a className="px-4 py-3 text-on-surface-variant hover:text-secondary transition-colors duration-200 whitespace-nowrap" href="#">Parties</a>
        <a className="px-4 py-3 text-on-surface-variant hover:text-secondary transition-colors duration-200 whitespace-nowrap" href="#">Sessions</a>
        <a className="px-4 py-3 text-on-surface-variant hover:text-secondary transition-colors duration-200 whitespace-nowrap" href="#">Documents</a>
        <a className="px-4 py-3 text-on-surface-variant hover:text-secondary transition-colors duration-200 whitespace-nowrap" href="#">Tasks</a>
        <a className="px-4 py-3 text-on-surface-variant hover:text-secondary transition-colors duration-200 whitespace-nowrap" href="#">Notes</a>
        <a className="px-4 py-3 text-on-surface-variant hover:text-secondary transition-colors duration-200 whitespace-nowrap" href="#">Finance</a>
        <a className="px-4 py-3 text-on-surface-variant hover:text-secondary transition-colors duration-200 whitespace-nowrap" href="#">Activity Log</a>
        </div>
        </header>
        {/* Content Canvas */}
        <div className="p-margin-desktop max-w-container-max mx-auto space-y-gutter">
        {/* AI Summary Bento Box */}
        <div className="glass-card rounded-xl p-stack-md relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed rounded-bl-full opacity-20 transition-transform group-hover:scale-110 duration-500"></div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
        <span className="material-symbols-outlined">smart_toy</span>
        </div>
        <h3 className="text-body-lg font-headline-md text-primary">ملخص مساعد للمراجعة (AI Summary)</h3>
        </div>
        <p className="text-body-md text-on-surface-variant relative z-10 leading-relaxed">
                            هذه القضية تتعلق بنزاع تجاري حول خرق عقد توريد. المدعي يطالب بتعويض قدره 2.5 مليون درهم. الجلسة القادمة مقررة في 15 نوفمبر لتقديم مذكرات الدفاع. الأدلة الأساسية تشمل المراسلات الإلكترونية وعقد التوريد الموقع في 2022. يوصى بمراجعة البند 4.2 من العقد.
                        </p>
        <div className="mt-4 flex gap-2 relative z-10">
        <span className="bg-surface-container text-on-surface-variant px-2 py-1 rounded text-label-sm">Contract Breach</span>
        <span className="bg-surface-container text-on-surface-variant px-2 py-1 rounded text-label-sm">High Value</span>
        </div>
        </div>
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Column (Wider) */}
        <div className="lg:col-span-8 space-y-gutter">
        {/* Quick Actions Row */}
        <div className="grid grid-cols-3 gap-4">
        <button className="bg-surface-container-lowest border border-outline-variant p-4 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-surface-container-low transition-colors text-on-surface group">
        <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">event</span>
        <span className="font-label-sm text-label-sm">Add Session</span>
        </button>
        <button className="bg-surface-container-lowest border border-outline-variant p-4 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-surface-container-low transition-colors text-on-surface group">
        <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">upload_file</span>
        <span className="font-label-sm text-label-sm">Upload Document</span>
        </button>
        <button className="bg-surface-container-lowest border border-outline-variant p-4 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-surface-container-low transition-colors text-on-surface group">
        <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">task_alt</span>
        <span className="font-label-sm text-label-sm">Create Task</span>
        </button>
        </div>
        {/* Upcoming Sessions */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md">
        <div className="flex justify-between items-center mb-4">
        <h3 className="text-body-lg font-headline-md text-primary">Upcoming Sessions</h3>
        <a className="text-secondary text-label-sm hover:underline" href="#">View All</a>
        </div>
        <div className="space-y-3">
        <div className="flex items-center p-3 hover:bg-surface-container-low rounded-lg border-b border-outline-variant border-opacity-50 last:border-0 transition-colors cursor-pointer">
        <div className="bg-secondary-container text-on-secondary-container w-12 h-12 rounded flex flex-col items-center justify-center ml-4 shrink-0">
        <span className="text-label-sm font-bold">NOV</span>
        <span className="text-body-md">15</span>
        </div>
        <div className="flex-1">
        <h4 className="text-body-md font-medium text-on-surface">First Hearing - Defense Memo</h4>
        <p className="text-label-sm text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>location_on</span> Dubai Courts - Chamber 4B</p>
        </div>
        <span className="material-symbols-outlined text-outline-variant">chevron_left</span>
        </div>
        </div>
        </div>
        </div>
        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-4 space-y-gutter">
        {/* Key Information */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md">
        <h3 className="text-body-lg font-headline-md text-primary mb-4 border-b border-outline-variant pb-2">Key Details</h3>
        <ul className="space-y-4">
        <li>
        <span className="text-label-sm text-on-surface-variant block mb-1">Court</span>
        <span className="text-body-md text-on-surface">Dubai Commercial Court</span>
        </li>
        <li>
        <span className="text-label-sm text-on-surface-variant block mb-1">Filing Date</span>
        <span className="text-body-md text-on-surface">Oct 12, 2024</span>
        </li>
        <li>
        <span className="text-label-sm text-on-surface-variant block mb-1">Claim Value</span>
        <span className="text-body-md text-on-surface font-medium">AED 2,500,000</span>
        </li>
        </ul>
        </div>
        </div>
        </div>
        </div>
        </main>
      </>
    </div>
  );
}

function Screen_admin_calendar(): JSX.Element {
  return (
    <div className={"bg-surface text-on-surface font-body-md min-h-screen flex overflow-hidden"} data-stitch-source={"kmt_legal_2"}>
      <style dangerouslySetInnerHTML={{ __html: "body { background-color: #f7f9fb; }\n        /* Custom scrollbar for better UI */\n        ::-webkit-scrollbar { width: 6px; height: 6px; }\n        ::-webkit-scrollbar-track { background: transparent; }\n        ::-webkit-scrollbar-thumb { background: #c6c6cd; border-radius: 4px; }\n        ::-webkit-scrollbar-thumb:hover { background: #76777d; }" }} />
      <>
        {/* SideNavBar Component (From JSON) */}
        <aside className="bg-surface-container-low h-screen w-64 fixed right-0 top-0 rtl border-l border-outline-variant flex flex-col py-stack-md z-40 hidden md:flex">
        {/* Header */}
        <div className="px-margin-desktop mb-stack-lg flex flex-col items-center">
        <div className="w-16 h-16 rounded-full overflow-hidden mb-stack-sm border border-outline-variant">
        <img alt="KMT Logo" className="object-cover w-full h-full" data-alt="A highly detailed professional corporate logo for a high-end legal firm 'KMT Legal'. The logo features a stylized monogram or classical scale element, rendered in deep navy and gold accents on a pure white background, communicating authority, precision, and luxury." src="/stitch-assets/fce754e86908cbe9.png"/>
        </div>
        <h1 className="text-headline-md font-headline-md text-primary text-center">KMT Legal</h1>
        <p className="font-label-sm text-label-sm text-on-surface-variant text-center mt-1">Management Portal</p>
        </div>
        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        <a className="flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
        <span className="font-label-sm text-label-sm">Dashboard</span>
        </a>
        <a className="flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined" data-icon="folder_shared">folder_shared</span>
        <span className="font-label-sm text-label-sm">Cases</span>
        </a>
        <a className="flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined" data-icon="description">description</span>
        <span className="font-label-sm text-label-sm">Documents</span>
        </a>
        {/* Active State Navigation Item */}
        <a className="flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg bg-secondary-container text-on-secondary-container mx-2 transition-colors duration-200" href="#">
        <span className="material-symbols-outlined" data-icon="calendar_month" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
        <span className="font-label-sm text-label-sm font-bold">Calendar</span>
        </a>
        <a className="flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined" data-icon="group">group</span>
        <span className="font-label-sm text-label-sm">Clients</span>
        </a>
        <a className="flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined" data-icon="settings">settings</span>
        <span className="font-label-sm text-label-sm">Settings</span>
        </a>
        </nav>
        {/* CTA */}
        <div className="px-4 mt-stack-md mb-stack-md">
        <button className="w-full bg-secondary text-on-primary font-label-sm text-label-sm py-2 px-4 rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center gap-2 shadow-sm">
        <span className="material-symbols-outlined text-[18px]" data-icon="add">add</span>
                        New Filing
                    </button>
        </div>
        {/* Footer Navigation */}
        <div className="mt-auto px-2 border-t border-outline-variant pt-stack-sm space-y-1">
        <a className="flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined" data-icon="help">help</span>
        <span className="font-label-sm text-label-sm">Support</span>
        </a>
        <a className="flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined" data-icon="logout">logout</span>
        <span className="font-label-sm text-label-sm">Logout</span>
        </a>
        </div>
        </aside>
        {/* Main Content Area */}
        <main className="flex-1 md:mr-64 flex flex-col h-screen overflow-hidden bg-background">
        {/* Top App Bar (Simplified internal header) */}
        <header className="bg-surface-container-lowest border-b border-outline-variant h-20 flex items-center justify-between px-margin-desktop sticky top-0 z-30">
        <h2 className="text-headline-md font-headline-md text-primary font-semibold tracking-tight">المواعيد والجلسات</h2>
        <div className="flex items-center gap-4">
        {/* Filters trigger */}
        <button className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant rounded bg-surface text-on-surface-variant hover:bg-surface-container-high transition-colors text-label-sm font-label-sm">
        <span className="material-symbols-outlined text-[18px]" data-icon="filter_list">filter_list</span>
                            تصفية
                        </button>
        {/* Date Navigation */}
        <div className="flex items-center gap-2 bg-surface-container-low rounded-lg p-1 border border-outline-variant">
        <button className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant transition-colors">
        <span className="material-symbols-outlined text-[20px]" data-icon="chevron_right">chevron_right</span>
        </button>
        <span className="font-body-md text-body-md px-2 font-medium min-w-[120px] text-center">أكتوبر 2024</span>
        <button className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant transition-colors">
        <span className="material-symbols-outlined text-[20px]" data-icon="chevron_left">chevron_left</span>
        </button>
        </div>
        {/* View Toggle */}
        <div className="flex items-center bg-surface-container-low rounded-lg p-1 border border-outline-variant text-label-sm font-label-sm">
        <button className="px-3 py-1.5 rounded bg-surface shadow-sm text-primary font-medium">شهر</button>
        <button className="px-3 py-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant transition-colors">أسبوع</button>
        <button className="px-3 py-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant transition-colors">يوم</button>
        </div>
        </div>
        </header>
        {/* Content Grid Layout */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Center: Calendar Canvas (9 columns approx) */}
        <div className="flex-1 overflow-auto p-margin-desktop">
        {/* Quick Filters Bar */}
        <div className="flex gap-3 mb-stack-lg flex-wrap">
        <span className="px-3 py-1 rounded-full border border-outline-variant bg-surface text-on-surface text-label-sm font-label-sm flex items-center gap-2 cursor-pointer hover:bg-surface-container-low">
        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                جلسات محكمة
                            </span>
        <span className="px-3 py-1 rounded-full border border-outline-variant bg-surface text-on-surface text-label-sm font-label-sm flex items-center gap-2 cursor-pointer hover:bg-surface-container-low">
        <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                                استشارات أونلاين
                            </span>
        <span className="px-3 py-1 rounded-full border border-outline-variant bg-surface text-on-surface text-label-sm font-label-sm flex items-center gap-2 cursor-pointer hover:bg-surface-container-low">
        <span className="w-2 h-2 rounded-full bg-outline"></span>
                                اجتماعات مكتبية
                            </span>
        </div>
        {/* Bento-style Calendar Grid (Mockup Month View) */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant text-center py-2">
        <div>الأحد</div><div>الإثنين</div><div>الثلاثاء</div><div>الأربعاء</div><div>الخميس</div><div>الجمعة</div><div>السبت</div>
        </div>
        {/* Calendar Body (Simplified rows) */}
        <div className="grid grid-cols-7 h-[600px]">
        {/* Row 1 */}
        <div className="border-b border-l border-outline-variant p-2 min-h-[120px] bg-surface-container-highest/30"><span className="text-label-sm text-outline">29</span></div>
        <div className="border-b border-l border-outline-variant p-2 min-h-[120px] bg-surface-container-highest/30"><span className="text-label-sm text-outline">30</span></div>
        <div className="border-b border-l border-outline-variant p-2 min-h-[120px]"><span className="text-label-sm text-on-surface">1</span></div>
        <div className="border-b border-l border-outline-variant p-2 min-h-[120px]">
        <span className="text-label-sm text-on-surface">2</span>
        <div className="mt-1 bg-secondary/10 border border-secondary/20 text-secondary text-[10px] px-1 py-0.5 rounded truncate">جلسة مرافعة - قضية 402</div>
        </div>
        <div className="border-b border-l border-outline-variant p-2 min-h-[120px]"><span className="text-label-sm text-on-surface">3</span></div>
        <div className="border-b border-l border-outline-variant p-2 min-h-[120px]"><span className="text-label-sm text-on-surface">4</span></div>
        <div className="border-b border-outline-variant p-2 min-h-[120px]"><span className="text-label-sm text-on-surface">5</span></div>
        {/* Row 2 */}
        <div className="border-b border-l border-outline-variant p-2 min-h-[120px]"><span className="text-label-sm text-on-surface">6</span></div>
        <div className="border-b border-l border-outline-variant p-2 min-h-[120px]"><span className="text-label-sm text-on-surface">7</span></div>
        <div className="border-b border-l border-outline-variant p-2 min-h-[120px] bg-primary/5">
        <span className="text-label-sm font-bold text-primary flex items-center justify-between">
                                        8 <span className="w-1.5 h-1.5 bg-error rounded-full" title="يوجد تعارض"></span>
        </span>
        <div className="mt-1 bg-primary-container text-on-primary-container text-[10px] px-1 py-0.5 rounded truncate mb-1">استشارة زووم - العميل أحمد</div>
        <div className="mt-1 bg-secondary/10 border border-secondary/20 text-secondary text-[10px] px-1 py-0.5 rounded truncate">جلسة نطق بالحكم - 10:00</div>
        </div>
        <div className="border-b border-l border-outline-variant p-2 min-h-[120px]"><span className="text-label-sm text-on-surface">9</span></div>
        <div className="border-b border-l border-outline-variant p-2 min-h-[120px]"><span className="text-label-sm text-on-surface">10</span></div>
        <div className="border-b border-l border-outline-variant p-2 min-h-[120px]"><span className="text-label-sm text-on-surface">11</span></div>
        <div className="border-b border-outline-variant p-2 min-h-[120px]"><span className="text-label-sm text-on-surface">12</span></div>
        </div>
        </div>
        </div>
        {/* Right Panel: Contextual Agenda (3 columns approx) */}
        <div className="w-full lg:w-80 border-r border-outline-variant bg-surface-container-lowest h-full overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-outline-variant sticky top-0 bg-surface-container-lowest/90 backdrop-blur z-10">
        <h3 className="text-body-lg font-body-lg text-primary mb-1">أجندة اليوم</h3>
        <p className="text-label-sm font-label-sm text-on-surface-variant">الثلاثاء، 8 أكتوبر 2024</p>
        </div>
        <div className="p-4 space-y-stack-lg">
        {/* Urgent Alerts Section */}
        <div className="bg-error-container border border-error/20 rounded-lg p-3">
        <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-error text-[20px]" data-icon="warning">warning</span>
        <div>
        <h4 className="text-label-sm font-bold text-on-error-container">تنبيه تعارض مواعيد</h4>
        <p className="text-[11px] text-on-error-container/80 mt-1 leading-tight">يوجد تعارض بين جلسة النطق بالحكم والاستشارة عبر زووم في تمام الساعة 10:00 صباحاً.</p>
        <button className="mt-2 text-xs text-error font-medium underline">إعادة جدولة الاستشارة</button>
        </div>
        </div>
        </div>
        {/* Court Sessions */}
        <div>
        <h4 className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-2 mb-3 border-b border-outline-variant pb-2">
        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                    جلسات المحكمة اليوم
                                </h4>
        <div className="space-y-3">
        {/* Event Card */}
        <div className="group relative bg-surface border border-outline-variant rounded-lg p-3 hover:border-secondary transition-colors cursor-pointer shadow-sm">
        <div className="flex justify-between items-start mb-2">
        <span className="text-label-sm font-bold text-primary">10:00 ص - 12:00 م</span>
        <span className="bg-surface-container-high text-on-surface-variant text-[10px] px-1.5 py-0.5 rounded">محكمة الاستئناف</span>
        </div>
        <h5 className="text-body-md font-body-md text-primary leading-tight mb-1">جلسة نطق بالحكم - قضية 892</h5>
        <p className="text-[11px] text-on-surface-variant line-clamp-1">القاضي: محمود الشريف - القاعة 4</p>
        <div className="mt-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="text-xs text-secondary font-medium">عرض التفاصيل</button>
        </div>
        </div>
        </div>
        </div>
        {/* Consultations */}
        <div>
        <h4 className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-2 mb-3 border-b border-outline-variant pb-2">
        <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                                    الاستشارات والاجتماعات
                                </h4>
        <div className="space-y-3">
        {/* Event Card */}
        <div className="group relative bg-surface border border-outline-variant rounded-lg p-3 hover:border-primary-container transition-colors cursor-pointer shadow-sm">
        <div className="flex justify-between items-start mb-2">
        <span className="text-label-sm font-bold text-primary">10:00 ص - 10:45 ص</span>
        <span className="bg-primary-fixed/20 text-on-primary-fixed text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
        <span className="material-symbols-outlined text-[12px]" data-icon="videocam">videocam</span> أونلاين
                                            </span>
        </div>
        <h5 className="text-body-md font-body-md text-primary leading-tight mb-1">استشارة مبدئية - تأسيس شركة</h5>
        <p className="text-[11px] text-on-surface-variant line-clamp-1">العميل: شركة الأفق للاستثمار</p>
        </div>
        {/* Event Card */}
        <div className="group relative bg-surface border border-outline-variant rounded-lg p-3 hover:border-outline transition-colors cursor-pointer shadow-sm">
        <div className="flex justify-between items-start mb-2">
        <span className="text-label-sm font-bold text-primary">02:30 م - 03:30 م</span>
        <span className="bg-surface-container-high text-on-surface-variant text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
        <span className="material-symbols-outlined text-[12px]" data-icon="meeting_room">meeting_room</span> المكتب
                                            </span>
        </div>
        <h5 className="text-body-md font-body-md text-primary leading-tight mb-1">اجتماع مراجعة عقود</h5>
        <p className="text-[11px] text-on-surface-variant line-clamp-1">الفريق الداخلي الموكل بالقضية</p>
        </div>
        </div>
        </div>
        </div>
        </div>
        </div>
        </main>
      </>
    </div>
  );
}

function Screen_admin_tasks(): JSX.Element {
  return (
    <div className={"bg-background text-on-background font-body-md min-h-screen flex selection:bg-secondary-container selection:text-on-secondary-container"} data-stitch-source={"kmt_legal_4"}>
      <style dangerouslySetInnerHTML={{ __html: ".kanban-scroll::-webkit-scrollbar {\n            height: 6px;\n        }\n        .kanban-scroll::-webkit-scrollbar-track {\n            background: #f2f4f6; \n            border-radius: 4px;\n        }\n        .kanban-scroll::-webkit-scrollbar-thumb {\n            background: #c6c6cd; \n            border-radius: 4px;\n        }\n        .kanban-scroll::-webkit-scrollbar-thumb:hover {\n            background: #76777d; \n        }" }} />
      <>
        {/* SideNavBar */}
        <nav className="bg-surface-container-low dark:bg-surface-container-low h-screen w-64 fixed right-0 top-0 rtl border-l border-outline-variant dark:border-outline flex flex-col h-full py-stack-md z-50 transition-transform duration-300 transform md:translate-x-0 translate-x-full" id="mobile-menu">
        <div className="px-margin-desktop mb-stack-lg flex items-center justify-between">
        <div>
        <h1 className="text-headline-md font-headline-md text-primary">KMT Legal</h1>
        <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">Management Portal</p>
        </div>
        <button className="md:hidden text-on-surface-variant hover:text-primary" id="close-menu">
        <span className="material-symbols-outlined">close</span>
        </button>
        </div>
        <div className="px-margin-desktop mb-stack-lg">
        <button className="w-full bg-secondary text-on-primary py-2 px-4 rounded font-label-sm hover:bg-on-secondary-container transition-colors duration-200 flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>add</span>
                        New Filing
                    </button>
        </div>
        <ul className="flex-1 overflow-y-auto space-y-1">
        <li>
        <a className="flex items-center gap-3 px-margin-desktop py-2 text-on-surface-variant hover:bg-surface-container-high mx-2 rounded transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>dashboard</span>
        <span className="font-label-sm text-label-sm">Dashboard</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-margin-desktop py-2 bg-secondary-container text-on-secondary-container rounded-lg mx-2 transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
        <span className="font-label-sm text-label-sm font-bold">المهام</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-margin-desktop py-2 text-on-surface-variant hover:bg-surface-container-high mx-2 rounded transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>folder_shared</span>
        <span className="font-label-sm text-label-sm">Cases</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-margin-desktop py-2 text-on-surface-variant hover:bg-surface-container-high mx-2 rounded transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>description</span>
        <span className="font-label-sm text-label-sm">Documents</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-margin-desktop py-2 text-on-surface-variant hover:bg-surface-container-high mx-2 rounded transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>calendar_month</span>
        <span className="font-label-sm text-label-sm">Calendar</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-margin-desktop py-2 text-on-surface-variant hover:bg-surface-container-high mx-2 rounded transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>group</span>
        <span className="font-label-sm text-label-sm">Clients</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-margin-desktop py-2 text-on-surface-variant hover:bg-surface-container-high mx-2 rounded transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>settings</span>
        <span className="font-label-sm text-label-sm">Settings</span>
        </a>
        </li>
        </ul>
        <div className="mt-auto border-t border-outline-variant pt-stack-md">
        <ul className="space-y-1">
        <li>
        <a className="flex items-center gap-3 px-margin-desktop py-2 text-on-surface-variant hover:bg-surface-container-high mx-2 rounded transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>help</span>
        <span className="font-label-sm text-label-sm">Support</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 px-margin-desktop py-2 text-on-surface-variant hover:bg-surface-container-high mx-2 rounded transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>logout</span>
        <span className="font-label-sm text-label-sm">Logout</span>
        </a>
        </li>
        </ul>
        </div>
        </nav>
        {/* Main Content Canvas */}
        <main className="flex-1 md:mr-64 flex flex-col min-h-screen">
        {/* TopAppBar / Header */}
        <header className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-40 px-margin-desktop py-4 flex justify-between items-center h-20">
        <div className="flex items-center gap-4">
        <button className="md:hidden text-on-surface-variant hover:text-primary" id="open-menu">
        <span className="material-symbols-outlined">menu</span>
        </button>
        <h2 className="font-headline-md text-headline-md text-primary">المهام</h2>
        </div>
        <div className="flex items-center gap-stack-md">
        <div className="relative hidden sm:block">
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
        <input className="pl-4 pr-10 py-2 border border-outline-variant rounded bg-surface-container-low text-body-md focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-shadow w-64 text-right dir-rtl" placeholder="بحث في المهام..." type="text"/>
        </div>
        <button className="text-on-surface-variant hover:text-secondary transition-colors relative">
        <span className="material-symbols-outlined">notifications</span>
        <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
        </button>
        <div className="w-px h-6 bg-outline-variant mx-2 hidden sm:block"></div>
        <button className="bg-secondary text-on-primary px-4 py-2 rounded font-label-sm text-label-sm hover:bg-on-secondary-container transition-colors flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">add</span>
                            إضافة مهمة
                        </button>
        </div>
        </header>
        {/* Kanban Board Container */}
        <div className="flex-1 p-margin-desktop overflow-hidden flex flex-col bg-background">
        {/* Filters & Controls (Optional but good for premium feel) */}
        <div className="mb-stack-lg flex justify-between items-center flex-wrap gap-4">
        <div className="flex gap-2">
        <button className="px-3 py-1.5 rounded-full border border-outline-variant bg-surface-container-lowest text-label-sm font-label-sm text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors">الكل</button>
        <button className="px-3 py-1.5 rounded-full border border-outline-variant bg-surface-container-lowest text-label-sm font-label-sm text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors">مهامي</button>
        <button className="px-3 py-1.5 rounded-full border border-outline-variant bg-surface-container-lowest text-label-sm font-label-sm text-error hover:border-error transition-colors flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">warning</span> متأخرة
                            </button>
        </div>
        <div className="flex items-center gap-2">
        <span className="text-label-sm text-on-surface-variant">ترتيب حسب:</span>
        <select className="border border-outline-variant rounded bg-surface-container-lowest text-label-sm font-label-sm py-1.5 pl-8 pr-3 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary">
        <option>الأولوية</option>
        <option>تاريخ الاستحقاق</option>
        <option>تاريخ الإنشاء</option>
        </select>
        </div>
        </div>
        {/* Kanban Columns Grid */}
        <div className="flex-1 overflow-x-auto kanban-scroll flex gap-gutter pb-4 items-start h-full">
        {/* Column: New (جديد) */}
        <div className="min-w-[300px] w-[300px] flex-shrink-0 flex flex-col max-h-full bg-surface-container-low rounded-lg p-3">
        <div className="flex justify-between items-center mb-3 px-2">
        <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-inverse-primary"></span>
        <h3 className="font-headline-md text-[16px] font-semibold text-on-surface">جديد</h3>
        <span className="bg-surface-variant text-on-surface-variant text-xs py-0.5 px-2 rounded-full font-label-sm">3</span>
        </div>
        <button className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-[18px]">more_horiz</span></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 kanban-scroll pb-2">
        {/* Task Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm hover:border-secondary transition-colors cursor-pointer group">
        <div className="flex justify-between items-start mb-2">
        <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-1 rounded font-label-sm font-medium">قضية #492-أ</span>
        <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-secondary opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
        </div>
        <h4 className="font-body-md font-medium text-on-surface mb-3 leading-tight">مراجعة مسودة العقد التجاري لشركة النور</h4>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-outline-variant/50">
        <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-label-sm">
        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
        <span>15 مايو 2024</span>
        </div>
        <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-outline-variant" title="أولوية منخفضة"></span>
        <img alt="Assigned" className="w-6 h-6 rounded-full object-cover border border-outline-variant" data-alt="Corporate headshot of an Arab male lawyer in a dark suit, modern office lighting, shallow depth of field, high-end professional style." src="/stitch-assets/9c6215dce55fcd11.png"/>
        </div>
        </div>
        </div>
        {/* Task Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm hover:border-secondary transition-colors cursor-pointer group">
        <div className="flex justify-between items-start mb-2">
        <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-1 rounded font-label-sm font-medium">استشارة عامة</span>
        </div>
        <h4 className="font-body-md font-medium text-on-surface mb-3 leading-tight">تجهيز ملف التسجيل الضريبي الجديد</h4>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-outline-variant/50">
        <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-label-sm">
        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
        <span>18 مايو 2024</span>
        </div>
        <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim" title="أولوية متوسطة"></span>
        <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[10px] font-bold border border-outline-variant">أ.س</div>
        </div>
        </div>
        </div>
        </div>
        <button className="mt-2 w-full py-2 text-on-surface-variant hover:bg-surface-container-high rounded text-sm flex items-center justify-center gap-1 transition-colors">
        <span className="material-symbols-outlined text-[18px]">add</span> إضافة بطاقة
                            </button>
        </div>
        {/* Column: In Progress (قيد التنفيذ) */}
        <div className="min-w-[300px] w-[300px] flex-shrink-0 flex flex-col max-h-full bg-surface-container-low rounded-lg p-3">
        <div className="flex justify-between items-center mb-3 px-2">
        <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim"></span>
        <h3 className="font-headline-md text-[16px] font-semibold text-on-surface">قيد التنفيذ</h3>
        <span className="bg-surface-variant text-on-surface-variant text-xs py-0.5 px-2 rounded-full font-label-sm">2</span>
        </div>
        <button className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-[18px]">more_horiz</span></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 kanban-scroll pb-2">
        {/* Task Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm hover:border-secondary transition-colors cursor-pointer group">
        <div className="flex justify-between items-start mb-2">
        <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-1 rounded font-label-sm font-medium">قضية #102-ج</span>
        </div>
        <h4 className="font-body-md font-medium text-on-surface mb-3 leading-tight">صياغة مذكرة الدفاع لجلسة الاستئناف</h4>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-outline-variant/50">
        <div className="flex items-center gap-2 text-secondary text-[11px] font-label-sm">
        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
        <span>غداً</span>
        </div>
        <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-error" title="أولوية عالية"></span>
        <img alt="Assigned" className="w-6 h-6 rounded-full object-cover border border-outline-variant" data-alt="Corporate headshot of an Arab female lawyer wearing a dark blazer and elegant hijab, professional lighting, clean white background." src="/stitch-assets/700c941a4859d5fb.png"/>
        </div>
        </div>
        </div>
        </div>
        </div>
        {/* Column: Waiting Review (بانتظار المراجعة) */}
        <div className="min-w-[300px] w-[300px] flex-shrink-0 flex flex-col max-h-full bg-surface-container-low rounded-lg p-3">
        <div className="flex justify-between items-center mb-3 px-2">
        <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
        <h3 className="font-headline-md text-[16px] font-semibold text-on-surface">بانتظار المراجعة</h3>
        <span className="bg-surface-variant text-on-surface-variant text-xs py-0.5 px-2 rounded-full font-label-sm">1</span>
        </div>
        <button className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-[18px]">more_horiz</span></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 kanban-scroll pb-2">
        {/* Task Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm hover:border-secondary transition-colors cursor-pointer group relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
        <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-1 rounded font-label-sm font-medium">قضية #881-م</span>
        </div>
        <h4 className="font-body-md font-medium text-on-surface mb-3 leading-tight">مراجعة تسوية النزاع العمالي</h4>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-outline-variant/50">
        <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-label-sm">
        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
        <span>20 مايو 2024</span>
        </div>
        <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim" title="أولوية متوسطة"></span>
        <div className="flex -space-x-2 -space-x-reverse">
        <img alt="Assigned" className="w-6 h-6 rounded-full object-cover border-2 border-surface-container-lowest relative z-10" data-alt="Corporate headshot of an Arab female lawyer wearing a dark blazer and elegant hijab, professional lighting, clean white background." src="/stitch-assets/06c131a0b449930e.png"/>
        <div className="w-6 h-6 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center text-[10px] font-bold border-2 border-surface-container-lowest relative z-0">م.ك</div>
        </div>
        </div>
        </div>
        </div>
        </div>
        </div>
        {/* Column: Overdue (متأخرة) */}
        <div className="min-w-[300px] w-[300px] flex-shrink-0 flex flex-col max-h-full bg-error-container/20 rounded-lg p-3 border border-error-container/50">
        <div className="flex justify-between items-center mb-3 px-2">
        <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-error"></span>
        <h3 className="font-headline-md text-[16px] font-semibold text-error">متأخرة</h3>
        <span className="bg-error text-on-error text-xs py-0.5 px-2 rounded-full font-label-sm">2</span>
        </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 kanban-scroll pb-2">
        {/* Overdue Task Card */}
        <div className="bg-surface-container-lowest border-l-4 border-l-error border-y border-r border-outline-variant rounded-lg p-4 shadow-sm hover:border-y-secondary hover:border-r-secondary transition-colors cursor-pointer group">
        <div className="flex justify-between items-start mb-2">
        <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-1 rounded font-label-sm font-medium">إداري</span>
        <div className="bg-error-container text-on-error-container text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
        <span className="material-symbols-outlined text-[12px]">warning</span> متأخر يومين
                                        </div>
        </div>
        <h4 className="font-body-md font-medium text-on-surface mb-3 leading-tight">تجديد تراخيص الفرع الرئيسي</h4>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-outline-variant/50">
        <div className="flex items-center gap-2 text-error font-bold text-[11px] font-label-sm">
        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
        <span>10 مايو 2024</span>
        </div>
        <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-error" title="أولوية عالية"></span>
        <img alt="Assigned" className="w-6 h-6 rounded-full object-cover border border-outline-variant" data-alt="Corporate headshot of an Arab male lawyer in a dark suit, modern office lighting, shallow depth of field, high-end professional style." src="/stitch-assets/96993f7d69028850.png"/>
        </div>
        </div>
        </div>
        </div>
        </div>
        {/* Column: Completed (مكتملة) */}
        <div className="min-w-[300px] w-[300px] flex-shrink-0 flex flex-col max-h-full bg-surface-container-low rounded-lg p-3 opacity-80">
        <div className="flex justify-between items-center mb-3 px-2">
        <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">check_circle</span>
        <h3 className="font-headline-md text-[16px] font-semibold text-on-surface-variant">مكتملة</h3>
        <span className="bg-surface-variant text-on-surface-variant text-xs py-0.5 px-2 rounded-full font-label-sm">24</span>
        </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 kanban-scroll pb-2">
        {/* Completed Task Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-4 shadow-sm cursor-pointer group">
        <div className="flex justify-between items-start mb-2">
        <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-1 rounded font-label-sm font-medium line-through">قضية #332-ف</span>
        </div>
        <h4 className="font-body-md font-medium text-on-surface-variant mb-3 leading-tight line-through">إيداع رسوم الخبراء بالمحكمة</h4>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-outline-variant/30">
        <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-label-sm">
        <span className="material-symbols-outlined text-[14px]">done_all</span>
        <span>أنجزت في 8 مايو</span>
        </div>
        <div className="w-6 h-6 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center text-[10px] font-bold border border-outline-variant/50">أ.س</div>
        </div>
        </div>
        </div>
        </div>
        </div>
        </div>
        </main>
        <script dangerouslySetInnerHTML={{ __html: "\n        // Simple script for mobile menu toggle\n        document.getElementById('open-menu').addEventListener('click', function() {\n            document.getElementById('mobile-menu').classList.remove('translate-x-full');\n        });\n        \n        document.getElementById('close-menu').addEventListener('click', function() {\n            document.getElementById('mobile-menu').classList.add('translate-x-full');\n        });\n    " }} />
      </>
    </div>
  );
}

function Screen_admin_content_social(): JSX.Element {
  return (
    <div className={"text-on-surface font-body-md antialiased min-h-screen flex"} data-stitch-source={"kmt_legal_3"}>
      <style dangerouslySetInnerHTML={{ __html: "body { background-color: #F8FAFC; }\n        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20; }\n        .icon-fill { font-variation-settings: 'FILL' 1; }\n        \n        /* Glassmorphism Panel */\n        .glass-panel {\n            background: rgba(255, 255, 255, 0.85);\n            backdrop-filter: blur(12px);\n            -webkit-backdrop-filter: blur(12px);\n            border: 1px solid rgba(255, 255, 255, 0.3);\n        }\n\n        /* Status Badges */\n        .badge-draft { background-color: #f1f5f9; color: #475569; } /* Gray */\n        .badge-law-review { background-color: #fef3c7; color: #92400e; } /* Amber */\n        .badge-approved { background-color: #e0f2fe; color: #0369a1; } /* Blue */\n        .badge-scheduled { background-color: #fce7f3; color: #9d174d; } /* Pink */\n        .badge-published { background-color: #dcfce7; color: #166534; } /* Green */\n        \n        /* Content Types */\n        .type-article { border-right: 3px solid #0f172a; }\n        .type-case-study { border-right: 3px solid #b45309; }\n        .type-social { border-right: 3px solid #0369a1; }" }} />
      <>
        {/* SideNavBar (Suppressed based on logic - this is a focused content hub, but it could be a top-level nav item in a marketing portal. Let's assume it's part of the main portal for this specific user role, but for the sake of the prompt's focus on the "Content & Social Hub page", we'll provide the sidebar to show grid layout mastery as requested in style guidance: "3-column sidebar with a 9-column main view"). */}
        {/* Actually, the prompt doesn't explicitly mention the sidebar, but the 12-column grid rules suggest it. Let's include the SideNavBar from JSON. */}
        <nav className="h-screen w-64 fixed right-0 top-0 rtl bg-surface-container-low dark:bg-surface-container-low border-l border-outline-variant dark:border-outline flat no shadows flex flex-col h-full py-stack-md z-40 hidden lg:flex">
        <div className="px-margin-desktop mb-stack-lg">
        <h1 className="text-headline-md font-headline-md text-primary truncate">KMT Legal</h1>
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-1">Management Portal</p>
        </div>
        <div className="px-4 mb-6">
        <button className="w-full bg-secondary hover:bg-on-secondary-container text-white py-2.5 px-4 rounded-lg font-label-sm text-label-sm flex items-center justify-center gap-2 transition-colors">
        <span className="material-symbols-outlined text-[18px]">add</span>
                        New Filing
                    </button>
        </div>
        <ul className="flex-1 space-y-1">
        <li>
        <a className="flex items-center gap-3 py-2.5 px-3 mx-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">dashboard</span>
        <span className="font-label-sm text-label-sm">Dashboard</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 py-2.5 px-3 mx-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">folder_shared</span>
        <span className="font-label-sm text-label-sm">Cases</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 py-2.5 px-3 mx-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">description</span>
        <span className="font-label-sm text-label-sm">Documents</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 py-2.5 px-3 mx-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">calendar_month</span>
        <span className="font-label-sm text-label-sm">Calendar</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 py-2.5 px-3 mx-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">group</span>
        <span className="font-label-sm text-label-sm">Clients</span>
        </a>
        </li>
        <li>
        <a className="flex items-center gap-3 py-2.5 px-3 mx-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">settings</span>
        <span className="font-label-sm text-label-sm">Settings</span>
        </a>
        </li>
        </ul>
        <div className="mt-auto border-t border-outline-variant pt-4 space-y-1">
        <a className="flex items-center gap-3 py-2.5 px-3 mx-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">help</span>
        <span className="font-label-sm text-label-sm">Support</span>
        </a>
        <a className="flex items-center gap-3 py-2.5 px-3 mx-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
        <span className="material-symbols-outlined text-[20px]">logout</span>
        <span className="font-label-sm text-label-sm">Logout</span>
        </a>
        </div>
        </nav>
        {/* Main Content Area */}
        <main className="flex-1 lg:mr-64 p-margin-desktop max-w-container-max mx-auto w-full">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-stack-lg gap-4">
        <div>
        <h1 className="font-display-lg text-display-lg text-primary">المحتوى والسوشيال</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">إدارة النشر، مراجعة المحتوى القانوني، وجدولة المشاركات.</p>
        </div>
        <div className="flex items-center gap-3">
        <button className="bg-surface-container-high hover:bg-surface-container-highest text-primary px-4 py-2 rounded-DEFAULT font-label-sm text-label-sm border border-outline-variant transition-colors flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">filter_list</span>
                            تصفية
                        </button>
        <button className="bg-secondary hover:bg-on-secondary-container text-white px-5 py-2 rounded-DEFAULT font-label-sm text-label-sm transition-colors flex items-center gap-2 shadow-sm">
        <span className="material-symbols-outlined text-[18px]">edit_document</span>
                            إنشاء محتوى جديد
                        </button>
        </div>
        </header>
        {/* Navigation Tabs */}
        <div className="border-b border-outline-variant mb-stack-md overflow-x-auto">
        <nav className="flex gap-6 min-w-max">
        <a className="font-label-sm text-label-sm py-3 px-1 border-b-2 border-secondary text-primary font-semibold" href="#">Articles</a>
        <a className="font-label-sm text-label-sm py-3 px-1 border-b-2 border-transparent text-on-surface-variant hover:text-primary transition-colors" href="#">Case Studies</a>
        <a className="font-label-sm text-label-sm py-3 px-1 border-b-2 border-transparent text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1" href="#">
                            Social Posts
                            <span className="bg-surface-container-high text-primary px-1.5 py-0.5 rounded text-[10px]">12</span>
        </a>
        <a className="font-label-sm text-label-sm py-3 px-1 border-b-2 border-transparent text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1" href="#">
                            Pending Approval
                            <span className="bg-error-container text-on-error-container px-1.5 py-0.5 rounded text-[10px]">3</span>
        </a>
        </nav>
        </div>
        {/* Layout Grid: 12 Columns */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
        {/* Main Content Canvas (8 Cols) */}
        <div className="xl:col-span-8 space-y-stack-md">
        {/* Search & Filters Bar (Minimalist) */}
        <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant flex items-center gap-3">
        <span className="material-symbols-outlined text-outline">search</span>
        <input className="flex-1 bg-transparent border-none focus:ring-0 font-body-md text-body-md text-primary placeholder-outline p-0" placeholder="البحث في المحتوى..." type="text"/>
        </div>
        {/* Data Table Container */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
        <thead>
        <tr className="bg-surface-container-low border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant">
        <th className="py-3 px-4 font-medium">العنوان (Title)</th>
        <th className="py-3 px-4 font-medium">النوع (Type)</th>
        <th className="py-3 px-4 font-medium">المنصة (Platform)</th>
        <th className="py-3 px-4 font-medium">الحالة (Status)</th>
        <th className="py-3 px-4 font-medium">المؤلف (Author)</th>
        <th className="py-3 px-4 font-medium">التاريخ (Date)</th>
        <th className="py-3 px-4 font-medium text-center">إجراء</th>
        </tr>
        </thead>
        <tbody className="font-body-md text-body-md divide-y divide-outline-variant">
        {/* Row 1 */}
        <tr className="hover:bg-surface-container-low transition-colors group type-article">
        <td className="py-4 px-4 font-medium text-primary">تأثير التعديلات الضريبية الجديدة 2024</td>
        <td className="py-4 px-4 text-on-surface-variant">Article</td>
        <td className="py-4 px-4"><span className="material-symbols-outlined text-outline text-[20px]">language</span></td>
        <td className="py-4 px-4">
        <span className="badge-law-review px-2.5 py-1 rounded-full font-label-sm text-label-sm inline-block">Law Review</span>
        </td>
        <td className="py-4 px-4 text-on-surface-variant">أحمد خليل</td>
        <td className="py-4 px-4 text-on-surface-variant text-sm">Oct 24</td>
        <td className="py-4 px-4 text-center">
        <button className="text-outline hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
        </td>
        </tr>
        {/* Row 2 */}
        <tr className="hover:bg-surface-container-low transition-colors group type-case-study">
        <td className="py-4 px-4 font-medium text-primary">استحواذ شركة التقنية الإقليمية</td>
        <td className="py-4 px-4 text-on-surface-variant">Case Study</td>
        <td className="py-4 px-4"><span className="material-symbols-outlined text-outline text-[20px]">description</span></td>
        <td className="py-4 px-4">
        <span className="badge-published px-2.5 py-1 rounded-full font-label-sm text-label-sm inline-block">Published</span>
        </td>
        <td className="py-4 px-4 text-on-surface-variant">فريق الشركات</td>
        <td className="py-4 px-4 text-on-surface-variant text-sm">Oct 22</td>
        <td className="py-4 px-4 text-center">
        <button className="text-outline hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
        </td>
        </tr>
        {/* Row 3 */}
        <tr className="hover:bg-surface-container-low transition-colors group type-social">
        <td className="py-4 px-4 font-medium text-primary">نصائح الامتثال للشركات الناشئة</td>
        <td className="py-4 px-4 text-on-surface-variant">Social Post</td>
        <td className="py-4 px-4 flex items-center gap-1">
        <span className="material-symbols-outlined text-outline text-[20px]">work</span> {/* LinkedIn proxy */}
        </td>
        <td className="py-4 px-4">
        <span className="badge-scheduled px-2.5 py-1 rounded-full font-label-sm text-label-sm inline-block">Scheduled</span>
        </td>
        <td className="py-4 px-4 text-on-surface-variant">سارة منصور</td>
        <td className="py-4 px-4 text-on-surface-variant text-sm">Oct 26</td>
        <td className="py-4 px-4 text-center">
        <button className="text-outline hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
        </td>
        </tr>
        {/* Row 4 */}
        <tr className="hover:bg-surface-container-low transition-colors group type-article bg-surface-container-low/50">
        <td className="py-4 px-4 font-medium text-primary">دليل قوانين العمل عن بعد</td>
        <td className="py-4 px-4 text-on-surface-variant">Article</td>
        <td className="py-4 px-4"><span className="material-symbols-outlined text-outline text-[20px]">language</span></td>
        <td className="py-4 px-4">
        <span className="badge-draft px-2.5 py-1 rounded-full font-label-sm text-label-sm inline-block">Draft</span>
        </td>
        <td className="py-4 px-4 text-on-surface-variant">محمود سعيد</td>
        <td className="py-4 px-4 text-on-surface-variant text-sm">--</td>
        <td className="py-4 px-4 text-center">
        <button className="text-outline hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
        </td>
        </tr>
        </tbody>
        </table>
        </div>
        {/* Pagination (Minimal) */}
        <div className="px-4 py-3 border-t border-outline-variant flex items-center justify-between">
        <span className="font-label-sm text-label-sm text-on-surface-variant">عرض 1-4 من 24</span>
        <div className="flex gap-2">
        <button className="p-1 rounded text-outline hover:bg-surface-container-high transition-colors disabled:opacity-50" disabled>
        <span className="material-symbols-outlined">chevron_right</span>
        </button>
        <button className="p-1 rounded text-outline hover:bg-surface-container-high transition-colors">
        <span className="material-symbols-outlined">chevron_left</span>
        </button>
        </div>
        </div>
        </div>
        </div>
        {/* Contextual Sidebar / AI Panel (4 Cols) */}
        <aside className="xl:col-span-4 flex flex-col gap-gutter">
        {/* AI Draft Panel (Glassmorphism/High-end UI) */}
        <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-secondary icon-fill">auto_awesome</span>
        <h2 className="font-headline-md text-body-lg font-medium text-primary">AI Draft Panel</h2>
        </div>
        <p className="font-body-md text-label-sm text-on-surface-variant mb-4 leading-relaxed">
                                توليد مسودات لمنشورات منصات التواصل الاجتماعي تلقائياً بناءً على دراسات الحالة الحديثة أو الأحكام القانونية.
                            </p>
        <form className="space-y-4 relative z-10">
        <div>
        <label className="block font-label-sm text-label-sm text-primary mb-1">المصدر (Source)</label>
        <div className="relative">
        <select className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT py-2 px-3 appearance-none font-body-md text-label-sm text-primary focus:border-tertiary focus:ring-0">
        <option>استحواذ شركة التقنية الإقليمية</option>
        <option>قضية نزاع عقاري تجاري #402</option>
        <option>تسوية حقوق الملكية الفكرية</option>
        </select>
        <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px] pointer-events-none">expand_more</span>
        </div>
        </div>
        <div>
        <label className="block font-label-sm text-label-sm text-primary mb-1">المنصة (Platform)</label>
        <div className="flex gap-2">
        <label className="flex-1 cursor-pointer">
        <input checked className="peer sr-only" name="platform" type="radio"/>
        <div className="border border-outline-variant rounded-DEFAULT p-2 text-center peer-checked:border-secondary peer-checked:bg-secondary-container/10 transition-colors">
        <span className="font-label-sm text-label-sm text-primary">LinkedIn</span>
        </div>
        </label>
        <label className="flex-1 cursor-pointer">
        <input className="peer sr-only" name="platform" type="radio"/>
        <div className="border border-outline-variant rounded-DEFAULT p-2 text-center peer-checked:border-secondary peer-checked:bg-secondary-container/10 transition-colors">
        <span className="font-label-sm text-label-sm text-primary">X / Twitter</span>
        </div>
        </label>
        </div>
        </div>
        <div className="pt-2">
        <button className="w-full bg-tertiary hover:bg-primary-container text-white py-2.5 rounded-DEFAULT font-label-sm text-label-sm transition-colors flex items-center justify-center gap-2" type="button">
        <span className="material-symbols-outlined text-[18px]">psychology</span>
                                        توليد المسودة
                                    </button>
        </div>
        </form>
        </div>
        {/* Quick Stats / Insights (Bento style small card) */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5">
        <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-4">نظرة عامة هذا الشهر</h3>
        <div className="grid grid-cols-2 gap-4">
        <div>
        <p className="font-display-lg text-headline-md text-primary font-medium">12</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">تم النشر</p>
        </div>
        <div>
        <p className="font-display-lg text-headline-md text-secondary font-medium">5</p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">قيد المراجعة</p>
        </div>
        </div>
        </div>
        </aside>
        </div>
        </main>
      </>
    </div>
  );
}

export const stitchScreenNames = [
  "home",
  "services",
  "service-corporate-contracts",
  "team",
  "lawyer-profile-karim",
  "book-consultation",
  "case-studies",
  "case-study-commercial-dispute",
  "media",
  "articles",
  "contact",
  "login",
  "portal-dashboard",
  "portal-case-detail",
  "portal-documents",
  "portal-appointments",
  "admin-dashboard",
  "admin-clients",
  "admin-cases",
  "admin-case-detail",
  "admin-calendar",
  "admin-tasks",
  "admin-content-social"
] as const;

export const stitchScreens: Record<
  string,
  {
    sourceId: string;
    title: string;
    Component: () => JSX.Element;
  }
> = {
  "home": {
    sourceId: "kmt_legal_21",
    title: "KMT Legal Platform - مكتب محاماة عصري",
    Component: Screen_home
  },
  "services": {
    sourceId: "kmt_legal_20",
    title: "خدمات KMT Legal",
    Component: Screen_services
  },
  "service-corporate-contracts": {
    sourceId: "kmt_legal_18",
    title: "قضايا الشركات والعقود - KMT Legal",
    Component: Screen_service_corporate_contracts
  },
  "team": {
    sourceId: "kmt_legal_1",
    title: "Our Team - KMT Legal",
    Component: Screen_team
  },
  "lawyer-profile-karim": {
    sourceId: "._kmt_legal",
    title: "أ. كريم محمود - محامي",
    Component: Screen_lawyer_profile_karim
  },
  "book-consultation": {
    sourceId: "kmt_legal_22",
    title: "احجز استشارتك القانونية | KMT Legal",
    Component: Screen_book_consultation
  },
  "case-studies": {
    sourceId: "kmt_legal_19",
    title: "KMT Legal - نماذج من خبراتنا العملية",
    Component: Screen_case_studies
  },
  "case-study-commercial-dispute": {
    sourceId: "kmt_legal_17",
    title: "دراسة حالة: نزاع تجاري حول مستحقات مالية | KMT Legal",
    Component: Screen_case_study_commercial_dispute
  },
  "media": {
    sourceId: "kmt_legal_16",
    title: "KMT Legal - المركز الإعلامي القانوني",
    Component: Screen_media
  },
  "articles": {
    sourceId: "kmt_legal_15",
    title: "KMT Legal - مقالات قانونية مبسطة",
    Component: Screen_articles
  },
  "contact": {
    sourceId: "kmt_legal_14",
    title: "تواصل معنا - KMT Legal",
    Component: Screen_contact
  },
  "login": {
    sourceId: "kmt_legal_6",
    title: "KMT Legal - Login",
    Component: Screen_login
  },
  "portal-dashboard": {
    sourceId: "kmt_legal_13",
    title: "KMT Legal - Dashboard",
    Component: Screen_portal_dashboard
  },
  "portal-case-detail": {
    sourceId: "kmt_legal_10",
    title: "ملف استشارة عقارية - KMT Legal",
    Component: Screen_portal_case_detail
  },
  "portal-documents": {
    sourceId: "kmt_legal_11",
    title: "مستنداتي - KMT Legal",
    Component: Screen_portal_documents
  },
  "portal-appointments": {
    sourceId: "kmt_legal_12",
    title: "مواعيدي - KMT Legal",
    Component: Screen_portal_appointments
  },
  "admin-dashboard": {
    sourceId: "kmt_legal_9",
    title: "KMT Legal - لوحة المكتب",
    Component: Screen_admin_dashboard
  },
  "admin-clients": {
    sourceId: "kmt_legal_5",
    title: "العملاء - KMT Legal",
    Component: Screen_admin_clients
  },
  "admin-cases": {
    sourceId: "kmt_legal_8",
    title: "إدارة القضايا - KMT Legal",
    Component: Screen_admin_cases
  },
  "admin-case-detail": {
    sourceId: "kmt_legal_7",
    title: "Internal Case Detail Page - KMT Legal",
    Component: Screen_admin_case_detail
  },
  "admin-calendar": {
    sourceId: "kmt_legal_2",
    title: "المواعيد والجلسات - KMT Legal",
    Component: Screen_admin_calendar
  },
  "admin-tasks": {
    sourceId: "kmt_legal_4",
    title: "المهام - KMT Legal",
    Component: Screen_admin_tasks
  },
  "admin-content-social": {
    sourceId: "kmt_legal_3",
    title: "المحتوى والسوشيال - KMT Legal",
    Component: Screen_admin_content_social
  }
};
