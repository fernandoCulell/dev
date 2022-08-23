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
    Script Name:    ApplicantRegistrationSubmit 
    Customer:       Plaidsoft
    Purpose:        The purpose of this script is to provision the applicant account and create the job application.
    Parameters:     The following represent variables passed into the function:
                    Standard form data with revisionID and Base URL.
    Return Object:
                    outputCollection[0]: Status: Success, Error
                    outputCollection[1]: Short description message
                    outputCollection[2]: Data array if successful
    Pseudo code: 
                    1° Does this
                    2° Does that
                    ...
 
    Date of Dev:    10/19/2021
    Last Rev Date:  10/19/2021
 
    Revision Notes:
                    07/30/2021 - DEVELOPER NAME HERE:  First Setup of the script
    */

  console.time("test");

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

  const jobApplicationTemplateID = "Job Application";
  const employeeRecordTemplateID = "Employee Record";
  const welcomeEmailName = "Plaidsoft Account Registration";

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
  let revisionId = "";
  let recordID = "";
  let baseURL = "";
  let emailAddress = "";
  let firstName = "";
  let lastName = "";
  let applicationDate = new Date();
  let startDate = applicationDate;
  let applicantTempPassword = "";
  let hrTempPassword = "";
  let managerTempPassword = "";

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

    while (!isUnique) {
      //Set up query for the getSite() API call
      const currentUserSitedata = {
        q: `name eq '${uniqueSiteName}'`,
        fields: "id,name",
      };

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
    shortDescription = "Creating Site";
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
      .then((res) => res.data.id);
  }

  function createGroup(siteID) {
    siteGroup = siteName + "_Group";
    shortDescription = "Creating new group for site";
    logger.info("Creating new group for site");

    const groupData = {
      name: siteGroup,
    };

    return vvClient.sites
      .postGroups(null, groupData, siteID)
      .then((res) => parseRes(res))
      .then((res) => checkMetaAndStatus(res, shortDescription));
  }

  function randomPassword() {
    let password = "";

    for (let i = 0; i < passwordLength; i++)
      password += passwordChars.charAt(
        Math.floor(Math.random() * passwordChars.length)
      );
    return password;
  }

  async function createUsers(usersToCreate) {
    let usersResult = "";
    applicantTempPassword = randomPassword();
    hrTempPassword = randomPassword();
    managerTempPassword = randomPassword();

    for (const user of usersToCreate) {
      shortDescription = `Creating ${user} user`;
      logger.info(`Creating ${user} user`);

      let groupList = "";
      if (user.includes("_Applicant")) {
        groupList = "Applicant, " + siteGroup;
        password = applicantTempPassword;
      } else if (user.includes("_HR")) {
        groupList = "Human Resources, " + siteGroup;
        password = hrTempPassword;
      } else if (user.includes("_Manager")) {
        groupList = "Technical Support Manager, " + siteGroup;
        password = managerTempPassword;
      }

      const userArr = [
        {
          name: "User ID",
          value: user,
        },
        {
          name: "Email Address",
          value: emailAddress,
        },
        {
          name: "First Name",
          value: firstName,
        },
        {
          name: "Last Name",
          value: lastName,
        },
        {
          name: "Site Name",
          value: siteName,
        },
        {
          name: "Group List",
          value: groupList,
        },
        {
          name: "Password",
          value: password,
        },
        {
          name: "Send Email",
          value: "None",
        },
        {
          name: "Related Records",
          value: [recordID],
        },
        {
          name: "Other Fields",
          value: {
            "Individual ID": recordID,
          },
        },
      ];

      await vvClient.scripts
        .runWebService("LibUserCreateNoEmailOption", userArr)
        .then((res) => parseRes(res))
        .then((res) => checkMetaAndStatus(res, shortDescription))
        .then((res) => checkDataIsNotEmpty(res, shortDescription))
        .then((res) => {
          //Measure what was received in the return array
          if (
            res.data[0] == "Success" ||
            res.data[0] == "Minor Error" ||
            res.data[1] == "User Exists" ||
            res.data[1] == "User Disabled"
          ) {
            if (res.data[0] == "Success" || res.data[0] == "Minor Error") {
              usersResult += user + " " + res.data[0] + " ";
            } else {
              usersResult += user + " " + res.data[1] + " ";
            }
          } else if (res.data[0] == "Error") {
            throw new Error(
              "The call to create the user " +
                user +
                " returned with an error. " +
                res.data[1]
            );
          } else {
            throw new Error(
              "The call to create the user " +
                user +
                " returned with an unhandled error."
            );
          }
        });
    }
    return usersResult;
  }

  function setUpJobApplications(formDataList) {
    return Promise.all(
      formDataList.map((formData) => {
        // Use try and catch structure to prevent the mapping to stop in case of an error
        try {
          shortDescription = `Posting Form for ${formData[3].value["First Name"]} ${formData[3].value["Last Name"]}`;
          // Return a promise so Promise.all can wait
          return vvClient.scripts
            .runWebService(
              "LibFormUpdateorPostandRelateFormAsyncAwait",
              formData
            )
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res, shortDescription))
            .then((res) => checkDataPropertyExists(res, shortDescription))
            .then((res) => checkDataIsNotEmpty(res, shortDescription));
        } catch (error) {
          errorLog.push(error);
        }
      })
    );
  }

  function createFolderAndCopyFiles(params) {
    shortDescription = `Processing tasks on ${params[1].value}`;
    //// For local testing ////
    const clientLibrary = require("../VVRestApi");
    const scriptToExecute = require("../z_Plaidsoft/LibCopyFiles-copy2.js");
    const ffcol = new clientLibrary.forms.formFieldCollection(params);
    return scriptToExecute
      .main(ffcol, vvClient, response)
      .then((res) => parseRes(res))
      .then((res) => checkMetaAndStatus(res, shortDescription))
      .then((res) => checkDataPropertyExists(res, shortDescription))
      .then((res) => checkDataIsNotEmpty(res, shortDescription));

    // Return a promise so Promise.all can wait
    // return vvClient.scripts
    //   .runWebService("LibCopyFiles", params)
    //   .then((res) => parseRes(res))
    //   .then((res) => checkMetaAndStatus(res, shortDescription))
    //   .then((res) => checkDataPropertyExists(res, shortDescription))
    //   .then((res) => checkDataIsNotEmpty(res, shortDescription));
  }

  /*
  function createFoldersAndCopyFiles(paramsList) {
    return Promise.all(
      paramsList.map((params) => {
        // Use try and catch structure to prevent the mapping to stop in case of an error
        try {
          shortDescription = `Processing tasks on ${params[1].value}`;
          //// For local testing ////
          const clientLibrary = require("../VVRestApi");
          const scriptToExecute = require("../z_Plaidsoft/LibCopyFiles.js");
          const ffcol = new clientLibrary.forms.formFieldCollection(params);
          return scriptToExecute
            .main(ffcol, vvClient, response)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res, shortDescription))
            .then((res) => checkDataPropertyExists(res, shortDescription))
            .then((res) => checkDataIsNotEmpty(res, shortDescription));

          // Return a promise so Promise.all can wait
          // return vvClient.scripts
          //   .runWebService("LibCopyFiles", params)
          //   .then((res) => parseRes(res))
          //   .then((res) => checkMetaAndStatus(res, shortDescription))
          //   .then((res) => checkDataPropertyExists(res, shortDescription))
          //   .then((res) => checkDataIsNotEmpty(res, shortDescription));
        } catch (error) {
          errorLog.push(error);
        }
      })
    );
  }
  */

  /* -------------------------------------------------------------------------- */
  /*                                  MAIN CODE                                 */
  /* -------------------------------------------------------------------------- */

  try {
    // GET THE VALUES OF THE FIELDS

    revisionId = getFieldValueByName("REVISIONID");
    recordID = getFieldValueByName("FormIDStamp");
    baseURL = getFieldValueByName("Base URL");
    emailAddress = getFieldValueByName("Email");
    firstName = getFieldValueByName("First Name");
    lastName = getFieldValueByName("Last Name");

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

    // CREATE FOLDERS AND COPY FILES

    const paramsList = [
      [
        {
          name: "Source Folder",
          value: `/`,
        },
        {
          name: "Target Folder",
          value: `/Benefits/Dental Enrollment/${siteName}`,
        },
        {
          name: "permissionGroups",
          value: [siteGroup],
        },
      ],
      [
        {
          name: "Source Folder",
          value: `/Policies and Procedures/Originals`,
        },
        {
          name: "Target Folder",
          value: `/Policies and Procedures/Sites/${siteName}`,
        },
        {
          name: "permissionGroups",
          value: [siteGroup],
        },
      ],
      [
        {
          name: "Source Folder",
          value: `/`,
        },
        {
          name: "Target Folder",
          value: `/Resumes/Sites/${siteName}`,
        },
        {
          name: "permissionGroups",
          value: [siteGroup],
        },
      ],
      [
        {
          name: "Source Folder",
          value: `/Resumes/Originals`,
        },
        {
          name: "Target Folder",
          value: `/Resumes/Sites/${siteName}/Technical Support I`,
        },
        {
          name: "permissionGroups",
          value: [siteGroup],
        },
      ],
    ];

    // const resCreateAndCopy = await createFoldersAndCopyFiles(paramsList);
    // console.log(resCreateAndCopy);

    const resCreateAndCopy = Promise.all([
      // Create Benefits Folder
      createFolderAndCopyFiles(paramsList[0]),
      // Creates Policy Folder and copies Policy Documents
      createFolderAndCopyFiles(paramsList[1]),
      // Creates Resume Folder
      createFolderAndCopyFiles(paramsList[2]).then(() =>
        // Creates Technical Support I and copies Resume Documents
        createFolderAndCopyFiles(paramsList[3])
      ),
    ]);

    // GENERATE REQUIRED USERS

    const applicantUser = `${siteName}_Applicant`;
    const hrUser = `${siteName}_HR`;
    const managerUser = `${siteName}_Manager`;
    const usersToCreate = [applicantUser, hrUser, managerUser];

    // CREATE USERS

    const createUsersResult = await createUsers(usersToCreate);

    // SET UP JOB APPLICATIONS

    // Data for Learner/Applicant and for filler characters
    const formDataList = [
      [
        {
          name: "REVISIONID",
          value: revisionId,
        },
        {
          name: "ACTION",
          value: "Post",
        },
        {
          name: "TARGETTEMPLATENAME",
          value: jobApplicationTemplateID,
        },
        {
          name: "UPDATEFIELDS",
          value: {
            "Date of Application": applicationDate,
            Email: emailAddress,
            "First Name": firstName,
            "Last Name": lastName,
            "Site Name": siteName,
            Status: "New",
            "User Name": applicantUser,
          },
        },
      ],
      [
        {
          name: "REVISIONID",
          value: revisionId,
        },
        {
          name: "ACTION",
          value: "Post",
        },
        {
          name: "TARGETTEMPLATENAME",
          value: jobApplicationTemplateID,
        },
        {
          name: "UPDATEFIELDS",
          value: {
            Acknowledgement: "true",
            "Currently Employed": "No",
            "Date of Application": applicationDate,
            DOB: "11/15/1990",
            Email: "monica.knapp@mail.com",
            "First Name": "Monica",
            "Last Name": "Knapp",
            "Part Time": "true",
            Phone: "(123) 123-8989",
            Position: "Technical Support I",
            "Previous Application": "No",
            "Site Name": siteName,
            "Start Date": startDate,
            Status: "Submitted Pending Review",
            "User Name": "Monica_Knapp",
          },
        },
      ],
      [
        {
          name: "REVISIONID",
          value: revisionId,
        },
        {
          name: "ACTION",
          value: "Post",
        },
        {
          name: "TARGETTEMPLATENAME",
          value: jobApplicationTemplateID,
        },
        {
          name: "UPDATEFIELDS",
          value: {
            Acknowledgement: "true",
            "Currently Employed": "No",
            "Date of Application": applicationDate,
            DOB: "05/07/2001",
            Email: "jordanmendezzz@mail.com",
            "First Name": "Jordan",
            "Full Time": "true",
            "Last Name": "Mendez",
            Phone: "(123) 123-4545",
            Position: "Technical Support I",
            "Previous Application": "Yes",
            "Site Name": siteName,
            "Start Date": startDate,
            Status: "Submitted Pending Review",
            "User Name": "Jordan_Mendez",
          },
        },
      ],
      [
        {
          name: "REVISIONID",
          value: revisionId,
        },
        {
          name: "ACTION",
          value: "Post",
        },
        {
          name: "TARGETTEMPLATENAME",
          value: employeeRecordTemplateID,
        },
        {
          name: "UPDATEFIELDS",
          value: {
            "Date of Birth": "12/31/1990",
            Department: "Technical Support",
            "Employee ID": "124412",
            "First Name": "Nancy",
            Gender: "Female",
            "Hire Date": "01/01/2015",
            "Last Name": "Bright",
            "Personal Email": "nancy.bright@mail.co",
            "Personal Phone": "(123) 123-1231",
            Position: "Technical Support III",
            SiteName: siteName,
            "Work Email": "nancy.bright@plaidsoftindustries.com",
          },
        },
      ],
    ];

    const resJobApplications = await setUpJobApplications(formDataList);
    //console.log(resJobApplications);

    // CHECK IF EMAIL TEMPLATE EXIST (SHOULD BE REMOVED?)

    // SEND EMAIL
    shortDescription =
      "Sending the welcome email and creating Communication Log.";

    const tokenObject = [
      { name: "[First Name]", value: firstName },
      { name: "[URL]", value: baseURL },
      { name: "[Site Name]", value: siteName },
      { name: "[Applicant Username]", value: applicantUser },
      { name: "[Applicant Password]", value: applicantTempPassword },
      { name: "[HR Username]", value: hrUser },
      { name: "[HR Password]", value: hrTempPassword },
      { name: "[Manager Username]", value: managerUser },
      { name: "[Manager Password]", value: managerTempPassword },
    ];

    const emailRequestArray = [
      { name: "Email Name", value: welcomeEmailName },
      { name: "Tokens", value: tokenObject },
      { name: "Email Address", value: emailAddress },
      { name: "Email AddressCC", value: "" },
      //{name:'RELATETORECORD', value: relateToRecord},
      { name: "APPROVEDTOSEND", value: "Yes" },
      { name: "SendDateTime", value: "" },
      {
        name: "OTHERFIELDSTOUPDATE",
        value: { "Primary Record ID": "Test Update This Field" },
      },
    ];

    await vvClient.scripts
      .runWebService(
        "LibEmailGenerateAndCreateCommunicationLog",
        emailRequestArray
      )
      .then((res) => parseRes(res))
      .then((res) => checkMetaAndStatus(res, shortDescription))
      .then((res) => checkDataIsNotEmpty(res, shortDescription));

    // WAIT FOR THE FOLDERS AND FILES CREATION

    await resCreateAndCopy;

    // BUILD THE SUCCESS RESPONSE ARRAY

    outputCollection[0] = "Success"; // Don´t change this
    outputCollection[1] = "Process Complete";
    outputCollection[2] = [
      createUsersResult,
      //jobApplicationId,
      siteName,
      applicantUser,
      hrUser,
      managerUser,
    ];

    console.timeEnd("test");
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
