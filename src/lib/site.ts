export const site = {
  name: 'López Márquez Abogados',
  shortName: 'López Márquez',
  url: 'https://lopezmarquezabogados.com',
  description: 'Despacho de abogados en Barcelona especializado en Derecho Laboral, Extranjería y asesoramiento jurídico a empresas.',
  phone: '+34 695 385 198',
  phoneHref: 'tel:+34695385198',
  whatsapp: 'https://wa.me/34695385198',
  email: 'lopezmarquezabogados@gmail.com',
  address: {
    street: 'Carrer dels Madrazo, 6',
    locality: 'Barcelona',
    region: 'Cataluña',
    postalCode: '08006',
    country: 'ES'
  },
  maps: 'https://maps.app.goo.gl/No1F8pQ4VmJxHKhM6?g_st=aw',
  instagram: 'https://www.instagram.com/lopez_marquez_abogados/',
  areas: [
    { title: 'Derecho Laboral', href: '/laboral', kicker: 'Trabajadores · Empresas' },
    { title: 'Extranjería', href: '/extranjeria', kicker: 'Residencia · Nacionalidad' },
    { title: 'Empresas', href: '/empresas', kicker: 'Asesoramiento recurrente' }
  ]
} as const;

export const indexableRoutes = [
  '/', '/laboral', '/laboral/despidos', '/laboral/indemnizacion-despido', '/laboral/reclamacion-salarios',
  '/laboral/accidentes-laborales', '/laboral/penal-laboral', '/laboral/asesoramiento-empresas', '/extranjeria', '/extranjeria/arraigo',
  '/extranjeria/nacionalidad-espanola', '/extranjeria/residencia', '/extranjeria/reagrupacion-familiar',
  '/empresas', '/empresas/asesoramiento-laboral', '/empresas/iguala-laboral', '/otras-areas', '/civil', '/penal',
  '/administrativo', '/sobre-nosotros', '/preguntas-frecuentes', '/recursos', '/recursos/despido-20-dias-habiles',
  '/recursos/arraigo-dos-anos-2026', '/recursos/nacionalidad-espanola-plazos', '/contacto'
] as const;
