import { useEffect, useState } from 'react';
import { getMyStore, listInvites, createInvite } from '../api/store';
import type { Store, OwnerInvite } from '../types';
import { generateInviteCard } from '../lib/inviteCard';

const PUBLIC_BASE = import.meta.env.VITE_PUBLIC_URL || 'https://localadda-public-production.up.railway.app';

export default function InvitePage() {
  const [store, setStore] = useState<Store | null>(null);
  const [invites, setInvites] = useState<OwnerInvite[]>([]);
  const [quota, setQuota] = useState({ quota: 0, used: 0, remaining: 0 });
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyStore(), listInvites()])
      .then(([s, inv]) => {
        setStore(s.data);
        setInvites(inv.data.invites);
        setQuota({ quota: inv.data.quota, used: inv.data.used, remaining: inv.data.remaining });
      })
      .catch(() => setMsg('Could not load invites.'))
      .finally(() => setLoading(false));
  }, []);

  const storeUrl = store
    ? `${PUBLIC_BASE}/${store.city.slug}/${store.category.slug}/${store.slug}`
    : '';

  function buildWaLink(toPhone: string, code: string) {
    const text = [
      `Hi! 👋 *${store?.name}* is now on preorder.`,
      `Pick your items online and we'll keep them ready — no queue.`,
      ``,
      `🎟️ Your invite code: *${code}*`,
      `🛒 Order here: ${storeUrl}`,
      `💵 Pay cash on pickup or delivery.`,
    ].join('\n');
    const wa = toPhone.replace(/\D/g, '').replace(/^(?!91)/, '91');
    return `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
  }

  async function handleSend() {
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 10) { setMsg('⚠️ Enter a valid 10-digit number.'); return; }
    setBusy(true); setMsg('');
    try {
      const { data } = await createInvite(clean);
      // Open WhatsApp with the prefilled invite from the owner's own number
      window.open(buildWaLink(clean, data.code), '_blank');
      setQuota({ quota: data.quota, used: data.used, remaining: data.remaining });
      setInvites((prev) => [
        { code: data.code, phone: clean, redeemed: false, createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setPhone('');
      setMsg('✅ WhatsApp opened — tap send to deliver the invite.');
    } catch (e: any) {
      setMsg('❌ ' + (e?.response?.data?.error || 'Could not create invite.'));
    } finally {
      setBusy(false);
    }
  }

  function resend(inv: OwnerInvite) {
    if (!inv.phone) return;
    window.open(buildWaLink(inv.phone, inv.code), '_blank');
  }

  async function shareCard(code: string) {
    if (!store) return;
    setMsg('');
    try {
      const blob = await generateInviteCard({
        storeName: store.name,
        locality: `${store.category.name} · ${store.city.name}`,
        code,
        url: storeUrl,
      });
      const file = new File([blob], `localadda-invite-${code}.png`, { type: 'image/png' });
      const caption = `Your preorder invite for ${store.name} — code ${code}. Open: ${storeUrl}`;

      // Mobile: native share sheet attaches the image; owner picks the WhatsApp contact
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: caption });
        setMsg('✅ Shared — pick the customer in WhatsApp and send.');
      } else {
        // Desktop fallback: download the card + open WhatsApp chat with a text caption
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(a.href);
        setMsg('✅ Card downloaded — attach it in WhatsApp to send.');
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return; // user dismissed the share sheet
      setMsg('❌ Could not generate the card.');
    }
  }

  async function sendNewCard() {
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 10) { setMsg('⚠️ Enter a valid 10-digit number.'); return; }
    setBusy(true); setMsg('');
    try {
      const { data } = await createInvite(clean);
      setQuota({ quota: data.quota, used: data.used, remaining: data.remaining });
      setInvites((prev) => [
        { code: data.code, phone: clean, redeemed: false, createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setPhone('');
      await shareCard(data.code);
    } catch (e: any) {
      setMsg('❌ ' + (e?.response?.data?.error || 'Could not create invite.'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div style={{ padding: 32 }}><p style={{ color: '#999' }}>Loading…</p></div>;

  const notEnabled = !store?.orderingEnabled || quota.quota === 0;

  return (
    <div className="page-pad" style={{ padding: 32, maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>🎟️ Invite customers</h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>
        Send your customers a preorder invite straight from your WhatsApp. They tap your code, pick items, and you get the order on WhatsApp.
      </p>

      {msg && (
        <p style={{ fontSize: 13, marginBottom: 16, color: msg.startsWith('✅') ? '#27ae60' : '#e8401c' }}>{msg}</p>
      )}

      {notEnabled ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Preorder isn't enabled yet</div>
          <p style={{ color: '#888', fontSize: 14 }}>
            Preorder invites are part of the LocalAdda pilot. Contact LocalAdda to switch it on for your store.
          </p>
        </div>
      ) : (
        <>
          {/* Quota */}
          <div className="card" style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            {[
              { label: 'Invites left', value: quota.remaining, color: '#27ae60' },
              { label: 'Sent', value: quota.used, color: '#1a1a2e' },
              { label: 'Total quota', value: quota.quota, color: '#888' },
            ].map((s) => (
              <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#999', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Send form */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Send a new invite</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Customer's 10-digit mobile"
                inputMode="numeric"
                maxLength={10}
                style={{ flex: 1, minWidth: 180, padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 15 }}
              />
              <button
                onClick={handleSend}
                disabled={busy || quota.remaining <= 0}
                style={{
                  padding: '11px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: quota.remaining <= 0 ? '#ccc' : 'linear-gradient(135deg,#1db954,#17a44b)',
                  color: '#fff', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap',
                }}
              >
                {busy ? '…' : '💬 Send text'}
              </button>
              <button
                onClick={sendNewCard}
                disabled={busy || quota.remaining <= 0}
                style={{
                  padding: '11px 18px', borderRadius: 10, cursor: 'pointer',
                  background: '#fff', border: '1.5px solid #17a44b',
                  color: '#17a44b', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap',
                  opacity: quota.remaining <= 0 ? 0.5 : 1,
                }}
              >
                🖼️ Send card
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
              Text is one-tap. Card sends the branded image with a QR — on phones it opens your share sheet, on desktop it downloads to attach.
            </p>
            {quota.remaining <= 0 && (
              <p style={{ fontSize: 12.5, color: '#e8401c', marginTop: 10 }}>
                You've used all {quota.quota} invites. Contact LocalAdda to add more.
              </p>
            )}
          </div>

          {/* Sent list */}
          <div className="card">
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>
              Sent invites {invites.length > 0 && <span style={{ color: '#aaa', fontWeight: 600 }}>({invites.length})</span>}
            </div>
            {invites.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 14 }}>No invites sent yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {invites.map((inv) => (
                  <div key={inv.code} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 10, background: '#faf9f6', border: '1px solid #efedea',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#1a1a2e', fontFamily: 'monospace' }}>{inv.code}</div>
                      <div style={{ fontSize: 12.5, color: '#999' }}>{inv.phone ? `+91 ${inv.phone}` : '—'}</div>
                    </div>
                    {inv.redeemed ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#27ae60', background: '#e9f9ef', padding: '4px 10px', borderRadius: 20 }}>✓ Joined</span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#e8901c', background: '#fff4e5', padding: '4px 10px', borderRadius: 20 }}>Pending</span>
                    )}
                    <button onClick={() => shareCard(inv.code)}
                      style={{ fontSize: 12.5, fontWeight: 700, color: '#17a44b', background: 'none', border: 'none', cursor: 'pointer' }}>
                      🖼️ Card
                    </button>
                    {!inv.redeemed && inv.phone && (
                      <button onClick={() => resend(inv)}
                        style={{ fontSize: 12.5, fontWeight: 700, color: '#1db954', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Resend
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
