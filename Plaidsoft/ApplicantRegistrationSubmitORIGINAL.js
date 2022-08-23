var logger = require("../log");

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
  /*Script Name:   ApplicantRegistrationSubmit
   Customer:      Plaidsoft
   Purpose:       The purpose of this script is to provision the applicant account and create the job application.
   Parameters:    The following represent variables passed into the function:  
                  Standard form data with revisionID and Base URL.

   Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.
                  Any item in the array at points 2 or above can be used to return multiple items of information.
                  0 - Status: Success, Error
                  1 - Message
                  2 - createUserResp; ('Success', 'Minor Error', 'User Exists', or 'User Disabled')
                  
   Pseudocode:   1. Name site and user accounts
                      a. Format for sitename is firstname_lastname
                      b. 3 usernames in the format: sitename + '_-Applicant', sitename + '_HR', sitename + '_Manager'
                      c. Check if Site Name and all three usernames are unique; append number to the sitename until all are unique.
                 2. Create the unique Site sitename 
                 3. Create unique Group in format: sitename + '_Group'
                 4. Create temporary passwords for each of the three users.
                 4. For each username, call LibUserCreate to create the user using Email, First Name, Last Name, username, Temp Password.
                 5. Send one welcome email with login information for all three accounts.
                 6. Post and relate Job Application to current record (Account Registration form.)
                 7. Post two additional Job Applications for filler applicants Monica Knapp and Jordan Mendez
                 8. Post Employee Record for filler employee Nancy Bright.
                 9. Call CopyDocs to copy Resume, and Policy and Procedures folders.
                 10. Folder creation and permissions assignment.
                    1. Checks if the folder already exists
                    2. Creates folder if doesn't exist
                    3. Gets folder's current permissions settings
                    4. Deletes every current member with permissions set in the folder
                    5. sets new permissions to the folder
                 11. Return response codes.

   Date of Dev:   12/23/2020
   Last Rev Date: 02/08/2022

   Revision Notes:
   12/23/2020 - Alyssa Carpenter: Initial creation of the business process.
   03/25/2021 - Alyssa Carpenter: Create site, group and all three user accounts
   04/01/2021 - Alyssa Carpenter: Update
   09/11/2021 - Emanuel Jofré: Folder creation and permissions assignment
   02/08/2022 - Alyssa Carpenter: Added setField for Date of Application field on Job App; Added Post Forms for filler 
                applicants/employees Monica Knapp, Jordan Mendez, and Nancy Bright; Added site and user names to response array.
   */

  logger.info("Start of the process ApplicantRegistrationSubmit at " + Date());

  //Configuration Variables

  //The following section contains password configuration variables.
  var PasswordLength = 8;

  //Possible characters for password
  var passwordChars =
    "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@^&*_+";

  //Allowed characters for User ID
  var userNameChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";

  var welcomeEmailName = "Plaidsoft Account Registration";
  var registrationTemplateID = "Registration Form";
  var jobApplicationTemplateID = "Job Application";
  var employeeRecordTemplateID = "Employee Record";
  var emailNotifTemplateID = "Email Notification Template";
  var queryParams = "Site Name, Applicant User, HR User, Manager User";

  //Script Variables
  var errorArray = []; //Used to hold errors as they are found, to return together.
  var revisionId = ffCollection.getFormFieldByName("REVISIONID");
  var recordID = ffCollection.getFormFieldByName("FormIDStamp");
  var baseURL = ffCollection.getFormFieldByName("Base URL").value;
  var emailAddress = ffCollection.getFormFieldByName("Email");
  var firstName = ffCollection.getFormFieldByName("First Name");
  var lastName = ffCollection.getFormFieldByName("Last Name");
  var createUserResult = ""; //Used to store result of create user process, as this can be 'success', 'minor error', 'user disabled', etc. Returned in response.
  var jobApplicationId = ""; //Used to store the revision ID of the job application, for relating records.
  var emailSubject = "";
  var emailBody = "";
  var sitename = "";
  var applicantUser = "";
  var hrUser = "";
  var managerUser = "";
  var userArray = [applicantUser, hrUser, managerUser];
  var groupArray = [];
  var createUserResult = ""; // ERROR Duplicated variable
  let siteGroup = null;
  let userGUID = null;
  let applicationDate = new Date();
  let startDate = new Date();
  startDate.setDate(applicationDate.getDate() + 5);
  // All the member that have permissions to the folder
  let folderMembers = [];

  //Initialization of the return object
  var returnObj = [];

  //Start the promise chain
  try {
    /*******************
     Validate parameters
    ********************/
    //Query formatted variables
    if (!revisionId || !revisionId.value) {
      errorArray.push("The Revision ID parameter was not supplied.");
    } else {
      revisionId = revisionId.value;
    }
    if (!recordID || !recordID.value) {
      errorArray.push("The Record ID parameter was not supplied.");
    } else {
      recordID = recordID.value;
    }
    if (!emailAddress || !emailAddress.value) {
      errorArray.push("The Email Address parameter was not supplied.");
    } else {
      emailAddress = emailAddress.value;
    }
    if (!firstName || !firstName.value) {
      errorArray.push("The First Name parameter was not supplied.");
    } else {
      firstName = firstName.value;
      firstName = firstName.replace(/'/g, "'");
    }
    if (!lastName || !lastName.value) {
      errorArray.push("The Last Name parameter was not supplied.");
    } else {
      lastName = lastName.value;
      lastName = lastName.replace(/'/g, "'");
    }

    //Return all validation errors at once.
    if (errorArray.length > 0) {
      throw new Error(
        `The following parameters are either missing or invalid: ${errorArray.join(
          ", "
        )}`
      );
    }

    //Formatting first part of Site and User Names - remove any invalid characters.
    var firstlast = firstName + "_" + lastName;
    for (var j = 0; j < firstlast.length; j++) {
      if (userNameChars.indexOf(firstlast[j]) < 0) {
        firstlast = firstlast.split(firstlast[j]).join("");
      }
    }

    /*****************
     Helper Functions
    ******************/

    //The following is a function to randomly generate passwords.
    var randomPassword = async function () {
      var text = "";

      for (var i = 0; i < PasswordLength; i++)
        text += passwordChars.charAt(
          Math.floor(Math.random() * passwordChars.length)
        );

      return text;
    };

    let i = 1;
    //Check if Site Name and User Names are in use; append number to the site name until all are unique; create unique site.
    let verifySiteandUsers = async function () {
      let searchSiteResp = await searchSite(sitename);
      let siteData = JSON.parse(searchSiteResp);
      //Measure that the API call completed successfully
      if (siteData.meta.status != 200) {
        throw new Error(
          "Error in call to get site information of " +
            sitename +
            ". Please try again and contact a system administrator if this problem persists."
        );
      }
      //Measure that we received something in the return array
      if (siteData.data.length > 1) {
        throw new Error(
          "The call to find out if the site already exists returned with more than one result. This is an invalid state. Please try again and contact a system administrator if this problem persists."
        );
      }
      //Site exists, so we need to add numbers until it does not exist
      if (siteData.data.length == 1) {
        sitename = firstlast + i;
        i++;
        return await verifySiteandUsers();
      }

      //sitename does not already exist in VV, so we need to verify the three users are also not already in the system.

      //Set users and check if they exist
      applicantUser = sitename + "_Applicant";
      hrUser = sitename + "_HR";
      managerUser = sitename + "_Manager";
      userArray = [applicantUser, hrUser, managerUser];
      for (let user of userArray) {
        var searchUserResp = await searchUser(user);
        var userData = JSON.parse(searchUserResp);
        //Measure that the API call completed successfully
        if (userData.meta.status != 200) {
          throw new Error(
            "Error in call to get user information of " +
              user +
              ". Please try again and contact a system administrator if this problem persists."
          );
        }
        //Measure that we received something in the return array
        if (userData.data.length > 1) {
          throw new Error(
            "The call to find out if the username " +
              user +
              " already exists returned with more than one result. This is an invalid state. Please try again and contact a system administrator if this problem persists."
          );
        }
        //User exists, so we need to add numbers to the site until it does not exist
        if (userData.data.length == 1) {
          sitename = firstlast + i;
          i++;
          return await verifySiteandUsers();
        }
        //Else, user does not exist, so continue.
      }

      //sitename and all 3 user accounts are unique, now create the unique site.
      //Params object for post site
      var siteParams = {};
      siteParams.q = "";
      siteParams.fields = "id,name,description,sitetype";

      //Object to hold new site data
      var newSiteData = {};
      newSiteData.name = sitename;
      newSiteData.description = sitename;

      return vvClient.sites.postSites(siteParams, newSiteData);
    };

    var searchSite = async function (site) {
      //Set up query for the getSite() API call
      var currentUserSitedata = {};
      currentUserSitedata.q = "name eq '" + site + "'";
      currentUserSitedata.fields = "id,name";

      console.log("Searching site " + site + ".");

      return vvClient.sites.getSites(currentUserSitedata);
    };

    var searchUser = async function (user) {
      //Set up query for the getUser() API call
      var currentUserdata = {};
      currentUserdata.q = "[name] eq '" + user + "'";
      currentUserdata.fields =
        "id,name,userid,siteid,firstname,lastname,emailaddress";

      console.log("Searching user " + user + ".");

      return await vvClient.users.getUser(currentUserdata);
    };

    var GetOrCreateSiteGroup = async function (site) {
      siteGroup = site + "_Group";
      //The return object that will have the groupId (if successful) and whether a new group had to be created
      var createdNewGroup = false;
      var siteId = "";
      logger.info("Finding VisualVault site belonging to " + site + ".");

      /////// The following fragment would not be necessary ////////
      //Get the user's siteId so we can search it for the site group
      var siteParam = {};
      siteParam.q = "name eq '" + site + "'";
      siteParam.fields = "id";

      let siteResp = await vvClient.sites.getSites(siteParam);
      var siteResult = JSON.parse(siteResp);
      //Measure that the API call completed successfully
      if (siteResult.meta.status != 200) {
        throw new Error(
          "The call to get site for " + site + " returned with an error."
        );
      }
      //Measure that we received something in the return array
      if (siteResult.data.length === 0) {
        throw new Error(
          "Your training site could not be found. Please try again and contact a system administrator if this problem persists."
        );
      }
      //Record the siteId for the next step
      if (siteResult.data.length > 1) {
        throw new Error(
          "There was an error finding your training site. Please try again and contact a system administrator if this problem persists."
        );
      }
      //One site found, no errors
      siteId = siteResult.data[0].id;
      /////// The precedent fragment would not be necessary ////////

      //Make sure we successfully found the users site before continuing to find the group
      if (siteId) {
        logger.info("Finding site group for " + site + ".");
        //Find the users group within the site
        var groupParam = {};
        groupParam.name = siteGroup;
        let groupResp = await vvClient.sites.getGroups(groupParam, siteId);
        var groupResult = JSON.parse(groupResp);
        //Measure that the API call completed successfully
        if (groupResult.meta.status != 200) {
          throw new Error(
            "There was an error finding your training site group. Please try again and contact a system administrator if this problem persists."
          );
        }
        //Measure that we received something in the return array
        if (groupResult.data.length > 0) {
          //Users group already exists
          logger.info("Group already exists.");
        } else {
          //Users group does not exist. Need to create it.
          logger.info("Site group does not exist. Creating new group for site");
          var groupData = {};
          groupData.name = siteGroup;
          let groupPostResp = await vvClient.sites.postGroups(
            null,
            groupData,
            siteId
          );
          if (groupPostResp.meta.status === 200) {
            //Group created successfully
            logger.info(
              "Site group " + groupPostResp.data.name + " created successfully."
            );
            //Update the return object with the groupId and flag that a new group was created
            createdNewGroup = true;
          } else {
            logger.info(
              "There was an error creating the group for " +
                site +
                ". Please try again and contact a system administrator if this problem persists."
            );
          }
        }
      } else {
        //If siteId is false, then the site that was just created when executing verifySiteandUsers was not found or had an error in creation.
        throw new Error(
          "There was an error finding your training site. Please try again and contact a system administrator if this problem persists."
        );
      }
      //Return true or false if a new group was created.
      return createdNewGroup;
    };

    var buildCreateUserArray = async function (user) {
      //Call LibUserCreate to create the user.
      var createUserArr = [];

      var userInfoObj = {};
      userInfoObj.name = "User Id";
      userInfoObj.value = user;
      createUserArr.push(userInfoObj);

      userInfoObj = {};
      userInfoObj.name = "Email Address";
      userInfoObj.value = emailAddress;
      createUserArr.push(userInfoObj);

      userInfoObj = {};
      userInfoObj.name = "First Name";
      userInfoObj.value = firstName;
      createUserArr.push(userInfoObj);

      userInfoObj = {};
      userInfoObj.name = "Last Name";
      userInfoObj.value = lastName;
      createUserArr.push(userInfoObj);

      userInfoObj = {};
      userInfoObj.name = "Site Name";
      userInfoObj.value = sitename;
      createUserArr.push(userInfoObj);

      var groupList = "";
      var password = "";
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

      userInfoObj = {};
      userInfoObj.name = "Group List";
      userInfoObj.value = groupList;
      createUserArr.push(userInfoObj);

      userInfoObj = {};
      userInfoObj.name = "Password";
      userInfoObj.value = password;
      createUserArr.push(userInfoObj);

      userInfoObj = {};
      userInfoObj.name = "Send Email";
      userInfoObj.value = "None";
      createUserArr.push(userInfoObj);

      userInfoObj = {};
      userInfoObj.name = "Related Records";
      userInfoObj.value = [recordID];
      createUserArr.push(userInfoObj);

      userInfoObj = {};
      userInfoObj.name = "Other Fields";
      userInfoObj.value = {
        "Individual ID": recordID,
      };
      createUserArr.push(userInfoObj);

      return createUserArr;
    };

    /*****************
         MAIN CODE
        ******************/

    sitename = firstlast;

    //Check if Site Name and User Names are in use; append number to the site name until the site name is unique.
    let createSiteResp = await verifySiteandUsers();
    //Measure that the API call completed successfully
    if (createSiteResp.meta.status != 200) {
      throw new Error(
        "There was an error with creating a new site named " +
          sitename +
          ". Please try submitting the Account Registration form again. Contact a system administrator if this problem persists."
      );
    }
    //Measure that we received something in the return array
    if (createSiteResp.data == undefined) {
      throw new Error(
        "There was an error with retrieving new site data. Please try submitting the Account Registration form again. Contact a system administrator if this problem persists."
      );
    }

    //Create the Site specific group siteGroup.
    let createGroup = await GetOrCreateSiteGroup(sitename);
    //Measure if a group was created. If it was not created, then the group siteGroup already exists in the system.
    if (!createGroup) {
      throw new Error(
        "The site group " +
          siteGroup +
          " already exists in the system. Please try submitting the Account Registration form again. Contact a system administrator if this problem persists."
      );
    }

    var applicantTempPassword = await randomPassword();
    var hrTempPassword = await randomPassword();
    var managerTempPassword = await randomPassword();

    //Create all 3 user accounts
    for (let user of userArray) {
      let createUserArr = await buildCreateUserArray(user);

      //// For local testing ////
      // const clientLibrary = require("../VVRestApi");
      // const scriptToExecute = require("../z_Plaidsoft/LibUserCreateNoEmailOption.js");
      // const ffcol = new clientLibrary.forms.formFieldCollection(createUserArr);
      // const createUserResp = await scriptToExecute.main(
      //   ffcol,
      //   vvClient,
      //   response
      // );
      //// End local testing ////

      //Create Applicant User Account
      let createUserResp = await vvClient.scripts.runWebService(
        "LibUserCreateNoEmailOption",
        createUserArr
      );

      //Measure that the API call completed successfully
      if (createUserResp.meta.status != 200) {
        throw new Error(
          "The call to the create user library returned with an unsuccessful result."
        );
      }
      //Measure that we received something in the return array
      if (createUserResp.data.length == 0) {
        throw new Error(
          "The call to create the user " +
            user +
            "  returned without data. Please try again or contact a system administrator."
        );
      }
      //Measure what was received in the return array
      if (
        createUserResp.data[0] == "Success" ||
        createUserResp.data[0] == "Minor Error" ||
        createUserResp.data[1] == "User Exists" ||
        createUserResp.data[1] == "User Disabled"
      ) {
        if (user.includes("Applicant")) {
          userGUID = createUserResp.data[2];
        }
        if (
          createUserResp.data[0] == "Success" ||
          createUserResp.data[0] == "Minor Error"
        ) {
          createUserResult += user + " " + createUserResp.data[0] + " ";
        } else {
          createUserResult += user + " " + createUserResp.data[1] + " ";
        }
      } else if (createUserResp.data[0] == "Error") {
        throw new Error(
          "The call to create the user " +
            user +
            " returned with an error. " +
            createUserResp.data[1]
        );
      } else {
        throw new Error(
          "The call to create the user " +
            user +
            " returned with an unhandled error."
        );
      }
    }

    //Call getForms to find the Email Notification Template for the welcome email to be sent.
    var emailFormQueryObj = {};
    emailFormQueryObj.q = "[Email Name] eq '" + welcomeEmailName + "'";
    emailFormQueryObj.expand = true;

    let emailResp = await vvClient.forms.getForms(
      emailFormQueryObj,
      emailNotifTemplateID
    );
    ////////////////////////
    // We could use Helper Functions to replace the following validations
    ///////////////////////
    let emailData = JSON.parse(emailResp);

    //Measure that the API call completed successfully
    if (emailData.meta.status != 200) {
      throw new Error(
        "The call to get the email template returned with an error. Please try again or contact a system administrator."
      );
    }
    if (!emailData.hasOwnProperty("data")) {
      throw new Error(
        "The call to get the email template returned successfully, but the data could not be accessed."
      );
    }
    if (emailData.data.length != 1) {
      throw new Error(
        "The call to get the email template named " +
          welcomeEmailName +
          " returned with " +
          emailData.data.length +
          " results. Only one template must exist. Please notify a system administrator."
      );
    }

    var tokenObject = [
      { name: "[First Name]", value: firstName },
      { name: "[URL]", value: baseURL },
      { name: "[Site Name]", value: sitename },
      { name: "[Applicant Username]", value: applicantUser },
      { name: "[Applicant Password]", value: applicantTempPassword },
      { name: "[HR Username]", value: hrUser },
      { name: "[HR Password]", value: hrTempPassword },
      { name: "[Manager Username]", value: managerUser },
      { name: "[Manager Password]", value: managerTempPassword },
    ];
    var emailRequestArray = [
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

    let sendEmailResp = await vvClient.scripts.runWebService(
      "LibEmailGenerateAndCreateCommunicationLog",
      emailRequestArray
    );
    if (sendEmailResp.meta.status == 200) {
      console.log(sendEmailResp);
      //Checking that resp has data attached to it.
      if (sendEmailResp.hasOwnProperty("data")) {
        if (sendEmailResp.data[0] == "Success") {
          logger.info("Succesfully created the communication log.");
          returnObj[0] = "Success";
          returnObj[1] = sendEmailResp.data[1];
          //return response.json(returnObj);
        } else if (sendEmailResp.data[0] == "Error") {
          throw new Error(
            "The call to send the email returned with an error. " +
              sendEmailResp.data[1]
          );
        } else {
          throw new Error(
            "The call to send the email returned with an unhandled error."
          );
        }
      } else {
        throw new Error(
          "The data could not be returned from the global script LibEmailGenerateAndCreateCommicationLog"
        );
      }
    } else {
      throw new Error(
        "The call to LibEmailGenerateAndCreateCommicationLog returned with an error."
      );
    }

    //Set up Job Application for Learner/Applicant

    //Collect field info for passing into the global function
    var formData = [];

    var revisionInfo = {};
    revisionInfo.name = "REVISIONID";
    revisionInfo.value = revisionId;
    formData.push(revisionInfo);

    var actionRequested = {};
    actionRequested.name = "ACTION";
    actionRequested.value = "Post";
    formData.push(actionRequested);

    var targetTemplate = {};
    targetTemplate.name = "TARGETTEMPLATENAME";
    targetTemplate.value = jobApplicationTemplateID;
    formData.push(targetTemplate);

    //Fields to populate on the Job Application.
    var updateFields = {};
    updateFields.name = "UPDATEFIELDS";
    updateFields.value = {};
    updateFields.value["Status"] = "New";
    updateFields.value["First Name"] = firstName;
    updateFields.value["Last Name"] = lastName;
    updateFields.value["Email"] = emailAddress;
    updateFields.value["User Name"] = applicantUser;
    updateFields.value["Site Name"] = sitename;
    updateFields.value["Date of Application"] = applicationDate;

    formData.push(updateFields);

    let postResp = await vvClient.scripts.runWebService(
      "LibFormUpdateorPostandRelateFormAsyncAwait",
      formData
    );
    if (postResp.meta.status != 200) {
      throw new Error(
        "Call to post new job application returned with an error. Status returned was: " +
          postResp.meta.status
      );
    }
    //check postResp.data for success here
    if (postResp.data[0] == "Success") {
      // postResp.data[2] is an object that includes additional form information which can be used for other actions if needed.
      jobApplicationId = postResp.data[2].revisionId;
    } else if (postResp.data[0] == "Error") {
      throw new Error(postResp.data[1]);
    } else {
      throw new Error(
        "Call to post new job application returned with a successful status, but invalid data."
      );
    }

    //Post Forms for 1 of 2 Job Applications for filler character Monica Knapp.

    //Collect field info for passing into the global function
    var formData = [];

    var revisionInfo = {};
    revisionInfo.name = "REVISIONID";
    revisionInfo.value = revisionId;
    formData.push(revisionInfo);

    var actionRequested = {};
    actionRequested.name = "ACTION";
    actionRequested.value = "Post";
    formData.push(actionRequested);

    var targetTemplate = {};
    targetTemplate.name = "TARGETTEMPLATENAME";
    targetTemplate.value = jobApplicationTemplateID;
    formData.push(targetTemplate);

    //Fields to populate on the Job Application.
    var updateFields = {};
    updateFields.name = "UPDATEFIELDS";
    updateFields.value = {};
    updateFields.value["Status"] = "Submitted Pending Review";
    updateFields.value["First Name"] = "Monica";
    updateFields.value["Last Name"] = "Knapp";
    updateFields.value["Email"] = "monica.knapp@mail.com";
    updateFields.value["User Name"] = "Monica_Knapp";
    updateFields.value["DOB"] = "11/15/1990";
    updateFields.value["Phone"] = "(123) 123-8989";
    updateFields.value["Position"] = "Technical Support I";
    updateFields.value["Previous Application"] = "No";
    updateFields.value["Currently Employed"] = "No";
    updateFields.value["Start Date"] = startDate;
    updateFields.value["Part Time"] = "true";
    updateFields.value["Acknowledgement"] = "true";
    updateFields.value["Site Name"] = sitename;
    updateFields.value["Date of Application"] = applicationDate;

    formData.push(updateFields);

    postResp = await vvClient.scripts.runWebService(
      "LibFormUpdateorPostandRelateFormAsyncAwait",
      formData
    );
    if (postResp.meta.status != 200) {
      throw new Error(
        "Call to post new job application for Monica Knapp returned with an error. Status returned was: " +
          postResp.meta.status
      );
    }
    //check postResp.data for success here
    if (postResp.data[0] == "Success") {
      // postResp.data[2] is an object that includes additional form information which can be used for other actions if needed.
      jobApplicationId = postResp.data[2].revisionId;
    } else if (postResp.data[0] == "Error") {
      throw new Error(postResp.data[1]);
    } else {
      throw new Error(
        "Call to post new job application for Monica Knapp returned with a successful status, but invalid data."
      );
    }

    //Post Forms for 2 of 2 Job Applications for filler character Jordan Mendez.
    //Collect field info for passing into the global function
    var formData = [];

    var revisionInfo = {};
    revisionInfo.name = "REVISIONID";
    revisionInfo.value = revisionId;
    formData.push(revisionInfo);

    var actionRequested = {};
    actionRequested.name = "ACTION";
    actionRequested.value = "Post";
    formData.push(actionRequested);

    var targetTemplate = {};
    targetTemplate.name = "TARGETTEMPLATENAME";
    targetTemplate.value = jobApplicationTemplateID;
    formData.push(targetTemplate);

    //Fields to populate on the Job Application.
    var updateFields = {};
    updateFields.name = "UPDATEFIELDS";
    updateFields.value = {};
    updateFields.value["Status"] = "Submitted Pending Review";
    updateFields.value["First Name"] = "Jordan";
    updateFields.value["Last Name"] = "Mendez";
    updateFields.value["Email"] = "jordanmendezzz@mail.com";
    updateFields.value["User Name"] = "Jordan_Mendez";
    updateFields.value["DOB"] = "05/07/2001";
    updateFields.value["Phone"] = "(123) 123-4545";
    updateFields.value["Position"] = "Technical Support I";
    updateFields.value["Previous Application"] = "Yes";
    updateFields.value["Currently Employed"] = "No";
    updateFields.value["Start Date"] = startDate;
    updateFields.value["Full Time"] = "true";
    updateFields.value["Acknowledgement"] = "true";
    updateFields.value["Site Name"] = sitename;
    updateFields.value["Date of Application"] = applicationDate;

    formData.push(updateFields);

    postResp = await vvClient.scripts.runWebService(
      "LibFormUpdateorPostandRelateFormAsyncAwait",
      formData
    );
    if (postResp.meta.status != 200) {
      throw new Error(
        "Call to post new job application for Jordan Mendez returned with an error. Status returned was: " +
          postResp.meta.status
      );
    }
    //check postResp.data for success here
    if (postResp.data[0] == "Success") {
      // postResp.data[2] is an object that includes additional form information which can be used for other actions if needed.
      jobApplicationId = postResp.data[2].revisionId;
    } else if (postResp.data[0] == "Error") {
      throw new Error(postResp.data[1]);
    } else {
      throw new Error(
        "Call to post new job application for Jordan Mendez returned with a successful status, but invalid data."
      );
    }

    //Post Forms for Employee Record filler character Nancy Bright.
    //Collect field info for passing into the global function
    var formData = [];

    var revisionInfo = {};
    revisionInfo.name = "REVISIONID";
    revisionInfo.value = revisionId;
    formData.push(revisionInfo);

    var actionRequested = {};
    actionRequested.name = "ACTION";
    actionRequested.value = "Post";
    formData.push(actionRequested);

    var targetTemplate = {};
    targetTemplate.name = "TARGETTEMPLATENAME";
    targetTemplate.value = employeeRecordTemplateID;
    formData.push(targetTemplate);

    //Fields to populate on the Job Application.
    var updateFields = {};
    updateFields.name = "UPDATEFIELDS";
    updateFields.value = {};
    updateFields.value["First Name"] = "Nancy";
    updateFields.value["Last Name"] = "Bright";
    updateFields.value["Personal Email"] = "nancy.bright@mail.co";
    updateFields.value["Gender"] = "Female";
    updateFields.value["Date of Birth"] = "12/31/1990";
    updateFields.value["Personal Phone"] = "(123) 123-1231";
    updateFields.value["Position"] = "Technical Support III";
    updateFields.value["Employee ID"] = "124412";
    updateFields.value["Hire Date"] = "01/01/2015";
    updateFields.value["Work Email"] = "nancy.bright@plaidsoftindustries.com";
    updateFields.value["Department"] = "Technical Support";
    updateFields.value["SiteName"] = sitename;

    formData.push(updateFields);

    postResp = await vvClient.scripts.runWebService(
      "LibFormUpdateorPostandRelateFormAsyncAwait",
      formData
    );
    if (postResp.meta.status != 200) {
      throw new Error(
        "Call to post new Employee Record for Nancy Bright returned with an error. Status returned was: " +
          postResp.meta.status
      );
    }
    //check postResp.data for success here
    if (postResp.data[0] == "Success") {
      // postResp.data[2] is an object that includes additional form information which can be used for other actions if needed.
      jobApplicationId = postResp.data[2].revisionId;
    } else if (postResp.data[0] == "Error") {
      throw new Error(postResp.data[1]);
    } else {
      throw new Error(
        "Call to post new Employee Record for Nancy Bright returned with a successful status, but invalid data."
      );
    }

    // DOCUMENTS COPY AND FOLDERS CREATION AND SETUP
    // The response from LibCopyFiles is not going to be waited on, so we can return the response immediately.
    // If any error occurs in LibCopyFiles, an email will be sent

    // Create Benefits Folder

    const benefitsParams = [
      {
        name: "Source Folder",
        value: `/`,
      },
      {
        name: "Target Folder",
        value: `/Benefits/Dental Enrollment/${sitename}`,
      },
      {
        name: "permissionGroups",
        value: [siteGroup],
      },
    ];

    //// For local testing ////
    // const clientLibrary = require("../VVRestApi");
    // const scriptToExecute6 = require("../z_Plaidsoft/LibCopyFiles.js");
    // const ffcol6 = new clientLibrary.forms.formFieldCollection(benefitsParams);
    // await scriptToExecute6.main(ffcol6, vvClient, response);
    //scriptToExecute6.main(ffcol6, vvClient, response);
    //// End local testing ////

    await vvClient.scripts.runWebService("LibCopyFiles", benefitsParams);

    // Creates Policy Folder and copies Policy Documents

    const policiesParams = [
      {
        name: "Source Folder",
        value: `/Policies and Procedures/Originals`,
      },
      {
        name: "Target Folder",
        value: `/Policies and Procedures/Sites/${sitename}`,
      },
      {
        name: "permissionGroups",
        value: [siteGroup],
      },
    ];

    await vvClient.scripts.runWebService("LibCopyFiles", policiesParams);

    // Creates Resume Folder and copies Resume Documents

    const resumesMainParams = [
      {
        name: "Source Folder",
        value: `/`,
      },
      {
        name: "Target Folder",
        value: `/Resumes/Sites/${sitename}`,
      },
      {
        name: "permissionGroups",
        value: [siteGroup],
      },
    ];

    const resumesParams = [
      {
        name: "Source Folder",
        value: `/Resumes/Originals`,
      },
      {
        name: "Target Folder",
        value: `/Resumes/Sites/${sitename}/Technical Support I`,
      },
      {
        name: "permissionGroups",
        value: [siteGroup],
      },
    ];

    await vvClient.scripts
      .runWebService("LibCopyFiles", resumesMainParams)
      .then(
        async () =>
          await vvClient.scripts.runWebService("LibCopyFiles", resumesParams)
      );

    // Return the successful or mostly successful response
    returnObj[0] = "Success";
    returnObj[1] = "Process Complete";
    returnObj[2] = [
      createUserResult,
      jobApplicationId,
      sitename,
      applicantUser,
      hrUser,
      managerUser,
    ];
  } catch (err) {
    logger.info(JSON.stringify(err));

    returnObj[0] = "Error";

    if (err && err.message) {
      returnObj[1] = err.message;
    } else {
      returnObj[1] =
        "An unhandled error has occurred. The message returned was: " + err;
    }
  } finally {
    response.json(200, returnObj);
  }
};
