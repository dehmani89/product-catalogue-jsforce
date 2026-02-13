const connectToSalesForce = require('/opt/sfdc');

/**
 * Handler method
 * @param event
 * @returns {Promise<{headers: {"Content-Type": string}, body: string, statusCode: *}>}
 */
exports.handler = async (event) => {

    //get the current user id
    let id = event?.requestContext?.authorizer?.jwt?.claims?.id;

    let response; // used to hold API response

    if (event.requestContext.http.method === 'GET') {
        // connect to SalesForce
        const conn = await connectToSalesForce();

        try {
             const confirmedOrders = await conn.query(
               'SELECT id, CreatedDate, name, Net_Amount__c, Adjusted_Net_Amount__c, Payment_Due_Date__c, Product__r.name, Invoice_Item_Status__c, Product__r.Is_Affiliate_Product__c, Sales_Order_Item__r.Adjustment_Reason__c, Invoice_Item_Type__c, Split_Invoice__c' + ' ' +
                 'FROM Customer_Invoice_Item__c ' +
                 "WHERE Customer__r.ID = '" + id + "'" +
                 "AND Invoice_Item_Type__c != 'Installment'"
             );

            // remove the [attributes] attribute inside each record's, Sales_Order_Item__r and Product__r objects
            let finalConfirmedOrders = confirmedOrders?.records.map(item => {
                delete item.attributes;
                delete item?.Product__r.attributes;
                return item;
            });
            response = buildResponse(200, finalConfirmedOrders);
        } catch (err) {
            console.error('Error:', err);
            response = buildResponse(err.statusCode, err.message);
        }
    } else {
        response = buildResponse(400, 'Bad Request');
    }
    return response;
};

/**
 * for API Gateway, you must use the below response format
 * @param {*} statusCode
 * @param {*} body <Optional>
 * @returns json object as a response
 */
function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    };
}
