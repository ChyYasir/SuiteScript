import csv
import json


import requests
import time
import os
from dotenv import load_dotenv

load_dotenv() 
# store credentials to fetch variants with SKUs
# Note: This is a sample token. Replace it with your actual token.
shop = os.environ.get("SHOPIFY_SHOP_NAME")
token = os.environ.get("SHOPIFY_ACCESS_TOKEN")

# input file names
csv1_path = '2025 May to July Seabags orders - SFCCOrdersHeaderExportforShopify-457.csv'#orders
csv2_path = '2025 May to July Seabags orders - SFCCOrdersDetailExportforShopify-719.csv'#items
# csv3_path = 'payments.csv'

# output file name
output_json_path = '2025_May_to_July_production_combined_orders.json'

def run_and_track_bulk_operation(shop_name, access_token, interval=10, download_dir="./downloads", verify_ssl=True):
    # Step 1: Create the bulk operation
    bulk_query = '''
    mutation {
      bulkOperationRunQuery(
        query: """
        {
          productVariants {
            edges {
              node {
                id
                sku
              }
            }
          }
        }
        """
      ) {
        bulkOperation {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
    '''
    
    headers = {
        "X-Shopify-Access-Token": access_token,
        "Content-Type": "application/json"
    }
    url = f"https://{shop_name}.myshopify.com/admin/api/2024-10/graphql.json"
    
    response = requests.post(url, json={"query": bulk_query}, headers=headers, verify=verify_ssl)
    response.raise_for_status() 
    response_data = response.json()
    
    try:
        bulk_id = response_data["data"]["bulkOperationRunQuery"]["bulkOperation"]["id"]
        print(f"Bulk operation created with ID: {bulk_id}")
    except Exception as e:
        raise Exception(f"Failed to create bulk operation: {response_data}")
    
    # Step 2: Poll the bulk operation status
    bulk_status_query = '''
    query getBulkStatus($id: ID!) {
      node(id: $id) {
        ... on BulkOperation {
          url
          completedAt
          status
        }
      }
    }
    '''
    print("Waiting for bulk operation to complete...")
    download_url = None

    while True:
        time.sleep(interval)
        status_response = requests.post(url, json={
            "query": bulk_status_query,
            "variables": {"id": bulk_id}
        }, headers=headers, verify=verify_ssl)
        status_data = status_response.json()
        node = status_data["data"]["node"]
        
        print(f"Status: {node['status']}")
        if node["status"] == "COMPLETED":
            download_url = node["url"]
            break
        elif node["status"] in ["FAILED", "CANCELED"]:
            raise Exception(f"Bulk operation failed: {node}")

    # Step 3: Download the file
    if not os.path.exists(download_dir):
        os.makedirs(download_dir)

    file_name = f"{bulk_id.split('/')[-1]}.jsonl"
    file_path = os.path.join(download_dir, file_name)

    with requests.get(download_url, stream=True, verify=verify_ssl) as r:
        r.raise_for_status()
        with open(file_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

    print(f"File downloaded to {file_path}")
    return file_path

# Ensure both shop and token are available
if not shop or not token:
    print("Error: SHOPIFY_SHOP_NAME or SHOPIFY_ACCESS_TOKEN environment variables not set.")
    print("Please set them in your .env file or system environment.")
    exit(1)
path = run_and_track_bulk_operation(shop, token, interval=10, verify_ssl=False)
print("Download completed:", path)

def jsonl_to_csv(jsonl_path, sku_variant_id_csv):
    print(f"Converting {jsonl_path} to CSV...")
    with open(jsonl_path, 'r', encoding='utf-8') as f:
        with open(sku_variant_id_csv, 'w', newline='', encoding='utf-8') as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=['sku', 'id'])
            writer.writeheader()
            for line in f:
                data = json.loads(line)
                writer.writerow(data)

sku_variant_id_csv = 'variants_dev.csv'
jsonl_to_csv(path, sku_variant_id_csv)





def map_sku_to_id(sku_variant_id_csv):
    sku_to_id = {}
    with open(sku_variant_id_csv, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sku_to_id[row['sku']] = row['id']
    return sku_to_id

sku_to_id = map_sku_to_id(sku_variant_id_csv)

# Step 1: Parse CSV1 and build base order structure
orders = {}

with open(csv1_path, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    reader.fieldnames = [h.strip() for h in reader.fieldnames]  # Strip header names
    for raw_row in reader:
        row = {k.strip(): v.strip() for k, v in raw_row.items()}
        doc_num = row['Document Number']
        # Skip orders with total less than or equal to 0.0
        if float(row['SFCC Transaction Total'].replace(",", "")) <= 0.0:
            continue
        orders[doc_num] = {
            "document_number": doc_num,
            "date": row['Date'],
            "customer": row['Customer'],
            "order_number": row['SFCC Order Number'],
            "billing_to": row['SFCC Bill to Customer'],
            "shipping_to": row['SFCC Ship to Customer'],
            "email": row['SFCC Customer Email'],
            "phone": row['SFCC Customer Phone'],
            "totals": {
                "tax": float(row['SFCC Tax Total']),
                "subtotal": float(row['SFCC Total'].replace(",", "")),
                "total": float(row['SFCC Transaction Total'].replace(",", ""))
            },
            "shipping_address": {
                "line1": row['Address: Shipping Address Line 1'],
                "line2": row['Address: Shipping Address Line 2'],
                "city": row['Address: Shipping Address City'],
                "state": row['Address: Shipping Address State'],
                "zip": row['Address: Shipping Address Zip Code'],
                "country": row['Address: Shipping Address Country']
            },
            "billing_address": {
                "line1": row['Address: Billing Address Line 1'],
                "line2": row['Address: Billing Address Line 2'],
                "city": row['Address: Billing Address City'],
                "state": row['Address: Billing Address State'],
                "zip": row['Address: Billing Address Zip Code'],
                "country": row['Address: Billing Address Country']
            },
            "items": []
        }

# Step 2: Parse CSV2 and attach items
with open(csv2_path, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    reader.fieldnames = [h.strip() for h in reader.fieldnames]
    for raw_row in reader:
        row = {k.strip(): v.strip() for k, v in raw_row.items()}
        doc_num = row['Document Number']
        item_name = row.get('Item: Display Name', '') or row.get('Item: Name', '')
        item_code = row.get('Item: Name', '')

        # Skip empty or discount entries
        if item_name.lower() == 'sfcc order discount':
            continue

        try:
            quantity = int(row.get('Quantity', '1') or '1')
        except ValueError:
            quantity = 1

        try:
            net_amount = float(row.get('Amount (Net)', '0') or '0')
        except ValueError:
            net_amount = 0.0

        item = {
            "sku": item_code,
            "variant_id": sku_to_id.get(item_code, ''),
            "name": item_name,
            "quantity": quantity,
            "net_amount": net_amount
        }

        if doc_num in orders:
            orders[doc_num]['items'].append(item)
        else:
            print(f"⚠️ Skipped item with unknown Document Number: {doc_num}")

# Step 3: Output JSON
with open(output_json_path, 'w', encoding='utf-8') as f:
    json.dump(list(orders.values()), f, indent=2)

print(f"✅ Orders combined and saved to: {output_json_path}")
