// Script Name:  AddressValidation
// parameters are:  Country, Street, City, State, Zip
// Script created by Eric Oyanadel
// if 'Suggestions Menu' is true it will run the us_autocompletions
// if all the fields are filled out run the us_verification
// if the country is set to CA run the intl_verification

let isValidating = VV.Form.GetFieldValue("Address Is Validating");
if (isValidating == "true") {
    // end prematurely, don't run AddressValidation
    return;
} else {
    VV.Form.SetFieldValue("Address Is Validating", "true", false);
}

var validateAddress = function () {
    var formData = [];
    var addressObject = {};
    addressObject.name = "addressObject";
    addressObject.country = "US";
    addressObject.address1 = VV.Form.GetFieldValue(Street);
    addressObject.city = VV.Form.GetFieldValue(City);
    addressObject.state = VV.Form.GetFieldValue(State);
    addressObject.zip = VV.Form.GetFieldValue(Zip);
    addressObject.suggestions = VV.Form.GetFieldValue("Suggestions Menu");
    formData.push(addressObject);

    var data = JSON.stringify(formData);
    var requestObject = $.ajax({
        type: "POST",
        url: VV.BaseAppUrl + "api/v1/" + VV.CustomerAlias + "/" + VV.CustomerDatabaseAlias + "/scripts?name=AddressVerification",
        contentType: "application/json; charset=utf-8",
        data: data,
        success: "",
        error: "",
    });

    return requestObject;
};

function autoFillAddressFields(resp) {
    console.log(resp.data[3]);
    var userStreet = VV.Form.GetFieldValue(Street);
    var userCity = VV.Form.GetFieldValue(City);
    var userState = VV.Form.GetFieldValue(State);
    var userZip = VV.Form.GetFieldValue(Zip);
    var currentCountry = VV.Form.GetFieldValue(Country);

    if (currentCountry == "US") {
        var zipCodeString = resp.data[3].zip_code + "-" + resp.data[3].zip_code_plus_4;
    } else {
        var zipCodeString = resp.data[3].postal_code;
    }
    // during AV's first pass; isValid will be false
    if (userStreet != "" && userStreet != resp.data[4]) {
        VV.Form.SetFieldValue(Street, resp.data[4], false);
    }
    if (userCity != "" && userCity != resp.data[3].city) {
        VV.Form.SetFieldValue(City, resp.data[3].city, false);
    }
    if (userState != "Select Item" && userState != resp.data[3].state) {
        VV.Form.SetFieldValue(State, resp.data[3].state, false);
    }
    if (userZip != "" && userZip != zipCodeString) {
        VV.Form.SetFieldValue(Zip, zipCodeString, false);
    }
}

function getAddressSuggestions(resp) {
    let suggestionsRespArray = resp.data[5].suggestions;

    let div = $("<div>");
    if (suggestionsRespArray.length < 1) {
        $(div).append(`
      <p>Sorry, but according to our database that address is invalid and there are no possible suggestions.</p>
      <p>You may continue if you believe this to be the correct address.</p>
      <p>Proceed with caution</p>
      `);
    } else {
        $(div).append(
            $("<p>").html(
                "Looks like the address entered is not a valid address, but our database has a few suggestions. Please note that addresses may not be fully valid"
            )
        );
        let myUl = $("<ul>").css("list-style-type", "none");
        $(div).append(myUl);
        $.grep(suggestionsRespArray, function (item) {
            $(myUl).append(
                $("<li>")
                    .css("list-style-type", "none")
                    .css("color", "#00607f")
                    .css("cursor", "pointer")
                    .css("padding", "2.5px, 0")
                    .css("font-family", "Source Sans Pro")
                    .attr("myValue", JSON.stringify(item))
                    .addClass("suggetionListItems")
                    .append(`${item.primary_line} ${item.city}, ${item.state} ${item.zip_code}`)
            );
        });

        $(document).one("click", function (e) {
            if ($(e.target).hasClass("suggetionListItems")) {
                let myValue = JSON.parse($(e.target).attr("myValue"));
                VV.Form.SetFieldValue(Street, myValue.primary_line, false);
                VV.Form.SetFieldValue(Zip, myValue.zip_code, false);
                $("#ModalOuterDiv").modal("hide");
            }
        });
    }

    // we set back to false incase another validation happens
    // we want to run the us_verifications
    VV.Form.SetFieldValue("Suggestions Menu", "false", false);
    VV.Form.SetFieldValue("Address Is Validating", "false", false);
    return div;
}

$.when(validateAddress()).always(function (resp) {
    console.log(resp);
    let messageData = "";
    // addressSring is a hidden field to match with user's input for onBLur Events
    let AddressString = "";
    let modalMissingUnitText = VV.Form.Global.AddressValidationMissingUnitModal();
    let undeliverableModal = VV.Form.Global.AddressValidationUndeliverableModal();

    // These are the parameters being passed to the modal
    // BuildIt,ModalTitle,ModalBody,ShowCloseButton,ShowOkButton,OkButtonTitle,OkButtonCallback

    if (typeof resp.status != "undefined") {
        messageData =
            "A status code of " +
            resp.status +
            " returned from the server. There is a communication problem with the  web servers. If this continues, please contact the administrator and communicate to them this message and where it occurred.";
        alert(messageData);
    } else if (typeof resp.statusCode != "undefined") {
        messageData =
            "A status code of " +
            resp.statusCode +
            " with a message of '" +
            resp.errorMessages[0].message +
            "' returned from the server. This may mean that the servers to run the business logic are not available.";
        alert(messageData);
    } else if (resp.meta.status == 200) {
        if (resp.data[0] != "undefined") {
            if (resp.data[0] == "Success") {
                if (resp.data[2] == "undeliverable") {
                    // INTERNATIONAL SECTION
                    if (resp.data[5].country == "CA") {
                        AddressString = resp.data[4] + resp.data[3].city + resp.data[3].state + resp.data[3].postal_code;
                        VV.Form.SetFieldValue(AddressStringField, AddressString.replace(/ /g, "").toUpperCase(), false);
                        VV.Form.Global.MessageModal(false, "Address Validation", undeliverableModal, false, true, "Ok");
                    }
                    // UNDELIVERABLE - SUGGESTIONS SECTION
                    if (resp.data[3] != null) {
                        VV.Form.SetFieldValue("Suggestions Menu", "true", false);

                        AddressString = resp.data[4] + resp.data[3].city + resp.data[3].state + resp.data[3].zip_code;
                        VV.Form.SetFieldValue(AddressStringField, AddressString.replace(/ /g, "").toUpperCase(), false);

                        validateAddress().then((data) => {
                            //Comparison check between the Adress String Field on the form and the Suggestion Menu Address to see if it the same.
                            if (data.data[5].suggestions.length == 1) {
                                let resAddress =
                                    data.data[5].suggestions[0].primary_line +
                                    data.data[5].suggestions[0].city +
                                    data.data[5].suggestions[0].state +
                                    data.data[5].suggestions[0].zip_code;
                                // if they match, kill function
                                if (AddressString == resAddress.replace(/ /g, "").toUpperCase()) {
                                    return VV.Form.SetFieldValue("Suggestions Menu", "false");
                                }
                            } else {
                                VV.Form.Global.MessageModal(false, "Address Validation", getAddressSuggestions(data), true, false);
                            }
                        });
                        VV.Form.SetFieldValue("Suggestions Menu", "false");
                    }
                }
                // DELIVERABLE SECTION
                if (resp.data[2] == "deliverable") {
                    autoFillAddressFields(resp);
                    // MISSING UNIT SECTION
                } else if (resp.data[2].includes("_unit")) {
                    VV.Form.Global.MessageModal(false, "Address Validation", modalMissingUnitText, false, true, "Ok");
                }
                AddressString = resp.data[4] + resp.data[3].city + resp.data[3].state + resp.data[3].zip_code;
                VV.Form.SetFieldValue(AddressStringField, AddressString.replace(/ /g, "").toUpperCase(), false);
                // ERROR SECTION
            } else if (resp.data[0] == "Error") {
                messageData = "An error was encountered. " + resp.data[1];
                alert(messageData);
            } else {
                messageData =
                    "An unhandled response occurred when calling PopulateFieldsOnLoad. The form will not save at this time.  Please try again or communicate this issue to support.";
                alert(messageData);
            }
        } else {
            messageData = "The status of the response returned as undefined.";
            alert(messageData);
        }
    }

    // regardless of what happens, we want to allow AddressValidation again
    VV.Form.SetFieldValue("Address Is Validating", "false");
});
