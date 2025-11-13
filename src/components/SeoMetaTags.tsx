'use client';

import React, { useEffect } from 'react';

export interface SeoMetaTagsProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  robotsMeta?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
  };
  twitterCard?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  structuredData?: string;
  additionalMetaTags?: { [key: string]: string };
}

export const SeoMetaTags: React.FC<SeoMetaTagsProps> = ({
  title,
  description,
  keywords,
  canonicalUrl,
  robotsMeta,
  openGraph,
  twitterCard,
  structuredData,
  additionalMetaTags
}) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Basic meta tags
    if (description) {
      updateMetaTag('description', description);
    }
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }
    if (robotsMeta) {
      updateMetaTag('robots', robotsMeta);
    }

    // Open Graph tags
    if (openGraph) {
      if (openGraph.title) updateMetaTag('og:title', openGraph.title, 'property');
      if (openGraph.description) updateMetaTag('og:description', openGraph.description, 'property');
      if (openGraph.image) updateMetaTag('og:image', openGraph.image, 'property');
      if (openGraph.type) updateMetaTag('og:type', openGraph.type, 'property');
      if (openGraph.url) updateMetaTag('og:url', openGraph.url, 'property');
    }

    // Twitter Card tags
    if (twitterCard) {
      if (twitterCard.card) updateMetaTag('twitter:card', twitterCard.card);
      if (twitterCard.title) updateMetaTag('twitter:title', twitterCard.title);
      if (twitterCard.description) updateMetaTag('twitter:description', twitterCard.description);
      if (twitterCard.image) updateMetaTag('twitter:image', twitterCard.image);
    }

    // Canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', canonicalUrl);
    }

    // Additional meta tags
    if (additionalMetaTags) {
      Object.entries(additionalMetaTags).forEach(([name, content]) => {
        updateMetaTag(name, content);
      });
    }

    // Structured data (JSON-LD)
    if (structuredData) {
      // Remove existing structured data script
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Add new structured data
      try {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = structuredData;
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error adding structured data:', error);
      }
    }
  }, [title, description, keywords, canonicalUrl, robotsMeta, openGraph, twitterCard, structuredData, additionalMetaTags]);

  return null;
};

