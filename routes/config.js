var OAUTH_VERSION = 'v1'; // Authentication
var DM_PROJECT_VERSION = 'v1'; // Data Management
var MD_PROJECT_VERSION = 'v2'; // Model Derivative

module.exports = {
    redirectUrl: process.env.CALLBACK_URL,

    defaultBucketKey: "adamnagy-20160611",

    authenticationUrl: '/authentication/' + OAUTH_VERSION + '/authorize',
    accessTokenUrl: '/authentication/' + OAUTH_VERSION + '/gettoken',
    usersMe:  '/userprofile/' + OAUTH_VERSION + '/users/@me',

    scope: 'data:read data:create data:write bucket:read bucket:create',

    baseURL: function (env) {
        return require('./config-' + env).baseUrl;
    },
    credentials: {
        consumerKey: function (env) {
            return require('./config-' + env).credentials.consumerKey;
        },
        consumerSecret: function (env) {
            return require('./config-' + env).credentials.consumerSecret;
        }
    },

    hubs: '/project/' + DM_PROJECT_VERSION + '/hubs',
    projects: function (hubId) {
        return '/project/' + DM_PROJECT_VERSION + '/hubs/' + hubId + '/projects';
    },
    project: function (hubId, projectId) {
        return '/project/' + DM_PROJECT_VERSION + '/hubs/' + hubId + '/projects/' + projectId;
    },
    folderContents: function (projectId, folderId) {
        return '/data/' + DM_PROJECT_VERSION + '/projects/' + projectId + '/folders/' + folderId + '/contents';
    },
    itemVersions: function (projectId, itemId) {
        return '/data/' + DM_PROJECT_VERSION + '/projects/' + projectId + '/items/' + itemId + '/versions';
    },


    //thumbail: function (urn) {
    //    return '/viewingservice/' + DM_PROJECT_VERSION + '/thumbnails/' + urn;
    //},

    job: '/modelderivative/' + MD_PROJECT_VERSION + '/designdata/job',
    formats: '/modelderivative/' + MD_PROJECT_VERSION + '/designdata/formats',
    manifest: function (urn) {
        return '/modelderivative/' + MD_PROJECT_VERSION + '/designdata/' + urn + '/manifest';
    },
    download: function (urn, derUrn) {
        return '/modelderivative/' + MD_PROJECT_VERSION + '/designdata/' + urn + '/manifest/' + derUrn;
    },
    metadata: function (urn) {
        return '/modelderivative/' + MD_PROJECT_VERSION + '/designdata/' + urn + '/metadata';
    },
    hierarchy: function (urn, guid) {
        return '/modelderivative/' + MD_PROJECT_VERSION + '/designdata/' + urn + '/metadata/' + guid;
    },
    properties: function (urn, guid) {
        return '/modelderivative/' + MD_PROJECT_VERSION + '/designdata/' + urn + '/metadata/' + guid + '/properties';
    },
    thumbnail: function (urn) {
        return '/modelderivative/' + MD_PROJECT_VERSION + '/designdata/' + urn + '/thumbnail?width=100&height=100';
    }
}
