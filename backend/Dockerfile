# Używamy oficjalnego obrazu Go
FROM golang:1.25-alpine

# Ustawiamy folder roboczy w kontenerze
WORKDIR /app

# Kopiujemy pliki z zależnościami i pobieramy je
COPY go.mod go.sum ./
RUN go mod download

# Kopiujemy resztę kodu
COPY . .

# Kompilujemy aplikację ze wskazaniem na właściwy folder
RUN go build -o main ./cmd/api

# Otwieramy port (zakładając, że serwer działa na 8080)
EXPOSE 8080

# Uruchamiamy aplikację
CMD ["./main"]