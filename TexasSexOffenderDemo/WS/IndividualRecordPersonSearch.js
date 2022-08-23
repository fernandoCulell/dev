let logger = require("../log");
let moment = require("moment-timezone");

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
    /*Script Name:  IndividualRecordPersonSearch
    Customer:       VisualVault
    Purpose:        The purpose of this process is get the Individual ID of a possible Facility Employee
    Parameters:    
    Return Array:   [0] Status: 'Success', 'Error'
                    [1] Message
                    [2] Error Array
    
    Pseudo code:  
    1. Calls getForms on Individual Record and attempts to match user based on Email
    Date of Dev: 08/26/2021
    Last Rev Date: 08/30/2021
    Revision Notes:
    08/26/2021 - John Sevilla: Script created
    08/30/2021 - John Sevilla: Add duplicate search algorithm to search
    */

    logger.info("Start of the process IndividualRecordPersonSearch at " + Date());

    /**********************
    Configurable Variables
    ***********************/
    // Error message guidances
    let missingFieldGuidance = "Please provide a value for the missing field(s).";

    // Query names used in call to LibFormDuplicatePersonChecking.
    let soundexQueryName = "zWebSvc Offender Soundex Query";
    let soundexSearchQueryName = "zWebSvc Offender Search Query";

    // Field names used in call to LibFormDuplicatePersonChecking that correspond to field names on Individual Record.
    let firstNameFieldName = "first Name";
    let lastNameFieldName = "last Name";

    // Response array populated in try or catch block, used in response sent in finally block.
    let outputCollection = [];
    // Array for capturing error messages that may occur within helper functions.
    let errorLog = [];

    const timeZone = "America/Phoenix";

    /****************
        Helper Functions
        *****************/
    // Check if field object has a value property and that value is truthy before returning value.
    function getFieldValueByName(fieldName, isOptional) {
        try {
            let fieldObj = ffCollection.getFormFieldByName(fieldName);
            let fieldValue = fieldObj && (fieldObj.hasOwnProperty("value") ? fieldObj.value : null);

            if (fieldValue === null) {
                throw new Error(`A value property for ${fieldName} was not found.`);
            }
            if (!isOptional && !fieldValue) {
                throw new Error(`A value for ${fieldName} was not provided.`);
            }
            return fieldValue;
        } catch (error) {
            errorLog.push(error.message);
        }
    }

    try {
        /*********************
        Form Record Variables
        **********************/
        let IndividualRecordFirstName = getFieldValueByName("First Name");
        let IndividualRecordLastName = getFieldValueByName("Last Name");
        let IndividualRecordMiddleInitial = ""; // field not included in add employee sections
        let IndividualRecordAKA = ""; // field not included in add employee sections
        let IndividualRecordEmail = getFieldValueByName("Personal Email");
        let DOB = getFieldValueByName("DOB");
        let RevisionID = getFieldValueByName("RevisionID");
        let formID = getFieldValueByName("Form ID");

        // Specific fields are detailed in the errorLog sent in the response to the client.
        if (errorLog.length > 0) {
            throw new Error(`${missingFieldGuidance}`);
        }

        /****************
        BEGIN ASYNC CODE
        *****************/

        // FIRST VERIFICATION
        // User with the same email doesn't exist

        const getUser = await vvClient.users.getUser({
            q: "[userid] eq '" + IndividualRecordEmail + "'",
            expand: "true",
        });
        const getUserResp = JSON.parse(getUser);

        if (getUserResp.meta) {
            if (getUserResp.meta.status === 200) {
                if (getUserResp.data.length > 0) {
                    throw new Error("This email address is already being used");
                } else {
                    // SECOND VERIFICATION
                    // Individual with same name and DOB doesn't exists

                    const queryObj = {
                        q: `([First Name] eq '${IndividualRecordFirstName}' AND [Last Name] eq '${IndividualRecordLastName}' AND [DOB] eq '${DOB.substring(
                            0,
                            10
                        )}')`,
                        expand: true,
                    };
                    const getForms = await vvClient.forms.getForms(queryObj, "Offender Record");
                    const getFormsResp = JSON.parse(getForms);

                    if (getFormsResp.meta) {
                        if (getFormsResp.meta.status === 200) {
                            if (getFormsResp.data.length > 0) {
                                const isSameRecord = getFormsResp.data[0]["form ID"] == formID ? true : false;

                                if (!isSameRecord) {
                                    throw new Error("An account already exists with the provided name and date of birth.");
                                }
                            }

                            // THIRD VERIFICATION
                            // Call LibFormDuplicatePersonChecking which uses Soundex to find similar names by sound, as pronounced in English.

                            let personCheckObject = [
                                {
                                    name: "PersonObject",
                                    value: {
                                        firstname: IndividualRecordFirstName,
                                        lastname: IndividualRecordLastName,
                                        mi: IndividualRecordMiddleInitial,
                                        aka: IndividualRecordAKA,
                                        // This narrows the search to include a configurable number of days before and after the DOB parameter.
                                        //  'otheridquery': `[AKA] eq '${IndividualRecordFirstName}' and [Last Name] eq '${IndividualRecordLastName}'`,
                                        otheridquery: `[DOB] BETWEEN '${moment(DOB).subtract(1, "days").format("L")}' AND '${moment(DOB)
                                            .add(1, "days")
                                            .format("L")}'`,
                                        // 'secondotheridquery': `[First Name] eq '${IndividualRecordFirstName}' and [AKA] eq '${IndividualRecordLastName}'`
                                    },
                                },
                                { name: "SoundexQueryName", value: soundexQueryName },
                                {
                                    name: "SoundexWhereClause",
                                    value: `(SOUNDEX([Last Name]) = SOUNDEX('${IndividualRecordLastName}') and (SOUNDEX([First Name]) = SOUNDEX('${IndividualRecordFirstName}') or SOUNDEX([First Name]) = SOUNDEX('${IndividualRecordAKA}'))) or (SOUNDEX([First Name]) = SOUNDEX('${IndividualRecordFirstName}') and (SOUNDEX([Last Name]) = SOUNDEX('${IndividualRecordLastName}') or SOUNDEX([Last Name]) = SOUNDEX('${IndividualRecordAKA}')))`,
                                },
                                { name: "SearchQueryName", value: soundexSearchQueryName },
                                { name: "NameOfFirstNameField", value: firstNameFieldName },
                                { name: "NameOfLastNameField", value: lastNameFieldName },
                            ];

                            let personCheckResp = await vvClient.scripts.runWebService("LibFormDuplicatePersonChecking", personCheckObject);
                            let personCheckData = personCheckResp.hasOwnProperty("data") ? personCheckResp.data : null;

                            if (personCheckResp.meta.status != 200) {
                                throw new Error(`An error was returned when updating the user account.`);
                            }
                            if (!personCheckData || !Array.isArray(personCheckData)) {
                                throw new Error(`Data was not returned when calling LibFormDuplicatePersonChecking.`);
                            }
                            if (personCheckData[0] === "Error") {
                                throw new Error(`The call to LibFormDuplicatePersonChecking returned with an error. ${personCheckData[1]}.`);
                            }
                            if (personCheckData[0] !== "Success") {
                                throw new Error(`The call to LibFormDuplicatePersonChecking returned with an unhandled error.`);
                            }

                            let matchedIndividualID = null;
                            if (personCheckData[1] === "Duplicates found") {
                                // for each of the users found by Soundex, check if the email matches the one supplied as the employee email
                                for (const userRecord of personCheckData[2]) {
                                    let userIndividualID;
                                    if (userRecord.dhdocid == undefined || userRecord.dhdocid == "") {
                                        userIndividualID = userRecord.dhdocid1;
                                    } else {
                                        userIndividualID = userRecord.dhdocid;
                                    }

                                    // only return a match if email addresses match
                                    if (userRecord["email Address"].toLowerCase() === IndividualRecordEmail.toLowerCase()) {
                                        matchedIndividualID = userIndividualID;
                                    }
                                }

                                if (matchedIndividualID) {
                                    //'Employee Individual ID found'
                                    throw new Error(`A user with the same email or personal data is already registered.`);
                                }
                            }

                            // No associated Individual ID found'
                            const emailSubject = "New User";
                            const emailBody = `
                                                            City of Lincoln
                                                            Your new VisualVault account has been created.
                                                            
                                                            Username: [Username]
                                                            Password: [Password]
                                                            `;

                            const createUserDataArray = [
                                { name: "Group List", value: "Offender" },
                                { name: "User Id", value: IndividualRecordEmail },
                                { name: "Email Address", value: IndividualRecordEmail },
                                { name: "Site Name", value: "Home" },
                                { name: "First Name", value: IndividualRecordFirstName },
                                { name: "Last Name", value: IndividualRecordLastName },
                                { name: "Middle Initial", value: IndividualRecordMiddleInitial },
                                { name: "Send Email", value: "Standard" },
                                { name: "Email Subject", value: emailSubject },
                                { name: "Email Body", value: emailBody },
                                { name: "Related Records", value: [RevisionID] },
                                { name: "Other Fields", value: { "Primary Record ID": RevisionID } },
                            ];

                            // const clientLibrary = require('../VVRestApi');
                            // const scriptToExecute = require("../files/test2");
                            // const ffcol = new clientLibrary.forms.formFieldCollection(createUserDataArray);
                            // let createUserResp = await scriptToExecute.main(ffcol, vvClient, response)
                            let createUserResp = await vvClient.scripts.runWebService("LibUserCreate", createUserDataArray);
                            let createUserData = await (createUserResp.hasOwnProperty("data") ? createUserResp.data : null);

                            if (createUserResp.meta.status !== 200) {
                                throw new Error(
                                    `There was an error when calling LibCreateUser. Please try again or contact a system administrator if this problem continues.`
                                );
                            }
                            if (createUserData === null) {
                                throw new Error(
                                    `Data was not able to be returned when calling LibCreateUser. Please try again or contact a system administrator if this problem continues.`
                                );
                            }

                            if (createUserData[0] == "Success") {
                                outputCollection[0] = createUserData[0];
                                outputCollection[1] = "User Created";
                            } else {
                                throw new Error(
                                    "An error occurred creating the user. Please try again or contact a system administrator if this problem continues."
                                );
                            }
                        } else {
                            throw new Error("Call to query existing users returned with an error");
                        }
                    } else {
                        throw new Error("Get user error. Check query format, template id, and credentials.");
                    }
                }
            }
        }
    } catch (error) {
        // Log errors captured.
        logger.info(JSON.stringify(`${error} ${errorLog}`));
        outputCollection[0] = "Error";
        outputCollection[1] = `${error.message}`;
        outputCollection[2] = errorLog;
    } finally {
        response.status(200).json(outputCollection);
    }
};
