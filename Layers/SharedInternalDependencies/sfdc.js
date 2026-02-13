const {SecretsManagerClient, GetSecretValueCommand} = require('@aws-sdk/client-secrets-manager');
const jwt = require('jsonwebtoken');
const client = new SecretsManagerClient({});
const jsforce = require('./nodejs/node_modules/jsforce');

/**
 * Exchange the Bearer Token for an Access Token
 * @param bearerToken
 * @returns {Promise<null>}
 */
async function getExchangeToken(bearerToken) {
    let res = null;

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
    urlencoded.append("assertion", bearerToken);

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow"
    };

    await fetch(`${process.env.SF_URL}/services/oauth2/token`, requestOptions)
        .then((response) => response.text())
        .then((result) => res = JSON.parse(result))
        .catch((error) => console.error(error));
    return res;
}

/**
 * Function used to get a secret, based on a secret name passed
 * @param secretName
 * @returns {Promise<*>}
 */
const getSecret = async (secretName) => {
    try {
        const command = new GetSecretValueCommand({
            SecretId: secretName
        });
        const response = await client.send(command);
        return response.SecretString;
    } catch (error) {
        console.error("Error retrieving secret:", error);
        throw error;
    }
};

module.exports = connectToSalesForce = async () => {
    const secretName = `portal/${process.env.ENV}/marketplace/sfdc`;

    // Create the claim
    const claim = {
        iss: process.env.SF_CLIENT_ID,
        aud: process.env.SF_URL,
        sub: process.env.SF_USERNAME,
        exp: Math.floor(Date.now() / 1000) + 3 * 60
    };

    try {
        let secretValue = await getSecret(secretName);

        // call the jwt.sign method to create the bearer token
        const bearerToken = jwt.sign(claim, secretValue, {algorithm: 'RS256'});

        // get the access token from the bearer token generated in the prior step
        let exchangeToken = await getExchangeToken(bearerToken);

        // create a connection to the org using the access token and instance url
        const conn = new jsforce.Connection({
            instanceUrl: exchangeToken?.instance_url,
            accessToken: exchangeToken?.access_token,
        });

        return conn;

    } catch (err) {
        console.error('Error connecting to salesforce\n' + err);
        throw new Error(err);
    }
};
