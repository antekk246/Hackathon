package main

import (
	"backend/internal/api"
	"backend/internal/domain"
	"backend/internal/handler"
	"backend/internal/models" // upewnij się, że ścieżka jest poprawna
	"log"
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	log.Println("Initializing SQLite database...")

	// 1. Połączenie z SQLite (plik hackathon.db powstanie automatycznie)
	db, err := gorm.Open(sqlite.Open("hackathon.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 2. Automatyczna migracja - GORM sam stworzy tabelę users na podstawie modelu
	err = db.AutoMigrate(&models.User{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	oauthConf := &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		Endpoint:     google.Endpoint,
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
	}

	userRepo := domain.NewUserRepository(db)
	authHandler := handler.NewAuthHandler(userRepo, oauthConf)

	// 5. Start serwera
	r := api.SetupRouter(authHandler)
	log.Println("Server starting on :8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
