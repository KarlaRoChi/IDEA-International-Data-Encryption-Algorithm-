# Genera docs/IDEA-presentacion.pdf con todas las diapositivas (PDF vectorial, 16:9).
# Requiere Microsoft Edge y un servidor local en el puerto 8765 que sirva la carpeta
# padre:  python -m http.server 8765 --directory ..
# Usa el modo index.html?export=all, que dibuja las diapositivas una tras otra.
import os, subprocess
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
URL = "http://localhost:8765/IDEA-International-Data-Encryption-Algorithm-/index.html?export=all"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dst = os.path.join(ROOT, "docs", "IDEA-presentacion.pdf")
subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=10000",
                f"--print-to-pdf={dst}", URL], capture_output=True, timeout=180)
print(dst, os.path.getsize(dst))
