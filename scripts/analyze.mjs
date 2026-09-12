import fs from 'node:fs/promises';

const base = process.env.IVY_API_BASE_URL || 'https://solve.ivy.homes';
const key = process.env.IVY_API_KEY;
const email = process.env.IVY_DEMO_EMAIL || 'demo1@ivy.homes';
const password = process.env.IVY_DEMO_PASSWORD;
if (!key || !password) throw new Error('Set IVY_API_KEY and IVY_DEMO_PASSWORD before running analysis.');

const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'X-API-Key': key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then(r => r.json());
if (!login.access_token) throw new Error(JSON.stringify(login));
const headers = { 'X-API-Key': key, Authorization: `Bearer ${login.access_token}` };

async function get(path) { const response = await fetch(`${base}${path}`, { headers }); if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`); return response.json(); }
async function all(name) {
  const rows = []; let offset = 0;
  while (true) {
    const page = await get(`/v1/${name}?limit=100&offset=${offset}`);
    rows.push(...page.results); console.log(`${name}: ${rows.length} retrieved (reported total: ${page.total})`);
    if (!page.has_more) return rows;
    offset += page.count;
  }
}
const listings = await all('listings');
const rentals = await all('rentals');
const projects = await all('projects');
await fs.mkdir('data', { recursive: true });
await Promise.all([['listings', listings], ['rentals', rentals], ['projects', projects]].map(([name, data]) => fs.writeFile(`data/${name}.json`, JSON.stringify(data, null, 2))));

const group = (rows, fn) => Object.values(Object.groupBy(rows, fn)).filter(x => x.length > 1);
const summary = {
  listings: listings.length, rentals: rentals.length, projects: projects.length,
  live: listings.filter(x => x.is_live).length,
  duplicate_urls: group(listings, x => x.listing_url).map(x => x.map(y => y.listing_id)),
  duplicate_contacts: group(listings, x => x.posted_by_contact).filter(x => x.length > 2).map(x => ({ contact: x[0].posted_by_contact, ids: x.map(y => y.listing_id) })),
  carpet_under_200: listings.filter(x => x.carpet_area < 200).map(x => ({ id: x.listing_id, area: x.carpet_area, price: x.price, text: x.description })),
  projects_with_wrong_listing_count: projects.filter(project => listings.filter(listing => listing.project_id === project.project_id).length !== project.total_listings).length,
  kukatpally_rent: rentals.filter(x => x.locality === 'kukatpally').reduce((n, x) => n + x.price, 0),
  project_max: projects.reduce((a, x) => x.price_max > a.price_max ? x : a),
};
await fs.writeFile('data/summary.json', JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
