const formStatus = VV.Form.GetFieldValue("Status");
const accepted = VV.Form.GetFieldValue("Acceptance");

if (formStatus == "Submitted" && accepted == true) {
    VV.Form.SetFieldValue("Status", "Reviewed", true).then(VV.Form.DoAjaxFormSave());
} else {
    VV.Form.SetFieldValue("Status", "Submitted", true).then(VV.Form.DoAjaxFormSave());
}
