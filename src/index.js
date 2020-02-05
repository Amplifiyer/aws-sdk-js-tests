const AWS = require("aws-sdk");
const Rekognition = require("aws-sdk/clients/rekognition");

const {
  RekognitionClient,
  DetectTextCommand
} = require("@aws-sdk/client-rekognition");
const {
  fromCognitoIdentityPool
} = require("@aws-sdk/credential-provider-cognito-identity");
const { CognitoIdentityClient } = require("@aws-sdk/client-cognito-identity");
const { REGION, IDENTITY_POOL_ID } = require("./config");

const getHTMLElement = (title, content) => {
  const element = document.createElement("div");
  element.style.margin = "30px";

  const titleDiv = document.createElement("div");
  titleDiv.innerHTML = title;
  const contentDiv = document.createElement("textarea");
  contentDiv.rows = 20;
  contentDiv.cols = 50;
  contentDiv.innerHTML = content;

  element.appendChild(titleDiv);
  element.appendChild(contentDiv);

  return element;
};

const componentV2 = async file => {
  // Initialize the Amazon Cognito credentials provider
  AWS.config.region = REGION;
  const creds = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IDENTITY_POOL_ID
  });
  AWS.config.credentials = creds;
  const v2Client = new Rekognition({ REGION, creds });
  let response = null,
    error = null;

  try {
    response = await v2Client.detectText({ Image: { Bytes: file } }).promise();
  } catch (e) {
    error = e;
  }

  return getHTMLElement(
    "Data returned by v2:",
    JSON.stringify(error || response, null, 2)
  );
};

const componentV3 = async file => {
  const v3Client = new RekognitionClient({
    region: REGION,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({
        region: REGION,
        credentials: () => Promise.resolve({})
      }),
      identityPoolId: IDENTITY_POOL_ID
    })
  });
  let response = null,
    error = null;

  try {
    response = await v3Client.send(
      new DetectTextCommand({ Image: { Bytes: new Uint8Array(file) } })
    );
  } catch (e) {
    error = e;
  }

  return getHTMLElement(
    "Data returned by v3:",
    JSON.stringify(error || response, null, 2)
  );
};

async function identifyFromFile(event) {
  console.log("Identifying...");
  const {
    target: { files }
  } = event;
  const [file] = files || [];

  if (!file) {
    return;
  }
  try {
    document.body.appendChild(await componentV2(await blobToArrayBuffer(file)));
    document.body.appendChild(await componentV3(await blobToArrayBuffer(file)));
  } catch {
    // Regardless execute V3
    document.body.appendChild(await componentV3(await blobToArrayBuffer(file)));
  }
}
window.onchange = identifyFromFile;

function blobToArrayBuffer(blob) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = _event => {
      res(reader.result);
    };
    reader.onerror = err => {
      rej(err);
    };
    try {
      reader.readAsArrayBuffer(blob);
    } catch (err) {
      rej(err); // in case user gives invalid type
    }
  });
}

(async () => {})();
