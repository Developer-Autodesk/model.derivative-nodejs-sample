'use strict'; // http://www.w3schools.com/js/js_strict.asp

// token handling in session
var token = require('./token');

// web framework
var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var formidable = require('formidable');
var path = require('path');
var fs = require('fs');

var config = require('./config');

var forgeDM = require('forge-data-management');
var forgeOSS = require('forge-oss');

function setToken(forge, req, res) {
    var tokenSession = new token(req.session);
    forge.ApiClient.instance.authentications ['oauth2_access_code'].accessToken =
        tokenSession.getTokenInternal();

    if (!tokenSession.isAuthorized()) {
        res.status(401).json({error: 'Please login first'});
        return null;
    }

    return forge;
}

router.post('/files', jsonParser, function (req, res) {
    var fileName = '';
    var form = new formidable.IncomingForm();

    if (!setToken(forgeDM, req, res))
        return;

    // Find out the project where we have to upload the file
    var href = decodeURIComponent(req.header('wip-href'));
    var params = href.split('/');
    var projectId = params[params.length - 3];
    var versionId = params[params.length - 1];
    var uploadedFile;

    // Receive the file
    var fileData;

    /*
    form.onPart = function(part) {
        part.addListener('data', function() {

        });
    }
    */

    form
        .on('data', function(data) {
            fileData = data;
        })

        .on('field', function (field, value) {
            console.log(field, value);
        })
        .on('file', function (field, file) {
            console.log(field, file);
            //fs.rename(file.path, form.uploadDir + '/' + file.name);
            uploadedFile = file;
        })
        .on('end', function () {
            console.log('-> file received');
            if (uploadedFile.name == '') {
                res.status(500).end('No file submitted!');
            }

            // Create file on A360
            var versions = new forgeDM.VersionsApi();
            versions.getVersion(projectId, versionId)
                .then(function (versionData) {
                    var itemId = versionData.data.relationships.item.data.id;

                    var items = new forgeDM.ItemsApi();
                    items.getItem(projectId, itemId)
                        .then(function (itemData) {
                            var folderId = itemData.data.relationships.parent.data.id;

                            var projects = new forgeDM.ProjectsApi();
                            projects.postStorage(projectId, JSON.stringify(storageSpecData(uploadedFile.name, folderId)))
                                .then(function (storage) {
                                    var objectId = storage.data.id;
                                    var bucketKeyObjectName = getBucketKeyObjectName(objectId);

                                    setToken(forgeOSS, req, res);

                                    fs.readFile(uploadedFile.path, function (err, fileData ) {
                                        var objects = new forgeOSS.ObjectsApi();
                                        objects.uploadObject(bucketKeyObjectName.bucketKey, bucketKeyObjectName.objectName, uploadedFile.size, fileData)
                                            .then(function (data) {
                                                console.log('uploadObject succeeded');
                                                projects.postItem(projectId, JSON.stringify(versionSpecData(uploadedFile.name, folderId, objectId)))
                                                    .then(function (version) {
                                                        res.status(200).json({file: version.data.attributes.displayName});
                                                    })
                                                    .catch(function (error) {
                                                        console.log('postItem failed');
                                                        res.status(500).end('postItem failed');
                                                    });
                                            })
                                            .catch(function (error) {
                                                console.log('uploadObject failed');
                                                res.status(500).end('uploadObject failed');
                                            });
                                    });
                                })
                                .catch(function(error) {
                                    res.status(500).end('postStorage failed');
                                });

                        })
                        .catch (function (error) {
                            res.status(500).end('getItem failed');
                        });
                })
                .catch(function (error) {
                    console.log(error);
                    res.status(500).end('getVersion failed');
                });
        });

    form.parse(req);
});

function getBucketKeyObjectName(objectId) {
    // the objectId comes in the form of
    // urn:adsk.objects:os.object:BUCKET_KEY/OBJECT_NAME
    var objectIdParams = objectId.split('/');
    var objectNameValue = objectIdParams[objectIdParams.length - 1];
    // then split again by :
    var bucketKeyParams = objectIdParams[objectIdParams.length - 2].split(':');
    // and get the BucketKey
    var bucketKeyValue = bucketKeyParams[bucketKeyParams.length - 1];

    var ret =
    {
        bucketKey: bucketKeyValue,
        objectName: objectNameValue
    };
    return ret;
}

function storageSpecData(fileName, folderId) {
    var storageSpecs =
    {
        data: {
            type: 'objects',
            attributes: {
                name: fileName
            },
            relationships: {
                target: {
                    data: {
                        type: 'folders',
                        id: folderId
                    }
                }
            }
        }
    };
    return storageSpecs;
}

function versionSpecData(filename, folderId, objectId) {
    var versionSpec =
    {
        jsonapi: {
            version: "1.0"
        },
        data: [
            {
                type: "items",
                attributes: {
                    name: filename,
                    extension: {
                        type: "items:autodesk.core:File",
                        version: "1.0"
                    }
                },
                relationships: {
                    tip: {
                        data: {
                            type: "versions",
                            id: "1"
                        }
                    },
                    parent: {
                        data: {
                            type: "folders",
                            id: folderId
                        }
                    }
                }
            }
        ],
        included: [
            {
                type: "versions",
                id: "1",
                attributes: {
                    name: filename
                },
                relationships: {
                    storage: {
                        data: {
                            type: "objects",
                            id: objectId
                        }
                    }
                }
            }
        ]
    };
    return versionSpec;
}

/////////////////////////////////////////////////////////////////
// Provide information to the tree control on the client
// about the hubs, projects, folders and files we have on
// our A360 account
/////////////////////////////////////////////////////////////////
router.get('/treeNode', function (req, res) {
    var href = decodeURIComponent(req.query.href);
    console.log("treeNode for " + href);

    if (!setToken(forgeDM, req, res))
        return;

    if (href === '#') {
        // # stands for ROOT
        var hubs = new forgeDM.HubsApi();
        hubs.getHubs()
            .then(function (data) {
                res.end(makeTree(data.data, true));
            })
            .catch(function (error) {
                console.log(error);
            });
    } else {
        var params = href.split('/');
        var resourceName = params[params.length - 2];
        var resourceId = params[params.length - 1];
        switch (resourceName) {
            case 'hubs':
                // if the caller is a hub, then show projects
                var hubs = new forgeDM.HubsApi();
                hubs.getHubProjects(resourceId/*hub_id*/)
                    .then(function (projects) {
                        res.end(makeTree(projects.data, true));
                    });
                break;
            case 'projects':
                // if the caller is a project, then show folders
                var hubId = params[params.length - 3];
                var projects = new forgeDM.ProjectsApi();
                projects.getProject(hubId, resourceId/*project_id*/)
                    .then(function (project) {
                        var rootFolderId = project.data.relationships.rootFolder.data.id;
                        var folders = new forgeDM.FoldersApi();
                        folders.getFolderContents(resourceId, rootFolderId)
                            .then(function (folderContents) {
                                res.end(makeTree(folderContents.data, true));
                            });
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                break;
            case 'folders':
                // if the caller is a folder, then show contents
                var projectId = params[params.length - 3];
                var folders = new forgeDM.FoldersApi();
                folders.getFolderContents(projectId, resourceId/*folder_id*/)
                    .then(function (folderContents) {
                        res.end(makeTree(folderContents.data, true));
                    });
                break;
            case 'items':
                // if the caller is an item, then show versions
                var projectId = params[params.length - 3];
                var items = new forgeDM.ItemsApi();
                items.getItemVersions(projectId, resourceId/*item_id*/)
                    .then(function (versions) {
                        res.end(makeTree(versions.data, false));
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
        }
    }
});

/////////////////////////////////////////////////////////////////
// Collects the information that we need to pass to the
// file tree object on the client
/////////////////////////////////////////////////////////////////
function makeTree(listOf, canHaveChildren, data) {
    if (!listOf) return '';
    var treeList = [];
    listOf.forEach(function (item, index) {
        var fileExt = (item.attributes ? item.attributes.fileType : null);
        if (!fileExt && item.attributes && item.attributes.name) {
            var fileNameParts = item.attributes.name.split('.');
            if (fileNameParts.length > 1) {
                fileExt = fileNameParts[fileNameParts.length - 1];
            }
        }

        var treeItem = {
            href: item.links.self.href,
            wipid: item.id,
            storage: (item.relationships != null && item.relationships.storage != null ? item.relationships.storage.data.id : null),
            data: (item.relationships != null && item.relationships.derivatives != null ? item.relationships.derivatives.data.id : null),
            text: (item.attributes.displayName == null ? item.attributes.name : item.attributes.displayName),
            fileName: (item.attributes ? item.attributes.name : null),
            rootFileName: (item.attributes ? item.attributes.name : null),
            fileExtType: (item.attributes && item.attributes.extension ? item.attributes.extension.type : null),
            fileType: fileExt,
            type: item.type,
            children: canHaveChildren
        };
        console.log(treeItem);
        treeList.push(treeItem);
    });

    return JSON.stringify(treeList);
}

/////////////////////////////////////////////////////////////////
// Return the router object that contains the endpoints
/////////////////////////////////////////////////////////////////
module.exports = router;