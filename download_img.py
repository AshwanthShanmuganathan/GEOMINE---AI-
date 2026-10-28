import urllib.request

url = "https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req) as response:
        with open("public/login-bg.jpg", "wb") as f:
            f.write(response.read())
    print("Download success")
except Exception as e:
    print("Error:", e)
