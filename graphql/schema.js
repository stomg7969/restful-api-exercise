// query, mutation, type will be worked in here.
const { buildSchema } = require('graphql');
// '!' means required field.
module.exports = buildSchema(`
  type Post {
    _id: ID!
    title: String!
    content: String!
    imageUrl: String!
    creator: User!
    createdAt: String!
    updatedAt: String!
  }
  type User {
    _id: ID!
    name: String!
    email: String!
    password: String
    status: String!
    posts: [Post!]!
  }
  type AuthData {
    token: String!
    userId: String!
  }
  type PostData {
    posts: [Post!]!
    totalPosts: Int!
  }

  input UserInputData {
    email: String!
    name: String!
    password: String!
  }
  input PostInputData {
    title: String!
    content: String!
    imageUrl: String!
  }

  type RootQuery {
    login(email: String!, password: String!): AuthData!
    posts(page: Int): PostData!
    post(id: ID!): Post!
    user: User!
  }
  type RootMutation {
    createUser(userInput: UserInputData): User!
    createPost(postInput: PostInputData): Post!
    updatePost(id: ID!, postInput: PostInputData): Post!
    deletePost(id: ID!): Boolean
    updateStatus(status: String!): User!
  }
  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);
// in RootQuery, posts have page. This is for pagination purpose.
// ... it doesn't require any args since it's just fetching.
// ||********************************************||
// ||IMPORTANT NOTE FOR FRONTEND writing queries.||
// ||********************************************|| 
/*
// This query is dynamic, but this can be optimized.
// There is GraphQL syntax that I can use for dynamic queries.
const graphqlQuery = {
  query: `
    mutation {
      updateStatus(status: "${this.state.status}") {
        status
      }
    }
  `
};
// *********** This will become ... ***********
const graphqlQuery = {
  query: `
    mutation StatusUpdate($status: String!) {
      updateStatus(status: $status) {
        status
      }
    }
  `, (<-- comma here!!!!!)
    variables: {
      status: this.state.status
    }
};
//
*/