const http = require('http');
const https = require('https');

const httpAgent = new http.Agent({
	keepAlive: true
});
const httpsAgent = new https.Agent({
	keepAlive: true
});

const optionsBase = {
	agent: function(_parsedURL) {
		if (_parsedURL.protocol == 'http:') {
			return httpAgent;
		} else {
			return httpsAgent;
		}
	}
};

const fetch = require("node-fetch");

/**
 * node-fetch that reuses agents. 
 *
 * @param {string} url
 * @param {fetch.RequestInfo} options
 */
module.exports = function (url, options) {
    return fetch(url, {
        ...optionsBase,
        ...options
    });
}