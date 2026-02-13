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

            const confirmedOrders = await conn.query(`
                  SELECT
                    r.id,
                    r.created_date,
                    r.record_name,
                    r.amount_value,
                    r.adjusted_amount_value,
                    r.due_date,
                    related_a.name AS related_a_name,
                    r.status_code,
                    related_a.is_flagged,
                    related_b.reason_code,
                    r.record_type,
                    r.is_split
                  FROM Main_Record r
                  LEFT JOIN Related_Object_A related_a
                    ON r.related_a_id = related_a.id
                  LEFT JOIN Related_Object_B related_b
                    ON r.related_b_id = related_b.id
                  WHERE r.parent_id = $1
                    AND r.record_type <> $2
                  `,
                [id, 'TypeA']
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
