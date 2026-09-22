# FIX-01–03: public payment and booking

The payment status token is verified against the requested attempt before database reads
or reservation expiry updates. Missing, mismatched and expired tokens share a no-store 404.
Authorized response fields remain compatible; internal appointment data is not exposed.
Receipts linked to internal meetings fail closed. Invalid status links stop polling and
offer safe login/contact without automatically creating another payment.

Confirmation requires actual unchecked consent. Editing, resuming and failed checkout
clear the UI choice. Free booking and paid-attempt creation write version, exact localized
text and locale to the existing audit log inside the same transaction; createdAt supplies
the server timestamp. No historical consent is synthesized.

AR/EN account setup, return and receipt routes use the existing content catalogs. Legacy
receipt links resolve through the persisted locale. No webhook or schema changes.

Evidence: payment-gateway-contract, consultation-contract, client-account-setup,
booking-assistant-stage and updated booking/isolated-database fixtures. Final combined
results and unexecuted staging/browser gates are recorded in `../REPAIR_23_TRACKER.md`.
