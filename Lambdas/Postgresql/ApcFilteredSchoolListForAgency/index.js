const connectToDatabase = require('/opt/db');

/**
 * Handler method
 * @param event
 * @returns {Promise<{headers: {"Content-Type": string}, body: string, statusCode: *}>}
 */

//define all possible params to be used with the query
let agencyID; // this is the SFDC Account ID

exports.handler = async (event) => {
  //get the body payload
  let payloadBody = JSON.parse(event.body);

  //Define the response
  let response;

  //Check for basic required fields [agencyID] is required parameter
  let isValidRequest = checkRequestBodyParams(payloadBody);

  if (isValidRequest) {
    agencyID = payloadBody.agencyID;
    response = await getFilteredSchoolListForAgency();
  } else {
    response = buildResponse(400, `Bad request, seems a required parameter is invalid.`);
  }
  return response;
};

/**
 * get Data
 * @returns table data if found
 */
async function getFilteredSchoolListForAgency() {
  // prepared statement
  let filteredSchoolListForAgencyQuery = `WITH entity_context AS (
                                                  SELECT
                                                      e.id,
                                                      e.name,
                                                      e.group_code,
                                                      e.region_code,
                                                      e.country_code,
                                                      COALESCE(p.id, e.id) AS parent_entity_id
                                                  FROM core.entities e
                                                  LEFT JOIN core.entities p
                                                      ON e.parent_id = p.id
                                                  WHERE e.id = $1
                                              )
                                              SELECT DISTINCT
                                                  t.display_name,
                                                  t.id AS target_id
                                              FROM core.targets t
                                              JOIN rules.visibility_rule r
                                                  ON r.target_id = t.id
                                              CROSS JOIN entity_context ec
                                              WHERE
                                                  -- Optional attribute filters
                                                  (r.group_code IS NULL OR r.group_code = ec.group_code)
                                                  AND (r.region_code IS NULL OR r.region_code = ec.region_code)
                                                  AND (r.country_code IS NULL OR r.country_code = UPPER(ec.country_code))
                                              
                                                  -- Optional hierarchy match
                                                  AND (r.parent_entity_id IS NULL OR r.parent_entity_id = ec.parent_entity_id)
                                              
                                                  -- Date window logic
                                                  AND (
                                                      r.start_date IS NULL
                                                      OR CURRENT_DATE BETWEEN r.start_date AND r.end_date
                                                  )
                                              
                                              ORDER BY t.display_name;`

  try {
    const result = await (await connectToDatabase().query(filteredSchoolListForAgencyQuery, [agencyID])).rows;
    // connectToDatabase().end();
    return result;
    ;
  } catch (err) {
    console.error('Error:', err);
    return buildResponse(err.statusCode, err.message);
  }
}

/**
 * for API Gateway, you must use the below response format
 * @param {*} statusCode
 * @param {*} body <Optional>
 * @returns json object as a response
 */
function buildResponse(statusCode, data) {
  return {
    statusCode: statusCode, data: data
  };
}

/**
 * function to check if all required values are passed
 * if not a status code of 500 will be returned
 * @param payloadBody
 * @returns {boolean}
 */
const checkRequestBodyParams = (payloadBody) => {
  let isValid = false;
  try {
    if (payloadBody?.agencyID) {
      isValid = true;
    }
  } catch (e) {
    console.debug("Error: ", e);
  }
  return isValid;
};
