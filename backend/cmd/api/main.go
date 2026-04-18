package main

import (
	"log"
	"os"
	"time"

	"backend/internal/api"
	"backend/internal/domain"
	"backend/internal/handler"
	"backend/internal/models"

	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from system environment")
	}

	requiredEnvs := []string{"GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URL", "DB_URL"}
	for _, env := range requiredEnvs {
		if os.Getenv(env) == "" {
			log.Fatalf("Fatal error: Environment variable %s is not set!", env)
		}
	}

	db, err := gorm.Open(postgres.Open(os.Getenv("DB_URL")), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.SetMaxIdleConns(10)
		sqlDB.SetMaxOpenConns(100)
		sqlDB.SetConnMaxLifetime(time.Hour)
	}

	log.Println("Connected to PostgreSQL successfully!")

	err = db.AutoMigrate(
		&models.CardType{},
		&models.Card{},
		&models.User{},
		&models.Adventure{},
		&models.Buff{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	oauthConf := &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		Endpoint:     google.Endpoint,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
	}

	userRepo := domain.NewUserRepository(db)
	authHandler := handler.NewAuthHandler(userRepo, oauthConf)

	r := api.SetupRouter(authHandler)

	log.Println("Server starting on :8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
