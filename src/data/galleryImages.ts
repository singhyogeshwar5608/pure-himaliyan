export type GalleryImage = {
  src: string
  title: string
  description: string
  category: string
}

export const galleryImages: GalleryImage[] = [
  {
    src: '/assets/images/Benefits of Shilajit.webp',
    title: 'Benefits of Shilajit',
    description: 'Key benefits of our Pure Himalyan Shilajit Gold in one visual snapshot.',
    category: 'Education',
  },
  {
    src: '/assets/images/Diseases Covered by Shilajit.webp',
    title: 'Diseases Covered',
    description: 'Explore the wellness concerns supported by traditional shilajit usage.',
    category: 'Wellness',
  },
  {
    src: '/assets/images/How to use Pure Himalyan Shilajit.webp',
    title: 'How to Use',
    description: 'Simple visual guide to using our product for best results.',
    category: 'Guide',
  },
  {
    src: '/assets/images/Dosage and Usage of Pure Himalyan Shilajit.webp',
    title: 'Dosage & Usage',
    description: 'Step-by-step dosage chart for different lifestyles and routines.',
    category: 'Guide',
  },
  {
    src: '/assets/images/above 80% Fulvic Acid shilajit in India.webp',
    title: 'Fulvic Acid Rich',
    description: 'Illustration showing the high fulvic acid concentration of our resin.',
    category: 'Lab Proven',
  },
  {
    src: '/assets/images/Pure Himalyan Shilajit, Stamina.webp',
    title: 'Performance Boost',
    description: 'Poster celebrating enhanced stamina and vitality.',
    category: 'Lifestyle',
  },
  {
    src: '/assets/images/Power of Shilajit (2).webp',
    title: 'Power of Shilajit',
    description: 'Inspirational artwork capturing the potency of Himalayan minerals.',
    category: 'Inspiration',
  },
  {
    src: '/assets/images/Gemini_Generated_Image_bsu45hbsu45hbsu4.webp',
    title: 'Mountain Origins',
    description: 'A dreamy depiction of Himalayan peaks where the resin is sourced.',
    category: 'Origin',
  },
  {
    src: '/assets/images/240_F_1452767104_5UiokEGevhTu6zIk84umpW9hUjY438aw.webp',
    title: 'Mind & Body Balance',
    description: 'Lifestyle imagery highlighting calm energy after regular use.',
    category: 'Lifestyle',
  },
  {
    src: '/assets/images/240_F_1452771266_iSWRdXhvfdD6E2f3SDZLf7sosTmzOZXg.webp',
    title: 'Active Living',
    description: 'Celebrating movement, flexibility, and strength.',
    category: 'Fitness',
  },
  {
    src: '/assets/images/240_F_1452774652_jSsy0ixvi288RVobmSb2MXgZ8Zt2BRUC.webp',
    title: 'Daily Ritual',
    description: 'Minimal still-life showcasing shilajit as part of a routine.',
    category: 'Ritual',
  },
  {
    src: '/assets/images/240_F_987385987_azpk3qnANhpqDFEVft4pjwIWhRkBJL1O.webp',
    title: 'Natural Minerals',
    description: 'Close-up highlighting the earthy texture of authentic resin.',
    category: 'Nature',
  },
]

export const featuredGalleryImages = galleryImages.slice(0, 4)
