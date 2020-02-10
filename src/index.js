const AWS = require("aws-sdk");
const s3 = require("aws-sdk/clients/s3");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require("@aws-sdk/client-s3");
const {
  fromCognitoIdentityPool
} = require("@aws-sdk/credential-provider-cognito-identity");
const { formatUrl } = require("@aws-sdk/util-format-url");
const { createRequest } = require("@aws-sdk/util-create-request");
const { S3RequestPresigner } = require("@aws-sdk/s3-request-presigner");
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
  const v2Client = new s3({ REGION, creds });
  let response = null,
    error = null;

  try {
    response = await v2Client
      .putObject({
        Body: "Anything works",
        Bucket: "analytics3d5167b766084a44803d0ccb49a6eb66-devoa",
        Key: "public/Name that has (Parenthesis).txt"
      })
      .promise();
  } catch (e) {
    error = e;
  }

  document.body.appendChild(
    getHTMLElement(
      "Data returned by v2: with Parenthesis",
      JSON.stringify(error || response, null, 2)
    )
  );

  response = null;
  error = null;

  try {
    response = await v2Client
      .putObject({
        Body: "Anything works",
        Bucket: "analytics3d5167b766084a44803d0ccb49a6eb66-devoa",
        Key: "public/NameThatHasNoParenthesis.txt"
      })
      .promise();
  } catch (e) {
    error = e;
  }
  document.body.appendChild(
    getHTMLElement(
      "Data returned by v2: without Parenthesis",
      JSON.stringify(error || response, null, 2)
    )
  );

  // Get signed URL
  const url = v2Client.getSignedUrl("getObject", {
    Bucket: "analytics3d5167b766084a44803d0ccb49a6eb66-devoa",
    Key: "public/NameThatHasNoSpace.txt"
  });
  document.body.appendChild(
    getHTMLElement("Data returned by v2: getSignedURL", url)
  );
};

const componentV3 = async file => {
  const v3Client = new S3Client({
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
      new PutObjectCommand({
        Body: "Anything works",
        Bucket: "analytics3d5167b766084a44803d0ccb49a6eb66-devoa",
        Key: "public/Name that has (Parenthesis).txt"
      })
    );
  } catch (e) {
    error = e;
  }

  document.body.appendChild(
    getHTMLElement(
      "Data returned by v3: with Parenthesis",
      JSON.stringify(error || response, null, 2)
    )
  );

  // works when file has no special characters
  response = null;
  error = null;

  try {
    response = await v3Client.send(
      new PutObjectCommand({
        Body: "Anything works",
        Bucket: "analytics3d5167b766084a44803d0ccb49a6eb66-devoa",
        Key: "public/NameThatHasNoParenthesis.txt"
      })
    );
  } catch (e) {
    error = e;
  }
  document.body.appendChild(
    getHTMLElement(
      "Data returned by v3: without Parenthesis",
      JSON.stringify(error || response, null, 2)
    )
  );

  // Get signed URL
  const params = {
    Bucket: "analytics3d5167b766084a44803d0ccb49a6eb66-devoa",
    Key: "public/NameThatHasNoSpace.txt"
  };
  params.Expires = new Date(Date.now() + 900 * 1000);
  const signer = new S3RequestPresigner({ ...v3Client.config });
  const request = await createRequest(v3Client, new GetObjectCommand(params));
  console.log("from createRequest", request);
  const url = formatUrl(await signer.presignRequest(request, params.Expires));
  document.body.appendChild(
    getHTMLElement("Data returned by v3: getSignedURL", url)
  );
};

(async () => {
  await componentV2();
  await componentV3();
})();
