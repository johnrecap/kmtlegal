import { describe, expect, it } from 'vitest';
import { getPublicContent, bookingCategoryForPublicService } from '@/content/public-content';
import { intakeDraftSchema } from '@/server/consultations/conversation-contract';
describe('corporate service source representative',()=>{
 it.each(['ar','en'] as const)('preserves the six PDF p13-14 services and booking compatibility in %s',locale=>{
  const item=getPublicContent(locale).legalServices.find(s=>s.slug==='corporate-business-services')!;
  expect(item.subServices).toEqual(locale==='ar'?['تأسيس الشركات','حوكمة الشركات','العقود التجارية','الاندماج والاستحواذ','إعادة الهيكلة','المنازعات التجارية']:['Company Formation','Corporate Governance','Commercial Contracts','Mergers & Acquisitions','Corporate Restructuring','Commercial Disputes']);
  expect(item.audience.length).toBeGreaterThan(0); expect(item.steps.length).toBe(3);
  expect(bookingCategoryForPublicService(item.slug,locale)).toBe('corporate-business-services');
  expect(intakeDraftSchema.safeParse({service:item.slug}).success).toBe(true);
 });
});
