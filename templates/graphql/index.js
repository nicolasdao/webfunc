const { serveHTTP } = require('google-graphql-functions')
const { executableSchema } = require('./src/schema')

const graphqlOptions = {
    schema: executableSchema,
    graphiql: true,
    endpointURL: "/graphiql"
}

/**
 * Responds to any HTTP request.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.{{entryPoint}} = serveHTTP(graphqlOptions)