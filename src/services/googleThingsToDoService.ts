/**
 * Xenios Google Things to Do (GTTD) Feeds API Service
 * Generates Official Google Things to Do XML/JSON Product & Availability Catalog Feeds
 */

import experiencesData from '../data/experiences.json';

export class GoogleThingsToDoService {
  /**
   * 1. Google Things to Do Resmi XML Ürün Akışı (generateGTTDXmlFeed)
   */
  static generateGTTDXmlFeed(baseUrl: string = 'https://xenios.usecomus.com'): string {
    const experiences = experiencesData || [];

    const xmlLines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<feed xmlns="http://www.google.com/schemas/things_to_do/v1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
      `  <feed_metadata>`,
      `    <provider_id>purely_istanbul_official</provider_id>`,
      `    <provider_name>purelyİstanbul Luxury Experiences</provider_name>`,
      `    <updated_at>${new Date().toISOString()}</updated_at>`,
      `  </feed_metadata>`,
      `  <products>`
    ];

    experiences.forEach((exp: any) => {
      const landingPageUrl = `${baseUrl}/experiences?highlight=${exp.id}`;
      const imageUrl = exp.image ? `${baseUrl}${exp.image}` : `${baseUrl}/images/istanbul/original-01e444cfc86c4f9c67b96a846b840aa0.webp`;
      const lat = exp.coords?.lat || 41.0082;
      const lng = exp.coords?.lng || 28.9784;

      xmlLines.push(`    <product>`);
      xmlLines.push(`      <product_id>${exp.id}</product_id>`);
      xmlLines.push(`      <title><![CDATA[${exp.title}]]></title>`);
      xmlLines.push(`      <description><![CDATA[${exp.agentNote || exp.title} - Provided by ${exp.provider}]]></description>`);
      xmlLines.push(`      <category><![CDATA[${exp.category || 'Tours & Activities'}]]></category>`);
      xmlLines.push(`      <landing_page_url>${landingPageUrl}</landing_page_url>`);
      xmlLines.push(`      <booking_url>${landingPageUrl}&amp;action=book</booking_url>`);
      xmlLines.push(`      <operator>`);
      xmlLines.push(`        <name><![CDATA[${exp.provider}]]></name>`);
      xmlLines.push(`        <phone_number>${exp.phone || '+90 212 500 00 00'}</phone_number>`);
      xmlLines.push(`      </operator>`);
      xmlLines.push(`      <inventory>`);
      xmlLines.push(`        <availability_type>REAL_TIME</availability_type>`);
      xmlLines.push(`        <price>`);
      xmlLines.push(`          <currency>${exp.currency || 'EUR'}</currency>`);
      xmlLines.push(`          <amount>${exp.price || 50}</amount>`);
      xmlLines.push(`        </price>`);
      xmlLines.push(`      </inventory>`);
      xmlLines.push(`      <media>`);
      xmlLines.push(`        <image_url>${imageUrl}</image_url>`);
      xmlLines.push(`      </media>`);
      xmlLines.push(`      <location>`);
      xmlLines.push(`        <address><![CDATA[${exp.location || 'Istanbul, Turkey'}]]></address>`);
      xmlLines.push(`        <latitude>${lat}</latitude>`);
      xmlLines.push(`        <longitude>${lng}</longitude>`);
      xmlLines.push(`      </location>`);
      xmlLines.push(`      <rating>`);
      xmlLines.push(`        <average_rating>${exp.rating || 4.9}</average_rating>`);
      xmlLines.push(`      </rating>`);
      xmlLines.push(`    </product>`);
    });

    xmlLines.push(`  </products>`);
    xmlLines.push(`</feed>`);

    return xmlLines.join('\n');
  }

  /**
   * 2. JSON Formatında Feed (GTTD REST API Entegratörleri için)
   */
  static generateGTTDJsonFeed(baseUrl: string = 'https://purelyistanbul.usecomus.com'): Record<string, any> {
    const experiences = experiencesData || [];

    return {
      provider_id: 'purely_istanbul_official',
      provider_name: 'purelyİstanbul Luxury Experiences',
      updated_at: new Date().toISOString(),
      products_count: experiences.length,
      products: experiences.map((exp: any) => ({
        product_id: exp.id,
        title: exp.title,
        description: exp.agentNote || exp.title,
        operator: exp.provider,
        price: exp.price,
        currency: exp.currency || 'EUR',
        landing_page_url: `${baseUrl}/experiences?highlight=${exp.id}`,
        image_url: exp.image ? `${baseUrl}${exp.image}` : undefined,
        location: {
          name: exp.location,
          latitude: exp.coords?.lat,
          longitude: exp.coords?.lng
        }
      }))
    };
  }
}
