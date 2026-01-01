export const defaultBrand = {
  heroTitle: 'Demo Store',
  heroSubtitle: 'Catálogo de ejemplo listo para explorar.',
  heroCta: 'Ver catálogo',
  heroBg: '/bg.png',
  heroTextColor: '#ffffff',
  heroOverlay: 'rgba(0,0,0,0.55)',
  heroSecondaryImage: '',
  footerText: '',
  highlightTitle: '',
  highlightSubtitle: 'Explora nuestras categorías más populares y agrega tus favoritos al carrito.',
  bestsellersTitle: 'Bestsellers',
  categoriesTitle: 'Categorías',
  layoutNav: 'classic',
  layoutHero: 'classic',
  layoutHighlight: 'split',
  layoutBestsellers: 'grid',
  layoutCategories: 'grid',
  layoutCategoriesPage: 'grid',
  layoutProductPage: 'classic',
  primaryColor: '#2563eb',
  textColor: '#0f172a',
  surfaceColor: '#ffffff',
  pageBg: '#f8fafc',
  navBgColor: '#ffffff',
  navTextColor: '#0f172a',
}

export type BrandConfig = typeof defaultBrand & {
  logoUrl?: string | null
}
