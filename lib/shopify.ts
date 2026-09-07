import { createStorefrontApiClient } from '@shopify/storefront-api-client';

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN || '';
const publicAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '';

const API_VERSION = '2025-01';

export const storefrontClient = (domain && publicAccessToken)
  ? createStorefrontApiClient({
    storeDomain: domain,
    apiVersion: API_VERSION,
    publicAccessToken: publicAccessToken,
  })
  : null;

export async function shopifyFetch<T>({
  query,
  variables = {},
}: {
  query: string;
  variables?: any;
}): Promise<{ data: T } | never> {
  try {
    const response = await fetch(
      `https://${domain}/api/${API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': publicAccessToken,
        },
        body: JSON.stringify({ query, variables }),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from Shopify:', error);
    throw error;
  }
}

export const PRODUCTS_QUERY = `
  query getProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          id
          title
          handle
          description
          productType
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
          seo {
            title
            description
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          totalInventory
          variants(first: 1) {
            nodes {
              id
              sku
              quantityAvailable
              selectedOptions {
                name
                value
              }
            }
          }
          metafields(identifiers: [
            {namespace: "custom", key: "gsm"},
            {namespace: "custom", key: "shade"},
            {namespace: "shopify", key: "color"},
            {namespace: "standard", key: "color"},
            {namespace: "custom", key: "width"},
            {namespace: "custom", key: "composition"},
            {namespace: "custom", key: "knit_style"},
            {namespace: "custom", key: "usage"},
            {namespace: "custom", key: "fabric"},
            {namespace: "custom", key: "content"},
            {namespace: "custom", key: "type"}
          ]) {
            namespace
            key
            value
            reference {
              ... on Metaobject {
                fields {
                  key
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`;

export interface Fabric {
  id: string;
  sku: string;
  name: string;
  price: string;
  gsm: string;
  image: string;
  images: string[];
  composition: string;
  width: string;
  description: string;
  fabric?: string;
  content?: string;
  ounce?: string;
  knit_style?: string;
  shade?: string;
  usage?: string;
  type?: string;
  totalInventory?: number;
  weight?: string;
  variantId?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export function mapShopifyProduct(node: any): Fabric {
  const defaultFabric: Fabric = {
    id: '',
    sku: '',
    name: 'Untitled Product',
    price: '0',
    gsm: 'N/A',
    image: '',
    images: [],
    composition: 'N/A',
    width: 'N/A',
    description: '',
    shade: 'N/A',
    usage: 'N/A',
    type: 'N/A'
  };

  if (!node) return defaultFabric;

  const metafields = Array.isArray(node.metafields) ? node.metafields : [];

  const getMeta = (key: string) => {
    const m = metafields.find((m: any) => m?.key?.toLowerCase() === key.toLowerCase());
    return m?.value || 'N/A';
  };

  const variantNodes = node.variants?.nodes || node.variants?.edges?.map((edge: any) => edge.node) || [];
  const variantInventoryValues = variantNodes
    .map((variant: any) => variant?.quantityAvailable)
    .filter((quantity: any) => typeof quantity === 'number');
  const variantInventory = variantInventoryValues.length > 0
    ? variantInventoryValues.reduce((acc: number, quantity: number) => acc + quantity, 0)
    : undefined;

  const qtyMeta = getMeta('qty');
  const parsedQtyMeta = qtyMeta !== 'N/A' ? parseInt(qtyMeta, 10) : undefined;
  const totalInventory = typeof variantInventory === 'number'
    ? variantInventory
    : (typeof node.totalInventory === 'number'
      ? node.totalInventory
      : (typeof parsedQtyMeta === 'number' && !Number.isNaN(parsedQtyMeta) ? parsedQtyMeta : undefined));
  const firstVariant = variantNodes[0];
  const weight = firstVariant?.weight ? `${firstVariant.weight} ${firstVariant.weightUnit || 'kg'}` : undefined;

  const allImages = node.images?.edges?.map((e: any) => {
    const url = e.node?.url;
    return typeof url === 'string' ? url : '';
  }).filter(Boolean) || [];

  const fabricMeta = getMeta('fabric');
  const typeMeta = getMeta('type');

  const selectedOptions = firstVariant?.selectedOptions || [];
  const colorOption = selectedOptions.find((opt: any) =>
    opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'shade'
  );

  const colorMeta = metafields.find((m: any) =>
    (m?.namespace === 'shopify' && m?.key === 'color') ||
    (m?.namespace === 'standard' && m?.key === 'color') ||
    m?.key?.toLowerCase() === 'color'
  );

  const metafieldColor = (() => {
    if (!colorMeta) return undefined;
    if (colorMeta.reference?.fields) {
      const labelField = colorMeta.reference.fields.find((f: any) =>
        ['label', 'name', 'display_name', 'title'].includes(f.key.toLowerCase())
      );
      return labelField?.value || colorMeta.reference.fields[0]?.value;
    }
    return colorMeta.value;
  })();

  return {
    ...defaultFabric,
    id: node.handle || '',
    sku: firstVariant?.sku || node.id?.split('/').pop() || '',
    name: node.title || '',
    price: node.priceRange?.minVariantPrice?.amount || '0',
    gsm: getMeta('gsm'),
    image: allImages[0] || '',
    images: allImages,
    composition: getMeta('composition'),
    width: getMeta('width'),
    description: (node.description || '')
      .replace(/â€“/g, '-')
      .replace(/â€”/g, '-')
      .replace(/â€"/g, '"')
      .replace(/â€™/g, "'"),
    fabric: fabricMeta !== 'N/A' ? fabricMeta : (typeMeta !== 'N/A' ? typeMeta : 'N/A'),
    content: getMeta('content'),
    ounce: getMeta('ounce'),
    knit_style: getMeta('knit_style'),
    shade: (() => {
      const base = colorOption?.value || metafieldColor || getMeta('shade');
      if (base && base.startsWith('{')) {
        try { return JSON.parse(base).label || base; } catch (e) { return base; }
      }
      return base || 'N/A';
    })(),
    usage: getMeta('usage'),
    type: node.productType || 'N/A',
    totalInventory: typeof totalInventory === 'number' ? totalInventory : undefined,
    weight,
    variantId: firstVariant?.id || '',
    seoTitle: node.seo?.title || '',
    seoDescription: node.seo?.description || ''
  };
}

export async function getShopifyProducts(limit: number = 20, after: string | null = null): Promise<Fabric[]> {
  try {
    const response = await shopifyFetch<any>({
      query: PRODUCTS_QUERY,
      variables: { first: limit, after },
    });

    if (!response.data || !response.data.products) {
      return [];
    }

    return response.data.products.edges.map(({ node }: any) => mapShopifyProduct(node));
  } catch (err) {
    return [];
  }
}

export async function getAllShopifyProducts(): Promise<Fabric[]> {
  const allProducts: Fabric[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  try {
    while (hasNextPage) {
      const response: { data: any } = await shopifyFetch<any>({
        query: PRODUCTS_QUERY,
        variables: { first: 250, after: cursor },
      });

      if (!response.data || !response.data.products) {
        break;
      }

      const { edges, pageInfo } = response.data.products;
      const products = edges.map(({ node }: any) => mapShopifyProduct(node));
      allProducts.push(...products);

      hasNextPage = pageInfo?.hasNextPage || false;
      cursor = pageInfo?.endCursor || null;

      if (edges.length === 0) {
        break;
      }
    }
  } catch (err) {
    console.error('Error fetching all products:', err);
  }

  return allProducts;
}

export const COLLECTION_BY_HANDLE_QUERY = `
  query getCollectionByHandle($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      id
      title
      description
      seo {
        title
        description
      }
      products(first: $first) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            handle
            description
            productType
            images(first: 5) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            seo {
              title
              description
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            totalInventory
            variants(first: 1) {
              nodes {
                id
                sku
                quantityAvailable
                selectedOptions {
                  name
                  value
                }
              }
            }
            metafields(identifiers: [
              {namespace: "custom", key: "gsm"},
              {namespace: "custom", key: "shade"},
              {namespace: "shopify", key: "color"},
              {namespace: "standard", key: "color"},
              {namespace: "custom", key: "width"},
              {namespace: "custom", key: "composition"},
              {namespace: "custom", key: "knit_style"},
              {namespace: "custom", key: "usage"},
              {namespace: "custom", key: "fabric"},
              {namespace: "custom", key: "content"},
              {namespace: "custom", key: "type"}
            ]) {
              namespace
              key
              value
              reference {
                ... on Metaobject {
                  fields {
                    key
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export interface ShopifyCollection {
  id: string;
  title: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  products: Fabric[];
}

export async function getShopifyCollection(handle: string, limit: number = 250): Promise<ShopifyCollection | null> {
  try {
    const response = await shopifyFetch<any>({
      query: COLLECTION_BY_HANDLE_QUERY,
      variables: { handle, first: limit },
    });

    if (!response.data || !response.data.collection) {
      return null;
    }

    const { collection } = response.data;
    const products = collection.products.edges.map(({ node }: any) => mapShopifyProduct(node));

    return {
      id: collection.id,
      title: collection.title,
      description: collection.description || '',
      seoTitle: collection.seo?.title || '',
      seoDescription: collection.seo?.description || '',
      products
    };
  } catch (err) {
    console.error('Error fetching collection:', err);
    return null;
  }
}

export const COLLECTIONS_QUERY = `
  query getCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          title
          handle
          image {
            url
            altText
          }
        }
      }
    }
  }
`;

export interface ShopifyCollectionListItem {
  id: string;
  title: string;
  handle: string;
  image: string;
}

export async function getShopifyCollections(limit: number = 250): Promise<ShopifyCollectionListItem[]> {
  try {
    const response = await shopifyFetch<any>({
      query: COLLECTIONS_QUERY,
      variables: { first: limit },
    });

    if (!response.data || !response.data.collections) {
      return [];
    }

    return response.data.collections.edges.map(({ node }: any) => ({
      id: node.id,
      title: node.title,
      handle: node.handle,
      image: node.image?.url || '',
    }));
  } catch (err) {
    console.error('Error fetching collections:', err);
    return [];
  }
}

export const PRODUCT_BY_HANDLE_QUERY = `
  query getProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      description
      productType
      images(first: 10) {
        edges {
          node {
            url
            altText
          }
        }
      }
      seo {
        title
        description
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      totalInventory
      variants(first: 10) {
        nodes {
          id
          sku
          quantityAvailable
          weight
          weightUnit
          selectedOptions {
            name
            value
          }
        }
      }
      metafields(identifiers: [
        {namespace: "custom", key: "fabric"},
        {namespace: "custom", key: "content"},
        {namespace: "custom", key: "gsm"},
        {namespace: "custom", key: "ounce"},
        {namespace: "custom", key: "width"},
        {namespace: "shopify", key: "color"},
        {namespace: "standard", key: "color"},
        {namespace: "custom", key: "color"},
        {namespace: "custom", key: "knit_style"},
        {namespace: "custom", key: "shade"},
        {namespace: "custom", key: "usage"},
        {namespace: "custom", key: "type"}
      ]) {
        namespace
        key
        value
        reference {
          ... on Metaobject {
            fields {
              key
              value
            }
          }
        }
      }
    }
  }
`;

export const FILE_BY_NAME_QUERY = `
  query getFileByName($query: String!) {
    files(first: 1, query: $query) {
      edges {
        node {
          ... on Video {
            id
            sources {
              url
              format
              mimeType
            }
          }
          ... on GenericFile {
            id
            url
          }
        }
      }
    }
  }
`;

export async function getShopifyProduct(handle: string): Promise<Fabric | null> {
  try {
    const response = await shopifyFetch<any>({
      query: PRODUCT_BY_HANDLE_QUERY,
      variables: { handle },
    });

    if (response.data?.product) {
      return mapShopifyProduct(response.data.product);
    }

    const all = await getShopifyProducts(50);
    return all.find(p => p.id === handle) || null;
  } catch (err) {
    return null;
  }
}

/**
 * Fetches a video CDN URL from Shopify by its Filename.
 */
export async function getShopifyVideoUrl(fileName: string): Promise<string | null> {
  try {
    if (/^\d+$/.test(fileName)) {
      return getShopifyVideoUrlById(fileName);
    }

    const cleanName = fileName.replace(/\.[^/.]+$/, "");

    const response = await shopifyFetch<any>({
      query: FILE_BY_NAME_QUERY,
      variables: { query: `filename:${cleanName}` },
    });

    const fileNode = response.data?.files?.edges?.[0]?.node;
    if (!fileNode) return null;

    if (fileNode.sources) {
      const mp4Source = fileNode.sources
        .filter((s: any) => s.mimeType === 'video/mp4')
        .sort((a: any) => a.url.includes('1080p') ? -1 : 1)[0];

      return mp4Source?.url || fileNode.sources[0].url;
    }

    return (fileNode as any).url || null;
  } catch (error) {
    console.error("Error fetching Shopify video URL:", error);
    return null;
  }
}

/**
 * Fetches a video CDN URL from Shopify by its numerical ID or GID.
 */
export async function getShopifyVideoUrlById(id: string): Promise<string | null> {
  try {
    const gid = id.startsWith('gid://') ? id : `gid://shopify/Video/${id}`;

    const response = await shopifyFetch<any>({
      query: `
        query getFileById($id: ID!) {
          node(id: $id) {
            ... on Video {
              id
              sources {
                url
                mimeType
              }
            }
          }
        }
      `,
      variables: { id: gid },
    });

    const fileNode = response.data?.node;
    if (!fileNode) return null;

    if (fileNode.sources) {
      const mp4Source = fileNode.sources
        .filter((s: any) => s.mimeType === 'video/mp4')
        .sort((a: any) => a.url.includes('1080p') ? -1 : 1)[0];

      return mp4Source?.url || fileNode.sources[0].url;
    }

    return null;
  } catch (error) {
    console.error("Error fetching Shopify video by ID:", error);
    return null;
  }
}

/**
 * Creates a Shopify cart and returns the checkout URL.
 */
export async function createCheckout(items: { variantId: string, quantity: number }[]): Promise<string | null> {
  try {
    const lines = items.map(item => ({
      merchandiseId: item.variantId,
      quantity: item.quantity
    }));

    console.log("Creating Shopify cart with lines:", JSON.stringify(lines, null, 2));

    const response = await shopifyFetch<any>({
      query: `
        mutation cartCreate($input: CartInput!) {
          cartCreate(input: $input) {
            cart {
              checkoutUrl
            }
            userErrors {
              code
              field
              message
            }
          }
        }
      `,
      variables: {
        input: {
          lines
        }
      }
    });

    const cart = response.data?.cartCreate?.cart;
    const errors = response.data?.cartCreate?.userErrors;

    if (errors && errors.length > 0) {
      console.error("Shopify Cart Errors:", errors);
      return null;
    }

    return cart?.checkoutUrl || null;
  } catch (error) {
    console.error("Error creating Shopify cart:", error);
    return null;
  }
}

export const ARTICLES_QUERY = `
  query getArticles($first: Int!) {
    articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
      edges {
        node {
          id
          title
          handle
          excerpt
          publishedAt
          image {
            url
            altText
          }
          blog {
            handle
            title
          }
        }
      }
    }
  }
`;

export interface ShopifyArticle {
  id: string;
  title: string;
  handle: string;
  excerpt: string;
  publishedAt: string;
  image: string;
  blogHandle: string;
  blogTitle: string;
}

export async function getShopifyArticles(limit: number = 10): Promise<ShopifyArticle[]> {
  try {
    const response = await shopifyFetch<any>({
      query: ARTICLES_QUERY,
      variables: { first: limit },
    });

    if (!response.data || !response.data.articles) {
      return [];
    }

    return response.data.articles.edges.map(({ node }: any) => ({
      id: node.id,
      title: node.title,
      handle: node.handle,
      excerpt: node.excerpt || '',
      publishedAt: node.publishedAt,
      image: node.image?.url || '',
      blogHandle: node.blog?.handle || 'news',
      blogTitle: node.blog?.title || 'News'
    }));
  } catch (err) {
    console.error('Error fetching articles:', err);
    return [];
  }
}

export const ARTICLE_BY_HANDLE_QUERY = `
  query getArticleByHandle($blogHandle: String!, $articleHandle: String!) {
    blog(handle: $blogHandle) {
      title
      articleByHandle(handle: $articleHandle) {
        id
        title
        contentHtml
        excerpt
        publishedAt
        tags
        image {
          url
          altText
        }
        authorV2 {
          name
        }
        seo {
          title
          description
        }
        comments(first: 10) {
          edges {
            node {
              id
              contentHtml
              author {
                name
                email
              }
            }
          }
        }
        metafields(identifiers: [
          {namespace: "custom", key: "reading_time"},
          {namespace: "custom", key: "subtitle"}
        ]) {
          key
          value
        }
      }
    }
  }
`;

export async function getShopifyArticle(blogHandle: string, articleHandle: string) {
  try {
    const response = await shopifyFetch<any>({
      query: ARTICLE_BY_HANDLE_QUERY,
      variables: { blogHandle, articleHandle },
    });

    if (response.data?.blog?.articleByHandle) {
      return {
        ...response.data.blog.articleByHandle,
        blog: {
          title: response.data.blog.title
        }
      };
    }
    return null;
  } catch (err) {
    console.error('Error fetching article:', err);
    return null;
  }
}
