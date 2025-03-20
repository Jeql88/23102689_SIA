const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const { createServer } = require('http');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/use/ws');
const { PrismaClient } = require('@prisma/client');
const { PubSub } = require('graphql-subscriptions');
const { execute, subscribe } = require('graphql');
const { gql } = require('apollo-server-core');

const prisma = new PrismaClient();
const pubsub = new PubSub();

// GraphQL schema
const typeDefs = gql`
  type Post {
    id: Int!
    title: String!
    content: String!
  }

  type Query {
    posts: [Post!]!
    post(id: Int!): Post
  }

  type Mutation {
    createPost(title: String!, content: String!): Post!
    updatePost(id: Int!, title: String, content: String): Post!
    deletePost(id: Int!): Post!
  }

  type Subscription {
    postAdded: Post!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    posts: async () => await prisma.post.findMany(),
    post: async (_, args) => await prisma.post.findUnique({ where: { id: args.id } }),
  },
  Mutation: {
    createPost: async (_, args) => {
      const post = await prisma.post.create({ data: { title: args.title, content: args.content } });
      pubsub.publish('POST_ADDED', { postAdded: post }); // Publish event
      return post;
    },
    updatePost: async (_, args) => {
      return await prisma.post.update({
        where: { id: args.id },
        data: { title: args.title, content: args.content },
      });
    },
    deletePost: async (_, args) => {
      return await prisma.post.delete({ where: { id: args.id } });
    },
  },
  Subscription: {
    postAdded: {
      subscribe: () => pubsub.asyncIterableIterator(['POST_ADDED']),
    },
  },
};

// Create schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Express app setup
const app = express();
const httpServer = createServer(app);

// WebSocket Server for Subscriptions
const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });

useServer({ schema, execute, subscribe }, wsServer);

// Apollo Server instance
const server = new ApolloServer({
  schema,
  plugins: [
    {
      async serverWillStart() {
        return {
          async drainServer() {
            wsServer.close();
          },
        };
      },
    },
  ],
});

// Apply middleware and start server
(async () => {
  await server.start();
  server.applyMiddleware({ app });

  httpServer.listen(4002, () => {
    console.log(`🚀 Posts service ready at http://localhost:4002${server.graphqlPath}`);
    console.log(`🚀 WebSocket server ready at ws://localhost:4002/graphql`);
  });
})();
