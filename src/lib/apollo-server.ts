import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

function makeClient() {
  const httpLink = createHttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: httpLink,
    defaultOptions: {
      query: {
        fetchPolicy: "no-cache",
      },
    },
  });
}

export const getClient = makeClient;
