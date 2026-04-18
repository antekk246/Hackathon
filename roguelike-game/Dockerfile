# Używamy lekkiego obrazu Node.js
FROM node:20-alpine

# Ustawiamy katalog roboczy w kontenerze
WORKDIR /app

# Kopiujemy pliki z zależnościami
COPY package.json package-lock.json* ./

# Instalujemy zależności
RUN npm install

# Kopiujemy resztę plików projektu
COPY . .

# Uruchamiamy serwer developerski z dostępem z zewnątrz kontenera
CMD ["npm", "run", "dev", "--", "--host"]