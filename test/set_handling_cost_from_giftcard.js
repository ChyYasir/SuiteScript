/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/log", "N/record"], /**
 * @param {Object} log - NetSuite's N/log module for logging messages.
 * @param {Object} record - NetSuite's N/record module for working with records (needed for record.Type).
 */ function (log, record) {
  // Added 'record' to the function arguments

  /**
   * The `beforeSubmit` entry point for User Event scripts.
   * This function executes before a record is submitted to the database.
   * It allows you to inspect and modify the record before it's saved.
   *
   * @param {Object} context
   * @param {Record} context.newRecord - The new record object being submitted.
   * @param {Record} context.oldRecord - The old record object (available on edit/xedit/delete).
   * @param {string} context.type - The type of event (CREATE, EDIT, XEDIT, DELETE, etc.).
   * @since 2015.2
   */
  function beforeSubmit(context) {
    // Check if the script is running on a Sales Order and for relevant event types.
    // Using record.Type.SALES_ORDER for robustness.
    if (
      context.type === context.UserEventType.CREATE ||
      context.type === context.UserEventType.EDIT ||
      context.type === context.UserEventType.XEDIT
    ) {
      try {
        // Get the new record object that is about to be saved.
        var newSalesOrder = context.newRecord;

        // Get the value from the custom gift card field.
        // The fieldId 'custbody_shopify_gift_card_new' is your custom transaction body field.
        var giftCardValue = newSalesOrder.getValue({
          fieldId: "custbody_shopify_gift_card_new",
        });

        // Log the retrieved value for debugging purposes.
        log.debug({
          title: "BeforeSubmit: Gift Card Value Retrieved",
          details:
            "Value from custbody_shopify_gift_card_new: " + giftCardValue,
        });

        // Check if the giftCardValue is not null, empty, or undefined before trying to assign it.
        if (
          giftCardValue !== null &&
          giftCardValue !== "" &&
          giftCardValue !== undefined
        ) {
          // Set the value to the standard 'althandlingcost' field.
          // Ensure the value is a number for the 'althandlingcost' field, as it's typically a currency/number field.
          // parseFloat() is a good way to convert string values to numbers.
          newSalesOrder.setValue({
            fieldId: "althandlingcost",
            value: parseFloat(giftCardValue), // Convert to number
            // ignoreFieldChange: true, // Optional, but often good practice
          });

          // Log the action for debugging.
          log.audit({
            title: "BeforeSubmit: Value Assigned",
            details:
              "althandlingcost successfully set to: " +
              parseFloat(giftCardValue),
          });
        } else {
          log.debug({
            title: "BeforeSubmit: No Action",
            details:
              "custbody_shopify_gift_card_new was empty or null. althandlingcost was not modified.",
          });
          // If you uncommented the logic to clear althandlingcost if giftCardAmount is empty,
          // you'd put that logic here.
        }
      } catch (e) {
        // Catch any unexpected errors during script execution and log them.
        log.error({
          title: "BeforeSubmit Script Error",
          details: e.message,
        });
        // IMPORTANT: Throwing an error in beforeSubmit will prevent the record from being saved.
        // If you want to allow the save even if the script fails, remove or comment out 'throw e;'.
        // For critical validation, you would throw the error.
        // throw e;
      }
    } else {
      // Log if the script is not running on a Sales Order or not in a relevant context.
      log.debug({
        title: "BeforeSubmit: Script Not Executed",
        details:
          "Script not applicable for record type: " +
          context.newRecord.type +
          " or event type: " +
          context.type,
      });
    }
  }

  // Return the entry point function(s) that NetSuite should execute.
  return {
    beforeSubmit: beforeSubmit,
  };
});
