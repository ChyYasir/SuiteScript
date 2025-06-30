/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/log", "N/record"], /**
 * @param {Object} log - NetSuite's N/log module for logging messages.
 * @param {Object} record - NetSuite's N/record module for record types.
 */ function (log, record) {
  /**
   * Function to be executed before a record is loaded.
   * This runs when a user opens a record in the UI, or when the record is loaded programmatically.
   * Use this for setting initial values, or showing alerts on load.
   *
   * @param {Object} context
   * @param {Record} context.newRecord - The record object currently being loaded.
   * @param {string} context.type - The type of event (CREATE, VIEW, EDIT, COPY).
   */
  function beforeLoad(context) {
    // This will log every time any record is loaded in the UI or programmatically by a script
    // that triggers beforeLoad (like a connector if it does a full record load before processing).
    log.debug({
      title: "UE: beforeLoad Triggered",
      details:
        "Record Type: " +
        context.newRecord.type +
        ", Event Type: " +
        context.type,
    });

    // Only proceed with specific field logging if it's a Sales Order
    if (context.newRecord.type === record.Type.SALES_ORDER) {
      try {
        var newSalesOrder = context.newRecord;

        // Get values of the fields as they are loaded
        var giftCardValueOnLoad = newSalesOrder.getValue({
          fieldId: "custbody_shopify_gift_card_new",
        });
        var althandlingcostOnLoad = newSalesOrder.getValue({
          fieldId: "althandlingcost",
        });

        log.debug({
          title: "UE: beforeLoad - Sales Order Field Values on Load",
          details:
            "Sales Order ID: " +
            newSalesOrder.id +
            "\nMode: " +
            context.type +
            "\nCust Gift Card (custbody_shopify_gift_card_new) on Load: " +
            giftCardValueOnLoad +
            "\nHandling Cost (althandlingcost) on Load: " +
            althandlingcostOnLoad,
        });
      } catch (e) {
        log.error({
          title: "UE: beforeLoad - Script Error Logging Values",
          details: e.message,
        });
      }
    } else {
      log.debug({
        title: "UE: beforeLoad - Not a Sales Order",
        details:
          "Script will not log specific values for non-Sales Order record type: " +
          context.newRecord.type,
      });
    }
  }

  /**
   * The `beforeSubmit` entry point for User Event scripts.
   * This function executes before a record is submitted to the database.
   * It allows you to inspect and modify the record before it's saved.
   *
   * @param {Object} context
   * @param {Record} context.newRecord - The new record object being submitted.
   * @param {Record} context.oldRecord - The old record object (available on edit/xedit/delete).
   * @param {string} context.type - The type of event (CREATE, EDIT, XEDIT, DELETE, etc.).
   */
  function beforeSubmit(context) {
    // Log entry for beforeSubmit
    log.debug({
      title: "UE: beforeSubmit Triggered",
      details:
        "Record Type: " +
        context.newRecord.type +
        ", Event Type: " +
        context.type,
    });

    // IMPORTANT: Only proceed with the field assignment logic if it's a Sales Order.
    // We put this check *before* accessing specific SO fields.
    if (context.newRecord.type !== record.Type.SALES_ORDER) {
      log.debug({
        title: "UE: beforeSubmit - Not a Sales Order",
        details:
          "Script will not process non-Sales Order record type: " +
          context.newRecord.type,
      });
      return; // Exit the function if it's not a Sales Order
    }

    // Only apply assignment logic on CREATE, EDIT, XEDIT events for Sales Orders
    if (
      context.type === context.UserEventType.CREATE ||
      context.type === context.UserEventType.EDIT ||
      context.type === context.UserEventType.XEDIT
    ) {
      try {
        var newSalesOrder = context.newRecord;

        var giftCardValue = newSalesOrder.getValue({
          fieldId: "custbody_shopify_gift_card_new",
        });

        log.debug({
          title: "UE: beforeSubmit - Gift Card Value Retrieved",
          details:
            "Value from custbody_shopify_gift_card_new: " + giftCardValue,
        });

        if (
          giftCardValue !== null &&
          giftCardValue !== "" &&
          giftCardValue !== undefined
        ) {
          newSalesOrder.setValue({
            fieldId: "althandlingcost",
            value: parseFloat(giftCardValue), // Ensure numeric
            ignoreFieldChange: true,
          });

          log.debug({
            title: "UE: beforeSubmit - Value Assigned to althandlingcost",
            details: "althandlingcost set to: " + parseFloat(giftCardValue),
          });
        } else {
          log.debug({
            title: "UE: beforeSubmit - No Gift Card Value to Assign",
            details: "custbody_shopify_gift_card_new was empty or null.",
          });
        }
      } catch (e) {
        log.error({
          title: "UE: beforeSubmit - Script Error",
          details: e.message,
        });
      }
    } else {
      log.debug({
        title: "UE: beforeSubmit - Not CREATE/EDIT/XEDIT event",
        details:
          "Event type: " + context.type + " is not targeted for assignment.",
      });
    }
  }

  /**
   * The `afterSubmit` entry point for User Event scripts.
   * This function executes after a record has been successfully saved to the database.
   *
   * @param {Object} context
   * @param {Record} context.newRecord - The record object that was just submitted and saved.
   * @param {Record} context.oldRecord - The old record object (available on edit/xedit/delete).
   * @param {string} context.type - The type of event (CREATE, EDIT, XEDIT, DELETE, etc.).
   */
  function afterSubmit(context) {
    // Log entry for afterSubmit
    log.debug({
      title: "UE: afterSubmit Triggered",
      details:
        "Record Type: " +
        context.newRecord.type +
        ", Event Type: " +
        context.type,
    });

    // Only log values for Sales Orders
    if (context.newRecord.type === record.Type.SALES_ORDER) {
      try {
        var newSalesOrder = context.newRecord; // The record that was just saved

        // Get the value of the custom field after save
        var giftCardValueAfterSave = newSalesOrder.getValue({
          fieldId: "custbody_shopify_gift_card_new",
        });

        // Get the value of the standard field after save
        var althandlingcostAfterSave = newSalesOrder.getValue({
          fieldId: "althandlingcost",
        });

        log.debug({
          title: "UE: afterSubmit - Field Values After Save",
          details:
            "Sales Order ID: " +
            newSalesOrder.id +
            "\nShopify Gift Card Amount 2 (custbody_shopify_gift_card_new): " +
            giftCardValueAfterSave +
            "\nGift Card Redemption (althandlingcost): " +
            althandlingcostAfterSave,
        });
      } catch (e) {
        log.error({
          title: "UE: afterSubmit - Script Error Logging Values",
          details: e.message,
        });
      }
    } else {
      log.debug({
        title: "UE: afterSubmit - Not a Sales Order",
        details:
          "Script will not log values for non-Sales Order record type: " +
          context.newRecord.type,
      });
    }
  }

  // Return all entry point functions that NetSuite should execute.
  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
