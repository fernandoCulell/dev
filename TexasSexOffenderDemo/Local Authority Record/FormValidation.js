//FormValidation for the Licensee User Record

//pass in ControlName to validate a single item or nothing to validate everything.
var ErrorReporting = true;
var RunAll = false;
if (ControlName == null) {
    RunAll = true;
}

if (ControlName == "First Name" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("First Name"), "Blank") == false) {
        VV.Form.SetValidationErrorMessageOnField("First Name", "A value needs to be entered for the First Name.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("First Name");
    }
}

if (ControlName == "Last Name" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Last Name"), "Blank") == false) {
        VV.Form.SetValidationErrorMessageOnField("Last Name", "A value needs to be entered for the Last Name.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Last Name");
    }
}

if (ControlName == "County" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("County"), "Blank") == false) {
        VV.Form.SetValidationErrorMessageOnField("County", "A value needs to be entered for the Municipality or County.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("County");
    }
}

if (ControlName == "City" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("City"), "Blank") == false) {
        VV.Form.SetValidationErrorMessageOnField("City", "A value needs to be entered for the City.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("City");
    }
}

if (ControlName == "Zip" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Zip"), "Zip") == false) {
        VV.Form.SetValidationErrorMessageOnField("Zip", "A zip code needs to be entered, and it must be in the format of XXXXX or XXXXX-XXXX.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Zip");
    }
}

if (ControlName == "Email Address" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Email Address"), "Blank") == false) {
        VV.Form.SetValidationErrorMessageOnField("Email Address", "A value needs to be entered for the Email Address.");
        ErrorReporting = false;
    } else {
        if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Email Address"), "Email") == false) {
            VV.Form.SetValidationErrorMessageOnField("Email Address", "The email you have entered needs to be in a valid email format.");
            ErrorReporting = false;
        } else {
            VV.Form.ClearValidationErrorOnField("Email Address");
        }
    }
}

if (ErrorReporting == false) {
    return false;
} else {
    return true;
}
