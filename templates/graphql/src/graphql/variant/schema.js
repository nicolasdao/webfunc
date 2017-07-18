exports.schema = `
type Variant {
  id: ID!
  name: String!
  shortDescription: String
}
`
// Notice that we have omitted to wrap the above with 'type Query { }'
exports.query = `
  # ### GET variants
  #
  # _Arguments_
  # - **id**: Variant's id (optional)
  variants(id: Int): [Variant]
`