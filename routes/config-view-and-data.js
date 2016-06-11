/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Philippe Leefsma 2015 - ADN/Developer Technical Services
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

var VERSION = 'v2';

module.exports = function (baseUrl, key, secret) {

  var mod = {

    // File resumable upload chunk in MB
    fileResumableChunk: 40,

    // Default bucketKey, used for testing
    // needs to be unique so you better modify it
    defaultBucketKey: 'amg-forgedm',

    // Replace with your own API credentials:
    // http://developer.autodesk.com
    credentials: {
      ConsumerKey: key,
      ConsumerSecret: secret
    },

    // API EndPoints
    endPoints: {

      // Will be filled in during router.post('/authenticate') in api.js
      authenticate:     baseUrl + '/authentication/v1/authenticate',
      getBucket:        baseUrl + '/oss/' + VERSION + '/buckets/%s/details',
      createBucket:     baseUrl + '/oss/' + VERSION + '/buckets',
      listBuckets:      baseUrl + '/oss/' + VERSION + '/buckets?%s',
      upload:           baseUrl + '/oss/' + VERSION + '/buckets/%s/objects/%s',
      resumableUpload:  baseUrl + '/oss/' + VERSION + '/buckets/%s/objects/%s/resumable'
      //supported:        BASE_URL + '/derivativeservice/' + VERSION + '/supported',
      //register:         BASE_URL + '/derivativeservice/' + VERSION + '/registration',
      //unregister:       BASE_URL + '/derivativeservice/' + VERSION + '/registration/%s',
      //thumbnail:        BASE_URL + '/derivativeservice/' + VERSION + '/thumbnails/%s',
      //manifest:         BASE_URL + '/derivativeservice/' + VERSION + '/manifest/%s',
      //derivatives:      BASE_URL + '/derivativeservice/' + VERSION + '/derivatives/%s',
      //viewers:          BASE_URL + '/viewingservice/'    + VERSION + '/viewers'
    }
  }

  return mod;
}
