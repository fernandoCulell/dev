/*
    Script Name:   RangeValidation
    Customer:      VisualVault
    Purpose:       The purpose of this function is to validate the inclussion of a number within a certain range of given numbers.
    Parameters:    The following represent variables passed into the function:  
                    Passed Values:  FieldList, StartNumber, EndNumber
                    The following are passed into this function in the following order:
                    FieldList - an array with the cell control fields names to be validated.
                    StartNumber - the inicial value for the range to be compared.  Can come in as a string.
                    EndNumber - the ending value for the range to be compared.  Can come in as a string.
    Return Value:  The following represents the value being returned from this function:
                    True if each compared field value is within the given range, false if not.        
    Date of Dev:   
    Last Rev Date: 05/10/2022
    Revision Notes:
    05/10/2011 - Fernando Culell: Initial creation. 
*/

var pass = true;
var start = Number(StartNumber);
var end = Number(EndNumber);
var message = `The value must be in the range ${start}-${end}.`;

for (const field of FieldList) {
    if (
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue(field), start, "LessThan") ||
        VV.Form.Global.CentralNumericValidation(VV.Form.GetFieldValue(field), end, "GreaterThan")
    ) {
        VV.Form.SetValidationErrorMessageOnField(field, message);
        pass = false;
    } else {
        VV.Form.ClearValidationErrorOnField(field);
    }
}

return pass;
