//this function contains ajax call to node.js webservice called WEBSERVICENAME
const ProcessFunction = function () {
    VV.Form.ShowLoadingPanel();
    //This gets all of the form fields.
    let formData = VV.Form.getFormDataCollection();

    formData.push({
        name: "RevisionID",
        value: VV.Form.DataID,
    });

    //Following will prepare the collection and send with call to server side script.
    var data = JSON.stringify(formData);
    var requestObject = $.ajax({
        type: "POST",
        url: VV.BaseAppUrl + "api/v1/" + VV.CustomerAlias + "/" + VV.CustomerDatabaseAlias + "/scripts?name=AuthorityRecordPersonSearch", // Nombre del WS
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
                VV.Form.HideLoadingPanel();
                VV.Form.Global.DisplayMessaging(
                    "A new user account has been created. Check your email account for the credentials and access link.",
                    "Success"
                );
                VV.Form.SetFieldValue("User Account Created", "True")
                    .then(() => VV.Form.DoAjaxFormSave())
                    .then(() => VV.Form.Global.RedirectToSubmitted());
            } else {
                VV.Form.HideLoadingPanel();
                VV.Form.Global.DisplayMessaging(resp.data[1], "Error");
            }
        } else {
            messageData = "The status of the response returned as undefined.";
            VV.Form.Global.DisplayMessaging(messageData);
        }
    } else {
        messageData = "The following error(s) were encountered: " + resp.data.error + "<br>";
        VV.Form.Global.DisplayMessaging(messageData);
    }
});
