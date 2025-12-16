import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  structuredData?: object;
}

const SEOHead = ({
  title = 'Healing Buds | Shaping the Future of Cannabis',
  description = 'Leading the world in cannabis research and EU GMP-certified medical cannabis products. Consistently delivering superior products and driving global acceptance.',
  keywords = 'medical cannabis, CBD, THC, EU GMP, cannabis research, Healing Buds, Portugal cannabis, medical marijuana',
  canonical,
  ogImage = '/assets/hb-logo-square.png',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  structuredData,
}: SEOHeadProps) => {
  const baseUrl = 'https://healingbuds.co.za';
  const fullCanonical = canonical ? `${baseUrl}${canonical}` : baseUrl;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;

  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Healing Buds',
    url: baseUrl,
    logo: `${baseUrl}/assets/hb-logo-square.png`,
    description: description,
    sameAs: [
      'https://twitter.com/healingbuds',
      'https://linkedin.com/company/healingbuds',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@healingbuds.co.za',
      contactType: 'customer service',
    },
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content="Healing Buds" />
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="Healing Buds" />
      <meta property="og:locale" content="en_ZA" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
    </Helmet>
  );
};

export default SEOHead;
