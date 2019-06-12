// query, mutation, type will be worked in here.
const { buildSchema } = require('graphql');
// '!' means required field.
module.exports = buildSchema(`
  type TestData {
    text: String!
    views: Int!
  }
  type RootQuery {
    hello: TestData!
  }
  schema {
    query: RootQuery
  }
`);