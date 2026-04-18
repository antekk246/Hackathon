package main

import (
	"backend/internal/api"
	"backend/internal/domain"
	"backend/internal/handler"
	"fmt"
	"log"
)

func main() {
	fmt.Println("Starting API server...")
	mockRepo := &domain.MockUserRepo{}
	authHandler := handler.NewAuthHandler(mockRepo)
	fmt.Println("managed auth handler")
	r := api.SetupRouter(authHandler)

	log.Println("Server starting on :8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
