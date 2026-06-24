// middleware.js
export const config = {
  matcher: ['/studio/:path*'], // Lindungi semua file di folder /studio
};

export default function middleware(request) {
  const url = new URL(request.url);
  // Ambil password dari environment variable (lebih aman)
  const password = process.env.ADMIN_PASSWORD || 'rahasia123';

  // Cek cookie
  const cookieAuth = request.cookies.get('auth')?.value;
  if (cookieAuth === password) {
    return NextResponse.next();
  }

  // Cek parameter ?auth=... (digunakan saat login)
  const queryAuth = url.searchParams.get('auth');
  if (queryAuth === password) {
    const response = NextResponse.next();
    // Set cookie, berlaku 1 hari
    response.cookies.set('auth', password, {
      httpOnly: true,
      secure: true,
      maxAge: 86400,
      path: '/',
    });
    return response;
  }

  // Jika belum login, tampilkan form login
  return new Response(
    `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>🔒 Rujak.Co Studio</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: #0F4D37;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          padding: 20px;
        }
        .box {
          background: white;
          padding: 40px 32px;
          border-radius: 20px;
          max-width: 400px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .logo { font-size: 48px; margin-bottom: 8px; }
        h2 { color: #0F4D37; font-size: 24px; margin-bottom: 6px; }
        p { color: #6B7280; font-size: 14px; margin-bottom: 24px; }
        form { display: flex; flex-direction: column; gap: 12px; }
        input {
          padding: 14px 16px;
          border: 1.5px solid #E5E7EB;
          border-radius: 12px;
          font-size: 16px;
          outline: none;
          transition: 0.2s;
        }
        input:focus {
          border-color: #0F4D37;
          box-shadow: 0 0 0 3px rgba(15,77,55,0.1);
        }
        button {
          background: #0F4D37;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }
        button:hover { background: #0a3a2a; }
        .err {
          color: #D62828;
          font-size: 13px;
          margin-top: 8px;
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <div class="logo">🥭</div>
        <h2>Rujak.Co Studio</h2>
        <p>Masukkan password untuk mengakses generator konten.</p>
        <form method="GET" action="">
          <input type="password" name="auth" placeholder="Masukkan password" autofocus required />
          <button type="submit">🔓 Akses Studio</button>
        </form>
        <div class="err" id="errMsg">Password salah, coba lagi!</div>
      </div>
      <script>
        const params = new URLSearchParams(window.location.search);
        if (params.get('auth') && params.get('auth') !== '${password}') {
          document.getElementById('errMsg').style.display = 'block';
        }
      </script>
    </body>
    </html>`,
    {
      status: 401,
      headers: { 'Content-Type': 'text/html' },
    }
  );
}