# Brevo Domain API Integration

This document outlines the Brevo API integration for domain authentication setup.

## Environment Variable

### BREVO_API_KEY
- **Required**: Yes
- **Location**: `.env.local` in the `frontend` directory
- **How to get**: 
  1. Log in to Brevo Dashboard
  2. Go to **Settings** → **SMTP & API** → **API Keys**
  3. Create a new API key or use an existing one
  4. Copy the API key value

### Verification
To verify `BREVO_API_KEY` is set, run:
```bash
cd frontend
node -e "require('dotenv').config({ path: '.env.local' }); console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'SET ✓' : 'MISSING ✗');"
```

## API Endpoint

### Verified Implementation
- **Endpoint**: `POST https://api.brevo.com/v3/senders/domains`
- **Authentication**: `api-key: <BREVO_API_KEY>` header
- **Content-Type**: `application/json`

### Request Body
```json
{
  "name": "example.com"
}
```

**Note**: Only the `name` field is required. No notification email is needed as DNS records are returned immediately in the response.

### Response Structure
```json
{
  "id": "641db448a6a7ea326e585e15",
  "domain_name": "mycompany.com",
  "message": "Domain added successfully. To authenticate it, add following DNS records",
  "dns_records": {
    "dkim_record": {
      "type": "TXT",
      "value": "k=rsa;p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDeMVIzrCa3T14JsNY0IRv5/2V1/v2itlviLQBwXsa7shBD6TrBkswsFUToPyMRWC9tbR/5ey0nRBH0ZVxp+lsmTxid2Y2z+FApQ6ra2VsXfbJP3HE6wAO0YTVEJt1TmeczhEd2Jiz/fcabIISgXEdSpTYJhb0ct0VJRxcg4c8c7wIDAQAB",
      "host_name": "mail._domainkey.",
      "status": false
    },
    "brevo_code": {
      "type": "TXT",
      "value": "brevo-code:4bc1566441c4131069853d135c5905ab",
      "host_name": "",
      "status": false
    }
  }
}
```

## Important Notes

⚠️ **The exact endpoint and response structure need to be verified with Brevo's official API documentation.**

### To Verify:
1. Check Brevo's API documentation at: https://developers.brevo.com/
2. Look for "Domain Authentication" or "Senders & Domains" API section
3. Verify:
   - The correct endpoint URL
   - Request body field names (may be `domain`, `notificationEmail`, etc.)
   - Response structure (how domain ID and DNS records are returned)

### Common Issues:

1. **401 Unauthorized**
   - Check that `BREVO_API_KEY` is correct
   - Verify the API key has permissions for domain management

2. **400 Bad Request**
   - Verify domain format is correct
   - Check notification email format
   - Ensure domain is not already added

3. **Endpoint Not Found (404)**
   - Try alternative endpoint: `https://api.brevo.com/v3/domains`
   - Check Brevo API version (may need `/v2` instead of `/v3`)

## Testing

To test the domain setup:
1. Ensure `BREVO_API_KEY` is set in `.env.local`
2. Use the domain setup form in the Prevention page (Step 2)
3. Check server logs for detailed error messages
4. Verify DNS records are sent to the notification email

## Current Code Location

- **API Route**: `frontend/app/api/companies/[companyId]/verification/domain/route.ts`
- **Frontend Form**: `frontend/app/dashboard/company/prevention/page.tsx` (Step 2)
- **Service**: `backend/services/verification.service.ts`

## Next Steps

1. ✅ Verify `BREVO_API_KEY` is set in environment variables
2. ⚠️ Check Brevo API documentation for correct endpoint
3. ⚠️ Test with a real domain to verify request/response structure
4. ⚠️ Update code if endpoint or field names differ from current implementation
