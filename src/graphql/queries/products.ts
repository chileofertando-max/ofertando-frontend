import { gql } from "@apollo/client";

export const GET_PRODUCTS = gql`
  query getProducts(
    $categoryIdIn: [Int]
    $categorySlug: String
    $field: ProductsOrderByEnum = DATE
    $order: OrderEnum = DESC
  ) {
    products(
      first: 50
      where: {
        categoryIdIn: $categoryIdIn
        category: $categorySlug
        orderby: [{ field: $field, order: $order }]
      }
    ) {
      nodes {
        id
        name
        slug
        image {
          sourceUrl
        }
        ... on SimpleProduct {
          price
          regularPrice
        }
      }
    }
  }
`;

export const GET_PRODUCT_BY_SLUG = gql`
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      id
      name
      slug
      description
      shortDescription
      image {
        sourceUrl
        altText
      }
      galleryImages {
        nodes {
          sourceUrl
          altText
        }
      }
      ... on SimpleProduct {
        price
        regularPrice
        stockStatus
      }
      featured
      productCategories {
        nodes {
          name
          slug
        }
      }
    }
  }
`;

export const GET_FEATURED_PRODUCTS = gql`
  query GetFeaturedProducts($first: Int) {
    products(first: $first, where: { featured: true }) {
      nodes {
        id
        name
        slug
        description
        shortDescription
        image {
          sourceUrl
          altText
        }
        ... on SimpleProduct {
          price
          regularPrice
          stockStatus
        }
        featured
        productCategories {
          nodes {
            name
            slug
          }
        }
      }
    }
  }
`;

export const GET_PRODUCT_SLUGS = gql`
  query GetProductSlugs($first: Int) {
    products(first: $first) {
      nodes {
        slug
      }
    }
  }
`;

export const SEARCH_PRODUCTS = gql`
  query SearchProducts($search: String, $first: Int) {
    products(first: $first, where: { search: $search }) {
      nodes {
        id
        name
        slug
        image {
          sourceUrl
          altText
        }
        ... on SimpleProduct {
          price
          stockStatus
        }
      }
    }
  }
`;
