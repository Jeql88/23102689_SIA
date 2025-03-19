import { request } from 'graphql-request';
import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const USERS_API = 'http://localhost:4001/graphql';
const POSTS_API = 'http://localhost:4002/graphql';
const POSTS_WS_API = 'ws://localhost:4002/graphql';

// Fetch users
export const fetchUsers = async () => {
  const query = `{
    users {
      id
      name
      email
    }
  }`;
  return request(USERS_API, query);
};

// Fetch posts
export const fetchPosts = async () => {
  const query = `{
    posts {
      id
      title
      content
    }
  }`;
  return request(POSTS_API, query);
};

// Setup WebSocket link
const httpLink = new HttpLink({ uri: POSTS_API });

const wsLink = new GraphQLWsLink(
  createClient({ url: POSTS_WS_API })
);

// Use WebSocket for subscriptions, HTTP for queries/mutations
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

// Apollo Client instance
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
