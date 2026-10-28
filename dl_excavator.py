import urllib.request
import ssl

ssl._create_default_https_context = ssl._create_unverified_context
url = "https://upload.wikimedia.org/wikipedia/commons/e/e0/Bagger-288.jpg"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'})

try:
    with urllib.request.urlopen(req) as response:
        with open("public/login-bg.jpg", "wb") as f:
            f.write(response.read())
    print("Download success")
except Exception as e:
    print("Error:", e)
