//Submit Public User Registration. This is VV.Form.Template.PublicUserRegistrationConfirm()
const currentURL = window.location.href;
let messageData = "";

if (VV.Form.FormUserID != "Public" && currentURL.indexOf("/Public/") != -1) {
    //If a non-public user is accessing a public link, redirect them to log out or use another browser
    messageData =
        "It looks like you are creating a new user account. You are already logged in. To create a new user account, log out or use another web browser. Use the logout link below, or click OK to stay on this screen.";
    messageData +=
        '<br><br><a href="' + VV.BaseAppUrl + "Login/" + VV.CustomerAlias + "/" + VV.CustomerDatabaseAlias + '?action=logout">Click here to log out.</a>';
    VV.Form.Global.DisplayMessaging(messageData);
} else {
    let confirmdata = "You have indicated that you want to submit your account registration. ";
    confirmdata += "Your username and temporary password will be emailed to you within 15 minutes. ";
    confirmdata += "<br><br>Select OK to continue or cancel to stop without taking any action.";
    let title = "Public Registration - Submit";

    const okfunction = function () {
        VV.Form.ShowLoadingPanel();

        const isFormValid = VV.Form.Template.FormValidation();

        if (isFormValid) {
            VV.Form.Template.PublicUserRegistration();
        } else {
            const validationMessage =
                "All of the fields have not been filled in completely.  Highlight your mouse over the red icon to see how you can resolve the error stopping you from saving this form.";
            VV.Form.Global.DisplayMessaging(validationMessage);
            VV.Form.HideLoadingPanel();
        }
    };
    const cancelfunction = function () {
        return;
    };

    VV.Form.Global.DisplayConfirmMessaging(confirmdata, title, okfunction, cancelfunction);
}
