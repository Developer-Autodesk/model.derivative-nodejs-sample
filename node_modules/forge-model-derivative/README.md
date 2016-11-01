
[![build status](https://api.travis-ci.org/cyrillef/models.autodesk.io.png)](https://travis-ci.org/cyrillef/models.autodesk.io)
[![Node.js](https://img.shields.io/badge/Node.js-5.11.1-blue.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-3.9.3-blue.svg)](https://www.npmjs.com/)
![Platforms](https://img.shields.io/badge/platform-windows%20%7C%20osx%20%7C%20linux-lightgray.svg)
[![License](http://img.shields.io/:license-mit-blue.svg)](http://opensource.org/licenses/MIT)

*Forge API*:
[![oAuth2](https://img.shields.io/badge/oAuth2-v1-green.svg)](http://developer-autodesk.github.io/)
[![Data-Management](https://img.shields.io/badge/Data%20Management-v2-green.svg)](http://developer-autodesk.github.io/)
[![OSS](https://img.shields.io/badge/OSS-v2-green.svg)](http://developer-autodesk.github.io/)
[![Model-Derivative](https://img.shields.io/badge/Model%20Derivative-v2-green.svg)](http://developer-autodesk.github.io/)
[![Viewer](https://img.shields.io/badge/Forge%20Viewer-v2.10-green.svg)](http://developer-autodesk.github.io/)


# forge-model-derivative
Asynchronous Javascript/Node.js library for the Autodesk Forge Model Derivative API.

This SDK was generated from YAML using a modified version of the [Swagger tools](https://github.com/swagger-api/).
Modified version located [here](https://github.com/cyrillef/swagger-codegen).

Samples using this SDKs available [here](https://github.com/Autodesk-Forge).


## Installation

#### npm
```shell
npm install forge-model-derivative --save
```

#### For browser
The library also works in the browser environment via npm and [browserify](http://browserify.org/). After following
the above steps with Node.js and installing browserify with `npm install -g browserify`,
perform the following (assuming *main.js* is your entry file):

```shell
browserify main.js > bundle.js
```

Then include *bundle.js* in the HTML pages.


## Getting Started
Please follow the [installation](#installation) instruction and execute the following JS code:

This libray can either use callbacks ot Promises. Do not provide a callback parameter to use Promises.

#### callback version
```javascript
var ForgeModelDerivative =require ('forge-model-derivative') ;

var defaultClient =ForgeModelDerivative.ApiClient.instance ;

// Configure OAuth2 access token for authorization: oauth2_access_code
var oauth2_access_code =defaultClient.authentications ['oauth2_access_code'] ;
oauth2_access_code.accessToken ="YOUR ACCESS TOKEN" ;

// Configure OAuth2 access token for authorization: oauth2_application
var oauth2_application =defaultClient.authentications ['oauth2_application'] ;
oauth2_application.accessToken ="YOUR ACCESS TOKEN" ;

var api =new ForgeModelDerivative.DerivativesApi()
 ;
var urn ="urn_example" ; // {String} The Base64 (URL Safe) encoded design URN 


var callback =function (error, data, response) {
  if ( error ) {
    console.error (error) ;
  } else {
    console.log ('API called successfully. Returned data: ' + data) ;
  }
};
api.deleteManifest(urn, callback) ;

```

#### Promise version
```javascript
var ForgeModelDerivative =require ('forge-model-derivative') ;

var defaultClient =ForgeModelDerivative.ApiClient.instance ;

// Configure OAuth2 access token for authorization: oauth2_access_code
var oauth2_access_code =defaultClient.authentications ['oauth2_access_code'] ;
oauth2_access_code.accessToken ="YOUR ACCESS TOKEN" ;

// Configure OAuth2 access token for authorization: oauth2_application
var oauth2_application =defaultClient.authentications ['oauth2_application'] ;
oauth2_application.accessToken ="YOUR ACCESS TOKEN" ;

var api =new ForgeModelDerivative.DerivativesApi()
 ;
var urn ="urn_example" ; // {String} The Base64 (URL Safe) encoded design URN 


api.deleteManifest(urn).then (function (data) {
  console.log ('API called successfully. Returned data: ' + data) ;
}, function (error) {
  console.error (error) ;
}) ;

```


## Documentation for API Endpoints

All URIs are relative to *https://developer.api.autodesk.com/*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*ForgeModelDerivative.DerivativesApi* | [**deleteManifest**](docs/DerivativesApi.md#deleteManifest) | **DELETE** /modelderivative/v2/designdata/{urn}/manifest | 
*ForgeModelDerivative.DerivativesApi* | [**getDerivativeManifest**](docs/DerivativesApi.md#getDerivativeManifest) | **GET** /modelderivative/v2/designdata/{urn}/manifest/{derivativeUrn} | 
*ForgeModelDerivative.DerivativesApi* | [**getFormats**](docs/DerivativesApi.md#getFormats) | **GET** /modelderivative/v2/designdata/formats | 
*ForgeModelDerivative.DerivativesApi* | [**getManifest**](docs/DerivativesApi.md#getManifest) | **GET** /modelderivative/v2/designdata/{urn}/manifest | 
*ForgeModelDerivative.DerivativesApi* | [**getMetadata**](docs/DerivativesApi.md#getMetadata) | **GET** /modelderivative/v2/designdata/{urn}/metadata | 
*ForgeModelDerivative.DerivativesApi* | [**getModelviewMetadata**](docs/DerivativesApi.md#getModelviewMetadata) | **GET** /modelderivative/v2/designdata/{urn}/metadata/{guid} | 
*ForgeModelDerivative.DerivativesApi* | [**getModelviewProperties**](docs/DerivativesApi.md#getModelviewProperties) | **GET** /modelderivative/v2/designdata/{urn}/metadata/{guid}/properties | 
*ForgeModelDerivative.DerivativesApi* | [**getThumbnail**](docs/DerivativesApi.md#getThumbnail) | **GET** /modelderivative/v2/designdata/{urn}/thumbnail | 
*ForgeModelDerivative.DerivativesApi* | [**translate**](docs/DerivativesApi.md#translate) | **POST** /modelderivative/v2/designdata/job | 



## Documentation for Models

 - [ForgeModelDerivative.Diagnostics](docs/Diagnostics.md)
 - [ForgeModelDerivative.Formats](docs/Formats.md)
 - [ForgeModelDerivative.FormatsFormats](docs/FormatsFormats.md)
 - [ForgeModelDerivative.InputStream](docs/InputStream.md)
 - [ForgeModelDerivative.Job](docs/Job.md)
 - [ForgeModelDerivative.JobAcceptedJobs](docs/JobAcceptedJobs.md)
 - [ForgeModelDerivative.JobIgesOutputPayload](docs/JobIgesOutputPayload.md)
 - [ForgeModelDerivative.JobIgesOutputPayloadAdvanced](docs/JobIgesOutputPayloadAdvanced.md)
 - [ForgeModelDerivative.JobObjOutputPayload](docs/JobObjOutputPayload.md)
 - [ForgeModelDerivative.JobObjOutputPayloadAdvanced](docs/JobObjOutputPayloadAdvanced.md)
 - [ForgeModelDerivative.JobPayload](docs/JobPayload.md)
 - [ForgeModelDerivative.JobPayloadInput](docs/JobPayloadInput.md)
 - [ForgeModelDerivative.JobPayloadItem](docs/JobPayloadItem.md)
 - [ForgeModelDerivative.JobPayloadOutput](docs/JobPayloadOutput.md)
 - [ForgeModelDerivative.JobStepOutputPayload](docs/JobStepOutputPayload.md)
 - [ForgeModelDerivative.JobStepOutputPayloadAdvanced](docs/JobStepOutputPayloadAdvanced.md)
 - [ForgeModelDerivative.JobStlOutputPayload](docs/JobStlOutputPayload.md)
 - [ForgeModelDerivative.JobStlOutputPayloadAdvanced](docs/JobStlOutputPayloadAdvanced.md)
 - [ForgeModelDerivative.JobSvfOutputPayload](docs/JobSvfOutputPayload.md)
 - [ForgeModelDerivative.JobThumbnailOutputPayload](docs/JobThumbnailOutputPayload.md)
 - [ForgeModelDerivative.JobThumbnailOutputPayloadAdvanced](docs/JobThumbnailOutputPayloadAdvanced.md)
 - [ForgeModelDerivative.Manifest](docs/Manifest.md)
 - [ForgeModelDerivative.ManifestChildren](docs/ManifestChildren.md)
 - [ForgeModelDerivative.ManifestDerivative](docs/ManifestDerivative.md)
 - [ForgeModelDerivative.Message](docs/Message.md)
 - [ForgeModelDerivative.Messages](docs/Messages.md)
 - [ForgeModelDerivative.Metadata](docs/Metadata.md)
 - [ForgeModelDerivative.MetadataCollection](docs/MetadataCollection.md)
 - [ForgeModelDerivative.MetadataData](docs/MetadataData.md)
 - [ForgeModelDerivative.MetadataMetadata](docs/MetadataMetadata.md)
 - [ForgeModelDerivative.MetadataObject](docs/MetadataObject.md)
 - [ForgeModelDerivative.Result](docs/Result.md)



## Documentation for Authorization


### oauth2_access_code

- **Type**: OAuth
- **Flow**: accessCode
- **Authorization URL**: https://developer.api.autodesk.com/authentication/v1/authorize
- **Scopes**: 
  - data:read: The application will be able to read the end user’s data within the Autodesk ecosystem.
  - data:write: The application will be able to create, update, and delete data on behalf of the end user within the Autodesk ecosystem.
  - data:create: The application will be able to create data on behalf of the end user within the Autodesk ecosystem.
  - data:search: The application will be able to search the end user’s data within the Autodesk ecosystem.
  - bucket:create: The application will be able to create an OSS bucket it will own.
  - bucket:read: The application will be able to read the metadata and list contents for OSS buckets that it has access to.
  - bucket:update: The application will be able to set permissions and entitlements for OSS buckets that it has permission to modify.
  - bucket:delete: The application will be able to delete a bucket that it has permission to delete.
  - code:all: The application will be able to author and execute code on behalf of the end user (e.g., scripts processed by the Design Automation API).
  - account:read: For Product APIs, the application will be able to read the account data the end user has entitlements to.
  - account:write: For Product APIs, the application will be able to update the account data the end user has entitlements to.
  - user-profile:read: The application will be able to read the end user’s profile data.

### oauth2_application

- **Type**: OAuth
- **Flow**: application
- **Authorization URL**: 
- **Scopes**: 
  - data:read: The application will be able to read the end user’s data within the Autodesk ecosystem.
  - data:write: The application will be able to create, update, and delete data on behalf of the end user within the Autodesk ecosystem.
  - data:create: The application will be able to create data on behalf of the end user within the Autodesk ecosystem.
  - data:search: The application will be able to search the end user’s data within the Autodesk ecosystem.
  - bucket:create: The application will be able to create an OSS bucket it will own.
  - bucket:read: The application will be able to read the metadata and list contents for OSS buckets that it has access to.
  - bucket:update: The application will be able to set permissions and entitlements for OSS buckets that it has permission to modify.
  - bucket:delete: The application will be able to delete a bucket that it has permission to delete.
  - code:all: The application will be able to author and execute code on behalf of the end user (e.g., scripts processed by the Design Automation API).
  - account:read: For Product APIs, the application will be able to read the account data the end user has entitlements to.
  - account:write: For Product APIs, the application will be able to update the account data the end user has entitlements to.
  - user-profile:read: The application will be able to read the end user’s profile data.



## Documentation & Support
For more information, please visit [https://developer.autodesk.com/en/docs/model-derivative/v2/](https://developer.autodesk.com/en/docs/model-derivative/v2/)

For support, please use [http://stackoverflow.com/questions/tagged/autodesk-model-derivative](http://stackoverflow.com/questions/tagged/autodesk-model-derivative)

--------

## License

This SDK is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.


