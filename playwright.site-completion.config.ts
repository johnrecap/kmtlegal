import {defineConfig} from '@playwright/test';
/** Requires the isolated fixture server and an app using that fixture database. */
export default defineConfig({
 testDir:'./tests/e2e',testMatch:'site-completion.spec.ts',workers:1,
 expect:{timeout:20000},
 use:{baseURL:process.env.SITE_COMPLETION_BASE_URL??'http://127.0.0.1:3128',headless:true,channel:'chrome',trace:'retain-on-failure',screenshot:'only-on-failure'},
 reporter:[['line'],['json',{outputFile:'docs/reviews/2026-10-11/site-completion/browser-final.json'}]],
 outputDir:'.playwright/site-completion/final-results'
});
