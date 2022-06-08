let ErrorReporting = true;
const message = "The value must be in the range 1-5";

let RunAll = false;
if (ControlName == null) {
    RunAll = true;
}

//Score must be within 1-5 range
if (ControlName == "Time Until Answer" || RunAll) {
    if (
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Time Until Answer"), 1, "LessThan") ||
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Time Until Answer"), 5, "GreaterThan")
    ) {
        VV.Form.SetValidationErrorMessageOnField("Time Until Answer", message);
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Time Until Answer");
    }
}

//Score must be within 1-5 range
if (ControlName == "Friendly Tone" || RunAll) {
    if (
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Friendly Tone"), 1, "LessThan") ||
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Friendly Tone"), 5, "GreaterThan")
    ) {
        VV.Form.SetValidationErrorMessageOnField("Friendly Tone", message);
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Friendly Tone");
    }
}

//Score must be within 1-5 range
if (ControlName == "Staff Knowledge" || RunAll) {
    if (
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Staff Knowledge"), 1, "LessThan") ||
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Staff Knowledge"), 5, "GreaterThan")
    ) {
        VV.Form.SetValidationErrorMessageOnField("Staff Knowledge", message);
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Staff Knowledge");
    }
}

//Score must be within 1-5 range
if (ControlName == "Time Spended" || RunAll) {
    if (
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Time Spended"), 1, "LessThan") ||
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Time Spended"), 5, "GreaterThan")
    ) {
        VV.Form.SetValidationErrorMessageOnField("Time Spended", message);
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Time Spended");
    }
}

return ErrorReporting;
