// LibFormDocumentUploaded for LibFormDocmentUploaded Test Harness

let webServiceName = "LibFormDocumentUploaded";
let formName = "LibFormDocmentUploaded Test Harness";
let message; // the message is set below

VV.Form.ShowLoadingPanel();

function CallServerSide() {
  // IF THE FORM IS TOO LARGE DON'T USE THE FOLLOWING LINE AND SEND ONLY DE DATA YOU NEED
  let formData = VV.Form.getFormDataCollection(); // Get all the form fields data

  // Uncomment the following to add more data to the formData object.
  // let moreData = {
  //    name: 'This is the name you will use on getFieldValueByName',
  //    value: "Here goes the value"
  // };
  // formData.push(moreData);

  // Parse the data as a JSON string
  let data = JSON.stringify(formData);

  let requestObject = $.ajax({
    type: "POST",
    url:
      VV.BaseAppUrl +
      "api/v1/" +
      VV.CustomerAlias +
      "/" +
      VV.CustomerDatabaseAlias +
      "/scripts?name=" +
      webServiceName,
    contentType: "application/json; charset=utf-8",
    data: data,
    success: "",
    error: "",
  });

  return requestObject;
}

$.when(CallServerSide())
  .always(function (resp) {
    let errorOnConnection = typeof resp.status != "undefined";
    let errorOnServer = typeof resp.statusCode != "undefined";
    let serverSentOKResponse = resp.meta.status == "200";
    let wsSentResponse = resp.data[0] != undefined;
    let wsSentSuccessResponse = resp.data[0] == "Success";
    let wsSentErrorResponse = resp.data[0] == "Error";

    if (errorOnConnection) {
      message =
        "A status code of " +
        resp.status +
        " returned from the server.  There is a communication problem with the web servers.  If this continues, please contact the administrator and communicate to them this message and where it occurred.";
    } else if (errorOnServer) {
      message =
        "A status code of " +
        resp.statusCode +
        " with a message of '" +
        resp.errorMessages[0].message +
        "' returned from the server.  This may mean that the servers to run the business logic are not available.";
    } else if (serverSentOKResponse) {
      if (wsSentResponse) {
        if (wsSentSuccessResponse) {
          // HANDLE SUCCESS RESPONSE HERE

          message = "The process completed successfully. " + resp.data[1];
          //VV.Form.Global.DisplayMessaging(messageData);

          // Alway use .then for waiting for the form to save before running another function
          VV.Form.DoAjaxFormSave();
        } else if (wsSentErrorResponse) {
          message = "An error was encountered. " + resp.data[2];
        } else {
          message =
            "An unhandled response occurred when calling " +
            webServiceName +
            ". The form will not save at this time.  Please try again or communicate this issue to support.";
        }
      } else {
        message = "The status of the response returned as undefined.";
      }
    } else {
      message =
        "The following unhandled response occurred while attempting to retrieve data on the the server side get data logic." +
        resp.data.error +
        "<br>";
    }
  })
  .then(function () {
    VV.Form.Global.DisplayMessaging(message, formName);
    VV.Form.HideLoadingPanel();
  });
