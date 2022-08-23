// Script Name:  AddressValidationOnBlur
// Parameters:   None
// Script created by Eric Oyanadel

var street = VV.Form.GetFieldValue("Street");
var city = VV.Form.GetFieldValue("City");
var state = VV.Form.GetFieldValue("State");
var zip = VV.Form.GetFieldValue("Zip Code");

var responseAddressString = VV.Form.GetFieldValue("Address String");
var userFormAddressString = street + city + state + zip;
userFormAddressString = userFormAddressString.replace(/ /g, "").toUpperCase();

if (responseAddressString != userFormAddressString) {
    VV.Form.SetFieldValue("Address String", userFormAddressString);

    if (street && city && state != "Select Item" && zip) {
        VV.Form.Global.AddressValidation("Country", "Street", "City", "State", "Zip Code", "Address String");
    }
}
