const formValidation = (params) => {
    let validator;

    switch (params.validator) {
        case "central":
            validator = VV.Form.Global.CentralValidation;
            break;
        case "DOB":
            validator = VV.Form.Global.CentralDOBValidation;
            break;
        default:
        // code block
    }

    if (ControlName == params.field || RunAll) {
        if (validator(VV.Form.GetFieldValue(params.field), params.type, params.other) == false) {
            VV.Form.SetValidationErrorMessageOnField(params.field, params.message);
            ErrorReporting = false;
        } else {
            VV.Form.ClearValidationErrorOnField(params.field);
        }
    }
};

//pass in ControlName to validate a single item or nothing to validate everything.
var ErrorReporting = true;

var RunAll = false;
if (ControlName == null) {
    RunAll = true;
}

//Drop-down must be selected
if (ControlName == "Other Language" || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue("Other Language"), "DDSelect") == false) {
        VV.Form.SetValidationErrorMessageOnField("Other Language", "A value needs to be selected.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("Other Language");
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

//User must be 18 years old at least
if (ControlName == "DOB" || RunAll) {
    if (VV.Form.Global.CentralDOBValidation("DOBGreaterThan", "DOB", 18) == false) {
        VV.Form.SetValidationErrorMessageOnField("DOB", "You must be 18 years old at least in order to complete this form.");
        ErrorReporting = false;
    } else {
        VV.Form.ClearValidationErrorOnField("DOB");
    }
}

return ErrorReporting;
