//pass in ControlName to validate a single item or nothing to validate everything.
var ErrorReporting = true;

var RunAll = false;
if (ControlName == null) {
    RunAll = true;
}

//Value must be a number greater than 0
if (ControlName == "Customer Number" || RunAll) {
    if (VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Customer Number"), 1, "LessThan")) {
        VV.Form.SetValidationErrorMessageOnField("Customer Number", "Customer Number must be greater than 0");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Customer Number");
    }
}

//Date must be today or before today
if (ControlName == "Date" || RunAll) {
    if (VV.Form.Global.CentralDateValidation(VV.Form.GetFieldValue("Date"), "TodayorBefore") == false) {
        VV.Form.SetValidationErrorMessageOnField("Date", "The date must be today or before today.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Date");
    }
}

//Value must be greater than 0
if (ControlName == "Price Per Hour" || RunAll) {
    if (VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Price Per Hour"), 1, "LessThan")) {
        VV.Form.SetValidationErrorMessageOnField("Price Per Hour", "Price Per Hour must be greater than 0");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Price Per Hour");
    }
}

//Value must be greater than 0
if (ControlName == "Work Hours" || RunAll) {
    if (VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue("Work Hours"), 1, "LessThan")) {
        VV.Form.SetValidationErrorMessageOnField("Work Hours", "Work Hours must be greater than 0");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Work Hours");
    }
}

return ErrorReporting;
