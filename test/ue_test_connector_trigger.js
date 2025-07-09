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
   */
  function beforeLoad(context) {
    log.debug({
      title: "UE: beforeLoad Triggered",
      details:
        "Record Type: " +
        context.newRecord.type +
        ", Event Type: " +
        context.type,
    });

    // Check if the record is a Sales Order OR a Cash Sale
    var isRelevantRecordType =
      context.newRecord.type === record.Type.SALES_ORDER ||
      context.newRecord.type === record.Type.CASH_SALE;

    if (isRelevantRecordType) {
      try {
        var currentRecord = context.newRecord;

        var giftCardValueOnLoad = currentRecord.getValue({
          fieldId: "custbody_shopify_gift_card_new",
        });
        var althandlingcostOnLoad = currentRecord.getValue({
          fieldId: "althandlingcost",
        });

        log.debug({
          title: "UE: beforeLoad - Relevant Record Field Values on Load",
          details:
            "Record ID: " +
            currentRecord.id +
            "\nMode: " +
            context.type +
            "\nShopify Gift Card Amount 2 (custbody_shopify_gift_card_new) on Load: " +
            giftCardValueOnLoad +
            "\nGift Card Redemption (althandlingcost) on Load: " +
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
        title: "UE: beforeLoad - Not a Sales Order or Cash Sale",
        details:
          "Script will not log specific values for record type: " +
          context.newRecord.type,
      });
    }
  }

  /**
   * The `beforeSubmit` entry point for User Event scripts.
   * This function executes before a record is submitted to the database.
   */
  function beforeSubmit(context) {
    log.debug({
      title: "UE: beforeSubmit Triggered",
      details:
        "Record Type: " +
        context.newRecord.type +
        ", Event Type: " +
        context.type,
    });

    // Check if the record is a Sales Order OR a Cash Sale
    var isRelevantRecordType =
      context.newRecord.type === record.Type.SALES_ORDER ||
      context.newRecord.type === record.Type.CASH_SALE;

    if (!isRelevantRecordType) {
      log.debug({
        title: "UE: beforeSubmit - Not a Sales Order or Cash Sale",
        details:
          "Script will not process record type: " + context.newRecord.type,
      });
      return;
    }

    // Only apply assignment logic on CREATE, EDIT, XEDIT events
    if (
      context.type === context.UserEventType.CREATE ||
      context.type === context.UserEventType.EDIT ||
      context.type === context.UserEventType.XEDIT
    ) {
      try {
        var newRecord = context.newRecord;

        var giftCardAmount2 = newRecord.getValue({
          fieldId: "custbody_shopify_gift_card_new",
        });

        log.debug({
          title: "UE: beforeSubmit - Shopify Gift Card Amount 2 Retrieved",
          details:
            "Value from Shopify Gift Card Amount 2 (custbody_shopify_gift_card_new): " +
            giftCardAmount2,
        });

        if (
          giftCardAmount2 !== null &&
          giftCardAmount2 !== "" &&
          giftCardAmount2 !== undefined
        ) {
          newRecord.setValue({
            fieldId: "althandlingcost",
            value: parseFloat(giftCardAmount2), // Ensure numeric
            ignoreFieldChange: true,
          });

          log.debug({
            title: "UE: beforeSubmit - Value Assigned to Gift Card Redemption",
            details:
              "Gift Card Redemption (althandlingcost) set to: " +
              parseFloat(giftCardAmount2),
          });
        } else {
          log.debug({
            title: "UE: beforeSubmit - No Gift Card Redemption to Assign",
            details:
              "Shopify Gift Card Amount 2 (custbody_shopify_gift_card_new) was empty or null.",
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
   */
  function afterSubmit(context) {
    log.debug({
      title: "UE: afterSubmit Triggered",
      details:
        "Record Type: " +
        context.newRecord.type +
        ", Event Type: " +
        context.type,
    });

    // Check if the record is a Sales Order OR a Cash Sale
    var isRelevantRecordType =
      context.newRecord.type === record.Type.SALES_ORDER ||
      context.newRecord.type === record.Type.CASH_SALE;

    if (isRelevantRecordType) {
      try {
        var newRecord = context.newRecord;

        var giftCardAmount2AfterSave = newRecord.getValue({
          fieldId: "custbody_shopify_gift_card_new",
        });

        var giftCardRedemptionAfterInitialSave = newRecord.getValue({
          fieldId: "althandlingcost",
        });

        log.debug({
          title: "UE: afterSubmit - Field Values After Initial Save",
          details:
            "Record ID: " +
            newRecord.id +
            "\nShopify Gift Card Amount 2 (custbody_shopify_gift_card_new) after initial save: " +
            giftCardAmount2AfterSave +
            "\nGift Card Redemption (althandlingcost) after initial save: " +
            giftCardRedemptionAfterInitialSave,
        });
      } catch (e) {
        log.error({
          title: "UE: afterSubmit - Script Error Logging Values",
          details: e.message,
        });
      }
    } else {
      log.debug({
        title: "UE: afterSubmit - Not a Sales Order or Cash Sale",
        details:
          "Script will not process non-relevant record type: " +
          context.newRecord.type,
      });
    }
  }

  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
