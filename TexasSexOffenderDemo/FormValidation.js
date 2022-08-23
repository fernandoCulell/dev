//FormValidation for the Individual Record
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

if (ControlName == "Middle Initial" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Middle Initial"), "Blank") == false) {
        VV.Form.SetValidationErrorMessageOnField("Middle Initial", "A value needs to be entered for the Middle Initial.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Middle Initial");
    }
}

if (ControlName == "Sex" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Sex"), "DDSelect") == false) {
        VV.Form.SetValidationErrorMessageOnField("Sex", "A value needs to be selected for the Sex field.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Sex");
    }
}

if (ControlName == "Race" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Race"), "DDSelect") == false) {
        VV.Form.SetValidationErrorMessageOnField("Race", "A value needs to be selected for the Race.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Race");
    }
}

if (ControlName == "Height Feet" || RunAll) {
    if (VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Height Feet"), 1, "GreaterThan") == false) {
        VV.Form.SetValidationErrorMessageOnField("Height Feet", "A value greater than 1 needs to be entered for Height Feet.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Height Feet");
    }
}

if (ControlName == "Weight" || RunAll) {
    if (VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Weight"), 1, "GreaterThan") == false) {
        VV.Form.SetValidationErrorMessageOnField("Weight", "A value greater than 1 needs to be entered for Weight.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Weight");
    }
}

if (ControlName == "Street" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Street"), "Blank") == false) {
        VV.Form.SetValidationErrorMessageOnField("Street", "A value needs to be entered for the Street.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Street");
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

if (ControlName == "Personal Email" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Personal Email"), "Email") == false) {
        VV.Form.SetValidationErrorMessageOnField("Personal Email", "Please enter the Personal Email in the form of a valid Email.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Personal Email");
    }
}

if (ControlName == "Retype Email" || RunAll) {
    if (VV.Form.GetFieldValue("Retype Email") != VV.Form.GetFieldValue("Personal Email")) {
        VV.Form.SetValidationErrorMessageOnField("Retype Email", "Email does not match Personal Email.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Retype Email");
    }
}

if (ControlName == "DOB" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("DOB"), "Blank") == false) {
        VV.Form.SetValidationErrorMessageOnField("DOB", "Please enter a valid Date of Birth.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("DOB");
    }
}

if (ErrorReporting == false) {
    return false;
} else {
    return true;
}
