// Model Derivative module

var request = require('request');
var config = require('./config');
var trim = require('trim');
var util = require('util');

/////////////////////////////////////////////////////////////////
// All the handlers for the various end points that our
// server supports
/////////////////////////////////////////////////////////////////
module.exports = {
     getFormats: function (env, token, onsuccess, onerror) {
        makeRequest(config.formats, env, token, "GET", null, function (body) {
            onsuccess(body);
        }, function (msg) {
                onerror(msg);
            }
        );
    },

    getManifest: function (env, token, urn, onsuccess, onerror) {
        makeRequest(config.manifest(urn), env, token, "GET", null, function (body) {
            onsuccess(body);
        }, function (msg) {
                onerror(msg);
            }
        );
    },

    delManifest: function (env, token, urn, onsuccess, onerror) {
        makeRequest(config.manifest(urn), env, token, "DELETE", null, function (body) {
            onsuccess(body);
        }, function (msg) {
                onerror(msg);
            }
        );
    },

    getThumbnail: function (env, token, urn, onsuccess, onerror) {
        request({
            url: config.baseURL(env) + config.thumbnail(urn),
            method: 'GET',
            encoding: null,
            headers: {
                'Authorization': 'Bearer ' + token
            },
        }, function (error, response, body) {
            if (error) {
                console.log(error);
                onerror(error);
                return;
            }

            if (response && [200, 201].indexOf(response.statusCode) < 0) {
                console.log(response.statusMessage);
                onerror(response.statusMessage);
                return;
            }

            console.log(body);
            onsuccess(body, response.headers);
        })
    },

    getMetadata: function (env, token, urn, onsuccess, onerror) {
        makeRequest(config.metadata(urn), env, token, "GET", null, function (body) {
            onsuccess(body);
        }, function (msg) {
                onerror(msg);
            }
        );
    },

    getHierarchy: function (env, token, urn, guid, onsuccess, onerror) {
        makeRequest(config.hierarchy(urn, guid), env, token, "GET", null,
            function (body) {
                onsuccess(body);
            }, function (msg) {
                onerror(msg);
            }
        );
    },

    getProperties: function (env, token, urn, guid, onsuccess, onerror) {
        makeRequest(config.properties(urn, guid), env, token, "GET", null,
            function (body) {
                onsuccess(body);
            }, function (msg) {
                onerror(msg);
            }
        );
    },

    getDownload: function (env, token, urn, derUrn, onsuccess, onerror) {
        derUrn = encodeURIComponent(derUrn);
        makeRequest(config.download(urn, derUrn), env, token, "GET", null,
            function (body, headers) {
                onsuccess(body, headers);
            }, function (msg) {
                onerror(msg);
            }
        );
    },

    postJobExport: function (env, token, urn, format, rootFileName, fileExtType, advanced, onsuccess, onerror) {
        var item = {
            "type": format
        };

        if (format === 'svf') {
            item.views = ['2d', '3d'];
        }

        if (advanced) {
            item.advanced = advanced;
        }

        makeRequest(config.job, env, token, "POST", {
            "input": (fileExtType && fileExtType === 'versions:autodesk.a360:CompositeDesign' ? {
                "urn": urn,
                "rootFilename": rootFileName,
                "compressedUrn": true
            } : { "urn": urn }),
            "output": {
                "destination": {
                    "region": "us"
                },
                "formats": [item]
            }
        }, function (body) {
            // copying content
            body = JSON.parse(JSON.stringify(body));
            onsuccess(body);
        }, function (msg) {
            onerror(msg);
        });
    }
}

/////////////////////////////////////////////////////////////////
// Helper to create the requests we pass to the Autodesk server
/////////////////////////////////////////////////////////////////
function makeRequest(resource, env, token, verb, body, onsuccess, onerror) {
    if (!env) {
        console.log('No environment (dev, stg, prod) defined! And token is + ' + token);
        onerror('No environment (dev, stg, prod) defined!');
        return;
    }

    console.log('Making request to ' + resource + ' with following body:');
    console.log(util.inspect(body, false, null));

    console.log('Requesting ' + config.baseURL(env) + resource);
    if (verb === "POST") {
        request({
            url: config.baseURL(env) + resource,
            method: verb,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json; charset=utf-8'
            },
            json: true,
            body: body
        }, function (error, response, body) {
            if (error) {
                console.log(error);
                onerror(error);
                return;
            }

            if (response && [200, 201].indexOf(response.statusCode) < 0) {
                console.log(response.statusMessage);
                onerror(response.statusMessage);
                return;
            }

            console.log(body);
            onsuccess(body, response.headers);
        })
    } else {
        request({
            url: config.baseURL(env) + resource,
            method: verb,
            headers: {
                'Authorization': 'Bearer ' + token
            },
        }, function (error, response, body) {
            if (error) {
                console.log(error);
                onerror(error);
                return;
            }

            // Handle 'Created' and 'Accepted' messages
            if ([201, 202].indexOf(response.statusCode) >= 0) {
                console.log(response.statusMessage);
                onsuccess('{ "result": "' + response.statusMessage.toLowerCase() + '"}');
                return;
            }

            if (response && response.statusCode !== 200) {
                console.log(response.statusMessage);
                onerror(response.statusMessage);
                return;
            }

            console.log(body);
            onsuccess(body, response.headers);
        })
    }
}
