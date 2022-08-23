// Modal Section
VV.Form.Global.LoadModalSettings();
VV.Form.Global.MessageModal(true);
VV.Form.SetFieldValue("Tab Control", "Profile");

// Individual Record, OnLoad event.

//var currentURL = window.location.href;
//var hideTrade = VV.Form.GetFieldValue('Hide CTPRSS');
//if (VV.Form.FormUserID != 'Public' && currentURL.indexOf('/Public/') != -1) {
//    //If a non-public user is accessing a public link, redirect them to log out or use another browser
//    messageData = "It looks like you are creating a new user account. You are already logged in. To create a new user account, log out or use another web browser. Use the logout link below, or click OK to stay on this screen.";
//    messageData += '<br><br><a href="' + VV.BaseAppUrl + 'Login/' + VV.CustomerAlias + '/' + VV.CustomerDatabaseAlias + '?action=logout">Click here to log out.</a>';
//    VV.Form.Global.DisplayMessaging(messageData);
//}
//else if (VV.Form.FormUserID == 'Public' && currentURL.indexOf('&DataID=') != -1 && hideTrade != 'true') {
//    //The public submit function has redirected us to the read-only version of the form. Provision the user account.
//    messageData = "Please wait while your user account is provisioned.";
//    VV.Form.Global.DisplayMessaging(messageData);
//    VV.Form.Template.PublicUserProvision();
//}
//else if (VV.Form.IsReadOnly == 'True') { //This will be undefined on redirect from public submit
//    VV.Form.SetFieldValue('Tab Control', 'Profile');
//}
//else {
//    //Full Load
//    VV.Form.SetFieldValue('Tab Control', 'Profile');

//    //Check if the user exists yet. Don't call web service if not.
//    if (VV.Form.getDropDownListText('Status') == 'Active' || VV.Form.getDropDownListText('Status') == 'User Disabled') {
//        VV.Form.Template.GetUserInfo();
//    }
//}

// Set to hide containers if registering for an Operational Permit
//function getUrlParams() {
//    var vars = {};
//    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
//        vars[key] = value;
//    });
//    return vars;
//}

//if (getUrlParams().IsOpPerm == 'true') {
//    VV.Form.Global.SetFieldUpdate('Hide CTPRSS', 'True')
//    VV.Form.Global.SetFieldUpdate('Operational Permit Individual', 'True')
//}
//if (getUrlParams().IsRentals == 'true') {
//    VV.Form.Global.SetFieldUpdate('Hide CTPRSS', 'True')
//    VV.Form.Global.SetFieldUpdate('Rentals Individual', 'True')
//}

var btnVal = '[vvfieldname="btnTabProfile"]';
var $btn = $(btnVal);
$btn.trigger("click");
