import { Hono } from 'hono';

const search = new Hono();

// 搜索索引（可以从 KV 或数据库加载）
const searchIndex = [
  // Website 页面
  { id: '1', type: 'page', title: 'Products', description: 'Explore CINAcoin products', url: '/products', category: 'website' },
  { id: '2', type: 'page', title: 'Solutions', description: 'Enterprise solutions', url: '/solutions', category: 'website' },
  { id: '3', type: 'page', title: 'Developers', description: 'Developer resources', url: '/developers', category: 'website' },
  { id: '4', type: 'page', title: 'Pricing', description: 'Pricing plans', url: '/pricing', category: 'website' },
  { id: '5', type: 'page', title: 'About', description: 'About CINAcoin', url: '/about', category: 'website' },
  { id: '6', type: 'page', title: 'Contact', description: 'Contact us', url: '/contact', category: 'website' },
  
  // 文档
  { id: '7', type: 'doc', title: 'Getting Started', description: 'Quick start guide', url: '/docs/getting-started', category: 'docs' },
  { id: '8', type: 'doc', title: 'API Reference', description: 'REST API documentation', url: '/docs/api', category: 'docs' },
  { id: '9', type: 'doc', title: 'SDK Guide', description: 'SDK integration', url: '/docs/sdk', category: 'docs' },
  { id: '10', type: 'doc', title: 'Smart Contracts', description: 'Smart contract development', url: '/docs/contracts', category: 'docs' },
  
  // 产品
  { id: '11', type: 'product', title: 'CINA Wallet', description: 'Multi-chain wallet', url: '/products/wallet', category: 'products' },
  { id: '12', type: 'product', title: 'CINA Cloud', description: 'Cloud infrastructure', url: '/products/cloud', category: 'products' },
  { id: '13', type: 'product', title: 'CINA Swap', description: 'Token swap', url: '/products/swap', category: 'products' },
  { id: '14', type: 'product', title: 'CINA Staking', description: 'Staking platform', url: '/products/staking', category: 'products' },
  
  // 博客
  { id: '15', type: 'blog', title: 'CINAcoin Launch', description: 'Official launch announcement', url: '/blog/launch', category: 'blog' },
  { id: '16', type: 'blog', title: 'Roadmap 2026', description: '2026 development roadmap', url: '/blog/roadmap-2026', category: 'blog' },
];

search.get('/search', async (c) => {
  const query = c.req.query('q')?.toLowerCase() || '';
  const category = c.req.query('category');
  const limit = Number(c.req.query('limit') || 10);
  
  if (!query || query.length < 2) {
    return c.json({ results: [] });
  }
  
  let results = searchIndex.filter(item => {
    const matchesQuery = 
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.url.toLowerCase().includes(query);
    
    const matchesCategory = !category || item.category === category;
    
    return matchesQuery && matchesCategory;
  });
  
  // 按相关性排序（标题匹配优先）
  results.sort((a, b) => {
    const aTitle = a.title.toLowerCase().includes(query) ? 0 : 1;
    const bTitle = b.title.toLowerCase().includes(query) ? 0 : 1;
    return aTitle - bTitle;
  });
  
  return c.json({ 
    results: results.slice(0, limit),
    total: results.length,
    query
  });
});

// 搜索建议
search.get('/search/suggest', async (c) => {
  const query = c.req.query('q')?.toLowerCase() || '';
  
  if (!query || query.length < 2) {
    return c.json({ suggestions: [] });
  }
  
  const suggestions = searchIndex
    .filter(item => item.title.toLowerCase().includes(query))
    .slice(0, 5)
    .map(item => ({
      title: item.title,
      type: item.type,
      url: item.url,
    }));
  
  return c.json({ suggestions });
});

export default search;
