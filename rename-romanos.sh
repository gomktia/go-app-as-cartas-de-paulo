#!/bin/bash
cd pdfs-to-rename

# Renomear PDFs em Espanhol
for file in CARTA-A-LOS-ROMANOS-CAPITULO-*.pdf; do
  if [ -f "$file" ]; then
    num=$(echo "$file" | grep -oE '[0-9]+' | head -1)
    num_padded=$(printf "%02d" $num)
    newname="letter-romanos-es-cap-${num_padded}.pdf"
    mv "$file" "$newname"
    echo "✅ ES: $file → $newname"
  fi
done

# Renomear PDFs em Português
for file in CARTA-AOS-ROMANOS-CAPITULO-*.pdf; do
  if [ -f "$file" ]; then
    num=$(echo "$file" | grep -oE '[0-9]+' | head -1)
    num_padded=$(printf "%02d" $num)
    newname="letter-romanos-cap-${num_padded}.pdf"
    mv "$file" "$newname"
    echo "✅ PT: $file → $newname"
  fi
done

echo ""
echo "🎉 Todos os PDFs de Romanos renomeados!"
ls -1 letter-romanos*.pdf | wc -l | xargs echo "Total:"
