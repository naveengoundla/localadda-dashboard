import { useEffect, useRef, useState } from 'react';
import { getMyStore, updateBanner, addGalleryPhoto, getBannerPresign, getGalleryPresign } from '../api/store';
import type { Store } from '../types';
import axios from 'axios';
import { compressImage } from '../lib/compressImage';

export default function PhotosPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState<'banner' | 'gallery' | null>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMyStore().then(r => setStore(r.data));
  }, []);

  async function uploadFile(file: File, type: 'banner' | 'gallery') {
    setUploading(type); setMsg('');
    try {
      // 1. Compress client-side (max 1600px, JPEG) so phone photos don't land in R2 raw
      const { blob, ext, contentType } = await compressImage(file, 1600);

      // 2. Get presigned URL
      const presignRes = type === 'banner'
        ? await getBannerPresign(ext)
        : await getGalleryPresign(ext);
      const { uploadUrl, publicUrl } = presignRes.data;

      // 3. Upload directly to R2
      await axios.put(uploadUrl, blob, {
        headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000' },
      });

      // 4. Save URL to store
      if (type === 'banner') {
        const res = await updateBanner(publicUrl);
        setStore(res.data);
        setMsg('✅ Banner uploaded! Store page updating…');
      } else {
        const res = await addGalleryPhoto(publicUrl);
        setStore(res.data);
        setMsg('✅ Photo added to gallery!');
      }
    } catch (err: any) {
      setMsg('❌ Upload failed. Try again.');
    } finally {
      setUploading(null);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'gallery') {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, type);
    e.target.value = '';
  }

  if (!store) return <div className="page-pad" style={{ padding: 32 }}><p style={{ color: '#999' }}>Loading…</p></div>;

  return (
    <div className="page-pad" style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>📸 Photos</h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>Banner appears at the top of your store page. Gallery shows below your products.</p>

      {msg && <p style={{ fontSize: 13, color: msg.startsWith('✅') ? '#27ae60' : '#e8401c', marginBottom: 16 }}>{msg}</p>}

      {/* Banner */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Store Banner</div>
        {store.bannerUrl ? (
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <img src={store.bannerUrl} alt="Banner" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }} />
          </div>
        ) : (
          <div style={{ height: 160, background: '#f5f5f7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '2px dashed #ddd' }}>
            <span style={{ color: '#999', fontSize: 14 }}>No banner uploaded yet</span>
          </div>
        )}
        <input ref={bannerRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => handleFileChange(e, 'banner')} />
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => bannerRef.current?.click()} disabled={uploading === 'banner'}>
          {uploading === 'banner' ? 'Uploading…' : store.bannerUrl ? '🔄 Change Banner' : '📤 Upload Banner'}
        </button>
        <span style={{ fontSize: 12, color: '#999', marginLeft: 12 }}>JPG, PNG or WebP · Max 5MB</span>
      </div>

      {/* Gallery */}
      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Gallery Photos ({store.galleryUrls?.length || 0})</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          {store.galleryUrls?.map((url, i) => (
            <img key={i} src={url} alt={`Gallery ${i + 1}`} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10 }} />
          ))}
          <div
            style={{ height: 120, background: '#f5f5f7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ddd', cursor: 'pointer', color: '#999', fontSize: 13, flexDirection: 'column', gap: 6 }}
            onClick={() => galleryRef.current?.click()}
          >
            <span style={{ fontSize: 28 }}>+</span>
            <span>Add Photo</span>
          </div>
        </div>
        <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => handleFileChange(e, 'gallery')} />
        <button className="btn-secondary" onClick={() => galleryRef.current?.click()} disabled={uploading === 'gallery'}>
          {uploading === 'gallery' ? 'Uploading…' : '📤 Add Gallery Photo'}
        </button>
      </div>
    </div>
  );
}
