export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0b0d', color: '#e4e4e7', fontFamily: 'system-ui, sans-serif', padding: '24px' }}>
      <div style={{ maxWidth: '420px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 8px' }}>Page not found</h1>
        <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 20px' }}>
          The page you are looking for does not exist.
        </p>
        <a href="/" style={{ background: '#0A84FF', color: '#fff', borderRadius: '10px', padding: '9px 16px', fontSize: '14px', textDecoration: 'none' }}>
          Go to WaveDesk
        </a>
      </div>
    </div>
  );
}
