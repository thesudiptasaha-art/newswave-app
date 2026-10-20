'use client';

export default function Error({ error, reset }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0b0d', color: '#e4e4e7', fontFamily: 'system-ui, sans-serif', padding: '24px' }}>
      <div style={{ maxWidth: '420px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 8px' }}>Something went wrong</h1>
        <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 20px' }}>
          The page ran into an unexpected problem. Anything you already saved is safe.
        </p>
        <button
          onClick={() => reset()}
          style={{ background: '#0A84FF', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '14px', cursor: 'pointer', marginRight: '8px' }}
        >
          Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{ background: 'transparent', color: '#e4e4e7', border: '1px solid #3f3f46', borderRadius: '10px', padding: '9px 16px', fontSize: '14px', cursor: 'pointer' }}
        >
          Reload page
        </button>
      </div>
    </div>
  );
}
