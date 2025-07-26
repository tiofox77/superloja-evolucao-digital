export type Product = {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  badge?: 'NOVIDADE' | 'DESTAQUE';
};

export const products: Product[] = [
  // Carregadores e Cabos
  {
    id: '1',
    name: 'Carregador Original Xiaomi',
    price: '13.500 Kz',
    image: '/images/charger-xiaomi.png',
    category: 'Carregadores e Cabos',
  },
  {
    id: '2',
    name: 'Cabo USB',
    price: '5.500 Kz',
    image: '/images/cabo-usb.png',
    category: 'Carregadores e Cabos',
  },
  {
    id: '3',
    name: 'Carregador para iPhone',
    price: '4.500 Kz',
    image: '/images/carregador-iphone.png',
    category: 'Carregadores e Cabos',
  },
  {
    id: '4',
    name: 'Carregador Portátil',
    price: '7.000 Kz',
    image: '/images/carregador-portatil.png',
    category: 'Carregadores e Cabos',
  },

  // Acessórios para Smartphone
  {
    id: '5',
    name: 'Kit adaptador USB com vários cabos',
    price: '5.500 Kz',
    image: '/images/kit-adaptador.png',
    category: 'Acessórios para Smartphone',
  },
  {
    id: '6',
    name: 'Pulseira masculina',
    price: '8.500 Kz',
    image: '/images/pulseira-masculina.png',
    category: 'Acessórios para Smartphone',
  },
  {
    id: '7',
    name: 'Cabo Tipo C',
    price: '12.000 Kz',
    image: '/images/cabo-tipo-c.png',
    category: 'Acessórios para Smartphone',
    badge: 'NOVIDADE',
  },
  {
    id: '8',
    name: 'Suporte de tripé para celular',
    price: '6.500 Kz',
    image: '/images/suporte-tripe.png',
    category: 'Acessórios para Smartphone',
  },

  // Fones de Ouvido
  {
    id: '9',
    name: 'Fones de ouvido Bluetooth sem fio',
    price: '14.000 Kz',
    image: '/images/fones-bluetooth.png',
    category: 'Fones de Ouvido',
    badge: 'DESTAQUE',
  },
  {
    id: '10',
    name: 'Fones de ouvido Pro6 TWS',
    price: '8.500 Kz',
    image: '/images/fones-pro6.png',
    category: 'Fones de Ouvido',
  },
  {
    id: '11',
    name: 'Fones de ouvido',
    price: '8.000 Kz',
    image: '/images/fones-simples.png',
    category: 'Fones de Ouvido',
    badge: 'NOVIDADE',
  },
  {
    id: '12',
    name: 'Mouse Sem-Fio',
    price: '7.500 Kz',
    image: '/images/mouse-sem-fio.png',
    category: 'Fones de Ouvido',
  },
];
