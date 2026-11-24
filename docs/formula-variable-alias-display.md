# Available-variable aliases

The Universal formula editor groups supplied standard and sample input keys into one dropdown per input group. The trigger shows its input group and alias count; it does not retain a selected alias. Each option shows its exact token, description and existing value or auto indicator. Selecting it calls the existing insert-at-cursor action. Statistics and unrelated variables remain separate; numbered samples remain distinct.

In a Universal formula with standard or sample inputs enabled, the corresponding dropdown shows Weight, Concentration, Absorbance, Peak Areas and Titre Value. Select the name that fits the method. Each token reads the same stored value as Weight for that standard or sample. An expression may use several names and still requires just one value per input. Concentration retains its existing unit setting. Pick the appropriate alias for your method, because selecting a name performs no unit conversion.

The editor stores the additional aliases used by a formula. Existing formulas that assigned one of these names to a separate input or manual variable keep that binding. Verified formulas preserve the chosen expression, and the executable definition uses the same canonical keys and hash as the equivalent Weight expression.

Test Formula, analyst entry, formula review, saved worksheets, printing and formula repair use the same input bindings. The test screens label the single field with the names used by the formula, including the specific names used for a numbered sample.

The existing formula editor, repair and save permissions apply. This change adds no endpoint or permission grant.
