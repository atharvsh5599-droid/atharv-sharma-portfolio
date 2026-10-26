import { MetadataRoute } from 'next';

import { siteConfig } from '@/config/Meta';
import { getUnifiedPublishedBlogPosts } from '@/lib/blog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/work-experience`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/journey`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/resume`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  const publishedPosts = await getUnifiedPublishedBlogPosts();
  const blogRoutes: MetadataRoute.Sitemap = publishedPosts
    .filter((post) => post.frontmatter.published)
    .map((post) => {
      const parsedDate = new Date(post.frontmatter.date);
      const lastModified = !isNaN(parsedDate.getTime())
        ? parsedDate
        : new Date();

      return {
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified,
        changeFrequency: 'monthly',
        priority: 0.8,
      };
    });

  return [...staticRoutes, ...blogRoutes];
}
