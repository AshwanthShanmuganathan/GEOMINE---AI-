import urllib.request
import sys

url = "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=2000&auto=format&fit=crop"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req) as response:
        with open("public/login-bg-1.jpg", "wb") as f:
            f.write(response.read())
    print("Download success")
except Exception as e:
    print("Error:", e)
    sys.exit(1)
