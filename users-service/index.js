// index.js
const { ApolloServer, gql } = require('apollo-server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GraphQL schema
const typeDefs = gql`
  type User {
    id: Int!
    name: String!
    email: String!
  }

  type Query {
    users: [User!]!
    user(id: Int!): User
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
    updateUser(id: Int!, name: String, email: String): User!
    deleteUser(id: Int!): User!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    users: async () => await prisma.user.findMany(),
    user: async (_, args) => await prisma.user.findUnique({ where: { id: args.id } }),
  },
  Mutation: {
    createUser: async (_, args) => {
      return await prisma.user.create({ data: { name: args.name, email: args.email } });
    },
    updateUser: async (_, args) => {
      return await prisma.user.update({
        where: { id: args.id },
        data: { name: args.name, email: args.email },
      });
    },
    deleteUser: async (_, args) => {
      return await prisma.user.delete({ where: { id: args.id } });
    },
  },
};

// Apollo Server setup
const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: 4001 }).then(({ url }) => {
  console.log(`🚀 Users service ready at ${url}`);
});
