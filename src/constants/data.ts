import { DealItem } from '../types';

export const BANNER_IMAGES = [
  'https://img.etimg.com/thumb/msid-93051525,width-1070,height-580,imgsize-2243475,overlay-economictimes/photo.jpg',
  'https://images-eu.ssl-images-amazon.com/images/G/31/img22/Wireless/devjyoti/PD23/Launches/Updated_ingress1242x550_3.gif',
  'https://images-eu.ssl-images-amazon.com/images/G/31/img23/Books/BB/JULY/1242x550_Header-BB-Jul23.jpg',
];

export const CATEGORY_ICONS: Record<string, string> = {
  electronics: 'https://m.media-amazon.com/images/G/31/img20/Events/Jup21dealsgrid/blockbuster.jpg',
  jewelery: 'https://m.media-amazon.com/images/I/51dZ19miAbL._AC_SY350_.jpg',
  "men's clothing": 'https://m.media-amazon.com/images/G/31/img20/Events/Jup21dealsgrid/music.jpg',
  "women's clothing": 'https://m.media-amazon.com/images/I/41EcYoIZhIL._AC_SY400_.jpg',
};

export const DEALS: DealItem[] = [
  {
    id: '20',
    title: 'OnePlus Nord CE 3 Lite 5G (Pastel Lime, 8GB RAM, 128GB Storage)',
    oldPrice: 25000,
    price: 19000,
    image: 'https://images-eu.ssl-images-amazon.com/images/G/31/wireless_products/ssserene/weblab_wf/xcm_banners_2022_in_bau_wireless_dec_580x800_once3l_v2_580x800_in-en.jpg',
    carouselImages: [
      'https://m.media-amazon.com/images/I/61QRgOgBx0L._SX679_.jpg',
      'https://m.media-amazon.com/images/I/61uaJPLIdML._SX679_.jpg',
      'https://m.media-amazon.com/images/I/510YZx4v3wL._SX679_.jpg',
    ],
    color: 'Stellar Green',
    size: '8GB RAM 128GB Storage',
  },
  {
    id: '30',
    title: 'Samsung Galaxy S20 FE 5G (Cloud Navy, 8GB RAM, 128GB Storage)',
    oldPrice: 74000,
    price: 26000,
    image: 'https://images-eu.ssl-images-amazon.com/images/G/31/img23/Wireless/Samsung/SamsungBAU/S20FE/GW/June23/BAU-27thJune/xcm_banners_2022_in_bau_wireless_dec_s20fe-rv51_580x800_in-en.jpg',
    carouselImages: [
      'https://m.media-amazon.com/images/I/81vDZyJQ-4L._SY879_.jpg',
      'https://m.media-amazon.com/images/I/61vN1isnThL._SX679_.jpg',
    ],
    color: 'Cloud Navy',
    size: '8GB RAM 128GB Storage',
  },
];

export const OFFERS: DealItem[] = [
  {
    id: 'o1',
    title: 'Oppo Enco Air3 Pro True Wireless Earbuds with 49dB ANC',
    offer: '72% off',
    oldPrice: 7500,
    price: 4500,
    image: 'https://m.media-amazon.com/images/I/61a2y1FCAJL._AC_UL640_FMwebp_QL65_.jpg',
    carouselImages: ['https://m.media-amazon.com/images/I/61a2y1FCAJL._SX679_.jpg'],
    color: 'Green',
    size: 'Normal',
  },
  {
    id: 'o2',
    title: 'Fastrack Limitless FS1 Pro Smart Watch 1.96" AMOLED',
    offer: '40% off',
    oldPrice: 7955,
    price: 3495,
    image: 'https://m.media-amazon.com/images/I/41mQKmbkVWL._AC_SY400_.jpg',
    carouselImages: ['https://m.media-amazon.com/images/I/71h2K2OQSIL._SX679_.jpg'],
    color: 'Black',
    size: 'Normal',
  },
];
