# Backend Patch: WhatsApp Template Creation + Status Sync (Meta Aligned)

This frontend workspace does not include backend source files, so apply these changes in your backend repo.

## 1) Persist Meta fields on template model

Add these fields to your template schema/model:

- `metaTemplateId: string` (Meta template id)
- `status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'paused' | 'disabled' | 'appeal_requested' | 'unknown'`
- `statusReason?: string`
- `qualityScore?: string`
- `language?: string` (example: `en_US`)
- `parameterFormat?: 'named' | 'positional'`
- `lastStatusCheck?: Date`

## 2) Normalize Meta status values

Use one function across create/check/webhook handlers:

```ts
function normalizeMetaTemplateStatus(raw?: string):
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'paused'
  | 'disabled'
  | 'appeal_requested'
  | 'unknown' {
  if (!raw) return 'unknown';
  const s = raw.trim().toLowerCase();

  if (s === 'approved' || s.includes('active')) return 'approved';
  if (s === 'in_review' || s === 'in-review' || s === 'pending') return 'in_review';
  if (s === 'rejected') return 'rejected';
  if (s === 'paused') return 'paused';
  if (s === 'disabled') return 'disabled';
  if (s === 'appeal_requested' || s === 'appeal requested') return 'appeal_requested';

  return 'unknown';
}
```

## 3) Template creation endpoint: align with Meta docs

Meta template create endpoint:

- `POST /{WABA_ID}/message_templates`
- required core fields: `name`, `category`, `language`, `components`
- optional: `parameter_format` (`named` or `positional`)

In your create API, accept and validate:

```json
{
  "name": "menu_update",
  "category": "utility",
  "language": "en_US",
  "parameterFormat": "named",
  "body": "Hi {{customer_name}}, here is our menu: {{menu_link}}"
}
```

Server should construct Meta payload similar to:

```ts
const metaPayload = {
  name,
  category: category === 'custom' ? 'utility' : category,
  language: language || 'en_US',
  parameter_format: parameterFormat || 'named',
  components: [
    {
      type: 'BODY',
      text: body,
      example: {
        body_text_named_params: [
          { param_name: 'customer_name', example: 'Rahul' },
          { param_name: 'menu_link', example: 'https://example.com/menu' }
        ]
      }
    }
  ]
};
```

Save response:

- `metaTemplateId` from Meta response id
- `status` from normalized Meta status
- `language`, `parameterFormat`

## 4) Status check endpoint (`/templates/:id/check-status`)

Use Graph API:

- `GET /{META_TEMPLATE_ID}?fields=status,quality_score,name,language`

Update local template with:

- normalized status
- quality score
- status reason if present
- lastStatusCheck timestamp

## 5) Webhook: message_template_status_update

Subscribe webhook field in Meta App:

- `message_template_status_update`

When event arrives:

1. parse template id from webhook payload
2. find local template by `metaTemplateId`
3. normalize status and update `status`, `qualityScore`, `statusReason`, `lastStatusCheck`
4. return 200 quickly

Also handle unknown payload shape safely with logs.

## 6) Business rules to enforce

- Only `approved` templates are sendable in automations.
- `paused` and `disabled` must be treated as not sendable.
- Never allow manual status override from frontend.

## 7) Suggested response shape to frontend

Return this shape consistently from create/get/check:

```json
{
  "template": {
    "_id": "...",
    "name": "...",
    "category": "utility",
    "status": "approved",
    "qualityScore": "green",
    "metaTemplateId": "123456789",
    "language": "en_US",
    "parameterFormat": "named",
    "lastStatusCheck": "2026-03-20T10:22:44.000Z"
  }
}
```

## 8) Why this patch

Meta docs say template statuses can evolve after approval based on quality feedback and are pushed via `message_template_status_update` webhooks. Relying only on create-time status causes drift.
