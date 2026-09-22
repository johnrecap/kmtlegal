# FIX-08,18,21: conversation drafts and polling

Management PATCH requires the version that started the local draft and applies an atomic
id+updatedAt condition. A lost race returns the existing 409 shape. Only touched fields are
sent; untouched fields synchronize after polls/replies. Conflict preserves input and offers
an explicit latest-data review before retry. API errors remain localized with Request ID.

The shared poller serializes requests, aborts on unmount/hidden/offline, resumes immediately
after outstanding abort settles, uses 5s conversation/30s notification intervals and backs
off to60s after failures. 401/403 stop automatic requests. Notification mutation versions
prevent a late GET from undoing mark-read. Client initial load has retry and independent
initial/refresh/send errors; successful refresh does not erase a failed-send draft/error.

Evidence: conversation-management-conflict, conversation-poll-consistency,
use-safe-polling and notification-mutation-race tests. Real PostgreSQL concurrency and
browser/network acceptance remain open as recorded in `../REPAIR_23_TRACKER.md`.
