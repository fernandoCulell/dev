//Template GUID goes here
var templateId = "78788ce4-9cf0-ec11-a9de-98ec327f9301";

//Form fields go here
var FieldNameVariable = VV.Form.GetFieldValue("Form ID");

//Field mappings
var fieldMappings = [
    {
        sourceFieldName: "Form ID",
        sourceFieldValue: FieldNameVariable,
        targetFieldName: "Offender ID",
    },
];

//Call the fill in global script
VV.Form.Global.FillinAndRelateForm(templateId, fieldMappings);
