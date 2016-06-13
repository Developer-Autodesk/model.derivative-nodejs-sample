var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var config = require('./config');
var OAuth2 = require('oauth').OAuth2;

var lmv = require("view-and-data");

var formidable = require('formidable');
var fs = require('fs');
var path = require('path');
var async = require('async');

var dm = require("./dm"); // Data Management API
var md = require("./md"); // Model Derivative API


/////////////////////////////////////////////////////////////////
// Gets the information about the files we previously uploaded
// to our own bucket on OSS
/////////////////////////////////////////////////////////////////
router.get('/myfiles', function (req, res) {
    var bucketName = getBucketName(req);
    bucketName = encodeURIComponent(bucketName);
    dm.getObjectsInBucket(req.session.env, req.session.oauthcode, bucketName, function(data) {
        var datas = [];
        var asyncTasks = [];
        for (var key in data.items) {
            var obj = data.items[key];
            (function (objectKey) {
                asyncTasks.push(function (callback) {
                    objectKey = encodeURIComponent(objectKey);
                    dm.getObjectDetails(req.session.env, req.session.oauthcode, bucketName, objectKey, function(data) {
                        datas.push(data);
                        callback();
                    });
                });
            })(obj.objectKey);
        }

        // Get back all the results
        async.parallel(asyncTasks, function(err) {
            // All tasks are done now
            res.json(datas);
        });
    });
});

/////////////////////////////////////////////////////////////////
// Upload a file to our own bucket on OSS
//
/////////////////////////////////////////////////////////////////
router.post('/myfiles', jsonParser, function (req, res) {
    var fileName ='' ;
    var form = new formidable.IncomingForm () ;

    // Make sure the folder for the data exists
    var bucketName = getBucketName(req);

    // Only this folder works on heroku
    form.uploadDir = '/tmp';

    form
        .on ('field', function (field, value) {
            console.log (field, value) ;
        })
        .on ('file', function (field, file) {
            console.log (field, file) ;
            fs.rename (file.path, form.uploadDir + '/' + file.name) ;
            fileName = file.name ;
        })
        .on ('end', function () {
            console.log ('-> upload done') ;
            if ( fileName == '' ) {
                res.status(500).end('No file submitted!');
            }
            // Now upload it to OSS
            var bucketCreationData = {
                bucketKey: bucketName,
                servicesAllowed: {},
                policyKey: 'transient'
            };

            // Getting a new key
            lmv.initialize().then(
                // initialize success
                function() {
                    // Getting the bucket
                    lmv.getBucket(bucketName, true, bucketCreationData).then(
                        // getBucket success
                        function() {
                            // Uploading the file
                            var tmpFileName = path.join(form.uploadDir, fileName);
                            lmv.upload(
                                tmpFileName,
                                bucketName,
                                fileName).then(
                                // upload success
                                function(uploadInfo){
                                    // Send back the data
                                    res.json(uploadInfo);
                                },
                                // upload error
                                function(err) {
                                    res.status(500).end('Could not upload file into bucket!');
                                }
                            );
                        },
                        // getBucket error
                        function(err) {
                            res.status(500).end('Could not create bucket for file!');
                        }
                    );
                },
                // initialize error
                function (err) {
                    res.status(500).end('Could not get access token!');
                }
            );
        });

    form.parse(req);
});

router.delete('/myfiles/:fileName', function (req, res) {
    var bucketName = getBucketName(req);
    var fileName = req.params.fileName;

    bucketName = encodeURIComponent(bucketName);
    fileName = encodeURIComponent(fileName);
    dm.deleteObject(req.session.env, req.session.oauthcode, bucketName, fileName, function(data) {
        res.json({ result: "success"});
    });
});

/////////////////////////////////////////////////////////////////
// Get the list of export file formats supported by the
// Model Derivative API
/////////////////////////////////////////////////////////////////
router.get('/formats', function (req, res) {
    md.getFormats(req.session.env, req.session.oauthcode, function (data) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
    }, function (msg) {
            res.status(500).end(msg);
        }
    );
});

/////////////////////////////////////////////////////////////////
// Get the manifest of the given file. This will contain
// information about the various formats which are currently
// available for this file
/////////////////////////////////////////////////////////////////
router.get('/manifests/:urn', function (req, res) {
    var urn = req.params.urn;
    md.getManifest(req.session.env, req.session.oauthcode, urn, function (data) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
    }, function (msg) {
            res.status(500).end(msg);
        }
    );
});

router.delete('/manifests/:urn', function (req, res) {
    var urn = req.params.urn;
    md.delManifest(req.session.env, req.session.oauthcode, urn, function (data) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
    }, function (msg) {
            res.status(500).end(msg);
        }
    );
});

/////////////////////////////////////////////////////////////////
// Get the metadata of the given file. This will provide us with
// the guid of the avilable models in the file
/////////////////////////////////////////////////////////////////
router.get('/metadatas/:urn', function (req, res) {
    var urn = req.params.urn;
    md.getMetadata(req.session.env, req.session.oauthcode, urn, function (data) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
    }, function (msg) {
            res.status(500).end(msg);
        }
    );
});

/////////////////////////////////////////////////////////////////
// Get the hierarchy information for the model with the given
// guid inside the file with the provided urn
/////////////////////////////////////////////////////////////////
router.get('/hierarchy', function (req, res) {
    md.getHierarchy(req.session.env, req.session.oauthcode, req.query.urn, req.query.guid, function (data) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
    }, function (msg) {
            res.status(500).end(msg);
        }
    );
});

/////////////////////////////////////////////////////////////////
// Get the properties for all the components inside the model
// with the given guid and file urn
/////////////////////////////////////////////////////////////////
router.get('/properties', function (req, res) {
    md.getProperties(req.session.env, req.session.oauthcode, req.query.urn, req.query.guid, function (data) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
    }, function (msg) {
            res.status(500).end(msg);
        }
    );
});

/////////////////////////////////////////////////////////////////
// Download the given derivative file, e.g. a STEP or other
// file format which are associated with the model file
/////////////////////////////////////////////////////////////////
router.get('/download', function (req, res) {
    var fileName = req.query.fileName;
    var urn = req.query.derUrn;
    md.getDownload(req.session.env, req.session.oauthcode, req.query.urn, req.query.derUrn, function (data, headers) {
        var fileExt = fileName.split('.')[1];
        res.set('content-type', 'application/' + fileExt);
        res.set('Content-Disposition', 'attachment; filename="' + fileName +'"');
        res.end(data);
    }, function (msg) {
            res.status(500).end(msg);
        }
    );
});


/////////////////////////////////////////////////////////////////
// Send a translation request in order to get an SVF or other
// file format for our file
/////////////////////////////////////////////////////////////////
router.post('/export', jsonParser, function (req, res) {
    //env, token, urn, format, rootFileName, fileExtType, advanced
    md.postJobExport(req.session.env, req.session.oauthcode, req.body.urn, req.body.format, req.body.rootFileName, req.body.fileExtType, req.body.advanced, function (data) {
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
    }, function (msg) {
            res.status(500).end(msg);
        }
    );
});

/////////////////////////////////////////////////////////////////
// Returns the environment we are in. Could be
// DEV = Development, STG = Staging, PROD = Production
/////////////////////////////////////////////////////////////////
router.get('/env', function (req, res) {
    if (req.session.env) {
        res.end(req.session.env);
    } else {
        res.status(404).end("No environment set yet!");
    }
});

/////////////////////////////////////////////////////////////////
// Do authentication and authorization
/////////////////////////////////////////////////////////////////
router.post('/authenticate', jsonParser, function (req, res) {
    var env = req.body.env;
    req.session.env = env;

    // Set keys for LMV module and initialize it
    var configLMV = require("./config-view-and-data")(
        config.baseURL(env),
        config.credentials.consumerKey(env),
        config.credentials.consumerSecret(env)
    );

    lmv = require("view-and-data");
    lmv = new lmv(configLMV);

    var oauth2 = new OAuth2(
        config.credentials.consumerKey(env),
        config.credentials.consumerSecret(env),
        config.baseURL(env),
        config.authenticationUrl,
        config.accessTokenUrl,
        null);

    var authURL = oauth2.getAuthorizeUrl({
        redirect_uri: config.redirectUrl,
        scope: config.scope,
    });

    // this will await the callback
    router.get('/autodesk/callback', function (req, res) {
        oauth2.getOAuthAccessToken(
            req.query.code,
            {
                'grant_type': 'authorization_code',
                'redirect_uri': config.redirectUrl
            },
            function (e, access_token, refresh_token, results) {
                console.log(results);
                if (results) {
                    req.session.oauthcode = access_token;
                    req.session.cookie.maxAge = parseInt(results.expires_in) * 6000;
                    dm.getUsersMe(req.session.env, req.session.oauthcode, function(data) {
                        // We need this because each users file upload info
                        // will be stored in their "env + userId" named folder
                        req.session.userId = data.userId;
                        res.end('<script>window.opener.location.reload(false);window.close();</script>');
                    });
                } else {
                    res.status(500).end(e.data);
                }
            }
        );
    });

    res.end(JSON.stringify(authURL + '&response_type=code'));
});

/////////////////////////////////////////////////////////////////
// Finish the session with the server
/////////////////////////////////////////////////////////////////
router.post('/logoff', function (req, res) {
    req.session.destroy();
    res.end('ok');
});

/////////////////////////////////////////////////////////////////
// Provide information to the tree control on the client
// about the hubs, projects, folders and files we have on
// our A360 account
/////////////////////////////////////////////////////////////////
router.get('/treeNode', function (req, res) {
    var href = req.query.href;

    if (href === '#' || href === '%23') {
        // # stands for ROOT
        dm.getHubs(req.session.env, req.session.oauthcode, function (hubs) {
            res.end(makeTree(hubs, true));
        });
    } else {
        var params = href.split('/');
        var parentResourceName = params[params.length - 2];
        var parentResourceId = params[params.length - 1];
        switch (parentResourceName) {
            case 'hubs':
                // if the caller is a hub, then show projects
                dm.getProjects(parentResourceId/*hub_id*/, req.session.env, req.session.oauthcode, function (projects) {
                    res.end(makeTree(projects, true));
                });
                break;
            case 'projects':
                // if the caller is a project, then show folders
                var hubId = params[params.length - 3];
                dm.getFolders(hubId, parentResourceId/*project_id*/, req.session.env, req.session.oauthcode, function (folders) {
                    res.end(makeTree(folders, true));
                });
                break;
            case 'folders':
                // if the caller is a folder, then show contents
                var projectId = params[params.length - 3];
                dm.getFolderContents(projectId, parentResourceId/*folder_id*/, req.session.env, req.session.oauthcode, function (folderContents) {
                    res.end(makeTree(folderContents, true));
                });
                break;
            case 'items':
                // if the caller is an item, then show versions
                var projectId = params[params.length - 3];
                dm.getItemVersions(projectId, parentResourceId/*item_id*/, req.session.env, req.session.oauthcode, function (versions) {
                    res.end(makeTree(versions, false));
                });
        }
    }
});

/////////////////////////////////////////////////////////////////
// Request a 2 legged token. This is needed for operations
// where we interact directly with OSS - not with files on OSS
// that we got from A360
/////////////////////////////////////////////////////////////////
router.get('/2LegToken', function (req, res) {
    // ToDo: not sure what to return for LMV
    lmv.getToken().then(function (lmvRes) {
        //req.session.oauthcode = lmvRes.access_token;
        res.send(lmvRes.access_token);
    });
});

/////////////////////////////////////////////////////////////////
// Return the currently used token
// It could be the 3 legged or 2 legged token depending on
// which files the client is working with
/////////////////////////////////////////////////////////////////
router.get('/token', function (req, res) {
    // should be stored in session
    //res.end(JSON.stringify(req.session.oauthcode || null));
    res.end(req.session.oauthcode);
});

/////////////////////////////////////////////////////////////////
// Let's the client switch to the token that we need to use
// 2 legged or 3 legged
/////////////////////////////////////////////////////////////////
router.post('/token', jsonParser, function (req, res) {
    req.session.oauthcode = req.body.token;
    res.end('ok');
});

/////////////////////////////////////////////////////////////////
// Return the thumbnail for the model with urn
/////////////////////////////////////////////////////////////////
router.get('/thumbnail', function (req, res) {
    md.getThumbnail(req.session.env, req.session.oauthcode, req.query.urn, function (thumb) {
        //var buff = new Buffer(thumb, 'hex');
        res.setHeader('Content-type', 'image/png');
        res.end(thumb);//, 'binary');
    });
});

/////////////////////////////////////////////////////////////////
// Return the router object that contains the endpoints
/////////////////////////////////////////////////////////////////
module.exports = router;

/////////////////////////////////////////////////////////////////
// Collects the information that we need to pass to the
// file tree object on the client
/////////////////////////////////////////////////////////////////
function makeTree(listOf, canHaveChildren, data) {
    if (!listOf) return '';
    var treeList = [];
    listOf.forEach(function (item, index) {
        var treeItem = {
            href: item.links.self.href,
            storage: (item.relationships != null && item.relationships.storage != null ? item.relationships.storage.data.id : null),
            data: (item.relationships != null && item.relationships.derivatives != null ? item.relationships.derivatives.data.id : null),
            text: (item.attributes.displayName == null ? item.attributes.name : item.attributes.displayName),
            fileName: (item.attributes ? item.attributes.name : null),
            rootFileName: (item.attributes ? item.attributes.name : null),
            fileExtType: (item.attributes && item.attributes.extension ? item.attributes.extension.type : null),
            fileType: (item.attributes ? item.attributes.fileType : null),
            type: item.type,
            children: canHaveChildren
        };
        console.log(treeItem);
        treeList.push(treeItem);
    });
    return JSON.stringify(treeList);
}

function getBucketName(req) {
    // userId is supposed to be just numbers, but just to be safe
    // since bucket names can only be lower case letters...
    var consumerKey = config.credentials.consumerKey(req.session.env).toLowerCase();
    var env = req.session.env;
    var userId = req.session.userId.toLowerCase();

    return consumerKey + env + userId;
}