import { HomeExperience } from "./home-experience";
import { getShopifyProducts, getShopifyArticles, getShopifyCollection, getShopifyCollections } from "../lib/shopify";

export const revalidate = 60; // Enable ISR so Shopify changes show up on Vercel

export default async function HomePage() {
  const products = await getShopifyProducts(100);
  const articles = await getShopifyArticles(3);
  const newArrivalsCollection = await getShopifyCollection('new-arrivals', 12);

  const blogs = articles.map(article => ({
    title: article.title,
    image: article.image || "/fabric-bg-clean.png",
    category: "Insights",
    link: `/blog/${article.blogHandle}/${article.handle}`
  }));

  const collections = await getShopifyCollections(250);

  return <HomeExperience products={products} blogs={blogs} newArrivals={newArrivalsCollection?.products} collections={collections} />;
}
