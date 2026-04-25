import { gql } from "@apollo/client";

export const GET_PAGE_BY_URI = gql`
  query GetPageByUri($uri: String!) {
    nodeByUri(uri: $uri) {
      ... on Page {
        id
        title
        content(format: RENDERED)
        contentRendered: content(format: RENDERED)
      }
    }
  }
`;

export const GET_LANDING_PAGE = gql`
  query GetLandingPage($id: ID!, $idType: PageIdType!) {
    page(id: $id, idType: $idType) {
      camposLanding {
        textoHero
        subtitulo
        fondoHero {
          node {
            sourceUrl
          }
        }
      }
    }
  }
`;
