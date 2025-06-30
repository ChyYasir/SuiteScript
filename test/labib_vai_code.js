function gift_certificates(options) {
  return options.data.map((d) => {
    try {
      if (
        !Array.isArray(
          d["giftcertificate-lineitems"]["giftcertificate-lineitem"]
        )
      )
        d["giftcertificate-lineitems"]["giftcertificate-lineitem"] = [
          d["giftcertificate-lineitems"]["giftcertificate-lineitem"],
        ];
    } catch (e) {
      console.log(e);
    }

    try {
      if (!Array.isArray(d["payments"]["payment"]))
        d["payments"]["payment"] = [d["payments"]["payment"]];
    } catch (e) {
      console.log(e);
    }

    if (d["giftcertificate-lineitems"]) {
      if (d["giftcertificate-lineitems"]["giftcertificate-lineitem"].length) {
        for (
          var j = 0;
          j < d["giftcertificate-lineitems"]["giftcertificate-lineitem"].length;
          j++
        ) {
          try {
            var taxRate =
              Number(
                d["giftcertificate-lineitems"]["giftcertificate-lineitem"][j][
                  "tax"
                ]
              ) * 100;

            console.log(taxRate);

            d.newProductLines.push({
              "line-type": "item",
              sku: "Gift Card - Test",
              netsuiteId: "2282",
              "base-price": Number(
                d["giftcertificate-lineitems"]["giftcertificate-lineitem"][j][
                  "base-price"
                ]
              ),
              "tax-rate": taxRate,
              quantity: 1,
              description: "",
              "tax-code": taxRate == 0 ? -7 : null,
            });
          } catch (e) {
            console.log(e);
          }
        }
      }
    }

    if (d["payments"]) {
      if (d["payments"]["payment"].length) {
        for (var j = 0; j < d["payments"]["payment"].length; j++) {
          try {
            var amount_it = Number(d["payments"]["payment"][j]["amount"]);

            if (d["payments"]["payment"][j]["gift-certificate"]) {
              // d.newProductLines.push({
              // 'line-type': 'item',
              // 'sku': 'Gift Card - Test',
              // 'netsuiteId': '18973',
              // 'base-price': amount_it * -1,
              // 'tax-rate': 0,
              // 'quantity': 1,
              // 'description': '',
              // 'tax-code': -7,
              // 'actual-tax-rate': 0
              // });
            }
          } catch (e) {
            console.log(e);
          }
        }
      }
    }

    return {
      data: d,
    };
  });
}
