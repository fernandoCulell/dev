//Disable User
var confirmdata = "You have indicated that you want to Disable User.  Select OK to continue or cancel to stop without taking any action.";
var title = "Disable User";

var okfunction = function () {
    var formValidationResults = VV.Form.Template.FormValidation();

    if (formValidationResults === true) {
        VV.Form.Template.DisableUser();
    } else {
        var validationMessage =
            "All of the fields have not been filled in completely.  Highlight your mouse over the red icon to see how you can resolve the error stopping you from saving this form.";
        VV.Form.Global.DisplayMessaging(validationMessage);
        VV.Form.HideLoadingPanel();
    }
};
var cancelfunction = function () {
    return;
};

var res = VV.Form.Global.DisplayConfirmMessaging(confirmdata, title, okfunction, cancelfunction);
