'use strict'; // http://www.w3schools.com/js/js_strict.asp

// token handling in session
var token = require('./token');

// web framework
var express = require('express');
var router = express.Router();

var forgeDM = require('forge-data-management');


/////////////////////////////////////////////////////////////////
// Provide information to the tree control on the client
// about the hubs, projects, folders and files we have on
// our A360 account
/////////////////////////////////////////////////////////////////
router.get('/dm/treeNode', function (req, res) {
    var href = req.query.href;
    console.log("treeNode for " + href);

    var tokenSession = new token(req.session);
    forgeDM.ApiClient.instance.authentications ['oauth2_access_code'].accessToken = tokenSession.getTokenInternal();

    if (href === '#' || href === '%23') {
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
        var parentResourceName = params[params.length - 2];
        var parentResourceId = params[params.length - 1];
        switch (parentResourceName) {
            case 'hubs':
                // if the caller is a hub, then show projects
                var hubs = new forgeDM.HubsApi();
                hubs.getHubProjects(parentResourceId/*hub_id*/)
                    .then(function (projects) {
                        res.end(makeTree(projects.data, true));
                    });
                break;
            case 'projects':
                // if the caller is a project, then show folders
                var hubId = params[params.length - 3];
                var projects = new forgeDM.ProjectsApi();
                projects.getProject(hubId, parentResourceId/*project_id*/)
                    .then(function (project) {
                        var rootFolderId = project.relationships.rootFolder.data.id;
                        var folders = new forgeDM.FoldersApi();
                        folders.getFolderContents(parentResourceId, rootFolderId)
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
                folders.getFolderContents(projectId, parentResourceId/*folder_id*/)
                    .then(function (folderContents) {
                        res.end(makeTree(folderContents.data, true));
                    });
                break;
            case 'items':
                // if the caller is an item, then show versions
                var projectId = params[params.length - 3];
                var items = new forgeDM.ItemsApi();
                items.getItemVersions(projectId, parentResourceId/*item_id*/)
                    .then(function (versions) {
                        res.end(makeTree(versions.data, false));
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