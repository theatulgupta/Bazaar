import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const PER_CATEGORY = 200;
const SHOPPERS = 80;
const SHOPPER_PASSWORD = 'bazaar-shopper';

type Lane = {
  name: string;
  slug: string;
  nouns: string[];
  adjectives: string[];
  images: string[];
  minPrice: number;
  maxPrice: number;
};

const lanes: Lane[] = [
  lane('Electronics', 'electronics', ['laptop', 'monitor', 'keyboard', 'tablet', 'router', 'ssd'], ['slim', 'pro', 'studio', 'compact'], photos('1517336714731-489689fd1ca8', '1496181133206-80ce9b88a853', '1527443224154-c4a3942d3acf', '1544244015-0df4b3ffc6b0', '1518770660439-4636190af475', '1593642632823-8f785ba67e45'), 2499900, 12999900),
  lane('Phones', 'phones', ['phone', 'case', 'charger', 'power bank', 'screen guard'], ['matte', 'clear', 'fast', 'pocket'], photos('1511707171634-5f897ff02aa9', '1510557880182-3d4d3cba35a5', '1601784551446-20c9e07cdbdb', '1580910051074-3eb694886505'), 49900, 8999900),
  lane('Audio', 'audio', ['headphones', 'earbuds', 'speaker', 'soundbar'], ['wireless', 'studio', 'bass', 'travel'], photos('1505740420928-5e560c06d30e', '1484704849700-f032a568e944', '1546435770-a3e426bf472b', '1608043152269-423dbba4e7e1'), 149900, 2499900),
  lane('Cameras', 'cameras', ['mirrorless camera', 'lens', 'tripod', 'memory card'], ['travel', 'prime', 'compact', 'night'], photos('1516035069371-29a1b244cc32', '1502920917128-1aa500764cbd', '1510127034890-ba27508e9f1c', '1495707902641-75cac588e2e9'), 199900, 14999900),
  lane("Men's clothing", 'mens-clothing', ['t-shirt', 'shirt', 'jacket', 'chino', 'hoodie'], ['cotton', 'linen', 'slim', 'everyday'], photos('1521572163474-6864f9cf17ab', '1594938298603-c8148c4dae35', '1617137968427-85924c800a22', '1490578474895-699cd4e2cf59'), 79900, 499900),
  lane("Women's clothing", 'womens-clothing', ['top', 'dress', 'kurta', 'cardigan', 'skirt'], ['soft', 'draped', 'handloom', 'day'], photos('1515372039744-b8f02a3ae446', '1490481651871-ab68de25d43d', '1525507119028-ed4c629a60a3', '1483985988355-763728e1935b'), 89900, 599900),
  lane('Footwear', 'footwear', ['sneaker', 'sandal', 'loafer', 'runner'], ['leather', 'knit', 'court', 'trail'], photos('1542291026-7eec264c27ff', '1460353581641-37baddab0fa2', '1549298916-b41d501d3772', '1608256246200-53e635b5b65f'), 129900, 899900),
  lane('Kids', 'kids', ['tee', 'shorts', 'backpack', 'sneakers'], ['play', 'soft', 'school', 'bright'], photos('1503919545889-aef636e10ad4', '1514090458221-65bb69cf63e6', '1471286174890-9c112ffca5b4', '1596462502278-27bfdc403348'), 39900, 199900),
  lane('Jewelery', 'jewelery', ['ring', 'necklace', 'bracelet', 'earrings'], ['gold', 'silver', 'petite', 'studio'], photos('1515562141207-7a88fb7ce338', '1601121141461-9d6647be40c5', '1617038260897-41a1f14a8ca0', '1535632066927-ab7c9ab60908'), 199900, 2499900),
  lane('Beauty', 'beauty', ['serum', 'lipstick', 'perfume', 'cream'], ['daily', 'glow', 'soft', 'night'], photos('1596462502278-27bfdc403348', '1522335789203-aabd1fc54bc9', '1586495777744-4413f21062fa', '1611930022073-b7a4ba5fcccd'), 49900, 349900),
  lane('Home', 'home', ['lamp', 'cushion', 'throw', 'vase', 'rug'], ['linen', 'clay', 'oak', 'hand'], photos('1484101403633-562f891dc89a', '1519710164239-da123dc03ef4', '1493663284031-b7e3aefcae8e', '1555041469-a586c61ea9bc'), 69900, 799900),
  lane('Kitchen', 'kitchen', ['pan', 'kettle', 'mug', 'board', 'jar'], ['steel', 'ceramic', 'cast', 'morning'], photos('1556911220-bff31c812dba', '1556910103-1c02745aae4d', '1495474472287-4d71bcdd2085', '1517701550927-30cf4ba443f1'), 39900, 499900),
  lane('Sports', 'sports', ['yoga mat', 'bottle', 'duffel', 'trainer'], ['grip', 'lite', 'court', 'trail'], photos('1517836357463-d25dfeac3438', '1571019614242-c5c5dee9f50b', '1518611012118-696072aa579a', '1599058917212-d750089bc07e'), 49900, 699900),
  lane('Books', 'books', ['novel', 'cookbook', 'notebook', 'field guide'], ['clothbound', 'pocket', 'illustrated', 'first'], photos('1512820790803-83ca734da794', '1495446815901-a7297e633e8d', '1524995997946-a1c2e315a42f', '1481627834876-b7833e8f5570'), 29900, 149900),
  lane('Groceries', 'groceries', ['coffee', 'tea', 'honey', 'spice tin', 'olive oil'], ['single estate', 'stoneground', 'wild', 'cold'], photos('1495474472287-4d71bcdd2085', '1511920170033-f8396924c348', '1509042239860-f550ce710b93', '1474979266404-7eaacbcd87c5'), 19900, 129900),
  lane('Bags', 'bags', ['tote', 'backpack', 'weekender', 'pouch'], ['canvas', 'leather', 'day', 'travel'], photos('1548036328-c9fa89d128fa', '1553062407-98eeb64c6a62', '1590874103328-eac38a683ce7', '1524498250077-390f9e378fc0'), 99900, 899900),
];

function lane(name: string, slug: string, nouns: string[], adjectives: string[], images: string[], minPrice: number, maxPrice: number): Lane {
  return { name, slug, nouns, adjectives, images, minPrice, maxPrice };
}

function photos(...ids: string[]) {
  return ids.map((id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`);
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 8) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) are required to seed');
  }

  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@shop.bazaar.local' } } });

  await prisma.category.createMany({ data: lanes.map(({ name, slug }) => ({ name, slug })) });
  const categories = await prisma.category.findMany();
  const categoryId = new Map(categories.map((category) => [category.slug, category.id]));

  const products = lanes.flatMap((entry) =>
    Array.from({ length: PER_CATEGORY }, (_, index) => {
      const noun = entry.nouns[index % entry.nouns.length];
      const adjective = entry.adjectives[index % entry.adjectives.length];
      const sequence = String(index + 1).padStart(3, '0');
      const span = entry.maxPrice - entry.minPrice;
      const pricePaise = entry.minPrice + ((index * 97) % span);
      const deal = index % 3 !== 0;
      const mrpPaise = deal ? pricePaise + Math.max(5000, Math.round(pricePaise * 0.2)) : pricePaise;
      return {
        id: randomUUID(),
        categoryId: categoryId.get(entry.slug)!,
        title: `${titleCase(adjective)} ${noun} ${sequence}`,
        slug: `${entry.slug}-${adjective}-${noun.replace(/\s+/g, '-')}-${sequence}`,
        description: `${titleCase(adjective)} ${noun} from the ${entry.name.toLowerCase()} stall. Priced in rupees and stocked in the Bazaar warehouse.`,
        pricePaise,
        mrpPaise,
        imageUrl: entry.images[index % entry.images.length],
        active: true,
        stock: 8 + (index % 70),
      };
    }),
  );

  for (let offset = 0; offset < products.length; offset += 500) {
    const batch = products.slice(offset, offset + 500);
    await prisma.product.createMany({
      data: batch.map(({ stock: _stock, ...product }) => product),
    });
    await prisma.stockItem.createMany({
      data: batch.map((product) => ({ productId: product.id, onHand: product.stock, reserved: 0 })),
    });
  }

  const shopperHash = await argon2.hash(SHOPPER_PASSWORD);
  const shoppers = Array.from({ length: SHOPPERS }, (_, index) => {
    const n = String(index + 1).padStart(3, '0');
    return {
      id: randomUUID(),
      name: `Shopper ${n}`,
      email: `shopper-${n}@shop.bazaar.local`,
      passwordHash: shopperHash,
      role: 'CUSTOMER' as const,
      emailVerifiedAt: new Date(),
    };
  });
  await prisma.user.createMany({ data: shoppers });
  await prisma.address.createMany({
    data: shoppers.slice(0, 40).map((shopper, index) => ({
      userId: shopper.id,
      name: shopper.name,
      mobile: `9${String(100000000 + index).slice(0, 9)}`,
      houseNo: String(10 + index),
      street: 'Market Road',
      landmark: 'Near the stall',
      pincode: '560001',
      city: 'Bengaluru',
      state: 'Karnataka',
      isDefault: true,
    })),
  });

  const passwordHash = await argon2.hash(password);
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    create: {
      name: 'Bazaar Admin',
      email: email.toLowerCase(),
      passwordHash,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
    update: { passwordHash, role: 'ADMIN', emailVerifiedAt: new Date() },
  });

  console.log(`Seeded ${lanes.length} categories, ${products.length} products, ${SHOPPERS} shoppers.`);
  console.log(`Shopper login: shopper-001@shop.bazaar.local / ${SHOPPER_PASSWORD}`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
