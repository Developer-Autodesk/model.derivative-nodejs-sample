# Workflow Sample for Model Derivative Service APIs

[![Node.js](https://img.shields.io/badge/Node.js-6.2.0-blue.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-3.8.9-blue.svg)](https://www.npmjs.com/)
[![Viewer](https://img.shields.io/badge/Viewer-v2.8-green.svg)](http://developer-autodesk.github.io/)
![Platforms](https://img.shields.io/badge/platform-windows%20%7C%20osx%20%7C%20linux-lightgray.svg)
[![License](http://img.shields.io/:license-mit-blue.svg)](http://opensource.org/licenses/MIT)

## Description

This sample shows how you can use the **Model Derivative API** and what you can do with it. It was designed for initial testing on multiple enviroments (DEV, STG and PROD). In most cases, you'll use PRODUCTION keys from [Forge Platform](https://developer.autodesk.com).

Also use [Autodesk Viewer](https://developer.autodesk.com/en/docs/viewer/v2/overview/) for showing models. Set of consumer key and secret are required (at least one environment), please visit Forge for more information.

## Live demo

The sample is also available online at [https://modelderivative.herokuapp.com](https://modelderivative.herokuapp.com) 

## Setup

1. Create a new application on [https://developer.autodesk.com](https://developer.autodesk.com) with "**CallBack URL**" set to "http://dev.example.com" and make a note of the "**Client ID**" and "**Client Secret**" keys of your application - you'll need them later

2. You need to have **Node.js** installed.  
Just go to this address, download it and install it: [https://nodejs.org/en/](https://nodejs.org/en/)  

3. You can download this sample multiple ways. Once you have it on your computer open terminal and just go to the folder in which the source code is, then run `npm install` - this will download additional components that the sample project needs 
More info on how to do it: [https://docs.npmjs.com/cli/install](https://docs.npmjs.com/cli/install)

4. There were some changes concerning scopes which are not yet reflected in the `view-and-data` npm package used by this project. So for the time being the solution is to open `/node_modules/view-and-data/view-and-data.js` and add the scope info to the `params` variable in the `getToken` function like so:  
  ```
  var params = {
      client_secret: config.credentials.ConsumerSecret,
      client_id: config.credentials.ConsumerKey,
      grant_type: 'client_credentials',
      scope: 'data:read data:create data:write bucket:read bucket:create'
    };
  ```  

5. Add this line in your computer's `/etc/hosts` file: `127.0.0.1	dev.example.com`  
Here is some info on how to modify your "hosts" file: [https://support.rackspace.com/how-to/modify-your-hosts-file/](https://support.rackspace.com/how-to/modify-your-hosts-file/)

6. Set the Consumer Key, Consumer Secret keys and the Calllback URL of your app for the project. You could do it in multiple ways, but two of them are:  
  a. Set the `consumerKey` and `consumerSecret` values in the `config-<env>.js` file that corresponds to the environment (PROD/STG/DEV) that you are testing in, plus set the `redirectUrl` in the config.js file  
  b. Set the `CALLBACK_URL`, `PROD_CONSUMERKEY` and `PROD_CONSUMERSECRET` environment variables. You could do that e.g. by setting them when running the server app from the terminal like this:  
  ```
  PROD_CONSUMERKEY=<your cosumer key> PROD_CONSUMERSECRET=<your consumer secret key>
  CALLBACK_URL='http://dev.example.com:8000/api/autodesk/callback' node index.js
  ```  

7. Now you can run the app by executing the following in the terminal  
  `node index.js`   

8. To test the app just open in the browser the following URL [http://dev.example.com:8000](http://dev.example.com:8000)

## Usage

**You need to have an A360 account on the appropriate server (PROD, STG or DEV) - go to [https://myhub.autodesk360.com/](https://myhub.autodesk360.com/) to make sure you have a registered account before trying to use the sample**

1. Click the "SIGN IN" button and provide your A360 credentials
2. Once the hubs and projects are shown in the browser tree on the left, drill down into the content to find a file you are interested in and select its version (the item with a clock icon)
3. The selected file's content hierarchy will appear in the middle browser tree - and it will also be shown in the viewer on the right
4. You can click on any model part and that will trigger the translation of it to an OBJ file
5. When you clicked an item, its name in the tree will change based on the translation progress. You have to keep clicking to get an update on the translation status. If the translation is finished by the time you click the item again, then the OBJ file will get downloaded to your computer

You can also upload files to the web app's own bucket storage to use the **Model Derivative API** on them, just click the `Upload file` button. In case of uploading composite designs which consist of multiple components like an **Inventor** assembly and its parts, then the **zip** file's name needs to be the following: `<root design file's name'>.zip` - e.g. `scissors.iam.zip`  

Here is a video showing it in action: [http://www.youtube.com/watch?v=0o7o7NA69qk](http://www.youtube.com/watch?v=0o7o7NA69qk)

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT).
Please see the [LICENSE](LICENSE) file for full details.


## Written by

Adam Nagy and Shiya Luo (Forge Partner Development)<br />
http://forge.autodesk.com<br />
