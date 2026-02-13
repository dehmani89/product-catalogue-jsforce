const contentful = require("/opt/nodejs/node_modules/contentful-management");

const contentfulEnvironmentId = process.env.CONTENTFUL_ENVIRONMENT_ID;

const contentfulContentTypeId = process.env.CONTENTFUL_TYPE_ID;
const contentfulSpaceId = process.env.CONTENTFUL_SPACE_ID;
const contentfulCmaToken = process.env.CONTENTFUL_CMA_TOKEN;


/*
* Handler method
* @param event
* @returns {Promise<{headers: {"Content-Type": string}, body: string, statusCode: *}>}
*/
exports.handler = async (event) => {

    let response = 'Sync started'; // used to hold API response

    try {

        const contentfulClient = contentful.createClient({
            accessToken: contentfulCmaToken,
        });

        if (!JSON.parse(event.body).product.ProductCode) {
            response = buildResponse(500, `ProductCode cannot be empty`);
            return response;
        }

        //connect to Contentful
        const space = await contentfulClient.getSpace(contentfulSpaceId);
        const environment = await space.getEnvironment(contentfulEnvironmentId);


        const existingProduct = await environment.getEntries({
            content_type: contentfulContentTypeId,
            'fields.productCode[match]': JSON.parse(event.body).product.ProductCode,
        });
        console.log(JSON.parse(event.body).product.ProductCode, ' is an existingProduct:: ', existingProduct.total > 0);
        if (existingProduct.total === 0) {
            // Create the product entry in Contentful
            const product = await environment.createEntry(contentfulContentTypeId, {
                fields: {
                    salesforceProductName: {
                        'en-US': JSON.parse(event.body).product.name,
                    },
                    productCode: {
                        'en-US': JSON.parse(event.body).product.ProductCode,
                    },
                    salesforceProductGroup: {
                        'en-US': JSON.parse(event.body).product.Product_Group__c,
                    },
                },
            });
            console.log(existingProduct.total > 0 ? (`Product  ${JSON.parse(event.body).product.ProductCode}, already exists in Contentful, skipped creation.`) :
                `Product  ${JSON.parse(event.body).product.ProductCode}, created in Contentful`);
        }

        response = existingProduct.total > 0 ?
            buildResponse(208, `Product  ${JSON.parse(event.body).product.ProductCode}, already exists in Contentful, skipped creation.`)
            : buildResponse(200, `Product  ${JSON.parse(event.body).product.ProductCode}, created in Contenful.`)

        return response;

    } catch (err) {
        console.error('Error:', err.message);
        response = buildResponse(500, `Error encountered while running the sync job:  ${err.message}`);
    }
    return response;
};

/**
 * for API Gateway, use the below response format
 * @param {*} statusCode
 * @param {*} body <Optional>
 * @returns json object as a response
 */
function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode, body: JSON.stringify(body)
    };
}
