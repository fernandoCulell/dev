//FormValidation for the Offender Address
//pass in ControlName to validate a single item or nothing to validate everything.

var ErrorReporting = true;
var RunAll = false;

if (ControlName == null) {
    RunAll = true;
}

if (ControlName == "Street Address" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Street Address"), "Blank") == false) {
        VV.Form.SetValidationErrorMessageOnField("Street Address", "A value needs to be entered for the Street Address.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Street Address");
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

if (ControlName == "State" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("State"), "DDSelect") == false) {
        VV.Form.SetValidationErrorMessageOnField("State", "A value needs to be selected for the State.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("State");
    }
}

if (ControlName == "Zip Code" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Zip Code"), "Zip") == false) {
        VV.Form.SetValidationErrorMessageOnField("Zip Code", "A zip code needs to be entered, and it must be in the format of XXXXX or XXXXX-XXXX.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Zip Code");
    }
}

if (ErrorReporting == false) {
    return false;
} else {
    return true;
}
