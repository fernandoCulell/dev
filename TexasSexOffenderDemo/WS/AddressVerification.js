var logger = require("../log");
var Q = require("q");
const request = require("request");
// const Lob = require('lob')('live_e1e6e9ab3d00c905701435babcbd2773337');

module.exports.getCredentials = function () {
    var options = {};
    options.customerAlias = "Demo";
    options.databaseAlias = "SexOffenderRegistry";
    options.userId = "demo.sexoffenderreg.api";
    options.password = "p";
    options.clientId = "60837839-7a6d-48e6-9898-6cf25a614b5b";
    options.clientSecret = "DvGkNsUs/L4u5GbtIZuPnh8MS/VE9P5NF3PmXP4n+n4=";
    return options;
};

module.exports.main = async function (ffCollection, vvClient, response) {
    /*
        Script Name:  AddressVerification
        Customer:      VisualVault
        Purpose:       The purpose of this process is to verify the address entered in the form.
        Parameters:     Street (Primary_line) (String, Required) - Used in API call to Lob.com 
                        city ID (String, Required) - Used in API call to Lob.com
                        state Name (String, Required) - Used in API call to Lob.com
                        zip_code (String, Required) - Used in API call to Lob.com
        
        Return Array for Success:  
                        [0] = Success
                        [1] = Address Validated
                        [2] = The delivery status
                        [3] = Address componenets broken down separately returned from API call
                        [4] = Primary line of address reformatted from API call
    
        Pseudo code:    1. Make request to the Lob.com API with address 
                        2. Send response with return array.
        
        Date of Dev: 03/30/2021
        Last Rev Date: 04/07/2021
        Revision Notes:
        03/30/2021  - Eric Oyanadel: Script created
    */

    // The response from the API is parsed out into these arrays
    let outputCollection = [];
    let errorLog = [];

    // This is the API key provided by Lob.com
    // This live key is from Eric's Test account limit 300
    // var username = 'live_e1e6e9ab3d00c905701435babcbd2773337
    var username = "live_0809858a9274d828075a8af46e1897996e5";

    logger.info("Start of the process AddressVerification at " + Date());

    try {
        var verifyAddress = function () {
            var def = Q.defer();

            // get the address object from the form
            var auth = "Basic " + new Buffer(username + ":" + "").toString("base64");
            var addressObject = ffCollection.getFormFieldByName("addressObject");
            var currentCountry = addressObject.country;
            // Determine wether we use the 'International' or 'US' API object and URL
            // console.log(addressObject)
            if (currentCountry == "CA") {
                var url = "https://api.lob.com/v1/intl_verifications";
                var form = {
                    primary_line: addressObject.address1,
                    secondary_line: addressObject.address2,
                    city: addressObject.city,
                    state: addressObject.state,
                    postal_code: addressObject.zip,
                    country: addressObject.country,
                };
            } else if (currentCountry == "US") {
                if (addressObject.suggestions == "true") {
                    // console.log('running the us_autocompletions suggestions..')
                    var url = "https://api.lob.com/v1/us_autocompletions";
                    var form = {
                        address_prefix: addressObject.address1,
                        city: addressObject.city,
                        state: addressObject.state,
                        zip_code: addressObject.zip_code,
                    };
                } else {
                    var url = "https://api.lob.com/v1/us_verifications";
                    var form = {
                        primary_line: addressObject.address1,
                        secondary_line: addressObject.address2,
                        city: addressObject.city,
                        state: addressObject.state,
                        zip_code: addressObject.zip,
                    };
                }
            }

            request.post(
                {
                    headers: { Authorization: auth },
                    url,
                    form,
                },
                function (error, response, body) {
                    def.resolve(response);
                    console.log(response);
                }
            );
            return def.promise;
        };

        let verifyResult = await verifyAddress();
        if (verifyResult) {
            // Here we are parsing the body because it returns it as a string.
            verifyResult = JSON.parse(verifyResult.body);
        }

        outputCollection[0] = "Success";
        outputCollection[1] = "Address Validated";
        outputCollection[2] = verifyResult.deliverability;
        outputCollection[3] = verifyResult.components;
        outputCollection[4] = verifyResult.primary_line;
        outputCollection[5] = verifyResult;
    } catch (error) {
        console.log("server side script: ", error);
        // Log errors captured.
        logger.info(JSON.stringify(`${error} ${errorLog}`));
        outputCollection[0] = "Error";
        outputCollection[1] = `${error.message} ${errorLog.join(" ")}`;
        outputCollection[2] = process.versions;
        outputCollection[3] = null;
        outputCollection[4] = errorLog;
    } finally {
        response.json(200, outputCollection);
    }
};
