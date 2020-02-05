const AWS = require("aws-sdk");
const lexruntime = require("aws-sdk/clients/lexruntime");

const {
  LexRuntimeServiceClient,
  PostTextCommand
} = require("@aws-sdk/client-lex-runtime-service");
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

const componentV2 = async () => {
  // Initialize the Amazon Cognito credentials provider
  AWS.config.region = REGION;
  const creds = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IDENTITY_POOL_ID
  });
  AWS.config.credentials = creds;
  const v2Client = new lexruntime({ REGION, creds });
  let response = null,
    error = null;

  try {
    response = await v2Client
      .postText({
        botAlias: "$LATEST",
        botName: "BookTrip_devoa",
        inputText: "Book My Hotel",
        userId: ""
      })
      .promise();
  } catch (e) {
    error = e;
  }

  return getHTMLElement(
    "Data returned by v2:",
    JSON.stringify(error || response, null, 2)
  );
};

const componentV3 = async () => {
  const v3Client = new LexRuntimeServiceClient({
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
      new PostTextCommand({
        botAlias: "$LATEST",
        botName: "BookTrip_devoa",
        inputText: "Book My Hotel",
        userId: ""
      })
    );
  } catch (e) {
    error = e;
  }

  return getHTMLElement(
    "Data returned by v3:",
    JSON.stringify(error || response, null, 2)
  );
};

(async () => {
  try {
    document.body.appendChild(await componentV2());
    document.body.appendChild(await componentV3());
  } catch {
    // Regardless execute V3
    document.body.appendChild(await componentV3());
  }
})();
