// Data Management module

var request = require('request');
var config = require('./config');
var trim = require('trim');
var util = require('util');

module.exports = {
    getHubs: function (env, token, onsuccess) {
        makeRequest(config.hubs, env, token, function (body) {
            onsuccess(body.data);
        });
    },

    getProjects: function (hubid, env, token, onsuccess) {
        makeRequest(config.projects(hubid), env, token, function (body) {
            onsuccess(body.data);
        });
    },

    getFolders: function (hubid, projectid, env, token, onsuccess) {
        // first we need to project root folder
        makeRequest(config.project(hubid, projectid), env, token, function (project) {
            if (project.errors != null || project.data ==null || project.data.relationships==null) {
                onsuccess(null);
                return;
            }

            var rootFolderId = project.data.relationships.rootFolder.data.id;
            module.exports.getFolderContents(projectid, rootFolderId, env, token, onsuccess);
        });
    },

    getFolderContents: function (projectid, folderid, env, token, onsuccess) {
        makeRequest(config.folderContents(projectid, folderid), env, token, function (body) {
            onsuccess(body.data);
        });
    },
    getItemVersions: function (projectid, itemid, env, token, onsuccess) {
        console.log('getItemVersions for itemid' + itemid + ' with token ' + token);
        makeRequest(config.itemVersions(projectid, itemid), env, token, function (body) {
            onsuccess(body.data);
        });
    },
    getThumbnail: function (thumbnailUrn, env, token, onsuccess){
        console.log('Requesting ' + config.baseURL(env) + config.thumbail(thumbnailUrn));
        request({
            url: config.baseURL(env) + config.thumbail(thumbnailUrn),
            method: "GET",
            headers: {
                'Authorization': 'Bearer ' + token/*,
                'x-ads-acm-namespace': 'WIPDMSTG',
                'x-ads-acm-check-groups': true*/
            },
            encoding: null
        }, function (error, response, body) {
            onsuccess(new Buffer(body, 'base64'));
        });
    },

    getUsersMe: function (env, token, onsuccess) {
        console.log('getUsersMe with token ' + token);
        makeRequest(config.usersMe, env, token, function (body) {
            onsuccess(body);
        });
    },
    getObjectsInBucket: function (env, token, bucketKey, onsuccess) {
        console.log('getObjectsInBucket with token ' + token);
        makeRequest(config.objectsInBucket(bucketKey), env, token, function (body) {
            onsuccess(body);
        });
    },
    getObjectDetails: function (env, token, bucketKey, objectName, onsuccess) {
        console.log('getObjectsInBucket with token ' + token);
        makeRequest(config.objectDetails(bucketKey, objectName), env, token, function (body) {
            onsuccess(body);
        });
    },
    deleteObject: function (env, token, bucketKey, objectName, onsuccess) {
        console.log('deleteObject with token ' + token);
        request({
            url: config.baseURL(env) + config.object(bucketKey, objectName),
            method: "DELETE",
            headers: {'Authorization': 'Bearer ' + token}
        }, function (error, response, body) {
            if (error != null) console.log(error); // connection problems
            if (body.errors != null)console.log(body.errors);

            onsuccess(body);
        })
    }
}

function makeRequest(resource, env, token, onsuccess) {
    if (!env) {
        console.log('No environment (dev, stg, prod) defined! And token is + ' + token);
        return;
    }

    console.log('Requesting ' + config.baseURL(env) + resource);
    request({
        url: config.baseURL(env) + resource,
        method: "GET",
        headers: {'Authorization': 'Bearer ' + token}
    }, function (error, response, body) {
        if (error != null) console.log(error); // connection problems
        body = JSON.parse(trim(body));
        if (body.errors != null)console.log(body.errors);

        onsuccess(body);
    })
}