const httpError = require('http-errors')

const productMocks = [{ id: 1, name: 'Product A', shortDescription: 'First product.' }, { id: 2, name: 'Product B', shortDescription: 'Second product.' }]

exports.resolver = {
    Query: {
        products(root, { id }, context) {
          const results = id ? productMocks.filter(p => p.id == id) : productMocks
          if (results)
            return results
          else
            throw httpError(404, `Product with id ${id} does not exist.`)
        }
    }
}