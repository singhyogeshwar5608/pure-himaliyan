export type BlogComparisonData = {
  columns: string[]
  rows: { label: string; values: string[] }[]
}

export type BlogContentItem = {
  id: string
  display_order: number
  type: 'description' | 'comparison'
  kicker?: string
  heading?: string
  body?: string
  image_url?: string | null
  comparison_data?: BlogComparisonData
}

export const blogContent: BlogContentItem[] = [
  {
    id: 'intro',
    display_order: 1,
    type: 'description',
    kicker: 'Introduction',
    heading: 'Why Shilajit is the Ultimate Ayurvedic Superfood',
    body: `Shilajit is a powerful natural substance found primarily in the Himalayas, formed over centuries by the decomposition of plant matter and minerals. It has been used in traditional Ayurvedic medicine for thousands of years.

## Rich in Fulvic Acid
Fulvic acid is the key active compound in Shilajit. It helps transport nutrients into cells, improves energy production, and supports detoxification.

## Mineral Dense
Shilajit contains over 85 trace minerals that are essential for various bodily functions, including bone health, enzyme production, and hormone regulation.`,
    image_url: null,
  },
  {
    id: 'comparison-1',
    display_order: 2,
    type: 'comparison',
    comparison_data: {
      columns: ['Feature', 'Pure Himalyan Shilajit', 'Regular Shilajit'],
      rows: [
        { label: 'Fulvic Acid Content', values: ['85%+', '40-60%'] },
        { label: 'Purity', values: ['Lab Tested', 'Unverified'] },
        { label: 'Source', values: ['Himalayan Range', 'Various'] },
        { label: 'Heavy Metal Tested', values: ['Yes', 'Rarely'] },
      ],
    },
  },
  {
    id: 'benefits',
    display_order: 3,
    type: 'description',
    kicker: 'Benefits',
    heading: 'Top 5 Health Benefits of Shilajit',
    body: `## 1. Boosts Energy and Stamina
Shilajit improves mitochondrial function, helping your body produce more ATP — the primary energy currency of cells.

## 2. Enhances Cognitive Function
The fulvic acid in Shilajit helps prevent tau protein buildup and supports memory, focus, and overall brain health.

## 3. Supports Male Vitality
Regular consumption of Shilajit has been shown to boost testosterone levels and improve reproductive health.

## 4. Strengthens Immunity
With its rich mineral content and antioxidant properties, Shilajit helps fortify the immune system against infections.

## 5. Promotes Healthy Aging
Shilajit's powerful antioxidants help combat oxidative stress and reduce the visible signs of aging.`,
    image_url: null,
  },
  {
    id: 'comparison-2',
    display_order: 4,
    type: 'comparison',
    comparison_data: {
      columns: ['Benefit', 'Shilajit', 'Ashwagandha'],
      rows: [
        { label: 'Energy Boost', values: ['★★★★★', '★★★☆☆'] },
        { label: 'Stress Relief', values: ['★★★☆☆', '★★★★★'] },
        { label: 'Cognitive Support', values: ['★★★★☆', '★★★★☆'] },
        { label: 'Testosterone', values: ['★★★★★', '★★★☆☆'] },
      ],
    },
  },
  {
    id: 'usage',
    display_order: 5,
    type: 'description',
    kicker: 'Usage Guide',
    heading: 'How to Take Shilajit for Maximum Benefits',
    body: `## Recommended Dosage
Take a pea-sized amount (about 300-500mg) of Shilajit resin once or twice daily.

## Best Time to Consume
- Morning on an empty stomach for energy
- Evening for recovery and rejuvenation

## How to Consume
Dissolve the resin in warm milk, water, or herbal tea. You can also mix it with honey for better taste.`,
    image_url: null,
  },
]
