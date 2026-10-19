#!/usr/bin/env sh
# Genera vectores de prueba independientes con OpenSSL (proveedor "legacy").
# Uso: sh tools/gen-openssl-vectors.sh 100 > tests/openssl-vectors.json
# Requiere OpenSSL 3.x compilado con IDEA (enable-idea).
N=${1:-100}
echo "["
i=0
while [ $i -lt $N ]; do
  k=$(openssl rand -hex 16); p=$(openssl rand -hex 8)
  # Incluye algunos casos límite con palabras cero (0 ≡ 2^16 en ⊙)
  if [ $i -eq 0 ]; then k=00000000000000000000000000000000; p=0000000000000000; fi
  if [ $i -eq 1 ]; then k=ffffffffffffffffffffffffffffffff; p=ffffffffffffffff; fi
  if [ $i -eq 2 ]; then k=00010000000000000000000000000000; p=0000ffff00000001; fi
  c=$(printf '%s' "$p" | xxd -r -p | openssl enc -idea-ecb -K "$k" -nopad -provider legacy -provider default | xxd -p)
  sep=","; [ $i -eq $((N-1)) ] && sep=""
  echo "  {\"key\":\"$k\",\"plaintext\":\"$p\",\"ciphertext\":\"$c\"}$sep"
  i=$((i+1))
done
echo "]"
