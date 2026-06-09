import { chromium } from 'playwright';

console.log('=== CinaCoin 端到端测试 ===\n');

// Test 1: Auth Service API
console.log('1️⃣ 测试 Auth Service API');
const authUrl = 'https://auth.cinacoin.com';

// Test health
try {
  const healthRes = await fetch(`${authUrl}/health`);
  const health = await healthRes.json();
  console.log(`   ✅ Health check: ${health.status}`);
} catch (err) {
  console.log(`   ❌ Health check failed: ${err.message}`);
}

// Test register
const testEmail = `test${Date.now()}@cinacoin.com`;
const testPassword = 'Test123!@#';
let userId = null;
let accessToken = null;
let refreshToken = null;

try {
  const registerRes = await fetch(`${authUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      username: `testuser${Date.now()}`
    })
  });
  
  if (registerRes.ok) {
    const registerData = await registerRes.json();
    userId = registerData.user?.id;
    accessToken = registerData.accessToken;
    refreshToken = registerData.refreshToken;
    console.log(`   ✅ Register: Success (user: ${testEmail})`);
  } else {
    const err = await registerRes.text();
    console.log(`   ❌ Register failed: ${registerRes.status} - ${err.slice(0, 100)}`);
  }
} catch (err) {
  console.log(`   ❌ Register error: ${err.message}`);
}

// Test login
try {
  const loginRes = await fetch(`${authUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword
    })
  });
  
  if (loginRes.ok) {
    const loginData = await loginRes.json();
    accessToken = loginData.accessToken;
    refreshToken = loginData.refreshToken;
    console.log(`   ✅ Login: Success`);
  } else {
    const err = await loginRes.text();
    console.log(`   ❌ Login failed: ${loginRes.status} - ${err.slice(0, 100)}`);
  }
} catch (err) {
  console.log(`   ❌ Login error: ${err.message}`);
}

// Test /auth/me
if (accessToken) {
  try {
    const meRes = await fetch(`${authUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (meRes.ok) {
      const meData = await meRes.json();
      console.log(`   ✅ /auth/me: Success (user: ${meData.email})`);
    } else {
      console.log(`   ❌ /auth/me failed: ${meRes.status}`);
    }
  } catch (err) {
    console.log(`   ❌ /auth/me error: ${err.message}`);
  }
}

// Test token refresh
if (refreshToken) {
  try {
    const refreshRes = await fetch(`${authUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();
      console.log(`   ✅ Token refresh: Success`);
    } else {
      console.log(`   ❌ Token refresh failed: ${refreshRes.status}`);
    }
  } catch (err) {
    console.log(`   ❌ Token refresh error: ${err.message}`);
  }
}

console.log('\n2️⃣ 测试 Website 页面可访问性');
const websitePages = [
  { name: 'Home', url: 'https://cinacoin.com' },
  { name: 'Login', url: 'https://cinacoin.com/login' },
  { name: 'Register', url: 'https://cinacoin.com/register' },
  { name: 'Pricing', url: 'https://cinacoin.com/pricing' },
  { name: 'About', url: 'https://cinacoin.com/about' },
];

for (const page of websitePages) {
  try {
    const res = await fetch(page.url, { redirect: 'follow' });
    if (res.ok) {
      console.log(`   ✅ ${page.name}: ${res.status}`);
    } else {
      console.log(`   ❌ ${page.name}: ${res.status}`);
    }
  } catch (err) {
    console.log(`   ❌ ${page.name}: ${err.message}`);
  }
}

console.log('\n3️⃣ 测试 Cloud Dashboard 页面可访问性');
const cloudPages = [
  { name: 'Login', url: 'https://cloud.cinacoin.com/login' },
  { name: 'Register', url: 'https://cloud.cinacoin.com/register' },
];

for (const page of cloudPages) {
  try {
    const res = await fetch(page.url, { redirect: 'follow' });
    if (res.ok) {
      console.log(`   ✅ ${page.name}: ${res.status}`);
    } else {
      console.log(`   ❌ ${page.name}: ${res.status}`);
    }
  } catch (err) {
    console.log(`   ❌ ${page.name}: ${err.message}`);
  }
}

console.log('\n4️⃣ 测试 Backend Dashboard 页面可访问性');
try {
  const res = await fetch('https://backend.cinacoin.com/login', { redirect: 'follow' });
  if (res.ok) {
    console.log(`   ✅ Login: ${res.status}`);
  } else {
    console.log(`   ❌ Login: ${res.status}`);
  }
} catch (err) {
  console.log(`   ❌ Login: ${err.message}`);
}

console.log('\n5️⃣ 测试 API Gateway');
const apiEndpoints = [
  { name: 'Health', url: 'https://api.cinacoin.com/health' },
  { name: 'Users (auth required)', url: 'https://api.cinacoin.com/users/me', auth: true },
];

for (const endpoint of apiEndpoints) {
  try {
    const headers = endpoint.auth && accessToken 
      ? { 'Authorization': `Bearer ${accessToken}` }
      : {};
    const res = await fetch(endpoint.url, { headers });
    
    if (endpoint.auth) {
      if (res.status === 200) {
        console.log(`   ✅ ${endpoint.name}: ${res.status} (authenticated)`);
      } else if (res.status === 401) {
        console.log(`   ⚠️  ${endpoint.name}: ${res.status} (expected - auth required)`);
      } else {
        console.log(`   ❌ ${endpoint.name}: ${res.status}`);
      }
    } else {
      if (res.ok) {
        console.log(`   ✅ ${endpoint.name}: ${res.status}`);
      } else {
        console.log(`   ❌ ${endpoint.name}: ${res.status}`);
      }
    }
  } catch (err) {
    console.log(`   ❌ ${endpoint.name}: ${err.message}`);
  }
}

console.log('\n=== 测试完成 ===');
