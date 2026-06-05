import requests, cv2, numpy as np, time

img = np.zeros((512, 512, 3), dtype=np.uint8)
img[:, :] = [34, 139, 34]
_, encoded = cv2.imencode('.jpg', img)
jpg_bytes = encoded.tobytes()

print("Sending to /predict...")
t0 = time.time()
try:
    r = requests.post("https://olanak-skyinnovators-model.hf.space/check", data=jpg_bytes,
        headers={"Content-Type": "application/octet-stream"},
        timeout=180,
    )
    print(f"Got response in {time.time()-t0:.1f}s")
    print(f"Status: {r.status_code}")
    print(f"Body: {r.text[:300]}")
except Exception as e:
    print(f"FAILED after {time.time()-t0:.1f}s: {type(e).__name__}: {e}")