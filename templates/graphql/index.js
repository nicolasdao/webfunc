const { serveHTTP } = require('google-graphql-functions')
const { makeExecutableSchema } = require('graphql-tools')
const { glue } = require('schemaglue')

const { schema, resolver } = glue()

const executableSchema = makeExecutableSchema({
    typeDefs: schema,
    resolvers: resolver
})

const graphqlOptions = {
    schema: executableSchema,
    graphiql: true,
    endpointURL: "/graphiql",
    context: {} // add whatever global context is relevant to you app
}

exports.{{entryPoint}} = serveHTTP(graphqlOptions)