const { ApplicationAutoScaling } = require("aws-sdk");
const logger = require("../log");

module.exports.getCredentials = function () {
  var options = {};
  options.customerAlias = "Plaidsoft";
  options.databaseAlias = "Main";
  options.userId = "Plaidsoft.API";
  options.password = "Pla1ds0ft@p1";
  options.clientId = "7114fd92-f045-49de-ab0a-d9de916b9c6f";
  options.clientSecret = "Kfj14X1/E/y7GKvPzSCNKgSQW4qilNN+r7CiiZOBmbw=";
  return options;
};

module.exports.main = async function (ffCollection, vvClient, response) {
  /*
    Script Name:    WebService name 
    Customer:       Project Name
    Purpose:        Brief description of the purpose of the script
    Parameters:     The following represent variables passed into the function:
                    parameter1: Description of parameter1
                    parameter2: Description of parameter2
    Return Object:
                    outputCollection[0]: Status
                    outputCollection[1]: Short description message
                    outputCollection[2]: Data
    Pseudo code: 
                    1° Does this
                    2° Does that
                    ...
 
    Date of Dev:    10/19/2021
    Last Rev Date:  10/19/2021
 
    Revision Notes:
                    07/30/2021 - DEVELOPER NAME HERE:  First Setup of the script
    */

  logger.info("Start of the process SCRIPT NAME HERE at " + Date());

  /* -------------------------------------------------------------------------- */
  /*                    Response and error handling variables                   */
  /* -------------------------------------------------------------------------- */

  // Response array
  let outputCollection = [];
  // Array for capturing error messages that may occur during the process
  let errorLog = [];

  /* -------------------------------------------------------------------------- */
  /*                           Configurable Variables                           */
  /* -------------------------------------------------------------------------- */

  const someTemplateName = "TemplateName";
  const someQueryName = "QueryName";
  const someLibraryName = "LibraryName";

  //The following section contains password configuration variables.
  const passwordLength = 8;
  
  //Possible characters for password
  const passwordChars =
    "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@^&*_+";

  //Allowed characters for User ID
  const userNameChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";

  /* -------------------------------------------------------------------------- */
  /*                          Script 'Global' Variables                         */
  /* -------------------------------------------------------------------------- */

  // Description used to better identify API methods errors
  let shortDescription = "";

  let siteName = "";
  let siteGroup = "";

  /* -------------------------------------------------------------------------- */
  /*                              Helper Functions                              */
  /* -------------------------------------------------------------------------- */

  function getFieldValueByName(fieldName, isRequired = true) {
    /*
        Check if a field was passed in the request and get its value
        Parameters:
            fieldName: The name of the field to be checked
            isRequired: If the field is required or not
        */

    let resp = null;

    try {
      // Tries to get the field from the passed in arguments
      const field = ffCollection.getFormFieldByName(fieldName);

      if (!field && isRequired) {
        throw new Error(`The field '${fieldName}' was not found.`);
      } else if (field) {
        // If the field was found, get its value
        let fieldValue = field.value ? field.value : null;

        if (typeof fieldValue === "string") {
          // Remove any leading or trailing spaces
          fieldValue.trim();
        }

        if (fieldValue) {
          // Sets the field value to the response
          resp = fieldValue;
        } else if (isRequired) {
          // If the field is required and has no value, throw an error
          throw new Error(
            `The value property for the field '${fieldName}' was not found or is empty.`
          );
        }
      }
    } catch (error) {
      // If an error was thrown, add it to the error log
      errorLog.push(error);
    }
    return resp;
  }

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
      // If an error occurs, it's because the resp is already a JS object and doesn't need to be parsed
    }
    return vvClientRes;
  }

  function checkMetaAndStatus(
    vvClientRes,
    shortDescription,
    ignoreStatusCode = 999
  ) {
    /*
        Checks that the meta property of a vvClient API response object has the expected status code
        Parameters:
            vvClientRes: Parsed response object from a vvClient API method
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkData(), make sure to pass the same param as well.
        */

    if (!vvClientRes.meta) {
      throw new Error(
        `${shortDescription} error. No meta object found in response. Check method call parameters and credentials.`
      );
    }

    const status = vvClientRes.meta.status;

    // If the status is not the expected one, throw an error
    if (status != 200 && status != 201 && status != ignoreStatusCode) {
      const errorReason =
        vvClientRes.meta.errors && vvClientRes.meta.errors[0]
          ? vvClientRes.meta.errors[0].reason
          : "unspecified";
      throw new Error(
        `${shortDescription} error. Status: ${vvClientRes.meta.status}. Reason: ${errorReason}`
      );
    }
    return vvClientRes;
  }

  function checkDataPropertyExists(
    vvClientRes,
    shortDescription,
    ignoreStatusCode = 999
  ) {
    /*
        Checks that the data property of a vvClient API response object exists 
        Parameters:
            res: Parsed response object from the API call
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkMeta(), make sure to pass the same param as well.
        */
    const status = vvClientRes.meta.status;

    if (status != ignoreStatusCode) {
      // If the data property doesn't exist, throw an error
      if (!vvClientRes.data) {
        throw new Error(
          `${shortDescription} data property was not present. Please, check parameters and syntax. Status: ${status}.`
        );
      }
    }

    return vvClientRes;
  }

  function checkDataIsNotEmpty(
    vvClientRes,
    shortDescription,
    ignoreStatusCode = 999
  ) {
    /*
        Checks that the data property of a vvClient API response object is not empty
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
      const isEmptyObject =
        dataIsObject && Object.keys(vvClientRes.data).length == 0;

      // If the data is empty, throw an error
      if (isEmptyArray || isEmptyObject) {
        throw new Error(
          `${shortDescription} returned no data. Please, check parameters and syntax. Status: ${status}.`
        );
      }
      // If it is a Web Service response, check that the first value is not an Error status
      if (dataIsArray) {
        const firstValue = vvClientRes.data[0];

        if (firstValue == "Error") {
          throw new Error(
            `${shortDescription} returned an error. Please, check called Web Service. Status: ${status}.`
          );
        }
      }
    }
    return vvClientRes;
  }

  async function verifyUniqueSiteName(firstName, lastName) {
    shortDescription = "Verifying unique Site Name";
    let initialName = `${firstName}_${lastName}`;
    let isUnique = false;
    let i = 1;

    //Formatting first part of Site and User Names - remove any invalid characters.
    for (const char of initialName) {
      if (!userNameChars.includes(char)) {
        initialName = initialName.replace(char, "");
      }
    }
    let uniqueSiteName = initialName;

    //Set up query for the getSite() API call
    const currentUserSitedata = {
      q: `name eq '${uniqueSiteName}'`,
      fields: "id,name",
    };

    while (!isUnique) {
      await vvClient.sites
        .getSites(currentUserSitedata)
        .then((res) => parseRes(res))
        .then((res) => checkMetaAndStatus(res, shortDescription))
        .then((res) => checkDataPropertyExists(res, shortDescription))
        .then((res) => {
          if (res.data.length > 1) {
            throw new Error(
              "The call to find out if the site already exists returned with more than one result. This is an invalid state. Please try again and contact a system administrator if this problem persists."
            );
          } else if (res.data.length == 1) {
            //Site exists, so we need to add numbers until it does not exist
            uniqueSiteName = initialName + i;
            i++;
          } else if (res.data.length == 0) {
            //Site does not already exist in VV, so the name is available.
            isUnique = true;
          }
        });
    }

    return uniqueSiteName;
  }

  // The site could also be created by LibUserCreateNoEmailOption webservice. 
  function createSite(siteName) {
    //Params object for post site
    const siteParams = {
      q: "",
      fields: "id,name,description,sitetype",
    };
    //Object to hold new site data
    const newSiteData = {
      name: siteName,
      description: siteName,
    };

    return vvClient.sites
      .postSites(siteParams, newSiteData)
      .then((res) => parseRes(res))
      .then((res) => checkMetaAndStatus(res, shortDescription))
      .then((res) => checkDataPropertyExists(res, shortDescription))
      .then((res) => res.data[0].id);
  }

  function createGroup(siteID) {
    siteGroup = siteName + "_Group";
    shortDescription = "Creating new group for site";
    logger.info("Creating new group for site");

    const groupData = {
      name: siteGroup
    };

    await vvClient.sites
    .postGroups(null, groupData, siteID)
    .then((res) => parseRes(res))
    .then((res) => checkMetaAndStatus(res, shortDescription));
  }

  function generatePassword() {
    let password = "";

    for (let i = 0; i < passwordLength; i++)
      password += passwordChars.charAt(
        Math.floor(Math.random() * passwordChars.length)
      );
    return password;
  }

  function createUsers() {
    return userGUID;
  }

  function setUpJobApplication() {}

  /* -------------------------------------------------------------------------- */
  /*                                  MAIN CODE                                 */
  /* -------------------------------------------------------------------------- */

  try {
    // GET THE VALUES OF THE FIELDS

    const revisionId = getFieldValueByName("REVISIONID");
    const recordID = getFieldValueByName("FormIDStamp");
    const baseURL = getFieldValueByName("Base URL");
    const emailAddress = getFieldValueByName("Email");
    let firstName = getFieldValueByName("First Name");
    let lastName = getFieldValueByName("Last Name");

    // CHECKS IF THE REQUIRED PARAMETERS ARE PRESENT

    if (
      !revisionId ||
      !recordID ||
      !baseURL ||
      !emailAddress ||
      !firstName ||
      !lastName
    ) {
      // Throw every error getting field values as one
      throw new Error(errorLog.join("; "));
    } else {
      // Formatting name strings to manage apostrophes
      firstName = firstName.replace(/'/g, "'");
      lastName = lastName.replace(/'/g, "'");
    }

    // VERIFY UNIQUE SITE NAME

    siteName = await verifyUniqueSiteName(firstName, lastName);

    // CREATE SITE

    const siteID = await createSite(siteName);

    // CREATE GROUPS

    await createGroup(siteID);

    // GENERATE USERS PASSWORDS

    const applicantTempPassword = generatePassword();
    const hrTempPassword = generatePassword();
    const managerTempPassword = generatePassword();

    // CREATE USERS

    for (const user of usersToCreate) {
      const userGUID = await createUser(user);
    }

    // SET UP JOB APPLICATIONS

    const user1 = setUpJobApplication();
    const user2 = setUpJobApplication();
    const user3 = setUpJobApplication();
    const user4 = await setUpJobApplication();

    // COPY FILES

    // CHECK IF EMAIL TEMPLATE EXIST (SHOULD BE REMOVED?)

    // SEND EMAIL

    // BUILD THE SUCCESS RESPONSE ARRAY

    outputCollection[0] = "Success"; // Don´t change this
    outputCollection[1] = "Success short description here";
    // outputCollection[2] = someVariableWithData;
  } catch (error) {
    logger.info("Error encountered" + error);

    // BUILD THE ERROR RESPONSE ARRAY

    outputCollection[0] = "Error"; // Don´t change this

    if (errorLog.length > 0) {
      outputCollection[1] = "Some errors ocurred";
      outputCollection[2] = `Error/s: ${errorLog.join("; ")}`;
    } else {
      outputCollection[1] = error.message
        ? error.message
        : `Unhandled error occurred: ${error}`;
    }
  } finally {
    // SEND THE RESPONSE

    response.json(200, outputCollection);
  }
};
