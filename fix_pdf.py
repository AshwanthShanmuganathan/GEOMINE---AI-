import os

def fix_pdf_crlf(input_path, output_path):
    with open(input_path, 'rb') as f:
        data = f.read()

    # If git or something replaced \n with \r\n, we can try replacing \r\n back to \n.
    # Note: this is a huge hack and might corrupt valid strings, but worth a shot for a broken PDF.
    
    fixed_data = data.replace(b'\r\n', b'\n')
    
    with open(output_path, 'wb') as f:
        f.write(fixed_data)

fix_pdf_crlf(r"D:\project\EVS\Mining_report.pdf", r"D:\project\EVS\Mining_report_fixed.pdf")
print("Saved fixed PDF.")
