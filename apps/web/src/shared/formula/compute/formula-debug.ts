export const DEBUG_CLIENT_FORMULA_SETTINGS = `{"expression":"((:sampleAvg/:standardAvg)*(:sampleInput.wt/:standardInput.wt)*:wt*:p)","decimalPlaces":2,"percent":false,"percentageResults":false,"type":3,"standardInTable":true,"firstColumnPurpose":"standard","standardInput":true,"sampleInput":true,"sampleInTable":true,"calculateAvgInTable":true,"calculateSdInTable":true,"calculateRsdInTable":true,"averageAllResults":false,"formulaInTable":false,"noOfSamples":2,"noOfReadings":5,"constants":{},"headers":["Standard","Sample 1","Sample 2"],"standardInputs":[{"label":"Weight (g)","value":"","key":"wt"}],"sampleInputs":[[{"label":"Weight (g)","value":"","key":"wt"}],[{"label":"Weight (g)","value":"","key":"wt"}]],"manualVars":{},"manualVarLabels":{"wt":"","p":""},"manualVarExpressions":{},"columnExpressions":{},"rowHeaders":[{"id":"row-1","label":"Reading 1"},{"id":"row-2","label":"Reading 2"},{"id":"row-3","label":"Reading 3"},{"id":"row-4","label":"Reading 4"},{"id":"row-5","label":"Reading 5"}],"data":[["","",""],["","",""],["","",""],["","",""],["","",""]],"numberOfSamples":2,"numberOfReadings":5}`;

export const isFormulaDebugEnabled = () => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("debugFormula") === "1";
};
