/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/log"], /**
 * @param {Object} log - NetSuite's N/log module for logging messages.
 */ function (log) {
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
    // We want this logic to apply when a Sales Order is created, edited, or inline edited (XEDIT).
    if (
      context.newRecord.type === "salesorder" &&
      (context.type === context.UserEventType.CREATE ||
        context.type === context.UserEventType.EDIT ||
        context.type === context.UserEventType.XEDIT)
    ) {
      try {
        // Get the new record object that is about to be saved.
        var newSalesOrder = context.newRecord;

        // Get the value from the custom gift card field.
        var giftCardValue = newSalesOrder.getValue({
          fieldId: "custbody_shopify_gift_card_new",
        });

        // Log the retrieved value for debugging purposes.
        log.debug({
          title: "Script Execution: Gift Card Value Retrieved",
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
          // We use ignoreFieldChange: true to prevent this change from triggering other client-side
          // scripts or field change events, which can sometimes lead to unexpected behavior.
          newSalesOrder.setValue({
            fieldId: "althandlingcost",
            value: giftCardValue,
            ignoreFieldChange: true, // Optional, but often good practice
          });

          // Log the action for debugging.
          log.debug({
            title: "Script Execution: Value Assigned",
            details: "althandlingcost successfully set to: " + giftCardValue,
          });
        } else {
          // If the custom gift card field is empty, we might want to clear the handling cost.
          // Uncomment the following lines if you want this behavior.
          /*
                        newSalesOrder.setValue({
                            fieldId: 'althandlingcost',
                            value: '', // Set to empty string to clear the field
                            ignoreFieldChange: true
                        });
                        log.debug({
                            title: 'Script Execution: Handling Cost Cleared',
                            details: 'custbody_shopify_gift_card_new was empty or null. althandlingcost cleared.'
                        });
                        */
          log.debug({
            title: "Script Execution: No Action",
            details:
              "custbody_shopify_gift_card_new was empty or null. althandlingcost was not modified.",
          });
        }
      } catch (e) {
        // Catch any unexpected errors during script execution and log them.
        log.error({
          title: "Script Error: beforeSubmit",
          details: e.message,
        });
      }
    } else {
      // Log if the script is not running on a Sales Order or not in a relevant context.
      log.debug({
        title: "Script Not Executed",
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
