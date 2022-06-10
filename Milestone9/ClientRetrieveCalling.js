// RetrieveClientData for Service Request

var webServiceName = "RetrieveClientData";
var formName = "Service Request";
var message; // the message is set below

VV.Form.ShowLoadingPanel();

function CallServerSide() {
    // IF THE FORM IS TOO LARGE DON'T USE THE FOLLOWING LINE AND SEND ONLY DE DATA YOU NEED
    var formData = VV.Form.getFormDataCollection(); // Get all the form fields data

    // Uncomment the following to add more data to the formData object.
    // var moreData = {
    //    name: 'This is the name you will use on getFieldValueByName',
    //    value: "Here goes the value"
    // };
    // formData.push(moreData);

    // Parse the data as a JSON string
    var data = JSON.stringify(formData);

    var requestObject = $.ajax({
        type: "POST",
        url: VV.BaseAppUrl + "api/v1/" + VV.CustomerAlias + "/" + VV.CustomerDatabaseAlias + "/scripts?name=" + webServiceName,
        contentType: "application/json; charset=utf-8",
        data: data,
        success: "",
        error: "",
    });

    return requestObject;
}

$.when(CallServerSide())
    .always(function (resp) {
        var errorOnConnection = typeof resp.status != "undefined";
        var errorOnServer = typeof resp.statusCode != "undefined";
        var serverSentOKResponse = resp.meta.status == "200";
        var wsSentResponse = resp.data[0] != undefined;
        var wsSentSuccessResponse = resp.data[0] == "Success";
        var wsSentErrorResponse = resp.data[0] == "Error";

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
                    message = formName + " has been saved successfully.";

                    // HANDLE SUCCESS RESPONSE HERE

                    Promise.all([
                        VV.Form.SetFieldValue("Address", resp.data[2].data[0].address),
                        VV.Form.SetFieldValue("Email", resp.data[2].data[0].email),
                        VV.Form.SetFieldValue("Name", resp.data[2].data[0].name),
                        VV.Form.SetFieldValue("Phone", resp.data[2].data[0].phone),
                        VV.Form.SetFieldValue("Parent Form ID", resp.data[2].data[0].instanceName),
                        VV.Form.SetFieldValue("State", resp.data[2].data[0].state).then(() => VV.Form.SetFieldValue("City", resp.data[2].data[0].city)),
                        VV.Form.SetFieldValue("ZIP", resp.data[2].data[0].zip),
                    ]).then(VV.Form.DoAjaxFormSave());
                } else if (wsSentErrorResponse) {
                    message = "An error was encountered. " + resp.data[1];
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
                "The following unhandled response occurred while attempting to retrieve data on the the server side get data logic." + resp.data.error + "<br>";
        }
    })
    .then(function () {
        VV.Form.Global.DisplayMessaging(message, formName);
        VV.Form.HideLoadingPanel();
    });
