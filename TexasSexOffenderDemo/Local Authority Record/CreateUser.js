//CreateUser form template function
//This function contains ajax call to node.js webservice called UserAccountCreate
var ProcessUserAccountCreate = function () {
    VV.Form.ShowLoadingPanel();
    //This gets all of the form fields.
    var formData = VV.Form.getFormDataCollection();

    //Following will prepare the collection and send with call to server side script.
    var data = JSON.stringify(formData);
    var requestObject = $.ajax({
        type: "POST",
        url: VV.BaseAppUrl + "api/v1/" + VV.CustomerAlias + "/" + VV.CustomerDatabaseAlias + "/scripts?name=UserAccountCreate",
        contentType: "application/json; charset=utf-8",
        data: data,
        success: "",
        error: "",
    });

    return requestObject;
};

var LicenseeID = VV.Form.GetFieldValue("Licensee ID");

VV.Form.ShowLoadingPanel();

var formValidationResults = VV.Form.Template.FormValidation();

if (formValidationResults === true) {
    $.when(ProcessUserAccountCreate()).always(function (resp) {
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
                    messageData = "The Licensee User Account has been created.";
                    VV.Form.Global.DisplayMessaging(messageData, "Licensee User Record");

                    VV.Form.SetFieldValue("User UsID", resp.data[2]);
                    VV.Form.SetFieldValue("User SiteID", resp.data[3]);
                    VV.Form.SetFieldValue("Employee Created", "true");
                    VV.Form.SetFieldValue("User Account Created", "true");
                    VV.Form.SetFieldValue("Licensee ID", LicenseeID);

                    VV.Form.DoAjaxFormSave().then(function () {
                        window.opener.VV.Form.ReloadRepeatingRowControl("RRCUsers");
                    });
                    VV.Form.HideLoadingPanel();
                } else if (resp.data[0] == "Error") {
                    messageData = "The user you are trying to create already exits.";
                    VV.Form.SetFieldValue("User Account Created", "true");
                } else {
                    messageData =
                        "An unhandled response occurred from the unique record checking mechanism.  The form will not save at this time.  Please try again or communicate this issue to support.";
                }
            } else {
                messageData = "The status of the response returned as undefined.";
            }
        } else {
            messageData = resp.data.error + "<br>";
        }
        VV.Form.HideLoadingPanel();
        VV.Form.Global.DisplayMessaging(messageData, "Licensee User Record");
    });
} else {
    VV.Form.HideLoadingPanel();
    VV.Form.Global.DisplayMessaging(
        "All of the fields have not been filled in completely or there is an issue with the range of the data entered.  Highlight your mouse over the red icon to see how you can resolve the error stopping you from saving this form."
    );
}
