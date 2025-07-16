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
   * Logs the values of the custom payment method field and the standard payment method field as the record is loaded.
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

        // --- Payment Method Fields on Load ---
        var customPaymentMethodOnLoad = currentRecord.getValue({
          fieldId: "custbody_payment_method", // Your custom payment method field
        });
        var standardPaymentMethodOnLoad = currentRecord.getText({
          // Use getText for List/Record fields to get display value
          fieldId: "paymentmethod", // Standard payment method field
        });
        // --- End Payment Method Fields ---

        log.debug({
          title: "UE: beforeLoad - Relevant Record Field Values on Load",
          details:
            "Record ID: " +
            currentRecord.id +
            "\nMode: " +
            context.type +
            "\nCustom Payment Method (custbody_payment_method) on Load: " +
            customPaymentMethodOnLoad +
            "\nStandard Payment Method (paymentmethod) on Load: " +
            standardPaymentMethodOnLoad,
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
   * This function will assign the custom payment method field value to the standard payment method field.
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

        // --- Custom Payment Method to Standard Payment Method Logic ---
        var customPaymentMethodId = newRecord.getValue({
          fieldId: "custbody_payment_method", // Your custom payment method field
        });

        log.debug({
          title: "UE: beforeSubmit - Custom Payment Method Retrieved",
          details:
            "Value from Custom Payment Method (custbody_payment_method): " +
            customPaymentMethodId,
        });

        if (
          customPaymentMethodId !== null &&
          customPaymentMethodId !== "" &&
          customPaymentMethodId !== undefined
        ) {
          // IMPORTANT: paymentmethod is a List/Record field. It expects the INTERNAL ID of a Payment Method record.
          // Ensure custbody_payment_method holds the correct internal ID.
          newRecord.setValue({
            fieldId: "paymentmethod", // Standard payment method field
            value: customPaymentMethodId, // Assign the internal ID
            ignoreFieldChange: true,
          });

          log.debug({
            title:
              "UE: beforeSubmit - Value Assigned to Standard Payment Method",
            details:
              "Payment Method (paymentmethod) set to Internal ID: " +
              customPaymentMethodId,
          });
        } else {
          log.debug({
            title: "UE: beforeSubmit - No Custom Payment Method to Assign",
            details:
              "Custom Payment Method (custbody_payment_method) was empty or null.",
          });
        }
        // --- End Custom Payment Method Logic ---
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
   * This function will log the final values of the payment method fields after the record is saved.
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

        // --- Payment Method Fields After Initial Save ---
        var customPaymentMethodAfterSave = newRecord.getValue({
          fieldId: "custbody_payment_method",
        });
        var standardPaymentMethodAfterSave = newRecord.getText({
          // Use getText for List/Record fields
          fieldId: "paymentmethod",
        });

        log.debug({
          title: "UE: afterSubmit - Field Values After Initial Save",
          details:
            "Record ID: " +
            newRecord.id +
            "\nCustom Payment Method (custbody_payment_method) after initial save: " +
            customPaymentMethodAfterSave +
            "\nStandard Payment Method (paymentmethod) after initial save: " +
            standardPaymentMethodAfterSave,
        });
        // --- End Payment Method Fields ---
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
