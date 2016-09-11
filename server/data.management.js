'use strict'; // http://www.w3schools.com/js/js_strict.asp

// token handling in session
var token = require('./token');

// web framework
var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var forgeDM = require('forge-data-management');

/////////////////////////////////////////////////////////////////
// Gets the information about the files we previously uploaded
// to our own bucket on OSS
/////////////////////////////////////////////////////////////////
router.get('/myfiles', function (req, res) {
    var bucketName = getBucketName(req);
    bucketName = encodeURIComponent(bucketName);
    // This should always use 2legged token
    dm.getObjectsInBucket(req.session.env, req.session.oauthcode2, bucketName, function(data) {
        var datas = [];
        var asyncTasks = [];
        for (var key in data.items) {
            var obj = data.items[key];
            (function (objectKey) {
                asyncTasks.push(function (callback) {
                    objectKey = encodeURIComponent(objectKey);
                    // This should always use 2legged token
                    dm.getObjectDetails(req.session.env, req.session.oauthcode2, bucketName, objectKey, function(data) {
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

/////////////////////////////////////////////////////////////////
// Upload a file to our own bucket on OSS
//
/////////////////////////////////////////////////////////////////
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
// Provide information to the tree control on the client
// about the hubs, projects, folders and files we have on
// our A360 account
/////////////////////////////////////////////////////////////////
router.get('/treeNode', function (req, res) {
    var href = decodeURIComponent(req.query.href);
    console.log("treeNode for " + href);

    var tokenSession = new token(req.session);
    forgeDM.ApiClient.instance.authentications ['oauth2_access_code'].accessToken = tokenSession.getTokenInternal();

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