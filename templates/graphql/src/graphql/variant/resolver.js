const httpError = require('http-errors')

const variantMocks = [{ id: 1, name: 'Variant A', shortDescription: 'First variant.' }, { id: 2, name: 'Variant B', shortDescription: 'Second variant.' }]

exports.resolver = {
    Query: {
        variants(root, { id }, context) {
          const results = id ? variantMocks.filter(p => p.id == id) : variantMocks
          if (results)
            return results
          else
            throw httpError(404, `Variant with id ${id} does not exist.`)
        }
    }
}