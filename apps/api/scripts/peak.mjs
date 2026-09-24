const base = process.env.API_URL ?? 'http://localhost:8000';
const concurrency = Number(process.env.PEAK_CONCURRENCY ?? 40);
const requests = Number(process.env.PEAK_REQUESTS ?? 800);

const catalog = await fetch(`${base}/api/v1/catalog/products?pageSize=48`).then((response) => response.json());
const slugs = catalog.data.items.map((item) => item.slug);
const categories = await fetch(`${base}/api/v1/catalog/categories`).then((response) => response.json());
const categorySlugs = categories.data.map((item) => item.slug);
const words = ['cotton', 'leather', 'camera', 'coffee', 'sneaker', 'gold', 'lamp'];

function pathFor(index) {
  const roll = index % 5;
  if (roll === 0) return '/api/v1/catalog/categories';
  if (roll === 1) return '/api/v1/catalog/deals';
  if (roll === 2) return `/api/v1/catalog/products?page=${(index % 20) + 1}&pageSize=24`;
  if (roll === 3) return `/api/v1/catalog/products?category=${categorySlugs[index % categorySlugs.length]}&pageSize=24`;
  if (roll === 4 && index % 2 === 0) return `/api/v1/catalog/products?q=${words[index % words.length]}`;
  return `/api/v1/catalog/products/${slugs[index % slugs.length]}`;
}

const latencies = [];
const statuses = new Map();
let cursor = 0;

async function worker() {
  while (cursor < requests) {
    const index = cursor;
    cursor += 1;
    const started = performance.now();
    const response = await fetch(`${base}${pathFor(index)}`);
    latencies.push(performance.now() - started);
    statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
    await response.arrayBuffer();
  }
}

const started = performance.now();
await Promise.all(Array.from({ length: concurrency }, () => worker()));
const elapsed = performance.now() - started;
latencies.sort((a, b) => a - b);
const pick = (p) => latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))];
const ok = (statuses.get(200) ?? 0) + (statuses.get(201) ?? 0);

console.log(
  JSON.stringify(
    {
      requests,
      concurrency,
      elapsedMs: Math.round(elapsed),
      requestsPerSecond: Number((requests / (elapsed / 1000)).toFixed(1)),
      ok,
      statuses: Object.fromEntries(statuses),
      p50Ms: Math.round(pick(50)),
      p95Ms: Math.round(pick(95)),
      p99Ms: Math.round(pick(99)),
    },
    null,
    2,
  ),
);
