let ErrorReporting = true;
const message = "The value must be in the range 1-5";

let RunAll = false;
if (ControlName == null) {
    RunAll = true;
}

//Score must be within 1-5 range
if (ControlName == "Customer Retention" || RunAll) {
    if (
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Customer Retention"), 1, "LessThan") ||
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Customer Retention"), 5, "GreaterThan")
    ) {
        VV.Form.SetValidationErrorMessageOnField("Customer Retention", message);
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Customer Retention");
    }
}

//Score must be within 1-5 range
if (ControlName == "Recomendation Score" || RunAll) {
    if (
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Recomendation Score"), 1, "LessThan") ||
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Recomendation Score"), 5, "GreaterThan")
    ) {
        VV.Form.SetValidationErrorMessageOnField("Recomendation Score", message);
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Recomendation Score");
    }
}

//Score must be within 1-5 range
if (ControlName == "Comparation Rate" || RunAll) {
    if (
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Comparation Rate"), 1, "LessThan") ||
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Comparation Rate"), 5, "GreaterThan")
    ) {
        VV.Form.SetValidationErrorMessageOnField("Comparation Rate", message);
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Comparation Rate");
    }
}

//Score must be within 1-5 range
if (ControlName == "Overall Experience" || RunAll) {
    if (
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Overall Experience"), 1, "LessThan") ||
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Overall Experience"), 5, "GreaterThan")
    ) {
        VV.Form.SetValidationErrorMessageOnField("Overall Experience", message);
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Overall Experience");
    }
}

return ErrorReporting;
