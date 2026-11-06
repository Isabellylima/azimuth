// =====================================================================
//  AZIMUTH — single source of truth for the website content.
//  Edit this file to change programs, prices, dates and texts.
//  Every text has an English (en) and European Portuguese (pt) version.
// =====================================================================

export const SITE = {
  url: 'https://www.azimuthholidays.com',
  name: 'Azimuth Sailing Holidays',
  legalName: 'Azimuth Sphere Lda.',
  // ⚠️ Replace with the real numbers/addresses (also used by the booking API).
  whatsapp: '351000000000',          // digits only, with country code
  phoneDisplay: '+351 000 000 000',
  email: 'azimuthboatrent@gmail.com',
  instagram: 'https://www.instagram.com/azimuthholidays/',
  facebook: 'https://www.facebook.com/azimuthholidays',
  googleReviewsUrl: 'https://www.google.com/search?q=Azimuth+Holidays+Lagos+sailing',
  address: { street: 'Marina de Lagos', locality: 'Lagos', region: 'Faro', postalCode: '8600-780', country: 'PT' },
  geo: { lat: 37.1083, lng: -8.6702 },
  captain: 'Manuel Lopes',
  // Elfsight widgets already used on the old site (Google reviews + Instagram feed)
  elfsight: {
    reviews: 'd0e931b3-db4b-403a-a3e3-7483a3764f91',
    instagram: '1ff4f465-2dc1-4eef-bb0d-d29fb07591c1',
  },
};

const CDN = 'https://images.squarespace-cdn.com/content/v1/687006fbf205f9248e3992e8/';
// key -> [squarespace path, alt EN, alt PT]
export const PHOTOS = {
  aerial:      ['3eb41665-f2e1-4df8-a07a-046af52092d6/DJI_0090.JPG', 'Sailing yacht Angela along the Lagos coastline seen from above', 'Veleiro Angela junto à costa de Lagos visto de cima'],
  sunsetDeck:  ['9ec943cd-00d5-42ae-ba59-d0dd0cf7ab35/2022-07-08-21.12.01-scaled.jpg', 'Guest on the deck of a sailing yacht at sunset off Lagos', 'Convidada no convés de um veleiro ao pôr do sol em Lagos'],
  sunsetSun:   ['0e72e0f5-5953-470c-9a2b-6f747c7d5fd1/P9186127.jpg', 'Sun setting over the Atlantic seen from the yacht', 'Pôr do sol sobre o Atlântico visto do veleiro'],
  halfDay:     ['18b7f66f-ae49-483b-aeab-376e3ce5f420/IMG-20250721-WA0045.jpg', 'Guests sailing on Angela near the Algarve cliffs', 'Convidados a velejar no Angela junto às falésias do Algarve'],
  jump:        ['441ac2bb-eb80-4a91-8886-2bee5ff9f1b1/IMG-20221105-WA0014.jpg', 'Friends jumping into the sea during a full-day sailing tour', 'Amigos a saltar para o mar durante um passeio de dia inteiro'],
  bow:         ['a1876ff2-a453-43f5-8dec-ad53a46a7387/121279850_132331885291243_6621691852076421004_n.jpg', 'View from the bow of the yacht towards Lagos', 'Vista da proa do veleiro em direção a Lagos'],
  cockpit:     ['aa3914d9-1f3c-4b97-9e65-1ce443761aae/119865720_110096134181485_7114823967031155998_n.jpg', 'Cockpit of the sailing yacht with two helm wheels', 'Cockpit do veleiro com duas rodas de leme'],
  friends:     ['90232a86-96e0-46e2-9fab-9b367a3eef3b/IMG-20221105-WA0024.jpg', 'Group of friends sharing a meal on board', 'Grupo de amigos a partilhar uma refeição a bordo'],
  madeira:     ['94478e56-f17e-469c-8235-b08031a4232c/bela-paisagem-natural-scaled.jpg', 'Cliffs of the Madeira archipelago', 'Falésias do arquipélago da Madeira'],
  portoSanto:  ['154f9e05-a7bb-4d22-98ba-0bd2f804129a/PHOTO-2025-10-20-20-50-00+%281%29.jpg', 'Harbour of Porto Santo with sailing boats', 'Porto de Porto Santo com veleiros'],
  windmill:    ['7d96f400-dfd6-4706-ac1d-c5aefe9504a8/PHOTO-2025-10-20-20-49-58+%281%29.jpg', 'Traditional windmill in Porto Santo', 'Moinho tradicional em Porto Santo'],
  islandRocks: ['49512321-4ccb-428d-b6d5-20abfe625b63/PHOTO-2025-10-20-21-03-40.jpg', 'Volcanic shoreline and island cliffs', 'Costa vulcânica e falésias da ilha'],
  crew:        ['5d0d895b-904f-404a-aede-9bc9505fb0da/PHOTO-2025-10-26-11-36-59+%281%29.jpg', 'Crew members smiling on deck during an ocean crossing', 'Tripulantes sorridentes no convés durante uma travessia'],
  ropeSunset:  ['04284b9a-b26e-4579-87c7-dd699a67d826/PHOTO-2025-10-29-15-27-21+%281%29+%281%29.jpg', 'Guest handling a line at sunset during a sea crossing', 'Convidado a trabalhar um cabo ao pôr do sol numa travessia'],
  talk:        ['e3bdc9a8-404e-4b29-aca3-40469f1781c8/PHOTO-2025-10-21-14-42-35.jpg', 'Guests talking in the cockpit on the open ocean', 'Convidados à conversa no cockpit em pleno oceano'],
  swimOcean:   ['f0bd5a21-a62f-4d40-a55b-7a75f6297a69/PHOTO-2025-10-25-17-44-22.jpg', 'Swimming next to the yacht in the open Atlantic', 'Banho ao lado do veleiro em pleno Atlântico'],
  lighthouse:  ['56bf7822-dbcb-4de3-9660-53d11403fda1/PHOTO-2025-10-21-14-36-05.jpg', 'Arriving at an island bay with a lighthouse', 'Chegada a uma baía insular com farol'],
  turquoise:   ['68cd537c-3ae2-4078-935a-a52bade2656d/PHOTO-2025-10-20-20-44-46.jpg', 'Turquoise water along a volcanic coast', 'Água turquesa junto a uma costa vulcânica'],
  angela:      ['31841568-30ca-45d8-876e-dad603f7b618/119989505_110066864184412_1567983864690762394_n.jpg', 'Sailing yacht Angela moored in the marina', 'Veleiro Angela atracado na marina'],
  bavaria:     ['2915f75b-d4a5-4e4a-b03b-5d67c203af5f/119889749_110066787517753_8154571346857485408_n.jpg', 'Angela, a Bavaria 49 sailing yacht, in the marina', 'Angela, veleiro Bavaria 49, na marina'],
  saloon:      ['b096168d-664e-44c1-8728-64463baaac80/119969070_110098590847906_4729499052454746038_n.jpg', 'Saloon and dining table inside Angela', 'Salão e mesa de refeições do Angela'],
  cabin:       ['94a8ba9b-f19f-4fb9-9a8d-6e5d96a3bedb/120063397_110095667514865_3300321719428992786_n.jpg', 'Double cabin on board Angela', 'Cabine dupla a bordo do Angela'],
  bunk:        ['4b627ef3-b884-420d-937c-046ac9e651da/119899918_110095370848228_1080994053933238232_n.jpg', 'Twin cabin with bunk beds', 'Cabine twin com beliches'],
  deck:        ['d5dd03d1-d2f6-4eaa-807f-988cf9bbbfe8/20210508_203656-scaled.jpg', 'Teak deck, winches and lines', 'Convés em teca, winches e cabos'],
  food:        ['001997d9-a8a2-4061-b4b5-fe1a04b19d87/467015060_1074519404405815_1687456220448555678_n.jpg', 'Seafood platter served in the saloon', 'Mariscada servida no salão'],
  helm:        ['d6054f44-a401-4416-959e-e9aeec907ebe/IMG-20250721-WA0050.jpg', 'Guest at the helm next to the skipper', 'Convidado ao leme ao lado do skipper'],
  sup:         ['64d98df0-bb5b-446e-83ab-a1a131b2026c/IMG-20250720-WA0021.jpg', 'Paddleboarding next to the cliffs', 'Paddle junto às falésias'],
  cave:        ['63bff9d4-809a-4120-b99a-7f3d74d10d6f/IMG-20250721-WA0022.jpg', 'Sea cave with clear water in the Algarve', 'Gruta marinha com água cristalina no Algarve'],
  swimCliffs:  ['24de8a38-d36d-484d-ab6c-274514ff9888/IMG-20240723-WA0130.jpg', 'Swimming below the golden cliffs', 'Banho por baixo das falésias douradas'],
  picnic:      ['a2949ba9-f3b6-4d08-a09f-e097689c9b74/IMG-20250721-WA0039.jpg', 'Wine and cheese platter on deck', 'Vinho e tábua de queijos no convés'],
  coupleSunset:['6743ab7b-ba40-434f-8b26-693314f2002e/IMG-20241112-WA0026.jpg', 'Couple watching the sunset on board', 'Casal a ver o pôr do sol a bordo'],
  aerialSup:   ['20ecf0f1-8f66-4829-b3d2-23367193598e/IMG-20250721-WA0009.jpg', 'Aerial view of the yacht at anchor with paddleboards', 'Vista aérea do veleiro fundeado com pranchas de paddle'],
  boyHelm:     ['1ca6aa16-9cae-4735-b8a7-1bb8a1f23523/IMG-20221105-WA0112.jpg', 'Young sailor at the helm', 'Jovem velejador ao leme'],
  cliffsView:  ['48cd9bd7-803b-406b-bcb5-a41f273bfb05/IMG-20250515-WA0007.jpg', 'Algarve sea cliffs seen from the yacht', 'Falésias do Algarve vistas do veleiro'],
};
export const photoRemote = (key, w = 1500) => `${CDN}${PHOTOS[key][0]}?format=${w}w`;

// ---------------------------------------------------------------------
// Programs. kind: 'day' (pick any date in season) | 'range' (multi-day,
// pick start + nights) | 'fixed' (published departures).
// slots used by the shared boat calendar: m = morning, a = afternoon, e = evening
// ---------------------------------------------------------------------
const HIGH = [6, 7, 8, 9]; // June–September

export const PROGRAMS = [
  {
    id: 'half-day', group: 'lagos', kind: 'day', photo: 'halfDay', gallery: ['cave', 'sup', 'swimCliffs'],
    maxGuests: 10, months: 'all',
    times: [
      { id: 'morning', label: { en: 'Morning · 10:00–13:00', pt: 'Manhã · 10:00–13:00' }, slots: ['m'] },
      { id: 'afternoon', label: { en: 'Afternoon · 14:00–17:00', pt: 'Tarde · 14:00–17:00' }, slots: ['a'] },
    ],
    price: { type: 'season', high: 600, low: 400, highMonths: HIGH, unit: { en: 'per boat (private)', pt: 'por barco (privado)' } },
    slug: { en: 'half-day-sailing-tour-lagos', pt: 'passeio-vela-meio-dia-lagos' },
    title: { en: 'Half-Day Sailing Tour', pt: 'Passeio à Vela de Meio Dia' },
    seoTitle: { en: 'Private Half-Day Sailing Tour in Lagos, Algarve', pt: 'Passeio Privado à Vela de Meio Dia em Lagos, Algarve' },
    duration: { en: '3 hours', pt: '3 horas' },
    tagline: { en: 'Caves, golden cliffs and a swim stop — the Algarve coast at an easy pace.', pt: 'Grutas, falésias douradas e uma paragem para banho — a costa algarvia sem pressa.' },
    body: {
      en: ['A relaxed private cruise from Marina de Lagos along one of the most beautiful stretches of the Algarve. Sail past caves, beaches and hidden coves, anchor for a swim and enjoy the sun while the skipper takes care of everything.', 'The yacht is exclusively yours: up to 10 guests on board, with drinks and light Portuguese-style snacks.'],
      pt: ['Um passeio privado e descontraído a partir da Marina de Lagos, ao longo de um dos troços mais bonitos do Algarve. Passe por grutas, praias e enseadas escondidas, fundeie para um banho e aproveite o sol enquanto o skipper trata de tudo.', 'O veleiro é exclusivamente seu: até 10 convidados a bordo, com bebidas e petiscos de estilo português.'],
    },
    includes: {
      en: ['Private 15 m sailing yacht', 'Professional skipper and hostess', 'Coastal sightseeing and swim stop', 'Drinks on board (beer, wine, soft drinks)', 'Music system', 'Paddle boards and snorkelling gear (optional)'],
      pt: ['Veleiro privado de 15 m', 'Skipper profissional e hospedeira', 'Visita à costa e paragem para banho', 'Bebidas a bordo (cerveja, vinho, refrigerantes)', 'Sistema de som', 'Pranchas de paddle e material de snorkel (opcional)'],
    },
  },
  {
    id: 'full-day', group: 'lagos', kind: 'day', photo: 'jump', gallery: ['picnic', 'aerialSup', 'cliffsView'],
    maxGuests: 10, months: 'all',
    times: [{ id: 'day', label: { en: 'Full day · 10:00–17:00', pt: 'Dia inteiro · 10:00–17:00' }, slots: ['m', 'a'] }],
    price: { type: 'season', high: 1000, low: 650, highMonths: HIGH, unit: { en: 'per boat (private)', pt: 'por barco (privado)' } },
    slug: { en: 'full-day-sailing-tour-lagos', pt: 'passeio-vela-dia-inteiro-lagos' },
    title: { en: 'Full-Day Sailing Tour', pt: 'Passeio à Vela de Dia Inteiro' },
    seoTitle: { en: 'Private Full-Day Sailing Charter in Lagos, Algarve', pt: 'Passeio Privado à Vela de Dia Inteiro em Lagos, Algarve' },
    duration: { en: '7 hours', pt: '7 horas' },
    tagline: { en: 'A whole day at sea, at your own pace — from dramatic cliffs to quiet bays.', pt: 'Um dia inteiro no mar, ao seu ritmo — das falésias imponentes às baías tranquilas.' },
    body: {
      en: ['A full day to explore the Algarve by sea. Choose between coastal and offshore routes, stop where you like for swimming and lunch, and live a real day on board a sailing yacht.', 'Ideal for families, friends, celebrations and private escapes.'],
      pt: ['Um dia inteiro para descobrir o Algarve a partir do mar. Escolha entre rotas costeiras e ao largo, pare onde quiser para nadar e almoçar, e viva um verdadeiro dia a bordo de um veleiro.', 'Ideal para famílias, amigos, celebrações e escapadinhas privadas.'],
    },
    includes: {
      en: ['Full use of the yacht and facilities', 'Coastal and offshore routes', 'Custom stops for swimming and lunch', 'Skipper and hostess', 'Drinks and light snacks', 'Optional BBQ or catering'],
      pt: ['Uso total do veleiro e das instalações', 'Rotas costeiras e ao largo', 'Paragens à medida para banho e almoço', 'Skipper e hospedeira', 'Bebidas e petiscos', 'Churrasco ou catering opcionais'],
    },
  },
  {
    id: 'sunset', group: 'lagos', kind: 'day', photo: 'sunsetDeck', gallery: ['sunsetSun', 'coupleSunset', 'picnic'],
    maxGuests: 10, months: HIGH,
    times: [{ id: 'sunset', label: { en: 'Sunset · 18:00–20:30', pt: 'Pôr do sol · 18:00–20:30' }, slots: ['e'] }],
    price: { type: 'fixed', amount: 500, unit: { en: 'per boat (private)', pt: 'por barco (privado)' } },
    slug: { en: 'sunset-sailing-lagos', pt: 'passeio-vela-por-do-sol-lagos' },
    title: { en: 'Sunset Sailing', pt: 'Pôr do Sol à Vela' },
    seoTitle: { en: 'Private Sunset Sailing Tour in Lagos, Algarve', pt: 'Passeio Privado à Vela ao Pôr do Sol em Lagos' },
    duration: { en: '2.5 hours · June to September', pt: '2h30 · junho a setembro' },
    tagline: { en: 'Golden light on the cliffs, a glass in hand, the sails up.', pt: 'Luz dourada nas falésias, um copo na mão, velas em cima.' },
    body: {
      en: ['An evening on the water as the sky turns golden over Lagos. Calm sailing along the coastline, a swim if the weather allows, and drinks and local appetisers on board.', 'Perfect for couples, small groups and special moments. Available June to September.'],
      pt: ['Um fim de tarde no mar enquanto o céu fica dourado sobre Lagos. Velejada calma ao longo da costa, banho se o tempo permitir, e bebidas e petiscos locais a bordo.', 'Perfeito para casais, pequenos grupos e momentos especiais. Disponível de junho a setembro.'],
    },
    includes: {
      en: ['Welcome drinks', 'Local appetisers', 'Swim stop (weather permitting)', 'Calm sailing and sunset views'],
      pt: ['Bebidas de boas-vindas', 'Petiscos locais', 'Paragem para banho (se o tempo permitir)', 'Velejada calma e vista do pôr do sol'],
    },
  },
  {
    id: 'multi-day', group: 'lagos', kind: 'range', photo: 'cockpit', gallery: ['saloon', 'cabin', 'friends'],
    maxGuests: 8, minNights: 3, months: 'all',
    price: { type: 'season', high: 3000, low: 1500, highMonths: HIGH, from: true, unit: { en: 'from, per charter', pt: 'desde, por charter' } },
    slug: { en: 'multi-day-private-sailing-charter-algarve', pt: 'charter-privado-varios-dias-algarve' },
    title: { en: 'Multi-Day Private Charter', pt: 'Charter Privado de Vários Dias' },
    seoTitle: { en: 'Multi-Day Skippered Sailing Charter from Lagos, Algarve', pt: 'Charter à Vela com Skipper de Vários Dias a partir de Lagos' },
    duration: { en: 'Minimum 3 days', pt: 'Mínimo 3 dias' },
    tagline: { en: 'More than a taste of life at sea — your own yacht along the south of Portugal.', pt: 'Mais do que provar a vida no mar — o seu próprio veleiro pela costa sul de Portugal.' },
    body: {
      en: ['Book Angela for an extended, fully customised journey along the south coast of Portugal: sailing holidays, honeymoons or longer explorations of the coast and nearby marinas.', 'You sleep on board (up to 8 guests) and plan the route with the skipper, day by day, according to the weather and your wishes.'],
      pt: ['Reserve o Angela para uma viagem mais longa e totalmente personalizada pela costa sul de Portugal: férias à vela, luas de mel ou explorações mais longas da costa e das marinas próximas.', 'Dorme a bordo (até 8 convidados) e planeia a rota com o skipper, dia a dia, de acordo com o tempo e com os seus desejos.'],
    },
    includes: {
      en: ['Exclusive use of a 49 ft sailing yacht', 'Accommodation on board (up to 8 guests)', 'Skipper and hostess', 'Custom route planning', 'Daily cleaning and support', 'Full kitchen, technical and safety equipment'],
      pt: ['Uso exclusivo de um veleiro de 49 pés', 'Alojamento a bordo (até 8 convidados)', 'Skipper e hospedeira', 'Planeamento de rota à medida', 'Limpeza e apoio diários', 'Cozinha completa, equipamento técnico e de segurança'],
    },
  },
  // ------------------------- ATLANTIC 2027 -------------------------
  {
    id: 'lagos-porto-santo', group: 'atlantic', kind: 'fixed', photo: 'portoSanto', gallery: ['windmill', 'ropeSunset', 'crew'],
    maxGuests: 5, from: 'Lagos', to: 'Porto Santo',
    departures: [{ start: '2027-04-03', end: '2027-04-10', checkin: '2027-04-03', depart: '2027-04-04' }],
    options: [
      { id: 'person', label: { en: 'Per person', pt: 'Por pessoa' }, price: 1250, per: 'person', seats: 1 },
      { id: 'couple', label: { en: 'Couple (shared cabin)', pt: 'Casal (cabine partilhada)' }, price: 2000, per: 'booking', seats: 2 },
    ],
    slug: { en: 'sea-crossing-lagos-porto-santo-2027', pt: 'travessia-lagos-porto-santo-2027' },
    title: { en: 'Sea Crossing: Lagos → Porto Santo', pt: 'Travessia: Lagos → Porto Santo' },
    seoTitle: { en: 'Atlantic Sailing Crossing Lagos to Porto Santo (Madeira) — April 2027', pt: 'Travessia à Vela Lagos – Porto Santo (Madeira) — abril 2027' },
    duration: { en: '4 days sailing + 2 days in Porto Santo', pt: '4 dias a navegar + 2 dias em Porto Santo' },
    tagline: { en: 'Open the 2027 season with a real Atlantic passage to the Madeira archipelago.', pt: 'Abra a temporada de 2027 com uma verdadeira travessia atlântica até ao arquipélago da Madeira.' },
    body: {
      en: ['Four days of open-ocean sailing from Lagos to Porto Santo, living the rhythm of life on board as part of the crew: watches, sail trim, navigation and shared meals at sea.', 'After the crossing, two days in Porto Santo to discover the unique atmosphere of the island. Check-in 3 April 2027, departure 4 April 2027. Maximum 5 guests; meals on board included.'],
      pt: ['Quatro dias de navegação em mar aberto de Lagos a Porto Santo, a viver o ritmo da vida a bordo como parte da tripulação: quartos de vigia, afinação das velas, navegação e refeições partilhadas no mar.', 'Depois da travessia, dois dias em Porto Santo para descobrir o ambiente único da ilha. Check-in a 3 de abril de 2027, partida a 4 de abril de 2027. Máximo 5 convidados; refeições a bordo incluídas.'],
    },
    includes: {
      en: ['Ocean passage with experienced skipper', 'Accommodation in a cabin on board', 'Meals on board', 'Hands-on sailing, navigation and weather learning', 'Safety equipment and briefing'],
      pt: ['Travessia oceânica com skipper experiente', 'Alojamento em cabine a bordo', 'Refeições a bordo', 'Aprendizagem prática de vela, navegação e meteorologia', 'Equipamento e briefing de segurança'],
    },
  },
  {
    id: 'porto-santo-azores', group: 'atlantic', kind: 'fixed', photo: 'swimOcean', gallery: ['talk', 'lighthouse', 'turquoise'],
    maxGuests: 5, from: 'Porto Santo', to: 'Ponta Delgada',
    departures: [{ start: '2027-04-16', end: '2027-04-24', checkin: '2027-04-16', depart: '2027-04-17' }],
    options: [
      { id: 'person', label: { en: 'Per person', pt: 'Por pessoa' }, price: 1500, per: 'person', seats: 1 },
      { id: 'couple', label: { en: 'Couple (shared cabin)', pt: 'Casal (cabine partilhada)' }, price: 2500, per: 'booking', seats: 2 },
    ],
    slug: { en: 'sea-crossing-porto-santo-azores-2027', pt: 'travessia-porto-santo-acores-2027' },
    title: { en: 'Sea Crossing: Porto Santo → Azores', pt: 'Travessia: Porto Santo → Açores' },
    seoTitle: { en: 'Atlantic Sailing Crossing Porto Santo to Ponta Delgada, Azores — April 2027', pt: 'Travessia à Vela Porto Santo – Ponta Delgada, Açores — abril 2027' },
    duration: { en: '5 days sailing + 2 days in Ponta Delgada', pt: '5 dias a navegar + 2 dias em Ponta Delgada' },
    tagline: { en: 'Five days of deep blue between Madeira and São Miguel.', pt: 'Cinco dias de azul profundo entre a Madeira e São Miguel.' },
    body: {
      en: ['Continue the Atlantic journey from Porto Santo to Ponta Delgada, on São Miguel Island in the Azores. Five days of open-ocean sailing, followed by two days in Ponta Delgada to discover the landscapes, culture and atmosphere of the Azores.', 'Check-in 16 April 2027, departure 17 April 2027. Maximum 5 guests; meals on board included.'],
      pt: ['Continue a viagem atlântica de Porto Santo até Ponta Delgada, na ilha de São Miguel, nos Açores. Cinco dias de navegação em mar aberto, seguidos de dois dias em Ponta Delgada para descobrir as paisagens, a cultura e o ambiente dos Açores.', 'Check-in a 16 de abril de 2027, partida a 17 de abril de 2027. Máximo 5 convidados; refeições a bordo incluídas.'],
    },
    includes: {
      en: ['Ocean passage with experienced skipper', 'Accommodation in a cabin on board', 'Meals on board', 'Night watches and celestial navigation basics', 'Safety equipment and briefing'],
      pt: ['Travessia oceânica com skipper experiente', 'Alojamento em cabine a bordo', 'Refeições a bordo', 'Quartos noturnos e noções de navegação', 'Equipamento e briefing de segurança'],
    },
  },
  {
    id: 'azores-10-days', group: 'atlantic', kind: 'fixed', photo: 'turquoise', gallery: ['lighthouse', 'islandRocks', 'swimOcean'],
    maxGuests: 6, from: 'Terceira', to: 'Graciosa',
    route: 'Terceira → São Jorge → Faial → Pico → Graciosa',
    departures: [
      { start: '2027-05-20', end: '2027-05-29' }, { start: '2027-06-17', end: '2027-06-26' },
      { start: '2027-07-01', end: '2027-07-10' }, { start: '2027-07-31', end: '2027-08-09' },
      { start: '2027-08-13', end: '2027-08-22' },
    ],
    options: [
      { id: 'shared', label: { en: 'Shared cabin — per person', pt: 'Cabine partilhada — por pessoa' }, price: 2000, per: 'person', seats: 1 },
      { id: 'private-cabin', label: { en: 'Private cabin', pt: 'Cabine privada' }, price: 2500, per: 'booking', seats: 2 },
      { id: 'private-boat', label: { en: 'Private departure — full boat', pt: 'Saída privada — barco inteiro' }, price: 9000, per: 'booking', seats: 6, wholeBoat: true },
    ],
    slug: { en: 'azores-island-hopping-sailing-10-days', pt: 'acores-velejar-entre-ilhas-10-dias' },
    title: { en: 'Azores Inter-Island Sailing — 10 Days', pt: 'Açores entre Ilhas à Vela — 10 Dias' },
    seoTitle: { en: 'Azores Island-Hopping Sailing Holiday, 10 Days — 2027 Dates', pt: 'Férias à Vela entre Ilhas dos Açores, 10 Dias — Datas 2027' },
    duration: { en: '10 days · breakfast & dinner on board', pt: '10 dias · pequeno-almoço e jantar a bordo' },
    tagline: { en: 'Terceira, São Jorge, Faial, Pico and Graciosa — the Azores seen from the ocean.', pt: 'Terceira, São Jorge, Faial, Pico e Graciosa — os Açores vistos do mar.' },
    body: {
      en: ['Ten days sailing between some of the archipelago’s most remarkable islands, combining life at sea with time ashore to explore volcanic landscapes, local culture and the character of each island.', 'Join by the cabin or book the whole boat for your group (up to 6 guests). Breakfast and dinner on board included.'],
      pt: ['Dez dias a velejar entre algumas das ilhas mais marcantes do arquipélago, combinando a vida no mar com tempo em terra para explorar paisagens vulcânicas, cultura local e o carácter de cada ilha.', 'Junte-se por cabine ou reserve o barco inteiro para o seu grupo (até 6 convidados). Pequeno-almoço e jantar a bordo incluídos.'],
    },
    includes: {
      en: ['Skippered sailing between five islands', 'Accommodation on board', 'Breakfast and dinner on board', 'Time ashore on each island', 'Safety equipment and briefing'],
      pt: ['Navegação com skipper entre cinco ilhas', 'Alojamento a bordo', 'Pequeno-almoço e jantar a bordo', 'Tempo em terra em cada ilha', 'Equipamento e briefing de segurança'],
    },
  },
  {
    id: 'azores-7-days', group: 'atlantic', kind: 'fixed', photo: 'lighthouse', gallery: ['turquoise', 'helm', 'saloon'],
    maxGuests: 6, from: 'Terceira', to: 'Faial',
    route: 'Terceira → São Jorge → Pico → Faial',
    departures: [
      { start: '2027-05-08', end: '2027-05-14' }, { start: '2027-06-07', end: '2027-06-13' },
      { start: '2027-07-17', end: '2027-07-23' }, { start: '2027-08-28', end: '2027-09-03' },
    ],
    options: [{ id: 'private-boat', label: { en: 'Private charter — up to 6 guests', pt: 'Charter privado — até 6 convidados' }, price: 7700, per: 'booking', seats: 6, wholeBoat: true }],
    slug: { en: 'azores-private-sailing-charter-7-days', pt: 'acores-charter-privado-vela-7-dias' },
    title: { en: 'Azores Private Week Charter — 7 Days', pt: 'Charter Privado nos Açores — 7 Dias' },
    seoTitle: { en: 'Private 7-Day Skippered Sailing Charter in the Azores — 2027', pt: 'Charter Privado à Vela com Skipper nos Açores, 7 Dias — 2027' },
    duration: { en: '7 days · check-in 10:00, check-out until 17:00', pt: '7 dias · check-in 10:00, check-out até às 17:00' },
    tagline: { en: 'Your own sailing yacht for a week in the central Azores.', pt: 'O seu próprio veleiro durante uma semana nos Açores centrais.' },
    body: {
      en: ['A private seven-day charter for groups of up to six guests, combining sailing, island exploration and life on board through Terceira, São Jorge, Pico and Faial.', 'Breakfast and one meal per day on board included.'],
      pt: ['Um charter privado de sete dias para grupos até seis convidados, combinando navegação, exploração das ilhas e vida a bordo entre Terceira, São Jorge, Pico e Faial.', 'Pequeno-almoço e uma refeição por dia a bordo incluídos.'],
    },
    includes: {
      en: ['Exclusive use of the yacht', 'Skipper', 'Accommodation on board for up to 6 guests', 'Breakfast + 1 meal per day', 'Route through four islands'],
      pt: ['Uso exclusivo do veleiro', 'Skipper', 'Alojamento a bordo até 6 convidados', 'Pequeno-almoço + 1 refeição por dia', 'Rota por quatro ilhas'],
    },
  },
];

export const BOAT = {
  name: 'Angela', model: 'Bavaria 49', length: '15 m (49 ft)', cabins: 5, bathrooms: 3, sleeps: 8, dayGuests: 10,
};

export const FAQ = {
  en: [
    ['Where do the sailing tours depart from?', 'All Lagos tours depart from Marina de Lagos, in the Algarve, Portugal. Atlantic sea crossings depart from Lagos or Porto Santo, and the Azores programs start in Terceira.'],
    ['Are the tours private?', 'Yes. Lagos tours and charters are private: the yacht Angela is exclusively for your group, with up to 10 guests on day trips and up to 8 guests sleeping on board.'],
    ['How does booking work?', 'Choose a program and a date in the calendar and send your request. We confirm availability by email, and the booking is secured with a 50% advance payment; the balance is due one month before the trip.'],
    ['Do I need sailing experience for a sea crossing?', 'Tell us your experience when you request a place. On crossings you become part of the crew and learn with an experienced skipper: watches, sail handling, navigation and weather.'],
    ['What happens if the weather is bad?', 'Safety comes first. The skipper decides whether it is safe to sail and, if not, we agree an alternative plan or date with you.'],
    ['What is the cancellation policy?', 'Cancellations made 30 or more days before the trip are charged up to 50%; less than 30 days, up to 100%. See the full Terms & Conditions.'],
    ['Can I book by WhatsApp?', 'Yes — use the WhatsApp button on any page and we reply personally.'],
  ],
  pt: [
    ['De onde partem os passeios à vela?', 'Todos os passeios em Lagos partem da Marina de Lagos, no Algarve. As travessias atlânticas partem de Lagos ou de Porto Santo, e os programas dos Açores começam na Terceira.'],
    ['Os passeios são privados?', 'Sim. Os passeios e charters em Lagos são privados: o veleiro Angela é exclusivamente para o seu grupo, até 10 convidados em passeios de dia e até 8 a dormir a bordo.'],
    ['Como funciona a reserva?', 'Escolha um programa e uma data no calendário e envie o pedido. Confirmamos a disponibilidade por e-mail e a reserva fica garantida com um pagamento de 50%; o restante é pago um mês antes da viagem.'],
    ['Preciso de experiência para uma travessia?', 'Indique-nos a sua experiência quando pedir o lugar. Nas travessias passa a fazer parte da tripulação e aprende com um skipper experiente: quartos, manobra das velas, navegação e meteorologia.'],
    ['E se o tempo estiver mau?', 'A segurança vem primeiro. O skipper decide se é seguro navegar e, se não for, combinamos consigo um plano ou data alternativos.'],
    ['Qual é a política de cancelamento?', 'Cancelamentos feitos com 30 ou mais dias de antecedência têm um custo até 50%; com menos de 30 dias, até 100%. Consulte os Termos e Condições completos.'],
    ['Posso reservar por WhatsApp?', 'Sim — use o botão de WhatsApp em qualquer página e respondemos pessoalmente.'],
  ],
};
