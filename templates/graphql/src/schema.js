const makeExecutableSchema = require('graphql-tools').makeExecutableSchema
const _ = require('lodash')
const httpError = require('http-errors')

// Replace 
const schema = `
type Product {
  id: ID!
  name: String!
  shortDescription: String
}

type Query {
  # ### GET products
  #
  # _Arguments_
  # - **id**: Product's id (optional)
  products(id: Int): [Product]
}

schema {
  query: Query
}
`
const productMocks = [{ id: 1, name: 'Product A', shortDescription: 'First product.' }, { id: 2, name: 'Product B', shortDescription: 'Second product.' }]
const productResolver = {
  Query: {
    products(root, { id }, context) {
      const results = id ? _(productMocks).filter(p => p.id == id) : productMocks
      if (results)
        return results
      else
        throw httpError(404, `Product with id ${id} does not exist.`)
    }
  }
}

const executableSchema = makeExecutableSchema({
	typeDefs: schema,
	// This seems silly to use merge here as there is only one resolver.
	// We could have written: 'resolvers: productResolver'
	// In reality, you'd probably have more than one resolver: 'resolvers: _.merge(productResolver, userResolver)'
	resolvers: _.merge(productResolver) 
})

module.exports = {
	executableSchema
}