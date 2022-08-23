//Form: Account Registration. Button: btnSubmit

console.log("Start Template.Submit");
//this function contains ajax call to node.js webservice called ApplicantRegistrationSubmit
var ProcessFunction = function () {
  VV.Form.ShowLoadingPanel();
  //This gets all of the form fields.
  var formData = VV.Form.getFormDataCollection();

  var FormInfo = {};
  FormInfo.name = "REVISIONID";
  FormInfo.value = VV.Form.DataID;
  formData.push(FormInfo);

  FormInfo = {};
  FormInfo.name = "Base URL";
  FormInfo.value = VV.BaseURL;
  formData.push(FormInfo);

  //Following will prepare the collection and send with call to server side script.
  var data = JSON.stringify(formData);
  var requestObject = $.ajax({
    type: "POST",
    url:
      VV.BaseAppUrl +
      "api/v1/" +
      VV.CustomerAlias +
      "/" +
      VV.CustomerDatabaseAlias +
      "/scripts?name=ApplicantRegistrationSubmit",
    contentType: "application/json; charset=utf-8",
    data: data,
    success: "",
    error: "",
  });

  return requestObject;
};

alert(
  "This process could take a few minutes. Please do not close the Form window until the message indicating the process is completed appears."
);
VV.Form.ShowLoadingPanel();

$.when(ProcessFunction()).always(function (resp) {
  VV.Form.HideLoadingPanel();
  var messageData = "";
  if (typeof resp.status != "undefined") {
    messageData =
      "A status code of " +
      resp.status +
      " returned from the server.  There is a communication problem with the  web servers.  If this continues, please contact the administrator and communicate to them this message and where it occurred.";
    //VV.Form.Global.DisplayMessaging(messageData);
    alert(messageData);
  } else if (typeof resp.statusCode != "undefined") {
    messageData =
      "A status code of " +
      resp.statusCode +
      " with a message of '" +
      resp.errorMessages[0].message +
      "' returned from the server.  This may mean that the servers to run the business logic are not available.";
    //VV.Form.Global.DisplayMessaging(messageData);
    alert(messageData);
  } else if (resp.meta.status == "200") {
    if (resp.data[0] != "undefined") {
      if (resp.data[0] == "Success") {
        //Do Successful Actions Here
        //returnObj[2] = [createUserResult, jobApplicationId, sitename, applicantUser, hrUser, managerUser]
        VV.Form.SetFieldValue("Status", "Submitted");
        VV.Form.SetFieldValue("Site Name", resp.data[2][2]);
        VV.Form.SetFieldValue("Applicant User", resp.data[2][3]);
        VV.Form.SetFieldValue("HR User", resp.data[2][4]);
        VV.Form.SetFieldValue("Manager User", resp.data[2][5]);

        messageData =
          "The form was submitted successfully, and this record has been saved.";

        //Display the message and save the form.
        //VV.Form.Global.DisplayMessaging(messageData);
        alert(messageData);
        VV.Form.DoPostbackSave();
      } else if (resp.data[0] == "Error") {
        messageData = "An error was encountered. " + resp.data[1];
        //VV.Form.Global.DisplayMessaging(messageData);
        alert(messageData);
      } else {
        messageData =
          "An unhandled response occurred when calling ApplicantRegistrationSubmit. The form will not save at this time.  Please try again or communicate this issue to support.";
        //VV.Form.Global.DisplayMessaging(messageData);
        alert(messageData);
      }
    } else {
      messageData = "The status of the response returned as undefined.";
      //VV.Form.Global.DisplayMessaging(messageData);
      alert(messageData);
    }
  } else {
    messageData =
      "The following error(s) were encountered: " + resp.data.error + "<br>";
    //VV.Form.Global.DisplayMessaging(messageData);
    alert(messageData);
  }
  console.log(messageData);
});
