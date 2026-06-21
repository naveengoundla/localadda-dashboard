import QRCode from 'qrcode';

export interface CardOpts {
  storeName: string;
  locality: string;
  code: string;
  url: string;
}

const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  // Fallback for Safari < 16
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number): number {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      line = w;
      cy += lh;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy + lh;
}

/** Render a branded, per-customer preorder invite card as a PNG blob. */
export async function generateInviteCard(opts: CardOpts): Promise<Blob> {
  const W = 800;
  const H = 1060;
  const PAD = 56;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Card background
  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#ece7dc';
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, W - 2, H - 2, 28);
  ctx.stroke();

  // ── Top band ──
  ctx.fillStyle = '#15321f';
  roundRect(ctx, 0, 0, W, 180, 0);
  ctx.fill();
  ctx.fillRect(0, 28, W, 152); // square off the bottom of the band

  // Store initial badge
  ctx.fillStyle = '#1f7a47';
  ctx.beginPath();
  ctx.arc(PAD + 38, 90, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#eafff2';
  ctx.font = `600 38px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((opts.storeName[0] || 'S').toUpperCase(), PAD + 38, 92);

  // Store name + locality
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 33px ${SANS}`;
  ctx.fillText(truncate(ctx, opts.storeName, W - PAD * 2 - 100), PAD + 96, 82);
  ctx.fillStyle = '#9cc7ad';
  ctx.font = `400 21px ${SANS}`;
  ctx.fillText(truncate(ctx, opts.locality, W - PAD * 2 - 100), PAD + 96, 116);

  let y = 232;

  // Early-access pill
  ctx.font = `600 19px ${SANS}`;
  const pillTxt = 'EARLY ACCESS';
  const pillW = ctx.measureText(pillTxt).width + 32;
  ctx.fillStyle = '#d8f3e2';
  roundRect(ctx, PAD, y - 22, pillW, 34, 17);
  ctx.fill();
  ctx.fillStyle = '#15321f';
  ctx.fillText(pillTxt, PAD + 16, y + 2);
  y += 56;

  // Headline
  ctx.fillStyle = '#1d1d18';
  ctx.font = `600 38px ${SANS}`;
  y = wrap(ctx, 'Skip the queue — preorder from us', PAD, y, W - PAD * 2, 46);
  y += 4;

  // Subline
  ctx.fillStyle = '#6f6a5f';
  ctx.font = `400 23px ${SANS}`;
  y = wrap(ctx, "Pick your items online and we'll keep them ready.", PAD, y, W - PAD * 2, 32);
  y += 18;

  // Coupon box
  const couponH = 116;
  ctx.fillStyle = '#f1fbf4';
  roundRect(ctx, PAD, y, W - PAD * 2, couponH, 16);
  ctx.fill();
  ctx.strokeStyle = '#1f7a47';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([11, 8]);
  roundRect(ctx, PAD, y, W - PAD * 2, couponH, 16);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1f7a47';
  ctx.font = `600 18px ${SANS}`;
  ctx.fillText('YOUR INVITE CODE', W / 2, y + 38);
  ctx.fillStyle = '#15321f';
  ctx.font = `600 42px ${MONO}`;
  ctx.fillText(opts.code, W / 2, y + 88);
  ctx.textAlign = 'left';
  y += couponH + 40;

  // Steps
  const steps = ['Scan the code below to open our store', 'Tap “Start Preorder” and pick items', 'Enter this code to confirm'];
  ctx.font = `400 23px ${SANS}`;
  for (let i = 0; i < steps.length; i++) {
    const sy = y + i * 46;
    ctx.fillStyle = '#15321f';
    ctx.beginPath();
    ctx.arc(PAD + 16, sy - 8, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `600 18px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), PAD + 16, sy - 1);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4a463d';
    ctx.font = `400 23px ${SANS}`;
    ctx.fillText(steps[i], PAD + 48, sy);
  }
  y += steps.length * 46 + 18;

  // QR + side text
  const qrSize = 168;
  const qrDataUrl = await QRCode.toDataURL(opts.url, {
    margin: 1,
    width: qrSize * 2,
    color: { dark: '#15321f', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
  const qrImg = await loadImage(qrDataUrl);
  // QR frame
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ece7dc';
  ctx.lineWidth = 2;
  roundRect(ctx, PAD, y, qrSize + 20, qrSize + 20, 12);
  ctx.fill();
  ctx.stroke();
  ctx.drawImage(qrImg, PAD + 10, y + 10, qrSize, qrSize);

  const tx = PAD + qrSize + 44;
  ctx.fillStyle = '#1d1d18';
  ctx.font = `600 23px ${SANS}`;
  ctx.fillText('Scan to open our store', tx, y + 46);
  ctx.fillStyle = '#6f6a5f';
  ctx.font = `400 21px ${SANS}`;
  wrap(ctx, '💵 Pay cash on pickup or delivery', tx, y + 84, W - tx - PAD, 30);

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#b0aa9c';
  ctx.font = `400 19px ${SANS}`;
  ctx.fillText('Preorders powered by LocalAdda', W / 2, H - 34);
  ctx.textAlign = 'left';

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
