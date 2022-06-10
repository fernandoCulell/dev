//pass in ControlName to validate a single item or nothing to validate everything.
var ErrorReporting = true;

var RunAll = false;
if (ControlName == null) {
    RunAll = true;
}

//Text Box that must be filled out
if (ControlName == "Address" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Address"), "Blank") == false) {
        VV.Form.SetValidationErrorMessageOnField("Address", "A value needs to be entered.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Address");
    }
}

//Drop-down must be selected
if (ControlName == "City" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("City"), "DDSelect") == false) {
        VV.Form.SetValidationErrorMessageOnField("City", "A value needs to be selected.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("City");
    }
}

//Text Box that must be filled out
if (ControlName == "Customer Number" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Customer Number"), "Blank") == false) {
        VV.Form.SetValidationErrorMessageOnField("Customer Number", "A value needs to be entered.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Customer Number");
    }
}

//Email Address is required and must be entered as a valid email address format.
if (ControlName == "Email" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Email"), "Email") == false) {
        VV.Form.SetValidationErrorMessageOnField("Email", "Please enter the Email in the form of a valid Email Address.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Email");
    }
}

//Text Box that must be filled out
if (ControlName == "Name" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Name"), "Blank") == false) {
        VV.Form.SetValidationErrorMessageOnField("Name", "A value needs to be entered.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Name");
    }
}

//Phone Number is required and must be a phone number format when entered.
if (ControlName == "Phone" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Phone"), "Phone") == false) {
        VV.Form.SetValidationErrorMessageOnField("Phone", "A phone number must be entered in the format of (XXX) XXX-XXXX.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Phone");
    }
}

//Drop-down must be selected
if (ControlName == "State" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("State"), "DDSelect") == false) {
        VV.Form.SetValidationErrorMessageOnField("State", "A value needs to be selected.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("State");
    }
}

//Zip code is required and must be in a zip code format.
if (ControlName == "ZIP" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("ZIP"), "Zip") == false) {
        VV.Form.SetValidationErrorMessageOnField("ZIP", "A zip code needs to be entered, and it must be in the format of XXXXX or XXXXX-XXXX.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("ZIP");
    }
}

return ErrorReporting;
