import csv
import random
from datetime import datetime, timedelta

def generate_transactions(num_rows=200):
    # Setup data lists
    categories = {
        'Food': ['Gofood', 'GrabFood', 'Indomaret', 'Alfamart', 'Warung Makan', 'Starbucks', 'Kopi Kenangan', 'Hokben'],
        'Transport': ['Gojek', 'Grab', 'Bluebird', 'Shell', 'Pertamina', 'Parking'],
        'Shopping': ['Tokopedia', 'Shopee', 'Uniqlo', 'H&M', 'Grand Indonesia', 'Ace Hardware'],
        'Bills': ['PLN Token', 'Telkomsel', 'Indihome', 'BPJS', 'Apartment Maintenance'],
        'Salary': ['Monthly Salary', 'Bonus', 'Freelance Project'],
        'Investment': ['Bibit', 'Ajaib', 'Stockbit', 'Pluang'],
        'Entertainment': ['Netflix', 'Spotify', 'CGV Cinema', 'XXI Premiere']
    }
    
    accounts = ['BCA', 'Mandiri', 'Jenius', 'GoPay', 'OVO']
    
    transactions = []
    start_date = datetime.now() - timedelta(days=180)
    
    for _ in range(num_rows):
        # Random date
        days_offset = random.randint(0, 180)
        date = (start_date + timedelta(days=days_offset)).strftime('%Y-%m-%d')
        
        # Determine type (Income vs Expense)
        # 10% chance of income/salary
        if random.random() < 0.1:
            category = 'Salary'
            detail = random.choice(categories[category])
            # Income between 5M and 50M
            amount = random.randint(5000000, 50000000)
            # Round to nearest 100k
            amount = round(amount / 100000) * 100000
        else:
            # Expense
            category = random.choice([c for c in categories.keys() if c != 'Salary'])
            detail = random.choice(categories[category])
            
            if category == 'Investment':
                # Investment usually larger
                amount = -random.randint(1000000, 10000000)
            elif category == 'Bills':
                amount = -random.randint(100000, 2000000)
            else:
                # Daily expenses
                amount = -random.randint(10000, 500000)
                
            # Round to nearest 1k usually
            amount = round(amount / 1000) * 1000
            
        account = random.choice(accounts)
        
        transactions.append([date, detail, amount, account, category])
    
    # Sort by date
    transactions.sort(key=lambda x: x[0], reverse=True)
    
    return transactions

# Write to CSV
data = generate_transactions()
filename = 'transactions.csv'

with open(filename, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['date', 'transaction details', 'amount', 'bank account', 'category'])
    writer.writerows(data)

print(f"Generated {filename} with {len(data)} rows.")
