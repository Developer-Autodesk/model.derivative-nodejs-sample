var MyVars = {
    keepTrying: true
};

$(window).unload(function() {
    $.sessionStorage.set("env", $('#env').val());
});

$(document).ready(function () {
    //debugger;

    //////////////////////////////////////
    // Environment variable
    var env = $.sessionStorage.get("env");

    // override value
    env = "prod";
    console.log("Overridden #env control value to = " + env);
    
    if (env) {
        console.log("Using value from sessionStorage = " + env);
        $('#env').val(env);
    } else {
        env = $('#env').val();
        console.log("Using value from #env control = " + env);
    }

    // Dynamically add the header parts referencing the correct
    // Viewer resources from (DEV/STG/PROD) servers
    var urlSuffixes = {
        'dev': '-dev',
        'stg': '-stg',
        'prod': ''
    };
    var urlSuffix = urlSuffixes[env];
    $('head').append('<script src="https://developer' + urlSuffix + '.api.autodesk.com/viewingservice/v1/viewers/viewer3D.min.js?v=v2.8"></script>');
    $('head').append('<link rel="stylesheet" type="text/css" href="https://developer' + urlSuffix + '.api.autodesk.com/viewingservice/v1/viewers/style.min.css?v=v2.8">');

    // Get the tokens
    var token = getToken();// get3LegToken();
    var auth = $("#authenticate");

    // Delete uploaded file
    $("#deleteFile").click(function(evt) {
        $.ajax({
            url: '/api/myfiles/' + encodeURIComponent(MyVars.fileName),
            type: 'DELETE'
        }).done(function (data) {
            console.log(data);
            var instance = $('#forgeFiles').jstree(true);
            instance.delete_node(MyVars.selectedNode);
        }).fail(function(err) {
            console.log('DELETE /api/myfiles call failed\n' + err.statusText);
        });
    });

    // File upload button
    $("#forgeUploadHidden").change(function(evt) {

        showProgress("Uploading file... ", "inprogress");
        var data = new FormData () ;
        var fileName = this.value;
        data.append (0, this.files[0]) ;
        $.ajax ({
            url: '/api/myfiles',
            type: 'POST',
            headers: { 'x-file-name': fileName },
            data: data,
            cache: false,
            processData: false, // Don't process the files
            contentType: false, // Set content type to false as jQuery will tell the server its a query string request
            complete: null
        }).done (function (data) {
            console.log('Uploaded file "' + data.objectKey + '" with urn = ' + data.objectId);

            addToFilesTree(data.objectId, data.objectKey);
            showProgress("Upload successful", "success");
        }).fail (function (xhr, ajaxOptions, thrownError) {
            alert(fileName + ' upload failed!') ;
            showProgress("Upload failed", "failed");
        }) ;
    });

    var upload = $("#uploadFile").click(function(evt) {
        evt.preventDefault();
        $("#forgeUploadHidden").trigger("click");
    });

    if (token === '') {
        $("#env").prop('disabled', false);
        auth.click(authenticate);
    }
    else {
        $("#env").prop('disabled', true);
        MyVars.token3Leg = token
        MyVars.token2Leg = get2LegToken();

        auth.html('You\'re logged in');
        auth.click(function () {
            if (confirm("You're logged in and your token is " + token + '\nWould you like to log out?')) {
                $.ajax({
                    url: '/api/logoff',
                    type: 'POST',
                    success: function (url) {
                        window.location.reload();
                    }
                }).done(function (url) {
                    window.location.reload();
                }).fail (function (xhr, ajaxOptions, thrownError) {
                    alert('logoff error!') ;
                }) ;
            }
        });

        // Fill the tree with A360 items
        prepareFilesTree();

        // Download list of available file formats
        fillFormats();
    }

    $('#progressInfo').click(function() {
        MyVars.keepTrying = false;
        showProgress("Translation stopped", 'failed');
    });
});

function base64encode(str) {
    var ret = "";
    if (window.btoa) {
        ret = window.btoa(str);
    } else {
        // IE9 support
        ret = window.Base64.encode(str);
    }

    // Remove ending '=' signs
    var ret2 = ret.replace(/=/g, '');

    console.log('base64encode result = ' + ret2);

    return ret2;
}

function getToken() {
    var token = makeSyncRequest('/api/token');
    if (token != '') console.log('Get current token: ' + token);
    return token;
}

function get2LegToken() {
    var token = makeSyncRequest('/api/2LegToken');
    console.log('2 legged token (Developer Authentication): ' + token);
    return token;
}

function useToken(token) {
    $.ajax({
        url: '/api/token',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            'token': token
        })
    });
}

function makeSyncRequest(url) {
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, false);
    xmlHttp.send(null);
    return xmlHttp.responseText;
}

function authenticate() {
    var env = $("#env").val();
    $.ajax({
        url: '/api/authenticate',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            'env': env
        })
    }).done(function (url) {
        // iframes are not allowed
        PopupCenter(url, "Autodesk Login", 800, 400);
    }).fail(function (err) {
        console.log('authenticate error\n' + err.statusText);
    });
}


// http://stackoverflow.com/questions/4068373/center-a-popup-window-on-screen
function PopupCenter(url, title, w, h) {
    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    var left = ((width / 2) - (w / 2)) + dualScreenLeft;
    var top = ((height / 2) - (h / 2)) + dualScreenTop;
    var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

    // Puts focus on the newWindow
    if (window.focus) {
        newWindow.focus();
    }
}

function downloadDerivative(urn, derUrn, fileName) {
    console.log("downloadDerivative for urn=" + urn + " and derUrn=" + derUrn);
    // fileName = file name you want to use for download
    var url = window.location.protocol + "//" + window.location.host +
        "/api/download?urn=" + urn +
        "&derUrn=" + derUrn +
        "&fileName=" + encodeURIComponent(fileName);

    window.open(url,'_blank');
}

function getThumbnail(urn) {
    console.log("downloadDerivative for urn=" + urn);
    // fileName = file name you want to use for download
    var url = window.location.protocol + "//" + window.location.host +
        "/api/thumbnail?urn=" + urn;

    window.open(url,'_blank');
}

function isArraySame(arr1, arr2) {
    // If both are undefined or has no value
    if (!arr1 && !arr2)
        return true;

    // If just one of them has no value
    if (!arr1 || !arr2)
        return false;

    return (arr1.sort().join(',') === arr2.sort().join(','));
}

function getDerivativeUrns(derivative, format, getThumbnail, objectIds) {
    console.log(
        "getDerivativeUrns for derivative=" + derivative.outputType +
        " and objectIds=" + (objectIds ? objectIds.toString() : "none"));
    var res = [];
    for (var childId in derivative.children) {
        var child = derivative.children[childId];
        // using toLowerCase to handle inconsistency
        if (child.role === '3d' || child.role.toLowerCase() === format) {
            if (isArraySame(child.objectIds, objectIds)) {
                // Some formats like svf might have children
                if (child.children) {
                    for (var subChildId in child.children) {
                        var subChild = child.children[subChildId];

                        if (subChild.role === 'graphics') {
                            res.push(subChild.urn);
                            if (!getThumbnail)
                                return res;
                        } else if (getThumbnail && subChild.role === 'thumbnail') {
                            res.push(subChild.urn);
                            return res;
                        }
                    }
                } else {
                    res.push(child.urn);
                    return res;
                }
            }
        }
    }

    return null;
}

// OBJ: guid & objectIds are also needed
// SVF, STEP, STL, IGES:
// Posts the job then waits for the manifest and then download the file
// if it's created
function askForFileType(format, urn, guid, objectIds, rootFileName, fileExtType, onsuccess) {
    console.log("askForFileType " + format + " for urn=" + urn);
    var advancedOptions = {
        'stl' : {
            "format": "binary",
            "exportColor": true,
            "exportFileStructure": "multiple"
        },
        'obj' : {
            "modelGuid": guid,
            "objectIds": objectIds
        }
    };

    $.ajax({
        url: '/api/export',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(
            {
                urn: urn,
                format: format,
                advanced: advancedOptions[format],
                rootFileName: rootFileName,
                fileExtType: fileExtType
            }
        )
    }).done(function (data) {
        console.log(data);

        if (data.result === 'success' // newly submitted data
            || data.result === 'created') { // already submitted data
            getManifest(urn, function (res) {
                onsuccess(res);
            });
        }
    }).fail(function(err) {
        showProgress("Could not start translation", "fail");
        console.log('/api/export call failed\n' + err.statusText);
    });
}

// We need this in order to get an OBJ file for the model
function getMetadata(urn, onsuccess) {
    console.log("getMetadata for urn=" + urn);
    $.ajax({
        url: '/api/metadatas/' + urn,
        type: 'GET'
    }).done(function (data) {
        console.log(data);
        json = JSON.parse(data);
        // Get first model guid
        // If it does not exists then something is wrong
        // let's check the manifest
        // If get manifest sees a failed attempt then it will
        // delete the manifest
        var md0 = json.data.metadata[0];
        if (!md0) {
            getManifest(urn, function () {});
        } else {
            var guid = md0.guid;
            if (onsuccess !== undefined) {
                onsuccess(guid);
            }
        }
    }).fail(function(err) {
        console.log('GET /api/metadata call failed\n' + err.statusText);
    });
}

function getHierarchy(urn, guid, onsuccess) {
    console.log("getHierarchy for urn=" + urn + " and guid=" + guid);
    $.ajax({
        url: '/api/hierarchy',
        type: 'GET',
        data: {urn: urn, guid: guid}
    }).done(function (data) {
        console.log(data);
        json = JSON.parse(data);

        // If it's 'accepted' then it's not ready yet
        if (json.result === 'accepted') {
            // Let's try again
            if (MyVars.keepTrying) {
                window.setTimeout(function() {
                        getHierarchy(urn, guid, onsuccess);
                    }, 500
                );
            } else {
                MyVars.keepTrying = true;
            }

            return;
        }

        // We got what we want
        if (onsuccess !== undefined) {
            onsuccess(json);
        }
    }).fail(function(err) {
        console.log('GET /api/hierarchy call failed\n' + err.statusText);
    });
}

function getProperties(urn, guid, onsuccess) {
    console.log("getProperties for urn=" + urn + " and guid=" + guid);
    $.ajax({
        url: '/api/properties',
        type: 'GET',
        data: {urn: urn, guid: guid}
    }).done(function (data) {
        console.log(data);
        json = JSON.parse(data);
        if (onsuccess !== undefined) {
            onsuccess(json);
        }
    }).fail(function(err) {
        console.log('GET /api/properties call failed\n' + err.statusText);
    });
}

function getManifest(urn, onsuccess) {
    console.log("getManifest for urn=" + urn);
    $.ajax({
        url: '/api/manifests/' + urn,
        type: 'GET'
    }).done(function (data) {
        console.log(data);
        json = JSON.parse(data);
        if (json.status !== 'failed') {
            if (json.progress !== 'complete') {
                showProgress("Translation progress: " + json.progress, json.status);

                if (MyVars.keepTrying) {
                    // Keep calling until it's done
                    window.setTimeout(function() {
                            getManifest(urn, onsuccess);
                        }, 500
                    );
                } else {
                    MyVars.keepTrying = true;
                }
            } else {
                showProgress("Translation completed", json.status);
                onsuccess(json);
            }
        // if it's a failed translation best thing is to delete it
        } else {
            showProgress("Translation failed", json.status);
            // Should we do automatic manifest deletion in case of a failed one?
            //delManifest(urn, function () {});
        }
    }).fail(function(err) {
        showProgress("Translation failed", 'failed');
        console.log('GET /api/manifest call failed\n' + err.statusText);
    });
}

function delManifest(urn, onsuccess) {
    console.log("delManifest for urn=" + urn);
    $.ajax({
        url: '/api/manifests/' + urn,
        type: 'DELETE'
    }).done(function (data) {
        console.log(data);
        json = JSON.parse(data);
        if (json.status === 'success') {
            if (onsuccess !== undefined) {
                onsuccess(json);
            }
        }
    }).fail(function(err) {
        console.log('DELETE /api/manifest call failed\n' + err.statusText);
    });
}

// Ask for an svf translation in order to get all the hierarchical information
// and properties
function getDerivatives(urn, fileName, fileExtType, onsuccess) {
    console.log("getDerivatives for urn=" + urn);
    var ret = $.ajax({
        url: '/api/job',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        // If fileExtType is provided then pass it on
        // Derivative services will need to know if it's a
        // composite/compressed file and that can be told from the
        // fileExtType value
        data: (fileExtType ? JSON.stringify({
            urn: urn,
            fileName: fileName,
            fileExtType: fileExtType
        }) : JSON.stringify({urn: urn}))
    }).done(function (data) {
        console.log(data);
        if (data.result === 'success' // newly submitted data
            || data.result === 'created') { // already submitted data
            if (onsuccess !== undefined) {
                onsuccess();
            }
        }
    }).fail(function(err) {
        console.log('POST /api/job call failed\n' + err.statusText);
    });
}

/////////////////////////////////////////////////////////////////
// Formats / #forgeFormats
// Shows the export file formats available for the selected model
/////////////////////////////////////////////////////////////////

function getFormats(onsuccess) {
    console.log("getFormats");
    $.ajax({
        url: '/api/formats',
        type: 'GET'
    }).done(function (data) {
        console.log(data);
        json = JSON.parse(data);

        if (onsuccess !== undefined) {
            onsuccess(json);
        }
    }).fail(function(err) {
        console.log('GET /api/formats call failed\n' + err.statusText);
    });
}

// Filter the list so that it contains only the nodes
// whose parent is not selected
function getOnlyParents(nodeIds) {
    var hierarchy = $("#forgeHierarchy");

    $.each(nodeIds, function (index, value) {

    });
}

function fillFormats() {
    getFormats(function(data) {
        var forgeFormats = $("#forgeFormats");
        forgeFormats.data("forgeFormats", data);

        var download = $("#downloadExport");
        download.click(function() {
            MyVars.keepTrying = true;

            var elem = $("#forgeHierarchy");
            var tree = elem.jstree();
            var rootNodeId = tree.get_node('#').children[0];
            var rootNode = tree.get_node(rootNodeId);

            var format = $("#forgeFormats").val();
            var urn = MyVars.selectedUrn;
            var guid = MyVars.selectedGuid;
            var fileName = rootNode.text + "." + format;
            var rootFileName = MyVars.rootFileName;
            var nodeIds = elem.jstree("get_checked",null,true);
            //nodeIds = getOnlyParents(nodeIds);

            // Only OBJ supports subcomponent selection
            // using objectId's
            var objectIds = null;
            if (format === 'obj') {
                objectIds = [-1];
                if (nodeIds.length) {
                    objectIds = [];

                    $.each(nodeIds, function (index, value) {
                        objectIds.push(parseInt(value, 10));
                    });
                }
            }

            // The rest can be exported with a single function
            askForFileType(format, urn, guid, objectIds, rootFileName, MyVars.fileExtType, function (res) {
                if (format === 'thumbnail') {
                    getThumbnail(urn);

                    return;
                }

                // Find the appropriate obj part
                for (var derId in res.derivatives) {
                    var der = res.derivatives[derId];
                    if (der.outputType === format) {
                        // found it, now get derivative urn
                        // leave objectIds parameter undefined
                        var derUrns = getDerivativeUrns(der, format, false, objectIds);

                        // url encode it
                        if (derUrns) {
                            derUrns[0] = encodeURIComponent(derUrns[0]);

                            downloadDerivative(urn, derUrns[0], fileName);
                        } else {
                            showProgress("Could not find specific OBJ file", "failed");
                            console.log("askForFileType, Did not find the OBJ translation with the correct list of objectIds");
                        }

                        return;
                    }
                }

                showProgress("Could not find exported file", "failed");
                console.log("askForFileType, Did not find " + format + " in the manifest");
            });

        });

        var deleteManifest = $("#deleteManifest");
        deleteManifest.click(function() {
            var elem = $("#forgeHierarchy");
            var urn = MyVars.selectedUrn;

            cleanupViewer();

            delManifest(urn, function() { });
        });
    });
}

function updateFormats(format) {

    var forgeFormats = $("#forgeFormats");
    var formats = forgeFormats.data("forgeFormats");
    forgeFormats.empty();

    // obj is not listed for all possible files
    // using this workaround for the time being
    //forgeFormats.append($("<option />").val('obj').text('obj'));

    $.each(formats.formats, function(key, value) {
        if (key === 'obj' || value.indexOf(format) > -1) {
            forgeFormats.append($("<option />").val(key).text(key));
        }
    });
}

/////////////////////////////////////////////////////////////////
// Files Tree / #forgeFiles
// Shows the A360 hubs, projects, folders and files of
// the logged in user
/////////////////////////////////////////////////////////////////

function prepareFilesTree() {
    console.log("prepareFilesTree");
    $('#forgeFiles').jstree({
        'core': {
            'themes': {"icons": true},
            'check_callback': true, // make it modifiable
            'data': {
                "url": '/api/treeNode',
                "dataType": "json",
                "data": function (node) {
                    return {
                        "href": (node.id === '#' ? '#' : node.original.href)
                    };
                }
            }
        },
        'types': {
            'default': {
                'icon': 'glyphicon glyphicon-cloud'
            },
            '#': {
                'icon': 'glyphicon glyphicon-user'
            },
            'hubs': {
                'icon': 'glyphicon glyphicon-inbox'
            },
            'projects': {
                'icon': 'glyphicon glyphicon-list-alt'
            },
            'items': {
                'icon': 'glyphicon glyphicon-briefcase'
            },
            'folders': {
                'icon': 'glyphicon glyphicon-folder-open'
            },
            'versions': {
                'icon': 'glyphicon glyphicon-time'
            },
            'files': {
                'icon': 'glyphicon glyphicon-time'
            }
        },
        "plugins": ["types", "state"] // let's not use sort: , "sort"]
    }).bind("select_node.jstree", function (evt, data) {
        // Clean up previous instance
        cleanupViewer();

        // Disable the hierarchy related controls for the time being
        $("#forgeFormats").attr('disabled', 'disabled');
        $("#downloadExport").attr('disabled', 'disabled');

        if (data.node.type === 'files') {
            $("#deleteFile").removeAttr('disabled');
        } else {
            $("#deleteFile").attr('disabled', 'disabled');
        }

        if (data.node.type === 'versions' || data.node.type === 'files') {
            $("#deleteManifest").removeAttr('disabled');

            MyVars.keepTrying = true;
            MyVars.selectedNode = data.node;

            // E.g. because of the file upload we might have gotten a 2 legged
            // token, now we need a 3 legged again... ?
            if (data.node.type === 'files') {
                useToken(MyVars.token2Leg);
            } else {
                useToken(MyVars.token3Leg);
            }

            // Clear hierarchy tree
            $('#forgeHierarchy').empty().jstree('destroy');

            // Clear properties tree
            $('#forgeProperties').empty().jstree('destroy');

            // Delete cached data
            $('#forgeProperties').data('forgeProperties', null);

            updateFormats(data.node.original.fileType);

            // Store info on selected file
            MyVars.rootFileName = data.node.original.rootFileName;
            MyVars.fileName = data.node.original.fileName;
            MyVars.fileExtType = data.node.original.fileExtType;
            MyVars.selectedUrn = base64encode(data.node.original.storage);

            // Fill hierarchy tree
            // format, urn, guid, objectIds, rootFileName, fileExtType
            showHierarchy(
                MyVars.selectedUrn,
                null,
                null,
                MyVars.rootFileName,
                MyVars.fileExtType
            );
            console.log(
                "data.node.original.storage = " + data.node.original.storage,
                ", data.node.original.fileName = " + data.node.original.fileName,
                ", data.node.original.fileExtType = " + data.node.original.fileExtType
            );

            // Show in viewer
            //initializeViewer(data.node.data);
        } else {
            $("#deleteManifest").attr('disabled', 'disabled');

            // Switch back to 3 legged
            useToken(MyVars.token3Leg);

            // Just open the children of the node, so that it's easier
            // to find the actual versions
            $("#forgeFiles").jstree("open_node", data.node);

            // And clear trees to avoid confusion thinking that the
            // data belongs to the clicked model
            $('#forgeHierarchy').empty().jstree('destroy');
            $('#forgeProperties').empty().jstree('destroy');
            $('#forgeViewer').html('');
        }
    }).bind('loaded.jstree', function(e, data) {
        // Also read the files we have on the server
        getMyFiles();
    });
}

function getMyFiles () {
    console.log("getMyFiles calling /api/myfiles");
    var ret = $.ajax({
        url: '/api/myfiles',
        type: 'GET'
    }).done(function (data) {
        console.log(data);
        for (itemId in data) {
            var item = data[itemId];
            addToFilesTree(item.objectId, item.objectKey);
        }

    }).fail(function() {
        console.log('GET /api/myfiles call failed');
    });
}

function addToFilesTree(objectId, fileName) {
    // we need to set
    // fileType = obj, ipt, etc
    // fileExtType = versions:autodesk.a360:CompositeDesign or not
    // fileName = e.g. myfile.ipt
    // storage = the objectId of the file
    var nameParts = fileName.split('.');
    var oldExtension = nameParts[nameParts.length - 1];
    var extension = oldExtension;

    // If it's a zip then we assume that the root file name
    // comes before the zip extension,
    // e.g. "scissors.iam.zip" >> "scissors.iam" is the root

    var myFileNodeId = $('#forgeFiles').jstree('get_node', "forgeFiles_myFiles");
    if (!myFileNodeId) {
        myFileNodeId = $('#forgeFiles').jstree('create_node', "#",
            {
                id: "forgeFiles_myFiles",
                text: "My Files",
                type: "hubs",
            }, "last"
        );
    }

    var myFileNode = $('#forgeFiles').jstree().get_node(myFileNodeId);
    for (var childId in myFileNode.children) {
        var childNodeId = myFileNode.children[childId];
        var childNode = $('#forgeFiles').jstree().get_node(childNodeId);

        // If this file is already listed then we've overwritten it on
        // the server and so no need to add it to the tree
        if (childNode.text === fileName) {
            return;
        }
    }

    var rootFileName = fileName;
    if (extension === 'zip') {
        rootFileName = fileName.slice(0, -4);
        // If it's a zip and it has another extension
        // then cut back to that
        if (nameParts.length > 2) {
            extension = nameParts[nameParts.length - 2];
        }
    }

    var newNode = $('#forgeFiles').jstree('create_node', "forgeFiles_myFiles",
        {
            text: fileName,
            type: "files",
            fileType: extension,
            fileExtType: (oldExtension === 'zip' ?
                'versions:autodesk.a360:CompositeDesign' : 'versions:autodesk.a360:File'),
            fileName: fileName,
            rootFileName: rootFileName,
            storage: objectId
        }, "last"
    );
}

/////////////////////////////////////////////////////////////////
// Hierarchy Tree / #forgeHierarchy
// Shows the hierarchy of components in selected model
/////////////////////////////////////////////////////////////////

function showHierarchy(urn, guid, objectIds, rootFileName, fileExtType) {

    // You need to
    // 1) Post a job
    // 2) Get matadata (find the model guid you need)
    // 3) Get the hierarchy based on the urn and model guid

    // Get svf export in order to get hierarchy and properties
    // for the model
    var format = 'svf';
    askForFileType(format, urn, guid, objectIds, rootFileName, fileExtType, function () {
        getManifest(urn, function(manifest) {
            getMetadata(urn, function (guid) {
                showProgress("Retrieving hierarchy...", "inprogress");

                getHierarchy(urn, guid, function (data) {
                    showProgress("Retrieved hierarchy", "success");

                    prepareHierarchyTree(urn, guid, data.data);

                    for (var derId in manifest.derivatives) {
                        var der = manifest.derivatives[derId];
                        // We just have to make sure there is an svf
                        // translation, but the viewer will find it
                        // from the urn
                        if (der.outputType === 'svf') {

                            initializeViewer(urn);
                        }
                    }
                });
            });
        });
    });
}

function addHierarchy(nodes) {
    for (var nodeId in nodes) {
        var node = nodes[nodeId];

        // We are also adding properties below that
        // this function might iterate over and we should skip
        // those nodes
        if (node.type && node.type === 'property' || node.type === 'properties') {
            // skip this node
            var str = "";
        } else {
            node.text = node.name;
            node.children = node.objects;
            if (node.objectid === undefined) {
                node.type = 'dunno'
            } else {
                node.id = node.objectid;
                node.type = 'object'
            }
            addHierarchy(node.objects);
        }
    }
}

function prepareHierarchyTree(urn, guid, json) {
    // Convert data to expected format
    addHierarchy(json.objects);

    // Enable the hierarchy related controls
    $("#forgeFormats").removeAttr('disabled');
    $("#downloadExport").removeAttr('disabled');

    // Store info of selected item
    MyVars.selectedUrn = urn;
    MyVars.selectedGuid = guid;

    // init the tree
    $('#forgeHierarchy').jstree({
        'core': {
            'check_callback': true,
            'themes': {"icons": true},
            'data': json.objects
        },
        'checkbox' : {
            'tie_selection': false,
            "three_state": true,
            'whole_node': false
        },
        'types': {
            'default': {
                'icon': 'glyphicon glyphicon-cloud'
            },
            'object': {
                'icon': 'glyphicon glyphicon-save-file'
            }
        },
        "plugins": ["types", "state", "sort", "checkbox", "ui", "themes"]
    }).bind("select_node.jstree", function (evt, data) {
        if (data.node.type === 'object') {
            var urn = MyVars.selectedUrn;
            var guid = MyVars.selectedGuid;
            var objectId = data.node.original.objectid;

            // Empty the property tree
            $('#forgeProperties').empty().jstree('destroy');

            fetchProperties(urn, guid, function (props) {
                preparePropertyTree(urn, guid, objectId, props);
            });
        }
    });
}

/////////////////////////////////////////////////////////////////
// Property Tree / #forgeProperties
// Shows the properties of the selected sub-component
/////////////////////////////////////////////////////////////////

// Storing the collected properties since you get them for the whole
// model. So when clicking on the various sub-components in the
// hierarchy tree we can reuse it instead of sending out another
// http request
function fetchProperties(urn, guid, onsuccess) {
    var props = $("#forgeProperties").data("forgeProperties");
    if (!props) {
        getProperties(urn, guid, function(data) {
            $("#forgeProperties").data("forgeProperties", data.data);
            onsuccess(data.data);
        })
    } else {
        onsuccess(props);
    }
}

// Recursively add all the additional properties under each
// property node
function addSubProperties(node, props) {
    node.children = node.children || [];
    for (var subPropId in props) {
        var subProp = props[subPropId];
        if (subProp instanceof Object) {
            var length = node.children.push({
                "text": subPropId,
                "type": "properties"
            });
            var newNode = node.children[length-1];
            addSubProperties(newNode, subProp);
        } else {
            node.children.push({
                "text": subPropId + " = " + subProp.toString(),
                "type": "property"
            });
        }
    }
}

// Add all the properties of the selected sub-component
function addProperties(node, props) {
    // Find the relevant property section
    for (var propId in props) {
        var prop = props[propId];
        if (prop.objectid === node.objectid) {
            addSubProperties(node, prop.properties);
        }
    }
}

function preparePropertyTree(urn, guid, objectId, props) {
    // Convert data to expected format
    var data = { 'objectid' : objectId };
    addProperties(data, props.collection);

    // init the tree
    $('#forgeProperties').jstree({
        'core': {
            'check_callback': true,
            'themes': {"icons": true},
            'data': data.children
        },
        'types': {
            'default': {
                'icon': 'glyphicon glyphicon-cloud'
            },
            'property': {
                'icon': 'glyphicon glyphicon-tag'
            },
            'properties': {
                'icon': 'glyphicon glyphicon-folder-open'
            }
        },
        "plugins": ["types", "state", "sort"]
    }).bind("activate_node.jstree", function (evt, data) {
       //
    });
}

/////////////////////////////////////////////////////////////////
// Viewer
// Based on Autodesk Viewer basic sample
// https://developer.autodesk.com/api/viewerapi/
/////////////////////////////////////////////////////////////////

function cleanupViewer() {
    // Clean up previous instance
    if (MyVars.viewer) {
        MyVars.viewer.finish();
        $('#forgeViewer').html('');
        MyVars.viewer = null;
    }
}

function initializeViewer(urn) {
    cleanupViewer();

    // Get environment
    var env = $("#env").val();

    console.log("Launching Autodesk Viewer for: " + urn + " in environment: " + env);
    var viewerEnvironments = {
        dev: 'AutodeskDevelopment',
        stg: 'AutodeskStaging',
        prod: 'AutodeskProduction'
    };
    var options = {
        'document': 'urn:' + urn,
        'env': viewerEnvironments[env],
        'getAccessToken': getToken
    };
    //$('#viewer').css("background-image", "url(/api/getThumbnail?urn=" + urn + ")");
    var viewerElement = document.getElementById('forgeViewer');
    MyVars.viewer = new Autodesk.Viewing.Private.GuiViewer3D(viewerElement, {});
    Autodesk.Viewing.Initializer(
        options,
        function () {
            MyVars.viewer.initialize();
            loadDocument(MyVars.viewer, options.document);
        }
    );
}

function loadDocument(viewer, documentId) {
    Autodesk.Viewing.Document.load(
        documentId,
        // onLoad
        function (doc) {
            var geometryItems = [];
            // Try 3d geometry first
            geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(doc.getRootItem(), {
                'type': 'geometry',
                'role': '3d'
            }, true);

            // If no 3d then try 2d
            if (geometryItems.length < 1)
                geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(doc.getRootItem(), {
                    'type': 'geometry',
                    'role': '2d'
                }, true);

            if (geometryItems.length > 0)
                viewer.load(doc.getViewablePath(geometryItems[0]), null, null, null, doc.acmSessionId /*session for DM*/);
        },
        // onError
        function (errorMsg) {
            showThumbnail(documentId.substr(4, documentId.length - 1));
        }
    )
}

function showThumbnail(urn) {
    $('#forgeViewer').html('<img src="/api/getThumbnail?urn=' + urn + '"/>');
}

/////////////////////////////////////////////////////////////////
// Other functions
/////////////////////////////////////////////////////////////////

function showProgress(text, status) {
    var progressInfo = $('#progressInfo');
    var progressInfoText = $('#progressInfoText');
    var progressInfoIcon = $('#progressInfoIcon');

    var oldClasses = progressInfo.attr('class');
    var newClasses = "";
    var newText = text;

    if (status === 'failed') {
        newClasses = 'btn btn-danger';
    } else if (status === 'inprogress' || status === 'pending') {
        newClasses = 'btn btn-warning';
        newText += " (Click to stop)";
    } else if (status === 'success') {
        newClasses = 'btn btn-success';
    } else {
        newClasses = 'btn btn-info';
    }

    // Only update if changed
    if (progressInfoText.text() !== newText) {
        progressInfoText.text(newText);
    }

    if (oldClasses !== newClasses) {
        progressInfo.attr('class', newClasses);

        if (newClasses === 'btn btn-warning') {
            progressInfoIcon.attr('class', 'glyphicon glyphicon-refresh glyphicon-spin');
        } else {
            progressInfoIcon.attr('class', '');
        }
    }
}


