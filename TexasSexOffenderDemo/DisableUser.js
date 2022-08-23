// AJAX call and form logic

var ProcessSubmit = function () {
    VV.Form.ShowLoadingPanel();
    //Following will prepare the collection and send with call to server side script.
    var formData = VV.Form.getFormDataCollection();

    formData.push({
        name: "Form ID",
        value: VV.Form.DataID,
    });

    var data = JSON.stringify(formData);

    var requestObject = $.ajax({
        type: "POST",
        url: VV.BaseAppUrl + "api/v1/" + VV.CustomerAlias + "/" + VV.CustomerDatabaseAlias + "/scripts?name=IndividualRecordDisable",
        contentType: "application/json; charset=utf-8",
        data: data,
        success: "",
        error: "",
    });

    return requestObject;
};

VV.Form.ShowLoadingPanel();

$.when(ProcessSubmit()).always(function (resp) {
    VV.Form.HideLoadingPanel();
    var messageData = "";
    if (typeof resp.status != "undefined") {
        messageData =
            "A status code of " +
            resp.status +
            " returned from the server.  There is a communication problem with the  web servers.  If this continues, please contact the administrator and communicate to them this message and where it occured.";
        VV.Form.Global.DisplayMessaging(messageData);
    } else if (typeof resp.statusCode != "undefined") {
        messageData =
            "A status code of " +
            resp.statusCode +
            " with a message of '" +
            resp.errorMessages[0].message +
            "' returned from the server.  This may mean that the servers to run the business logic are not available.";
        VV.Form.Global.DisplayMessaging(messageData);
    } else if (resp.meta.status == "200") {
        if (resp.data[0] != "undefined") {
            if (resp.data[0] == "Success") {
                var successMessage = resp.data[1];
                VV.Form.SetFieldValue("Status", "User Disabled");
                VV.Form.SetFieldValue("User Disabled", "True");
                VV.Form.HideLoadingPanel();
                VV.Form.Global.DisplayMessaging(successMessage, "Success");
                VV.Form.DoPostbackSave();
            } else if (resp.data[0] == "Error") {
                messageData = "An error was encountered. " + resp.data[1];
                VV.Form.HideLoadingPanel();
                VV.Form.Global.DisplayMessaging(messageData, "Error");
            } else {
                messageData = "An unhandled response occurred.  The form will not save at this time.  Please try again or communicate this issue to support.";
                VV.Form.HideLoadingPanel();
                VV.Form.Global.DisplayMessaging(messageData);
            }
        } else {
            messageData = "The status of the response returned as undefined.";
            VV.Form.HideLoadingPanel();
            VV.Form.Global.DisplayMessaging(messageData);
        }
    } else {
        messageData = "The following error(s) were encountered: " + resp.data.error + "<br>";
        VV.Form.HideLoadingPanel();
        VV.Form.Global.DisplayMessaging(messageData);
    }
});
