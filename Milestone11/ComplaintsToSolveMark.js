const logger = require("../log");

/* module.exports.getCredentials = function () {
  var options = {};
  options.customerAlias = "FernandoCulell";
  options.databaseAlias = "Main";
  options.userId = "fernandoculell.main.api";
  options.password = "p";
  options.clientId = "2bc17972-e4fd-41c2-a62c-7d5c3bc69a81";
  options.clientSecret = "GgD6ryX1m7KS/KFecEtnWcw0P9o9ffioVEsz6j1Qa90=";
  return options;
}; */

module.exports.getCredentials = function () {
    var options = {};
    options.customerAlias = "FernandoCulell";
    options.databaseAlias = "Main";
    options.userId = "fernando.culell@onetree.com";
    options.password = "Re5438PmQ";
    options.clientId = "0d6c6293-88be-4371-925e-19954eb8fb10";
    options.clientSecret = "1QP/jSH/HrwPL+DBy6ebAc/0lh986USP4q0HeB1kNuQ=";
    return options;
};

module.exports.main = async function (vvClient, response, token) {
    /*
      Script Name:    ComplaintsSeverityMark
      Customer:       Fernando Culell
      Purpose:        The purpose of this script is to...
      Parameters:     The following are parameters that need to be passed into this libarary node script.
                      - Parameters are not required for a scheduled process.
 
      Return Object:
                      Message will be sent back to VV as part of the ending of this scheduled process.
      Psuedo code:
                      1. Acquire the license lookup record that matches the license.
 
      Date of Dev:    06/24/2022
      Last Rev Date:  06/24/2022
 
      Revision Notes:
                      06/24/2022 - Fernando Culell:  First Setup of the script
     */

    logger.info("Start of logic for ComplaintsSeverityMark on " + new Date());

    /* -------------------------------------------------------------------------- */
    /*                    Response and error handling variables                   */
    /* -------------------------------------------------------------------------- */

    // You will see the responseMessage in the scheduled process log ONLY if the process runs manually.
    response.json(200, "Start of logic for ComplaintsSeverityMark on " + new Date());

    // Array for capturing error messages that may occur during the execution of the script.
    let errorLog = [];

    /* -------------------------------------------------------------------------- */
    /*                           Configurable Variables                           */
    /* -------------------------------------------------------------------------- */

    const someTemplateName = "someTemplate";

    /* -------------------------------------------------------------------------- */
    /*                              Script Variables                              */
    /* -------------------------------------------------------------------------- */

    // Contains the success or error response message
    let responseMessage = "";

    // Identifies the process in VV servers
    const scheduledProcessGUID = token;

    // Description used to better identify API methods errors
    let shortDescription = "";

    /* -------------------------------------------------------------------------- */
    /*                              Helper Functions                              */
    /* -------------------------------------------------------------------------- */

    function parseRes(vvClientRes) {
        /*
        Generic JSON parsing function
        Parameters:
                vvClientRes: JSON response from a vvClient API method
        */
        try {
            // Parses the response in case it's a JSON string
            const jsObject = JSON.parse(vvClientRes);
            // Handle non-exception-throwing cases:
            if (jsObject && typeof jsObject === "object") {
                vvClientRes = jsObject;
            }
        } catch (e) {
            // If an error ocurrs, it's because the resp is already a JS object and doesn't need to be parsed
        }
        return vvClientRes;
    }

    function checkMetaAndStatus(vvClientRes, shortDescription, ignoreStatusCode = 999) {
        /*
        Checks that the meta property of a vvCliente API response object has the expected status code
        Parameters:
                vvClientRes: Parsed response object from a vvClient API method
                shortDescription: A string with a short description of the process
                ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkData(), make sure to pass the same param as well.
        */
        if (!vvClientRes.meta) {
            throw new Error(`${shortDescription} error. No meta object found in response. Check method call parameters and credentials.`);
        }

        const status = vvClientRes.meta.status;

        // If the status is not the expected one, throw an error
        if (status != 200 && status != 201 && status != ignoreStatusCode) {
            const errorReason = vvClientRes.meta.errors && vvClientRes.meta.errors[0] ? vvClientRes.meta.errors[0].reason : "unspecified";
            throw new Error(`${shortDescription} error. Status: ${vvClientRes.meta.status}. Reason: ${errorReason}`);
        }
        return vvClientRes;
    }

    function checkDataPropertyExists(vvClientRes, shortDescription, ignoreStatusCode = 999) {
        /*
        Checks that the data property of a vvCliente API response object exists 
        Parameters:
                res: Parsed response object from the API call
                shortDescription: A string with a short description of the process
                ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkMeta(), make sure to pass the same param as well.
        */
        const status = vvClientRes.meta.status;

        if (status != ignoreStatusCode) {
            // If the data property doesn't exist, throw an error
            if (!vvClientRes.data) {
                throw new Error(`${shortDescription} data property was not present. Please, check parameters and syntax. Status: ${status}.`);
            }
        }

        return vvClientRes;
    }

    function checkDataIsNotEmpty(vvClientRes, shortDescription, ignoreStatusCode = 999) {
        /*
        Checks that the data property of a vvCliente API response object is not empty
        Parameters:
                res: Parsed response object from the API call
                shortDescription: A string with a short description of the process
                ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkMeta(), make sure to pass the same param as well.
        */
        const status = vvClientRes.meta.status;

        if (status != ignoreStatusCode) {
            const dataIsArray = Array.isArray(vvClientRes.data);
            const dataIsObject = typeof vvClientRes.data === "object";
            const isEmptyArray = dataIsArray && vvClientRes.data.length == 0;
            const isEmptyObject = dataIsObject && Object.keys(vvClientRes.data).length == 0;

            // If the data is empty, throw an error
            if (isEmptyArray || isEmptyObject) {
                throw new Error(`${shortDescription} returned no data. Please, check parameters and syntax. Status: ${status}.`);
            }
            // If it is a Web Service response, check that the first value is not an Error status
            if (dataIsArray) {
                const firstValue = vvClientRes.data[0];

                if (firstValue == "Error") {
                    throw new Error(`${shortDescription} returned an error. Please, check called Web Service. Status: ${status}.`);
                }
            }
        }
        return vvClientRes;
    }

    /* -------------------------------------------------------------------------- */
    /*                                  MAIN CODE                                 */
    /* -------------------------------------------------------------------------- */

    try {
        // YOUR CODE GOES HERE //

        const queryName1 = "Complaints Form All";
        const formTemplateName = "Complaints";
        shortDescription = "Custom Query retrieving all records from Complaints Form";

        const customQueryResp = await vvClient.customQuery
            .getCustomQueryResultsByName(queryName1, {})
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res, shortDescription))
            .then((res) => checkDataPropertyExists(res, shortDescription))
            .then((res) => checkDataIsNotEmpty(res, shortDescription));

        shortDescription = "Adding label into description text";

        await Promise.all(
            customQueryResp.data.map(async (element) => {
                let dataUpdate = {
                    Description: `[To Solve] ${element.description}`,
                };

                return await vvClient.forms
                    .postFormRevision(null, dataUpdate, formTemplateName, element.dhid)
                    .then((res) => parseRes(res))
                    .then((res) => checkMetaAndStatus(res, shortDescription))
                    .then((res) => checkDataPropertyExists(res, shortDescription))
                    .then((res) => checkDataIsNotEmpty(res, shortDescription));
            })
        );

        // SEND THE SUCCESS RESPONSE MESSAGE

        responseMessage = "Success";

        // You will see the responseMessage in the scheduled process log ONLY if the process runs automatically.
        return vvClient.scheduledProcess.postCompletion(scheduledProcessGUID, "complete", true, responseMessage);
    } catch (error) {
        logger.info("Error encountered" + error);

        // SEND THE ERROR RESPONSE MESSAGE

        if (errorLog.length > 0) {
            responseMessage = `Error/s: ${errorLog.join("; ")}`;
        } else {
            responseMessage = `Unhandled error occurred: ${error}`;
        }

        // You will see the responseMessage in the scheduled process log ONLY if the process runs automatically.
        return vvClient.scheduledProcess.postCompletion(scheduledProcessGUID, "complete", false, responseMessage);
    }
};
