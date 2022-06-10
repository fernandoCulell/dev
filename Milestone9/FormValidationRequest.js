//pass in ControlName to validate a single item or nothing to validate everything.
var ErrorReporting = true;

var RunAll = false;
if (ControlName == null) {
    RunAll = true;
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

//Drop-down must be selected
if (ControlName == "Service" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Service"), "DDSelect") == false) {
        VV.Form.SetValidationErrorMessageOnField("Service", "A value needs to be selected.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Service");
    }
}

return ErrorReporting;
