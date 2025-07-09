/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/ui/dialog"]
/**
 * @param {Object} dialog
 */, function (dialog) {
  /**
   * Function to be executed after page is initialized.
   *
   * @param {Object} context
   * @param {Record} context.currentRecord - Current form record
   * @param {string} context.mode - The mode in which the record is being accessed (create, copy, edit, view)
   * @since 2015.2
   */
  function pageInit(context) {
    // Check if the current record type is 'customer'
    if (context.currentRecord.type === "customer") {
      dialog
        .alert({
          title: "Welcome!",
          message: "Welcome to the Customer Record page!",
        })
        .then(function (result) {
          // Optional: You can do something after the user clicks OK on the alert
          // console.log("User clicked OK on the alert.");
          log.debug({
            title: "Testing",
            details: "Testing",
          });
        })
        .catch(function (error) {
          // Optional: Handle any error if the dialog fails to show
          log.error({
            title: "DIALOG_ERROR",
            details: error.message,
          });
        });
    }
  }

  return {
    pageInit: pageInit,
  };
});
