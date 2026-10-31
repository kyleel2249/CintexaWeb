/**
 * SEO builders that need the blog data (article pages and the /blog index). Kept out of seo-pages.ts so pages that
 * do not touch the blog never download it.
 */
import type { PageSeoData } from "./careers-seo";
import { clip } from "./careers-seo";
import { POST_IMAGE_SIZE, getPost, postWordCount, postsNewestFirst, type Post } from "./blog-posts";
import { ROBOTS_INDEX, notFoundSeo, staticPageSeo } from "./seo-pages";
import { blogPostingNode, breadcrumbNode, graph, itemListNode, organizationNode, webPageNode, websiteNode, type Crumb } from "./seo-schema";
import { SITE_URL } from "./site-entity";

/** /blog index: the static page entry plus an ItemList of every article. */
export function blogListSeo(): PageSeoData {
  return staticPageSeo("/blog", [
    itemListNode(`${SITE_URL}/blog`, "CINTEXA articles", postsNewestFirst().map((p) => ({ name: p.title, path: `/blog/${p.slug}` }))),
  ])!;
}

export const blogPostUrl = (post: Pick<Post, "slug">): string => `${SITE_URL}/blog/${post.slug}`;

export const blogPostCrumbs = (post: Post): Crumb[] => [
  { name: "Home", path: "/" },
  { name: "Blog", path: "/blog" },
  { name: post.title, path: `/blog/${post.slug}` },
];

export function blogPostSeo(post: Post): PageSeoData {
  const url = blogPostUrl(post);
  const description = clip(post.excerpt, 160);
  return {
    title: post.title.length + 10 <= 65 ? `${post.title} | CINTEXA` : post.title,
    socialTitle: post.title,
    description,
    canonical: url,
    image: post.image,
    imageAlt: post.imageAlt,
    imageWidth: POST_IMAGE_SIZE.width,
    imageHeight: POST_IMAGE_SIZE.height,
    imageType: "image/jpeg",
    ogType: "article",
    twitterCard: "summary_large_image",
    robots: ROBOTS_INDEX,
    jsonLd: graph(
      organizationNode(),
      websiteNode(),
      webPageNode({
        url,
        name: post.title,
        description,
        type: "WebPage",
        image: post.image,
        imageWidth: POST_IMAGE_SIZE.width,
        imageHeight: POST_IMAGE_SIZE.height,
        datePublished: post.date,
        dateModified: post.updated ?? post.date,
        about: `${url}#article`,
      }),
      blogPostingNode({
        slug: post.slug,
        title: post.title,
        excerpt: description,
        image: post.image,
        imageWidth: POST_IMAGE_SIZE.width,
        imageHeight: POST_IMAGE_SIZE.height,
        date: post.date,
        updated: post.updated,
        category: post.category,
        keyword: post.keyword,
        wordCount: postWordCount(post),
      }),
      breadcrumbNode(url, blogPostCrumbs(post)),
    ),
  };
}

export function blogNotFoundSeo(): PageSeoData {
  return { ...notFoundSeo(), title: "Article not found | CINTEXA", socialTitle: "Article not found", canonical: `${SITE_URL}/blog` };
}

export function blogSeoForSlug(slug: string | undefined): PageSeoData {
  const post = getPost(slug);
  return post ? blogPostSeo(post) : blogNotFoundSeo();
}
