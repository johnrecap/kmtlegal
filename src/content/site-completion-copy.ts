import type { PublicLocale } from '@/lib/public-locale';
export const publicDirectoryCopy = {
 ar: { practiceFilter: 'اختر التخصص', results: 'النتائج' },
 en: { practiceFilter: 'Filter by practice', results: 'Results' }
} as const;
export const siteCompletionCopy = {
 ar: {direct:'خدمات مباشرة', team:'فريق العمل',teamIntro:'يجمع فريق KMT Legal بين دراسة الوقائع والمستندات والتواصل المنظم مع العميل. يحدد المكتب المحامي المناسب بحسب نوع المسألة ونطاق العمل المتفق عليه.',values:'قيمنا',valueItems:['النزاهة','السرية','الدقة','الوضوح','الالتزام','الابتكار المسؤول'],executiveAlt:'المكتب التنفيذي في مقر KMT Legal',meetingAlt:'غرفة الاجتماعات في مقر KMT Legal',receptionAlt:'منطقة الاستقبال في مقر KMT Legal',browse:'استعرض التخصصات',help:'كيف يمكننا مساعدتك؟',corporate:'خدمات الشركات',knowledge:'المعرفة',careers:'الوظائف',plans:'باقات الشركات',innovation:'الابتكار',intelligence:'المعرفة القانونية',businessAi:'مساعد الشركات',next:'اطلب استشارة',privacy:'خصوصية بياناتك',available:'متاح الآن',development:'قيد التطوير',articles:'المقالات',firm:'عن المكتب',services:'مجالات الخبرة',industries:'القطاعات',contact:'تواصل معنا'},
 en: {direct:'Direct services',team:'Our team',teamIntro:'The KMT Legal team combines review of facts and documents with structured client communication. The office identifies the appropriate lawyer for the matter and agreed scope of work.',values:'Our values',valueItems:['Integrity','Confidentiality','Precision','Clarity','Commitment','Responsible innovation'],executiveAlt:'Executive office at KMT Legal',meetingAlt:'Meeting room at KMT Legal',receptionAlt:'Reception area at KMT Legal',browse:'Explore practices',help:'How can we help?',corporate:'Corporate services',knowledge:'Knowledge',careers:'Careers',plans:'Corporate plans',innovation:'Innovation',intelligence:'Legal intelligence',businessAi:'Business AI',next:'Request a consultation',privacy:'Your data privacy',available:'Available now',development:'In development',articles:'Articles',firm:'Our firm',services:'Expertise',industries:'Industries',contact:'Contact us'}
} as const;

export function publicNavigation(locale:PublicLocale) {
 const c=siteCompletionCopy[locale];
 return [{label:c.firm,href:'/our-firm'},{label:c.services,href:'/services'},{label:c.corporate,href:'/corporate-services'},{label:c.industries,href:'/industries'},{label:c.knowledge,href:'/articles'},{label:c.contact,href:'/contact'}];
}
export function navigationChildren(locale:PublicLocale,href:string) {
 const c=siteCompletionCopy[locale];
 const groups:Record<string,{label:string;href:string}[]>={
 '/our-firm':[{label:c.firm,href:'/our-firm'},{label:c.team,href:'/team'},{label:c.careers,href:'/careers'}],
 '/services':[{label:c.browse,href:'/services'},{label:c.help,href:'/how-can-we-help'}],
 '/corporate-services':[{label:c.corporate,href:'/corporate-services'},{label:c.plans,href:'/corporate-plans'},{label:c.businessAi,href:'/business-ai'}],
 '/articles':[{label:c.articles,href:'/articles'},{label:c.innovation,href:'/innovation'},{label:c.intelligence,href:'/legal-intelligence'}]
 }; return groups[href]??[];
}
