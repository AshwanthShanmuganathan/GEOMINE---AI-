import pdfplumber
import json
import os
import sys

pdf_path = r"D:\project\EVS\Mining_report.pdf"
out_dir = r"D:\project\EVS\data\extracted"
txt_path = os.path.join(out_dir, "tamilnadu_mines_report.txt")
json_path = os.path.join(out_dir, "tamilnadu_mines_report.json")

os.makedirs(out_dir, exist_ok=True)

results = []
full_txt = ""

print(f"Loading PDF from {pdf_path} using pdfplumber...")
try:
    with pdfplumber.open(pdf_path) as pdf:
        num_pages = len(pdf.pages)
        print(f"Loaded successfully. Pages: {num_pages}")
        
        for i, page in enumerate(pdf.pages):
            sys.stdout.write(f"\rConverting page {i+1}/{num_pages}...")
            sys.stdout.flush()
            text_content = page.extract_text()
            if text_content is None:
                text_content = ""
                
            lines = [line.strip() for line in text_content.split('\n') if line.strip()]
            
            # Simple heuristic
            current_heading = lines[0] if lines else "Unknown Heading"
            if len(current_heading) > 150:
                current_heading = "Unknown Heading"

            page_data = {
                "page": i + 1,
                "section": "Unknown Section",
                "heading": current_heading,
                "content": text_content
            }
            results.append(page_data)
            
            full_txt += f"--- PAGE {i + 1} ---\n"
            full_txt += text_content + "\n\n"
            
except Exception as e:
    print(f"\nError processing PDF: {e}")
    sys.exit(1)

print(f"\nWriting JSON to {json_path}...")
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"Writing TXT to {txt_path}...")
with open(txt_path, 'w', encoding='utf-8') as f:
    f.write(full_txt)

print("\n--- SUMMARY OF EXTRACTION ---")
samples = [0, 5, 10, 50, 100]
for idx in samples:
    if idx < len(results):
        print(f"\nPAGE {idx+1}")
        print(f"Heading: {results[idx]['heading']}")
        print(f"Content (first 200 chars): {results[idx]['content'][:200].replace(chr(10), ' ')}")

print("\nProcessing completed successfully.")
