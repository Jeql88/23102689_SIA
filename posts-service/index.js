// index.js
const { ApolloServer, gql } = require('apollo-server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
`;

// Resolvers
const resolvers = {
  Query: {
    posts: async () => await prisma.post.findMany(),
    post: async (_, args) => await prisma.post.findUnique({ where: { id: args.id } }),
  },
  Mutation: {
    createPost: async (_, args) => {
      return await prisma.post.create({ data: { title: args.title, content: args.content } });
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
};

// Apollo Server setup
const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: 4002 }).then(({ url }) => {
  console.log(`🚀 Posts service ready at ${url}`);
});
