# Member — Support (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/support`
- **Web:** `/support` → `SupportPage.jsx` + `SupportForm` + `TicketThread`
- **Priority:** P1
- **Flow:** F09

---

## Header

- title: **Destek Merkezi**
- subtitle: **Talepleriniz anlık olarak destek ekibine iletilir**

## Ticket status labels (birebir)

| status | label |
|--------|-------|
| open | Bekliyor |
| in-progress | İşleme Alındı |
| closed | Çözüldü |

## Quick actions (ids + category strings)

| id | category (form) | title | desc |
|----|-----------------|-------|------|
| technical | Teknik sorun | Teknik Sorun | Uygulama veya platform hatası bildirin |
| payment | Ödeme | Ödeme & Paket | Fatura, ödeme veya paket sorularınız |
| health | Sağlık bildirimi | Sağlık Bildirimi | Sağlık testi veya programla ilgili bildirim |
| general | Genel soru | Genel Soru | Diğer tüm soru ve talepleriniz için |

## SupportForm fields

| field | rules |
|-------|-------|
| category | one of: `Genel soru`, `Teknik sorun`, `Sağlık bildirimi`, `Ödeme` |
| subject | required — error **Konu gerekli** |
| message | required; min 10 — **Mesaj gerekli** / **En az 10 karakter** |

Success panel:
- title: **Talebiniz alındı**
- body: **Destek ekibimiz en kısa sürede size dönüş yapacak.**

Create toast: **Destek talebiniz alındı. Admin panelinde görünecek.**

## createTicket payload → DB

```js
{
  member_id,
  status: 'open',
  data: {
    subject: ticketData.subject || 'Destek Talebi',
    category: ticketData.category || 'Genel',
    memberName: member.name || 'Ziyaretçi',
    messages: [{ id, from: 'member', text: message, createdAt }],
    createdAt
  }
}
```

## Reply

`sendTicketReply(id, 'member', text)`  
- contact info guard same as chat  
- success toast: **Mesajınız gönderildi**  
- fail: API error or **Mesaj gönderilemedi**
- Talep satırı açılınca message thread gösterilir; admin mesajı varsa açık taleplerde **Yeni yanıt** rozeti.
- Thread üstü: **Canlı sohbet — mesajlar anında iletilir**
- `status === 'closed'` iken reply kapalı; **Bu talep çözüldü olarak kapatıldı.**
- `tickets` realtime değişikliklerinde üyenin liste/thread verisi yenilenir.

## Also on page

FAQ accordion from `site_content`:
- `kind = 'faq'`, `sort ASC`
- item shape: `{ id, q, a }`
- Web’deki sıra ve `q` / `a` copy aynen korunur; hardcode/fallback copy eklenmez.
- Başlık: **Sık Sorulan Sorular**
- Aynı anda tek soru açık; açık soruya yeniden basınca kapanır; display-only.

## Acceptance

- [ ] Categories / status labels exact  
- [ ] Form validation messages exact  
- [ ] Ticket data shape exact  
- [ ] Contact guard on replies  
- [ ] Ticket thread/reply + closed state + realtime refresh
- [ ] FAQ `site_content.sort` order and exact q/a copy
