var validationResults = VV.Form.Template.FormValidation();

if (validationResults == true) {
  console.log("validation success");
  //Do an ajax save to commit the record to the database, then call the logic
  VV.Form.DoAjaxFormSave();
  //.then(function (resp) {
  VV.Form.Template.Submit();
  console.log("made it to after ajax");
  //});
} else {
  console.log("validation failed");
  var messageData =
    "All of the fields have not been filled in completely or there is an issue with the range of the data entered.  Highlight your mouse over the red icon to see how you can resolve the error stopping you from saving this form.";
  //VV.Form.Global.DisplayMessaging(messageData, 'Missing Information');
  alert(messageData);
}
