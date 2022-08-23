//this function contains ajax call to node.js webservice called WEBSERVICENAME
var ProcessFunction = function () {
  VV.Form.ShowLoadingPanel();
  //This gets all of the form fields.
  var formData = VV.Form.getFormDataCollection();

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
      "/scripts?name=LibFormDocumentUploaded",
    contentType: "application/json; charset=utf-8",
    data: data,
    success: "",
    error: "",
  });

  return requestObject;
};

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
      if (resp.data[0] == "Success" || resp.data[0] == "No Docs") {
        //Do Successful Actions Here
        messageData = "The process completed successfully. " + resp.data[1];
        //VV.Form.Global.DisplayMessaging(messageData);
        alert(messageData);
        //Postback save should always be the last thing that happens.
        VV.Form.DoPostbackSave();
      } else if (resp.data[0] == "Error") {
        messageData = "An error was encountered. " + resp.data[1];
        //VV.Form.Global.DisplayMessaging(messageData);
        alert(messageData);
      } else {
        messageData =
          "An unhandled response occurred.  The form will not save at this time.  Please try again or communicate this issue to support.";
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
});
