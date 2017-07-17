const { serveHttp } = require('webfunc')

/**
 * Responds to any HTTP request.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.{{entryPoint}} = serveHttp((req, res) => {
	res.status(200).send('Hello World')
})