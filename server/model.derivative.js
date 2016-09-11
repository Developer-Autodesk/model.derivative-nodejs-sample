'use strict'; // http://www.w3schools.com/js/js_strict.asp

// token handling in session
var token = require('./token');

// web framework
var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var forgeMD = require('forge-model-derivative');

/////////////////////////////////////////////////////////////////
// Get the list of export file formats supported by the
// Model Derivative API
/////////////////////////////////////////////////////////////////
function getForgeMD(req) {
    var tokenSession = new token(req.session);
    forgeMD.ApiClient.instance.authentications ['oauth2_access_code'].accessToken =
        tokenSession.getTokenInternal();

    return new forgeMD.DerivativesApi();
}

/////////////////////////////////////////////////////////////////
// Get the list of export file formats supported by the
// Model Derivative API
/////////////////////////////////////////////////////////////////
router.get('/formats', function (req, res) {
    var derivatives = getForgeMD(req);

    derivatives.getFormats()
        .then(function(formats){
            res.json(formats);
        })
        .catch(function (error) {
            res.status(500).end(error);
        });
});

/////////////////////////////////////////////////////////////////
// Get the manifest of the given file. This will contain
// information about the various formats which are currently
// available for this file
/////////////////////////////////////////////////////////////////
router.get('/manifests/:urn', function (req, res) {
    var derivatives = getForgeMD(req);

    derivatives.getManifest(req.params.urn)
        .then(function (data) {
            res.json(data);
        })
        .catch(function (error) {
            res.status(500).end(msg);
        });
});

router.delete('/manifests/:urn', function (req, res) {
    md.delManifest(req.session.env, req.session.oauthcode, req.params.urn,
        function (data) {
            res.set('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(data));
        },
        function (code, msg) {
            res.status(code).end(msg);
        }
    );
});

/////////////////////////////////////////////////////////////////
// Get the metadata of the given file. This will provide us with
// the guid of the avilable models in the file
/////////////////////////////////////////////////////////////////
router.get('/metadatas/:urn', function (req, res) {
    var derivatives = getForgeMD(req);

    derivatives.getMetadata(req.params.urn)
        .then(function (data) {
            res.json(data);
        })
        .catch(function (error) {
            res.status(500).end(msg);
        });
});

/////////////////////////////////////////////////////////////////
// Get the hierarchy information for the model with the given
// guid inside the file with the provided urn
/////////////////////////////////////////////////////////////////
router.get('/hierarchy', function (req, res) {
    var derivatives = getForgeMD(req);

    derivatives.getModelviewMetadata(req.query.urn, req.query.guid)
        .then(function (data) {
            res.json(data);
        })
        .catch(function (error) {
            res.status(500).end(msg);
        });
});

/////////////////////////////////////////////////////////////////
// Get the properties for all the components inside the model
// with the given guid and file urn
/////////////////////////////////////////////////////////////////
router.get('/properties', function (req, res) {
    var derivatives = getForgeMD(req);

    derivatives.getModelviewProperties(req.query.urn, req.query.guid)
        .then(function (data) {
            res.json(data);
        })
        .catch(function (error) {
            res.status(500).end(msg);
        });
});

/////////////////////////////////////////////////////////////////
// Download the given derivative file, e.g. a STEP or other
// file format which are associated with the model file
/////////////////////////////////////////////////////////////////
router.get('/download', function (req, res) {
    var fileName = req.query.fileName;
    var urn = req.query.derUrn;
    md.getDownload(req.session.env, req.session.oauthcode, req.query.urn, req.query.derUrn,
        function (data, headers) {
            var fileExt = fileName.split('.')[1];
            res.set('content-type', 'application/' + fileExt);
            res.set('Content-Disposition', 'attachment; filename="' + fileName +'"');
            res.end(data);
        },
        function (code, msg) {
            res.status(code).end(msg);
        }
    );
});

/////////////////////////////////////////////////////////////////
// Send a translation request in order to get an SVF or other
// file format for our file
/////////////////////////////////////////////////////////////////
router.post('/export', jsonParser, function (req, res) {
    //env, token, urn, format, rootFileName, fileExtType, advanced
    var item = {
        "type": req.body.format
    };

    if (req.body.format === 'svf') {
        item.views = ['2d', '3d'];
    }

    if (req.body.advanced) {
        item.advanced = req.body.advanced;
    }

    var input = (req.body.fileExtType && req.body.fileExtType === 'versions:autodesk.a360:CompositeDesign' ? {
        "urn": urn,
        "rootFilename": req.body.rootFileName,
        "compressedUrn": true
    } : { "urn": req.body.urn });
    var output = {
        "destination": {
            "region": "us"
        },
        "formats": [item]
    };

    var derivatives = getForgeMD(req);

    derivatives.translate({"input": input, "output": output })
        .then(function (data) {
            res.json(data);
        })
        .catch(function (error) {
            res.status(500).end(msg);
        });
});

/////////////////////////////////////////////////////////////////
// Return the router object that contains the endpoints
/////////////////////////////////////////////////////////////////
module.exports = router;