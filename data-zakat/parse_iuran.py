import pandas as pd
import json
import os
import math

base_dir = '/Users/samudra/Library/CloudStorage/OneDrive-ForumZakat/Downloads/HAZANA'
excel_path = f'{base_dir}/Sumber Data/UL1/Daily Activity.xlsx'
json_path = f'{base_dir}/hazana-beta/data-zakat/komitmen_iuran.json'

with open(json_path, 'r') as f:
    komitmen_data = json.load(f)

# Create a lookup for fast matching
komitmen_lookup = {}
for item in komitmen_data:
    if 'history' not in item:
        item['history'] = {}
    
    # Matching by exact NAMA LEMBAGA or NOMOR ANGGOTA if available
    name = str(item.get('nama_lembaga', '')).strip().lower()
    komitmen_lookup[name] = item

xl = pd.ExcelFile(excel_path)
years = ['2022', '2023', '2024', '2025', '2026', '2027']
months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']

# Handle possible sheet name variations
actual_sheet_names = xl.sheet_names

for year in years:
    target_sheet = f'IURAN {year}'
    matched_sheet = None
    for s in actual_sheet_names:
        if s.strip().upper() == target_sheet:
            matched_sheet = s
            break
            
    if not matched_sheet:
        print(f"Sheet for {year} not found!")
        continue
        
    print(f"Processing sheet: {matched_sheet}")
    df = pd.read_excel(excel_path, sheet_name=matched_sheet)
    
    # Iterate through rows
    for index, row in df.iterrows():
        # Create a case-insensitive, strip-whitespace version of row for easy access
        clean_row = {str(k).strip().upper(): v for k, v in row.items()}
        
        lembaga_name = str(clean_row.get('NAMA LEMBAGA', '')).strip().lower()
        nomor_anggota = str(clean_row.get('NOMOR ANGGOTA', '')).strip()
        
        if (not lembaga_name or lembaga_name == 'nan') and (not nomor_anggota or nomor_anggota == 'nan'):
            continue
            
        matched_item = None
        
        # Try matching by NOMOR ANGGOTA first
        if nomor_anggota and nomor_anggota != 'nan':
            for item in komitmen_data:
                if nomor_anggota in str(item.get('id_lembaga', '')):
                    matched_item = item
                    break
        
        if not matched_item and lembaga_name and lembaga_name != 'nan':
            matched_item = komitmen_lookup.get(lembaga_name)
            if not matched_item:
                # Try partial match
                for k, v in komitmen_lookup.items():
                    if k in lembaga_name or lembaga_name in k:
                        matched_item = v
                        break
                        
        if not matched_item and 'abulyatama' in lembaga_name:
            matched_item = komitmen_lookup.get('laz abulyatama indonesia')
                    
        if matched_item:
            if year not in matched_item['history']:
                matched_item['history'][year] = {}
                
            for month in months:
                month_col = None
                for col in df.columns:
                    if str(col).strip().upper() == month:
                        month_col = col
                        break
                        
                if month_col:
                    val = row.get(month_col)
                    # If value is not NaN, it means paid (could be nominal, date, or "DONE")
                    is_paid = False
                    try:
                        if float(val) > 0:
                            is_paid = True
                    except:
                        if str(val).strip().lower() not in ['0', '0.0', 'nan', 'none', 'false', '']:
                            is_paid = True
                            
                    if is_paid:
                        matched_item['history'][year][month.capitalize()] = True
                    
                    if year == '2022' and matched_item.get('nama_lembaga') == 'Dompet Dhuafa':
                        print(f"2022 DD -> {month}: col={month_col}, val={val}, is_paid={is_paid}")

with open(json_path, 'w') as f:
    json.dump(komitmen_data, f, indent=4)

print("Berhasil mengupdate komitmen_iuran.json dengan riwayat pembayaran")
