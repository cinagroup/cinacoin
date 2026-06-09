console.log('=== CinaCoin 端到端测试（使用已存在账号）===\n');

const authUrl = 'https://auth.cinacoin.com';
// 使用之前测试创建的账号
const testEmail = 'test11@cinacoin.com';
const testPassword = 'Test123!@#';

let accessToken = null;
let refreshToken = null;

// 1. Login with existing account
console.log('1️⃣ 登录已存在账号');
try {
  const res = await fetch(`${authUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword
    })
  });
  
  const data = await res.json();
  if (res.ok) {
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
    console.log(`   ✅ 登录成功`);
    console.log(`   - Access Token: ${accessToken ? '✓' : '✗'}`);
    console.log(`   - Refresh Token: ${refreshToken ? '✓' : '✗'}`);
    console.log(`   - Expires In: ${data.expiresIn}s`);
  } else {
    console.log(`   ❌ 登录失败: ${JSON.stringify(data)}`);
  }
} catch (err) {
  console.log(`   ❌ Error: ${err.message}`);
}

// 2. Get User Info
console.log('\n2️⃣ 获取用户信息 (/auth/me)');
if (accessToken) {
  try {
    const res = await fetch(`${authUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const data = await res.json();
    if (res.ok) {
      console.log(`   ✅ 获取成功`);
      console.log(`   - Email: ${data.email}`);
      console.log(`   - Username: ${data.username}`);
      console.log(`   - User ID: ${data.id}`);
      console.log(`   - Status: ${data.status}`);
    } else {
      console.log(`   ❌ 获取失败: ${res.status} - ${JSON.stringify(data)}`);
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
}

// 3. Token Refresh
console.log('\n3️⃣ Token 刷新');
if (refreshToken) {
  try {
    const res = await fetch(`${authUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    const data = await res.json();
    if (res.ok) {
      console.log(`   ✅ 刷新成功`);
      console.log(`   - New Access Token: ${data.accessToken ? '✓' : '✗'}`);
      console.log(`   - New Refresh Token: ${data.refreshToken ? '✓' : '✗'}`);
      accessToken = data.accessToken;
    } else {
      console.log(`   ❌ 刷新失败: ${res.status} - ${JSON.stringify(data)}`);
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
}

// 4. Use new token
console.log('\n4️⃣ 使用新 Token 获取用户信息');
if (accessToken) {
  try {
    const res = await fetch(`${authUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log(`   ✅ 新 Token 有效`);
      console.log(`   - User: ${data.email}`);
    } else {
      console.log(`   ❌ 新 Token 无效: ${res.status}`);
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
}

// 5. API Gateway with Auth
console.log('\n5️⃣ API Gateway 认证测试');
if (accessToken) {
  try {
    const res = await fetch('https://api.cinacoin.com/users/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log(`   ✅ /users/me: ${res.status}`);
      console.log(`   - Response: ${JSON.stringify(data).slice(0, 100)}`);
    } else {
      const text = await res.text();
      console.log(`   ⚠️  /users/me: ${res.status}`);
      console.log(`   - Response: ${text.slice(0, 100)}`);
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
}

// 6. Test invalid credentials
console.log('\n6️⃣ 测试无效凭证');
try {
  const res = await fetch(`${authUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'invalid@example.com',
      password: 'wrongpassword'
    })
  });
  
  if (res.status === 401) {
    console.log(`   ✅ 正确拒绝无效凭证 (401)`);
  } else {
    console.log(`   ⚠️  意外状态码: ${res.status}`);
  }
} catch (err) {
  console.log(`   ❌ Error: ${err.message}`);
}

// 7. Test expired token
console.log('\n7️⃣ 测试过期 Token');
try {
  const fakeToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxNjAwMDAwMDAwfQ.fake';
  const res = await fetch(`${authUrl}/auth/me`, {
    headers: { 'Authorization': `Bearer ${fakeToken}` }
  });
  
  if (res.status === 401) {
    console.log(`   ✅ 正确拒绝过期 Token (401)`);
  } else {
    console.log(`   ⚠️  意外状态码: ${res.status}`);
  }
} catch (err) {
  console.log(`   ❌ Error: ${err.message}`);
}

console.log('\n=== 测试完成 ===');
