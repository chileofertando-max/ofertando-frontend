import { gql } from "@apollo/client";

export const GET_CATEGORIES = gql`
  query GetCategories($first: Int) {
    productCategories(first: $first) {
      nodes {
        id
        databaseId
        name
        slug
        description
        image {
          sourceUrl
          altText
        }
        count
        parent {
          node {
            databaseId
          }
        }
      }
    }
  }
`;

export const GET_CATEGORY_BY_SLUG = gql`
  query GetCategoryBySlug($slug: ID!) {
    productCategory(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      description
      image {
        sourceUrl
        altText
      }
      count
      parent {
        node {
          databaseId
        }
      }
    }
  }
`;
